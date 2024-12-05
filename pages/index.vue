<script setup>
import { useDoubanStore } from "~/stores/douban";
import { badWords } from "~/utils/sensitiveWords";
import DoubanImageBox from "~/components/home/DoubanImageBox.vue";

definePageMeta({
  layout: "netdisk",
});
const doubanStore = useDoubanStore();
const searchKeyword = ref("");
const router = useRouter();
const doubanCache = useCookie("doubanCache", {
  maxAge: 60 * 60 * 24,
});

const search = (keyword) => {
  if (!keyword) return;
  if (badWords.includes(keyword)) {
    return alert("请勿输入敏感词");
  }
  router.push({
    path: "/search",
    query: { keyword: encodeURIComponent(keyword) },
  });
};

const doubanData = ref([]);

const goDouban = (movie) => {
  // window.open(movie.url, '_blank')
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
});
</script>

<template>
  <div
    class="custom-bg py-[60px] min-h-[calc(100vh-120px)] transition-colors duration-300"
  >
    <div
      class="flex flex-col items-center justify-center gap-4 mt-[60px] animate-fadeIn"
    >
      <div
        class="flex items-center justify-center gap-4 hover:scale-105 transition-transform duration-300"
      >
        <img class="w-24 h-24" src="@/assets/my-logo.png" alt="logo" />
        <div class="text-center">
          <h1
            class="text-4xl text-gray-800 font-bold dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            AIPAN.ME
          </h1>
          <p class="text-gray-600 text-sm dark:text-gray-300 mt-2">
            爱盼 - 资源随心，娱乐无限
          </p>
        </div>
      </div>
    </div>
    <div class="max-w-[1240px] mx-auto mt-[30px]">
      <div class="w-[85%] md:w-[700px] mx-auto">
        <div class="relative group">
          <input
            class="w-full pl-6 pr-[70px] py-4 rounded-full text-sm bg-white dark:bg-gray-700 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all duration-300 shadow-lg dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
            v-model="searchKeyword"
            placeholder="请输入关键词搜索"
            @keydown.enter="search(searchKeyword)"
          />
          <button
            type="button"
            class="search-btn absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-blue-500/50 dark:hover:shadow-blue-600/30"
            @click="search(searchKeyword)"
          >
            <el-icon
              :size="22"
              class="transition-transform duration-300 group-hover:rotate-12"
            >
              <Search></Search>
            </el-icon>
          </button>
        </div>
      </div>
    </div>
    <div class="flex items-center justify-center pt-8">
      <nuxt-link
        to="/music/player"
        class="group flex items-center gap-3 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg hover:shadow-blue-500/30 transform hover:scale-105 transition-all duration-300"
      >
        <i class="fa-solid fa-music text-xs"></i>
        <span class="text-xs">本地音乐播放器</span>
        <i
          class="fa-solid fa-chevron-right text-xs opacity-70 group-hover:translate-x-1 transition-transform duration-300"
        ></i>
      </nuxt-link>
    </div>
    <DoubanImageBox
      :doubanData="doubanData"
      @goDouban="goDouban"
    ></DoubanImageBox>
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
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.95) 100%
  );
  z-index: -1;
}

:root.dark .custom-bg {
  background-color: rgba(31, 41, 55, 0.97);
}

:root.dark .custom-bg::before {
  background: linear-gradient(
    180deg,
    rgba(31, 41, 55, 0) 0%,
    rgba(31, 41, 55, 0.98) 100%
  );
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

/* 当输入框获得焦点时，停止按钮动画 */
.el-input__wrapper.is-focus + .search-btn {
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
