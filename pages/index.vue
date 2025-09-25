<script setup>
import { useDoubanStore } from "~/stores/douban";
import { badWords } from "~/utils/sensitiveWords";
import DoubanImageBox from "~/components/home/DoubanImageBox.vue";
import { useDebounceFn } from "@vueuse/core";

definePageMeta({
  layout: "netdisk",
});
const doubanStore = useDoubanStore();
const searchKeyword = ref("");
const router = useRouter();
const { locale, locales, setLocale, t } = useI18n();

// 清理函数，防止内存泄漏
onUnmounted(() => {
  if (stopRouteWatcher) stopRouteWatcher();
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
    { property: "og:image", content: "https://www.ailookzy.com/default-og-image.png" },
    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: t('meta.title') },
    {
      name: "twitter:description",
      content: t('meta.description'),
    },
    { name: "twitter:image", content: "https://www.ailookzy.com/default-og-image.png" },
    // 其他重要的meta标签
    { name: "robots", content: "index,follow" },
    { name: "author", content: "ailookzy.com" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
  ],
  link: [{ rel: "canonical", href: "https://www.ailookzy.com" }],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "爱看网盘资源搜索",
        "alternateName": "ailookzy.com",
        "url": "https://www.ailookzy.com",
        "description": "爱看是专业的网盘资源搜索引擎，提供网盘资源搜索、网站导航、在线工具等多项功能",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://www.ailookzy.com/search?keyword={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        },
        "publisher": {
          "@type": "Organization",
          "name": "ailookzy.com",
          "url": "https://www.ailookzy.com"
        },
        "sameAs": [
          "https://github.com/aipan-me"
        ]
      })
    }
  ]
});

const debouncedSearch = useDebounceFn((keyword) => {
  if (!keyword || !keyword.trim()) return;
  if (badWords.includes(keyword)) {
    return alert(t('sensitive_word_alert'));
  }
  router.push({
    path: "/search",
    query: { keyword: encodeURIComponent(keyword) },
  });
}, 300);

const search = (keyword) => {
  debouncedSearch(keyword);
};

const doubanData = ref([]);

// 添加防抖处理，避免重复点击
const goDouban = useDebounceFn((movie) => {
  if (!movie || !movie.title) {
    console.warn('Invalid movie data:', movie);
    return;
  }
  router.push({
    path: "/search",
    query: { keyword: encodeURIComponent(movie.title) },
  });
}, 300);

 
onMounted(async () => {
  try {
    // 加载豆瓣数据
    await doubanStore.getDoubanData();
    doubanData.value = doubanStore.doubanData;
  } catch (error) {
    console.error('Failed to load douban data:', error);
    // 设置默认空数据，避免页面崩溃
    doubanData.value = [];
  }

  // 在页面加载完成后，将滚动位置重置到顶部
  window.scrollTo(0, 0);
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
          <img class="w-16 h-16 md:w-22 md:h-22 dark:opacity-90" src="@/assets/my-logo.png" alt="logo" />
          <div>
            <h1
              class="text-2xl text-gray-800 font-bold dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              ailookzy.com
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
              class="search-btn absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-400 dark:to-blue-500 dark:hover:from-blue-500 dark:hover:to-blue-600 text-white transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-blue-500/50 dark:hover:shadow-blue-400/30"
              @click="search(searchKeyword)">
              <el-icon :size="22" class="transition-transform duration-300 group-hover:rotate-12">
                <Search></Search>
              </el-icon>
            </button>
          </div>
        </div>
      </div>

       
      <DoubanImageBox :doubanData="doubanData" @goDouban="goDouban"></DoubanImageBox>
      <!-- Enhanced Backtop -->
      <el-backtop :right="24" :bottom="24"
        class="!bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 dark:from-purple-400 dark:to-blue-400 dark:hover:from-purple-500 dark:hover:to-blue-500 !w-12 !h-12 transition-all duration-300 !rounded-xl group hover:scale-110 !shadow-lg hover:!shadow-xl dark:!shadow-gray-900/30 backdrop-blur-sm flex items-center justify-center">
        <i class="fas fa-arrow-up text-white group-hover:animate-bounce"></i>
      </el-backtop>
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
