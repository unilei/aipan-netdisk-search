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
      class="w-full sticky top-0 z-10 transition-all duration-300 border-b border-gray-100/50 dark:border-gray-700/50"
    >
      <div class="max-w-[1240px] mx-auto px-4 py-3">
        <div class="flex flex-col sm:flex-row items-center gap-4">
          <!-- Category Selection with Enhanced UI -->
          <div
            class="w-full sm:w-auto flex gap-2 overflow-x-auto hide-scrollbar snap-x px-2 py-2 transition-all duration-300 rounded-xl bg-white/30 dark:bg-gray-800/30 ring-1 ring-gray-200/50 dark:ring-gray-700/50"
          >
            <el-button
              v-for="(item, index) in categories"
              :key="index"
              class="snap-start min-w-fit transition-all duration-300 rounded-xl group relative"
              :class="[
                category === item.value
                  ? 'shadow-lg !text-white scale-105 !bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                  : 'bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-600/80',
                index === 0 && 'ml-0.5',
                index === categories.length - 1 && 'mr-0.5',
              ]"
              :title="item.description"
              @click="switchCategory(item.value)"
              type="primary"
              :plain="category !== item.value"
            >
              <!-- Background hover effect -->
              <span
                v-if="category !== item.value"
                class="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              ></span>

              <!-- Icon and text with better alignment -->
              <div class="flex items-center gap-2">
                <i :class="item.icon" class="text-lg"></i>
                <span>{{ item.label }}</span>
              </div>

              <!-- Active indicator with enhanced animation -->
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

              <!-- Bottom border animation for active tab -->
              <span
                v-if="category === item.value"
                class="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-blue-400"
              ></span>
            </el-button>

            <!-- Settings button with tooltip -->
            <el-popover
              v-if="!userStore.loggedIn"
              placement="bottom-end"
              trigger="hover"
              :width="320"
              popper-class="backdrop-blur-md bg-white/90 dark:bg-gray-800/90 border border-gray-100/50 dark:border-gray-700/50 rounded-xl shadow-xl"
            >
              <template #reference>
                <el-button
                  class="snap-start min-w-fit rounded-xl bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-600/80 group"
                >
                  <div class="flex items-center gap-2">
                    <i
                      class="fas fa-cog text-lg group-hover:rotate-45 transition-transform duration-500"
                    ></i>
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
                    <h4
                      class="font-medium text-gray-900 dark:text-gray-100 mb-2"
                    >
                      登录以保存VOD配置
                    </h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      登录后可以将您的视频源配置保存到云端，在任何设备上使用相同的视频源。
                    </p>
                    <div class="flex gap-2">
                      <el-button
                        type="primary"
                        @click="navigateTo('/login')"
                        size="small"
                        class="!rounded-lg"
                      >
                        <i class="fas fa-sign-in-alt mr-1"></i> 登录
                      </el-button>
                      <el-button
                        @click="navigateTo('/user/vod-settings')"
                        size="small"
                        class="!rounded-lg"
                      >
                        <i class="fas fa-cog mr-1"></i> 管理配置
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </el-popover>
          </div>

          <!-- Stats Display with Enhanced Visual -->
          <div
            v-if="category === 'clouddrive' && loadingProgress.isLoading"
            class="w-full sm:flex-1 flex items-center gap-4 bg-white/50 dark:bg-gray-700/50 rounded-xl p-3 transition-all duration-300 backdrop-blur-sm ring-1 ring-gray-200/50 dark:ring-gray-700/50 shadow-sm group"
          >
            <div class="flex-1 relative overflow-hidden rounded-md">
              <el-progress
                :percentage="
                  Math.round(
                    (loadingProgress.completed / loadingProgress.total) * 100
                  )
                "
                :stroke-width="6"
                :show-text="false"
                class="flex-1"
              >
              </el-progress>
              <div
                class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
              ></div>
            </div>
            <span
              class="text-sm text-purple-600 dark:text-purple-400 font-medium whitespace-nowrap flex items-center gap-2"
            >
              <i class="fas fa-spinner fa-spin group-hover:animate-bounce"></i>
              搜索中...
              <span class="font-semibold"
                >{{ loadingProgress.completed }}/{{
                  loadingProgress.total
                }}</span
              >
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
                  :src="
                    'https://soupian.pro/frame?movie=' +
                    encodeURIComponent(keyword)
                  "
                  class="w-full h-full rounded-lg border-0 bg-white/90 dark:bg-gray-900/90 transition-colors duration-300"
                  loading="lazy"
                  @load="iframeLoaded = true"
                  @error="handleIframeError"
                ></iframe>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Loading State -->
      <div
        v-if="
          (category === 'clouddrive' && loadingProgress.isLoading) ||
          (category === 'onlineVod' &&
            Array.from(loadingStatus.values()).some((status) => status))
        "
        class="flex flex-col items-center justify-center py-16"
      >
        <div class="relative w-20 h-20 mb-6">
          <div class="absolute inset-0 flex items-center justify-center">
            <!-- Outer ring -->
            <div
              class="absolute w-full h-full border-4 border-purple-200 dark:border-purple-900/30 rounded-full"
            ></div>

            <!-- Animated gradient ring -->
            <div
              class="absolute w-full h-full rounded-full border-4 border-transparent [border-top:4px_solid_theme(colors.purple.500)] [border-right:4px_solid_theme(colors.blue.500)] [border-bottom:4px_solid_theme(colors.purple.500)] [border-left:4px_solid_theme(colors.blue.500)] animate-spin"
            ></div>

            <!-- Inner pulsing dot -->
            <div
              class="absolute w-3 h-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full animate-pulse"
            ></div>

            <!-- Outer particles -->
            <div class="absolute w-full h-full">
              <span
                class="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping opacity-75"
              ></span>
              <span
                class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping opacity-75 animation-delay-300"
              ></span>
              <span
                class="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping opacity-75 animation-delay-500"
              ></span>
              <span
                class="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping opacity-75 animation-delay-700"
              ></span>
            </div>
          </div>
        </div>

        <div class="text-center">
          <h3
            class="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent relative"
          >
            正在搜索中
            <span class="inline-flex ml-1">
              <span class="animate-bounce mr-0.5 delay-100">.</span>
              <span class="animate-bounce mr-0.5 delay-200">.</span>
              <span class="animate-bounce delay-300">.</span>
            </span>
          </h3>

          <div
            class="flex items-center justify-center mt-3 bg-white/40 dark:bg-gray-800/40 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm"
          >
            <i
              class="fas fa-info-circle text-purple-500 dark:text-purple-400 mr-2"
            ></i>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              <span v-if="category === 'clouddrive'">
                正在搜索
                <span class="font-medium text-purple-600 dark:text-purple-400"
                  >{{ loadingProgress.completed }}/{{
                    loadingProgress.total
                  }}</span
                >
                个网盘
              </span>
              <span v-else> 正在查询最佳影视资源 </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Empty State with Enhanced Visual -->
      <div
        v-if="
          searchPerformed &&
          !skeletonLoading &&
          !loadingProgress.isLoading &&
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

