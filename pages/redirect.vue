<template>
  <div
    class="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300"
  >
    <!-- Header -->
    <header
      class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm border-b border-gray-100/50 dark:border-gray-700/50 sticky top-0 z-20 transition-colors duration-300"
    >
      <div
        class="max-w-[1240px] mx-auto h-16 flex items-center justify-between px-4 sm:px-6"
      >
        <div
          class="flex items-center gap-2 md:gap-3 cursor-pointer hover:scale-105 transition-transform duration-300"
          @click="goBack"
        >
          <img
            class="w-6 h-6 md:w-10 md:h-10 dark:opacity-90"
            src="@/assets/my-logo.png"
            alt="logo"
          />
          <div class="text-left hidden md:block">
            <h1
              class="text-xs md:text-sm font-bold bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"
            >
              AIPAN.ME
            </h1>
            <p class="text-gray-500 text-[10px] md:text-xs dark:text-gray-400">
              爱盼 - 安全跳转
            </p>
          </div>
        </div>

        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm transition-all duration-200 hover:shadow active:scale-95"
          @click="goBack"
        >
          <i class="fas fa-arrow-left text-xs"></i>
          <span>返回爱盼</span>
        </button>
      </div>
    </header>

    <!-- Error state -->
    <div
      v-if="error"
      class="max-w-[1240px] mx-auto px-4 sm:px-6 flex items-center justify-center"
      style="min-height: calc(100vh - 4rem)"
    >
      <div
        class="w-full max-w-md text-center bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/40 border border-gray-100 dark:border-gray-700 p-8 sm:p-10 transition-colors duration-300"
      >
        <div
          class="w-16 h-16 mx-auto mb-5 rounded-2xl bg-linear-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-red-500/20"
        >
          <i class="fas fa-triangle-exclamation text-white text-2xl"></i>
        </div>
        <h1
          class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3"
        >
          {{ error }}
        </h1>
        <p
          class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8"
        >
          当前链接参数没有通过校验，页面不会继续离站。你可以返回爱盼重新检索资源。
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 active:scale-95"
          @click="goBack"
        >
          <i class="fas fa-house text-xs"></i>
          返回首页
        </button>
      </div>
    </div>

    <!-- Main content -->
    <main
      v-else
      class="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-8"
    >
      <div class="grid gap-6 lg:grid-cols-[1fr_340px] lg:gap-8">
        <!-- Left column -->
        <div class="space-y-5">
          <!-- Service identity card -->
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-700 p-5 sm:p-6 transition-colors duration-300"
          >
            <div class="flex items-center gap-3 mb-5">
              <div
                class="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg text-white text-lg"
                :style="{
                  background: `linear-gradient(135deg, ${serviceAppearance.accent}, ${serviceAppearance.accentStrong})`,
                  boxShadow: `0 8px 16px ${serviceAppearance.accent}33`,
                }"
              >
                <i :class="serviceAppearance.icon"></i>
              </div>
              <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span
                  class="text-xs font-bold tracking-wide uppercase px-2.5 py-1 rounded-md text-white"
                  :style="{
                    background: `linear-gradient(135deg, ${serviceAppearance.accent}, ${serviceAppearance.accentStrong})`,
                  }"
                >
                  {{ targetCategoryName }}
                </span>
                <span
                  class="text-base font-semibold text-gray-900 dark:text-white"
                >
                  {{ targetServiceName }}
                </span>
                <span class="text-xs text-gray-400 dark:text-gray-500">
                  {{ targetHost }}
                </span>
              </div>
            </div>

            <h1
              class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 leading-tight"
            >
              {{ headlinePrimary }}
            </h1>
            <p
              class="text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl"
            >
              {{ targetSubtitle }}
            </p>
          </div>

          <!-- URL display card -->
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300"
          >
            <div
              class="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700"
            >
              <div class="flex items-center gap-2">
                <i
                  class="fas fa-link text-xs"
                  :style="{ color: serviceAppearance.accent }"
                ></i>
                <span
                  class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide"
                >
                  目标链接
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="w-2 h-2 rounded-full animate-pulse"
                  :style="{
                    backgroundColor: serviceAppearance.accent,
                    boxShadow: `0 0 6px ${serviceAppearance.accent}80`,
                  }"
                ></span>
                <span
                  class="text-xs text-gray-400 dark:text-gray-500"
                >
                  {{ targetHost }}
                </span>
              </div>
            </div>
            <div
              class="px-5 py-4 bg-gray-50/50 dark:bg-gray-900/30"
            >
              <code
                class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-all font-mono"
              >
                {{ displayUrl }}
              </code>
            </div>
          </div>

          <!-- Action bar -->
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-700 p-5 transition-colors duration-300"
          >
            <div class="flex flex-col sm:flex-row items-center gap-4">
              <!-- Countdown -->
              <div class="flex items-center gap-4 flex-shrink-0">
                <div class="relative w-14 h-14">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 56 56">
                    <circle
                      cx="28" cy="28" r="24"
                      fill="none"
                      class="stroke-gray-200 dark:stroke-gray-700"
                      stroke-width="3"
                    />
                    <circle
                      cx="28" cy="28" r="24"
                      fill="none"
                      :stroke="serviceAppearance.accent"
                      stroke-width="3"
                      stroke-linecap="round"
                      :stroke-dasharray="circumference"
                      :stroke-dashoffset="strokeOffset"
                      class="transition-[stroke-dashoffset] duration-700 ease-out"
                      :style="{ filter: `drop-shadow(0 0 4px ${serviceAppearance.accent}66)` }"
                    />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-lg font-bold text-gray-900 dark:text-white leading-none">
                      {{ countdown }}
                    </span>
                    <span class="text-[10px] text-gray-400 dark:text-gray-500">秒</span>
                  </div>
                </div>
                <p class="text-xs text-gray-400 dark:text-gray-500 hidden sm:block max-w-[140px]">
                  {{ countdownDescription }}
                </p>
              </div>

              <!-- Buttons -->
              <div class="flex gap-3 flex-1 sm:justify-end w-full sm:w-auto">
                <button
                  type="button"
                  class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 active:scale-95"
                  @click="handleRedirect"
                >
                  <i class="fas fa-arrow-up-right-from-square text-xs"></i>
                  {{ primaryActionText }}
                </button>
                <button
                  type="button"
                  class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm transition-all duration-200 hover:shadow active:scale-95"
                  @click="copyTargetUrl"
                >
                  <i class="fas fa-copy text-xs"></i>
                  复制链接
                </button>
              </div>
            </div>

            <!-- Mobile countdown hint -->
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center sm:hidden">
              {{ countdownDescription }}
            </p>
          </div>

          <!-- Meta info -->
          <div
            class="flex flex-wrap gap-x-8 gap-y-3 px-1"
          >
            <div v-for="item in metaItems" :key="item.label">
              <span
                class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-0.5"
              >
                {{ item.label }}
              </span>
              <span
                class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {{ item.value }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right sidebar - Safety panel -->
        <aside class="lg:sticky lg:top-24 self-start space-y-5">
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-700 p-5 sm:p-6 transition-colors duration-300"
          >
            <!-- Safety header -->
            <div class="flex items-center gap-3 mb-5">
              <div
                class="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20"
              >
                <i class="fas fa-shield-halved text-white text-sm"></i>
              </div>
              <div>
                <h2 class="text-base font-bold text-gray-900 dark:text-white">
                  安全提示
                </h2>
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  出站前请确认
                </p>
              </div>
            </div>

            <!-- Safety tips -->
            <div class="space-y-0">
              <div
                v-for="(tip, index) in safetyTips"
                :key="index"
                class="flex gap-3 py-3.5 border-t border-gray-100 dark:border-gray-700/60 first:border-t-0 first:pt-0"
              >
                <span
                  class="text-xs font-bold mt-0.5 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-linear-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 text-purple-600 dark:text-purple-400"
                >
                  {{ index + 1 }}
                </span>
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {{ tip }}
                </p>
              </div>
            </div>
          </div>

          <!-- Quick info card -->
          <div
            class="bg-linear-to-br from-purple-500/5 to-blue-500/5 dark:from-purple-500/10 dark:to-blue-500/10 rounded-2xl border border-purple-200/30 dark:border-purple-700/20 p-5 transition-colors duration-300"
          >
            <div class="flex items-start gap-3">
              <i class="fas fa-circle-info text-purple-500 dark:text-purple-400 mt-0.5"></i>
              <div>
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  关于出站跳转
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  爱盼只做公开资源聚合索引，所有外部链接均由用户提交。点击"继续前往"即表示您已了解并同意自行承担访问风险。
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  detectLinkService,
  getLinkCategoryName,
  getLinkServiceName,
  isDirectProtocolLink,
  normalizeLinkService,
} from "~/utils/linkTypes";
import { getSingleQueryValue } from "~/utils/routeQuery";

