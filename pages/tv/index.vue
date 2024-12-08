<script setup>
useHead({
  title: "爱盼 - 电视直播与 Alist 数据源聚合播放",
  meta: [
    { charset: "utf-8" },
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1, shrink-to-fit=no",
    },
    {
      name: "keywords",
      content: "爱盼, 电视直播, Alist 数据源, 聚合播放, 在线电视",
    },
    {
      hid: "description",
      name: "description",
      content:
        "爱盼提供最新的电视直播和 Alist 数据源聚合播放，轻松享受精彩内容！",
    },
    { name: "author", content: "爱盼团队" },
    { name: "robots", content: "index, follow" },
    { name: "format-detection", content: "telephone=no" },
    { property: "og:title", content: "爱盼 - 电视直播与 Alist 数据源聚合播放" },
    {
      property: "og:description",
      content:
        "爱盼提供最新的电视直播和 Alist 数据源聚合播放，轻松享受精彩内容！",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://aipan.me/tv" }, // 动态获取当前页面的 URL
    { property: "og:image", content: "/logo.png" }, // 替换为适当的缩略图链接
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:title",
      content: "爱盼 - 电视直播与 Alist 数据源聚合播放",
    },
    {
      name: "twitter:description",
      content:
        "爱盼提供最新的电视直播和 Alist 数据源聚合播放，轻松享受精彩内容！",
    },
    { name: "twitter:image", content: "/logo.png" }, // 替换为适当的 Twitter 卡片图像链接
  ],
});
import Hls from "hls.js";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import bgImage from "~/assets/tv-bg-1.jpg";
import { sourcesAipan } from "~/assets/vod/tv";
import { useTvStore } from "~/stores/tv";
import { ElMessage } from "element-plus";
definePageMeta({
  layout: "custom",
});
const tvStore = useTvStore();
const sourceIndex = ref(0);
const tvSources = ref([]);
const videoPlayer = ref(null);
const videoSrc = ref("");
const modalShow = ref(false);
const videoPlayStatus = ref(false);
const videoLoading = ref(false);
const isChannelSwitching = ref(false);
const videoMuted = ref(false);
const isPlaying = ref(false); // 视频播放/暂停状态
let player = null;
let hls = null; // 缓存 HLS 实例
let currentEffectIndex = 0;

const alistData = ref([]);
const alistPath = ref([""]);
const currentIsDir = ref(true); // 当前是否是文件夹 默认是文件夹
const alistUrl = ref("");
const alistSettingData = ref([]);
const alistSettingShow = ref(false);
const alistCurrentPlayIndex = ref(0);

// 判断是否为 m3u8 格式
const isM3u8 = (url) => /\.m3u8(\?.*)?$/.test(url);
// 获取视频源
const getTvSources = async () => {
  try {
    const res = await $fetch("https://r2cf.aipan.me/tv.json");
    if (videoSrc.value === "") {
      videoSrc.value = res[0].url;
      // loadHLS(videoSrc.value);  // 初始化第一个视频源
    }
    tvSources.value = res;
  } catch (error) {
    console.error("Error fetching TV sources:", error);
  }
};
const loadHLS = (url) => {
  // 显示加载动画
  const showLoadingSpinner = () => {
    videoLoading.value = true;
  };

  // 隐藏加载动画
  const hideLoadingSpinner = () => {
    videoLoading.value = false;
    videoPlayStatus.value = true;
  };

  // 判断播放类型
  let type = "";
  if (url.includes(".mp4")) {
    type = "video/mp4";
  } else if (url.includes(".mkv")) {
    type = "video/webm";
  } else if (url.includes(".ts")) {
    type = "video/mp2t";
  } else if (isM3u8(url)) {
    type = "application/x-mpegURL"; // HLS/M3U8 类型
  }

  if (!player) {
    // 设置播放器选项
    const options = {
      liveui: true,
      html5: {
        hls: {
          enableLowInitialPlaylist: true,
          smoothQualityChange: true,
        },
      },
    };

    // 创建播放器
    player = videojs(videoPlayer.value, options);
    player.on("ended", () => {
      player.currentTime(0);
      player.play();
    });

    player.on("waiting", showLoadingSpinner);
    player.on("playing", () => {
      hideLoadingSpinner();
      isPlaying.value = true;
    });
    player.on("error", hideLoadingSpinner);
  }

  if (type === "application/x-mpegURL" && Hls.isSupported()) {
    // HLS 播放
    if (!hls) {
      hls = new Hls();
      hls.attachMedia(videoPlayer.value);
      hls.on(Hls.Events.MANIFEST_LOADING, showLoadingSpinner);
      hls.on(Hls.Events.MANIFEST_PARSED, hideLoadingSpinner);
      hls.on(Hls.Events.ERROR, hideLoadingSpinner);
    }
    hls.loadSource(url);
  } else {
    // 非 HLS 类型播放
    if (hls) {
      hls.destroy();
      hls = null;
    }
    showLoadingSpinner();
    player.src({ type, src: url });
  }

  player.play();
  player.on("loadeddata", hideLoadingSpinner);
  player.on("loadedmetadata", hideLoadingSpinner);
};

