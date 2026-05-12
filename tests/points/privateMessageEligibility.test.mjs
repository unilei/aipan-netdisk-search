import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_PRIVATE_MESSAGE_MINIMUM_POINTS,
  normalizePrivateMessageConfig,
  resolvePrivateMessageStartEligibility,
} from "../../server/services/points/privateMessageEligibility.mjs";

test("private message config defaults to a 10000 point threshold", () => {
  assert.equal(DEFAULT_PRIVATE_MESSAGE_MINIMUM_POINTS, 10000);
  assert.deepEqual(normalizePrivateMessageConfig({}), {
    privateMessageMinimumPoints: 10000,
    adminBypass: true,
  });
});

test("private message config normalizes unsafe input", () => {
  assert.deepEqual(
    normalizePrivateMessageConfig({
      privateMessageMinimumPoints: "12000.9",
      adminBypass: false,
    }),
    {
      privateMessageMinimumPoints: 12000,
      adminBypass: false,
    },
  );

  assert.deepEqual(
    normalizePrivateMessageConfig({
      privateMessageMinimumPoints: -1,
      adminBypass: "yes",
    }),
    {
      privateMessageMinimumPoints: 10000,
      adminBypass: true,
    },
  );
});

test("private message eligibility uses effective points without spending them", () => {
  assert.deepEqual(
    resolvePrivateMessageStartEligibility({
      user: { role: "user" },
      pointsBreakdown: { effectivePoints: 9999 },
      config: {},
    }),
    {
      allowed: false,
      reason: "insufficient_points",
      requiredPoints: 10000,
      currentPoints: 9999,
      message: "发起私信需要当前积分达到 10000，回复已有私信不受限制。",
    },
  );

  assert.deepEqual(
    resolvePrivateMessageStartEligibility({
      user: { role: "user" },
      pointsBreakdown: { effectivePoints: 10000 },
      config: {},
    }),
    {
      allowed: true,
      reason: "eligible",
      requiredPoints: 10000,
      currentPoints: 10000,
      message: "已达到发起私信所需积分，不会扣除积分。",
    },
  );
});

test("admin bypass allows support users to start private messages", () => {
  assert.deepEqual(
    resolvePrivateMessageStartEligibility({
      user: { role: "admin" },
      pointsBreakdown: { effectivePoints: 0 },
      config: {},
    }),
    {
      allowed: true,
      reason: "admin_bypass",
      requiredPoints: 10000,
      currentPoints: 0,
      message: "管理员可直接发起私信。",
    },
  );
});