definePageMeta({
  layout: "custom",
});

const route = useRoute();
const router = useRouter();

const redirectThemeMap = {
  BAIDU: {
    accent: "#3B82F6",
    accentStrong: "#1D4ED8",
    icon: "fas fa-hard-drive",
  },
  QUARK: {
    accent: "#10B981",
    accentStrong: "#059669",
    icon: "fas fa-cloud",
  },
  ALIYUN: {
    accent: "#F59E0B",
    accentStrong: "#D97706",
    icon: "fas fa-box-archive",
  },
  XUNLEI: {
    accent: "#EAB308",
    accentStrong: "#CA8A04",
    icon: "fas fa-bolt",
  },
  UC: {
    accent: "#F97316",
    accentStrong: "#EA580C",
    icon: "fas fa-globe",
  },
  "115": {
    accent: "#0EA5E9",
    accentStrong: "#0284C7",
    icon: "fas fa-database",
  },
  TIANYI: {
    accent: "#06B6D4",
    accentStrong: "#0891B2",
    icon: "fas fa-satellite-dish",
  },
  MOBILE: {
    accent: "#14B8A6",
    accentStrong: "#0D9488",
    icon: "fas fa-signal",
  },
  PIKPAK: {
    accent: "#8B5CF6",
    accentStrong: "#7C3AED",
    icon: "fas fa-wand-magic-sparkles",
  },
  "123": {
    accent: "#EF4444",
    accentStrong: "#DC2626",
    icon: "fas fa-cubes",
  },
  MAGNET: {
    accent: "#F43F5E",
    accentStrong: "#E11D48",
    icon: "fas fa-magnet",
  },
  ED2K: {
    accent: "#D946EF",
    accentStrong: "#C026D3",
    icon: "fas fa-network-wired",
  },
  OTHER: {
    accent: "#6B7280",
    accentStrong: "#4B5563",
    icon: "fas fa-link",
  },
};

