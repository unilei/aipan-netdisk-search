<script setup>
import DoubanImageBox from "~/components/home/DoubanImageBox.vue";
import { MODERATION_CONTEXTS } from "~/composables/useModerationCheck";
import {
  hasUsableDoubanHomepageData,
  normalizeDoubanHomepageData,
} from "~/utils/doubanHomepage.mjs";
import { useDebounceFn } from "@vueuse/core";

definePageMeta({
  layout: "netdisk",
});
const searchKeyword = ref("");
const router = useRouter();
const { locale, locales, setLocale, t } = useI18n();
const { checkModeration } = useModerationCheck();
const DEFERRED_DOUBAN_FALLBACK_DELAY = 15000;
const DEFERRED_DOUBAN_INTERACTION_EVENTS = ["scroll", "wheel", "touchstart", "keydown"];
const DOUBAN_CLIENT_CACHE_TTL = 1000 * 60 * 30;
const DOUBAN_RETRY_DELAY = 1000 * 60 * 2;
const DEFAULT_HOME_NAVIGATION = [
  {
    id: "search",
    name: "搜索工具",
    items: [
      { title: "网盘搜索", path: "/search", icon: "fa-search" },
      { title: "磁力搜索", path: "/magnet", icon: "fa-magnet" },
      { title: "学术搜索", path: "/academic", icon: "fa-graduation-cap" },
    ],
  },
  {
    id: "entertainment",
    name: "娱乐工具",
    items: [
      { title: "音乐下载", path: "/music", icon: "fa-music" },
      { title: "TV直播", path: "/tv", icon: "fa-tv" },
      { title: "AList", path: "/alist", icon: "fa-server" },
      { title: "小说阅读", path: "/novel", icon: "fa-book" },
    ],
  },
  {
    id: "tools",
    name: "实用工具",
    items: [
      { title: "图片工具", path: "/image-tools", icon: "fa-image" },
      { title: "文档转换", path: "/converter", icon: "fa-file-alt" },
      { title: "二维码生成", path: "/qrcode", icon: "fa-qrcode" },
      { title: "短链生成", path: "/shorturl", icon: "fa-link" },
    ],
  },
  {
    id: "learning",
    name: "学习工具",
    items: [
      { title: "英语学习", path: "/english", icon: "fa-language" },
      { title: "编程学习", path: "/coding", icon: "fa-code" },
      { title: "在线课程", path: "/courses", icon: "fa-chalkboard-teacher" },
    ],
  },
  {
    id: "others",
    name: "其他",
    items: [
      { title: "博客", path: "/blog", icon: "fa-blog" },
      { title: "关于我们", path: "/about", icon: "fa-info-circle" },
      { title: "联系我们", path: "/contact", icon: "fa-envelope" },
    ],
  },
];
let deferredDoubanTimer = null;
let doubanRetryTimer = null;

// 清理函数，防止内存泄漏
onUnmounted(() => {
  if (stopLocaleWatcher) stopLocaleWatcher();
  if (stopRouteWatcher) stopRouteWatcher();
  cleanupDeferredDoubanSchedule();
  cleanupDoubanRetrySchedule();
  window.removeEventListener("scroll", updateBacktopVisibility);
});

// SEO配置
useHead({
  title: t('meta.title'),
  meta: [
    {
      name: "description",
      content: t('meta.description'),
    },
    {
      name: "keywords",
      content: t('meta.keywords'),
    },
    // Open Graph / Facebook
    { property: "og:type", content: "website" },
    { property: "og:title", content: t('meta.title') },
    {
      property: "og:description",
      content: t('meta.description'),
    },
    { property: "og:image", content: "https://www.aipan.me/default-og-image.png" },
    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: t('meta.title') },
    {
      name: "twitter:description",
      content: t('meta.description'),
    },
    { name: "twitter:image", content: "https://www.aipan.me/default-og-image.png" },
    // 其他重要的meta标签
    { name: "robots", content: "index,follow" },
    { name: "author", content: "AIPAN.ME" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
  ],
  link: [{ rel: "canonical", href: "https://www.aipan.me" }],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "爱盼",
        "alternateName": "AIPAN.ME",
        "url": "https://www.aipan.me",
        "description": "爱盼是一个开源免费的资源搜索平台，提供网盘资源搜索、音乐下载、TV直播、TVBox接口地址以及博客发布等多项功能",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://www.aipan.me/search?keyword={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        },
        "publisher": {
          "@type": "Organization",
          "name": "AIPAN.ME",
          "url": "https://www.aipan.me"
        },
        "sameAs": [
          "https://github.com/aipan-me"
        ]
      })
    }
  ]
});



