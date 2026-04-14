<script setup>
useSeoMeta({
  title: 'AIPAN电视 - 免费在线电视直播平台 | 央视卫视港台国际频道',
  description: 'AIPAN电视提供免费在线电视直播服务，包含央视、卫视、港台、国际、体育等各类频道。',
  keywords: '在线电视,电视直播,免费直播,央视直播,卫视直播,港台电视,国际频道,体育直播',
});

import Hls from "hls.js";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { useTvStore } from "~/stores/tv";
import { ElMessage } from "element-plus";
import Header from "~/components/layout/netdisk/Header.vue";

definePageMeta({ layout: "custom" });

const tvStore = useTvStore();
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

const alistData = ref([]);
const alistPath = ref([""]);
const currentIsDir = ref(true);
const alistUrl = ref("");
const alistSettingData = ref([]);
const alistSettingShow = ref(false);
const alistCurrentPlayIndex = ref(0);
const channelCategory = ref(1);

const channelCategoryData = [
  { id: 1, name: "直播频道" },
  { id: 3, name: "Alist" },
];

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

const getTvSources = async () => {
  try {
    const res = await $fetch("https://r2cf.aipan.me/tv.json");
    if (videoSrc.value === "") videoSrc.value = res[0]?.url ?? "";
    tvSources.value = res;
  } catch (e) { console.error("Error fetching TV sources:", e); }
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

const handleSwitchChannelCategory = (id) => {
  tvStore.setTvCategory(id);
  channelCategory.value = id;
  if (id === 3) {
    alistSettingShow.value = false; currentIsDir.value = true;
    alistPath.value = [""]; tvStore.setAlistPath([""]);
    getFsList({ page: 1, password: "", path: "", per_page: 0, refresh: false });
  }
};

const getFsList = async (params) => {
  if (!alistUrl.value) { ElMessage.warning("请先选择 Alist 服务器"); return; }
  try {
    const res = await $fetch(`${alistUrl.value}/api/fs/list`, { method: "POST", body: params });
    if (res.code === 200) { alistData.value = res.data; tvStore.setAlistData(res.data); }
    else ElMessage.error(res.message || "获取文件列表失败");
  } catch (e) { ElMessage.error("网络请求失败"); }
};

const getFsGet = async (params) => {
  if (!alistUrl.value) { ElMessage.warning("请先选择 Alist 服务器"); return; }
  try {
    const res = await $fetch(`${alistUrl.value}/api/fs/get`, { method: "POST", body: params });
    if (res.code === 200) {
      const sign = res.data.sign;
      const pathParts = alistPath.value.map(p => encodeURIComponent(p)).join("/");
      const url = `${alistUrl.value}/d${pathParts}?sign=${sign}`;
      videoSrc.value = url; loadHLS(url);
    } else ElMessage.error(res.message || "获取文件失败");
  } catch (e) { ElMessage.error("网络请求失败"); }
};

const handleClickAlist = (item, index) => {
  if (item.is_dir) {
    videoPlayStatus.value = false;
    currentIsDir.value ? alistPath.value.push(item.name) : (alistPath.value.pop(), alistPath.value.push(item.name));
    currentIsDir.value = true;
    tvStore.setAlistPath([...alistPath.value]); tvStore.setAlistCurrentPlayIndex(0);
    getFsList({ page: 1, password: "", path: alistPath.value.join("/"), per_page: 0, refresh: false });
  } else {
    currentIsDir.value ? alistPath.value.push(item.name) : (alistPath.value.pop(), alistPath.value.push(item.name));
    currentIsDir.value = false;
    tvStore.setAlistCurrentPlayIndex(index); alistCurrentPlayIndex.value = index;
    getFsGet({ path: alistPath.value.join("/"), password: "" });
  }
};

const handleBackAlist = async () => {
  if (alistPath.value.length <= 1 && alistPath.value[0] === "") return;
  alistPath.value.pop(); currentIsDir.value = true;
  tvStore.setAlistPath([...alistPath.value]); videoPlayStatus.value = false;
  await getFsList({ page: 1, password: "", path: alistPath.value.join("/") || "/", per_page: 0, refresh: false });
};

const getAlists = async () => {
  try { const res = await $fetch("/api/alist/get"); alistSettingData.value = res.alists; } catch (e) {}
};

const handleAlistSetting = async () => {
  alistSettingShow.value = true; tvStore.setAlistSettingShow(true); await getAlists();
};

const handleClickAlistUrl = (item) => {
  alistUrl.value = item.link; tvStore.setAlistUrl(item.link);
};

const handleHomeAlist = () => {
  if (!alistUrl.value) { ElMessage.warning("请先选择 Alist 服务器"); return; }
  channelCategory.value = 3; alistSettingShow.value = false;
  tvStore.setAlistSettingShow(false); alistPath.value = [""];
  currentIsDir.value = true; alistData.value = [];
  tvStore.setAlistPath([""]); tvStore.setAlistData([]);
  getFsList({ page: 1, password: "", path: "/", per_page: 0, refresh: false });
};

onMounted(() => {
  getTvSources(); getAlists();
  if (tvStore.tvCategory) channelCategory.value = tvStore.tvCategory;
  if (tvStore.alistUrl) alistUrl.value = tvStore.alistUrl;
  if (tvStore.alistSettingShow) alistSettingShow.value = tvStore.alistSettingShow;
  if (tvStore.alistData) alistData.value = tvStore.alistData;
  if (tvStore.alistPath) alistPath.value = tvStore.alistPath;
  if (tvStore.alistCurrentPlayIndex) alistCurrentPlayIndex.value = tvStore.alistCurrentPlayIndex;
  if (channelCategory.value === 3) getFsList({ page: 1, password: "", path: alistPath.value.join("/"), per_page: 0, refresh: false });
});

onBeforeUnmount(() => {
  if (hls) { hls.destroy(); hls = null; }
  if (player) { player.dispose(); player = null; }
});
</script>

<template>
  <!-- Page Root -->
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/40 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 transition-colors duration-300">
    <Header />

    <!-- Decorative blobs (desktop only) -->
    <div class="fixed top-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-200/25 to-purple-200/20 blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2 dark:from-blue-900/15 dark:to-purple-900/10" aria-hidden="true"></div>
    <div class="fixed bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-indigo-200/20 to-pink-200/15 blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3 dark:from-indigo-900/10 dark:to-purple-900/10" aria-hidden="true"></div>

    <main class="relative z-10 flex-1 pt-20 pb-10 px-4 md:px-6 max-w-screen-xl mx-auto w-full">
      <div class="flex gap-5 transition-all duration-300" :class="sidebarOpen ? 'flex-row' : 'flex-col'">
        
        <!-- ═══ LEFT: Player Column ═══ -->
        <div class="flex flex-col gap-4 min-w-0" :class="sidebarOpen ? 'flex-1' : 'w-full'">
          
          <!-- Player Card -->
          <div class="rounded-2xl overflow-hidden shadow-xl bg-black border border-gray-200/60 dark:border-white/5 dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <!-- Screen -->
            <div class="relative w-full bg-black" style="aspect-ratio:16/9">
              <video ref="videoPlayer" id="aipan-video" class="video-js w-full h-full"></video>

              <!-- Idle Overlay -->
              <Transition name="fade">
                <div v-if="!videoPlayStatus" class="absolute inset-0 z-10 flex items-center justify-center"
                  style="background: radial-gradient(ellipse at 50% 60%, rgba(15,23,42,0.9) 0%, #000 100%)">
                  <div class="text-center select-none">
                    <div class="inline-flex items-center justify-center w-20 h-20 rounded-full mb-5 border border-blue-500/20"
                      style="background: linear-gradient(135deg, rgba(37,99,235,0.12), rgba(99,102,241,0.1))">
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="rgba(148,163,184,0.7)">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </div>
                    <p class="text-sm font-medium text-slate-500 tracking-wide">选择频道 · 点击电源键开始播放</p>
                    <p class="text-xs text-slate-600 mt-2">或粘贴视频链接直接播放</p>
                  </div>
                </div>
              </Transition>

              <!-- Loading -->
              <Transition name="fade">
                <div v-if="videoLoading" class="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div class="w-11 h-11 rounded-full border-[3px] border-blue-500/20 border-t-blue-400 animate-spin"></div>
                </div>
              </Transition>

              <!-- LIVE Badge -->
              <div v-if="videoPlayStatus && !videoLoading"
                class="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-widest text-white bg-red-500/80 backdrop-blur border border-white/20">
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>LIVE
              </div>

              <!-- Corner channel list toggle (desktop) -->
              <button
                class="absolute top-3 right-3 hidden lg:flex items-center justify-center w-8 h-8 rounded-xl cursor-pointer transition-all duration-200 border border-white/15 hover:bg-white/20 hover:border-white/30"
                style="background: rgba(15,23,42,0.55); backdrop-filter: blur(8px); color: rgba(203,213,225,0.8)"
                @click="sidebarOpen = !sidebarOpen">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="3" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/>
                </svg>
              </button>
            </div><!-- /screen -->

            <!-- Control Bar -->
            <div class="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-white/5">
              <!-- Left controls -->
              <div class="flex items-center gap-2">
                <!-- Power -->
                <button @click="handlePowerSwitch" :title="videoPlayStatus ? '关闭' : '开启'"
                  class="relative w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 border overflow-hidden"
                  :class="videoPlayStatus
                    ? 'bg-green-50 border-green-200 text-green-600 shadow-[0_0_12px_rgba(34,197,94,0.2)] dark:bg-green-500/12 dark:border-green-500/30 dark:text-green-400'
                    : 'bg-gray-100 border-gray-200 text-gray-500 dark:bg-white/5 dark:border-white/8 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18.36 6.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
                  </svg>
                  <span class="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white dark:border-slate-900 transition-all"
                    :class="videoPlayStatus ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]' : 'bg-red-400'"></span>
                </button>
                <!-- Play/Pause -->
                <button @click="handleSwitchVideoStatus" :title="isPlaying ? '暂停' : '播放'"
                  class="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 text-gray-600 dark:text-gray-400 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-500/12 dark:hover:border-blue-500/25 dark:hover:text-blue-400 hover:-translate-y-px hover:shadow-md">
                  <svg v-if="!isPlaying" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                </button>
                <!-- Mute -->
                <button @click="handleMute" :title="videoMuted ? '取消静音' : '静音'"
                  class="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 text-gray-600 dark:text-gray-400 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-500/12 dark:hover:border-blue-500/25 dark:hover:text-blue-400 hover:-translate-y-px hover:shadow-md">
                  <svg v-if="!videoMuted" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
                  </svg>
                  <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                  </svg>
                </button>
              </div>

              <!-- Channel name (center) -->
              <div class="flex-1 flex justify-center px-4">
                <span v-if="currentChannelName"
                  class="text-sm font-semibold truncate max-w-xs bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
                  {{ currentChannelName }}
                </span>
              </div>

              <!-- Right controls -->
              <div class="flex items-center gap-2">
                <!-- Fullscreen -->
                <button @click="handleFullscreen" title="全屏"
                  class="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 text-gray-600 dark:text-gray-400 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-500/12 dark:hover:border-blue-500/25 dark:hover:text-blue-400 hover:-translate-y-px hover:shadow-md">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                    <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                  </svg>
                </button>
                <!-- Mobile sidebar btn -->
                <button @click="sidebarOpen = !sidebarOpen" title="频道列表"
                  class="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 text-gray-600 dark:text-gray-400 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-500/12 dark:hover:border-blue-500/25 dark:hover:text-blue-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/>
                  </svg>
                </button>
              </div>
            </div><!-- /control-bar -->
          </div><!-- /player card -->

          <!-- URL Bar -->
          <div class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-gray-200/80 dark:border-white/6 shadow-sm backdrop-blur-sm">
            <svg class="flex-shrink-0 text-gray-400 dark:text-slate-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
            <input v-model="customUrl" type="url" placeholder="粘贴直播/视频链接直接播放..."
              class="flex-1 min-w-0 text-sm bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-500"
              @keydown.enter="handleCustomUrlPlay" />
            <button @click="handleCustomUrlPlay"
              class="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 hover:-translate-y-px active:scale-95"
              style="background: linear-gradient(135deg, #2563eb, #4f46e5); box-shadow: 0 4px 12px rgba(37,99,235,0.3)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              播放
            </button>
          </div><!-- /url-bar -->
        </div><!-- /player col -->

        <!-- ═══ RIGHT: Sidebar ═══ -->
        <aside
          class="flex flex-col rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-gray-200/70 dark:border-white/6 shadow-lg dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] overflow-hidden transition-all duration-300"
          :class="[
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none w-0 p-0 border-0',
            'w-[340px] max-h-[calc(100vh-100px)] lg:flex',
            // Mobile drawer
            'max-lg:fixed max-lg:top-0 max-lg:right-0 max-lg:w-80 max-lg:max-w-[88vw] max-lg:h-screen max-lg:max-h-screen max-lg:z-50 max-lg:rounded-none max-lg:rounded-l-2xl',
            sidebarOpen ? 'max-lg:translate-x-0' : 'max-lg:translate-x-full',
          ]"
          style="transition: transform 0.3s cubic-bezier(.4,0,.2,1), opacity 0.2s ease, width 0.3s ease">

          <!-- Mobile close btn -->
          <button @click="sidebarOpen = false"
            class="lg:hidden absolute top-3 right-3 z-10 w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all bg-gray-100 dark:bg-white/8 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-500/12 dark:hover:text-red-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <!-- Category Tabs -->
          <div class="flex gap-2 p-3 flex-shrink-0">
            <button v-for="cat in channelCategoryData" :key="cat.id"
              @click="handleSwitchChannelCategory(cat.id)"
              class="flex-1 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200"
              :class="channelCategory === cat.id
                ? 'text-white shadow-md shadow-blue-500/25'
                : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-slate-200'"
              :style="channelCategory === cat.id ? 'background: linear-gradient(135deg, #2563eb, #4f46e5)' : ''">
              {{ cat.name }}
            </button>
          </div>

          <!-- Search -->
          <div v-if="channelCategory === 1" class="relative mx-3 mb-1 flex-shrink-0">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-slate-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input v-model="channelSearch" type="text" placeholder="搜索频道名称..."
              class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-500 focus:border-blue-300 dark:focus:border-blue-500/40 focus:bg-white dark:focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(147,197,253,0.2)] dark:focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]" />
          </div>

          <!-- Channel count -->
          <div v-if="channelCategory === 1 && filteredTvSources.length" class="flex-shrink-0 px-4 py-1 text-xs text-gray-400 dark:text-slate-500">
            共 <span class="font-semibold text-blue-500 dark:text-blue-400">{{ filteredTvSources.length }}</span> 个频道
          </div>

          <!-- Channel List -->
          <div class="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-0.5 min-h-0 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
            
            <!-- 直播频道 -->
            <template v-if="channelCategory === 1">
              <button v-for="(item, index) in filteredTvSources" :key="index"
                @click="handleSwitchSource(item.url)"
                class="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 border"
                :class="item.url === videoSrc && videoPlayStatus
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border-blue-200 dark:border-blue-500/25 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'bg-transparent border-transparent text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-200 dark:hover:border-white/8 hover:text-gray-900 dark:hover:text-slate-200 hover:translate-x-0.5'">
                <!-- index badge -->
                <span class="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                  :class="item.url === videoSrc && videoPlayStatus
                    ? 'text-white shadow-sm shadow-blue-500/30'
                    : 'bg-gray-100 dark:bg-white/6 text-gray-400 dark:text-slate-500'"
                  :style="item.url === videoSrc && videoPlayStatus ? 'background: linear-gradient(135deg, #2563eb, #4f46e5)' : ''">
                  {{ index + 1 }}
                </span>
                <span class="flex-1 truncate text-sm">{{ item.name }}</span>
                <!-- live dot -->
                <span v-if="item.url === videoSrc && videoPlayStatus"
                  class="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)] animate-pulse"></span>
              </button>
            </template>

            <!-- Alist -->
            <template v-if="channelCategory === 3">
              <!-- Toolbar -->
              <div class="flex items-center gap-2 py-2 flex-wrap">
                <button v-if="alistPath.length > 1 || alistPath[0] !== ''" @click="handleBackAlist"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all bg-gray-100 dark:bg-white/6 border border-gray-200 dark:border-white/8 text-gray-600 dark:text-slate-400 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-500/12 dark:hover:text-blue-400 dark:hover:border-blue-500/25">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  返回
                </button>
                <button @click="handleHomeAlist"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all bg-gray-100 dark:bg-white/6 border border-gray-200 dark:border-white/8 text-gray-600 dark:text-slate-400 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-500/12 dark:hover:text-blue-400 dark:hover:border-blue-500/25">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                  主页
                </button>
                <button @click="handleAlistSetting"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border"
                  :class="alistSettingShow
                    ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/12 dark:border-blue-500/25 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-white/6 border-gray-200 dark:border-white/8 text-gray-600 dark:text-slate-400 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-500/12 dark:hover:text-blue-400 dark:hover:border-blue-500/25'">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                  </svg>
                  设置
                </button>
              </div>

              <!-- Alist servers -->
              <template v-if="alistSettingShow">
                <button v-for="(item, index) in alistSettingData" :key="index"
                  @click="handleClickAlistUrl(item)"
                  class="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 border text-sm"
                  :class="alistUrl === item.link
                    ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/25 text-violet-700 dark:text-violet-300'
                    : 'bg-transparent border-transparent text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-200 dark:hover:border-white/8 hover:text-gray-900 dark:hover:text-slate-200'">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="flex-shrink-0">
                    <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
                    <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
                  </svg>
                  <div class="flex flex-col min-w-0">
                    <span class="font-semibold truncate">{{ item.name }}</span>
                    <span class="text-xs text-gray-400 dark:text-slate-500 truncate">{{ item.link }}</span>
                  </div>
                </button>
              </template>

              <!-- Alist files -->
              <template v-else>
                <button v-for="(item, index) in alistData?.content" :key="index"
                  @click="handleClickAlist(item, index)"
                  class="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 border text-sm"
                  :class="[
                    item.is_dir
                      ? 'bg-transparent border-transparent text-amber-700 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/8 hover:border-amber-200 dark:hover:border-amber-500/20 hover:text-amber-800 dark:hover:text-amber-400'
                      : alistCurrentPlayIndex === index
                        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/25 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'bg-transparent border-transparent text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-200 dark:hover:border-white/8 hover:text-gray-900 dark:hover:text-slate-200'
                  ]">
                  <!-- Folder -->
                  <svg v-if="item.is_dir" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" class="flex-shrink-0 text-amber-500">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                  </svg>
                  <!-- File -->
                  <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="currentColor" class="flex-shrink-0 text-blue-400">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  <span class="flex-1 truncate">{{ item.name }}</span>
                </button>
              </template>
            </template>

          </div><!-- /channel list -->
        </aside><!-- /sidebar -->

      </div><!-- /flex row -->
    </main>

    <!-- Mobile backdrop -->
    <Transition name="fade">
      <div v-if="sidebarOpen" class="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" @click="sidebarOpen = false"></div>
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
