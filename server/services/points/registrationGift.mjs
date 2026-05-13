import { POINT_TYPES } from "./pointsLedger.mjs";

export const REGISTRATION_GIFT_CONFIG_KEY = "registration_gift_config";

export const REGISTRATION_GIFT_SOURCE = {
  auto: "auto",
  legacyClaim: "legacy_claim",
};

export const DEFAULT_REGISTRATION_GIFT_CONFIG = {
  enabled: true,
  points: 1000,
  durationMinutes: 1440,
  autoGrantNewUsers: true,
  legacyClaimEnabled: true,
};

const REGISTRATION_GIFT_LIMITS = {
  maxPoints: 100000000,
  maxDurationMinutes: 525600,
};

const normalizeInteger = (value, fallback, { min, max }) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.floor(parsed);
  if (normalized < min) return fallback;
  return Math.min(max, normalized);
};

const normalizeBoolean = (value, fallback) => (
  typeof value === "boolean" ? value : fallback
);

export const normalizeRegistrationGiftConfig = (input = {}) => ({
  enabled: normalizeBoolean(
    input.enabled,
    DEFAULT_REGISTRATION_GIFT_CONFIG.enabled,
  ),
  points: normalizeInteger(
    input.points,
    DEFAULT_REGISTRATION_GIFT_CONFIG.points,
    { min: 1, max: REGISTRATION_GIFT_LIMITS.maxPoints },
  ),
  durationMinutes: normalizeInteger(
    input.durationMinutes,
    DEFAULT_REGISTRATION_GIFT_CONFIG.durationMinutes,
    { min: 1, max: REGISTRATION_GIFT_LIMITS.maxDurationMinutes },
  ),
  autoGrantNewUsers: normalizeBoolean(
    input.autoGrantNewUsers,
    DEFAULT_REGISTRATION_GIFT_CONFIG.autoGrantNewUsers,
  ),
  legacyClaimEnabled: normalizeBoolean(
    input.legacyClaimEnabled,
    DEFAULT_REGISTRATION_GIFT_CONFIG.legacyClaimEnabled,
  ),
});

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

export const getStoredRegistrationGiftConfig = async (client) => {
  const prisma = client || (await getDefaultPrismaClient());
  const setting = await prisma.systemSettings.findUnique({
    where: { key: REGISTRATION_GIFT_CONFIG_KEY },
  });

  return normalizeRegistrationGiftConfig(parseConfigValue(setting?.value));
};

export const saveStoredRegistrationGiftConfig = async (config, client) => {
  const prisma = client || (await getDefaultPrismaClient());
  const normalized = normalizeRegistrationGiftConfig(config);

  await prisma.systemSettings.upsert({
    where: { key: REGISTRATION_GIFT_CONFIG_KEY },
    update: {
      value: JSON.stringify(normalized),
      description: "注册限时积分礼包配置",
      group: "points",
      isEnabled: true,
    },
    create: {
      key: REGISTRATION_GIFT_CONFIG_KEY,
      value: JSON.stringify(normalized),
      description: "注册限时积分礼包配置",
      group: "points",
      isEnabled: true,
    },
  });

  return normalized;
};

const formatDurationText = (minutes) => {
  const normalized = Number(minutes || 0);
  if (normalized >= 60 && normalized % 60 === 0) {
    return `${normalized / 60}小时`;
  }
  return `${normalized}分钟`;
};

export const buildRegistrationGiftDescription = ({ points, durationMinutes }) =>
  `注册礼包：${points}限时积分，${formatDurationText(durationMinutes)}内有效`;

export const resolveRegistrationGiftClaimState = ({
  user,
  grant,
  config,
  source = REGISTRATION_GIFT_SOURCE.legacyClaim,
}) => {
  const normalizedConfig = normalizeRegistrationGiftConfig(config);

  if (grant) {
    return {
      claimable: false,
      status: "claimed",
      message: "注册礼包已领取",
      grant,
    };
  }

  if (!normalizedConfig.enabled) {
    return {
      claimable: false,
      status: "disabled",
      message: "注册礼包已关闭",
    };
  }

  if (!user) {
    return {
      claimable: false,
      status: "user_not_found",
      message: "用户不存在",
    };
  }

  if (user?.role === "admin") {
    return {
      claimable: false,
      status: "admin_excluded",
      message: "管理员账号不参与注册礼包",
    };
  }

  if (
    source === REGISTRATION_GIFT_SOURCE.auto &&
    !normalizedConfig.autoGrantNewUsers
  ) {
    return {
      claimable: false,
      status: "auto_disabled",
      message: "新用户注册礼包自动发放已关闭",
    };
  }

  if (
    source === REGISTRATION_GIFT_SOURCE.legacyClaim &&
    !normalizedConfig.legacyClaimEnabled
  ) {
    return {
      claimable: false,
      status: "legacy_disabled",
      message: "老用户注册礼包领取入口已关闭",
    };
  }

  return {
    claimable: true,
    status: "claimable",
    message: "",
  };
};

