<script setup>
import Hls from "hls.js";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { ElMessage } from "element-plus";
import Header from "~/components/layout/netdisk/Header.vue";

definePageMeta({ layout: "custom" });

useSeoMeta({
  title: "AIPAN AList - 在线网盘目录浏览与视频播放",
  description: "AIPAN AList 支持选择已配置的 AList 源，浏览目录，播放视频和音频，并下载文件。",
  keywords: "AList,在线网盘,视频播放,音频播放,文件下载,目录浏览,网盘播放器",
});

const sources = ref([]);
const selectedSourceId = ref("");
const currentPath = ref("/");
const pathPassword = ref("");
const files = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(100);
const hasMore = ref(false);
const listLoading = ref(false);
const sourceLoading = ref(false);
const fileLoading = ref(false);
const currentFileName = ref("");
const currentFile = ref(null);
const currentFilePlayUrl = ref("");
const currentMediaKind = ref("");
const currentFileMessage = ref("");
const videoNoPicture = ref(false);
const videoPlayer = ref(null);
const audioPlayer = ref(null);
let player = null;
let hls = null;

const videoNoPictureMessage =
  "未检测到可显示的视频画面，可能是浏览器不支持当前视频编码（常见 H.265/HEVC、10-bit 或 AV1）。可下载后用外部播放器打开。";

const { accessStatus, ensureAccess } = useFeatureAccess("alist");
const shouldShowAccessNotice = computed(() => {
  return accessStatus.value.loading ||
    (accessStatus.value.checked && !accessStatus.value.allowed);
});

