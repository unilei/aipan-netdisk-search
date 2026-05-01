import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTransferFingerprintFromShareDetail,
  calculateEffectivePoints,
  decoratePointsHistoryRecords,
  getCheckInBonusReward,
  getNextCheckInReward,
  normalizeTransferRewardConfig,
  resolveTransferRewardDecision,
} from "../../server/services/points/pointsLedger.mjs";
import {
  FEATURE_ACCESS_KEYS,
  evaluateFeatureAccessPolicy,
  normalizeFeatureAccessConfig,
} from "../../server/services/accessControl/featureAccessPolicy.mjs";

const NOW = new Date("2026-05-01T08:00:00.000Z");

test("getCheckInBonusReward grants milestone rewards only on milestone days", () => {
  assert.deepEqual(getCheckInBonusReward(1), {
    points: 0,
    description: "",
  });
  assert.deepEqual(getCheckInBonusReward(3), {
    points: 5,
    description: "连续签到3天奖励",
  });
  assert.deepEqual(getCheckInBonusReward(7), {
    points: 15,
    description: "连续签到7天奖励",
  });
  assert.deepEqual(getCheckInBonusReward(15), {
    points: 30,
    description: "连续签到15天奖励",
  });
  assert.deepEqual(getCheckInBonusReward(30), {
    points: 50,
    description: "连续签到30天奖励",
  });
  assert.deepEqual(getCheckInBonusReward(31), {
    points: 0,
    description: "",
  });
  assert.deepEqual(getCheckInBonusReward(60), {
    points: 50,
    description: "连续签到60天奖励",
  });
});

test("getNextCheckInReward points users to the next milestone", () => {
  assert.deepEqual(getNextCheckInReward(0), {
    days: 3,
    points: 5,
    description: "连续签到3天可获得额外5积分",
  });
  assert.deepEqual(getNextCheckInReward(30), {
    days: 60,
    points: 50,
    description: "连续签到60天可获得额外50积分",
  });
  assert.deepEqual(getNextCheckInReward(212), {
    days: 240,
    points: 50,
    description: "连续签到240天可获得额外50积分",
  });
});

test("calculateEffectivePoints counts permanent points", () => {
  assert.deepEqual(
    calculateEffectivePoints({
      permanentPoints: 320,
      temporaryEntries: [],
      now: NOW,
    }),
    {
      permanentPoints: 320,
      temporaryPoints: 0,
      effectivePoints: 320,
      nextExpiringAt: null,
    },
  );
});

test("calculateEffectivePoints counts only unexpired transfer points", () => {
  assert.deepEqual(
    calculateEffectivePoints({
      permanentPoints: 100,
      temporaryEntries: [
        { points: 1000, expiresAt: new Date("2026-05-01T12:00:00.000Z") },
        { points: 500, expiresAt: new Date("2026-05-01T07:59:59.000Z") },
      ],
      now: NOW,
    }),
    {
      permanentPoints: 100,
      temporaryPoints: 1000,
      effectivePoints: 1100,
      nextExpiringAt: new Date("2026-05-01T12:00:00.000Z"),
    },
  );
});

test("calculateEffectivePoints stacks different unexpired transfer grants", () => {
  assert.deepEqual(
    calculateEffectivePoints({
      permanentPoints: 0,
      temporaryEntries: [
        { points: 1000, expiresAt: new Date("2026-05-01T09:00:00.000Z") },
        { points: 1000, expiresAt: new Date("2026-05-01T10:00:00.000Z") },
      ],
      now: NOW,
    }),
    {
      permanentPoints: 0,
      temporaryPoints: 2000,
      effectivePoints: 2000,
      nextExpiringAt: new Date("2026-05-01T09:00:00.000Z"),
    },
  );
});

test("resolveTransferRewardDecision grants once for a new transfer share", () => {
  const decision = resolveTransferRewardDecision({
    existingGrant: null,
    config: normalizeTransferRewardConfig({}),
    now: NOW,
  });

  assert.equal(decision.granted, true);
  assert.equal(decision.alreadyGranted, false);
  assert.equal(decision.points, 1000);
  assert.equal(decision.expiresAt.toISOString(), "2026-05-02T08:00:00.000Z");
});

