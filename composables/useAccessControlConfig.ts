export const DEFAULT_FEATURE_ACCESS_CONFIG = {
  enabled: true,
  requireLogin: true,
  minPoints: 10000,
  protectedFeatures: {
    netdiskSearch: true,
    aiSearch: true,
    tvLive: true,
    tvbox: true,
    dailyMovieResources: true,
    music: true,
  },
};

export type FeatureAccessConfig = typeof DEFAULT_FEATURE_ACCESS_CONFIG;
export type FeatureAccessKey = keyof FeatureAccessConfig["protectedFeatures"];

let pendingConfigRequest: Promise<FeatureAccessConfig> | null = null;

const normalizeAccessControlConfig = (
  config?: Partial<FeatureAccessConfig> | null,
): FeatureAccessConfig => {
  const protectedFeatures =
    config?.protectedFeatures && typeof config.protectedFeatures === "object"
      ? config.protectedFeatures
      : {};

  return {
    enabled:
      typeof config?.enabled === "boolean"
        ? config.enabled
        : DEFAULT_FEATURE_ACCESS_CONFIG.enabled,
    requireLogin:
      typeof config?.requireLogin === "boolean"
        ? config.requireLogin
        : DEFAULT_FEATURE_ACCESS_CONFIG.requireLogin,
    minPoints: Number.isFinite(Number(config?.minPoints))
      ? Math.max(0, Math.floor(Number(config?.minPoints)))
      : DEFAULT_FEATURE_ACCESS_CONFIG.minPoints,
    protectedFeatures: {
      netdiskSearch:
        protectedFeatures.netdiskSearch ??
        DEFAULT_FEATURE_ACCESS_CONFIG.protectedFeatures.netdiskSearch,
      aiSearch:
        protectedFeatures.aiSearch ??
        DEFAULT_FEATURE_ACCESS_CONFIG.protectedFeatures.aiSearch,
      tvLive:
        protectedFeatures.tvLive ??
        DEFAULT_FEATURE_ACCESS_CONFIG.protectedFeatures.tvLive,
      tvbox:
        protectedFeatures.tvbox ??
        DEFAULT_FEATURE_ACCESS_CONFIG.protectedFeatures.tvbox,
      dailyMovieResources:
        protectedFeatures.dailyMovieResources ??
        DEFAULT_FEATURE_ACCESS_CONFIG.protectedFeatures.dailyMovieResources,
      music:
        protectedFeatures.music ??
        DEFAULT_FEATURE_ACCESS_CONFIG.protectedFeatures.music,
    },
  };
};

export const useAccessControlConfig = () => {
  const configState = useState<FeatureAccessConfig | null>(
    "feature-access-config",
    () => null,
  );
  const loadedState = useState("feature-access-config-loaded", () => false);
  const loadingState = useState("feature-access-config-loading", () => false);

  const setAccessControlConfig = (
    config: Partial<FeatureAccessConfig> | null | undefined,
  ) => {
    configState.value = normalizeAccessControlConfig(config);
    loadedState.value = true;
  };

  const resetAccessControlConfig = () => {
    configState.value = null;
    loadedState.value = false;
    pendingConfigRequest = null;
  };

  const ensureAccessControlConfig = async (
    options: { force?: boolean } = {},
  ) => {
    if (configState.value && !options.force) {
      return configState.value;
    }

    if (pendingConfigRequest) {
      return pendingConfigRequest;
    }

    loadingState.value = true;

    pendingConfigRequest = $fetch<{ data?: FeatureAccessConfig }>(
      "/api/access-control/config",
      { timeout: 5000 },
    )
      .then((res) => {
        const config = normalizeAccessControlConfig(res?.data);
        configState.value = config;
        loadedState.value = true;
        return config;
      })
      .catch((error) => {
        console.error("获取访问限制配置失败，使用默认限制:", error);
        const config = normalizeAccessControlConfig(
          configState.value || DEFAULT_FEATURE_ACCESS_CONFIG,
        );
        configState.value = config;
        loadedState.value = true;
        return config;
      })
      .finally(() => {
        pendingConfigRequest = null;
        loadingState.value = false;
      });

    return pendingConfigRequest;
  };

  const refreshAccessControlConfig = () => {
    return ensureAccessControlConfig({ force: true });
  };

  return {
    accessControlConfig: configState,
    accessControlConfigLoaded: loadedState,
    accessControlConfigLoading: loadingState,
    ensureAccessControlConfig,
    refreshAccessControlConfig,
    resetAccessControlConfig,
    setAccessControlConfig,
  };
};