const handleSwitchSource = async (url) => {
  if (channelCategory.value === 3) {
    modalShow.value = true;
  } else {
    isChannelSwitching.value = true;
    videoLoading.value = true;
    videoSrc.value = url;
    loadHLS(url);
    videoPlayStatus.value = true;
    isPlaying.value = true;
  }
};

// 视频播放和暂停
const handleSwitchVideoStatus = () => {
  if (player && videoPlayStatus.value) {
    // 只在TV开启时可用
    if (videoPlayer.value.paused) {
      videoPlayer.value.play();
      isPlaying.value = true;
    } else {
      videoPlayer.value.pause();
      isPlaying.value = false;
    }
  }
};

// 处理TV开关机
const handlePowerSwitch = () => {
  if (!videoPlayStatus.value) {
    // 开机：加载视频并播放
    videoPlayStatus.value = true;
    if (videoSrc.value) {
      loadHLS(videoSrc.value);
      isPlaying.value = true;
    }
  } else {
    // 关机：停止播放，清除视频源
    videoPlayStatus.value = false;
    isPlaying.value = false;
    if (player) {
      player.pause();
      if (hls) {
        hls.destroy();
        hls = null;
      }
    }
  }
};

// 切换视频主题效果
const videoEffects = [
  "nostalgia-video",
  "nostalgia2-video",
  "vintage-video",
  "dreamy-video",
  "cinematic-video",
  "high-contrast-bw-video",
  "neon-night-video",
  "film-video",
  "sunset-video",
  "cool-tone-video",
  "gothic-video",
  "psychedelic-video",
];

const handleSwitchVideoTheme = () => {
  if (!player) return;
  videoPlayer.value.classList.remove(videoEffects[currentEffectIndex]);
  currentEffectIndex = (currentEffectIndex + 1) % videoEffects.length;
  videoPlayer.value.classList.add(videoEffects[currentEffectIndex]);
};

// 重置视频主题
const handleResetTheme = () => {
  videoEffects.forEach((effect) => {
    videoPlayer.value.classList.remove(effect);
  });
};

// 全屏功能
const handleFullscreen = () => {
  if (player) {
    if (player.isFullscreen()) {
      player.exitFullscreen();
    } else {
      player.requestFullscreen();
    }
  }
};

// 处理视频加载和播放状态
const handleWaiting = () => {
  if (!isChannelSwitching.value) {
    return;
  }
  videoLoading.value = true;
};

const handlePlaying = () => {
  videoLoading.value = false;
  isChannelSwitching.value = false;
};
const handleMute = () => {
  if (player) {
    videoMuted.value = !videoMuted.value;
    player.muted(videoMuted.value);
  }
};

const channelCategory = ref(1);
const channelCategoryData = [
  {
    id: 1,
    name: "常用",
  },
  // {
  //     id: 2,
  //     name: "电视直播",
  // },
  {
    id: 3,
    name: "Alist",
  },
];

const handleSwithcChannelCategory = (id) => {
  tvStore.setTvCategory(id);
  channelCategory.value = id;
  if (id === 3) {
    alistSettingShow.value = false;
    currentIsDir.value = true;
    alistPath.value = [""];
    tvStore.setAlistPath([""]);
    let params = {
      page: 1,
      password: "",
      path: alistPath.value.join("/"),
      per_page: 0,
      refresh: false,
    };
    getFsList(params);
  }
};
const getFsList = async (params) => {
  if (!alistUrl.value) {
    ElMessage.warning("请先选择 Alist 服务器");
    return;
  }
  try {
    let res = await $fetch(`${alistUrl.value}/api/fs/list`, {
      method: "POST",
      body: params,
    });
    if (res.code === 200) {
      alistData.value = res.data;
      tvStore.setAlistData(res.data);
    } else {
      ElMessage.error(res.message || "获取文件列表失败");
      if (alistData.value && alistData.value.length > 0) {
        alistData.value.pop();
        tvStore.setAlistData(alistData.value);
      }
    }
  } catch (error) {
    console.error("getFsList error:", error);
    ElMessage.error("网络请求失败，请检查网络连接");
  }
};
const getFsGet = async (params) => {
  if (!alistUrl.value) {
    ElMessage.warning("请先选择 Alist 服务器");
    return;
  }
  try {
    let res = await $fetch(`${alistUrl.value}/api/fs/get`, {
      method: "POST",
      body: params,
    });

    if (res.code === 200) {
      let sign = res.data.sign;
      let alistPathTemp = [];

      alistPath.value.forEach((item, index) => {
        alistPathTemp[index] = encodeURIComponent(item);
      });
      let temp_url = alistPathTemp.join("/") + "?sign=" + sign;
      videoSrc.value = `${alistUrl.value}/d${temp_url}`;
      loadHLS(`${alistUrl.value}/d${temp_url}`);
    } else {
      ElMessage.error(res.message || "获取文件信息失败");
      if (alistData.value && alistData.value.length > 0) {
        alistData.value.pop();
        tvStore.setAlistData(alistData.value);
      }
    }
  } catch (error) {
    console.error("getFsGet error:", error);
    ElMessage.error("网络请求失败，请检查网络连接");
  }
};

