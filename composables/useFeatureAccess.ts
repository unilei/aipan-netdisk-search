import { useUserStore } from "~/stores/user";
import {
  DEFAULT_FEATURE_ACCESS_CONFIG,
  type FeatureAccessConfig,
  type FeatureAccessKey,
  useAccessControlConfig,
} from "~/composables/useAccessControlConfig";

type AccessReason = "" | "login" | "points" | "error";

interface FeatureAccessStatus {
  checked: boolean;
  loading: boolean;
  allowed: boolean;
  reason: AccessReason;
  requiredPoints: number;
  currentPoints: number;
}

const createAllowedStatus = (
  config = DEFAULT_FEATURE_ACCESS_CONFIG,
): FeatureAccessStatus => ({
  checked: true,
  loading: false,
  allowed: true,
  reason: "",
  requiredPoints: Number(config.minPoints || 0),
  currentPoints: 0,
});

const createBlockedStatus = (
  reason: AccessReason,
  config = DEFAULT_FEATURE_ACCESS_CONFIG,
  currentPoints = 0,
): FeatureAccessStatus => ({
  checked: true,
  loading: false,
  allowed: false,
  reason,
  requiredPoints: Number(config.minPoints || 0),
  currentPoints,
});

export const useFeatureAccess = (featureKey: FeatureAccessKey) => {
  const route = useRoute();
  const userStore = useUserStore();
  const {
    accessControlConfig,
    accessControlConfigLoaded,
    ensureAccessControlConfig,
    refreshAccessControlConfig,
    resetAccessControlConfig,
    setAccessControlConfig,
  } = useAccessControlConfig();
  const accessStatus = ref<FeatureAccessStatus>({
    checked: false,
    loading: true,
    allowed: false,
    reason: "",
    requiredPoints: DEFAULT_FEATURE_ACCESS_CONFIG.minPoints,
    currentPoints: 0,
  });

  const refreshUserIfNeeded = async () => {
    const token = useCookie("token").value;
    if (!token) {
      return false;
    }

    if (
      !userStore.loggedIn ||
      userStore.user?.points === undefined ||
      userStore.user?.points === null
    ) {
      await userStore.safeRefreshUser();
    }

    return userStore.loggedIn && Boolean(userStore.user);
  };

  const evaluateAccess = async (
    options: { refreshConfig?: boolean } = {},
  ) => {
    const hasCachedConfig =
      Boolean(accessControlConfig.value) || accessControlConfigLoaded.value;

    accessStatus.value = {
      ...accessStatus.value,
      checked: false,
      loading: !hasCachedConfig,
    };

    const config = options.refreshConfig
      ? await refreshAccessControlConfig()
      : await ensureAccessControlConfig();
    const isProtected =
      config.enabled && config.protectedFeatures?.[featureKey] !== false;

    if (!isProtected) {
      accessStatus.value = createAllowedStatus(config);
      return accessStatus.value;
    }

    const token = useCookie("token").value;
    if ((config.requireLogin || config.minPoints > 0) && !token) {
      accessStatus.value = createBlockedStatus("login", config);
      return accessStatus.value;
    }

    const hasUser = await refreshUserIfNeeded();
    if (!hasUser) {
      accessStatus.value = createBlockedStatus("login", config);
      return accessStatus.value;
    }

    const currentPoints = Number(userStore.user?.points || 0);
    if (config.minPoints > 0 && currentPoints < config.minPoints) {
      accessStatus.value = createBlockedStatus(
        "points",
        config,
        currentPoints,
      );
      return accessStatus.value;
    }

    accessStatus.value = {
      ...createAllowedStatus(config),
      currentPoints,
    };
    return accessStatus.value;
  };

  const ensureAccess = async (
    options: { redirectToLogin?: boolean } = {},
  ) => {
    const status = await evaluateAccess();

    if (
      options.redirectToLogin &&
      !status.allowed &&
      status.reason === "login"
    ) {
      await navigateTo(
        `/login?redirect=${encodeURIComponent(route.fullPath || "/")}`,
      );
    }

    return status;
  };

  const setFeatureAccessConfig = (config: FeatureAccessConfig) => {
    setAccessControlConfig(config);
  };

  return {
    accessStatus,
    getConfig: ensureAccessControlConfig,
    refreshAccessControlConfig,
    ensureAccess,
    evaluateAccess,
    resetFeatureAccessConfig: resetAccessControlConfig,
    setFeatureAccessConfig,
  };
};
