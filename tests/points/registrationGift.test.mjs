import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_REGISTRATION_GIFT_CONFIG,
  REGISTRATION_GIFT_CONFIG_KEY,
  REGISTRATION_GIFT_SOURCE,
  grantRegistrationGiftForUser,
  normalizeRegistrationGiftConfig,
  resolveRegistrationGiftClaimState,
  saveStoredRegistrationGiftConfig,
} from "../../server/services/points/registrationGift.mjs";

const NOW = new Date("2026-05-13T08:00:00.000Z");

test("registration gift config defaults to 1000 temporary points for 24 hours", () => {
  assert.equal(REGISTRATION_GIFT_CONFIG_KEY, "registration_gift_config");
  assert.deepEqual(DEFAULT_REGISTRATION_GIFT_CONFIG, {
    enabled: true,
    points: 1000,
    durationMinutes: 1440,
    autoGrantNewUsers: true,
    legacyClaimEnabled: true,
  });
  assert.deepEqual(normalizeRegistrationGiftConfig({}), DEFAULT_REGISTRATION_GIFT_CONFIG);
});

test("registration gift config normalizes unsafe admin input", () => {
  assert.deepEqual(
    normalizeRegistrationGiftConfig({
      enabled: false,
      points: "2500.9",
      durationMinutes: "60.9",
      autoGrantNewUsers: false,
      legacyClaimEnabled: false,
    }),
    {
      enabled: false,
      points: 2500,
      durationMinutes: 60,
      autoGrantNewUsers: false,
      legacyClaimEnabled: false,
    },
  );

  assert.deepEqual(
    normalizeRegistrationGiftConfig({
      points: -1,
      durationMinutes: 0,
      autoGrantNewUsers: "yes",
      legacyClaimEnabled: "yes",
    }),
    DEFAULT_REGISTRATION_GIFT_CONFIG,
  );
});

test("registration gift claim state respects global and legacy switches", () => {
  assert.deepEqual(
    resolveRegistrationGiftClaimState({
      user: { role: "user" },
      grant: null,
      config: { enabled: false },
      source: REGISTRATION_GIFT_SOURCE.legacyClaim,
    }),
    {
      claimable: false,
      status: "disabled",
      message: "注册礼包已关闭",
    },
  );

  assert.deepEqual(
    resolveRegistrationGiftClaimState({
      user: { role: "user" },
      grant: null,
      config: { legacyClaimEnabled: false },
      source: REGISTRATION_GIFT_SOURCE.legacyClaim,
    }),
    {
      claimable: false,
      status: "legacy_disabled",
      message: "老用户注册礼包领取入口已关闭",
    },
  );

  assert.deepEqual(
    resolveRegistrationGiftClaimState({
      user: { role: "user" },
      grant: null,
      config: { legacyClaimEnabled: false },
      source: REGISTRATION_GIFT_SOURCE.auto,
    }),
    {
      claimable: true,
      status: "claimable",
      message: "",
    },
  );
});

test("registration gift claim state blocks admins and duplicate grants", () => {
  assert.deepEqual(
    resolveRegistrationGiftClaimState({
      user: null,
      grant: null,
      config: {},
      source: REGISTRATION_GIFT_SOURCE.legacyClaim,
    }),
    {
      claimable: false,
      status: "user_not_found",
      message: "用户不存在",
    },
  );

  assert.deepEqual(
    resolveRegistrationGiftClaimState({
      user: { role: "admin" },
      grant: null,
      config: {},
      source: REGISTRATION_GIFT_SOURCE.auto,
    }),
    {
      claimable: false,
      status: "admin_excluded",
      message: "管理员账号不参与注册礼包",
    },
  );

  const grant = {
    id: 3,
    points: 1000,
    expiresAt: new Date("2026-05-14T08:00:00.000Z"),
    createdAt: NOW,
  };
  assert.deepEqual(
    resolveRegistrationGiftClaimState({
      user: { role: "user" },
      grant,
      config: {},
      source: REGISTRATION_GIFT_SOURCE.legacyClaim,
    }),
    {
      claimable: false,
      status: "claimed",
      message: "注册礼包已领取",
      grant,
    },
  );
});