const handleClickAlist = (item, index) => {
  if (item.is_dir) {
    // 进入文件夹时重置播放状态
    videoPlayStatus.value = false;
    if (currentIsDir.value) {
      alistPath.value.push(item.name);
    } else {
      alistPath.value.pop();
      alistPath.value.push(item.name);
    }
    currentIsDir.value = true;
    const currentPath = [...alistPath.value];
    tvStore.setAlistPath(currentPath);
    tvStore.setAlistCurrentPlayIndex(0);
    getFsList({
      page: 1,
      password: "",
      path: alistPath.value.join("/"),
      per_page: 0,
      refresh: false,
    });
  } else {
    // 如果是文件
    if (currentIsDir.value) {
      alistPath.value.push(item.name);
    } else {
      alistPath.value.pop();
      alistPath.value.push(item.name);
    }
    currentIsDir.value = false;
    tvStore.setAlistCurrentPlayIndex(index);
    alistCurrentPlayIndex.value = index;
    getFsGet({
      path: alistPath.value.join("/"),
      password: "",
    });
  }
};
const handleBackAlist = async () => {
  if (alistPath.value.length <= 1 && alistPath.value[0] === "") {
    return;
  }
  alistPath.value.pop();
  currentIsDir.value = true;
  // 同步更新 store 中的路径
  tvStore.setAlistPath([...alistPath.value]);
  // 重置播放状态
  videoPlayStatus.value = false;
  // 获取上级目录数据
  await getFsList({
    page: 1,
    password: "",
    path: alistPath.value.join("/") || "/",
    per_page: 0,
    refresh: false,
  });
};
const getAlists = async () => {
  try {
    let res = await $fetch("/api/alist/get", {
      method: "GET",
    });
    // console.log(res)
    alistSettingData.value = res.alists;
  } catch (e) {
    console.log(e);
  }
};
const handleAlistSetting = async () => {
  alistSettingShow.value = true;
  tvStore.setAlistSettingShow(true);
  await getAlists();
};

const handleClickAlistUrl = (item) => {
  alistUrl.value = item.link;
  tvStore.setAlistUrl(item.link);
};

const handleHomeAlist = () => {
  if (!alistUrl.value) {
    ElMessage.warning("请先选择 Alist 服务器");
    return;
  }
  if (channelCategory.value !== 3) {
    channelCategory.value = 3;
  }
  // 关闭设置面板
  alistSettingShow.value = false;
  tvStore.setAlistSettingShow(false);
  // 重置路径和数据
  alistPath.value = [""];
  currentIsDir.value = true;
  alistData.value = [];
  tvStore.setAlistPath([""]);
  tvStore.setAlistData([]);
  // 获取根目录数据
  getFsList({
    page: 1,
    password: "",
    path: "/",
    per_page: 0,
    refresh: false,
  });
};

// 页面挂载和销毁
onMounted(() => {
  // 获取视频源
  getTvSources();
  getAlists();

  // 从store中获取数据
  if (tvStore.tvCategory) {
    channelCategory.value = tvStore.tvCategory;
  }
  if (tvStore.alistUrl) {
    alistUrl.value = tvStore.alistUrl;
  }
  if (tvStore.alistSettingShow) {
    alistSettingShow.value = tvStore.alistSettingShow;
  }
  if (tvStore.alistData) {
    alistData.value = tvStore.alistData;
  }
  if (tvStore.alistPath) {
    alistPath.value = tvStore.alistPath;
  }
  if (tvStore.alistCurrentPlayIndex) {
    alistCurrentPlayIndex.value = tvStore.alistCurrentPlayIndex;
  }

  if (channelCategory.value === 3) {
    let params = {
      page: 1,
      password: "",
      path: alistPath.value.join("/"),
      per_page: 0,
      refresh: false,
    };
    getFsList(params);
  }
});

onBeforeUnmount(() => {
  if (hls) {
    hls.destroy();
    hls = null; // 确保不再引用该实例
  }
  if (player) {
    player.dispose();
    player = null;
  }
});

// 添加缩放比例计算
const tvContainer = ref(null);
const scale = ref(1);

// 计算缩放比例
const calculateScale = () => {
  if (!tvContainer.value) return;

  // 获取容器的实际高度（不包括缩放）
  const containerHeight = tvContainer.value.scrollHeight;
  // 获取视窗高度
  const viewportHeight = window.innerHeight;

  // 计算需要的缩放比例，留出一些边距
  const padding = 32; // 上下各留 16px 的边距
  const newScale = (viewportHeight - padding) / containerHeight;

  // 限制最大缩放为 1
  scale.value = Math.min(1, newScale);
};