const getAuthHeaders = () => {
  const token = useCookie("token").value;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const selectedSource = computed(() =>
  sources.value.find((source) => String(source.id) === String(selectedSourceId.value)),
);

const breadcrumbs = computed(() => {
  const parts = currentPath.value.split("/").filter(Boolean);
  return parts.map((name, index) => ({
    name,
    path: `/${parts.slice(0, index + 1).join("/")}`,
  }));
});

const videoFilePattern = /\.(m3u8|mp4|mkv|webm|mov|ts)(\?.*)?$/i;
const nativeAudioFilePattern = /\.(mp3|m4a|aac|wav|ogg|flac)(\?.*)?$/i;
const audioFilePattern = /\.(mp3|m4a|aac|wav|ogg|flac|wma)(\?.*)?$/i;

const isVideoFile = (name = "") => videoFilePattern.test(name);
const isNativeAudioFile = (name = "") => nativeAudioFilePattern.test(name);
const isAudioFile = (name = "") => audioFilePattern.test(name);

const joinPath = (base, name) => {
  const parts = `${base || "/"}/${name || ""}`.split("/").filter(Boolean);
  return parts.length ? `/${parts.join("/")}` : "/";
};

const getVideoType = (url) => {
  if (/\.m3u8(\?.*)?$/i.test(url)) return "application/x-mpegURL";
  if (/\.mp4(\?.*)?$/i.test(url)) return "video/mp4";
  if (/\.mkv(\?.*)?$/i.test(url)) return "video/webm";
  if (/\.webm(\?.*)?$/i.test(url)) return "video/webm";
  if (/\.mov(\?.*)?$/i.test(url)) return "video/quicktime";
  if (/\.ts(\?.*)?$/i.test(url)) return "video/mp2t";
  return "video/mp4";
};

const formatFileSize = (value) => {
  const size = Number(value || 0);
  if (!Number.isFinite(size) || size <= 0) return "未知大小";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let current = size;
  let index = 0;
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index += 1;
  }
  return `${current.toFixed(current >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const getItemIcon = (item) => {
  if (item.is_dir) return "fa-solid fa-folder text-amber-500";
  if (isVideoFile(item.name)) return "fa-solid fa-circle-play text-blue-500";
  if (isAudioFile(item.name)) return "fa-solid fa-music text-emerald-500";
  return "fa-solid fa-file-arrow-down text-slate-500";
};

const getItemBadge = (item) => {
  if (item.is_dir) return "";
  if (isVideoFile(item.name)) return "视频";
  if (isNativeAudioFile(item.name)) return "音频";
  if (isAudioFile(item.name)) return "需下载";
  return "下载";
};

const resetCurrentFile = () => {
  currentFileName.value = "";
  currentFile.value = null;
  currentFilePlayUrl.value = "";
  currentMediaKind.value = "";
  currentFileMessage.value = "";
  videoNoPicture.value = false;
  fileLoading.value = false;
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlayer.value.removeAttribute("src");
    audioPlayer.value.load();
  }
};

const stopVideo = () => {
  videoNoPicture.value = false;
  if (hls) {
    hls.destroy();
    hls = null;
  }
  if (player) {
    player.pause();
    player.reset();
  }
};

const checkVideoPicture = () => {
  const video = videoPlayer.value;
  if (!video || currentMediaKind.value !== "video") return;

  if (video.videoWidth > 0 || video.videoHeight > 0) {
    videoNoPicture.value = false;
    if (currentFileMessage.value === videoNoPictureMessage) {
      currentFileMessage.value = "";
    }
    return;
  }

  if (video.readyState >= 2 && video.currentTime > 0) {
    videoNoPicture.value = true;
    currentFileMessage.value = videoNoPictureMessage;
    fileLoading.value = false;
  }
};

const scheduleVideoPictureCheck = () => {
  if (typeof window === "undefined") return;
  window.setTimeout(checkVideoPicture, 1200);
};

const loadSources = async () => {
  sourceLoading.value = true;
  try {
    const res = await $fetch("/api/alist/sources", {
      headers: getAuthHeaders(),
    });
    sources.value = Array.isArray(res.data) ? res.data : [];
    if (!selectedSourceId.value && sources.value.length) {
      selectedSourceId.value = String(sources.value[0].id);
    }
  } catch (error) {
    ElMessage.error("AList 源加载失败");
  } finally {
    sourceLoading.value = false;
  }
};

const fetchList = async (path = currentPath.value, refresh = false, page = 1) => {
  if (!selectedSourceId.value) {
    files.value = [];
    total.value = 0;
    currentPage.value = 1;
    hasMore.value = false;
    return;
  }

  listLoading.value = true;
  try {
    const res = await $fetch("/api/alist/list", {
      method: "POST",
      headers: getAuthHeaders(),
      body: {
        sourceId: Number(selectedSourceId.value),
        path,
        password: pathPassword.value,
        page,
        perPage: pageSize.value,
        refresh,
      },
    });
    currentPath.value = res.data.path || "/";
    currentPage.value = Number(res.data.page || page);
    pageSize.value = Number(res.data.perPage || pageSize.value);
    files.value = Array.isArray(res.data.content) ? res.data.content : [];
    total.value = Number(res.data.total || files.value.length);
    hasMore.value = Boolean(res.data.hasMore);
    if (res.data.refreshDenied) {
      ElMessage.warning("当前 AList 源不允许强制刷新，已加载缓存目录");
    }
  } catch (error) {
    const message = error?.statusMessage || error?.message || "目录读取失败";
    ElMessage.error(message);
    files.value = [];
    total.value = 0;
    hasMore.value = false;
  } finally {
    listLoading.value = false;
  }
};

const loadVideo = async (url) => {
  const showSpinner = () => { fileLoading.value = true; };
  const hideSpinner = () => { fileLoading.value = false; };
  const type = getVideoType(url);

  videoNoPicture.value = false;
  await nextTick();
  if (typeof window !== "undefined") {
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
  }

  if (!videoPlayer.value) {
    fileLoading.value = false;
    currentFileMessage.value = "视频播放器初始化失败，可尝试下载";
    return;
  }

  if (!player) {
    player = videojs(videoPlayer.value, { controls: true, fill: true });
    player.on("waiting", showSpinner);
    player.on("playing", () => { hideSpinner(); scheduleVideoPictureCheck(); });
    player.on("loadeddata", () => { hideSpinner(); scheduleVideoPictureCheck(); });
    player.on("loadedmetadata", () => { hideSpinner(); scheduleVideoPictureCheck(); });
    player.on("error", () => {
      hideSpinner();
      videoNoPicture.value = false;
      currentFileMessage.value = "视频播放失败，可尝试下载或用外部播放器打开";
    });
  }

  if (type === "application/x-mpegURL" && Hls.isSupported()) {
    if (!hls) {
      hls = new Hls();
      hls.attachMedia(videoPlayer.value);
      hls.on(Hls.Events.MANIFEST_LOADING, showSpinner);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { hideSpinner(); scheduleVideoPictureCheck(); });
      hls.on(Hls.Events.ERROR, hideSpinner);
    }
    hls.loadSource(url);
  } else {
    if (hls) { hls.destroy(); hls = null; }
    showSpinner();
    player.src({ type, src: url });
  }

  player.trigger("resize");
  const playPromise = player.play();
  playPromise?.catch?.(() => {
    fileLoading.value = false;
    currentFileMessage.value = "浏览器阻止自动播放，请点击播放器播放";
  });
};

const loadAudio = async (url) => {
  stopVideo();
  currentMediaKind.value = "audio";
  fileLoading.value = true;
  await nextTick();
  if (!audioPlayer.value) {
    fileLoading.value = false;
    currentFileMessage.value = "音频播放器初始化失败，可尝试下载";
    return;
  }

  audioPlayer.value.src = url;
  audioPlayer.value.load();
  audioPlayer.value.play().catch(() => {
    currentFileMessage.value = "浏览器阻止自动播放，请点击播放器播放";
  }).finally(() => {
    fileLoading.value = false;
  });
};

const openItem = async (item) => {
  const nextPath = joinPath(currentPath.value, item.name);

  if (item.is_dir) {
    resetCurrentFile();
    await fetchList(nextPath, false, 1);
    return;
  }

  fileLoading.value = true;
  try {
    const res = await $fetch("/api/alist/get", {
      method: "POST",
      headers: getAuthHeaders(),
      body: {
        sourceId: Number(selectedSourceId.value),
        path: nextPath,
        password: pathPassword.value,
      },
    });
    currentFileName.value = item.name;
    currentFile.value = {
      ...item,
      path: nextPath,
      file: res.data.file || {},
    };
    currentFilePlayUrl.value = res.data.playUrl;
    currentFileMessage.value = "";

    if (isVideoFile(item.name)) {
      currentMediaKind.value = "video";
      await loadVideo(res.data.playUrl);
      return;
    }

    if (isNativeAudioFile(item.name)) {
      await loadAudio(res.data.playUrl);
      return;
    }

    stopVideo();
    currentMediaKind.value = "download";
    fileLoading.value = false;
    currentFileMessage.value = isAudioFile(item.name)
      ? "当前音频格式浏览器通常不支持在线播放，可下载后播放"
      : "当前文件不支持在线播放，可下载或用外部应用打开";
    ElMessage.warning(currentFileMessage.value);
  } catch (error) {
    const message = error?.statusMessage || error?.message || "文件地址获取失败";
    ElMessage.error(message);
    fileLoading.value = false;
  }
};

const goBreadcrumb = async (path) => {
  await fetchList(path, false, 1);
};

const goBack = async () => {
  const parts = currentPath.value.split("/").filter(Boolean);
  if (!parts.length) return;
  parts.pop();
  await fetchList(parts.length ? `/${parts.join("/")}` : "/", false, 1);
};

const goPage = async (page) => {
  if (page < 1 || listLoading.value) return;
  await fetchList(currentPath.value, false, page);
};

watch(selectedSourceId, async () => {
  if (shouldShowAccessNotice.value) return;
  currentPath.value = "/";
  files.value = [];
  resetCurrentFile();
  await fetchList("/", false, 1);
});

onMounted(async () => {
  const access = await ensureAccess();
  if (!access.allowed) return;

  await loadSources();
});

onBeforeUnmount(() => {
  if (hls) { hls.destroy(); hls = null; }
  if (player) { player.dispose(); player = null; }
});
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-900 dark:bg-gray-950 dark:text-slate-100">
    <Header />

    <main class="mx-auto flex w-full max-w-screen-xl flex-col gap-4 px-4 pb-8 pt-20 md:px-6">
      <FeatureAccessNotice
        v-if="shouldShowAccessNotice"
        :status="accessStatus"
        feature-name="AList"
      />

      <template v-else>
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <h1 class="text-base font-semibold text-slate-950 dark:text-white">AList</h1>
            <p class="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {{ selectedSource?.name || "请选择 AList 源" }} · {{ currentPath }}
            </p>
          </div>
          <NuxtLink
            to="/tv"
            class="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <i class="fa-solid fa-tv"></i>
            TV直播
          </NuxtLink>
        </div>

        <section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div class="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div class="relative bg-black" style="aspect-ratio: 16 / 9">
            <video
              v-show="currentMediaKind === 'video'"
              ref="videoPlayer"
              class="video-js h-full w-full"
              @loadedmetadata="scheduleVideoPictureCheck"
              @playing="scheduleVideoPictureCheck"
            ></video>
            <div
              v-show="currentMediaKind === 'audio'"
              class="flex h-full flex-col items-center justify-center gap-4 px-6 text-center"
            >
              <div class="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                <i class="fa-solid fa-music text-xl"></i>
              </div>
              <div class="w-full max-w-xl">
                <p class="mb-3 truncate text-sm font-semibold text-white">{{ currentFileName }}</p>
                <audio
                  ref="audioPlayer"
                  controls
                  class="w-full"
                  @canplay="fileLoading = false"
                  @playing="fileLoading = false"
                  @error="currentFileMessage = '音频播放失败，可尝试下载或用外部播放器打开'; fileLoading = false"
                ></audio>
              </div>
            </div>
            <div
              v-if="!currentMediaKind"
              class="absolute inset-0 flex flex-col items-center justify-center bg-black text-center"
            >
              <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400">
                <i class="fa-solid fa-play text-xl"></i>
              </div>
              <p class="text-sm font-medium text-slate-400">选择文件开始播放或下载</p>
            </div>
            <div
              v-if="currentMediaKind === 'download'"
              class="absolute inset-0 flex flex-col items-center justify-center bg-black px-6 text-center"
            >
              <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300">
                <i class="fa-solid fa-file-arrow-down text-xl"></i>
              </div>
              <p class="max-w-lg truncate text-sm font-semibold text-white">{{ currentFileName }}</p>
              <p class="mt-2 text-xs text-slate-400">{{ currentFileMessage }}</p>
              <a
                v-if="currentFilePlayUrl"
                :href="currentFilePlayUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                <i class="fa-solid fa-download"></i>
                下载 / 打开
              </a>
            </div>
            <div
              v-if="videoNoPicture"
              class="absolute inset-0 flex flex-col items-center justify-center bg-black/85 px-6 text-center"
            >
              <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-amber-300/20 bg-amber-300/10 text-amber-200">
                <i class="fa-solid fa-triangle-exclamation text-xl"></i>
              </div>
              <p class="max-w-lg text-sm font-semibold text-white">当前视频只有声音没有画面</p>
              <p class="mt-2 max-w-xl text-xs leading-5 text-slate-300">{{ currentFileMessage }}</p>
              <a
                v-if="currentFilePlayUrl"
                :href="currentFilePlayUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                <i class="fa-solid fa-download"></i>
                下载 / 打开
              </a>
            </div>
            <div v-if="fileLoading" class="absolute inset-0 flex items-center justify-center bg-black/60">
              <div class="h-10 w-10 rounded-full border-2 border-blue-400/25 border-t-blue-400 animate-spin"></div>
            </div>
          </div>
          <div class="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 dark:border-white/10">
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold">{{ currentFileName || "未选择文件" }}</p>
              <p class="truncate text-xs text-slate-500 dark:text-slate-400">
                <span>{{ selectedSource?.name || "请选择 AList 源" }}</span>
                <span v-if="currentFile"> · {{ formatFileSize(currentFile.size || currentFile.file?.size) }}</span>
                <span v-if="currentFileMessage"> · {{ currentFileMessage }}</span>
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <a
                v-if="currentFilePlayUrl"
                :href="currentFilePlayUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                <i class="fa-solid fa-download"></i>
                下载
              </a>
            </div>
          </div>
        </div>

        <aside class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div class="space-y-3 border-b border-slate-100 p-4 dark:border-white/10">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400">AList 源</label>
              <span class="text-xs text-slate-400">共 {{ total || files.length }} 项</span>
            </div>
            <select
              v-model="selectedSourceId"
              :disabled="sourceLoading"
              class="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-blue-300 dark:border-white/10 dark:bg-slate-950 dark:focus:border-blue-500/50"
            >
              <option value="">请选择</option>
              <option v-for="source in sources" :key="source.id" :value="String(source.id)">
                {{ source.name }}
              </option>
            </select>
            <input
              v-model="pathPassword"
              type="password"
              placeholder="路径密码（如有）"
              class="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-300 dark:border-white/10 dark:bg-slate-950 dark:focus:border-blue-500/50"
              @keydown.enter="fetchList(currentPath, true, currentPage)"
            />
          </div>

          <div class="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm dark:border-white/10">
            <button
              class="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"
              :disabled="currentPath === '/'"
              title="返回上级"
              @click="goBack"
            >
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <button
              class="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
              title="刷新"
              @click="fetchList(currentPath, true, currentPage)"
            >
              <i class="fa-solid fa-rotate-right"></i>
            </button>
            <div class="min-w-0 flex-1 truncate text-xs text-slate-500 dark:text-slate-400">
              <button class="font-semibold text-blue-600 dark:text-blue-400" @click="goBreadcrumb('/')">根目录</button>
              <template v-for="crumb in breadcrumbs" :key="crumb.path">
                <span class="mx-1">/</span>
                <button class="hover:text-blue-600 dark:hover:text-blue-400" @click="goBreadcrumb(crumb.path)">
                  {{ crumb.name }}
                </button>
              </template>
            </div>
          </div>

          <div v-loading="listLoading" class="max-h-[calc(100vh-330px)] min-h-80 overflow-y-auto p-3">
            <div v-if="!sources.length && !sourceLoading" class="py-12 text-center text-sm text-slate-500">
              暂无可用 AList 源
            </div>
            <div v-else-if="!files.length && !listLoading" class="py-12 text-center text-sm text-slate-500">
              当前目录为空
            </div>
            <button
              v-for="item in files"
              :key="`${item.name}-${item.modified}`"
              class="flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors"
              :class="!item.is_dir && currentFileName === item.name
                ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300'
                : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-white/5'"
              @click="openItem(item)"
            >
              <i
                class="w-4 text-center"
                :class="getItemIcon(item)"
              ></i>
              <span class="min-w-0 flex-1 truncate">{{ item.name }}</span>
              <span v-if="getItemBadge(item)" class="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-white/10 dark:text-slate-300">
                {{ getItemBadge(item) }}
              </span>
            </button>
          </div>

          <div class="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-2 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
            <span>共 {{ total || files.length }} 项 · 第 {{ currentPage }} 页</span>
            <div class="flex items-center gap-2">
              <button
                class="rounded-md border border-slate-200 px-2 py-1 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"
                :disabled="currentPage <= 1 || listLoading"
                @click="goPage(currentPage - 1)"
              >
                上一页
              </button>
              <button
                class="rounded-md border border-slate-200 px-2 py-1 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5"
                :disabled="!hasMore || listLoading"
                @click="goPage(currentPage + 1)"
              >
                下一页
              </button>
            </div>
          </div>
        </aside>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
:deep(.video-js) {
  width: 100% !important;
  height: 100% !important;
  background: #000;
}
</style>
