<template>
  <div
    class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300"
  >
    <search-header
      :keyword="keyword"
      @search="search"
      class="mb-2"
    ></search-header>

    <!-- Category Tabs -->
    <div
      class="w-full backdrop-blur-md bg-white/40 dark:bg-gray-800/40 sticky top-0 z-10 shadow-sm transition-all duration-300"
    >
      <div class="max-w-[1240px] mx-auto px-4 py-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Category Selection -->
          <div class="flex gap-3 transition-all duration-300">
            <el-button
              v-for="(item, index) in categories"
              :key="index"
              :class="[
                'relative transition-all duration-300 rounded-lg transform group',
                category === item.value
                  ? 'shadow-lg !text-white scale-105'
                  : 'hover:scale-105 hover:bg-white/50 dark:hover:bg-gray-600/50',
                category === item.value
                  ? '!bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                  : '',
              ]"
              :title="item.description"
              type="primary"
              :plain="category !== item.value"
              @click="switchCategory(item.value)"
            >
              <i :class="item.icon" class="mr-2"></i>
              {{ item.label }}
              <span
                v-if="category === item.value"
                class="absolute -top-1 -right-1 flex"
              >
                <span
                  class="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-purple-400 opacity-75"
                ></span>
                <span
                  class="relative inline-flex rounded-full h-2 w-2 bg-purple-500"
                ></span>
              </span>
            </el-button>
          </div>

          <!-- Stats Display with Enhanced Visual -->
          <div
            v-if="category === 'clouddrive' && loadingProgress.isLoading"
            class="flex-1 flex items-center gap-4 bg-white/50 dark:bg-gray-700/50 rounded-lg p-3 transition-all duration-300 backdrop-blur-sm"
          >
            <div class="flex-1 relative">
              <el-progress
                :percentage="
                  Math.round(
                    (loadingProgress.completed / loadingProgress.total) * 100
                  )
                "
                :stroke-width="4"
                :show-text="false"
                class="flex-1"
              >
              </el-progress>
              <div
                class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
              ></div>
            </div>
            <span
              class="text-sm text-purple-600 dark:text-purple-400 font-medium whitespace-nowrap flex items-center gap-2"
            >
              <i class="fas fa-spinner fa-spin"></i>
              搜索中... {{ loadingProgress.completed }}/{{
                loadingProgress.total
              }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="mx-auto overflow-y-auto px-4 scroll-smooth">
      <div class="max-w-[1240px] mx-auto">
        <!-- Cloud Drive Content -->
        <transition name="fade" mode="out-in">
          <div class="p-4" v-if="category === 'clouddrive'">
            <div class="transition-all duration-300 space-y-2">
              <disk-info-list
                :sources="sources"
                :skeleton-loading="skeletonLoading"
              >
              </disk-info-list>
            </div>
          </div>
        </transition>

        <!-- VOD Content -->
        <transition name="fade" mode="out-in">
          <div v-if="category === 'onlineVod'" class="p-2">
            <div class="space-y-4">
              <!-- Loading Skeletons -->
              <template
                v-if="
                  vodData.length === 0 &&
                  Array.from(loadingStatus.values()).some((status) => status)
                "
              >
                <!-- Header Skeleton -->
                <div
                  class="flex flex-col sm:flex-row justify-between items-center gap-2 mb-4 px-2 animate-pulse"
                >
                  <div
                    class="h-6 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg w-48"
                  ></div>
                  <div
                    class="h-8 bg-red-100/50 dark:bg-red-900/30 rounded-full w-64"
                  ></div>
                </div>

                <!-- Video Player Skeleton -->
                <div
                  class="relative rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 backdrop-blur-sm"
                >
                  <div
                    class="aspect-video w-full bg-gray-200/50 dark:bg-gray-700/50 animate-pulse"
                  >
                    <div
                      class="absolute inset-0 flex items-center justify-center"
                    >
                      <i
                        class="fas fa-film text-4xl text-gray-400 dark:text-gray-600"
                      ></i>
                    </div>
                  </div>
                </div>

                <!-- Episodes List Skeleton -->
                <div
                  class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-2"
                >
                  <div
                    v-for="i in 12"
                    :key="i"
                    class="h-10 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg animate-pulse"
                  ></div>
                </div>
              </template>

              <!-- VOD List -->
              <template v-else>
                <vod-list
                  :vod-data="vodData"
                  class="transition-opacity duration-300"
                  :class="{
                    'opacity-0': Array.from(loadingStatus.values()).some(
                      (status) => status
                    ),
                  }"
                ></vod-list>
              </template>
            </div>
          </div>
        </transition>

        <!-- Soupian iframe -->
        <transition name="fade" mode="out-in">
          <div v-if="category === 'soupian'" class="h-full w-full py-4">
            <div
              class="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg shadow-sm hover:shadow-lg hover:bg-white/70 dark:hover:bg-gray-800/70 p-5 ring-1 ring-black/5 dark:ring-white/5 transition-all duration-300"
            >
              <div class="relative w-full h-[calc(100vh-240px)]">
                <div
                  v-if="!iframeLoaded"
                  class="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-800/90 rounded-lg backdrop-blur-sm"
                >
                  <div class="flex flex-col items-center gap-3">
                    <div class="relative w-12 h-12">
                      <div
                        class="absolute inset-0 border-4 border-purple-500/30 rounded-full"
                      ></div>
                      <div
                        class="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"
                      ></div>
                    </div>
                    <span
                      class="text-sm text-purple-600 dark:text-purple-400 font-medium"
                      >加载中...</span
                    >
                  </div>
                </div>
                <iframe
                  id="soupian"
                  :src="'https://soupian.pro/frame?movie=' + keyword"
                  class="w-full h-full rounded-lg border-0 bg-white/90 dark:bg-gray-900/90 transition-colors duration-300"
                  loading="lazy"
                  @load="iframeLoaded = true"
                ></iframe>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Empty State with Enhanced Visual -->
      <div
        v-if="
          !skeletonLoading &&
          !Array.from(loadingStatus.values()).some((status) => status) &&
          ((category === 'clouddrive' && sources.length === 0) ||
            (category === 'onlineVod' && vodData.length === 0))
        "
        class="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400"
      >
        <div
          class="p-8 rounded-full bg-gradient-to-br from-purple-100/50 to-blue-100/50 dark:from-purple-900/20 dark:to-blue-900/20 mb-6 shadow-lg backdrop-blur-sm group hover:scale-105 transition-all duration-300"
        >
          <i
            class="fas fa-search text-5xl text-purple-500/70 dark:text-purple-400/70 group-hover:rotate-12 transition-transform duration-300"
          ></i>
        </div>
        <h3
          class="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
        >
          未找到相关结果
        </h3>
        <p class="text-sm mt-3 opacity-75">试试以下建议：</p>
        <ul class="mt-4 text-sm space-y-2 text-center">
          <li>• 检查输入是否正确</li>
          <li>• 尝试使用不同的关键词</li>
          <li>• 切换其他分类查找</li>
        </ul>
      </div>

      <!-- Enhanced Backtop -->
      <el-backtop
        :right="24"
        :bottom="24"
        class="!bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 !w-12 !h-12 transition-all duration-300 !rounded-xl group hover:scale-110 !shadow-lg hover:!shadow-xl backdrop-blur-sm flex items-center justify-center"
      >
        <i class="fas fa-arrow-up text-white group-hover:animate-bounce"></i>
      </el-backtop>
    </div>
  </div>
