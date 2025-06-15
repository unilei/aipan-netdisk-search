<template>
  <div
    class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
    <search-header :keyword="keyword" @search="search" class="mb-2"></search-header>

    <!-- Category Tabs -->
    <div
      class="w-full sticky top-0 z-10 transition-all duration-300 border-b border-gray-100/50 dark:border-gray-700/50">
      <div class="max-w-[1240px] mx-auto px-4 py-3">
        <div class="flex flex-col sm:flex-row items-center gap-4">
          <!-- Category Selection with Enhanced UI -->
          <div
            class="w-full sm:w-auto flex gap-2 overflow-x-auto hide-scrollbar snap-x px-2 py-2 transition-all duration-300 rounded-xl bg-white/30 dark:bg-gray-800/30 ring-1 ring-gray-200/50 dark:ring-gray-700/50">
            <el-button v-for="(item, index) in categories" :key="index"
              class="snap-start min-w-fit transition-all duration-300 rounded-xl group relative" :class="[
                category === item.value
                  ? 'shadow-lg !text-white scale-105 !bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                  : 'bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-600/80',
                index === 0 && 'ml-0.5',
                index === categories.length - 1 && 'mr-0.5',
              ]" :title="item.description" @click="switchCategory(item.value)" type="primary"
              :plain="category !== item.value">
              <!-- Background hover effect -->
              <span v-if="category !== item.value"
                class="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>

              <!-- Icon and text with better alignment -->
              <div class="flex items-center gap-2">
                <i :class="item.icon" class="text-lg"></i>
                <span>{{ item.label }}</span>
              </div>

              <!-- Active indicator with enhanced animation -->
              <span v-if="category === item.value" class="absolute -top-1 -right-1 flex">
                <span class="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-purple-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>

              <!-- Bottom border animation for active tab -->
              <span v-if="category === item.value"
                class="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-blue-400"></span>
            </el-button>

            <!-- Settings button with tooltip -->
            <el-popover v-if="!userStore.loggedIn" placement="bottom-end" trigger="hover" :width="320"
              popper-class="backdrop-blur-md bg-white/90 dark:bg-gray-800/90 border border-gray-100/50 dark:border-gray-700/50 rounded-xl shadow-xl">
              <template #reference>
                <el-button
                  class="snap-start min-w-fit rounded-xl bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-600/80 group">
                  <div class="flex items-center gap-2">
                    <i class="fas fa-cog text-lg group-hover:rotate-45 transition-transform duration-500"></i>
                    <span>配置</span>
                  </div>
                </el-button>
              </template>
              <div class="p-3">
                <div class="flex items-start gap-3">
                  <div class="text-blue-500 mt-1">
                    <i class="fas fa-info-circle text-xl"></i>
                  </div>
                  <div>
                    <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      登录以保存VOD配置
                    </h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      登录后可以将您的视频源配置保存到云端，在任何设备上使用相同的视频源。
                    </p>
                    <div class="flex gap-2">
                      <el-button type="primary" @click="navigateTo('/login')" size="small" class="!rounded-lg">
                        <i class="fas fa-sign-in-alt mr-1"></i> 登录
                      </el-button>
                      <el-button @click="navigateTo('/user/vod-settings')" size="small" class="!rounded-lg">
                        <i class="fas fa-cog mr-1"></i> 管理配置
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </el-popover>
          </div>

          <!-- Stats Display with Enhanced Visual -->
          <div v-if="category === 'clouddrive' && loadingProgress.isLoading"
            class="w-full sm:flex-1 flex items-center gap-4 bg-white/50 dark:bg-gray-700/50 rounded-xl p-3 transition-all duration-300 backdrop-blur-sm ring-1 ring-gray-200/50 dark:ring-gray-700/50 shadow-sm group">
            <div class="flex-1 relative overflow-hidden rounded-md">
              <el-progress :percentage="Math.round(
                (loadingProgress.completed / loadingProgress.total) * 100
              )
                " :stroke-width="6" :show-text="false" class="flex-1">
              </el-progress>
              <div
                class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer">
              </div>
            </div>
            <span
              class="text-sm text-purple-600 dark:text-purple-400 font-medium whitespace-nowrap flex items-center gap-2">
              <i class="fas fa-spinner fa-spin group-hover:animate-bounce"></i>
              搜索中...
              <span class="font-semibold">{{ loadingProgress.completed }}/{{
                loadingProgress.total
              }}</span>
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
              <disk-info-list :sources="sources" :skeleton-loading="skeletonLoading">
              </disk-info-list>
            </div>
          </div>
        </transition>

        <!-- VOD Content -->
        <transition name="fade" mode="out-in">
          <div v-if="category === 'onlineVod'" class="p-2">
            <div class="space-y-4">
              <!-- Loading Skeletons -->
              <template v-if="
                vodData.length === 0 &&
                Array.from(loadingStatus.values()).some((status) => status)
              ">
                <!-- Header Skeleton -->
                <div class="flex flex-col sm:flex-row justify-between items-center gap-2 mb-4 px-2 animate-pulse">
                  <div class="h-6 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg w-48"></div>
                  <div class="h-8 bg-red-100/50 dark:bg-red-900/30 rounded-full w-64"></div>
                </div>

                <!-- Video Player Skeleton -->
                <div class="relative rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 backdrop-blur-sm">
                  <div class="aspect-video w-full bg-gray-200/50 dark:bg-gray-700/50 animate-pulse">
                    <div class="absolute inset-0 flex items-center justify-center">
                      <i class="fas fa-film text-4xl text-gray-400 dark:text-gray-600"></i>
                    </div>
                  </div>
                </div>

                <!-- Episodes List Skeleton -->
                <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-2">
                  <div v-for="i in 12" :key="i"
                    class="h-10 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg animate-pulse"></div>
                </div>
              </template>

              <!-- VOD List -->
              <template v-else>
                <vod-list :vod-data="vodData" class="transition-opacity duration-300" :class="{
                  'opacity-0': Array.from(loadingStatus.values()).some(
                    (status) => status
                  ),
                }"></vod-list>
              </template>
            </div>
          </div>
        </transition>

        <!-- Soupian iframe -->
        <transition name="fade" mode="out-in">
          <div v-if="category === 'soupian'" class="h-full w-full py-4">
            <div
              class="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg shadow-sm hover:shadow-lg hover:bg-white/70 dark:hover:bg-gray-800/70 p-5 ring-1 ring-black/5 dark:ring-white/5 transition-all duration-300">
              <div class="relative w-full h-[calc(100vh-240px)]">
                <div v-if="!iframeLoaded"
                  class="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-800/90 rounded-lg backdrop-blur-sm">
                  <div class="flex flex-col items-center gap-3">
                    <div class="relative w-12 h-12">
                      <div class="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
                      <div
                        class="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin">
                      </div>
                    </div>
                    <span class="text-sm text-purple-600 dark:text-purple-400 font-medium">加载中...</span>
                  </div>
                </div>
                <iframe id="soupian" :src="'https://soupian.pro/frame?movie=' +
                  encodeURIComponent(keyword)
                  "
                  class="w-full h-full rounded-lg border-0 bg-white/90 dark:bg-gray-900/90 transition-colors duration-300"
                  loading="lazy" @load="iframeLoaded = true" @error="handleIframeError"></iframe>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Loading State -->
      <div v-if="
        (category === 'clouddrive' && loadingProgress.isLoading) ||
        (category === 'onlineVod' &&
          Array.from(loadingStatus.values()).some((status) => status))
      " class="flex flex-col items-center justify-center py-10">
        <!-- 移除原有的复杂加载动画，只保留文字 -->
        <div class="text-center">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
            正在搜索中...
          </h3>

          <div
            class="flex items-center justify-center mt-2 bg-white/40 dark:bg-gray-800/40 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm">
            <i class="fas fa-info-circle text-purple-500 dark:text-purple-400 mr-2"></i>
            <p class="text-xs text-gray-600 dark:text-gray-300">
              <span v-if="category === 'clouddrive'">
                正在搜索
                <span class="font-medium text-purple-600 dark:text-purple-400">{{ loadingProgress.completed }}/{{
                  loadingProgress.total
                  }}</span>
                个网盘
              </span>
              <span v-else> 正在查询最佳影视资源 </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Empty State with Enhanced Visual -->
      <div v-if="
        searchPerformed &&
        !skeletonLoading &&
        !loadingProgress.isLoading &&
        !Array.from(loadingStatus.values()).some((status) => status) &&
        ((category === 'clouddrive' && sources.length === 0) ||
          (category === 'onlineVod' && vodData.length === 0))
      " class="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
        <div
          class="p-8 rounded-full bg-gradient-to-br from-purple-100/50 to-blue-100/50 dark:from-purple-900/20 dark:to-blue-900/20 mb-6 shadow-lg backdrop-blur-sm group hover:scale-105 transition-all duration-300">
          <i
            class="fas fa-search text-5xl text-purple-500/70 dark:text-purple-400/70 group-hover:rotate-12 transition-transform duration-300"></i>
        </div>
        <h3 class="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          未找到相关结果
        </h3>
        <p class="text-sm mt-3 opacity-75">试试以下建议：</p>
        <ul class="mt-4 text-sm space-y-2 text-center">
          <li>• 检查输入是否正确</li>
          <li>• 尝试使用不同的关键词</li>
        </ul>
      </div>

      <!-- Enhanced Backtop -->
      <el-backtop :right="24" :bottom="24"
        class="!bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 !w-12 !h-12 transition-all duration-300 !rounded-xl group hover:scale-110 !shadow-lg hover:!shadow-xl backdrop-blur-sm flex items-center justify-center">
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
import { useUserStore } from "~/stores/user";
import { useVodSources } from "~/composables/useVodSources";
import { useRedisCache } from "~/composables/useRedisCache";

