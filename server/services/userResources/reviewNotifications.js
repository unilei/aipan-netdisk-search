import { createHash } from "node:crypto";

const DEFAULT_REVIEW_EMAIL_THROTTLE_PREFIX =
  "aipan:user-resource-review-email";
const DEFAULT_REVIEW_EMAIL_THROTTLE_SECONDS = 86400;
const MIN_REVIEW_EMAIL_THROTTLE_SECONDS = 60;
const MAX_REVIEW_EMAIL_THROTTLE_SECONDS = 604800;

const STATUS_MESSAGES = {
  approved: {
    title: "资源投稿已通过审核",
    summary: "你的资源投稿已自动审核通过，并已进入站内搜索。",
  },
  rejected: {
    title: "资源投稿未通过自动审核",
    summary: "你的资源投稿未通过自动审核，请根据原因修改后重新提交。",
  },
  skipped: {
    title: "资源投稿已进入人工审核",
    summary: "你的资源投稿已完成自动预审，但仍需要管理员人工复核。",
  },
  failed: {
    title: "资源投稿自动审核失败",
    summary: "你的资源投稿自动审核时遇到系统问题，已保留为待审核状态。",
  },
};

const EMAIL_THROTTLE_NOTICE =
  "如果你一次提交多个资源，邮件不会逐条发送；完整审核结果请到通知中心查看。";

const reviewEmailMemoryThrottle = new Map();
let reviewEmailMemoryThrottleOps = 0;
const REVIEW_EMAIL_MEMORY_THROTTLE_GC_INTERVAL = 100;
let redisThrottleLoggedUnavailable = false;

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeAction = (action) =>
  STATUS_MESSAGES[action] ? action : "skipped";

const parseBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const parseIntOption = (value, fallback, min, max) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
};

const hashEmail = (email) =>
  createHash("sha256").update(email).digest("hex").slice(0, 32);

const logRedisThrottleUnavailable = (error) => {
  if (redisThrottleLoggedUnavailable) {
    return;
  }

  redisThrottleLoggedUnavailable = true;
  console.warn("用户资源审核邮件 Redis 限流不可用，降级为进程内限流:", error);
};

const getResourceManageUrl = (siteUrl) => {
  const normalizedSiteUrl = String(siteUrl || "").trim().replace(/\/+$/, "");
  return normalizedSiteUrl ? `${normalizedSiteUrl}/user/resources/list` : "";
};

export function getUserResourceReviewEmailThrottleOptions(env = process.env) {
  return {
    enabled: parseBoolean(env.USER_RESOURCE_REVIEW_EMAIL_THROTTLE_ENABLED, true),
    windowSeconds: parseIntOption(
      env.USER_RESOURCE_REVIEW_EMAIL_THROTTLE_SECONDS,
      DEFAULT_REVIEW_EMAIL_THROTTLE_SECONDS,
      MIN_REVIEW_EMAIL_THROTTLE_SECONDS,
      MAX_REVIEW_EMAIL_THROTTLE_SECONDS
    ),
    keyPrefix:
      String(env.USER_RESOURCE_REVIEW_EMAIL_THROTTLE_PREFIX || "").trim() ||
      DEFAULT_REVIEW_EMAIL_THROTTLE_PREFIX,
  };
}

export function normalizeUserResourceReviewEmailIdentity(creator = {}) {
  const userId = Number.parseInt(String(creator.id || ""), 10);
  const email = String(creator.email || "").trim().toLowerCase();

  if (!Number.isInteger(userId) || userId <= 0 || !email) {
    return null;
  }

  return {
    userId,
    email,
    emailHash: hashEmail(email),
  };
}

export function buildUserResourceReviewEmailThrottleKey(
  creator,
  options = {}
) {
  const identity = normalizeUserResourceReviewEmailIdentity(creator);
  if (!identity) {
    return "";
  }

  const keyPrefix =
    String(options.keyPrefix || "").trim() ||
    DEFAULT_REVIEW_EMAIL_THROTTLE_PREFIX;

  return `${keyPrefix}:${identity.userId}:${identity.emailHash}`;
}