// 智能缓存类
class SmartCache {
  constructor({
    namespace = "smart-cache",
    maxSize = 100,
    useRedis = true,
  } = {}) {
    this.namespace = namespace;
    this.maxSize = maxSize;
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      redisHits: 0,
      deletes: 0,
    };
    this.useRedis = useRedis;

    // 默认TTL (24小时)
    this.defaultTTL = 86400000;

    // 不立即加载，等待客户端初始化
    if (process.client) {
      this.init();
    }

    if (process.env.NODE_ENV === "development") {
      console.log("SmartCache initialized", {
        namespace,
        maxSize,
        cacheSize: this.cache.size,
        useRedis,
      });
    }
  }

  // 初始化方法 - 加载缓存
  init() {
    if (!process.client) return;
    try {
      // 从localStorage加载缓存数据
      this.load();

      // 定期保存缓存到localStorage
      this.setupAutoSave();

      // 定期清理过期数据
      this.setupCleanupInterval();
    } catch (error) {
      console.error("Error initializing cache:", error);
    }
  }

  // 从localStorage加载数据
  load() {
    if (!process.client) return;

    try {
      const savedData = localStorage.getItem(this.namespace);
      if (savedData) {
        const { cache, stats } = JSON.parse(savedData);

        // 重建缓存
        this.cache.clear();
        if (Array.isArray(cache)) {
          // 新版本格式：entries数组
          cache.forEach(([key, value]) => {
            this.cache.set(key, value);
          });
        } else if (typeof cache === "object") {
          // 旧版本格式：对象
          Object.keys(cache).forEach((key) => {
            this.cache.set(key, cache[key]);
          });
        }

        // 恢复统计信息
        if (stats) {
          this.stats = { ...this.stats, ...stats };
        }

        if (process.env.NODE_ENV === "development") {
          console.log("Cache loaded from localStorage", {
            size: this.cache.size,
            stats: this.stats,
          });
        }
      }
    } catch (error) {
      console.error("Error loading cache from localStorage:", error);
      // 如果加载失败，清空缓存
      this.cache.clear();
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        redisHits: 0,
        deletes: 0,
      };
    }
  }

  // 保存数据到localStorage
  save() {
    if (!process.client) return;

    try {
      const data = {
        cache: Array.from(this.cache.entries()),
        stats: this.stats,
        timestamp: Date.now(),
      };

      localStorage.setItem(this.namespace, JSON.stringify(data));

      if (process.env.NODE_ENV === "development") {
        console.log("Cache saved to localStorage");
      }
    } catch (error) {
      console.error("Error saving cache to localStorage:", error);
      // 如果存储失败（比如超出配额），清理一部分数据后重试
      this.cleanup(true);
      try {
        const data = {
          cache: Array.from(this.cache.entries()),
          stats: this.stats,
          timestamp: Date.now(),
        };
        localStorage.setItem(this.namespace, JSON.stringify(data));
      } catch (error) {
        console.error("Failed to save cache even after cleanup:", error);
      }
    }
  }

  // 设置自动保存定时器
  setupAutoSave() {
    if (!process.client) return;

    // 每60秒保存一次缓存
    const saveInterval = setInterval(() => {
      this.save();
    }, 60000);

    // 页面卸载前保存一次
    window.addEventListener("beforeunload", () => {
      this.save();
      clearInterval(saveInterval);
    });
  }

  // 设置自动清理定时器
  setupCleanupInterval() {
    if (!process.client) return;

    // 每5分钟清理一次过期缓存
    const cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 300000);

    // 页面卸载前清理定时器
    window.addEventListener("beforeunload", () => {
      clearInterval(cleanupInterval);
    });
  }

  // 清理localStorage中的缓存数据
  clearStorage() {
    if (!process.client) return;

    try {
      localStorage.removeItem(this.namespace);
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

  // 获取Redis缓存命中率
  getRedisHitRate() {
    return this.stats.misses === 0
      ? 0
      : ((this.stats.redisHits / this.stats.misses) * 100).toFixed(2);
  }

  // 动态计算缓存时间
  getDynamicTTL(key, value) {
    // 默认24小时
    let ttl = this.defaultTTL;

    // 可以根据缓存内容大小动态调整TTL
    // 较大的数据可以设置较短的过期时间
    if (value && Array.isArray(value)) {
      if (value.length > 100) {
        // 对于大数据集，缩短TTL
        ttl = 3600000; // 1小时
      } else if (value.length > 50) {
        ttl = 7200000; // 2小时
      } else if (value.length < 5) {
        // 对于小数据集，延长TTL
        ttl = 172800000; // 48小时
      }
    }
    return ttl;
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
      this.save();

      if (process.env.NODE_ENV === "development") {
        console.log(`Cleaned up ${deleteCount} cache entries`);
      }
    }
  }

  // 解析缓存键获取搜索参数
  parseCacheKey(key) {
    try {
      // 处理vod搜索缓存键
      if (key.startsWith("vod-")) {
        // 提取API和关键词部分
        const matches = key.match(/^vod-(.+?)-(.+)$/);
        if (matches && matches.length === 3) {
          const [, api, encodedKeyword] = matches;
          return {
            category: "vod",
            source: api,
            keyword: decodeURIComponent(encodedKeyword),
          };
        }
      }
      // 处理普通搜索缓存键
      else {
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
      console.error("Error parsing cache key:", error, key);
    }

    // 如果无法解析，返回一个默认对象
    return { category: "unknown", source: "unknown", keyword: "" };
  }

  // 获取缓存数据 (同步版本，只检查本地缓存)
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

  // 异步获取缓存数据 (支持Redis)
  async getWithRedis(key) {
    // 先检查本地缓存
    const localData = this.get(key);
    if (localData) {
      return localData;
    }

    // 本地缓存未命中，尝试从Redis获取
    if (this.useRedis && process.client) {
      try {
        // 解析缓存键以确定Redis缓存参数
        const { category, source, keyword } = this.parseCacheKey(key);

        const result = await getCache({ category, source, keyword });

        if (result && result.data) {
          // Redis缓存命中
          this.stats.redisHits++;

          // 将Redis数据也保存到本地缓存
          this.set(key, result.data);

          return result.data;
        }
      } catch (error) {
        console.error("Error fetching from Redis cache:", error);
      }
    }

    return null;
  }

  // 设置缓存数据 (增加Redis支持)
  set(key, value) {
    const ttl = this.getDynamicTTL(key, value);

    // 更新本地缓存
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
      lastAccessed: Date.now(),
      accessCount: 1,
      size: JSON.stringify(value).length, // 记录数据大小
    });

    this.cleanup();

    // 异步保存到localStorage
    setTimeout(() => this.save(), 0);

    // 同步保存到Redis
    if (this.useRedis && process.client) {
      try {
        // 解析缓存键以确定Redis缓存参数
        const { category, source, keyword } = this.parseCacheKey(key);

        // 将TTL转换为秒
        const ttlInSeconds = Math.floor(ttl / 1000);

        // 异步保存到Redis
        setCache({
          data: value,
          category,
          source,
          keyword,
          ttl: ttlInSeconds,
        }).catch((err) => console.error("Error setting Redis cache:", err));
      } catch (error) {
        console.error("Error saving to Redis cache:", error);
      }
    }

    return value;
  }

  // 设置缓存数据 (支持Redis)
  async setWithRedis(key, value, ttl = this.getDynamicTTL(key, value)) {
    // 首先设置本地缓存
    this.set(key, value, ttl);

    // 如果启用了Redis，则同时设置Redis缓存
    if (this.useRedis && process.client) {
      try {
        // 解析缓存键以确定Redis缓存参数
        const { category, source, keyword } = this.parseCacheKey(key);

        // 向Redis缓存写入数据
        await setCache({
          category,
          source,
          keyword,
          data: value,
          ttl,
        });

        if (process.env.NODE_ENV === "development") {
          console.log("Cache saved to Redis:", key);
        }
      } catch (error) {
        console.error("Error saving cache to Redis:", error);
      }
    }
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
      redisHitRate: this.getRedisHitRate(),
      size: this.cache.size,
      maxSize: this.maxSize,
      totalSize: `${(totalSize / 1024).toFixed(2)}KB`,
      storageUsed: `${(localStorage.length / 1024).toFixed(2)}KB`,
    };
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