definePageMeta({
  layout: "custom",
});
const route = useRoute();
const userStore = useUserStore();
const { sources: vodConfigSources, loadSources } = useVodSources();
const { getCache, setCache } = useRedisCache();
const keyword = ref(decodeURIComponent(route.query.keyword));
const sources = ref([]);
const skeletonLoading = ref(false);
const loadingProgress = ref({
  total: 0,
  completed: 0,
  isLoading: false,
});
const loadingStatus = ref(new Map());
const searchPerformed = ref(false);

// 在 setup 中获取运行时配置
const config = useRuntimeConfig();

// 简化缓存类
class SmartCache {
  constructor({
    namespace = "smart-cache",
    maxSize = 100,
    useRedis = true,
  } = {}) {
    this.namespace = namespace;
    this.maxSize = maxSize;
    this.cache = new Map();
    this.useRedis = useRedis;
    this.ttlConfig = {
      search: 5 * 60 * 1000, // 搜索结果缓存5分钟
      vod: 15 * 60 * 1000,   // VOD结果缓存15分钟
      config: 24 * 60 * 60 * 1000, // 配置信息缓存24小时
      default: 60 * 60 * 1000 // 默认1小时
    };

    if (process.client) {
      this.init();
    }
  }

  init() {
    if (!process.client) return;
    try {
      this.load();
      this.setupAutoSave();
      this.setupCleanupInterval();
    } catch (error) {
      console.error("Error initializing cache:", error);
    }
  }