const evictExpiredMemoryThrottleEntries = () => {
  reviewEmailMemoryThrottleOps += 1;
  if (reviewEmailMemoryThrottleOps < REVIEW_EMAIL_MEMORY_THROTTLE_GC_INTERVAL) {
    return;
  }

  reviewEmailMemoryThrottleOps = 0;
  const now = Date.now();
  for (const [k, v] of reviewEmailMemoryThrottle) {
    if (v.expiresAt <= now) {
      reviewEmailMemoryThrottle.delete(k);
    }
  }
};

const reserveMemoryReviewEmailSlot = (key, windowSeconds) => {
  evictExpiredMemoryThrottleEntries();

  const now = Date.now();
  const existing = reviewEmailMemoryThrottle.get(key);

  if (existing && existing.expiresAt > now) {
    return {
      allowed: false,
      backend: "memory",
      ttlSeconds: Math.max(Math.ceil((existing.expiresAt - now) / 1000), 1),
    };
  }

  reviewEmailMemoryThrottle.set(key, {
    expiresAt: now + windowSeconds * 1000,
  });

  return {
    allowed: true,
    backend: "memory",
    key,
  };
};

async function getRedisClient() {
  const redisModule = await import("~/server/utils/redis");
  return redisModule.getRedisClient();
}

async function reserveUserResourceReviewEmailSlot(creator, options = {}) {
  const throttleOptions = getUserResourceReviewEmailThrottleOptions();
  const resolvedOptions = {
    ...throttleOptions,
    enabled:
      options.emailThrottleEnabled === undefined
        ? throttleOptions.enabled
        : Boolean(options.emailThrottleEnabled),
    windowSeconds: parseIntOption(
      options.emailThrottleSeconds ?? throttleOptions.windowSeconds,
      throttleOptions.windowSeconds,
      MIN_REVIEW_EMAIL_THROTTLE_SECONDS,
      MAX_REVIEW_EMAIL_THROTTLE_SECONDS
    ),
  };

  if (!resolvedOptions.enabled) {
    return {
      allowed: true,
      backend: "disabled",
    };
  }

  const key = buildUserResourceReviewEmailThrottleKey(
    creator,
    resolvedOptions
  );
  if (!key) {
    return {
      allowed: true,
      backend: "invalid_identity",
    };
  }

  try {
    const client = await getRedisClient();
    if (client) {
      const result = await client.set(key, "1", {
        NX: true,
        EX: resolvedOptions.windowSeconds,
      });

      if (result === "OK") {
        return {
          allowed: true,
          backend: "redis",
          key,
        };
      }

      const ttlSeconds = await client.ttl(key).catch(() => null);
      return {
        allowed: false,
        backend: "redis",
        key,
        ttlSeconds: ttlSeconds && ttlSeconds > 0 ? ttlSeconds : null,
      };
    }
  } catch (error) {
    logRedisThrottleUnavailable(error);
  }

  return {
    ...reserveMemoryReviewEmailSlot(key, resolvedOptions.windowSeconds),
    key,
  };
}

async function releaseUserResourceReviewEmailSlot(reservation) {
  if (!reservation?.allowed || !reservation.key) {
    return;
  }

  if (reservation.backend === "redis") {
    try {
      const client = await getRedisClient();
      await client?.del(reservation.key);
    } catch (error) {
      logRedisThrottleUnavailable(error);
    }
    return;
  }

  if (reservation.backend === "memory") {
    reviewEmailMemoryThrottle.delete(reservation.key);
  }
}

export function collectUserResourceReviewReasons(review = {}, error = "") {
  const reasons = [];

  for (const check of review.checks || []) {
    if (!check.passed && check.message) {
      reasons.push(check.message);
    }
  }

  if (error) {
    reasons.push(error);
  }

  return [...new Set(reasons)].slice(0, 5);
}

