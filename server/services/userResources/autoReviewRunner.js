import {
  buildUserResourceAuditContext,
  evaluateUserResourceForAutoReview,
} from "./autoReview.js";
import { notifyUserResourceReviewResult } from "./reviewNotifications.js";

export const includeUserResourceReviewRelations = {
  creator: {
    select: {
      id: true,
      username: true,
      email: true,
    },
  },
  type: true,
};

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

const toResultAction = (action) => {
  if (action === "approve") {
    return "approved";
  }
  if (action === "reject") {
    return "rejected";
  }
  return "skipped";
};

export function getUserResourceAutoReviewOptions(env = process.env) {
  return {
    enabled: parseBoolean(env.USER_RESOURCE_AUTO_REVIEW_ENABLED, true),
    approveValid: parseBoolean(env.USER_RESOURCE_AUTO_REVIEW_APPROVE_VALID, true),
    rejectInvalid: parseBoolean(env.USER_RESOURCE_AUTO_REVIEW_REJECT_INVALID, true),
    requireReachable: parseBoolean(
      env.USER_RESOURCE_AUTO_REVIEW_REQUIRE_REACHABLE,
      false
    ),
    notifyUser: parseBoolean(env.USER_RESOURCE_AUTO_REVIEW_NOTIFY_USER, true),
    emailEnabled: parseBoolean(env.USER_RESOURCE_AUTO_REVIEW_NOTIFY_EMAIL, true),
    maxLinks: parseIntOption(env.USER_RESOURCE_AUTO_REVIEW_MAX_LINKS, 5, 1, 20),
  };
}

export function resolveUserResourceAutoReviewAction(review, options = {}) {
  const approveValid = options.approveValid !== false;
  const rejectInvalid = Boolean(options.rejectInvalid);

  if (review.canAutoApprove && approveValid) {
    return "approve";
  }

  if (review.shouldReject && rejectInvalid) {
    return "reject";
  }

  return "skip";
}

export async function buildPendingUserResourceAuditContext() {
  const { default: prisma } = await import("~/lib/prisma");
  const [storedResources, publishedUserResources, pendingUserResources] =
    await Promise.all([
      prisma.resource.findMany({
        select: {
          id: true,
          name: true,
          links: true,
        },
      }),
      prisma.userResource.findMany({
        where: { status: "published" },
        select: {
          id: true,
          name: true,
          links: true,
        },
      }),
      prisma.userResource.findMany({
        where: { status: "pending" },
        select: {
          id: true,
          name: true,
          links: true,
        },
      }),
    ]);

  return buildUserResourceAuditContext({
    storedResources,
    publishedUserResources,
    pendingUserResources,
  });
}

export async function evaluatePendingUserResource(resource, options = {}) {
  const context =
    options.context || (await buildPendingUserResourceAuditContext());

  return evaluateUserResourceForAutoReview(resource, context, {
    requireReachable: Boolean(options.requireReachable),
    maxLinks: options.maxLinks,
    timeoutMs: options.timeoutMs,
    linkChecker: options.linkChecker,
  });
}