  load() {
    if (!process.client) return;
    try {
      const savedData = localStorage.getItem(this.namespace);
      if (savedData) {
        const { cache } = JSON.parse(savedData);
        this.cache.clear();
        if (Array.isArray(cache)) {
          cache.forEach(([key, value]) => {
            this.cache.set(key, value);
          });
        } else if (typeof cache === "object") {
          Object.keys(cache).forEach((key) => {
            this.cache.set(key, cache[key]);
          });
        }
      }
    } catch (error) {
      console.error("Error loading cache:", error);
      this.cache.clear();
    }
  }

  save() {
    if (!process.client) return;
    try {
      const data = { cache: Array.from(this.cache.entries()), timestamp: Date.now() };
      localStorage.setItem(this.namespace, JSON.stringify(data));
    } catch (error) {
      this.cleanup(true);
      try {
        localStorage.setItem(this.namespace, JSON.stringify({
          cache: Array.from(this.cache.entries()),
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error("Failed to save cache:", error);
      }
    }
  }

  setupAutoSave() {
    if (!process.client) return;
    this.saveInterval = setInterval(() => this.save(), 60000);
    this.beforeUnloadHandler = () => {
      this.save();
      this.cleanup();
    };
    window.addEventListener("beforeunload", this.beforeUnloadHandler);
  }

  setupCleanupInterval() {
    if (!process.client) return;
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
  }

  // 清理所有定时器和事件监听器
  destroy() {
    if (!process.client) return;

    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.beforeUnloadHandler) {
      window.removeEventListener("beforeunload", this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }

    this.cache.clear();
  }

  isStale(cacheItem, type = 'default') {
    if (!cacheItem) return true;
    const ttl = this.ttlConfig[type] || this.ttlConfig.default;
    return Date.now() > cacheItem.timestamp + ttl;
  }

  getTTL(type = 'default', value = null) {
    return this.ttlConfig[type] || this.ttlConfig.default;
  }

  getCacheType(key) {
    if (key.startsWith("vod-")) return "vod";
    else if (key.includes("config") || key.includes("setting")) return "config";
    return "search";
  }

  parseCacheKey(key) {
    try {
      if (key.startsWith("vod-")) {
        const matches = key.match(/^vod-(.+?)-(.+)$/);
        if (matches && matches.length === 3) {
          const [, api, encodedKeyword] = matches;
          return {
            category: "vod",
            source: api,
            keyword: decodeURIComponent(encodedKeyword),
          };
        }
      } else {
        const matches = key.match(/^(.+?)-(.+)$/);
        if (matches && matches.length === 3) {
          const [, api, encodedKeyword] = matches;
          return {
            category: "search",
            source: api,
            keyword: decodeURIComponent(encodedKeyword),
          };
        }
      }
    } catch (error) {
      console.error("Error parsing cache key:", error);
    }
    return { category: "unknown", source: "unknown", keyword: "" };
  }

  cleanup(force = false) {
    if (!process.client) return;
    if (force || this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries()).sort((a, b) => {
        return (a[1].lastAccessed || 0) - (b[1].lastAccessed || 0);
      });
      const deleteCount = Math.floor(this.maxSize * 0.25);
      entries.slice(0, deleteCount).forEach(([key]) => this.cache.delete(key));
      this.save();
    }
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    const type = this.getCacheType(key);
    if (this.isStale(item, type)) {
      this.cache.delete(key);
      return null;
    }

    item.lastAccessed = Date.now();
    return item.value;
  }

  async getFromRedisOnly(key) {
    if (!this.useRedis || !process.client) return null;
    try {
      const { category, source, keyword } = this.parseCacheKey(key);
      const result = await getCache({ category, source, keyword });
      if (result && result.data) return result.data;
    } catch (error) {
      console.error("Redis cache error:", error);
    }
    return null;
  }

  async getWithStrategy(key) {
    try {
      const redisData = await this.getFromRedisOnly(key);
      if (redisData) {
        this.set(key, redisData, this.getCacheType(key));
        return redisData;
      }

      return this.get(key);
    } catch (error) {
      console.error("Cache error:", error);
      return this.get(key);
    }
  }

  set(key, value, type) {
    if (!type) type = this.getCacheType(key);

    const ttl = this.getTTL(type, value);
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
      lastAccessed: Date.now(),
      type
    });

    this.cleanup();
    setTimeout(() => this.save(), 0);
    return value;
  }

