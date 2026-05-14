import crypto from "node:crypto";

export const POINT_TYPES = {
  checkin: "checkin",
  bonus: "bonus",
  consume: "consume",
  admin: "admin",
  activity: "activity",
  task: "task",
  transfer: "transfer",
  redemption: "redemption",
  registrationGift: "registration_gift",
  dailyRedemptionDrop: "daily_redemption_drop",
};

export const DEFAULT_TRANSFER_REWARD_CONFIG = {
  transferRewardEnabled: true,
  transferRewardPoints: 1000,
  transferRewardDurationMinutes: 1440,
};

export const CHECK_IN_BASE_POINTS = 10;

const CHECK_IN_BONUS_MILESTONES = [
  { days: 3, points: 5 },
  { days: 7, points: 15 },
  { days: 15, points: 30 },
  { days: 30, points: 50 },
];

const normalizeConsecutiveDays = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
};

export const getCheckInBonusReward = (consecutiveDays) => {
  const days = normalizeConsecutiveDays(consecutiveDays);
  const milestone =
    CHECK_IN_BONUS_MILESTONES.find((item) => item.days === days) ||
    (days > 30 && days % 30 === 0
      ? CHECK_IN_BONUS_MILESTONES[CHECK_IN_BONUS_MILESTONES.length - 1]
      : null);

  if (!milestone) {
    return {
      points: 0,
      description: "",
    };
  }

  return {
    points: milestone.points,
    description: `连续签到${days}天奖励`,
  };
};

export const getNextCheckInReward = (consecutiveDays) => {
  const days = normalizeConsecutiveDays(consecutiveDays);
  const nextMilestone = CHECK_IN_BONUS_MILESTONES.find(
    (item) => item.days > days,
  );

  if (nextMilestone) {
    return {
      days: nextMilestone.days,
      points: nextMilestone.points,
      description: `连续签到${nextMilestone.days}天可获得额外${nextMilestone.points}积分`,
    };
  }

  const nextThirtyDayMilestone = Math.ceil((days + 1) / 30) * 30;

  return {
    days: nextThirtyDayMilestone,
    points: 50,
    description: `连续签到${nextThirtyDayMilestone}天可获得额外50积分`,
  };
};

const toDateOrNull = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizePositiveInteger = (value, fallback, max) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(1, Math.floor(parsed)));
};

const STABLE_FILE_ID_FIELDS = [
  "fid",
  "file_id",
  "fileId",
  "fileIdStr",
  "file_id_str",
  "obj_id",
  "objId",
  "fs_id",
  "fsId",
  "source_fid",
  "sourceFileId",
];

const normalizeFingerprintValue = (value) => {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  return "";
};

const hashFingerprintPayload = (scope, payload) => {
  const digest = crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
  return `${scope}:${digest}`;
};

const getShareDetailFiles = (shareDetail) => {
  const list = shareDetail?.data?.list;
  return Array.isArray(list)
    ? list.filter((file) => file && typeof file === "object")
    : [];
};

const getStableFileIdentifier = (file) => {
  for (const field of STABLE_FILE_ID_FIELDS) {
    const value = normalizeFingerprintValue(file?.[field]);
    if (value) return `${field}:${value}`;
  }

  return null;
};

const getFileKind = (file) => {
  const rawKind =
    file?.file_type ??
    file?.type ??
    file?.format_type ??
    file?.obj_category ??
    (file?.dir || file?.is_dir || file?.isDirectory ? "folder" : "file");
  return normalizeFingerprintValue(rawKind) || "file";
};

const getFileContentIdentifier = (file) => {
  const size = Number(file?.size);
  return {
    name:
      normalizeFingerprintValue(file?.file_name) ||
      normalizeFingerprintValue(file?.name) ||
      normalizeFingerprintValue(file?.title),
    size: Number.isFinite(size) ? size : 0,
    kind: getFileKind(file),
  };
};