// 使用activeCategoryCookie作为唯一存储方式
const activeCategoryCookie = useCookie("activeCategory", {
  maxAge: 60 * 60 * 24 * 7, // 保存7天
});

const debouncedSearch = useDebounceFn(async (keyword) => {
  if (!keyword || !keyword.trim()) return;
  const moderation = await checkModeration(keyword, MODERATION_CONTEXTS.netdiskSearch);
  if (!moderation.allowed) {
    return alert(moderation.message || t('sensitive_word_alert'));
  }
  router.push({
    path: "/search",
    query: { keyword },
  });
}, 300);

const search = (keyword) => {
  debouncedSearch(keyword);
};

const doubanState = useState("homepage-douban-state", () => ({
  data: [],
  loaded: false,
  loading: false,
  fetchedAt: 0,
  lastAttemptAt: 0,
}));
const doubanData = computed(() => normalizeDoubanHomepageData(doubanState.value.data));
const doubanLoading = computed(() => doubanState.value.loading);
const doubanLoaded = computed(() => doubanState.value.loaded);
const showBacktop = ref(false);

const patchDoubanState = (patch) => {
  doubanState.value = {
    ...doubanState.value,
    ...patch,
  };
};

const hasDoubanData = () => hasUsableDoubanHomepageData(doubanData.value);

const isDoubanCacheFresh = () => {
  return hasDoubanData()
    && doubanState.value.loaded
    && doubanState.value.fetchedAt > 0
    && Date.now() - doubanState.value.fetchedAt < DOUBAN_CLIENT_CACHE_TTL;
};

const canAttemptDoubanLoad = () => {
  return Date.now() - doubanState.value.lastAttemptAt >= DOUBAN_RETRY_DELAY;
};

const cleanupDeferredDoubanSchedule = () => {
  if (deferredDoubanTimer) {
    window.clearTimeout(deferredDoubanTimer);
    deferredDoubanTimer = null;
  }

  DEFERRED_DOUBAN_INTERACTION_EVENTS.forEach((eventName) => {
    window.removeEventListener(eventName, loadDeferredDoubanData);
  });
};

const cleanupDoubanRetrySchedule = () => {
  if (doubanRetryTimer) {
    window.clearTimeout(doubanRetryTimer);
    doubanRetryTimer = null;
  }
};

const scheduleDoubanRetry = () => {
  if (doubanRetryTimer || hasDoubanData()) {
    return;
  }

  const elapsed = Date.now() - doubanState.value.lastAttemptAt;
  const retryDelay = Math.max(0, DOUBAN_RETRY_DELAY - elapsed);
  doubanRetryTimer = window.setTimeout(() => {
    doubanRetryTimer = null;
    void loadDeferredDoubanData({ force: true });
  }, retryDelay);
};

const loadDeferredDoubanData = async ({ force = false, silent = false } = {}) => {
  cleanupDeferredDoubanSchedule();

  if (doubanLoading.value) {
    return;
  }

  if (!force && isDoubanCacheFresh()) {
    return;
  }

  if (!force && doubanLoaded.value && !canAttemptDoubanLoad()) {
    scheduleDoubanRetry();
    return;
  }

  patchDoubanState({
    loading: true,
    lastAttemptAt: Date.now(),
    loaded: silent || hasDoubanData() ? doubanState.value.loaded : false,
  });

  try {
    const res = await $fetch('/api/douban/new');
    const normalizedData = normalizeDoubanHomepageData(res?.data);
    if (res?.code === 200 && hasUsableDoubanHomepageData(normalizedData)) {
      cleanupDoubanRetrySchedule();
      patchDoubanState({
        data: normalizedData,
        loaded: true,
        fetchedAt: Date.now(),
      });
    } else if (!hasDoubanData()) {
      patchDoubanState({
        data: [],
        loaded: true,
      });
      scheduleDoubanRetry();
    }
  } catch (error) {
    console.error('Failed to load douban data:', error);
    if (!hasDoubanData()) {
      patchDoubanState({
        data: [],
        loaded: true,
      });
      scheduleDoubanRetry();
    }
  } finally {
    patchDoubanState({
      loading: false,
    });
  }
};

