export const DEFAULT_API_URL =
  "http://127.0.0.1:5000/api/quark/sharepage/save";
export const DEFAULT_ACCESS_DURATION = 1440;
export const DEFAULT_TRANSFER_REWARD_POINTS = 1000;
export const DEFAULT_TRANSFER_REWARD_DURATION = 1440;

export const QUARK_VERIFICATION_PURPOSES = {
  access: "access",
  points: "points",
};

export const DEFAULT_QUARK_CONFIG = {
  quarkCookie: "",
  userId: "",
  typeId: "",
  enabled: false,
  apiUrl: DEFAULT_API_URL,
  verificationEnabled: false,
  shareLink: "",
  accessVerificationShareLink: "",
  accessDurationMinutes: DEFAULT_ACCESS_DURATION,
  transferRewardEnabled: true,
  transferRewardShareLink: "",
  transferRewardPoints: DEFAULT_TRANSFER_REWARD_POINTS,
  transferRewardDurationMinutes: DEFAULT_TRANSFER_REWARD_DURATION,
};

export const TRANSFER_REWARD_CONFIG_KEYS = [
  "transferRewardEnabled",
  "transferRewardShareLink",
  "transferRewardPoints",
  "transferRewardDurationMinutes",
];

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : "";

const normalizeBoolean = (value, fallback) =>
  typeof value === "boolean" ? value : fallback;

const normalizeInteger = (value, fallback, { min, max }) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
};

const pickDefinedEntries = (input = {}) =>
  Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );

const pickDefinedTransferRewardEntries = (input = {}) =>
  Object.fromEntries(
    TRANSFER_REWARD_CONFIG_KEYS
      .filter((key) => input[key] !== undefined)
      .map((key) => [key, input[key]]),
  );

export const normalizeQuarkConfig = (input = {}) => {
  const legacyShareLink = normalizeString(input.shareLink);
  const accessVerificationShareLink =
    normalizeString(input.accessVerificationShareLink) || legacyShareLink;

  return {
    ...DEFAULT_QUARK_CONFIG,
    ...input,
    quarkCookie: normalizeString(input.quarkCookie),
    userId:
      input.userId === undefined || input.userId === null
        ? ""
        : String(input.userId),
    typeId:
      input.typeId === undefined || input.typeId === null
        ? ""
        : String(input.typeId),
    apiUrl: normalizeString(input.apiUrl) || DEFAULT_API_URL,
    enabled: normalizeBoolean(input.enabled, DEFAULT_QUARK_CONFIG.enabled),
    verificationEnabled: normalizeBoolean(
      input.verificationEnabled,
      DEFAULT_QUARK_CONFIG.verificationEnabled,
    ),
    shareLink: accessVerificationShareLink,
    accessVerificationShareLink,
    accessDurationMinutes: normalizeInteger(
      input.accessDurationMinutes,
      DEFAULT_ACCESS_DURATION,
      { min: 5, max: 1440 },
    ),
    transferRewardEnabled: normalizeBoolean(
      input.transferRewardEnabled,
      DEFAULT_QUARK_CONFIG.transferRewardEnabled,
    ),
    transferRewardShareLink: normalizeString(input.transferRewardShareLink),
    transferRewardPoints: normalizeInteger(
      input.transferRewardPoints,
      DEFAULT_TRANSFER_REWARD_POINTS,
      { min: 1, max: 100000000 },
    ),
    transferRewardDurationMinutes: normalizeInteger(
      input.transferRewardDurationMinutes,
      DEFAULT_TRANSFER_REWARD_DURATION,
      { min: 1, max: 525600 },
    ),
  };
};

export const pickTransferRewardConfig = (inputConfig = {}) => {
  const config = normalizeQuarkConfig(inputConfig);

  return {
    transferRewardEnabled: config.transferRewardEnabled,
    transferRewardShareLink: config.transferRewardShareLink,
    transferRewardPoints: config.transferRewardPoints,
    transferRewardDurationMinutes: config.transferRewardDurationMinutes,
  };
};

export const mergeQuarkConfigUpdate = (storedConfig = {}, update = {}) =>
  normalizeQuarkConfig({
    ...normalizeQuarkConfig(storedConfig),
    ...pickDefinedEntries(update),
  });

export const mergeTransferRewardConfigUpdate = (
  storedConfig = {},
  update = {},
) =>
  mergeQuarkConfigUpdate(
    storedConfig,
    pickDefinedTransferRewardEntries(update),
  );

export const normalizeQuarkVerificationPurpose = (purpose) =>
  purpose === QUARK_VERIFICATION_PURPOSES.points
    ? QUARK_VERIFICATION_PURPOSES.points
    : QUARK_VERIFICATION_PURPOSES.access;

export const resolveQuarkVerificationTarget = (inputConfig, purpose) => {
  const config = normalizeQuarkConfig(inputConfig);
  const normalizedPurpose = normalizeQuarkVerificationPurpose(purpose);

  if (normalizedPurpose === QUARK_VERIFICATION_PURPOSES.points) {
    if (!config.transferRewardEnabled) {
      return {
        purpose: normalizedPurpose,
        enabled: false,
        shareLink: "",
        missingReason: "转存积分奖励尚未启用",
      };
    }

    if (!config.transferRewardShareLink) {
      return {
        purpose: normalizedPurpose,
        enabled: false,
        shareLink: "",
        missingReason: "转存积分任务链接未设置",
      };
    }

    return {
      purpose: normalizedPurpose,
      enabled: true,
      shareLink: config.transferRewardShareLink,
      missingReason: "",
    };
  }

  if (!config.verificationEnabled) {
    return {
      purpose: normalizedPurpose,
      enabled: false,
      shareLink: "",
      missingReason: "访问验证尚未启用",
    };
  }

  if (!config.accessVerificationShareLink) {
    return {
      purpose: normalizedPurpose,
      enabled: false,
      shareLink: "",
      missingReason: "访问验证目标链接未设置",
    };
  }

  return {
    purpose: normalizedPurpose,
    enabled: true,
    shareLink: config.accessVerificationShareLink,
    missingReason: "",
  };
};

export const getTransferTaskFromQuarkConfig = (inputConfig = {}) => {
  const config = normalizeQuarkConfig(inputConfig);

  return {
    enabled: Boolean(
      config.transferRewardEnabled && config.transferRewardShareLink,
    ),
    rewardPoints: config.transferRewardPoints,
    durationMinutes: config.transferRewardDurationMinutes,
  };
};

export const buildPublicQuarkConfig = (inputConfig = {}) => {
  const config = normalizeQuarkConfig(inputConfig);
  const transferTask = getTransferTaskFromQuarkConfig(config);

  return {
    enabled: config.enabled,
    verificationEnabled: config.verificationEnabled,
    shareLink: config.accessVerificationShareLink,
    accessVerificationShareLink: config.accessVerificationShareLink,
    accessDurationMinutes: config.accessDurationMinutes,
    transferRewardEnabled: config.transferRewardEnabled,
    transferRewardShareLink: config.transferRewardShareLink,
    transferRewardPoints: config.transferRewardPoints,
    transferRewardDurationMinutes: config.transferRewardDurationMinutes,
    transferTask,
  };
};
