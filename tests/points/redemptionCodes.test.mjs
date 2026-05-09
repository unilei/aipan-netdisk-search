import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRedemptionCodeHash,
  buildRedemptionGrantPlan,
  generateRedemptionCode,
  getRedemptionCodeMask,
  normalizeCampaignInput,
  normalizeGeneratedCodeOptions,
  normalizeRedeemCode,
  redeemCodeForUser,
  resolveRedemptionEligibility,
} from "../../server/services/points/redemptionCodes.mjs";

const NOW = new Date("2026-05-08T08:00:00.000Z");

test("normalizeRedeemCode accepts common human input variations", () => {
  assert.equal(normalizeRedeemCode(" aipan-7k4m 9q2x "), "AIPAN7K4M9Q2X");
});

test("buildRedemptionCodeHash is deterministic and secret-bound", () => {
  const first = buildRedemptionCodeHash("AIPAN7K4M9Q2X", "secret-a");
  const second = buildRedemptionCodeHash("aipan-7k4m-9q2x", "secret-a");
  const third = buildRedemptionCodeHash("AIPAN7K4M9Q2X", "secret-b");

  assert.equal(first, second);
  assert.notEqual(first, third);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test("generateRedemptionCode creates readable chunked codes", () => {
  const code = generateRedemptionCode({
    prefix: "AIPAN",
    randomBytes: Buffer.from("1234567890abcdef1234567890abcdef", "hex"),
  });

  assert.match(code, /^AIPAN-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  assert.equal(normalizeRedeemCode(code).startsWith("AIPAN"), true);
});

test("getRedemptionCodeMask exposes only short prefix and suffix", () => {
  assert.deepEqual(getRedemptionCodeMask("AIPAN-7K4M-9Q2X-H8FD"), {
    codePrefix: "AIPAN",
    codeSuffix: "H8FD",
    maskedCode: "AIPAN...H8FD",
  });
});

test("normalizeGeneratedCodeOptions clamps admin generation input", () => {
  assert.deepEqual(
    normalizeGeneratedCodeOptions({
      quantity: "1200",
      prefix: " ai_pan! ",
      batchName: " Launch ",
      maxRedemptions: "0",
      enabled: false,
    }),
    {
      quantity: 1000,
      prefix: "AIPAN",
      batchName: "Launch",
      maxRedemptions: 1,
      enabled: false,
    },
  );
});

test("normalizeCampaignInput accepts permanent and temporary rewards", () => {
  assert.deepEqual(
    normalizeCampaignInput({
      name: "  Launch gift ",
      description: "  First batch ",
      points: "500",
      rewardMode: "temporary",
      pointsExpiresInMinutes: "1440",
      enabled: false,
      maxRedemptionsPerUser: "2",
    }),
    {
      name: "Launch gift",
      description: "First batch",
      rewardType: "points",
      points: 500,
      pointsExpiresInMinutes: 1440,
      enabled: false,
      startsAt: null,
      endsAt: null,
      maxRedemptionsPerUser: 2,
    },
  );

  assert.equal(
    normalizeCampaignInput({
      name: "Permanent gift",
      points: "100",
      rewardMode: "permanent",
    }).pointsExpiresInMinutes,
    null,
  );
});

test("resolveRedemptionEligibility rejects unavailable codes and campaigns", () => {
  assert.equal(
    resolveRedemptionEligibility({
      code: null,
      now: NOW,
    }).reason,
    "not_found",
  );

  assert.equal(
    resolveRedemptionEligibility({
      code: { enabled: false, campaign: { enabled: true } },
      now: NOW,
    }).reason,
    "code_disabled",
  );

  assert.equal(
    resolveRedemptionEligibility({
      code: {
        enabled: true,
        usedCount: 2,
        maxRedemptions: 2,
        campaign: { enabled: true },
      },
      now: NOW,
    }).reason,
    "code_exhausted",
  );

  assert.equal(
    resolveRedemptionEligibility({
      code: {
        enabled: true,
        usedCount: 0,
        maxRedemptions: 1,
        campaign: { enabled: false },
      },
      now: NOW,
    }).reason,
    "campaign_disabled",
  );
});

test("resolveRedemptionEligibility accepts active campaign and code", () => {
  assert.deepEqual(
    resolveRedemptionEligibility({
      code: {
        enabled: true,
        usedCount: 0,
        maxRedemptions: 10,
        campaign: {
          enabled: true,
          startsAt: new Date("2026-05-07T08:00:00.000Z"),
          endsAt: new Date("2026-05-09T08:00:00.000Z"),
        },
      },
      userCampaignRedemptionCount: 0,
      userCodeRedeemed: false,
      now: NOW,
    }),
    {
      redeemable: true,
      reason: "redeemable",
      message: "",
    },
  );
});

test("buildRedemptionGrantPlan creates permanent point grants", () => {
  assert.deepEqual(
    buildRedemptionGrantPlan({
      campaign: {
        name: "Launch",
        points: 500,
        pointsExpiresInMinutes: null,
      },
      now: NOW,
    }),
    {
      points: 500,
      expiresAt: null,
      isTemporary: false,
      description: "兑换码奖励：Launch",
    },
  );
});

test("buildRedemptionGrantPlan creates temporary point grants", () => {
  const plan = buildRedemptionGrantPlan({
    campaign: {
      name: "Launch",
      points: 500,
      pointsExpiresInMinutes: 60,
    },
    now: NOW,
  });

  assert.equal(plan.points, 500);
  assert.equal(plan.isTemporary, true);
  assert.equal(plan.expiresAt.toISOString(), "2026-05-08T09:00:00.000Z");
});

test("redeemCodeForUser records permanent grant and redemption audit atomically", async () => {
  const previousSecret = process.env.REDEMPTION_CODE_HASH_SECRET;
  process.env.REDEMPTION_CODE_HASH_SECRET = "test-secret";
  const calls = [];
  const campaign = {
    id: 9,
    name: "Launch",
    enabled: true,
    points: 500,
    pointsExpiresInMinutes: null,
    maxRedemptionsPerUser: 1,
  };
  const redemptionCode = {
    id: 17,
    campaignId: campaign.id,
    enabled: true,
    usedCount: 0,
    maxRedemptions: 10,
    campaign,
  };
  const tx = {
    redemptionCode: {
      findUnique: async () => redemptionCode,
      updateMany: async (args) => {
        calls.push(["code.updateMany", args]);
        return { count: 1 };
      },
    },
    redemptionCodeRedemption: {
      findFirst: async () => null,
      count: async () => 0,
      create: async (args) => {
        calls.push(["redemption.create", args]);
        return { id: 31, ...args.data };
      },
    },
    user: {
      update: async (args) => {
        calls.push(["user.update", args]);
        return { points: 1500 };
      },
    },
    pointsHistory: {
      create: async (args) => {
        calls.push(["history.create", args]);
        return { id: 88, ...args.data };
      },
    },
  };
  const client = {
    $transaction: async (handler) => handler(tx),
  };

  try {
    const result = await redeemCodeForUser({
      userId: 12,
      code: "AIPAN-TEST-CODE",
      ip: "127.0.0.1",
      userAgent: "node-test",
      now: NOW,
      client,
      getUserPointsBreakdown: async (userId, options) => {
        assert.equal(userId, 12);
        assert.equal(options.client, tx);
        assert.equal(options.permanentPoints, 1500);
        return {
          permanentPoints: 1500,
          temporaryPoints: 0,
          effectivePoints: 1500,
          nextExpiringAt: null,
        };
      },
    });

    assert.equal(result.granted, true);
    assert.equal(result.points, 500);
    assert.equal(result.totalPoints, 1500);
  } finally {
    if (previousSecret === undefined) {
      delete process.env.REDEMPTION_CODE_HASH_SECRET;
    } else {
      process.env.REDEMPTION_CODE_HASH_SECRET = previousSecret;
    }
  }

  assert.deepEqual(calls.map(([name]) => name), [
    "code.updateMany",
    "user.update",
    "history.create",
    "redemption.create",
  ]);

  const historyCreate = calls.find(([name]) => name === "history.create")[1];
  assert.deepEqual(historyCreate.data, {
    userId: 12,
    points: 500,
    type: "redemption",
    description: "兑换码奖励：Launch",
    relatedId: 9,
    expiresAt: null,
  });

  const redemptionCreate = calls.find(([name]) => name === "redemption.create")[1];
  assert.equal(redemptionCreate.data.pointsHistoryId, 88);
  assert.equal(redemptionCreate.data.userId, 12);
  assert.equal(redemptionCreate.data.campaignId, 9);
  assert.equal(redemptionCreate.data.codeId, 17);
  assert.match(redemptionCreate.data.ipHash, /^[a-f0-9]{32}$/);
  assert.match(redemptionCreate.data.userAgentHash, /^[a-f0-9]{32}$/);
});