const countdown = ref(5);
const initialCountdown = 5;
const targetUrl = ref("");
const error = ref("");
const isRedirecting = ref(false);

const circumference = computed(() => 2 * Math.PI * 24);
const strokeOffset = computed(() => {
  const progress = countdown.value / initialCountdown;
  return circumference.value * progress;
});

const targetService = computed(() => {
  return detectLinkService(
    targetUrl.value,
    normalizeLinkService(getSingleQueryValue(route.query.service))
  );
});

const serviceAppearance = computed(() => {
  return redirectThemeMap[targetService.value] || redirectThemeMap.OTHER;
});

const targetServiceName = computed(() => getLinkServiceName(targetService.value));
const targetCategoryName = computed(() => getLinkCategoryName(targetService.value));

const targetHost = computed(() => {
  if (!targetUrl.value) {
    return "external";
  }

  if (isDirectProtocolLink(targetUrl.value)) {
    return "local handler";
  }

  try {
    return new URL(targetUrl.value).hostname.replace(/^www\./, "");
  } catch {
    return "external";
  }
});

const headlinePrimary = computed(() => {
  if (targetCategoryName.value === "下载协议") {
    return `准备唤起 ${targetServiceName.value}`;
  }

  return `准备进入 ${targetServiceName.value}`;
});

const targetSubtitle = computed(() => {
  if (targetCategoryName.value === "下载协议") {
    return `该链接会直接交给系统或下载器处理，不会再进入爱盼站内验证页。继续前请确认本机已安装对应协议处理工具，并核对资源来源。`;
  }

  if (targetCategoryName.value === "网盘链接") {
    return `你即将离开 aipan.me，在当前标签页继续进入 ${targetServiceName.value}。爱盼只做公开资源聚合，不托管文件本身，也不控制目标平台内容。`;
  }

  return `你即将离开 aipan.me，访问外部站点。请在继续前核对域名、页面意图与资源说明。`;
});