test("resolveTransferRewardDecision does not grant duplicate transfer shares", () => {
  const decision = resolveTransferRewardDecision({
    existingGrant: { id: 1 },
    config: normalizeTransferRewardConfig({}),
    now: NOW,
  });

  assert.equal(decision.granted, false);
  assert.equal(decision.alreadyGranted, true);
  assert.equal(decision.points, 0);
  assert.equal(decision.expiresAt, null);
});

test("buildTransferFingerprintFromShareDetail ignores generated share ids", () => {
  const firstFingerprint = buildTransferFingerprintFromShareDetail({
    data: {
      share_id: "first-share",
      list: [
        { fid: "transferred-folder-1", file_name: "Movie", dir: true },
        { fid: "transferred-file-1", file_name: "movie.mkv", size: 123 },
      ],
    },
  });
  const secondFingerprint = buildTransferFingerprintFromShareDetail({
    data: {
      share_id: "second-share",
      list: [
        { fid: "transferred-file-1", file_name: "movie.mkv", size: 123 },
        { fid: "transferred-folder-1", file_name: "Movie", dir: true },
      ],
    },
  });

  assert.equal(firstFingerprint, secondFingerprint);
});

test("buildTransferFingerprintFromShareDetail changes for a new transferred copy", () => {
  const firstFingerprint = buildTransferFingerprintFromShareDetail({
    data: {
      share_id: "first-share",
      list: [{ fid: "first-transfer-copy", file_name: "movie.mkv", size: 123 }],
    },
  });
  const secondFingerprint = buildTransferFingerprintFromShareDetail({
    data: {
      share_id: "second-share",
      list: [{ fid: "second-transfer-copy", file_name: "movie.mkv", size: 123 }],
    },
  });

  assert.notEqual(firstFingerprint, secondFingerprint);
});

test("buildTransferFingerprintFromShareDetail falls back to content when stable ids are unavailable", () => {
  const firstFingerprint = buildTransferFingerprintFromShareDetail({
    data: {
      share_id: "first-share",
      list: [{ file_name: "movie.mkv", size: 123 }],
    },
  });
  const secondFingerprint = buildTransferFingerprintFromShareDetail({
    data: {
      share_id: "second-share",
      list: [{ file_name: "movie.mkv", size: 123 }],
    },
  });

  assert.equal(firstFingerprint, secondFingerprint);
});

test("decoratePointsHistoryRecords marks temporary and expired records", () => {
  const records = decoratePointsHistoryRecords(
    [
      { id: 1, points: 10, expiresAt: null },
      { id: 2, points: 1000, expiresAt: new Date("2026-05-01T09:00:00.000Z") },
      { id: 3, points: 1000, expiresAt: new Date("2026-05-01T07:00:00.000Z") },
    ],
    NOW,
  );

  assert.deepEqual(
    records.map((record) => ({
      id: record.id,
      isTemporary: record.isTemporary,
      isExpired: record.isExpired,
    })),
    [
      { id: 1, isTemporary: false, isExpired: false },
      { id: 2, isTemporary: true, isExpired: false },
      { id: 3, isTemporary: true, isExpired: true },
    ],
  );
});

test("effective points satisfy feature access threshold", () => {
  const breakdown = calculateEffectivePoints({
    permanentPoints: 80,
    temporaryEntries: [
      { points: 40, expiresAt: new Date("2026-05-01T09:00:00.000Z") },
    ],
    now: NOW,
  });
  const decision = evaluateFeatureAccessPolicy({
    config: normalizeFeatureAccessConfig({
      requireLogin: true,
      minPoints: 100,
    }),
    featureKeys: [FEATURE_ACCESS_KEYS.netdiskSearch],
    token: "valid-token",
    decoded: { userId: 12, role: "user" },
    user: {
      id: 12,
      role: "user",
      points: breakdown.effectivePoints,
    },
    userLoaded: true,
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.currentPoints, 120);
});