test("saveStoredRegistrationGiftConfig persists normalized points config", async () => {
  const calls = [];
  const client = {
    systemSettings: {
      upsert: async (args) => {
        calls.push(args);
        return args.create;
      },
    },
  };

  const config = await saveStoredRegistrationGiftConfig({
    enabled: false,
    points: "1500",
    durationMinutes: "2880",
    autoGrantNewUsers: true,
    legacyClaimEnabled: false,
  }, client);

  assert.deepEqual(config, {
    enabled: false,
    points: 1500,
    durationMinutes: 2880,
    autoGrantNewUsers: true,
    legacyClaimEnabled: false,
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].where.key, REGISTRATION_GIFT_CONFIG_KEY);
  assert.equal(calls[0].update.group, "points");
  assert.equal(calls[0].update.description, "注册限时积分礼包配置");
  assert.deepEqual(JSON.parse(calls[0].update.value), config);
});

test("grantRegistrationGiftForUser creates a temporary points grant without changing permanent points", async () => {
  const calls = [];
  const tx = {
    user: {
      findUnique: async () => ({ id: 12, role: "user", points: 320 }),
    },
    registrationGiftGrant: {
      findUnique: async () => null,
      create: async (args) => {
        calls.push(["grant.create", args]);
        return { id: 44, createdAt: NOW, ...args.data };
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

  const result = await grantRegistrationGiftForUser({
    userId: 12,
    source: REGISTRATION_GIFT_SOURCE.legacyClaim,
    now: NOW,
    client,
    config: {
      enabled: true,
      points: 1000,
      durationMinutes: 1440,
      autoGrantNewUsers: true,
      legacyClaimEnabled: true,
    },
    getUserPointsBreakdown: async (userId, options) => {
      assert.equal(userId, 12);
      assert.equal(options.client, tx);
      assert.equal(options.permanentPoints, 320);
      return {
        permanentPoints: 320,
        temporaryPoints: 1000,
        effectivePoints: 1320,
        nextExpiringAt: new Date("2026-05-14T08:00:00.000Z"),
      };
    },
  });

  assert.equal(result.granted, true);
  assert.equal(result.points, 1000);
  assert.equal(result.expiresAt.toISOString(), "2026-05-14T08:00:00.000Z");
  assert.equal(result.totalPoints, 1320);
  assert.deepEqual(calls.map(([name]) => name), ["history.create", "grant.create"]);

  const historyCreate = calls.find(([name]) => name === "history.create")[1];
  assert.deepEqual(historyCreate.data, {
    userId: 12,
    points: 1000,
    type: "registration_gift",
    description: "注册礼包：1000限时积分，24小时内有效",
    expiresAt: new Date("2026-05-14T08:00:00.000Z"),
  });

  const grantCreate = calls.find(([name]) => name === "grant.create")[1];
  assert.deepEqual(grantCreate.data, {
    userId: 12,
    points: 1000,
    expiresAt: new Date("2026-05-14T08:00:00.000Z"),
    source: REGISTRATION_GIFT_SOURCE.legacyClaim,
    pointsHistoryId: 88,
  });
});

test("grantRegistrationGiftForUser returns existing state without duplicate records", async () => {
  const existingGrant = {
    id: 44,
    userId: 12,
    points: 1000,
    expiresAt: new Date("2026-05-14T08:00:00.000Z"),
    source: REGISTRATION_GIFT_SOURCE.auto,
    createdAt: NOW,
  };
  const tx = {
    user: {
      findUnique: async () => ({ id: 12, role: "user", points: 320 }),
    },
    registrationGiftGrant: {
      findUnique: async () => existingGrant,
      create: async () => {
        throw new Error("duplicate grant should not be created");
      },
    },
    pointsHistory: {
      create: async () => {
        throw new Error("duplicate history should not be created");
      },
    },
  };
  const client = {
    $transaction: async (handler) => handler(tx),
  };

  const result = await grantRegistrationGiftForUser({
    userId: 12,
    source: REGISTRATION_GIFT_SOURCE.legacyClaim,
    now: NOW,
    client,
    config: {},
    getUserPointsBreakdown: async () => ({
      permanentPoints: 320,
      temporaryPoints: 1000,
      effectivePoints: 1320,
      nextExpiringAt: existingGrant.expiresAt,
    }),
  });

  assert.equal(result.granted, false);
  assert.equal(result.status, "claimed");
  assert.equal(result.existingGrant, existingGrant);
  assert.equal(result.totalPoints, 1320);
});
