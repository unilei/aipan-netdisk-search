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

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeAction = (action) =>
  STATUS_MESSAGES[action] ? action : "skipped";

const getResourceManageUrl = (siteUrl) => {
  const normalizedSiteUrl = String(siteUrl || "").trim().replace(/\/+$/, "");
  return normalizedSiteUrl ? `${normalizedSiteUrl}/user/resources/list` : "";
};

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
    };
  } catch (error) {
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
