const RELEASE_SEEN_STORAGE_KEY = "aipan:last-seen-release";

export const useReleaseNotice = () => {
  const route = useRoute();
  const latestReleaseIdentity = ref("");
  const latestReleaseTitle = ref("");
  const hasUnreadRelease = ref(false);

  const syncReleaseReadState = () => {
    if (!process.client || !latestReleaseIdentity.value) return;
    hasUnreadRelease.value =
      localStorage.getItem(RELEASE_SEEN_STORAGE_KEY) !== latestReleaseIdentity.value;
  };

  const markReleaseRead = () => {
    if (process.client && latestReleaseIdentity.value) {
      localStorage.setItem(RELEASE_SEEN_STORAGE_KEY, latestReleaseIdentity.value);
      hasUnreadRelease.value = false;
    }
  };

  const loadLatestRelease = async () => {
    try {
      const res = await $fetch("/api/releases/latest");
      latestReleaseIdentity.value = res?.data?.identity || "";
      latestReleaseTitle.value = res?.data?.title || "";
      syncReleaseReadState();
      if (route.path === "/releases") {
        markReleaseRead();
      }
    } catch (error) {
      latestReleaseIdentity.value = "";
      latestReleaseTitle.value = "";
      hasUnreadRelease.value = false;
    }
  };

  onMounted(() => {
    loadLatestRelease();
    window.addEventListener("aipan:release-seen", syncReleaseReadState);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("aipan:release-seen", syncReleaseReadState);
  });

  watch(
    () => route.path,
    (path) => {
      if (path === "/releases") {
        markReleaseRead();
      }
    },
  );

  return {
    latestReleaseTitle,
    hasUnreadRelease,
    markReleaseRead,
  };
};