const sortJsonStable = (items) =>
  [...items].sort((first, second) =>
    JSON.stringify(first).localeCompare(JSON.stringify(second)),
  );

export const buildTransferFingerprintFromShareDetail = (shareDetail) => {
  const files = getShareDetailFiles(shareDetail);
  if (files.length === 0) return null;

  const stableFileIds = [];
  const contentFallbacks = [];

  for (const file of files) {
    const stableFileId = getStableFileIdentifier(file);
    if (stableFileId) {
      stableFileIds.push(stableFileId);
      continue;
    }

    contentFallbacks.push(getFileContentIdentifier(file));
  }

  if (stableFileIds.length > 0) {
    return hashFingerprintPayload("transfer-instance", {
      stableFileIds: [...stableFileIds].sort(),
      contentFallbacks: sortJsonStable(contentFallbacks),
    });
  }

  return hashFingerprintPayload("transfer-content", {
    files: sortJsonStable(contentFallbacks),
  });
};

export const normalizeTransferRewardConfig = (input = {}) => ({
  transferRewardEnabled:
    typeof input.transferRewardEnabled === "boolean"
      ? input.transferRewardEnabled
      : DEFAULT_TRANSFER_REWARD_CONFIG.transferRewardEnabled,
  transferRewardPoints: normalizePositiveInteger(
    input.transferRewardPoints,
    DEFAULT_TRANSFER_REWARD_CONFIG.transferRewardPoints,
    100000000,
  ),
  transferRewardDurationMinutes: normalizePositiveInteger(
    input.transferRewardDurationMinutes,
    DEFAULT_TRANSFER_REWARD_CONFIG.transferRewardDurationMinutes,
    525600,
  ),
});

export const calculateEffectivePoints = ({
  permanentPoints = 0,
  temporaryEntries = [],
  now = new Date(),
}) => {
  const currentTime = toDateOrNull(now) || new Date();
  const activeEntries = temporaryEntries.filter((entry) => {
    const expiresAt = toDateOrNull(entry.expiresAt);
    return Number(entry.points || 0) > 0 && expiresAt && expiresAt > currentTime;
  });
  const temporaryPoints = activeEntries.reduce(
    (sum, entry) => sum + Number(entry.points || 0),
    0,
  );
  const nextExpiringAt = activeEntries
    .map((entry) => toDateOrNull(entry.expiresAt))
    .filter(Boolean)
    .sort((first, second) => first.getTime() - second.getTime())[0] || null;

  return {
    permanentPoints: Number(permanentPoints || 0),
    temporaryPoints,
    effectivePoints: Number(permanentPoints || 0) + temporaryPoints,
    nextExpiringAt,
  };
};

export const resolveTransferRewardDecision = ({
  existingGrant = null,
  config,
  now = new Date(),
}) => {
  const rewardConfig = normalizeTransferRewardConfig(config);

  if (!rewardConfig.transferRewardEnabled) {
    return {
      granted: false,
      alreadyGranted: false,
      points: 0,
      expiresAt: null,
    };
  }

  if (existingGrant) {
    return {
      granted: false,
      alreadyGranted: true,
      points: 0,
      expiresAt: null,
    };
  }

  const createdAt = toDateOrNull(now) || new Date();
  const expiresAt = new Date(
    createdAt.getTime() + rewardConfig.transferRewardDurationMinutes * 60 * 1000,
  );

  return {
    granted: true,
    alreadyGranted: false,
    points: rewardConfig.transferRewardPoints,
    expiresAt,
  };
};

export const decoratePointsHistoryRecords = (records = [], now = new Date()) => {
  const currentTime = toDateOrNull(now) || new Date();

  return records.map((record) => {
    const expiresAt = toDateOrNull(record.expiresAt);
    const isTemporary = Boolean(expiresAt);

    return {
      ...record,
      expiresAt,
      isTemporary,
      isExpired: isTemporary ? expiresAt <= currentTime : false,
    };
  });
};
