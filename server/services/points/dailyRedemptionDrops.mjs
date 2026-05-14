import crypto from "node:crypto";
import { POINT_TYPES } from "./pointsLedger.mjs";

export const DAILY_REDEMPTION_DROP_TIMEZONE = "Asia/Shanghai";

export const DEFAULT_DAILY_REDEMPTION_DROP_CONFIG = {
  name: "每日福利",
  description: "每天定时开放，抢完即止。",
  enabled: false,
  releaseTime: "12:00",
  timezone: DAILY_REDEMPTION_DROP_TIMEZONE,
  dailyQuota: 100,
  points: 100,
  pointsExpiresInMinutes: null,
  maxClaimsPerUserPerDay: 1,
  requireEmailVerified: false,
  minimumAccountAgeDays: 0,
};

const SHANGHAI_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: DAILY_REDEMPTION_DROP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const toDateOrNow = (value) => {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const toDateOrNull = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeString = (value, fallback, maxLength = 120) => {
  if (value === undefined || value === null) return fallback;
  const normalized = String(value).trim();
  if (!normalized) return fallback;
  return normalized.slice(0, maxLength);
};

const normalizeOptionalString = (value, maxLength = 2000) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized ? normalized.slice(0, maxLength) : null;
};

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
};

const normalizeInteger = (value, fallback, min, max) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
};

