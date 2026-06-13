const RELEASE_SEEN_STORAGE_KEY = "aipan:last-seen-release";
const RELEASE_NOTICE_IDLE_DELAY = 8000;
const RELEASE_NOTICE_INTERACTION_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll"];

type LatestReleaseResponse = {
  success: boolean;
  data?: {
    identity?: string;
    title?: string;
  } | null;
};

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
      const fetchJson = $fetch as (request: string, options?: Record<string, unknown>) => Promise<unknown>;
      const res = (await fetchJson("/api/releases/latest")) as LatestReleaseResponse;
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

  let releaseNoticeTimer: number | null = null;

  const cleanupReleaseNoticeSchedule = () => {
    if (!process.client) return;

    if (releaseNoticeTimer !== null) {
      window.clearTimeout(releaseNoticeTimer);
      releaseNoticeTimer = null;
    }

    RELEASE_NOTICE_INTERACTION_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, runScheduledReleaseNoticeLoad);
    });
  };

  const runScheduledReleaseNoticeLoad = () => {
    cleanupReleaseNoticeSchedule();
    void loadLatestRelease();
  };

  onMounted(() => {
    RELEASE_NOTICE_INTERACTION_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, runScheduledReleaseNoticeLoad, { once: true, passive: true });
    });
    releaseNoticeTimer = window.setTimeout(runScheduledReleaseNoticeLoad, RELEASE_NOTICE_IDLE_DELAY);
    window.addEventListener("aipan:release-seen", syncReleaseReadState);
  });

  onBeforeUnmount(() => {
    cleanupReleaseNoticeSchedule();
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
