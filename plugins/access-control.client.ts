import { useUserStore } from "~/stores/user";

export default defineNuxtPlugin(() => {
  const userStore = useUserStore();
  const token = useCookie("token");
  const {
    ensureAccessControlConfig,
    resetAccessControlConfig,
  } = useAccessControlConfig();

  const loadSessionConfig = () => {
    if (!token.value || !userStore.loggedIn) return;

    ensureAccessControlConfig().catch((error) => {
      console.warn("Failed to load access control config:", error);
    });
  };

  onNuxtReady(loadSessionConfig);

  watch(
    () => [token.value, userStore.loggedIn] as const,
    ([currentToken, loggedIn], [previousToken, wasLoggedIn]) => {
      if (currentToken && loggedIn && (!previousToken || !wasLoggedIn)) {
        loadSessionConfig();
      }

      if (!currentToken) {
        resetAccessControlConfig();
      }
    },
  );
});
