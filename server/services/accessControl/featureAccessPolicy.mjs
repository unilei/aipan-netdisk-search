export const FEATURE_ACCESS_SETTING_KEY = "feature_access_control";

export const FEATURE_ACCESS_KEYS = {
  netdiskSearch: "netdiskSearch",
  aiSearch: "aiSearch",
  tvLive: "tvLive",
  alist: "alist",
  tvbox: "tvbox",
  dailyMovieResources: "dailyMovieResources",
  music: "music",
};

export const DEFAULT_FEATURE_ACCESS_CONFIG = {
  enabled: true,
  requireLogin: true,
  minPoints: 10000,
  protectedFeatures: {
    netdiskSearch: true,
    aiSearch: true,
    tvLive: true,
    alist: true,
    tvbox: true,
    dailyMovieResources: true,
    music: true,
  },
};

const normalizeBoolean = (value, fallback) => {
  return typeof value === "boolean" ? value : fallback;
};

const normalizeMinPoints = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_FEATURE_ACCESS_CONFIG.minPoints;
  }

  return Math.min(100000000, Math.max(0, Math.floor(parsed)));
};

export const normalizeFeatureAccessConfig = (input = {}) => {
  const inputProtectedFeatures =
    input.protectedFeatures && typeof input.protectedFeatures === "object"
      ? input.protectedFeatures
      : {};

  return {
    enabled: normalizeBoolean(input.enabled, DEFAULT_FEATURE_ACCESS_CONFIG.enabled),
    requireLogin: normalizeBoolean(
      input.requireLogin,
      DEFAULT_FEATURE_ACCESS_CONFIG.requireLogin,
    ),
    minPoints: normalizeMinPoints(input.minPoints),
    protectedFeatures: {
      netdiskSearch: normalizeBoolean(
        inputProtectedFeatures.netdiskSearch,
        DEFAULT_FEATURE_ACCESS_CONFIG.protectedFeatures.netdiskSearch,
      ),
      aiSearch: normalizeBoolean(
        inputProtectedFeatures.aiSearch,
        DEFAULT_FEATURE_ACCESS_CONFIG.protectedFeatures.aiSearch,
      ),
      tvLive: normalizeBoolean(
        inputProtectedFeatures.tvLive,
        DEFAULT_FEATURE_ACCESS_CONFIG.protectedFeatures.tvLive,
      ),
      alist: normalizeBoolean(
        inputProtectedFeatures.alist,
        DEFAULT_FEATURE_ACCESS_CONFIG.protectedFeatures.alist,
      ),
      tvbox: normalizeBoolean(
        inputProtectedFeatures.tvbox,
        DEFAULT_FEATURE_ACCESS_CONFIG.protectedFeatures.tvbox,
      ),
      dailyMovieResources: normalizeBoolean(
        inputProtectedFeatures.dailyMovieResources,
        DEFAULT_FEATURE_ACCESS_CONFIG.protectedFeatures.dailyMovieResources,
      ),
      music: normalizeBoolean(
        inputProtectedFeatures.music,
        DEFAULT_FEATURE_ACCESS_CONFIG.protectedFeatures.music,
      ),
    },
  };
};

export const resolveFeatureKeys = (featureKeys) => {
  return Array.isArray(featureKeys) ? featureKeys : [featureKeys];
};

export const shouldProtectFeatures = (config, featureKeys) => {
  if (!config.enabled) return false;

  return resolveFeatureKeys(featureKeys).some(
    (featureKey) => config.protectedFeatures[featureKey] !== false,
  );
};

export const resolveFeatureAccessKeysForPath = (requestPath = "") => {
  if (requestPath.startsWith("/api/sources/")) {
    return [
      FEATURE_ACCESS_KEYS.netdiskSearch,
      FEATURE_ACCESS_KEYS.aiSearch,
      FEATURE_ACCESS_KEYS.dailyMovieResources,
    ];
  }

  if (requestPath === "/api/tv/sources") {
    return [FEATURE_ACCESS_KEYS.tvLive];
  }

  if (requestPath.startsWith("/api/alist/")) {
    return [FEATURE_ACCESS_KEYS.alist];
  }

  if (
    requestPath === "/api/tvbox" ||
    requestPath.startsWith("/api/tvbox/") ||
    requestPath === "/api/cache/tvbox"
  ) {
    return [FEATURE_ACCESS_KEYS.tvbox];
  }

  if (
    requestPath.startsWith("/api/music/") &&
    requestPath !== "/api/music/password"
  ) {
    return [FEATURE_ACCESS_KEYS.music];
  }

  return [];
};

const allowAccess = (config, currentPoints = 0) => ({
  allowed: true,
  statusCode: 200,
  code: "",
  message: "",
  requiredPoints: Number(config.minPoints || 0),
  currentPoints,
  needsUser: false,
});

const blockAccess = (config, options) => ({
  allowed: false,
  statusCode: options.statusCode,
  code: options.code,
  message: options.message,
  requiredPoints: Number(config.minPoints || 0),
  currentPoints: Number(options.currentPoints || 0),
  needsUser: false,
});

export const evaluateFeatureAccessPolicy = ({
  config,
  featureKeys,
  token = "",
  decoded = null,
  user,
  userLoaded = false,
}) => {
  if (!shouldProtectFeatures(config, featureKeys)) {
    return allowAccess(config);
  }

  const requiresToken = config.requireLogin || config.minPoints > 0;

  if (requiresToken && !token) {
    return blockAccess(config, {
      statusCode: 401,
      code: "LOGIN_REQUIRED",
      message: "请先登录后再访问该功能",
    });
  }

  if (!requiresToken && !token) {
    return allowAccess(config);
  }

  const userId = Number(decoded?.userId);
  if (!decoded || !Number.isInteger(userId)) {
    return blockAccess(config, {
      statusCode: 401,
      code: "LOGIN_REQUIRED",
      message: "登录状态已失效，请重新登录",
    });
  }

  if (!userLoaded) {
    return {
      ...allowAccess(config),
      needsUser: true,
      userId,
    };
  }

  if (!user) {
    return blockAccess(config, {
      statusCode: 401,
      code: "LOGIN_REQUIRED",
      message: "登录状态已失效，请重新登录",
    });
  }

  const currentPoints = Number(user.points || 0);
  if (config.minPoints > 0 && currentPoints < config.minPoints) {
    return blockAccess(config, {
      statusCode: 403,
      code: "POINTS_REQUIRED",
      message: `当前积分不足，访问该功能需要 ${config.minPoints} 积分`,
      currentPoints,
    });
  }

  return allowAccess(config, currentPoints);
};
