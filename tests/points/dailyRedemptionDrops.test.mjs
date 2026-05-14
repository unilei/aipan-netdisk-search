import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDailyRedemptionGrantPlan,
  getShanghaiDateKey,
  normalizeDailyRedemptionDropInput,
  resolveDailyRedemptionDropClaimState,
  claimDailyRedemptionDropForUser,
} from "../../server/services/points/dailyRedemptionDrops.mjs";

const BEFORE_RELEASE = new Date("2026-05-14T03:59:00.000Z"); // 11:59 Asia/Shanghai
const AFTER_RELEASE = new Date("2026-05-14T04:00:00.000Z"); // 12:00 Asia/Shanghai

const activeDrop = {
  id: 1,
  name: "每日福利",
  enabled: true,
  releaseTime: "12:00",
  timezone: "Asia/Shanghai",
  dailyQuota: 2,
  points: 100,
  pointsExpiresInMinutes: null,
  maxClaimsPerUserPerDay: 1,
  requireEmailVerified: true,
  minimumAccountAgeDays: 1,
};

test("normalizeDailyRedemptionDropInput clamps admin config", () => {
  assert.deepEqual(
    normalizeDailyRedemptionDropInput({
      name: "  每日福利  ",
      description: "  每天中午开放  ",
      enabled: true,
      releaseTime: "7:8",
      dailyQuota: "0",
      points: "500",
      rewardMode: "temporary",
      pointsExpiresInMinutes: "1440",
      maxClaimsPerUserPerDay: "99",
      requireEmailVerified: true,
      minimumAccountAgeDays: "3",
    }),
    {
      name: "每日福利",
      description: "每天中午开放",
      enabled: true,
      releaseTime: "07:08",
      timezone: "Asia/Shanghai",
      dailyQuota: 1,
      points: 500,
      pointsExpiresInMinutes: 1440,
      maxClaimsPerUserPerDay: 10,
      requireEmailVerified: true,
      minimumAccountAgeDays: 3,
    },
  );
});

test("getShanghaiDateKey resolves local day around UTC boundaries", () => {
  assert.equal(getShanghaiDateKey(new Date("2026-05-13T16:00:00.000Z")), "2026-05-14");
  assert.equal(getShanghaiDateKey(new Date("2026-05-14T15:59:59.000Z")), "2026-05-14");
});

test("resolveDailyRedemptionDropClaimState enforces release window and account gates", () => {
  assert.equal(
    resolveDailyRedemptionDropClaimState({
      drop: activeDrop,
      user: {
        id: 8,
        role: "user",
        status: "active",
        isVerified: true,
        createdAt: new Date("2026-05-10T00:00:00.000Z"),
      },
      dayClaimCount: 0,
      userDayClaimCount: 0,
      now: BEFORE_RELEASE,
    }).status,
    "not_released",
  );

  assert.equal(
    resolveDailyRedemptionDropClaimState({
      drop: activeDrop,
      user: {
        id: 8,
        role: "user",
        status: "active",
        isVerified: false,
        createdAt: new Date("2026-05-10T00:00:00.000Z"),
      },
      dayClaimCount: 0,
      userDayClaimCount: 0,
      now: AFTER_RELEASE,
    }).status,
    "email_unverified",
  );
});

test("resolveDailyRedemptionDropClaimState blocks exhausted quota and duplicate daily claims", () => {
  const user = {
    id: 8,
    role: "user",
    status: "active",
    isVerified: true,
    createdAt: new Date("2026-05-10T00:00:00.000Z"),
  };

  assert.equal(
    resolveDailyRedemptionDropClaimState({
      drop: activeDrop,
      user,
      dayClaimCount: 2,
      userDayClaimCount: 0,
      now: AFTER_RELEASE,
    }).status,
    "sold_out",
  );

  assert.equal(
    resolveDailyRedemptionDropClaimState({
      drop: activeDrop,
      user,
      dayClaimCount: 1,
      userDayClaimCount: 1,
      now: AFTER_RELEASE,
    }).status,
    "already_claimed",
  );
});

test("buildDailyRedemptionGrantPlan supports permanent and temporary points", () => {
  assert.deepEqual(
    buildDailyRedemptionGrantPlan({
      drop: { name: "每日福利", points: 100, pointsExpiresInMinutes: null },
      claimDateKey: "2026-05-14",
      now: AFTER_RELEASE,
    }),
    {
      points: 100,
      expiresAt: null,
      isTemporary: false,
      description: "每日福利奖励：每日福利（2026-05-14）",
    },
  );

  assert.equal(
    buildDailyRedemptionGrantPlan({
      drop: { name: "每日福利", points: 100, pointsExpiresInMinutes: 60 },
      claimDateKey: "2026-05-14",
      now: AFTER_RELEASE,
    }).expiresAt.toISOString(),
    "2026-05-14T05:00:00.000Z",
  );
});

test("claimDailyRedemptionDropForUser grants permanent points atomically", async () => {
  const calls = [];
  const user = {
    id: 12,
    role: "user",
    status: "active",
    isVerified: true,
    createdAt: new Date("2026-05-10T00:00:00.000Z"),
    points: 900,
  };
  const tx = {
    dailyRedemptionDrop: {
      findFirst: async () => activeDrop,
    },
    user: {
      findUnique: async () => user,
      update: async (args) => {
        calls.push(["user.update", args]);
        return { points: 1000 };
      },
    },
    dailyRedemptionDropClaim: {
      count: async (args) => {
        if (args.where.userId) return 0;
        return 0;
      },
      create: async (args) => {
        calls.push(["claim.create", args]);
        return { id: 44, ...args.data };
      },
    },
    pointsHistory: {
      create: async (args) => {
        calls.push(["history.create", args]);
        return { id: 77, ...args.data };
      },
    },
  };

  const client = {
    $transaction: async (handler) => handler(tx),
  };

  const result = await claimDailyRedemptionDropForUser({
    userId: 12,
    now: AFTER_RELEASE,
    ip: "127.0.0.1",
    userAgent: "node-test",
    client,
    getUserPointsBreakdown: async (userId, options) => {
      assert.equal(userId, 12);
      assert.equal(options.client, tx);
      assert.equal(options.permanentPoints, 1000);
      return {
        permanentPoints: 1000,
        temporaryPoints: 0,
        effectivePoints: 1000,
        nextExpiringAt: null,
      };
    },
  });

  assert.equal(result.claimed, true);
  assert.equal(result.points, 100);
  assert.deepEqual(calls.map(([name]) => name), [
    "user.update",
    "history.create",
    "claim.create",
  ]);

  const historyCreate = calls.find(([name]) => name === "history.create")[1];
  assert.equal(historyCreate.data.type, "daily_redemption_drop");
  assert.equal(historyCreate.data.relatedId, 1);

  const claimCreate = calls.find(([name]) => name === "claim.create")[1];
  assert.equal(claimCreate.data.claimDate.toISOString(), "2026-05-14T00:00:00.000Z");
  assert.equal(claimCreate.data.claimNo, 1);
  assert.equal(claimCreate.data.pointsHistoryId, 77);
  assert.match(claimCreate.data.ipHash, /^[a-f0-9]{32}$/);
});