</template>

<script setup>
import SearchHeader from "~/components/search/SearchHeader.vue";
import DiskInfoList from "~/components/diskInfoList.vue";
import sourcesApiEndpoints from "~/assets/vod/clouddrive.json";
import { badWords } from "~/utils/sensitiveWords";

definePageMeta({
  layout: "custom",
});

const route = useRoute();
const keyword = ref(decodeURIComponent(route.query.keyword));
const sources = ref([]);
const skeletonLoading = ref(false);
const loadingProgress = ref({
  total: 0,
  completed: 0,
  isLoading: false,
});
const loadingStatus = ref(new Map());

// 智能缓存类
class SmartCache {
  constructor(maxSize = 100, storageKey = "smart_cache_data") {
    this.maxSize = maxSize;
    this.storageKey = storageKey;
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      total: 0,
    };

    // 初始化时不立即加载数据，而是等待客户端初始化
    if (process.client) {
      this.init();
    }
  }

  // 客户端初始化
  init() {
    // 从localStorage加载缓存数据
    this.loadFromStorage();

    // 定期保存缓存到localStorage
    this.setupAutoSave();

    // 定期清理过期数据
    this.setupCleanupInterval();
  }

  // 从localStorage加载数据
  loadFromStorage() {
    if (!process.client) return;

    try {
      const savedData = localStorage.getItem(this.storageKey);
      if (savedData) {
        const { cache, stats } = JSON.parse(savedData);

        // 恢复缓存数据
        Object.entries(cache).forEach(([key, item]) => {
          // 检查数据是否过期
          if (Date.now() <= item.expiry) {
            this.cache.set(key, item);
          }
        });

        // 恢复统计数据
        this.stats = stats;

        if (process.env.NODE_ENV === "development") {
          console.log("Cache loaded from localStorage:", this.getStats());
        }
      }
    } catch (err) {
      console.error("Error loading cache from localStorage:", err);
      this.clearStorage();
    }
  }

  // 保存数据到localStorage
  saveToStorage() {
    if (!process.client) return;

    try {
      // 将Map转换为普通对象以便序列化
      const cacheObj = {};
      this.cache.forEach((value, key) => {
        cacheObj[key] = value;
      });

      const data = {
        cache: cacheObj,
        stats: this.stats,
        timestamp: Date.now(),
      };

      localStorage.setItem(this.storageKey, JSON.stringify(data));

      if (process.env.NODE_ENV === "development") {
        console.log("Cache saved to localStorage");
      }
    } catch (err) {
      console.error("Error saving cache to localStorage:", err);
      // 如果存储失败（比如超出配额），清理一部分数据后重试
      this.cleanup(true);
      try {
        this.saveToStorage();
      } catch (retryErr) {
        console.error("Failed to save cache even after cleanup:", retryErr);
      }
    }
  }

  // 设置自动保存
  setupAutoSave() {
    if (!process.client) return;

    // 每30秒保存一次
    const saveInterval = setInterval(() => this.saveToStorage(), 30000);

    // 页面关闭时保存
    window.addEventListener("beforeunload", () => {
      this.saveToStorage();
      clearInterval(saveInterval);
    });
  }

  // 设置定期清理
  setupCleanupInterval() {
    if (!process.client) return;

    // 每5分钟清理一次过期数据
    const cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);

    // 页面关闭时清理定时器
    window.addEventListener("beforeunload", () => {
      clearInterval(cleanupInterval);
    });
  }

  // 清理localStorage中的缓存数据
  clearStorage() {
    if (!process.client) return;

    try {
      localStorage.removeItem(this.storageKey);
      if (process.env.NODE_ENV === "development") {
        console.log("Cache storage cleared");
      }
    } catch (err) {
      console.error("Error clearing cache storage:", err);
    }
  }

  // 获取缓存命中率
  getHitRate() {
    return this.stats.total === 0
      ? 0
      : ((this.stats.hits / this.stats.total) * 100).toFixed(2);
  }

  // 动态计算缓存时间
  getDynamicTTL(key, value) {
    const baseTime = 5 * 60 * 1000; // 基础5分钟
    const hitRate = this.getHitRate();

    // 根据数据大小调整缓存时间
    const sizeMultiplier = Array.isArray(value)
      ? Math.min(1, 10 / value.length)
      : 1;

    // 根据命中率调整缓存时间
    const hitRateMultiplier = hitRate > 80 ? 1.5 : 1;

    // 根据访问频率调整
    const accessCount = this.getAccessCount(key);
    const frequencyMultiplier = Math.min(2, 1 + accessCount * 0.1);

    return Math.floor(
      baseTime * sizeMultiplier * hitRateMultiplier * frequencyMultiplier
    );
  }

  // 获取键的访问次数
  getAccessCount(key) {
    const item = this.cache.get(key);
    return item ? item.accessCount || 0 : 0;
  }

  // 检查是否需要清理缓存
  cleanup(force = false) {
    // 计算存储使用情况
    const storageUsed = localStorage.length;
    const storageLimit = 5 * 1024 * 1024; // 5MB限制

    // 如果强制清理或缓存大小超出限制
    if (force || this.cache.size > this.maxSize || storageUsed > storageLimit) {
      const entries = Array.from(this.cache.entries()).sort((a, b) => {
        const scoreA = a[1].lastAccessed * (a[1].accessCount || 1);
        const scoreB = b[1].lastAccessed * (b[1].accessCount || 1);
        return scoreA - scoreB;
      });

      // 删除最不常用的数据
      const deleteCount = Math.max(
        Math.floor(this.maxSize * 0.25),
        Math.floor(entries.length * 0.25)
      );

      entries.slice(0, deleteCount).forEach(([key]) => {
        this.cache.delete(key);
      });

      // 保存更新后的缓存
      this.saveToStorage();

      if (process.env.NODE_ENV === "development") {
        console.log(`Cleaned up ${deleteCount} cache entries`);
      }
    }
  }

  // 获取缓存数据
  get(key) {
    this.stats.total++;
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    item.lastAccessed = Date.now();
    item.accessCount = (item.accessCount || 0) + 1;
    return item.value;
  }

  // 设置缓存数据
  set(key, value) {
    const ttl = this.getDynamicTTL(key, value);

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
      lastAccessed: Date.now(),
      accessCount: 1,
      size: JSON.stringify(value).length, // 记录数据大小
    });

    this.cleanup();

    // 异步保存到localStorage
    setTimeout(() => this.saveToStorage(), 0);
  }

  // 获取缓存统计信息
  getStats() {
    const totalSize = Array.from(this.cache.values()).reduce(
      (sum, item) => sum + (item.size || 0),
      0
    );

    return {
      ...this.stats,
      hitRate: this.getHitRate(),
      size: this.cache.size,
      maxSize: this.maxSize,
      totalSize: `${(totalSize / 1024).toFixed(2)}KB`,
      storageUsed: `${(localStorage.length / 1024).toFixed(2)}KB`,
    };
  }
}