const displayUrl = computed(() => {
  if (!targetUrl.value) {
    return "";
  }

  if (targetUrl.value.length > 170) {
    return `${targetUrl.value.slice(0, 170)}...`;
  }

  return targetUrl.value;
});

const primaryActionText = computed(() => {
  return targetCategoryName.value === "下载协议"
    ? `立即唤起 (${countdown.value}s)`
    : `继续前往 (${countdown.value}s)`;
});

const countdownDescription = computed(() => {
  if (countdown.value > 0) {
    return `${countdown.value} 秒后自动跳转`;
  }

  return "正在执行跳转…";
});

const metaItems = computed(() => [
  { label: "资源类型", value: targetCategoryName.value },
  { label: "目标站点", value: targetHost.value },
  { label: "来源", value: "aipan.me" },
]);

const safetyTips = computed(() => {
  const shared = [
    "本站只聚合公开链接，不存储、控制或传播目标文件。",
    "如页面要求付费、下载未知执行文件或额外授权，请直接退出。",
  ];

  if (targetCategoryName.value === "下载协议") {
    return [
      "磁力、电驴等协议会直接唤起本地下载器，请确认软件来源可信且系统安全策略已开启。",
      "复制协议到下载器前，先核对标题、体积和发布来源是否与预期一致。",
      ...shared,
    ];
  }

  if (targetCategoryName.value === "网盘链接") {
    return [
      `继续前请再次确认域名是否为 ${targetHost.value}，避免进入仿冒网盘页面。`,
      "提取码、分享说明和文件名明显不一致时，不要继续下载或解压可疑文件。",
      ...shared,
    ];
  }

  return [
    "外部站点的可用性与安全性不由本站控制，请自行判断可信度。",
    "如果目标页面存在多次重定向、伪下载按钮或异常登录提示，请立即关闭。",
    ...shared,
  ];
});

useHead(() => ({
  title: `${targetServiceName.value}跳转中 - 爱盼迷 - aipan.me`,
  meta: [
    {
      name: "description",
      content: `即将离开 aipan.me 前往 ${targetServiceName.value}，请在跳转前核对目标链接与安全提示。`,
    },
    { name: "robots", content: "noindex,nofollow" },
  ],
}));

const isValidUrl = (url) => {
  if (!url || typeof url !== "string") {
    return false;
  }

  if (isDirectProtocolLink(url)) {
    return true;
  }

  try {
    const urlObj = new URL(url);

    if (!["http:", "https:", "magnet:", "ed2k:"].includes(urlObj.protocol)) {
      return false;
    }

    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(urlObj.hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

let timerInterval = null;

const startCountdown = () => {
  timerInterval = setInterval(() => {
    countdown.value -= 1;

    if (countdown.value <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      handleRedirect();
    }
  }, 1000);
};

const copyTargetUrl = async () => {
  if (!targetUrl.value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(targetUrl.value);
    ElMessage.success("目标链接已复制");
  } catch (err) {
    console.error("复制链接失败:", err);
    ElMessage.error("复制失败，请手动复制链接");
  }
};

const handleRedirect = () => {
  if (isRedirecting.value) {
    return;
  }

  isRedirecting.value = true;

  try {
    if (!targetUrl.value) {
      throw new Error("目标链接为空");
    }

    if (isDirectProtocolLink(targetUrl.value)) {
      window.location.href = targetUrl.value;
      return;
    }

    window.location.replace(targetUrl.value);
  } catch (err) {
    console.error("跳转失败:", err);
    ElMessage.error("跳转失败，请手动复制链接");
    isRedirecting.value = false;
  }
};

const goBack = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  router.replace("/");
};

onMounted(() => {
  try {
    const url = getSingleQueryValue(route.query.url);

    if (!url) {
      error.value = "缺少跳转链接参数";
      return;
    }

    if (!isValidUrl(url)) {
      error.value = "无效的跳转链接";
      return;
    }

    targetUrl.value = url;
    startCountdown();
  } catch (err) {
    console.error("初始化失败:", err);
    error.value = "页面初始化失败";
  }
});

onBeforeUnmount(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
});

if (import.meta.client) {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    } else if (!timerInterval && countdown.value > 0 && !error.value) {
      startCountdown();
    }
  };

  onMounted(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  });

  onBeforeUnmount(() => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  });
}
</script>

<style scoped>
@import "tailwindcss" reference;
</style>
