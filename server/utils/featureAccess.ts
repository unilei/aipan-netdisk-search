import { createError, getHeader } from "h3";
import type { H3Event } from "h3";
import prisma from "~/lib/prisma";
import { verifyToken } from "~/server/model/user";
import { getUserPointsBreakdown } from "~/server/services/points/userPoints";
import {
  DEFAULT_FEATURE_ACCESS_CONFIG,
  evaluateFeatureAccessPolicy,
  FEATURE_ACCESS_KEYS,
  FEATURE_ACCESS_SETTING_KEY,
  normalizeFeatureAccessConfig,
  shouldProtectFeatures,
} from "~/server/services/accessControl/featureAccessPolicy.mjs";

export {
  DEFAULT_FEATURE_ACCESS_CONFIG,
  FEATURE_ACCESS_KEYS,
  FEATURE_ACCESS_SETTING_KEY,
  normalizeFeatureAccessConfig,
  shouldProtectFeatures,
};

export type FeatureAccessKey =
  | "netdiskSearch"
  | "aiSearch"
  | "tvLive"
  | "alist"
  | "tvbox"
  | "dailyMovieResources"
  | "music";

type ProtectedFeatures = Record<FeatureAccessKey, boolean>;

export interface FeatureAccessConfig {
  enabled: boolean;
  requireLogin: boolean;
  minPoints: number;
  protectedFeatures: ProtectedFeatures;
}

const parseStoredConfig = (value?: string | null) => {
  if (!value) return {};

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("访问控制配置解析失败，使用默认配置:", error);
    return {};
  }
};

export const getFeatureAccessConfig = async () => {
  const settings = await prisma.systemSettings.findUnique({
    where: { key: FEATURE_ACCESS_SETTING_KEY },
  });

  if (!settings) {
    return DEFAULT_FEATURE_ACCESS_CONFIG;
  }

  const storedConfig = parseStoredConfig(settings.value);

  return normalizeFeatureAccessConfig({
    ...storedConfig,
    enabled: settings.isEnabled ?? storedConfig.enabled,
  });
};

export const saveFeatureAccessConfig = async (
  input: Partial<FeatureAccessConfig>,
) => {
  const config = normalizeFeatureAccessConfig(input);

  await prisma.systemSettings.upsert({
    where: {
      key: FEATURE_ACCESS_SETTING_KEY,
    },
    update: {
      value: JSON.stringify(config),
      group: "access",
      description: "核心功能访问限制配置",
      isEnabled: config.enabled,
    },
    create: {
      key: FEATURE_ACCESS_SETTING_KEY,
      value: JSON.stringify(config),
      group: "access",
      description: "核心功能访问限制配置",
      isEnabled: config.enabled,
    },
  });

  return config;
};

const getBearerToken = (event: H3Event) => {
  const authHeader = getHeader(event, "authorization");
  if (!authHeader) return "";

  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return "";
  }

  return token;
};

const throwFeatureAccessError = (decision: {
  statusCode: number;
  code: string;
  message: string;
  requiredPoints: number;
  currentPoints: number;
}) => {
  throw createError({
    statusCode: decision.statusCode,
    statusMessage: decision.code,
    message: decision.message,
    data: {
      code: decision.code,
      requiredPoints: decision.requiredPoints,
      currentPoints: decision.currentPoints,
    },
  });
};

export const assertFeatureAccess = async (
  event: H3Event,
  featureKeys: FeatureAccessKey | FeatureAccessKey[],
) => {
  const config = await getFeatureAccessConfig();

  const token = getBearerToken(event);
  const decoded = token ? verifyToken(token) : null;

  const initialDecision = evaluateFeatureAccessPolicy({
    config,
    featureKeys,
    token,
    decoded,
  });

  if (!initialDecision.allowed && !initialDecision.needsUser) {
    throwFeatureAccessError(initialDecision);
  }

  if (!initialDecision.needsUser) {
    return {
      allowed: true,
      config,
      user: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: initialDecision.userId },
    select: {
      id: true,
      role: true,
      points: true,
    },
  });
  const pointsBreakdown = user
    ? await getUserPointsBreakdown(user.id, {
        permanentPoints: user.points,
      })
    : null;

  const finalDecision = evaluateFeatureAccessPolicy({
    config,
    featureKeys,
    token,
    decoded,
    user: user
      ? {
          ...user,
          points: pointsBreakdown?.effectivePoints || 0,
        }
      : user,
    userLoaded: true,
  });

  if (!finalDecision.allowed) {
    throwFeatureAccessError(finalDecision);
  }

  if (!user) {
    throwFeatureAccessError({
      statusCode: 401,
      code: "LOGIN_REQUIRED",
      message: "请先登录后再访问该功能",
      requiredPoints: config.minPoints,
      currentPoints: 0,
    });
  }

  const featureUser = {
    ...user,
    points: finalDecision.currentPoints,
    pointsBreakdown,
  };

  event.context.user = {
    ...decoded,
    userId: user.id,
    role: decoded.role || user.role,
  };
  event.context.featureAccess = {
    config,
    user: featureUser,
  };

  return {
    allowed: true,
    config,
    user: featureUser,
  };
};