const normalizeReleaseTime = (value, fallback = DEFAULT_DAILY_REDEMPTION_DROP_CONFIG.releaseTime) => {
  if (value === undefined || value === null) return fallback;
  const match = String(value).trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return fallback;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return fallback;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const getShanghaiParts = (value) => {
  const date = toDateOrNow(value);
  return Object.fromEntries(
    SHANGHAI_DATE_TIME_FORMATTER.formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
};

const parseReleaseMinutes = (releaseTime) => {
  const normalized = normalizeReleaseTime(releaseTime);
  const [hour, minute] = normalized.split(":").map((part) => Number(part));
  return hour * 60 + minute;
};

const getShanghaiMinutes = (value) => {
  const parts = getShanghaiParts(value);
  return Number(parts.hour) * 60 + Number(parts.minute);
};

const hashRequestValue = (value) => {
  if (!value) return null;
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 32);
};

const getAdvisoryLockKey = (dropId, claimDateKey) => {
  const digest = crypto
    .createHash("sha256")
    .update(`daily-redemption-drop:${dropId}:${claimDateKey}`)
    .digest();
  return digest.readInt32BE(0);
};

const getClaimCounts = async ({ client, dropId, userId, claimDate }) => {
  const [dayClaimCount, userDayClaimCount] = await Promise.all([
    client.dailyRedemptionDropClaim.count({
      where: {
        dropId,
        claimDate,
      },
    }),
    userId
      ? client.dailyRedemptionDropClaim.count({
          where: {
            dropId,
            userId,
            claimDate,
          },
        })
      : Promise.resolve(0),
  ]);

  return { dayClaimCount, userDayClaimCount };
};

const getDefaultPrisma = async () => {
  const prismaModule = await import("~/lib/prisma");
  return prismaModule.default;
};

const getDefaultUserPointsBreakdown = async () => {
  const pointsModule = await import("~/server/services/points/userPoints");
  return pointsModule.getUserPointsBreakdown;
};

const getPrimaryDailyRedemptionDrop = async (client) =>
  client.dailyRedemptionDrop.findFirst({
    orderBy: {
      id: "asc",
    },
  });

const buildDropPayload = (drop) => {
  const normalized = normalizeDailyRedemptionDropInput(drop || {});
  return {
    id: drop?.id || null,
    ...normalized,
    rewardMode: normalized.pointsExpiresInMinutes ? "temporary" : "permanent",
    isTemporary: Boolean(normalized.pointsExpiresInMinutes),
    createdAt: drop?.createdAt || null,
    updatedAt: drop?.updatedAt || null,
  };
};

const buildStatusPayload = ({
  drop,
  state,
  claimDateKey,
  claimedCount = 0,
  userClaimCount = 0,
}) => {
  const config = buildDropPayload(drop);
  const remainingQuota = Math.max(0, config.dailyQuota - claimedCount);

  return {
    ...config,
    claimDateKey,
    claimedCount,
    userClaimCount,
    remainingQuota,
    released: config.enabled ? state.status !== "not_released" : false,
    claimable: state.claimable,
    status: state.status,
    message: state.message,
  };
};

export const normalizeDailyRedemptionDropInput = (input = {}) => {
  const rewardMode =
    input.rewardMode === "temporary" || input.pointsExpiresInMinutes
      ? "temporary"
      : "permanent";

  return {
    name: normalizeString(input.name, DEFAULT_DAILY_REDEMPTION_DROP_CONFIG.name, 80),
    description:
      input.description === undefined
        ? DEFAULT_DAILY_REDEMPTION_DROP_CONFIG.description
        : normalizeOptionalString(input.description, 1000),
    enabled: normalizeBoolean(input.enabled, DEFAULT_DAILY_REDEMPTION_DROP_CONFIG.enabled),
    releaseTime: normalizeReleaseTime(
      input.releaseTime,
      DEFAULT_DAILY_REDEMPTION_DROP_CONFIG.releaseTime,
    ),
    timezone: DAILY_REDEMPTION_DROP_TIMEZONE,
    dailyQuota: normalizeInteger(input.dailyQuota, DEFAULT_DAILY_REDEMPTION_DROP_CONFIG.dailyQuota, 1, 100000),
    points: normalizeInteger(input.points, DEFAULT_DAILY_REDEMPTION_DROP_CONFIG.points, 1, 1000000),
    pointsExpiresInMinutes:
      rewardMode === "temporary"
        ? normalizeInteger(input.pointsExpiresInMinutes, 1440, 1, 525600)
        : null,
    maxClaimsPerUserPerDay: normalizeInteger(
      input.maxClaimsPerUserPerDay,
      DEFAULT_DAILY_REDEMPTION_DROP_CONFIG.maxClaimsPerUserPerDay,
      1,
      10,
    ),
    requireEmailVerified: normalizeBoolean(
      input.requireEmailVerified,
      DEFAULT_DAILY_REDEMPTION_DROP_CONFIG.requireEmailVerified,
    ),
    minimumAccountAgeDays: normalizeInteger(
      input.minimumAccountAgeDays,
      DEFAULT_DAILY_REDEMPTION_DROP_CONFIG.minimumAccountAgeDays,
      0,
      3650,
    ),
  };
};

export const getShanghaiDateKey = (value = new Date()) => {
  const parts = getShanghaiParts(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const getShanghaiClaimDate = (value = new Date()) =>
  new Date(`${getShanghaiDateKey(value)}T00:00:00.000Z`);

export const isDailyRedemptionDropReleased = ({ drop, now = new Date() }) =>
  getShanghaiMinutes(now) >= parseReleaseMinutes(drop?.releaseTime);

export const buildDailyRedemptionGrantPlan = ({ drop, claimDateKey, now = new Date() }) => {
  const config = normalizeDailyRedemptionDropInput(drop || {});
  const expiresAt = config.pointsExpiresInMinutes
    ? new Date(toDateOrNow(now).getTime() + config.pointsExpiresInMinutes * 60 * 1000)
    : null;

  return {
    points: config.points,
    expiresAt,
    isTemporary: Boolean(expiresAt),
    description: `每日福利奖励：${config.name}（${claimDateKey}）`,
  };
};

export const resolveDailyRedemptionDropClaimState = ({
  drop,
  user,
  dayClaimCount = 0,
  userDayClaimCount = 0,
  now = new Date(),
}) => {
  const config = normalizeDailyRedemptionDropInput(drop || {});

  if (!drop || !config.enabled) {
    return {
      claimable: false,
      status: "disabled",
      message: "今日福利暂未开放",
    };
  }

  if (!user) {
    return {
      claimable: false,
      status: "unauthenticated",
      message: "请先登录后再领取",
    };
  }

  if (user.role === "admin") {
    return {
      claimable: false,
      status: "admin_excluded",
      message: "管理员账号不可领取",
    };
  }

  if (user.status && user.status !== "active") {
    return {
      claimable: false,
      status: "user_disabled",
      message: "当前账号状态不可领取",
    };
  }

  if (!isDailyRedemptionDropReleased({ drop: config, now })) {
    return {
      claimable: false,
      status: "not_released",
      message: `今日 ${config.releaseTime} 开始领取`,
    };
  }

  if (config.requireEmailVerified && !user.isVerified) {
    return {
      claimable: false,
      status: "email_unverified",
      message: "请先完成邮箱验证",
    };
  }

  if (config.minimumAccountAgeDays > 0) {
    const createdAt = toDateOrNull(user.createdAt);
    const accountAgeMs = createdAt ? toDateOrNow(now).getTime() - createdAt.getTime() : 0;
    if (accountAgeMs < config.minimumAccountAgeDays * 24 * 60 * 60 * 1000) {
      return {
        claimable: false,
        status: "account_too_new",
        message: `注册满 ${config.minimumAccountAgeDays} 天后可领取`,
      };
    }
  }

  if (dayClaimCount >= config.dailyQuota) {
    return {
      claimable: false,
      status: "sold_out",
      message: "今日已领完，明天再来",
    };
  }

  if (userDayClaimCount >= config.maxClaimsPerUserPerDay) {
    return {
      claimable: false,
      status: "already_claimed",
      message: "今日已领取",
    };
  }

  return {
    claimable: true,
    status: "claimable",
    message: "现在可以领取",
  };
};

export const getDailyRedemptionDropStatusForUser = async ({
  userId,
  now = new Date(),
  client,
} = {}) => {
  const prismaClient = client || (await getDefaultPrisma());
  const drop = await getPrimaryDailyRedemptionDrop(prismaClient);
  const claimDateKey = getShanghaiDateKey(now);
  const claimDate = getShanghaiClaimDate(now);

  if (!drop) {
    const state = resolveDailyRedemptionDropClaimState({
      drop: null,
      user: userId ? { id: userId } : null,
      now,
    });
    return buildStatusPayload({
      drop: null,
      state,
      claimDateKey,
    });
  }

  const [user, counts] = await Promise.all([
    userId
      ? prismaClient.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            role: true,
            status: true,
            isVerified: true,
            createdAt: true,
            points: true,
          },
        })
      : Promise.resolve(null),
    getClaimCounts({
      client: prismaClient,
      dropId: drop.id,
      userId,
      claimDate,
    }),
  ]);

  const state = resolveDailyRedemptionDropClaimState({
    drop,
    user,
    dayClaimCount: counts.dayClaimCount,
    userDayClaimCount: counts.userDayClaimCount,
    now,
  });

  return buildStatusPayload({
    drop,
    state,
    claimDateKey,
    claimedCount: counts.dayClaimCount,
    userClaimCount: counts.userDayClaimCount,
  });
};