// 创建智能缓存实例
const smartCache = new SmartCache(100, "aipan_search_cache");

// 在组件挂载后初始化缓存系统
onMounted(() => {
  if (process.client) {
    smartCache.init();
  }
});

// 添加请求超时控制函数
const fetchWithTimeout = async (url, options, timeout = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await $fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

// 添加并发控制
const concurrentLimit = 3;
const queue = [];
let running = 0;

const runQueue = async () => {
  if (queue.length === 0 || running >= concurrentLimit) return;

  running++;
  const task = queue.shift();
  try {
    await task();
  } finally {
    running--;
    runQueue();
  }
};

// 优化重试机制
const fetchWithRetry = async (url, options, retries = 1) => {
  for (let i = 0; i < retries + 1; i++) {
    try {
      return await fetchWithTimeout(url, options);
    } catch (error) {
      if (i === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
};

// 处理单个API的搜索
const handleSingleSearch = async (item) => {
  const cacheKey = `${item.api}-${keyword.value}`;

  const task = async () => {
    try {
      const cachedData = smartCache.get(cacheKey);
      if (cachedData) {
        sources.value.push(...cachedData);
        loadingProgress.value.completed++;
        return;
      }

      const res = await fetchWithRetry(item.api, {
        method: "POST",
        body: {
          name: keyword.value,
        },
      });

      if (res.list && res.list.length) {
        smartCache.set(cacheKey, res.list);
        sources.value.push(...res.list);
      }
    } catch (err) {
      console.error(`Error fetching from ${item.api}:`, err);
    } finally {
      loadingProgress.value.completed++;
      if (loadingProgress.value.completed >= loadingProgress.value.total) {
        loadingProgress.value.isLoading = false;
      }
    }
  };

  queue.push(task);
  runQueue();
};

const handleSearch = async () => {
  sources.value = [];
  queue.length = 0;
  running = 0;

  // 重置加载进度
  loadingProgress.value = {
    total: sourcesApiEndpoints.length,
    completed: 0,
    isLoading: true,
  };

  sourcesApiEndpoints.forEach((item) => {
    handleSingleSearch(item);
  });
};

// VOD搜索的单个处理函数
const handleSingleVodSearch = async (vodApi) => {
  const cacheKey = `vod-${vodApi.api}-${keyword.value}`;
  loadingStatus.value.set(vodApi.api, true);

  try {
    const cachedData = smartCache.get(cacheKey);
    if (cachedData) {
      vodData.value = [...vodData.value, ...cachedData];
      loadingStatus.value.set(vodApi.api, false);
      return;
    }

    const res = await fetchWithRetry("/api/vod/search", {
      method: "get",
      query: {
        type: vodApi.type,
        api: vodApi.api,
        ac: "detail",
        wd: keyword.value,
      },
    });

    if (res.code !== 500 && res.list && res.list.length) {
      const processedData = res.list.map((item) =>
        Object.assign(
          { playUrl: vodApi.playUrl, sourceName: vodApi.name },
          item
        )
      );
      smartCache.set(cacheKey, processedData);
      vodData.value = [...vodData.value, ...processedData];
    }
  } catch (err) {
    console.error(`Error fetching VOD from ${vodApi.api}:`, err);
  } finally {
    loadingStatus.value.set(vodApi.api, false);
  }
};

const searchByVod = async () => {
  vodData.value = [];

  vodApiEndpoints.forEach((vodApi) => {
    loadingStatus.value.set(vodApi.api, false);
  });

  vodApiEndpoints.forEach((vodApi) => {
    handleSingleVodSearch(vodApi);
  });
};

const search = (e) => {
  if (badWords.includes(e)) {
    return alert("请勿输入敏感词");
  }
  keyword.value = e;
  skeletonLoading.value = false;
  sources.value = [];
  handleSearch();
};

const colorMode = useColorMode();
const category = ref("clouddrive");

import vodApiEndpoints from "~/assets/vod/list";

const vodData = ref([]);

const iframeLoaded = ref(false);

const switchCategory = (e) => {
  category.value = e;
  iframeLoaded.value = false;
  if (e === "clouddrive") {
    sources.value = [];
    handleSearch();
  } else if (e === "onlineVod") {
    vodData.value = [];
    searchByVod();
  }
};

onMounted(() => {
  if (keyword.value) {
    handleSearch();
  }
});

// 定义分类选项
const categories = [
  {
    value: "clouddrive",
    label: "网盘资源",
    icon: "fas fa-cloud",
    description: "搜索各大网盘资源",
  },
  // {
  //   value: "onlineVod",
  //   label: "在线观影",
  //   icon: "fas fa-film",
  //   description: "搜索在线视频资源",
  // },
  // {
  //   value: "soupian",
  //   label: "搜片",
  //   icon: "fas fa-video",
  //   description: "专业影视搜索引擎",
  // },
];
</script>

<style scoped>
/* Enhanced button styles */
.el-button {
  @apply font-medium border-none shadow-sm hover:shadow-md relative overflow-hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.el-button:hover {
  transform: translateY(-1px);
}

.el-button::after {
  content: "";
  @apply absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full;
  transition: transform 0.6s ease;
}

.el-button:hover::after {
  transform: translateX(100%);
}

/* Enhanced loading animations */
@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

:deep(.el-progress-bar__inner) {
  @apply bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 transition-all duration-300;
  background-size: 200% 100%;
  animation: gradient 2s ease infinite;
}

:deep(.el-progress-bar__outer) {
  @apply bg-gray-100/50 dark:bg-gray-700/50 rounded-full overflow-hidden;
  backdrop-filter: blur(4px);
}

/* Enhanced transitions */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

/* Custom scrollbar */
::-webkit-scrollbar {
  @apply w-1.5 h-1.5;
}

::-webkit-scrollbar-track {
  @apply bg-transparent;
}

::-webkit-scrollbar-thumb {
  @apply bg-gradient-to-b from-purple-400/40 to-blue-400/40 rounded-full 
         hover:from-purple-500/50 hover:to-blue-500/50 transition-colors duration-200;
}

/* Enhanced shimmer effect */
@keyframes shimmer {
  0% {
    transform: translateX(-100%) skewX(-15deg);
  }
  100% {
    transform: translateX(100%) skewX(-15deg);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

/* Pulse animation with smoother transition */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Enhanced hover effects */
.hover\:shadow-lg {
  --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color),
    0 4px 6px -4px var(--tw-shadow-color);
  transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .hover\:shadow-lg {
  --tw-shadow-color: rgba(0, 0, 0, 0.25);
}

/* Card transitions */
.scale-enter-active,
.scale-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
