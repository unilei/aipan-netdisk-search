import { useUserStore } from "~/stores/user";

export default defineNuxtPlugin(() => {
  const userStore = useUserStore();
  const token = useCookie("token");

  const warmUserSession = () => {
    if (token.value) {
      userStore.ensureUserSession({ clearOnFailure: false }).catch((error) => {
        console.warn("Failed to warm user session:", error);
      });
      return;
    }

    if (userStore.loggedIn || userStore.user || userStore.token) {
      userStore.clearUser();
    }
  };

  onNuxtReady(warmUserSession);

  watch(
    () => token.value,
    (currentToken, previousToken) => {
      if (currentToken && currentToken !== previousToken) {
        warmUserSession();
      }

      if (!currentToken && previousToken) {
        userStore.clearUser();
      }
    },
  );
});
