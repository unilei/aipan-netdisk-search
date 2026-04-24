import assert from "node:assert/strict";
import test from "node:test";

import {
  buildUserResourceAuditContext,
  evaluateUserResourceForAutoReview,
  isSafeShareUrl,
} from "../../server/services/userResources/autoReview.js";
import {
  buildUserResourceReviewNotification,
} from "../../server/services/userResources/reviewNotifications.js";
import {
  resolveUserResourceAutoReviewAction,
} from "../../server/services/userResources/autoReviewRunner.js";

const buildResource = (overrides = {}) => ({
  id: 100,
  name: "北京中轴线",
  description: "纪录片资源",
  status: "pending",
  type: { id: 1, name: "纪录片", isEnabled: true },
  links: JSON.stringify([{ value: "https://pan.quark.cn/s/abc123" }]),
  ...overrides,
});

test("evaluateUserResourceForAutoReview approves a valid pending resource", async () => {
  const context = buildUserResourceAuditContext();
  const review = await evaluateUserResourceForAutoReview(
    buildResource(),
    context,
    {
      requireReachable: true,
      linkChecker: async () => ({
        status: "reachable",
        reachable: true,
        message: "链接可访问",
      }),
    }
  );

  assert.equal(review.canAutoApprove, true);
  assert.equal(review.shouldReject, false);
  assert.equal(review.needsManualReview, false);
});

test("evaluateUserResourceForAutoReview rejects duplicate titles and links", async () => {
  const resource = buildResource();
  const context = buildUserResourceAuditContext({
    storedResources: [
      {
        id: 1,
        name: "北京中轴线",
        links: JSON.stringify([{ value: "https://pan.quark.cn/s/abc123" }]),
      },
    ],
  });

  const review = await evaluateUserResourceForAutoReview(resource, context);
  const failedCodes = review.checks
    .filter((check) => !check.passed)
    .map((check) => check.code);

  assert.equal(review.canAutoApprove, false);
  assert.equal(review.shouldReject, true);
  assert.ok(failedCodes.includes("title_duplicate"));
  assert.ok(failedCodes.some((code) => code.startsWith("link_duplicate:")));
});

test("evaluateUserResourceForAutoReview sends unknown link checks to manual review", async () => {
  const context = buildUserResourceAuditContext();
  const review = await evaluateUserResourceForAutoReview(
    buildResource(),
    context,
    {
      requireReachable: true,
      linkChecker: async () => ({
        status: "unknown",
        reachable: null,
        message: "目标网盘拒绝自动访问，需要人工复核",
      }),
    }
  );

  assert.equal(review.canAutoApprove, false);
  assert.equal(review.shouldReject, false);
  assert.equal(review.needsManualReview, true);
});

test("isSafeShareUrl only allows supported share hosts", () => {
  assert.equal(
    isSafeShareUrl({
      link: "https://pan.quark.cn/s/abc123",
      service: "QUARK",
    }),
    true
  );
  assert.equal(
    isSafeShareUrl({
      link: "http://127.0.0.1/admin",
      service: "QUARK",
    }),
    false
  );
  assert.equal(
    isSafeShareUrl({
      link: "https://pan.quark.cn.evil.example/s/abc123",
      service: "QUARK",
    }),
    false
  );
});

test("resolveUserResourceAutoReviewAction approves valid resources", () => {
  assert.equal(
    resolveUserResourceAutoReviewAction(
      {
        canAutoApprove: true,
        shouldReject: false,
        needsManualReview: false,
      },
      {
        approveValid: true,
        rejectInvalid: true,
      }
    ),
    "approve"
  );
});

test("resolveUserResourceAutoReviewAction rejects invalid resources when enabled", () => {
  assert.equal(
    resolveUserResourceAutoReviewAction(
      {
        canAutoApprove: false,
        shouldReject: true,
        needsManualReview: false,
      },
      {
        approveValid: true,
        rejectInvalid: true,
      }
    ),
    "reject"
  );
});

test("resolveUserResourceAutoReviewAction skips uncertain resources for manual review", () => {
  assert.equal(
    resolveUserResourceAutoReviewAction(
      {
        canAutoApprove: false,
        shouldReject: false,
        needsManualReview: true,
      },
      {
        approveValid: true,
        rejectInvalid: true,
      }
    ),
    "skip"
  );
});

test("buildUserResourceReviewNotification builds approved messages", () => {
  const notification = buildUserResourceReviewNotification({
    resource: buildResource({ id: 101, name: "北京中轴线" }),
    action: "approved",
  });

  assert.equal(notification.type, "user_resource_review");
  assert.equal(notification.relatedId, 101);
  assert.equal(notification.title, "资源投稿已通过审核");
  assert.match(notification.content, /北京中轴线/);
  assert.match(notification.emailSubject, /资源投稿已通过审核/);
});

test("buildUserResourceReviewNotification includes review reasons for manual review", () => {
  const notification = buildUserResourceReviewNotification({
    resource: buildResource({ id: 102, name: "待复核资源" }),
    action: "skipped",
    review: {
      checks: [
        {
          passed: false,
          severity: "warning",
          message: "目标网盘拒绝自动访问，需要人工复核",
        },
      ],
    },
  });

  assert.equal(notification.title, "资源投稿已进入人工审核");
  assert.match(notification.content, /目标网盘拒绝自动访问/);
  assert.match(notification.emailText, /待复核资源/);
});