export const getRegistrationGiftStatusForUser = async ({
  userId,
  source = REGISTRATION_GIFT_SOURCE.legacyClaim,
  client = null,
  config = null,
}) => {
  const prisma = client || (await getDefaultPrismaClient());
  const [user, grant, resolvedConfig] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    }),
    prisma.registrationGiftGrant.findUnique({
      where: { userId },
    }),
    config
      ? Promise.resolve(normalizeRegistrationGiftConfig(config))
      : getStoredRegistrationGiftConfig(prisma),
  ]);
  const state = resolveRegistrationGiftClaimState({
    user,
    grant,
    config: resolvedConfig,
    source,
  });

  return {
    ...resolvedConfig,
    claimable: state.claimable,
    status: state.status,
    message: state.message,
    grantedAt: grant?.createdAt || null,
    expiresAt: grant?.expiresAt || null,
  };
};

export const grantRegistrationGiftForUser = async ({
  userId,
  source = REGISTRATION_GIFT_SOURCE.auto,
  now = new Date(),
  client = null,
  config = null,
  getUserPointsBreakdown = null,
}) => {
  const prisma = client || (await getDefaultPrismaClient());
  const pointsBreakdownReader = getUserPointsBreakdown || (
    await import("./userPoints.ts")
  ).getUserPointsBreakdown;
  const resolvedConfig = config
    ? normalizeRegistrationGiftConfig(config)
    : await getStoredRegistrationGiftConfig(prisma);

  return prisma.$transaction(async (tx) => {
    const [user, existingGrant] = await Promise.all([
      tx.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, points: true },
      }),
      tx.registrationGiftGrant.findUnique({
        where: { userId },
      }),
    ]);

    const state = resolveRegistrationGiftClaimState({
      user,
      grant: existingGrant,
      config: resolvedConfig,
      source,
    });

    if (!state.claimable) {
      const breakdown = await pointsBreakdownReader(userId, {
        client: tx,
        permanentPoints: user?.points || 0,
        now,
      });

      return {
        granted: false,
        status: state.status,
        message: state.message,
        points: 0,
        expiresAt: existingGrant?.expiresAt || null,
        existingGrant,
        totalPoints: breakdown.effectivePoints,
        permanentPoints: breakdown.permanentPoints,
        temporaryPoints: breakdown.temporaryPoints,
        effectivePoints: breakdown.effectivePoints,
        nextExpiringAt: breakdown.nextExpiringAt,
        pointsBreakdown: breakdown,
      };
    }

    const createdAt = now instanceof Date ? now : new Date(now);
    const expiresAt = new Date(
      createdAt.getTime() + resolvedConfig.durationMinutes * 60 * 1000,
    );

    const pointsRecord = await tx.pointsHistory.create({
      data: {
        userId,
        points: resolvedConfig.points,
        type: POINT_TYPES.registrationGift,
        description: buildRegistrationGiftDescription(resolvedConfig),
        expiresAt,
      },
    });

    const grant = await tx.registrationGiftGrant.create({
      data: {
        userId,
        points: resolvedConfig.points,
        expiresAt,
        source,
        pointsHistoryId: pointsRecord.id,
      },
    });

    const breakdown = await pointsBreakdownReader(userId, {
      client: tx,
      permanentPoints: user?.points || 0,
      now,
    });

    return {
      granted: true,
      status: "granted",
      message: "注册礼包领取成功",
      points: resolvedConfig.points,
      expiresAt,
      grant,
      totalPoints: breakdown.effectivePoints,
      permanentPoints: breakdown.permanentPoints,
      temporaryPoints: breakdown.temporaryPoints,
      effectivePoints: breakdown.effectivePoints,
      nextExpiringAt: breakdown.nextExpiringAt,
      pointsBreakdown: breakdown,
    };
  });
};
