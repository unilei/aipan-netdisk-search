import assert from "node:assert/strict";
import test from "node:test";

import {
  FEATURE_ACCESS_KEYS,
  evaluateFeatureAccessPolicy,
  normalizeFeatureAccessConfig,
  resolveFeatureAccessKeysForPath,
} from "../../server/services/accessControl/featureAccessPolicy.mjs";

test("resolveFeatureAccessKeysForPath protects core resource APIs", () => {
  assert.deepEqual(resolveFeatureAccessKeysForPath("/api/sources/local"), [
    FEATURE_ACCESS_KEYS.netdiskSearch,
  ]);
  assert.deepEqual(resolveFeatureAccessKeysForPath("/api/tv/sources"), [
    FEATURE_ACCESS_KEYS.tvLive,
  ]);
  assert.deepEqual(resolveFeatureAccessKeysForPath("/api/tvbox"), [
    FEATURE_ACCESS_KEYS.tvbox,
  ]);
  assert.deepEqual(resolveFeatureAccessKeysForPath("/api/cache/tvbox"), [
    FEATURE_ACCESS_KEYS.tvbox,
  ]);
  assert.deepEqual(resolveFeatureAccessKeysForPath("/api/music/deezer-chart"), [
    FEATURE_ACCESS_KEYS.music,
  ]);
  assert.deepEqual(resolveFeatureAccessKeysForPath("/api/alist/sources"), [
    FEATURE_ACCESS_KEYS.alist,
  ]);
  assert.deepEqual(resolveFeatureAccessKeysForPath("/api/alist/list"), [
    FEATURE_ACCESS_KEYS.alist,
  ]);
  assert.deepEqual(resolveFeatureAccessKeysForPath("/api/alist/get"), [
    FEATURE_ACCESS_KEYS.alist,
  ]);
});

test("source APIs follow netdisk search access instead of other resource entry points", () => {
  const config = normalizeFeatureAccessConfig({
    enabled: true,
    requireLogin: true,
    minPoints: 100,
    protectedFeatures: {
      netdiskSearch: false,
      aiSearch: true,
      dailyMovieResources: true,
    },
  });

  const decision = evaluateFeatureAccessPolicy({
    config,
    featureKeys: resolveFeatureAccessKeysForPath("/api/sources/local"),
  });

  assert.equal(decision.allowed, true);
});

test("resolveFeatureAccessKeysForPath leaves public and unrelated APIs open", () => {
  assert.deepEqual(resolveFeatureAccessKeysForPath("/api/music/password"), []);
  assert.deepEqual(resolveFeatureAccessKeysForPath("/api/access-control/config"), []);
  assert.deepEqual(resolveFeatureAccessKeysForPath("/api/radio/stations"), []);
  assert.deepEqual(resolveFeatureAccessKeysForPath("/api/admin/alist/test"), []);
});

test("evaluateFeatureAccessPolicy returns 401 when protected API has no token", () => {
  const config = normalizeFeatureAccessConfig({
    requireLogin: true,
    minPoints: 100,
  });

  const decision = evaluateFeatureAccessPolicy({
    config,
    featureKeys: [FEATURE_ACCESS_KEYS.netdiskSearch],
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.statusCode, 401);
  assert.equal(decision.code, "LOGIN_REQUIRED");
  assert.equal(decision.requiredPoints, 100);
  assert.equal(decision.currentPoints, 0);
});

test("evaluateFeatureAccessPolicy requests user lookup after a valid token", () => {
  const config = normalizeFeatureAccessConfig({
    requireLogin: true,
    minPoints: 100,
  });

  const decision = evaluateFeatureAccessPolicy({
    config,
    featureKeys: [FEATURE_ACCESS_KEYS.tvLive],
    token: "valid-token",
    decoded: { userId: 12, role: "user" },
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.needsUser, true);
  assert.equal(decision.userId, 12);
});

test("evaluateFeatureAccessPolicy returns 403 when points are below threshold", () => {
  const config = normalizeFeatureAccessConfig({
    requireLogin: true,
    minPoints: 100,
  });

  const decision = evaluateFeatureAccessPolicy({
    config,
    featureKeys: [FEATURE_ACCESS_KEYS.music],
    token: "valid-token",
    decoded: { userId: 12, role: "user" },
    user: { id: 12, role: "user", points: 99 },
    userLoaded: true,
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.statusCode, 403);
  assert.equal(decision.code, "POINTS_REQUIRED");
  assert.equal(decision.requiredPoints, 100);
  assert.equal(decision.currentPoints, 99);
});

test("evaluateFeatureAccessPolicy allows protected APIs when points meet threshold", () => {
  const config = normalizeFeatureAccessConfig({
    requireLogin: true,
    minPoints: 100,
  });

  const decision = evaluateFeatureAccessPolicy({
    config,
    featureKeys: [FEATURE_ACCESS_KEYS.tvbox],
    token: "valid-token",
    decoded: { userId: 12, role: "user" },
    user: { id: 12, role: "user", points: 100 },
    userLoaded: true,
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.statusCode, 200);
  assert.equal(decision.currentPoints, 100);
});

test("evaluateFeatureAccessPolicy allows APIs when global or feature protection is disabled", () => {
  const disabledConfig = normalizeFeatureAccessConfig({
    enabled: false,
    requireLogin: true,
    minPoints: 100,
  });
  const featureOpenConfig = normalizeFeatureAccessConfig({
    enabled: true,
    requireLogin: true,
    minPoints: 100,
    protectedFeatures: {
      music: false,
    },
  });

  assert.equal(
    evaluateFeatureAccessPolicy({
      config: disabledConfig,
      featureKeys: [FEATURE_ACCESS_KEYS.netdiskSearch],
    }).allowed,
    true,
  );
  assert.equal(
    evaluateFeatureAccessPolicy({
      config: featureOpenConfig,
      featureKeys: [FEATURE_ACCESS_KEYS.music],
    }).allowed,
    true,
  );
});
