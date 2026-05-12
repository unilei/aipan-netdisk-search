<script setup>
useSeoMeta({
  title: 'AIPAN电视 - 免费在线电视直播平台 | 央视卫视港台国际频道',
  description: 'AIPAN电视提供免费在线电视直播服务，包含央视、卫视、港台、国际、体育等各类频道。',
  keywords: '在线电视,电视直播,免费直播,央视直播,卫视直播,港台电视,国际频道,体育直播',
});

import Hls from "hls.js";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { ElMessage } from "element-plus";
import Header from "~/components/layout/netdisk/Header.vue";

definePageMeta({ layout: "custom" });

const tvSources = ref([]);
const videoPlayer = ref(null);
const videoSrc = ref("");
const videoPlayStatus = ref(false);
const videoLoading = ref(false);
const videoMuted = ref(false);
const isPlaying = ref(false);
const sidebarOpen = ref(true);
const channelSearch = ref("");
const customUrl = ref("");
let player = null;
let hls = null;

const { accessStatus, ensureAccess } = useFeatureAccess("tvLive");
const shouldShowAccessNotice = computed(() => {
  return accessStatus.value.loading ||
    (accessStatus.value.checked && !accessStatus.value.allowed);
});

const getAuthHeaders = () => {
  const token = useCookie("token").value;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const isM3u8 = (url) => /\.m3u8(\?.*)?$/.test(url);

const filteredTvSources = computed(() => {
  if (!channelSearch.value) return tvSources.value;
  const q = channelSearch.value.toLowerCase();
  return tvSources.value.filter(item => item.name?.toLowerCase().includes(q));
});

const currentChannelName = computed(() => {
  if (!videoPlayStatus.value) return "";
  const ch = tvSources.value.find(s => s.url === videoSrc.value);
  return ch?.name ?? "自定义源";
});

const getTvSources = async (skipAccessCheck = false) => {
  try {
    if (!skipAccessCheck) {
      const access = await ensureAccess();
      if (!access.allowed) return;
    }

    const res = await $fetch("/api/tv/sources", {
      headers: getAuthHeaders(),
    });
    if (videoSrc.value === "") videoSrc.value = res[0]?.url ?? "";
    tvSources.value = res;
  } catch (e) {
    console.error("Error fetching TV sources:", e);
    ElMessage.error("直播源加载失败，请稍后重试");
  }
};

const loadHLS = (url) => {
  const showSpinner = () => { videoLoading.value = true; };
  const hideSpinner = () => { videoLoading.value = false; videoPlayStatus.value = true; };

  let type = "";
  if (url.includes(".mp4")) type = "video/mp4";
  else if (url.includes(".mkv")) type = "video/webm";
  else if (url.includes(".ts")) type = "video/mp2t";
  else if (isM3u8(url)) type = "application/x-mpegURL";

  if (!player) {
    player = videojs(videoPlayer.value, { liveui: true });
    player.on("ended", () => { player.currentTime(0); player.play(); });
    player.on("waiting", showSpinner);
    player.on("playing", () => { hideSpinner(); isPlaying.value = true; });
    player.on("error", hideSpinner);
  }

  if (type === "application/x-mpegURL" && Hls.isSupported()) {
    if (!hls) {
      hls = new Hls();
      hls.attachMedia(videoPlayer.value);
      hls.on(Hls.Events.MANIFEST_LOADING, showSpinner);
      hls.on(Hls.Events.MANIFEST_PARSED, hideSpinner);
      hls.on(Hls.Events.ERROR, hideSpinner);
    }
    hls.loadSource(url);
  } else {
    if (hls) { hls.destroy(); hls = null; }
    showSpinner();
    player.src({ type, src: url });
  }
  player.play();
  player.on("loadeddata", hideSpinner);
  player.on("loadedmetadata", hideSpinner);
};

const handleSwitchSource = (url) => {
  videoLoading.value = true;
  videoSrc.value = url;
  loadHLS(url);
  videoPlayStatus.value = true;
  isPlaying.value = true;
  if (window.innerWidth < 1024) sidebarOpen.value = false;
};

const handleSwitchVideoStatus = () => {
  if (!player || !videoPlayStatus.value) return;
  if (videoPlayer.value.paused) { videoPlayer.value.play(); isPlaying.value = true; }
  else { videoPlayer.value.pause(); isPlaying.value = false; }
};

const handlePowerSwitch = () => {
  if (!videoPlayStatus.value) {
    videoPlayStatus.value = true;
    if (videoSrc.value) { loadHLS(videoSrc.value); isPlaying.value = true; }
  } else {
    videoPlayStatus.value = false; isPlaying.value = false;
    if (player) { player.pause(); if (hls) { hls.destroy(); hls = null; } }
  }
};

const handleFullscreen = () => {
  if (!player) return;
  player.isFullscreen() ? player.exitFullscreen() : player.requestFullscreen();
};

const handleMute = () => {
  if (!player) return;
  videoMuted.value = !videoMuted.value;
  player.muted(videoMuted.value);
};

const handleCustomUrlPlay = () => {
  if (customUrl.value.trim()) handleSwitchSource(customUrl.value.trim());
};

onMounted(async () => {
  const access = await ensureAccess();
  if (!access.allowed) return;

  getTvSources(true);
});

onBeforeUnmount(() => {
  if (hls) { hls.destroy(); hls = null; }
  if (player) { player.dispose(); player = null; }
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-gray-950 dark:text-slate-100">
    <Header />

    <main class="mx-auto flex w-full max-w-screen-xl flex-1 flex-col px-4 pb-8 pt-20 md:px-6">
      <FeatureAccessNotice
        v-if="shouldShowAccessNotice"
        :status="accessStatus"
        feature-name="TV 直播"
      />

      <div
        v-else
        class="grid gap-4 transition-all duration-200"
        :class="sidebarOpen ? 'lg:grid-cols-[minmax(0,1fr)_340px]' : 'lg:grid-cols-1'"
      >
        <div class="min-w-0">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <h1 class="text-base font-semibold text-slate-950 dark:text-white">电视直播</h1>
              <p class="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {{ currentChannelName || "选择频道开始播放" }}
              </p>
            </div>
            <button
              class="hidden h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/5 lg:flex"
              @click="sidebarOpen = !sidebarOpen"
            >
              <i class="fa-solid fa-list"></i>
              频道
            </button>
          </div>

          <div class="overflow-hidden rounded-lg border border-slate-200 bg-black shadow-sm dark:border-white/10">
            <div class="relative w-full bg-black" style="aspect-ratio:16/9">
              <video ref="videoPlayer" id="aipan-video" class="video-js w-full h-full"></video>

              <Transition name="fade">
                <div v-if="!videoPlayStatus" class="absolute inset-0 z-10 flex items-center justify-center bg-black">
                  <div class="text-center select-none">
                    <div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400">
                      <i class="fa-solid fa-play text-xl"></i>
                    </div>
                    <p class="text-sm font-medium text-slate-400">选择频道开始播放</p>
                    <p class="mt-1 text-xs text-slate-600">支持直播源和自定义视频链接</p>
                  </div>
                </div>
              </Transition>

              <Transition name="fade">
                <div v-if="videoLoading" class="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
                  <div class="h-10 w-10 rounded-full border-2 border-blue-400/25 border-t-blue-400 animate-spin"></div>
                </div>
              </Transition>

              <div v-if="videoPlayStatus && !videoLoading"
                class="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-1 text-[11px] font-semibold text-white">
                <span class="h-1.5 w-1.5 rounded-full bg-white"></span>LIVE
              </div>

              <button
                class="absolute right-3 top-3 hidden h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-black/50 text-slate-300 transition-colors hover:bg-white/10 lg:flex"
                @click="sidebarOpen = !sidebarOpen">
                <i class="fa-solid fa-list text-sm"></i>
              </button>
            </div>

            <div class="flex items-center justify-between border-t border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-900">
              <div class="flex items-center gap-2">
                <button @click="handlePowerSwitch" :title="videoPlayStatus ? '关闭' : '开启'"
                  class="relative flex h-9 w-9 items-center justify-center rounded-md border transition-colors"
                  :class="videoPlayStatus
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10'">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18.36 6.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
                  </svg>
                </button>

                <button @click="handleSwitchVideoStatus" :title="isPlaying ? '暂停' : '播放'"
                  class="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10">
                  <svg v-if="!isPlaying" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                </button>

                <button @click="handleMute" :title="videoMuted ? '取消静音' : '静音'"
                  class="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10">
                  <svg v-if="!videoMuted" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
                  </svg>
                  <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                  </svg>
                </button>
              </div>

              <div class="flex min-w-0 flex-1 justify-center px-4">
                <span v-if="currentChannelName"
                  class="max-w-xs truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {{ currentChannelName }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <button @click="handleFullscreen" title="全屏"
                  class="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                    <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                  </svg>
                </button>

                <button @click="sidebarOpen = !sidebarOpen" title="频道列表"
                  class="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 lg:hidden">
                  <i class="fa-solid fa-list text-sm"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <i class="fa-solid fa-link flex-shrink-0 text-slate-400"></i>
            <input v-model="customUrl" type="url" placeholder="粘贴直播/视频链接直接播放..."
              class="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
              @keydown.enter="handleCustomUrlPlay" />
            <button @click="handleCustomUrlPlay"
              class="flex h-9 flex-shrink-0 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500">
              <i class="fa-solid fa-play text-xs"></i>
              播放
            </button>
          </div>
        </div>

        <aside
          class="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 dark:border-white/10 dark:bg-slate-900"
          :class="[
            sidebarOpen ? 'opacity-100' : 'hidden opacity-0 pointer-events-none',
            'max-h-[calc(100vh-100px)] lg:flex',
            'max-lg:fixed max-lg:top-0 max-lg:right-0 max-lg:z-50 max-lg:h-screen max-lg:max-h-screen max-lg:w-80 max-lg:max-w-[88vw] max-lg:rounded-none max-lg:rounded-l-lg',
            sidebarOpen ? 'max-lg:translate-x-0' : 'max-lg:translate-x-full',
          ]"
        >
          <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">
            <div>
              <h2 class="text-sm font-semibold text-slate-900 dark:text-white">频道列表</h2>
              <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">共 {{ filteredTvSources.length }} 个频道</p>
            </div>
            <button @click="sidebarOpen = false"
              class="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="relative m-3 flex-shrink-0">
            <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
            <input v-model="channelSearch" type="text" placeholder="搜索频道名称..."
              class="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-300 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:border-blue-500/50" />
          </div>

          <div class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3">
            <button v-for="(item, index) in filteredTvSources" :key="index"
              @click="handleSwitchSource(item.url)"
              class="flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors"
              :class="item.url === videoSrc && videoPlayStatus
                ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300'
                : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 dark:text-slate-400 dark:hover:border-white/10 dark:hover:bg-white/5'">
              <span class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-xs font-semibold"
                :class="item.url === videoSrc && videoPlayStatus
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500'">
                {{ index + 1 }}
              </span>
              <span class="flex-1 truncate">{{ item.name }}</span>
              <span v-if="item.url === videoSrc && videoPlayStatus"
                class="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500"></span>
            </button>
          </div>
        </aside>
      </div>
    </main>

    <Transition name="fade">
      <div v-if="sidebarOpen" class="fixed inset-0 z-40 bg-slate-900/35 lg:hidden" @click="sidebarOpen = false"></div>
    </Transition>
  </div>
</template>

<style scoped>
:deep(.video-js .vjs-control-bar),
:deep(.video-js .vjs-big-play-button),
:deep(.video-js .vjs-error-display) {
  display: none !important;
}
:deep(.video-js) {
  width: 100% !important;
  height: 100% !important;
  background: #000;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.22s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
</style>
