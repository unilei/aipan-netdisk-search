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

// SEO配置
useHead({
  title: 'AIPAN.ME - 网盘资源搜索引擎',
  meta: [
    { name: 'description', content: '爱盼网盘搜索是一个强大的网盘资源搜索引擎，提供海量影视、音乐、电子书等资源的搜索服务。快速、精准、便捷地找到您需要的资源。' },
    { name: 'keywords', content: '网盘搜索,资源搜索,影视资源,音乐资源,电子书,在线搜索' },
    // Open Graph / Facebook
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'AIPAN.ME - 网盘资源搜索引擎' },
    { property: 'og:description', content: '爱盼网盘搜索是一个强大的网盘资源搜索引擎，提供海量影视、音乐、电子书等资源的搜索服务。' },
    { property: 'og:image', content: '/og-image.jpg' },
    // Twitter
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'AIPAN.ME - 网盘资源搜索引擎' },
    { name: 'twitter:description', content: '爱盼网盘搜索是一个强大的网盘资源搜索引擎，提供海量影视、音乐、电子书等资源的搜索服务。' },
    { name: 'twitter:image', content: '/og-image.jpg' },
    // 其他重要的meta标签
    { name: 'robots', content: 'index,follow' },
    { name: 'author', content: 'AIPAN.ME' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ],
  link: [
    { rel: 'canonical', href: 'https://aipan.me' }
  ]
})

const doubanCache = useCookie("doubanCache", {
  maxAge: 60 * 60 * 24,
});

const debouncedSearch = useDebounceFn((keyword) => {
  if (!keyword) return;
  if (badWords.includes(keyword)) {
    return alert("请勿输入敏感词");
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

const goDouban = (movie) => {
  router.push({
    path: "/search",
    query: { keyword: encodeURIComponent(movie.title) },
  });
};

onMounted(async () => {
  if (doubanCache.value === "aipan.me") {
    doubanData.value = doubanStore.doubanData;
  } else {
    await doubanStore.getDoubanData();
    doubanData.value = doubanStore.doubanData;
    doubanCache.value = "aipan.me";
  }

  // 在页面加载完成后，将滚动位置重置到顶部
  window.scrollTo(0, 0);
});

// 监听路由变化
watch(
  () => router.currentRoute.value,
  () => {
    // 当路由发生变化时，将滚动位置重置到顶部
    window.scrollTo(0, 0);
  }
);
</script>

<template>
  <div class="custom-bg py-[60px] min-h-[calc(100vh-70px)] transition-colors duration-300">
    <div class="flex flex-col items-center justify-center gap-4 mt-[60px] md:mt-[60px] mt-[30px] animate-fadeIn">
      <div class="flex items-center justify-center gap-2 md:gap-4 hover:scale-105 transition-transform duration-300">
        <img class="w-16 h-16 md:w-24 md:h-24 dark:opacity-90" src="@/assets/my-logo.png" alt="logo" />
        <div class="text-center">
          <h1
            class="text-3xl md:text-4xl text-gray-800 font-bold dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            AIPAN.ME
          </h1>
          <p class="text-gray-600 text-xs md:text-sm dark:text-gray-400 mt-1 md:mt-2">
            爱盼 - 资源随心，娱乐无限
          </p>
        </div>
      </div>
    </div>
    <div class="max-w-[1240px] mx-auto mt-[20px] md:mt-[30px] px-4 md:px-0">
      <div class="w-full md:w-[700px] mx-auto">
        <div class="relative group">
          <input
            class="w-full pl-6 pr-[70px] py-4 rounded-full text-sm bg-white dark:bg-gray-800/80 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all duration-300 shadow-lg dark:shadow-gray-900/30 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            v-model="searchKeyword" placeholder="请输入关键词搜索" @keydown.enter="search(searchKeyword)" />
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
    <div class="flex flex-wrap items-center justify-center gap-2 md:gap-4 pt-4 md:pt-8 px-4">
      <nuxt-link to="/spring-festival"
        class="group flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 dark:from-blue-400 dark:to-purple-400 dark:hover:from-blue-500 dark:hover:to-purple-500 text-white font-medium shadow-lg hover:shadow-blue-500/30 dark:hover:shadow-blue-400/20 transform hover:scale-105 transition-all duration-300">
        <i class="fa-solid fa-calendar-days text-[10px] md:text-xs"></i>
        <span class="text-[10px] md:text-xs whitespace-nowrap">新年倒计时</span>
        <i
          class="fa-solid fa-chevron-right text-[10px] md:text-xs opacity-70 group-hover:translate-x-1 transition-transform duration-300"></i>
      </nuxt-link>
      <nuxt-link to="/movie/daily"
        class="group flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 dark:from-blue-400 dark:to-purple-400 dark:hover:from-blue-500 dark:hover:to-purple-500 text-white font-medium shadow-lg hover:shadow-blue-500/30 dark:hover:shadow-blue-400/20 transform hover:scale-105 transition-all duration-300">
        <i class="fa-solid fa-film text-[10px] md:text-xs"></i>
        <span class="text-[10px] md:text-xs whitespace-nowrap">每日电影推荐</span>
        <i
          class="fa-solid fa-chevron-right text-[10px] md:text-xs opacity-70 group-hover:translate-x-1 transition-transform duration-300"></i>
      </nuxt-link>
      <nuxt-link to="/music/player"
        class="group flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 dark:from-blue-400 dark:to-purple-400 dark:hover:from-blue-500 dark:hover:to-purple-500 text-white font-medium shadow-lg hover:shadow-blue-500/30 dark:hover:shadow-blue-400/20 transform hover:scale-105 transition-all duration-300">
        <i class="fa-solid fa-music text-[10px] md:text-xs"></i>
        <span class="text-[10px] md:text-xs whitespace-nowrap">本地音乐播放器</span>
        <i
          class="fa-solid fa-chevron-right text-[10px] md:text-xs opacity-70 group-hover:translate-x-1 transition-transform duration-300"></i>
      </nuxt-link>
    </div>
    <DoubanImageBox :doubanData="doubanData" @goDouban="goDouban"></DoubanImageBox>
    <!-- Enhanced Backtop -->
    <el-backtop :right="24" :bottom="24"
      class="!bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 dark:from-purple-400 dark:to-blue-400 dark:hover:from-purple-500 dark:hover:to-blue-500 !w-12 !h-12 transition-all duration-300 !rounded-xl group hover:scale-110 !shadow-lg hover:!shadow-xl dark:!shadow-gray-900/30 backdrop-blur-sm flex items-center justify-center">
      <i class="fas fa-arrow-up text-white group-hover:animate-bounce"></i>
    </el-backtop>
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
.el-input__wrapper.is-focus+.search-btn {
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