// 添加并发控制变量
const maxConcurrent = 3;
const queue = [];
let running = 0;

// 增加超时时间，添加更多错误处理
const fetchWithTimeout = async (url, options, timeout = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await $fetch(url, {
      ...options,
      signal: controller.signal,
      retry: 3,
      retryDelay: 1000,
      onRequestError: ({ error }) => {
        console.error("Request error:", error);
      },
    });
    return response;
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("Request timeout:", url);
      throw new Error(`Request timeout for ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// 优化重试逻辑
const fetchWithRetry = async (url, options, maxRetries = 3) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchWithTimeout(url, options);
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)));
      }
    }
  }
  throw lastError;
};

// 修改队列处理逻辑
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

// 修改缓存相关常量
const CACHE_CONFIG = {
  key: "quark_config_cache",
  expireTime: 10 * 60 * 1000, // 10分钟
  version: "1.0", // 用于缓存版本控制
};

// 修改配置状态
const quarkConfig = ref({
  apiUrl: "http://127.0.0.1:5000/api/quark/sharepage/save",
  quarkCookie: "",
  typeId: null,
  userId: null,
  enabled: false, // 添加启用状态
});

// 优化缓存保存函数
const saveConfigToCache = (config) => {
  try {
    const cacheData = {
      data: config,
      timestamp: Date.now(),
      version: CACHE_CONFIG.version,
    };
    localStorage.setItem(CACHE_CONFIG.key, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error saving config to cache:", error);
  }
};

// 优化缓存加载函数
const loadConfigFromCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_CONFIG.key);
    if (cached) {
      const { data, timestamp, version } = JSON.parse(cached);
      // 检查缓存版本和过期时间
      if (
        version === CACHE_CONFIG.version &&
        Date.now() - timestamp < CACHE_CONFIG.expireTime
      ) {
        quarkConfig.value = data;
        return true;
      }
      localStorage.removeItem(CACHE_CONFIG.key);
    }
  } catch (error) {
    console.error("Error loading config from cache:", error);
    localStorage.removeItem(CACHE_CONFIG.key);
  }
  return false;
};

// 修改获取配置的函数
const getQuarkConfig = async () => {
  // 先尝试从缓存加载
  if (loadConfigFromCache()) {
    return;
  }

  try {
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
      // 保存到缓存
      saveConfigToCache(config);
    }
  } catch (error) {
    console.error("Failed to get quark config:", error);
  }
};

// 添加清除缓存的函数（可在配置失效时调用）
const clearConfigCache = () => {
  localStorage.removeItem(CACHE_CONFIG.key);
};

// 优化队列状态管理
const queueState = reactive({
  successCount: 0,
  isProcessing: false,
  totalTasks: 0,
  processedTasks: 0,
  tasks: [],
  errorCount: 0,
  lastError: null,
  isPaused: false, // 添加暂停功能
});

// 添加随机延时函数
const randomDelay = (min, max) => {
  const delay = Math.floor(Math.random() * (max - min + 1) + min);
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// 优化队列处理函数
const processQueue = async () => {
  if (
    queueState.isProcessing ||
    queueState.tasks.length === 0 ||
    queueState.successCount >= 5 ||
    queueState.isPaused
  ) {
    return;
  }

  queueState.isProcessing = true;

  try {
    const task = queueState.tasks[0];
    await randomDelay(2000, 5000);

    const success = await saveToQuarkAsync(task.link, task.name);
    if (success) {
      queueState.successCount++;
    } else {
      queueState.errorCount++;
    }

    queueState.tasks.shift();
    queueState.processedTasks++;
  } catch (error) {
    console.error("Error processing queue:", error);
    queueState.errorCount++;
    queueState.lastError = error.message;
  } finally {
    queueState.isProcessing = false;
    if (
      queueState.tasks.length > 0 &&
      queueState.successCount < 5 &&
      !queueState.isPaused
    ) {
      processQueue();
    }
  }
};

// 修改 saveToQuarkAsync 函数
const saveToQuarkAsync = async (link, name) => {
  // 如果功能未启用，直接返回
  if (!quarkConfig.value.enabled) {
    return false;
  }

  try {
    if (
      !quarkConfig.value.quarkCookie ||
      !quarkConfig.value.typeId ||
      !quarkConfig.value.userId
    ) {
      throw new Error("夸克网盘配置不完整，请检查配置");
    }

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
    });

    if (saveRes.code === 401 || saveRes.code === 403) {
      clearConfigCache();
      await getQuarkConfig();
      showError("认证失败，请重新配置夸克网盘");
      return false;
    }

    let shareInfo = saveRes.data.share_info;
    if (shareInfo) {
      await $fetch("/api/quark/post", {
        method: "POST",
        body: {
          name,
          links: JSON.stringify([
            { key: Date.now(), value: shareInfo.share_url },
          ]),
          typeId: quarkConfig.value.typeId,
          userId: quarkConfig.value.userId,
        },
      });
      showSuccess(`${name} 转存成功`);
      return true;
    }
    showError(`${name} 转存失败`);
    return false;
  } catch (err) {
    console.error("Error saving quark file:", err);
    if (err.status === 401 || err.status === 403) {
      clearConfigCache();
      showError("认证失败，请重新配置夸克网盘");
    } else {
      showError(err.message || `${name} 转存失败`);
    }
    return false;
  }
};

// 记录搜索关键词
const recordSearch = async (keyword) => {
  try {
    await $fetch("/api/search/record", {
      method: "POST",
      body: {
        keyword,
      },
    });
  } catch (error) {
    console.error("记录搜索失败:", error);
  }
};

const handleSearch = async () => {
  if (!keyword.value || keyword.value.trim() === "") {
    // 如果关键词为空，清空结果并返回
    sources.value = [];
    return;
  }

  // 记录搜索
  recordSearch(keyword.value);

  // Set search performed to true when search starts
  searchPerformed.value = true;

  // 重置数据和状态
  sources.value = [];
  queue.length = 0;
  running = 0;
  window._needProcessQuarkLinks = false; // 重置标志

  // 重置加载进度
  loadingProgress.value = {
    total: sourcesApiEndpoints.length,
    completed: 0,
    isLoading: true,
  };

  // 先处理 aipan-search
  const aipanEndpoint = sourcesApiEndpoints.find(
    (item) => item.api === "/api/sources/aipan-search"
  );
  const otherEndpoints = sourcesApiEndpoints.filter(
    (item) => item.api !== "/api/sources/aipan-search"
  );

  if (aipanEndpoint) {
    await handleSingleSearch(aipanEndpoint);
  }

  // 然后处理其他接口
  otherEndpoints.forEach((item) => {
    handleSingleSearch(item);
  });
};

// 单个搜索处理函数
const handleSingleSearch = async (item) => {
  // 改进缓存键，确保关键词正确编码并包含在缓存键中
  const encodedKeyword = encodeURIComponent(keyword.value.trim());
  const cacheKey = `${item.api}-${encodedKeyword}`;

  const task = async () => {
    try {
      // 首先尝试从本地缓存获取数据
      let cachedData = smartCache.get(cacheKey);

      // 如果本地缓存未命中，尝试从Redis获取
      if (!cachedData) {
        cachedData = await smartCache.getWithRedis(cacheKey);
      }

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

      // 从API获取新数据
      const res = await fetchWithRetry(item.api, {
        method: "POST",
        body: {
          name: keyword.value,
        },
      });

      if (res.list && Array.isArray(res.list)) {
        // 将结果保存到缓存中，同时同步到Redis
        await smartCache.setWithRedis(cacheKey, res.list);

        if (item.api === "/api/sources/aipan-search") {
          sources.value.unshift(...res.list);
          if (res.list.length === 0) {
            window._needProcessQuarkLinks = true;
          }
        } else if (window._needProcessQuarkLinks && quarkConfig.value.enabled) {
          // 先显示搜索结果
          sources.value.push(...res.list);

          // 重置队列状态
          Object.assign(queueState, {
            successCount: 0,
            isProcessing: false,
            totalTasks: 0,
            processedTasks: 0,
            tasks: [],
            errorCount: 0,
            lastError: null,
          });

          // 获取所有夸克链接并添加到队列
          const quarkLinks = res.list.filter((result) =>
            result.links.some((link) => link.service === "QUARK")
          );

          // 将所有任务添加到队列
          quarkLinks.forEach((result) => {
            const links = result.links.filter(
              (link) => link.service === "QUARK"
            );
            links.forEach((link) => {
              queueState.tasks.push({
                link: link.link,
                name: result.name,
              });
            });
          });

          queueState.totalTasks = queueState.tasks.length;

          // 开始处理队列
          processQueue();
        } else {
          sources.value.push(...res.list);
        }
      }
    } catch (err) {
      console.error(`Error fetching from ${item.api}:`, err);
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

// 搜索VOD内容
const searchVod = async () => {
  if (!keyword.value || keyword.value.trim() === "") {
    // 如果关键词为空，清空结果并返回
    vodData.value = [];
    return;
  }

  // 重置数据
  vodData.value = [];

  // 对每个视频API进行处理
  for (const vodApi of vodApiList.value) {
    await handleSingleVodSearch(vodApi);
  }
};

// VOD搜索的单个处理函数
const handleSingleVodSearch = async (vodApi) => {
  // 改进缓存键，确保关键词正确编码并包含在缓存键中
  const encodedKeyword = encodeURIComponent(keyword.value.trim());
  const cacheKey = `vod-${vodApi.api}-${encodedKeyword}`;
  loadingStatus.value.set(vodApi.api, true);

  try {
    // 首先尝试从本地缓存获取数据
    let cachedData = smartCache.get(cacheKey);

    // 如果本地缓存未命中，尝试从Redis获取
    if (!cachedData) {
      cachedData = await smartCache.getWithRedis(cacheKey);
    }

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
      // 将结果保存到缓存中
      smartCache.setWithRedis(cacheKey, processedData);
      vodData.value = [...vodData.value, ...processedData];
    }
  } catch (err) {
    console.error(`Error fetching VOD from ${vodApi.api}:`, err);
  } finally {
    loadingStatus.value.set(vodApi.api, false);
  }
};

const searchByVod = async () => {
  // Set search performed to true when VOD search starts
  searchPerformed.value = true;

  vodData.value = [];
  vodConfigSources.value.forEach((vodApi) => {
    loadingStatus.value.set(vodApi.api, false);
  });

  vodConfigSources.value.forEach((vodApi) => {
    handleSingleVodSearch(vodApi);
  });
};

// 更新VOD源
const updateVodSources = (sources) => {
  vodConfigSources.value = sources;
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

const handleIframeError = () => {
  console.error("Iframe loading error");
  iframeLoaded.value = false;
};
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

/* Hide scrollbar but allow scrolling */
.hide-scrollbar {
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari and Opera */
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
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
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
  @apply bg-gradient-to-b from-purple-400/40 to-blue-400/40 rounded-full hover:from-purple-500/50 hover:to-blue-500/50 transition-colors duration-200;
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