export const getAdminDailyRedemptionDropOverview = async ({
  now = new Date(),
  client,
} = {}) => {
  const prismaClient = client || (await getDefaultPrisma());
  const drop = await getPrimaryDailyRedemptionDrop(prismaClient);
  const claimDate = getShanghaiClaimDate(now);
  const claimDateKey = getShanghaiDateKey(now);

  const [claimedCount, recentClaims] = drop
    ? await Promise.all([
        prismaClient.dailyRedemptionDropClaim.count({
          where: {
            dropId: drop.id,
            claimDate,
          },
        }),
        prismaClient.dailyRedemptionDropClaim.findMany({
          where: {
            dropId: drop.id,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        }),
      ])
    : [0, []];

  const config = buildDropPayload(drop);

  return {
    config,
    today: {
      claimDateKey,
      dailyQuota: config.dailyQuota,
      claimedCount,
      remainingQuota: Math.max(0, config.dailyQuota - claimedCount),
      releaseTime: config.releaseTime,
    },
    recentClaims,
  };
};

export const saveDailyRedemptionDropConfig = async ({
  input,
  client,
} = {}) => {
  const prismaClient = client || (await getDefaultPrisma());
  const normalized = normalizeDailyRedemptionDropInput(input || {});
  const existing = await getPrimaryDailyRedemptionDrop(prismaClient);

  if (existing) {
    await prismaClient.dailyRedemptionDrop.update({
      where: { id: existing.id },
      data: normalized,
    });
  } else {
    await prismaClient.dailyRedemptionDrop.create({
      data: normalized,
    });
  }

  return getAdminDailyRedemptionDropOverview({ client: prismaClient });
};

export const claimDailyRedemptionDropForUser = async ({
  userId,
  ip,
  userAgent,
  now = new Date(),
  client,
  getPointsBreakdown,
  getUserPointsBreakdown,
} = {}) => {
  const prismaClient = client || (await getDefaultPrisma());
  const resolvePointsBreakdown =
    getPointsBreakdown || getUserPointsBreakdown || (await getDefaultUserPointsBreakdown());
  const claimDateKey = getShanghaiDateKey(now);
  const claimDate = getShanghaiClaimDate(now);

  return prismaClient.$transaction(async (tx) => {
    const drop = await getPrimaryDailyRedemptionDrop(tx);

    if (!drop) {
      const state = resolveDailyRedemptionDropClaimState({
        drop: null,
        user: userId ? { id: userId } : null,
        now,
      });
      return {
        claimed: false,
        ...buildStatusPayload({
          drop: null,
          state,
          claimDateKey,
        }),
      };
    }

    const lockKey = getAdvisoryLockKey(drop.id, claimDateKey);
    if (typeof tx.$executeRawUnsafe === "function") {
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${lockKey})`);
    }

    const [user, counts] = await Promise.all([
      tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          status: true,
          isVerified: true,
          createdAt: true,
          points: true,
        },
      }),
      getClaimCounts({
        client: tx,
        dropId: drop.id,
        userId,
        claimDate,
      }),
    ]);

    const state = resolveDailyRedemptionDropClaimState({
      drop,
      user,
      dayClaimCount: counts.dayClaimCount,
      userDayClaimCount: counts.userDayClaimCount,
      now,
    });

    if (!state.claimable) {
      return {
        claimed: false,
        ...buildStatusPayload({
          drop,
          state,
          claimDateKey,
          claimedCount: counts.dayClaimCount,
          userClaimCount: counts.userDayClaimCount,
        }),
      };
    }

    const grantPlan = buildDailyRedemptionGrantPlan({
      drop,
      claimDateKey,
      now,
    });

    let permanentPoints = user.points;
    if (!grantPlan.isTemporary) {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          points: {
            increment: grantPlan.points,
          },
        },
      });
      permanentPoints = Number(updatedUser?.points ?? user.points + grantPlan.points);
    }

    const history = await tx.pointsHistory.create({
      data: {
        userId: user.id,
        points: grantPlan.points,
        type: POINT_TYPES.dailyRedemptionDrop,
        description: grantPlan.description,
        relatedId: drop.id,
        expiresAt: grantPlan.expiresAt,
      },
    });

    const claim = await tx.dailyRedemptionDropClaim.create({
      data: {
        dropId: drop.id,
        userId: user.id,
        claimDate,
        claimNo: counts.userDayClaimCount + 1,
        points: grantPlan.points,
        expiresAt: grantPlan.expiresAt,
        pointsHistoryId: history.id,
        ipHash: hashRequestValue(ip),
        userAgentHash: hashRequestValue(userAgent),
      },
    });

    const pointsBreakdown = await resolvePointsBreakdown(user.id, {
      client: tx,
      permanentPoints,
      now,
    });

    return {
      claimed: true,
      claim,
      history,
      pointsBreakdown,
      totalPoints: pointsBreakdown.effectivePoints,
      permanentPoints: pointsBreakdown.permanentPoints,
      temporaryPoints: pointsBreakdown.temporaryPoints,
      effectivePoints: pointsBreakdown.effectivePoints,
      nextExpiringAt: pointsBreakdown.nextExpiringAt,
      ...buildStatusPayload({
        drop,
        state: {
          claimable: false,
          status: "already_claimed",
          message: "领取成功",
        },
        claimDateKey,
        claimedCount: counts.dayClaimCount + 1,
        userClaimCount: counts.userDayClaimCount + 1,
      }),
    };
  });
};