export async function autoReviewUserResource(resourceId, options = {}) {
  const { default: prisma } = await import("~/lib/prisma");
  const {
    removePublishedUserResource,
    syncPublishedUserResource,
  } = await import("~/server/services/search/elasticsearchClient.js");

  const runtimeOptions = {
    ...getUserResourceAutoReviewOptions(),
    ...options,
  };

  if (!runtimeOptions.enabled) {
    return {
      resourceId,
      action: "disabled",
      skipped: true,
      error: "",
    };
  }

  let resource =
    runtimeOptions.resource ||
    (await prisma.userResource.findUnique({
      where: { id: Number(resourceId) },
      include: includeUserResourceReviewRelations,
    }));

  if (!resource) {
    return {
      resourceId,
      action: "failed",
      error: "资源不存在",
    };
  }

  if (resource.status !== "pending") {
    return {
      resourceId: resource.id,
      name: resource.name,
      status: resource.status,
      action: "skipped",
      skipped: true,
      error: "资源不是待审核状态",
    };
  }

  const review = await evaluatePendingUserResource(resource, runtimeOptions);
  const action = resolveUserResourceAutoReviewAction(review, runtimeOptions);
  const result = {
    ...review,
    action: toResultAction(action),
  };

  try {
    if (action === "approve") {
      const updatedResource = await prisma.userResource.update({
        where: { id: resource.id },
        data: { status: "published" },
        include: includeUserResourceReviewRelations,
      });

      try {
        await syncPublishedUserResource(updatedResource);
      } catch (syncError) {
        await prisma.userResource.update({
          where: { id: resource.id },
          data: { status: "pending" },
        });
        await removePublishedUserResource(resource.id).catch(() => {});
        throw syncError;
      }

      resource = updatedResource;
    } else if (action === "reject") {
      resource = await prisma.userResource.update({
        where: { id: resource.id },
        data: { status: "rejected" },
        include: includeUserResourceReviewRelations,
      });
    }
  } catch (error) {
    console.error("自动审核用户资源失败:", {
      resourceId: resource.id,
      error,
    });

    result.action = "failed";
    result.error = error?.message || "自动审核失败";
  }

  if (runtimeOptions.notifyUser) {
    try {
      result.notification = await notifyUserResourceReviewResult(resource, result, {
        emailEnabled: runtimeOptions.emailEnabled,
      });
    } catch (notificationError) {
      console.error("发送用户资源审核通知失败:", {
        resourceId: resource.id,
        error: notificationError,
      });
      result.notification = {
        notificationCreated: false,
        emailSent: false,
        emailSkipped: true,
        error: notificationError?.message || "通知发送失败",
      };
    }
  }

  return result;
}

export async function autoReviewPendingUserResources(options = {}) {
  const { default: prisma } = await import("~/lib/prisma");
  const runtimeOptions = {
    ...getUserResourceAutoReviewOptions(),
    ...options,
  };
  const limit = parseIntOption(runtimeOptions.limit, 20, 1, 100);
  const pendingResources = await prisma.userResource.findMany({
    where: { status: "pending" },
    include: includeUserResourceReviewRelations,
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  const context = await buildPendingUserResourceAuditContext();
  const results = [];
  let approved = 0;
  let rejected = 0;
  let skipped = 0;
  let failed = 0;

  for (const resource of pendingResources) {
    if (runtimeOptions.dryRun) {
      const review = await evaluatePendingUserResource(resource, {
        ...runtimeOptions,
        context,
      });
      const action = resolveUserResourceAutoReviewAction(review, runtimeOptions);
      const result = {
        ...review,
        action:
          action === "approve"
            ? "would_approve"
            : action === "reject"
              ? "would_reject"
              : "would_skip",
      };

      results.push(result);
      if (result.action === "would_approve") {
        approved += 1;
      } else if (result.action === "would_reject") {
        rejected += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    const result = await autoReviewUserResource(resource.id, {
      ...runtimeOptions,
      resource,
      context,
    });

    results.push(result);
    if (result.action === "approved") {
      approved += 1;
    } else if (result.action === "rejected") {
      rejected += 1;
    } else if (result.action === "failed") {
      failed += 1;
    } else {
      skipped += 1;
    }
  }

  return {
    dryRun: Boolean(runtimeOptions.dryRun),
    options: {
      limit,
      approveValid: runtimeOptions.approveValid !== false,
      rejectInvalid: Boolean(runtimeOptions.rejectInvalid),
      requireReachable: Boolean(runtimeOptions.requireReachable),
      notifyUser: Boolean(runtimeOptions.notifyUser),
    },
    checked: pendingResources.length,
    approved,
    rejected,
    skipped,
    failed,
    results,
  };
}

export function scheduleUserResourceAutoReview(resourceId, options = {}) {
  const runtimeOptions = {
    ...getUserResourceAutoReviewOptions(),
    ...options,
  };

  if (!runtimeOptions.enabled) {
    return false;
  }

  const run = () => {
    autoReviewUserResource(resourceId, runtimeOptions).catch((error) => {
      console.error("调度用户资源自动审核失败:", {
        resourceId,
        error,
      });
    });
  };

  if (typeof setImmediate === "function") {
    setImmediate(run);
  } else {
    Promise.resolve().then(run);
  }

  return true;
}