  async setWithStrategy(key, value, type) {
    if (!type) type = this.getCacheType(key);

    this.set(key, value, type);

    if (this.useRedis && process.client) {
      try {
        const { category, source, keyword } = this.parseCacheKey(key);
        const ttlInSeconds = Math.floor(this.getTTL(type, value) / 1000);
        await setCache({
          category,
          source,
          keyword,
          data: value,
          ttl: ttlInSeconds,
        });
      } catch (error) {
        console.error("Redis cache save error:", error);
      }
    }

    return value;
  }
}

// 创建SmartCache实例 - 使用新的参数结构
const smartCache = new SmartCache({
  namespace: "search-cache",
  maxSize: 500,
  useRedis: true,
});

// 在组件挂载后初始化缓存系统
onMounted(async () => {
  // 初始化缓存系统
  if (process.client) {
    smartCache.init();
  }

  // 加载夸克配置
  await getQuarkConfig();

  // 加载用户的VOD配置
  await loadSources();

  // 执行搜索
  if (keyword.value) {
    handleSearch();
  } else {
    // If no keyword, we haven't searched yet
    searchPerformed.value = false;
  }
});

// 并发控制和简化的fetch
const maxConcurrent = 3;
const queue = [];
let running = 0;

const fetchWithRetry = async (url, options, maxRetries = 3) => {
  // 为 indexI API 设置更长的超时时间，因为响应较慢
  const timeout = url.includes('/api/sources/indexI') ? 60000 : 30000; // indexI API 60秒，其他 30秒

  const defaultOptions = {
    timeout,
    retry: maxRetries,
    retryDelay: 1000,
    ...options
  };

  try {
    return await $fetch(url, defaultOptions);
  } catch (error) {
    // 如果是AbortError，直接抛出不记录错误
    if (error.name === 'AbortError') {
      throw error;
    }

    console.error("Request failed:", {
      url,
      error: error.message || error,
      status: error.status || 'unknown',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

// 简化队列处理
const runQueue = async () => {
  if (running >= maxConcurrent || queue.length === 0) return;

  running++;
  const task = queue.shift();

  try {
    await task();
  } catch (error) {
    console.error("Task error:", error);
  } finally {
    running--;
    runQueue();
  }
};

// 简化配置管理
const quarkConfig = ref({
  apiUrl: "http://127.0.0.1:5000/api/quark/sharepage/save",
  quarkCookie: "",
  typeId: null,
  userId: null,
  enabled: false
});

// 获取配置
const getQuarkConfig = async () => {
  const configCacheKey = "quark-config";

  try {
    const cachedConfig = await smartCache.getWithStrategy(configCacheKey);
    if (cachedConfig) {
      quarkConfig.value = cachedConfig;
      return;
    }

    const res = await $fetch("/api/quark/setting");
    if (res.code === 200 && res.data) {
      const config = {
        apiUrl: res.data.apiUrl || quarkConfig.value.apiUrl,
        quarkCookie: res.data.quarkCookie,
        typeId: res.data.typeId,
        userId: res.data.userId,
        enabled: res.data.enabled,
      };
      quarkConfig.value = config;
      await smartCache.setWithStrategy(configCacheKey, config, "config");
    }
  } catch (error) {
    console.error("Failed to get quark config:", error);
  }
};

// 清除配置缓存
const clearConfigCache = () => {
  if (process.client) {
    const configCacheKey = "quark-config";
    smartCache.cache.delete(configCacheKey);

    if (smartCache.useRedis) {
      setCache({
        category: "config",
        source: "quark",
        keyword: "settings",
        data: null,
        ttl: 1
      }).catch(err => console.error("Redis cache clear error:", err));
    }
  }
};

// 简化队列状态
const queueState = reactive({
  successCount: 0,
  isProcessing: false,
  tasks: [],
  errorCount: 0
});

// 队列处理定时器
let queueTimer = null;

// 简化队列处理 - 避免递归调用
const processQueue = async () => {
  if (queueState.isProcessing || queueState.tasks.length === 0 || queueState.successCount >= 5) {
    return;
  }

  queueState.isProcessing = true;

  try {
    const task = queueState.tasks[0];
    await new Promise(resolve => setTimeout(resolve, 3000));

    const success = await saveToQuarkAsync(task.link, task.name);
    if (success) {
      queueState.successCount++;
    } else {
      queueState.errorCount++;
    }

    queueState.tasks.shift();
  } catch (error) {
    console.error("Queue processing error:", {
      error: error.message || error,
      taskCount: queueState.tasks.length,
      successCount: queueState.successCount,
      errorCount: queueState.errorCount,
      timestamp: new Date().toISOString()
    });
    queueState.errorCount++;
  } finally {
    queueState.isProcessing = false;

    // 使用定时器避免递归调用栈溢出
    if (queueState.tasks.length > 0 && queueState.successCount < 5) {
      queueTimer = setTimeout(() => {
        processQueue();
      }, 100);
    }
  }
};

// 停止队列处理
const stopQueueProcessing = () => {
  if (queueTimer) {
    clearTimeout(queueTimer);
    queueTimer = null;
  }
  queueState.isProcessing = false;
};

// 简化 saveToQuarkAsync 函数
const saveToQuarkAsync = async (link, name) => {
  if (!quarkConfig.value.enabled ||
    !quarkConfig.value.quarkCookie ||
    !quarkConfig.value.typeId ||
    !quarkConfig.value.userId) {
    return false;
  }

  try {
    const saveRes = await $fetch(quarkConfig.value.apiUrl, {
      method: "POST",
      body: {
        shareurl: link,
        savepath: `/yingshifenxiang/${name}`,
      },
      headers: {
        Cookiequark: quarkConfig.value.quarkCookie,
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30秒超时
      retry: 2,
      retryDelay: 1000
    });

    if (saveRes.code === 401 || saveRes.code === 403) {
      clearConfigCache();
      await getQuarkConfig();
      showError("认证失败，请重新配置夸克网盘");
      return false;
    }

    const shareInfo = saveRes.data.share_info;
    if (shareInfo) {
      await $fetch("/api/quark/post", {
        method: "POST",
        body: {
          name,
          links: JSON.stringify([{ key: Date.now(), value: shareInfo.share_url }]),
          typeId: quarkConfig.value.typeId,
          userId: quarkConfig.value.userId,
        },
        timeout: 30000, // 30秒超时
        retry: 2,
        retryDelay: 1000
      });
      showSuccess(`${name} 转存成功`);
      return true;
    }

    showError(`${name} 转存失败`);
    return false;
  } catch (err) {
    console.error("保存夸克文件失败:", {
      error: err.message || err,
      status: err.status || 'unknown',
      name,
      link,
      timestamp: new Date().toISOString()
    });

    if (err.status === 401 || err.status === 403) {
      clearConfigCache();
      showError("认证失败，请重新配置夸克网盘");
    } else {
      showError(`${name} 转存失败: ${err.message || '网络错误'}`);
    }
    return false;
  }
};

// 请求去重管理
let currentSearchController = null;
let currentVodSearches = new Map();

// 处理搜索函数
const handleSearch = async () => {
  if (!keyword.value || keyword.value.trim() === "") {
    sources.value = [];
    return;
  }

  // 取消之前的搜索请求
  if (currentSearchController) {
    currentSearchController.abort();
  }

  currentSearchController = new AbortController();

  // 记录搜索
  try {
    await $fetch("/api/search/record", {
      method: "POST",
      body: { keyword: keyword.value },
      signal: currentSearchController.signal
    });
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error("记录搜索失败:", {
        error: error.message || error,
        keyword: keyword.value,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 更新搜索状态
  searchPerformed.value = true;
  sources.value = [];
  queue.length = 0;
  running = 0;
  window._needProcessQuarkLinks = false;

  // 重置加载进度
  loadingProgress.value = {
    total: sourcesApiEndpoints.length,
    completed: 0,
    isLoading: true,
  };

  // 优先处理 aipan-search
  const aipanEndpoint = sourcesApiEndpoints.find(item => item.api === "/api/sources/aipan-search");
  const otherEndpoints = sourcesApiEndpoints.filter(item => item.api !== "/api/sources/aipan-search");

  if (aipanEndpoint) {
    await handleSingleSearch(aipanEndpoint);
  }

  // 处理其他接口
  otherEndpoints.forEach(item => {
    handleSingleSearch(item);
  });
};

// 处理单个搜索
const handleSingleSearch = async (item) => {
  const encodedKeyword = encodeURIComponent(keyword.value.trim());
  const cacheKey = `${item.api}-${encodedKeyword}`;

  const task = async () => {
    try {
      // 尝试从缓存获取
      const cachedData = await smartCache.getWithStrategy(cacheKey);

      if (cachedData) {
        if (item.api === "/api/sources/aipan-search") {
          sources.value.unshift(...cachedData);
          if (cachedData.length === 0) {
            window._needProcessQuarkLinks = true;
          }
        } else {
          sources.value.push(...cachedData);
        }
        loadingProgress.value.completed++;
        return;
      }

      // 缓存未命中，从API获取
      const res = await fetchWithRetry(item.api, {
        method: "POST",
        body: { name: keyword.value },
      });

      if (res.list && Array.isArray(res.list)) {
        await smartCache.setWithStrategy(cacheKey, res.list, "search");

        if (item.api === "/api/sources/aipan-search") {
          sources.value.unshift(...res.list);
          if (res.list.length === 0) {
            window._needProcessQuarkLinks = true;
          }
        } else if (window._needProcessQuarkLinks && quarkConfig.value.enabled) {
          sources.value.push(...res.list);

          // 重置队列状态
          queueState.successCount = 0;
          queueState.isProcessing = false;
          queueState.tasks = [];
          queueState.errorCount = 0;

          // 添加夸克链接到队列
          res.list.forEach(result => {
            const links = result.links.filter(link => link.service === "QUARK");
            links.forEach(link => {
              queueState.tasks.push({
                link: link.link,
                name: result.name,
              });
            });
          });

          // 处理队列
          processQueue();
        } else {
          sources.value.push(...res.list);
        }
      }
    } catch (err) {
      console.error(`搜索失败 ${item.api}:`, {
        error: err.message || err,
        api: item.api,
        keyword: keyword.value,
        timestamp: new Date().toISOString()
      });
    } finally {
      loadingProgress.value.completed++;
      if (loadingProgress.value.completed >= loadingProgress.value.total) {
        loadingProgress.value.isLoading = false;
        delete window._needProcessQuarkLinks;
      }
    }
  };

  queue.push(task);
  runQueue();
};

// 处理单个VOD搜索
const handleSingleVodSearch = async (vodApi) => {
  const encodedKeyword = encodeURIComponent(keyword.value.trim());
  const cacheKey = `vod-${vodApi.api}-${vodApi.type || 'default'}-${encodedKeyword}`;

  // 取消之前的VOD搜索请求
  if (currentVodSearches.has(vodApi.api)) {
    currentVodSearches.get(vodApi.api).abort();
  }

  const controller = new AbortController();
  currentVodSearches.set(vodApi.api, controller);
  loadingStatus.value.set(vodApi.api, true);

  try {
    // 尝试从缓存获取
    const cachedData = await smartCache.getWithStrategy(cacheKey);
    if (cachedData) {
      vodData.value = [...vodData.value, ...cachedData];
      loadingStatus.value.set(vodApi.api, false);
      return;
    }

    // 从API获取
    const res = await fetchWithRetry("/api/vod/search", {
      method: "get",
      query: {
        type: vodApi.type,
        api: vodApi.api,
        ac: "detail",
        wd: keyword.value,
      },
      signal: controller.signal
    });

    // 改进的响应验证和错误处理
    if (res && typeof res === 'object') {
      if (res.code === 200 && res.list && Array.isArray(res.list) && res.list.length > 0) {
        // 验证每个item的基本结构
        const validItems = res.list.filter(item =>
          item && typeof item === 'object' && (item.vod_name || item.title)
        );

        if (validItems.length > 0) {
          const processedData = validItems.map(item =>
            Object.assign({ playUrl: vodApi.playUrl, sourceName: vodApi.name }, item)
          );
          await smartCache.setWithStrategy(cacheKey, processedData, "vod");
          vodData.value = [...vodData.value, ...processedData];
        }
      } else if (res.code !== 200) {
        console.warn(`VOD API返回错误状态: ${vodApi.api}, code: ${res.code}, message: ${res.msg || '未知错误'}`);
      }
    } else {
      console.warn(`VOD API返回无效响应: ${vodApi.api}`);
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error(`VOD获取失败: ${vodApi.api}`, {
        error: err.message || err,
        vodApi: vodApi.name,
        keyword: keyword.value,
        timestamp: new Date().toISOString()
      });
      // 在生产环境中可以添加用户友好的错误提示
      // 例如: showError(`${vodApi.name} 搜索失败，请稍后重试`)
    }
  } finally {
    loadingStatus.value.set(vodApi.api, false);
    currentVodSearches.delete(vodApi.api);
  }
};

// 搜索VOD内容
const searchByVod = async () => {
  if (!keyword.value || keyword.value.trim() === "") {
    vodData.value = [];
    return;
  }

  searchPerformed.value = true;
  vodData.value = [];

  // 清理之前的加载状态
  loadingStatus.value.clear();

  // 使用 Promise.allSettled 处理并发请求，避免竞态条件
  const searchPromises = vodConfigSources.value.map(vodApi => {
    loadingStatus.value.set(vodApi.api, true);
    return handleSingleVodSearch(vodApi);
  });

  try {
    await Promise.allSettled(searchPromises);
  } catch (error) {
    console.error('VOD搜索过程中发生错误:', error);
  }
};

// 数据验证函数
const validateVodSource = (source) => {
  return source &&
    typeof source === 'object' &&
    typeof source.api === 'string' &&
    typeof source.name === 'string' &&
    source.api.trim() !== '' &&
    source.name.trim() !== '';
};

// 验证URL安全性
const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url);
    // 只允许http和https协议
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// 更新VOD源
const updateVodSources = (sources) => {
  if (sources && Array.isArray(sources)) {
    // 验证和过滤数据
    const validSources = sources.filter(source => {
      const isValid = validateVodSource(source);
      if (!isValid) {
        console.warn('发现无效的VOD源配置:', source);
      }
      return isValid;
    });

    vodConfigSources.value = validSources;
  } else {
    console.warn('VOD源数据格式无效或为空');
    vodConfigSources.value = [];
  }
};

const search = (e) => {
  // 输入验证和清理
  if (!e || typeof e !== 'string') {
    console.warn('搜索关键词无效');
    return;
  }

  const cleanKeyword = e.trim();
  if (cleanKeyword.length === 0) {
    console.warn('搜索关键词不能为空');
    return;
  }

  // 长度限制
  if (cleanKeyword.length > 100) {
    alert('搜索关键词过长，请输入100个字符以内的内容');
    return;
  }

  // 敏感词检查
  if (badWords.includes(cleanKeyword)) {
    return alert("请勿输入敏感词");
  }

  // XSS防护 - 移除潜在的脚本标签
  const sanitizedKeyword = cleanKeyword.replace(/<script[^>]*>.*?<\/script>/gi, '');

  keyword.value = sanitizedKeyword;
  skeletonLoading.value = false;
  sources.value = [];
  handleSearch();
};

const colorMode = useColorMode();
const category = ref("clouddrive");
const vodData = ref([]);

// 检查是否有可用的VOD源
const hasVodSources = computed(() => {
  return vodConfigSources.value && vodConfigSources.value.length > 0;
});

// 更新分类选项
const categories = computed(() => [
  {
    value: "clouddrive",
    label: "网盘资源",
    icon: "fas fa-cloud",
    description: "搜索各大网盘资源",
  },
  ...(hasVodSources.value
    ? [
      {
        value: "onlineVod",
        label: "在线观影",
        icon: "fas fa-film",
        description: "搜索在线视频资源",
      },
    ]
    : []),
  // {
  //   value: "soupian",
  //   label: "搜片",
  //   icon: "fas fa-video",
  //   description: "专业影视搜索引擎",
  // },
]);

const iframeLoaded = ref(false);

const switchCategory = (e) => {
  // 防止重复切换到相同分类
  if (category.value === e) {
    return;
  }

  // 清理之前的定时器
  if (iframeErrorTimer) {
    clearTimeout(iframeErrorTimer);
    iframeErrorTimer = null;
  }

  // 更新状态
  category.value = e;
  iframeLoaded.value = false;
  sources.value = [];
  vodData.value = [];
  searchPerformed.value = false;

  // 重置加载状态
  loadingStatus.value.clear();

  if (e === "clouddrive") {
    handleSearch();
  } else if (e === "onlineVod") {
    searchByVod();
  }

  // 确保UI状态同步
  nextTick(() => {
    // 可以在这里添加额外的UI同步逻辑
  });
};

// 处理iframe错误
let iframeErrorTimer = null;
const handleIframeError = () => {
  console.error("Iframe loading error");
  iframeLoaded.value = false;

  // 清理之前的定时器
  if (iframeErrorTimer) {
    clearTimeout(iframeErrorTimer);
  }

  iframeErrorTimer = setTimeout(() => {
    iframeLoaded.value = false;
    iframeErrorTimer = null;
  }, 3000);
};

// 组件卸载时清理资源
onUnmounted(() => {
  // 取消所有进行中的请求
  if (currentSearchController) {
    currentSearchController.abort();
    currentSearchController = null;
  }

  // 取消所有VOD搜索请求
  currentVodSearches.forEach(controller => {
    controller.abort();
  });
  currentVodSearches.clear();

  // 清理定时器
  if (iframeErrorTimer) {
    clearTimeout(iframeErrorTimer);
    iframeErrorTimer = null;
  }

  // 停止队列处理并清理定时器
  stopQueueProcessing();

  // 清理SmartCache资源
  if (smartCache && typeof smartCache.destroy === 'function') {
    smartCache.destroy();
  }

  // 清理加载状态
  loadingStatus.value.clear();

  // 清理数据
  vodData.value = [];
  sources.value = [];
});
</script>

<style scoped>
/* Button styles */
.el-button {
  @apply font-medium border-none shadow-sm hover:shadow-md relative overflow-hidden;
  transition: all 0.3s ease;
}

.el-button:hover {
  transform: translateY(-1px);
}

/* Hide scrollbar */
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Progress bar */
:deep(.el-progress-bar__inner) {
  @apply bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500;
}

:deep(.el-progress-bar__outer) {
  @apply bg-gray-100/50 dark:bg-gray-700/50 rounded-full overflow-hidden;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Scrollbar */
::-webkit-scrollbar {
  @apply w-1.5 h-1.5;
}

::-webkit-scrollbar-thumb {
  @apply bg-gradient-to-b from-purple-400/40 to-blue-400/40 rounded-full;
}

/* Animations */
@keyframes shimmer {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

.animate-pulse {
  animation: pulse 2s ease infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}
</style>