const scheduleDeferredDoubanLoad = () => {
  if (isDoubanCacheFresh()) {
    return;
  }

  if (hasDoubanData()) {
    if (canAttemptDoubanLoad()) {
      void loadDeferredDoubanData({ force: true, silent: true });
    }
    return;
  }

  if (doubanLoaded.value && !canAttemptDoubanLoad()) {
    scheduleDoubanRetry();
    return;
  }

  DEFERRED_DOUBAN_INTERACTION_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, loadDeferredDoubanData, { once: true, passive: true });
  });
  deferredDoubanTimer = window.setTimeout(loadDeferredDoubanData, DEFERRED_DOUBAN_FALLBACK_DELAY);
};

// 添加防抖处理，避免重复点击
const goDouban = useDebounceFn((movie) => {
  if (!movie || !movie.title) {
    console.warn('Invalid movie data:', movie);
    return;
  }
  router.push({
    path: "/search",
    query: { keyword: movie.title },
  });
}, 300);

const updateBacktopVisibility = () => {
  showBacktop.value = window.scrollY > 360;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// 导航数据
const categories = ref(DEFAULT_HOME_NAVIGATION);
const activeCategory = ref(activeCategoryCookie.value || DEFAULT_HOME_NAVIGATION[0]?.id || "");

const ensureActiveCategory = () => {
  if (categories.value && categories.value.length > 0) {
    const categoryExists = categories.value.some(c => c.id === activeCategory.value);
    if (!categoryExists) {
      activeCategory.value = activeCategoryCookie.value || categories.value[0]?.id || '';
    }
  } else {
    activeCategory.value = '';
  }
};

// 加载导航数据
const loadNavigationData = async () => {
  try {
    const { data } = await $fetch('/api/navigation');
    if (Array.isArray(data) && data.length > 0) {
      categories.value = data;
      ensureActiveCategory();
    }
  } catch (error) {
    console.error('Failed to load navigation data:', error);
  }
};

// 确保在页面挂载前先使用本地导航，接口返回后再同步后台配置
onBeforeMount(() => {
  ensureActiveCategory();
  void loadNavigationData();
});

// 监听activeCategory变化，只保存到cookie
watch(activeCategory, (newValue) => {
  activeCategoryCookie.value = newValue;
});

// 监听语言变化，重新加载导航数据
const stopLocaleWatcher = watch(locale, async () => {
  await loadNavigationData();
  ensureActiveCategory();
});

onMounted(() => {
  // 在页面加载完成后，将滚动位置重置到顶部
  window.scrollTo(0, 0);

  window.addEventListener("scroll", updateBacktopVisibility, { passive: true });
  scheduleDeferredDoubanLoad();
});

// 监听路由变化（使用节流优化性能）
const throttledScrollToTop = useDebounceFn(() => {
  window.scrollTo(0, 0);
}, 100);

const stopRouteWatcher = watch(
  () => router.currentRoute.value,
  () => {
    // 当路由发生变化时，将滚动位置重置到顶部
    throttledScrollToTop();
  }
);
</script>

<template>
  <div>
    <div class="custom-bg py-[60px] min-h-[calc(100vh-130px)] transition-colors duration-300">
      <div class="flex flex-col items-center justify-center gap-4 md:mt-[80px] mt-[30px]">
        <div class="flex items-center justify-center gap-2">
          <picture class="block w-16 h-16 md:w-22 md:h-22">
            <source srcset="/logo.webp" type="image/webp" />
            <img
              class="w-full h-full dark:opacity-90"
              src="/logo.png"
              width="96"
              height="96"
              alt="logo"
              loading="eager"
              fetchpriority="high"
              decoding="sync" />
          </picture>
          <div>
            <h1
              class="text-2xl font-bold dark:text-white bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              AIPAN.ME
            </h1>
            <p class="text-gray-600 text-left text-xs dark:text-gray-400">
              {{ $t('subtitle') }}
            </p>
          </div>
        </div>
      </div>
      <div class="max-w-[1240px] mx-auto mt-[20px] md:mt-[30px] px-4 md:px-0">
        <div class="w-full md:w-[700px] mx-auto">
          <div class="relative group">
            <input
              class="w-full pl-6 pr-[70px] py-4 rounded-full text-sm bg-white dark:bg-gray-800/80 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all duration-300 shadow-lg dark:shadow-gray-900/30 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              v-model="searchKeyword" :placeholder="$t('search_placeholder')" @keydown.enter="search(searchKeyword)" />
            <button type="button"
              class="search-btn absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-400 dark:to-blue-500 dark:hover:from-blue-500 dark:hover:to-blue-600 text-white transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-blue-500/50 dark:hover:shadow-blue-400/30"
              :aria-label="$t('search_placeholder')"
              :title="$t('search_placeholder')"
              @click="search(searchKeyword)">
              <svg
                aria-hidden="true"
                class="w-5 h-5 transition-transform duration-300 group-hover:rotate-12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

        <div class="max-w-[1240px] mx-auto mt-4 px-4 min-h-[176px] md:min-h-[112px]">
          <template v-if="categories.length > 0">
          <!-- 导航分类标签 -->
          <div class="flex items-center justify-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            <button v-for="category in categories" :key="category.id"
              class="px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap" :class="[
                activeCategory === category.id
                  ? 'bg-linear-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
              ]" @click="activeCategory = category.id">
              {{ category.name }}
            </button>
          </div>

          <!-- 导航网格 -->
          <div class="flex items-center justify-center flex-wrap gap-2">
            <template v-for="category in categories" :key="category.id">
              <template v-if="activeCategory === category.id">
                <nuxt-link v-for="item in category.items" :key="item.path" :to="item.path"
                  class="group flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-gray-800/50 hover:bg-linear-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 border border-gray-100 dark:border-gray-700/50 transform hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-gray-900/10">
                  <div class="flex items-center justify-center shadow-lg">
                    <i :class="['fa-solid', item.icon, 'dark:text-white text-xs']"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3
                      class="text-gray-800 dark:text-gray-200 text-xs font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                      {{ item.title }}
                    </h3>
                     
                  </div>
                </nuxt-link>
              </template>
            </template>
          </div>
          </template>
        </div>
      <DoubanImageBox
        v-if="doubanData.length > 0"
        :doubanData="doubanData"
        @goDouban="goDouban"></DoubanImageBox>
      <button
        v-show="showBacktop"
        type="button"
        class="fixed right-6 bottom-6 z-40 w-12 h-12 rounded-xl bg-linear-to-r from-purple-500 to-blue-500 text-white shadow-lg transition-all duration-300 hover:from-purple-600 hover:to-blue-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-300 dark:from-purple-400 dark:to-blue-400 dark:hover:from-purple-500 dark:hover:to-blue-500 dark:shadow-gray-900/30"
        aria-label="返回顶部"
        title="返回顶部"
        @click="scrollToTop">
        <svg
          aria-hidden="true"
          class="mx-auto h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round">
          <path d="m18 15-6-6-6 6"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.animate-fadeIn {
  animation: fadeIn 0.8s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}



:deep(.el-input__wrapper.is-focus) {
  --el-input-focus-border-color: #3b82f6;
}

.custom-bg {
  position: relative;
  background-image: url("@/assets/hero-bg-1.png");
  background-size: 100% auto;
  background-position: top;
  background-repeat: no-repeat;
  background-color: rgba(245, 246, 249, 0.95);
}

.custom-bg::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.95) 100%);
  z-index: -1;
}

:root.dark .custom-bg {
  background-image: none;
  background-color: rgba(17, 24, 39, 0.95);
}

:root.dark .custom-bg::before {
  background: linear-gradient(180deg,
      rgba(17, 24, 39, 0) 0%,
      rgba(17, 24, 39, 0.98) 100%);
}

.search-btn {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

:root.dark .search-btn {
  animation: darkPulse 2s infinite;
}

@keyframes darkPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.4);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(96, 165, 250, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(96, 165, 250, 0);
  }
}

/* 当输入框获得焦点时，停止按钮动画 */
.el-input__wrapper.is-focus~.search-btn,
input:focus+.search-btn {
  animation: none;
}

/* 图片渐进加载动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