export function buildUserResourceReviewNotification({
  resource,
  action,
  review,
  error,
  siteUrl,
}) {
  const normalizedAction = normalizeAction(action);
  const statusMessage = STATUS_MESSAGES[normalizedAction];
  const reasons = collectUserResourceReviewReasons(review, error);
  const resourceName = resource?.name || "未命名资源";
  const manageUrl = getResourceManageUrl(siteUrl);
  const reasonText = reasons.length
    ? `处理原因：${reasons.join("；")}`
    : "";
  const content = [
    `${statusMessage.summary}`,
    `资源名称：${resourceName}`,
    reasonText,
  ]
    .filter(Boolean)
    .join("\n");
  const emailText = [
    statusMessage.title,
    "",
    statusMessage.summary,
    `资源名称：${resourceName}`,
    reasonText,
    EMAIL_THROTTLE_NOTICE,
    manageUrl ? `查看资源：${manageUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const reasonHtml = reasons.length
    ? `<ul>${reasons
        .map((reason) => `<li>${escapeHtml(reason)}</li>`)
        .join("")}</ul>`
    : "";
  const emailHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.7;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 16px;">${escapeHtml(statusMessage.title)}</h2>
      <p>${escapeHtml(statusMessage.summary)}</p>
      <p><strong>资源名称：</strong>${escapeHtml(resourceName)}</p>
      ${reasonHtml}
      <p style="color:#6b7280;">${escapeHtml(EMAIL_THROTTLE_NOTICE)}</p>
      ${
        manageUrl
          ? `<p><a href="${escapeHtml(manageUrl)}" style="color:#2563eb;">查看我的资源</a></p>`
          : ""
      }
    </div>
  `;

  return {
    type: "user_resource_review",
    title: statusMessage.title,
    content,
    relatedId: resource?.id || null,
    emailSubject: statusMessage.title,
    emailHtml,
    emailText,
  };
}

export async function notifyUserResourceReviewResult(
  resource,
  result,
  options = {}
) {
  const creator = resource?.creator;
  if (!creator?.id) {
    return {
      notificationCreated: false,
      emailSent: false,
      emailSkipped: true,
      reason: "资源缺少投稿人信息",
    };
  }

  const [{ default: prisma }, emailService] = await Promise.all([
    import("~/lib/prisma"),
    import("~/server/services/email/resend"),
  ]);

  const emailConfig = await emailService.getEmailServiceConfig();
  const notificationPayload = buildUserResourceReviewNotification({
    resource,
    action: result.action,
    review: result,
    error: result.error,
    siteUrl: emailConfig.siteUrl,
  });

  await prisma.notification.create({
    data: {
      userId: creator.id,
      type: notificationPayload.type,
      title: notificationPayload.title,
      content: notificationPayload.content,
      relatedId: notificationPayload.relatedId,
    },
  });

  if (options.emailEnabled === false || !creator.email || !emailConfig.enabled) {
    return {
      notificationCreated: true,
      emailSent: false,
      emailSkipped: true,
    };
  }

  const emailReservation = await reserveUserResourceReviewEmailSlot(
    creator,
    options
  );
  if (!emailReservation.allowed) {
    return {
      notificationCreated: true,
      emailSent: false,
      emailSkipped: true,
      emailThrottled: true,
      emailThrottleBackend: emailReservation.backend,
      emailThrottleTtlSeconds: emailReservation.ttlSeconds,
    };
  }

  try {
    await emailService.sendEmailMessage({
      to: creator.email,
      subject: notificationPayload.emailSubject,
      html: notificationPayload.emailHtml,
      text: notificationPayload.emailText,
    });

    return {
      notificationCreated: true,
      emailSent: true,
      emailSkipped: false,
      emailThrottleBackend: emailReservation.backend,
    };
  } catch (error) {
    await releaseUserResourceReviewEmailSlot(emailReservation);

    console.error("发送用户资源审核邮件失败:", {
      resourceId: resource.id,
      userId: creator.id,
      error,
    });

    return {
      notificationCreated: true,
      emailSent: false,
      emailSkipped: false,
      emailError: error?.statusMessage || error?.message || "邮件发送失败",
    };
  }
}
