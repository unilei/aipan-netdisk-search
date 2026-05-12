export const PRIVATE_MESSAGE_CONFIG_KEY = "chat_private_message_config";
export const DEFAULT_PRIVATE_MESSAGE_MINIMUM_POINTS = 10000;

export const DEFAULT_PRIVATE_MESSAGE_CONFIG = {
  privateMessageMinimumPoints: DEFAULT_PRIVATE_MESSAGE_MINIMUM_POINTS,
  adminBypass: true,
};

const normalizeInteger = (value, fallback, { min, max }) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.floor(parsed);
  if (normalized < min) return fallback;
  return Math.min(max, normalized);
};

export const normalizePrivateMessageConfig = (input = {}) => ({
  privateMessageMinimumPoints: normalizeInteger(
    input.privateMessageMinimumPoints,
    DEFAULT_PRIVATE_MESSAGE_MINIMUM_POINTS,
    { min: 0, max: 100000000 },
  ),
  adminBypass:
    typeof input.adminBypass === "boolean"
      ? input.adminBypass
      : DEFAULT_PRIVATE_MESSAGE_CONFIG.adminBypass,
});

export const resolvePrivateMessageStartEligibility = ({
  user,
  pointsBreakdown,
  config,
}) => {
  const normalizedConfig = normalizePrivateMessageConfig(config);
  const requiredPoints = normalizedConfig.privateMessageMinimumPoints;
  const currentPoints = Math.max(
    0,
    Math.floor(Number(pointsBreakdown?.effectivePoints || 0)),
  );

  if (normalizedConfig.adminBypass && user?.role === "admin") {
    return {
      allowed: true,
      reason: "admin_bypass",
      requiredPoints,
      currentPoints,
      message: "管理员可直接发起私信。",
    };
  }

  if (currentPoints < requiredPoints) {
    return {
      allowed: false,
      reason: "insufficient_points",
      requiredPoints,
      currentPoints,
      message: `发起私信需要当前积分达到 ${requiredPoints}，回复已有私信不受限制。`,
    };
  }

  return {
    allowed: true,
    reason: "eligible",
    requiredPoints,
    currentPoints,
    message: "已达到发起私信所需积分，不会扣除积分。",
  };
};

const getDefaultPrismaClient = async () => {
  const module = await import("../../../lib/prisma.js");
  return module.default;
};

const parseConfigValue = (value) => {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

export const getStoredPrivateMessageConfig = async (client) => {
  const prisma = client || (await getDefaultPrismaClient());
  const setting = await prisma.systemSettings.findUnique({
    where: { key: PRIVATE_MESSAGE_CONFIG_KEY },
  });

  return normalizePrivateMessageConfig(parseConfigValue(setting?.value));
};

export const saveStoredPrivateMessageConfig = async (config, client) => {
  const prisma = client || (await getDefaultPrismaClient());
  const normalized = normalizePrivateMessageConfig(config);

  await prisma.systemSettings.upsert({
    where: { key: PRIVATE_MESSAGE_CONFIG_KEY },
    update: {
      value: JSON.stringify(normalized),
      description: "私信发起积分门槛配置",
      group: "points",
      isEnabled: true,
    },
    create: {
      key: PRIVATE_MESSAGE_CONFIG_KEY,
      value: JSON.stringify(normalized),
      description: "私信发起积分门槛配置",
      group: "points",
      isEnabled: true,
    },
  });

  return normalized;
};
