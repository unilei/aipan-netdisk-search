import assert from "node:assert/strict";
import test from "node:test";

import {
  buildUserResourceAuditContext,
  evaluateUserResourceForAutoReview,
  isSafeShareUrl,
} from "../../server/services/userResources/autoReview.js";

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