// 监听窗口大小变化
onMounted(() => {
  calculateScale();
  window.addEventListener("resize", calculateScale);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", calculateScale);
});
</script>

<template>
  <div
    class="custom-bg min-h-screen h-screen bg-no-repeat bg-cover bg-center relative flex items-center justify-center overflow-hidden"
  >
    <div class="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

    <!-- TV Set Container -->
    <div
      ref="tvContainer"
      class="relative w-full max-w-6xl mx-auto px-8 tv-container"
      :style="{ transform: `scale(${scale})` }"
    >
      <!-- TV Frame -->
      <div
        class="tv-frame rounded-[2.5rem] shadow-2xl p-8 transform transition-all duration-300 retro-tv-frame"
      >
        <!-- TV Screen -->
        <div
          class="tv-screen bg-black rounded-2xl overflow-hidden relative border-4 border-gray-700"
        >
          <div id="aipan-video-container" class="relative w-full aspect-video">
            <video
              ref="videoPlayer"
              id="aipan-video"
              class="video-js w-full h-full"
            ></video>

            <!-- Screen Overlays -->
            <div
              v-if="!videoPlayStatus"
              class="absolute inset-0 video-mask flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
            >
              <div class="text-2xl text-gray-400 tracking-wider font-light">
                <i
                  class="fas fa-arrow-down text-red-500 animate-bounce mb-4 block text-center"
                ></i>
                点击下方电源键开始
              </div>
            </div>

            <div
              v-if="videoLoading"
              class="absolute inset-0 flex items-center justify-center bg-black/50 bg-[url('@/assets/tvstatic.gif')] backdrop-blur-sm"
            ></div>
          </div>
        </div>

        <!-- TV Control Panel -->
        <div class="tv-control-panel mt-6 px-4">
          <!-- Brand Name -->
          <div class="flex justify-center mb-4">
            <nuxt-link
              to="/"
              class="text-xl font-extrabold tracking-wider bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hover:from-blue-500 hover:to-purple-600 transition-all duration-300 transform hover:scale-105"
            >
              AIPAN
            </nuxt-link>
          </div>

          <!-- Control Buttons Panel -->
          <div
            class="tv-buttons-panel flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 bg-gradient-to-b from-neutral-800/50 to-neutral-900/50 p-3 md:p-4 rounded-xl backdrop-blur-sm border border-neutral-700/30"
          >
            <div
              class="tv-left-controls flex flex-wrap justify-center md:justify-start gap-2 md:gap-3 w-full md:w-auto"
            >
              <button class="control-btn" @click="modalShow = !modalShow">
                <span class="flex items-center gap-2">
                  <i class="fas fa-tv"></i>频道
                </span>
              </button>
              <button class="control-btn" @click="handleMute">
                <span class="flex items-center gap-2">
                  <i
                    :class="
                      !videoMuted ? 'fas fa-volume-up' : 'fas fa-volume-mute'
                    "
                  ></i>
                  <span class="hidden sm:inline">{{
                    !videoMuted ? "静音" : "取消静音"
                  }}</span>
                </span>
              </button>
              <button class="control-btn" @click="handleSwitchVideoStatus">
                <span class="flex items-center gap-2">
                  <i :class="!isPlaying ? 'fas fa-play' : 'fas fa-pause'"></i>
                  <span class="hidden sm:inline">{{
                    !isPlaying ? "播放" : "暂停"
                  }}</span>
                </span>
              </button>
            </div>

            <div
              class="tv-decoration flex items-center justify-center my-2 md:my-0"
            >
              <button
                class="control-power-btn"
                :class="{ 'power-on': videoPlayStatus }"
                @click="handlePowerSwitch"
              >
                <span class="relative z-10">
                  <i class="fas fa-power-off"></i>
                </span>
                <div class="power-status">
                  <div
                    class="status-dot"
                    :class="{ active: videoPlayStatus }"
                  ></div>
                </div>
              </button>
            </div>

            <div
              class="tv-right-controls flex flex-wrap justify-center md:justify-end gap-2 md:gap-3 w-full md:w-auto"
            >
              <button class="control-btn" @click="handleSwitchVideoTheme">
                <span class="flex items-center gap-2">
                  <i class="fas fa-paint-brush"></i>
                  <span class="hidden sm:inline">换肤</span>
                </span>
              </button>
              <button class="control-btn" @click="handleResetTheme">
                <span class="flex items-center gap-2">
                  <i class="fas fa-undo"></i>
                  <span class="hidden sm:inline">重置</span>
                </span>
              </button>
              <button class="control-btn" @click="handleFullscreen">
                <span class="flex items-center gap-2">
                  <i class="fas fa-expand"></i>
                  <span class="hidden sm:inline">全屏</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TV Stand -->
      <div
        class="tv-stand mt-4 h-16 w-1/3 mx-auto bg-gradient-to-b from-gray-700 to-gray-800 rounded-t-lg transform perspective-1000 rotateX-45"
      ></div>
    </div>

    <!-- Channel Selection Panel -->
    <div
      v-if="modalShow"
      class="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center"
    >
      <div
        class="tv-channel-dialog w-[90%] max-w-6xl h-[90vh] bg-white/5 rounded-2xl flex overflow-hidden shadow-2xl border border-white/10"
      >
        <div class="tv-channel-sidebar">
          <button
            class="tv-btn danger rounded-md p-2 w-full"
            @click="modalShow = false"
          >
            关闭
          </button>
          <div class="mt-4 space-y-2">
            <button
              v-for="category in channelCategoryData"
              :key="category.id"
              class="tv-category-btn w-full"
              :class="channelCategory === category.id ? 'active' : ''"
              @click="handleSwithcChannelCategory(category.id)"
            >
              {{ category.name }}
            </button>
          </div>
        </div>

        <!-- Channel Content -->
        <div class="tv-channel-content">
          <div class="channel-search">
            <input
              class="tv-input"
              type="text"
              v-model="videoSrc"
              placeholder="请输入视频链接"
            />
            <button
              class="tv-btn primary p-2 text-sm rounded-md"
              @click="handleSwitchSource(videoSrc)"
            >
              切换视频
            </button>
          </div>

          <div class="space-y-6">
            <div v-if="channelCategory === 1" class="space-y-3">
              <div
                class="channel-item"
                :class="{ active: item.url === videoSrc }"
                v-for="(item, index) in tvSources"
                :key="index"
                @click="handleSwitchSource(item.url)"
              >
                <div class="flex items-center">
                  <div class="channel-number">{{ index + 1 }}</div>
                  <div class="channel-name">{{ item.name }}</div>
                </div>
              </div>
            </div>

            <div v-if="channelCategory === 2">
              <div class="source-categories">
                <div
                  class="source-category"
                  :class="{ active: sourceIndex === index }"
                  v-for="(item, index) in sourcesAipan"
                  :key="index"
                  @click="sourceIndex = index"
                >
                  {{ item.label }}
                </div>
              </div>

              <div class="mt-6 space-y-3">
                <div
                  class="channel-item"
                  :class="{ active: item.url === videoSrc }"
                  v-for="(item, index) in sourcesAipan[sourceIndex]['sources']"
                  :key="index"
                  @click="handleSwitchSource(item.url)"
                >
                  <div class="flex items-center">
                    <div class="channel-number">{{ index + 1 }}</div>
                    <div class="channel-name">{{ item.name }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="space-y-3" v-if="channelCategory === 3">
              <div class="alist-nav">
                <button
                  class="alist-nav-btn back"
                  v-if="
                    alistPath.length > 1 ||
                    (alistPath.length === 1 && alistPath[0] !== '')
                  "
                  type="button"
                  @click="handleBackAlist()"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span>返回上级</span>
                </button>

                <button
                  class="alist-nav-btn home"
                  type="button"
                  @click="handleHomeAlist()"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
                    />
                  </svg>
                  <span>主页</span>
                </button>

                <button
                  class="alist-nav-btn settings"
                  :class="{ active: alistSettingShow }"
                  type="button"
                  @click="handleAlistSetting()"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span>设置</span>
                </button>
              </div>
              <div class="space-y-3" v-if="alistSettingShow">
                <div
                  class="alist-item setting-item"
                  :class="{ active: alistUrl === item.link }"
                  v-for="(item, index) in alistSettingData"
                  :key="index"
                  @click="handleClickAlistUrl(item)"
                >
                  <div class="flex items-center space-x-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <div class="flex-1">
                      <div class="font-medium">{{ item.name }}</div>
                      <div class="text-sm text-white/60 truncate">
                        {{ item.link }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="space-y-3" v-else>
                <div
                  class="alist-item"
                  :class="{
                    'folder-item': item.is_dir,
                    'file-item': !item.is_dir,
                    active: !item.is_dir && alistCurrentPlayIndex === index,
                  }"
                  v-for="(item, index) in alistData?.content"
                  :key="index"
                  @click="handleClickAlist(item, index)"
                >
                  <div class="flex items-center space-x-3">
                    <!-- Folder Icon -->
                    <svg
                      v-if="item.is_dir"
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                      />
                    </svg>
                    <!-- File Icon -->
                    <svg
                      v-else
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium truncate">{{ item.name }}</div>
                      <div class="text-sm text-white/60">
                        {{ item.is_dir ? "文件夹" : "视频文件" }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.custom-bg {
  background: linear-gradient(135deg, #1c1c1c 0%, #252525 50%, #2a2a2a 100%);
  position: relative;
}

.custom-bg::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
      circle at 30% 20%,
      rgba(60, 60, 60, 0.4) 0%,
      transparent 60%
    ),
    radial-gradient(
      circle at 70% 60%,
      rgba(55, 55, 55, 0.4) 0%,
      transparent 60%
    );
  pointer-events: none;
}

.glass-effect {
  @apply bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-700/50 
           px-4 py-2 rounded-lg text-gray-200 transition-all duration-300;
}

.tv-power-btn {
  @apply relative flex items-center justify-center;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle at center, #e74c3c, #c0392b);
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: white;
  font-weight: bold;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 0 30px rgba(231, 76, 60, 0.5),
    inset 0 0 20px rgba(0, 0, 0, 0.3),
    0 2px 0 rgba(255, 255, 255, 0.2);
}

.tv-power-btn::before {
  content: "";
  position: absolute;
  inset: -2px;
  background: conic-gradient(
    from 0deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  border-radius: 50%;
  animation: rotate 2s linear infinite;
}

.tv-power-btn::after {
  content: "";
  position: absolute;
  inset: 2px;
  background: radial-gradient(circle at center, #e74c3c, #c0392b);
  border-radius: 50%;
}

.tv-power-btn span {
  @apply relative z-10 flex items-center gap-2;
}

.tv-power-btn i {
  font-size: 1.5rem;
  animation: pulse 2s infinite;
}

.tv-power-btn:hover {
  transform: scale(1.05);
  box-shadow:
    0 0 40px rgba(231, 76, 60, 0.7),
    inset 0 0 20px rgba(0, 0, 0, 0.3),
    0 2px 0 rgba(255, 255, 255, 0.2);
}

.tv-power-btn:active {
  transform: scale(0.95);
  box-shadow:
    0 0 20px rgba(231, 76, 60, 0.3),
    inset 0 0 15px rgba(0, 0, 0, 0.4);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

/* TV Frame Styles */
.tv-frame {
  background: linear-gradient(145deg, #232323, #1a1a1a);
  border: 12px solid #0f0f0f;
  box-shadow:
    inset 0 0 50px rgba(0, 0, 0, 0.6),
    0 0 30px rgba(0, 0, 0, 0.5),
    0 0 0 2px #0a0a0a,
    0 0 0 8px #141414,
    0 0 0 12px #1c1c1c;
  position: relative;
}

.tv-frame::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
  border-radius: inherit;
  pointer-events: none;
}

/* TV Screen */
.tv-screen {
  border: 8px solid #0a0a0a !important;
  box-shadow:
    inset 0 0 30px rgba(0, 0, 0, 0.8),
    0 0 20px rgba(0, 0, 0, 0.4);
}

.tv-screen::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    rgba(255, 255, 255, 0.1) 50%,
    rgba(0, 0, 0, 0.1) 50%
  );
  background-size: 100% 4px;
  pointer-events: none;
  opacity: 0.1;
}

/* TV Control Panel */
.tv-control-panel {
  background: linear-gradient(145deg, #232323, #1a1a1a);
  border-radius: 10px;
  padding: 15px;
  margin-top: 20px;
  box-shadow:
    inset 0 2px 5px rgba(255, 255, 255, 0.1),
    inset 0 -2px 5px rgba(0, 0, 0, 0.1);
}

.tv-brand {
  text-align: center;
  margin-bottom: 15px;
  position: relative;
}

.tv-brand::after {
  content: "";
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 2px;
  background: #ffffff;
}

/* Control Buttons */
.control-btn {
  @apply px-3 md:px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
           bg-neutral-800/80 hover:bg-neutral-700/80 
           text-neutral-300 hover:text-white
           border border-neutral-600/30 hover:border-neutral-500/30
           shadow-lg hover:shadow-xl
           min-w-[40px] md:min-w-[auto];
  backdrop-filter: blur(8px);
}

.control-btn.primary {
  @apply bg-blue-600/90 hover:bg-blue-500/90 
           text-blue-100 hover:text-white
           border-blue-500/30 hover:border-blue-400/30;
}

.control-btn:active {
  transform: translateY(1px);
}

.tv-buttons-panel {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    inset 0 2px 4px rgba(255, 255, 255, 0.05);
}

/* TV Decorations */
.tv-decoration {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  padding: 10px 0;
}

.tv-speaker {
  width: 40px;
  height: 40px;
  background: linear-gradient(145deg, #2c3e50, #34495e);
  border-radius: 50%;
  position: relative;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
}

.tv-speaker::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: #1a1a1a;
  border-radius: 50%;
}

.tv-speaker::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #2c3e50;
  border-radius: 50%;
}

/* TV Stand */
.tv-stand {
  height: 40px;
  margin-top: -10px;
  background: linear-gradient(to bottom, #34495e, #2c3e50);
  border-radius: 0 0 20px 20px;
  position: relative;
  z-index: -1;
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.3);
}

.tv-stand::before,
.tv-stand::after {
  content: "";
  position: absolute;
  bottom: 0;
  width: 40px;
  height: 10px;
  background: #2c3e50;
  border-radius: 5px;
}

.tv-stand::before {
  left: 20%;
}

.tv-stand::after {
  right: 20%;
}

/* Channel Panel Styling */
.tv-channel-panel {
  @apply fixed inset-0 bg-black/40 backdrop-blur-md z-50 
           flex items-center justify-center;
}

.tv-channel-dialog {
  @apply w-[90%] max-w-6xl h-[90vh] bg-white/5 rounded-2xl 
           flex overflow-hidden shadow-2xl
           border border-white/10;
  animation: modal-pop-in 0.3s ease-out;
  backdrop-filter: blur(20px);
}

@keyframes modal-pop-in {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.tv-channel-sidebar {
  @apply w-24 bg-white/5 p-4 border-r border-white/10 flex flex-col;
  backdrop-filter: blur(10px);
}

.tv-category-btn {
  @apply mb-3 p-3 text-sm font-medium rounded-xl transition-all 
           flex flex-col items-center justify-center gap-2
           text-white/90 hover:text-white
           hover:bg-white/10 active:bg-white/15;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.tv-category-btn.active {
  @apply bg-blue-500 text-white font-semibold;
  box-shadow:
    0 0 20px rgba(0, 0, 0, 0.2),
    inset 0 1px 1px rgba(255, 255, 255, 0.2);
}

.tv-channel-content {
  @apply flex-1 p-6 overflow-y-auto bg-white/5 relative;
  backdrop-filter: blur(10px);
}

.channel-search {
  @apply mb-6 flex gap-3 sticky top-0 z-10 p-4 -mx-4 -mt-4;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.05)
  );
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tv-input {
  @apply flex-1 bg-white/10 text-white px-5 py-3 rounded-xl 
           border border-white/10 
           focus:border-blue-400 focus:outline-none
           transition-all duration-200
           placeholder:text-gray-300;
  backdrop-filter: blur(5px);
}

.tv-input:hover {
  @apply border-white/20;
}

.tv-btn.primary {
  @apply bg-blue-500 hover:bg-blue-600 text-white
           transition-all duration-200 shadow-lg
           border border-blue-400/30;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.tv-btn.primary:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.tv-btn.primary:active {
  transform: translateY(1px);
}

.tv-btn.danger {
  @apply bg-red-500 hover:bg-red-600 text-white
           transition-all duration-200 shadow-lg
           border border-red-400/30 hover:border-red-500/30;
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.tv-btn.danger:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

/* Channel List Styling */
.channel-list {
  @apply grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3;
}

.channel-item {
  @apply p-4 rounded-xl border transition-all duration-200 cursor-pointer
           text-white font-medium;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.channel-item:hover {
  @apply transform scale-105 -translate-y-0.5 bg-blue-500/20;
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 15px rgba(59, 130, 246, 0.2);
}

.channel-item.active {
  @apply bg-blue-500/30 border-blue-400/50;
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 15px rgba(59, 130, 246, 0.3);
}

.channel-item {
  @apply p-4 rounded-xl transition-all duration-200 cursor-pointer
           bg-white/10 hover:bg-white/20
           border border-white/10 hover:border-white/30
           relative overflow-hidden;
}

.channel-item:hover {
  @apply transform scale-[1.02] -translate-y-0.5;
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 15px rgba(59, 130, 246, 0.2);
}

.channel-item.active {
  @apply bg-blue-500/20 border-blue-400/50;
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 15px rgba(59, 130, 246, 0.3);
}

.channel-item::before {
  content: "";
  @apply absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500;
}

.channel-item:hover::before {
  @apply opacity-100;
}

.channel-number {
  @apply w-8 h-8 rounded-lg bg-white/10 
           flex items-center justify-center
           text-blue-300 font-bold text-sm mr-4;
}

.channel-name {
  @apply text-white text-base font-semibold tracking-wide;
}

/* Source Categories */
.source-categories {
  @apply flex flex-wrap gap-3;
}

.source-category {
  @apply px-4 py-2 rounded-lg cursor-pointer
           bg-white/10 hover:bg-white/20
           border border-white/10 hover:border-white/30
           text-white/90 hover:text-white
           font-medium text-sm
           transition-all duration-200;
}

.source-category.active {
  @apply bg-blue-500 border-blue-400
           text-white font-semibold;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
}

/* Scrollbar Styling */
.tv-channel-content {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);
}

.tv-channel-content::-webkit-scrollbar {
  @apply w-1.5;
}

.tv-channel-content::-webkit-scrollbar-track {
  @apply bg-white/5 rounded-full;
}

.tv-channel-content::-webkit-scrollbar-thumb {
  @apply bg-white/20 rounded-full
           hover:bg-white/30 
           transition-colors duration-200;
}

/* Alist Item Styles */
.alist-item {
  @apply p-4 rounded-xl transition-all duration-200 cursor-pointer
           bg-white/10 hover:bg-white/15
           border border-white/10
           text-white
           relative overflow-hidden;
}

.alist-item:hover {
  @apply transform scale-[1.02] -translate-y-0.5 border-white/20;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.alist-item.folder-item {
  @apply bg-yellow-500/10 hover:bg-yellow-500/20
           border-yellow-500/20 hover:border-yellow-500/30;
}

.alist-item.folder-item:hover {
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 15px rgba(234, 179, 8, 0.2);
}

.alist-item.file-item {
  @apply bg-blue-500/10 hover:bg-blue-500/20
           border-blue-500/20 hover:border-blue-500/30;
}

.alist-item.file-item:hover {
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 15px rgba(59, 130, 246, 0.2);
}

.alist-item.file-item.active {
  @apply bg-blue-500/30 border-blue-400/50;
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 15px rgba(59, 130, 246, 0.3);
}

.alist-item.setting-item {
  @apply bg-purple-500/10 hover:bg-purple-500/20
           border-purple-500/20 hover:border-purple-500/30;
}

.alist-item.setting-item:hover {
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 15px rgba(168, 85, 247, 0.2);
}

.alist-item.setting-item.active {
  @apply bg-purple-500/30 border-purple-400/50 text-white;
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 15px rgba(168, 85, 247, 0.3);
}

/* Alist Navigation Buttons */
.alist-nav {
  @apply flex flex-wrap items-center gap-3;
}

.alist-nav-btn {
  @apply flex items-center space-x-2 px-4 py-2
           rounded-xl transition-all duration-200
           font-medium text-sm
           border border-white/10
           hover:scale-105 hover:-translate-y-0.5;
}

.alist-nav-btn svg {
  @apply transition-transform duration-200;
}

.alist-nav-btn:hover svg {
  @apply transform scale-110;
}

.alist-nav-btn.back {
  @apply bg-gray-500/20 hover:bg-gray-500/30
           text-gray-200 hover:text-white;
}

.alist-nav-btn.back:hover {
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 15px rgba(107, 114, 128, 0.3);
}

.alist-nav-btn.home {
  @apply bg-blue-500/20 hover:bg-blue-500/30
           text-blue-200 hover:text-white;
}

.alist-nav-btn.home:hover {
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 15px rgba(59, 130, 246, 0.3);
}

.alist-nav-btn.settings {
  @apply bg-purple-500/20 hover:bg-purple-500/30
           text-purple-200 hover:text-white;
}

.alist-nav-btn.settings:hover {
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 15px rgba(168, 85, 247, 0.3);
}

.alist-nav-btn.settings.active {
  @apply bg-purple-500/40 border-purple-400/50 text-white;
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 15px rgba(168, 85, 247, 0.4);
}

.control-power-btn {
  @apply relative flex items-center justify-center;
  width: 50px;
  height: 50px;
  background: radial-gradient(circle at center, #e74c3c, #c0392b);
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: white;
  font-weight: bold;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 0 20px rgba(231, 76, 60, 0.5),
    inset 0 0 15px rgba(0, 0, 0, 0.3),
    0 2px 0 rgba(255, 255, 255, 0.2);
}

.control-power-btn.power-on {
  background: radial-gradient(circle at center, #2ecc71, #27ae60);
  box-shadow:
    0 0 20px rgba(46, 204, 113, 0.5),
    inset 0 0 15px rgba(0, 0, 0, 0.3),
    0 2px 0 rgba(255, 255, 255, 0.2);
}

.control-power-btn.power-on::before {
  background: conic-gradient(
    from 0deg,
    transparent,
    rgba(46, 204, 113, 0.3),
    transparent
  );
}

.control-power-btn.power-on::after {
  background: radial-gradient(circle at center, #2ecc71, #27ae60);
}

.control-power-btn.power-on:hover {
  box-shadow:
    0 0 30px rgba(46, 204, 113, 0.7),
    inset 0 0 15px rgba(0, 0, 0, 0.3),
    0 2px 0 rgba(255, 255, 255, 0.2);
}

.power-status {
  @apply absolute -top-1 -right-1 flex items-center gap-1 text-xs;
  transform: translateY(-100%);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #e74c3c;
  transition: all 0.3s ease;
}

.status-dot.active {
  background-color: #2ecc71;
  box-shadow: 0 0 10px rgba(46, 204, 113, 0.5);
  animation: pulse 2s infinite;
}

.status-text {
  @apply text-xs font-medium;
  color: rgba(255, 255, 255, 0.8);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* 移动端适配 */
@media (max-width: 640px) {
  .tv-frame {
    padding: 4px;
    border-width: 8px;
  }

  .tv-screen {
    border-width: 4px !important;
  }

  .tv-control-panel {
    padding: 10px;
    margin-top: 10px;
  }

  .tv-brand {
    margin-bottom: 2px;
  }

  .control-power-btn {
    transform: scale(0.9);
  }
}

@media (max-width: 480px) {
  .tv-channel-dialog {
    @apply w-[95%] h-[95vh];
  }

  .channel-search {
    @apply flex-col gap-2;
  }

  .channel-search .tv-input {
    @apply w-full;
  }

  .channel-search .tv-btn {
    @apply w-full;
  }
}

/* 添加自适应缩放 */
.tv-container {
  transform-origin: center center;
  transition: transform 0.3s ease;
}
</style>
