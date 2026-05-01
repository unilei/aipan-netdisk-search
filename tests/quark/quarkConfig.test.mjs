import assert from "node:assert/strict";
import test from "node:test";

import {
  QUARK_VERIFICATION_PURPOSES,
  getTransferTaskFromQuarkConfig,
  normalizeQuarkConfig,
  resolveQuarkVerificationTarget,
} from "../../server/services/quark/quarkConfig.mjs";

test("normalizeQuarkConfig treats legacy shareLink as access verification only", () => {
  const config = normalizeQuarkConfig({
    verificationEnabled: true,
    shareLink: "https://pan.quark.cn/s/accesslegacy",
    transferRewardEnabled: true,
  });

  assert.equal(
    config.accessVerificationShareLink,
    "https://pan.quark.cn/s/accesslegacy",
  );
  assert.equal(config.shareLink, "https://pan.quark.cn/s/accesslegacy");
  assert.equal(config.transferRewardShareLink, "");
});

test("resolveQuarkVerificationTarget separates access and points targets", () => {
  const config = normalizeQuarkConfig({
    verificationEnabled: true,
    accessVerificationShareLink: "https://pan.quark.cn/s/access111",
    transferRewardEnabled: true,
    transferRewardShareLink: "https://pan.quark.cn/s/points222",
  });

  assert.deepEqual(resolveQuarkVerificationTarget(config, "access"), {
    purpose: QUARK_VERIFICATION_PURPOSES.access,
    enabled: true,
    shareLink: "https://pan.quark.cn/s/access111",
    missingReason: "",
  });
  assert.deepEqual(resolveQuarkVerificationTarget(config, "points"), {
    purpose: QUARK_VERIFICATION_PURPOSES.points,
    enabled: true,
    shareLink: "https://pan.quark.cn/s/points222",
    missingReason: "",
  });
});

test("points transfer task is independent from access verification", () => {
  const config = normalizeQuarkConfig({
    verificationEnabled: false,
    accessVerificationShareLink: "",
    transferRewardEnabled: true,
    transferRewardShareLink: "https://pan.quark.cn/s/points222",
    transferRewardPoints: 1200,
    transferRewardDurationMinutes: 60,
  });

  assert.deepEqual(getTransferTaskFromQuarkConfig(config), {
    enabled: true,
    rewardPoints: 1200,
    durationMinutes: 60,
  });
  assert.deepEqual(resolveQuarkVerificationTarget(config, "points"), {
    purpose: QUARK_VERIFICATION_PURPOSES.points,
    enabled: true,
    shareLink: "https://pan.quark.cn/s/points222",
    missingReason: "",
  });
  assert.equal(resolveQuarkVerificationTarget(config, "access").enabled, false);
});

test("points transfer task is disabled without a dedicated points share link", () => {
  const config = normalizeQuarkConfig({
    verificationEnabled: true,
    shareLink: "https://pan.quark.cn/s/accesslegacy",
    transferRewardEnabled: true,
  });

  assert.deepEqual(getTransferTaskFromQuarkConfig(config), {
    enabled: false,
    rewardPoints: 1000,
    durationMinutes: 1440,
  });
  assert.equal(resolveQuarkVerificationTarget(config, "points").enabled, false);
});
