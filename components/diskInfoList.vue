<script setup>
import { ElMessage } from "element-plus";
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import DOMPurify from "dompurify";
import {
  detectLinkService,
  getLinkCategoryName,
  getLinkServiceName,
  isCloudDriveService,
  isDirectProtocolLink,
} from "~/utils/linkTypes";
import { openUrlWithNoOpener } from "~/utils/externalNavigation";

const props = defineProps({
  sources: {
    type: Array,
    default: () => [],
  },
  skeletonLoading: {
    type: Boolean,
    default: false,
  },
  redirectStatus: {
    type: Boolean,
    default: true,
  },
  isSearching: {
    type: Boolean,
    default: false,
  },
});

// 搜索关键词（从路由获取）
const route = useRoute();
const searchKeyword = computed(() => {
  const kw = route.query.keyword;
  if (!kw) return '';
  return Array.isArray(kw) ? (kw[0] || '') : String(kw);
});

// DOMPurify 配置：只允许 <mark> 标签
const sanitizeHighlight = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['mark'],
    ALLOWED_ATTR: [],
  });
};

// 前端 fallback 高亮：对没有 highlightedName 的结果，用正则包裹关键词
const applyFallbackHighlight = (name, keyword) => {
  if (!keyword || !name) return name;
  try {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return name.replace(regex, '<mark>$1</mark>');
  } catch {
    return name;
  }
};

// 获取最终高亮后的名称
const getHighlightedName = (item) => {
  if (item.highlightedName) {
    return sanitizeHighlight(item.highlightedName);
  }
  const kw = searchKeyword.value;
  if (kw) {
    return sanitizeHighlight(applyFallbackHighlight(item.name, kw));
  }
  return item.name;
};

// 筛选相关状态
const selectedFilters = ref(new Set());
const showFilters = ref(true);

// 验证配置状态（页面加载时获取，避免每次点击都调用）
const verificationConfig = ref({
  isEnabled: false,
  isVerified: false,
  isLoading: true,
});

// 网盘图标映射
const diskIcons = {
  ALIYUN: new URL("@/assets/netdisk/aliyun1.png", import.meta.url).href,
  QUARK: new URL("@/assets/netdisk/quark1.png", import.meta.url).href,
  BAIDU: new URL("@/assets/netdisk/baidu.png", import.meta.url).href,
  XUNLEI: new URL("@/assets/netdisk/xunlei.png", import.meta.url).href,
  UC: new URL("@/assets/netdisk/uc.png", import.meta.url).href,
  OTHER: new URL("@/assets/netdisk/other.svg", import.meta.url).href,
  115: new URL("@/assets/netdisk/115.svg", import.meta.url).href,
  TIANYI: new URL("@/assets/netdisk/189.png", import.meta.url).href,
  MOBILE: new URL("@/assets/netdisk/caiyun.png", import.meta.url).href,
  PIKPAK: new URL("@/assets/netdisk/pikpak.png", import.meta.url).href,
  123: new URL("@/assets/netdisk/123.png", import.meta.url).href,
  MAGNET: new URL("@/assets/netdisk/other.svg", import.meta.url).href,
  ED2K: new URL("@/assets/netdisk/other.svg", import.meta.url).href,
};

// 网盘名称映射
// 获取网盘图标
const getDiskIcon = (service) => {
  return diskIcons[service] || diskIcons.OTHER;
};

// 获取链接名称
const getDiskName = (service) => {
  return getLinkServiceName(service);
};

const getResolvedService = (link) => {
  return detectLinkService(link?.link, link?.service);
};

const getServiceToneClass = (service) => {
  const resolvedService = getResolvedService({ service });

  const toneMap = {
    BAIDU: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    QUARK: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    ALIYUN: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    XUNLEI: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    UC: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    TIANYI: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    MOBILE: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    PIKPAK: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    MAGNET: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    ED2K: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
    OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  };

  return toneMap[resolvedService] || toneMap.OTHER;
};

const getItemLinkHintText = (links = []) => {
  const hasPassword = links.some((link) => Boolean(link?.pwd));
  const categories = new Set(
    links.map((link) => getLinkCategoryName(getResolvedService(link)))
  );

  if (categories.size === 1 && categories.has("下载协议")) {
    return hasPassword ? "点击图标唤起 • 点击提取码复制" : "点击图标唤起下载器";
  }

  return hasPassword ? "点击图标打开 • 点击提取码复制" : "点击图标打开链接";
};

const getFilterServiceKey = (link) => getResolvedService(link);

// 获取所有可用的网盘类型（增加数据验证）
const availableServices = computed(() => {
  if (!props.sources || !Array.isArray(props.sources)) {
    return [];
  }
  
  const services = new Set();
  try {
    props.sources.flat(Infinity).forEach((item) => {
      if (item && item.links && Array.isArray(item.links)) {
        item.links.forEach((link) => {
          if (link) {
            services.add(getFilterServiceKey(link));
          }
        });
      }
    });
  } catch (error) {
    console.error('解析可用服务时出错:', error);
    return [];
  }
  
  return Array.from(services).sort();
});

// 筛选后的数据（增加数据验证）
const filteredSources = computed(() => {
  if (!props.sources || !Array.isArray(props.sources)) {
    return [];
  }
  
  try {
    const flatSources = props.sources.flat(Infinity).filter(item => item && typeof item === 'object');
    
    if (selectedFilters.value.size === 0) {
      return flatSources;
    }

    return flatSources.filter((item) => {
      return item.links && Array.isArray(item.links) && 
             item.links.some((link) => link && selectedFilters.value.has(getFilterServiceKey(link)));
    });
  } catch (error) {
    console.error('筛选数据时出错:', error);
    return [];
  }
});

// 统计每种网盘的数量（增加数据验证）
const serviceStats = computed(() => {
  if (!props.sources || !Array.isArray(props.sources)) {
    return {};
  }
  
  const stats = {};
  try {
    props.sources.flat(Infinity).forEach((item) => {
      if (item && item.links && Array.isArray(item.links)) {
        item.links.forEach((link) => {
          if (link) {
            const service = getFilterServiceKey(link);
            stats[service] = (stats[service] || 0) + 1;
          }
        });
      }
    });
  } catch (error) {
    console.error('统计服务数量时出错:', error);
  }
  
  return stats;
});

// 切换筛选器
const toggleFilter = (service) => {
  if (selectedFilters.value.has(service)) {
    selectedFilters.value.delete(service);
  } else {
    selectedFilters.value.add(service);
  }
  // 触发响应式更新
  selectedFilters.value = new Set(selectedFilters.value);
};

// 清除所有筛选
const clearFilters = () => {
  selectedFilters.value.clear();
  selectedFilters.value = new Set();
};

// 切换筛选面板显示
const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};

// 初始化验证配置（页面加载时调用一次，带重试机制）
const initVerificationConfig = async (retryCount = 0) => {
  const MAX_RETRIES = 2;
  
  try {
    // 检查验证功能是否启用
    const configRes = await $fetch("/api/quark/setting", {
      timeout: 5000, // 5秒超时
    });
    
    const isEnabled = configRes?.data?.verificationEnabled || false;

    if (!isEnabled) {
      // 验证未启用，直接设置为已验证状态
      verificationConfig.value = {
        isEnabled: false,
        isVerified: true,
        isLoading: false,
      };
      return;
    }

    // 验证已启用，检查验证状态
    const { checkQuarkVerification } = await import(
      "@/middleware/quark-verification.ts"
    );
    const isVerified = await checkQuarkVerification();

    verificationConfig.value = {
      isEnabled: true,
      isVerified: isVerified,
      isLoading: false,
    };
  } catch (error) {
    console.error(`初始化验证配置失败 (尝试 ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
    
    // 如果还有重试次数，则重试
    if (retryCount < MAX_RETRIES) {
      setTimeout(() => {
        initVerificationConfig(retryCount + 1);
      }, 1000 * (retryCount + 1)); // 递增延迟重试
      return;
    }
    
    // 所有重试都失败，降级处理
    verificationConfig.value = {
      isEnabled: false,
      isVerified: true,
      isLoading: false,
    };
    
    // 只在所有重试都失败后显示警告
    if (import.meta.client) {
      console.warn('验证配置初始化失败，已启用降级模式');
    }
  }
};

// 组件挂载时初始化（仅在客户端执行）
onMounted(() => {
  if (import.meta.client) {
    initVerificationConfig();
  }
});

// 组件卸载时清理
onBeforeUnmount(() => {
  // 清理点击状态
  clickingLinks.value.clear();
});

// 处理图片加载错误
const handleImageError = (e) => {
  e.target.src = diskIcons.OTHER;
};

// 复制提取码
const copyPwd = async (pwd, event) => {
  // 阻止事件冒泡和默认行为，防止页面滚动
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  try {
    await navigator.clipboard.writeText(pwd);
    ElMessage({
      message: "提取码已复制到剪贴板",
      type: "success",
      duration: 2000,
    });
  } catch (err) {
    ElMessage({
      message: "复制失败，请手动复制",
      type: "error",
      duration: 2000,
    });
  }
};

// 复制链接
const copyLink = async (linkUrl, event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  try {
    await navigator.clipboard.writeText(linkUrl);
    ElMessage({
      message: "链接已复制到剪贴板",
      type: "success",
      duration: 2000,
    });
  } catch (err) {
    ElMessage({
      message: "复制失败，请手动复制",
      type: "error",
      duration: 2000,
    });
  }
};

// 防抖和节流状态
const clickingLinks = ref(new Set());

// 验证链接有效性
const isValidLink = (link) => {
  if (!link || typeof link !== 'string') return false;
  if (link.trim() === '') return false;
  
  // 检查是否是有效的URL格式
  try {
    // 对于网盘链接和磁力链接的特殊处理
    if (isDirectProtocolLink(link)) {
      return true;
    }
    new URL(link);
    return true;
  } catch {
    return false;
  }
};

// 处理链接点击（使用缓存的验证配置，避免重复调用 API）
const handleLinkClick = async (e, link) => {
  e.preventDefault();
  e.stopPropagation();

  // 防止重复点击
  const linkKey = `${link.service}-${link.link}`;
  if (clickingLinks.value.has(linkKey)) {
    ElMessage.warning('链接正在打开中，请稍候...');
    return;
  }

  try {
    clickingLinks.value.add(linkKey);

    // 验证链接有效性
    if (!isValidLink(link.link)) {
      ElMessage.error('链接格式无效，无法打开');
      return;
    }

    // 如果配置还在加载中，等待加载完成
    if (verificationConfig.value.isLoading) {
      ElMessage.info({
        message: '正在初始化配置，请稍候...',
        duration: 2000
      });
      return;
    }

    const resolvedService = getResolvedService(link);
    const shouldUseCloudVerification =
      verificationConfig.value.isEnabled &&
      !verificationConfig.value.isVerified &&
      isCloudDriveService(resolvedService);

    // 只有网盘类型才走网盘验证
    if (
      shouldUseCloudVerification
    ) {
      // 显示加载提示
      const loadingMessage = ElMessage({
        message: '正在处理链接...',
        type: 'info',
        duration: 0,
        icon: 'el-icon-loading'
      });

      try {
        const encryptRes = await $fetch("/api/quark/encrypt-link", {
          method: "POST",
          body: {
            link: link.link,
          },
          timeout: 10000 // 10秒超时
        });

        loadingMessage.close();

        if (encryptRes.code === 200) {
          const verificationUrl = `/quark-verification?token=${encodeURIComponent(
            encryptRes.data.token
          )}&from=netdisk`;
          return navigateTo(verificationUrl);
        } else {
          throw new Error(encryptRes.msg || "链接处理失败");
        }
      } catch (error) {
        loadingMessage.close();
        console.error("链接加密失败:", error);
        
        ElMessage({
          message: error.message || "链接处理失败，请稍后重试",
          type: "error",
          duration: 3000,
          showClose: true
        });
        return;
      }
    }

    // 不需要验证或已验证，直接访问链接

    // 磁力/电驴等协议链接：通过临时 <a> 元素触发系统协议处理器
    if (isDirectProtocolLink(link.link)) {
      const anchor = document.createElement('a');
      anchor.href = link.link;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      ElMessage({
        message: '正在唤起下载器...',
        type: 'success',
        duration: 2000
      });
      return;
    }

    // 普通链接：走跳转中间页
    let targetUrl = link.link;
    if (props.redirectStatus) {
      targetUrl = `/redirect?url=${encodeURIComponent(link.link)}&service=${encodeURIComponent(resolvedService)}`;
    }

    const opened = openUrlWithNoOpener(targetUrl);
    if (!opened) {
      ElMessage({
        message: '弹窗被浏览器阻止，请允许弹窗后重试',
        type: 'warning',
        duration: 4000,
        showClose: true,
      });

      navigator.clipboard.writeText(link.link).then(() => {
        ElMessage({
          message: '链接已复制到剪贴板，可手动粘贴访问',
          type: 'info',
          duration: 3000
        });
      }).catch(() => {
        console.log('目标链接:', link.link);
      });
      return;
    }

    ElMessage({
      message: '正在打开链接...',
      type: 'success',
      duration: 1500
    });

  } catch (error) {
    console.error('打开链接时发生错误:', error);
    ElMessage({
      message: '打开链接失败，请重试或联系管理员',
      type: 'error',
      duration: 3000,
      showClose: true
    });
  } finally {
    // 延迟移除防重复标记
    setTimeout(() => {
      clickingLinks.value.delete(linkKey);
    }, 1000);
  }
};
</script>

<template>
  <div class="space-y-3">
    <!-- 结果总数 + 筛选器 -->
    <div
      v-if="!skeletonLoading && sources.length > 0"
      class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 shadow-sm"
    >
      <!-- 结果总数 -->
      <div class="mb-3 text-sm text-gray-600 dark:text-gray-400">
        <template v-if="isSearching">
          <i class="fas fa-spinner fa-spin mr-1"></i>
          已找到 <span class="font-semibold text-gray-800 dark:text-gray-200">{{ sources.flat(Infinity).length }}</span> 个结果，搜索中...
        </template>
        <template v-else>
          找到 <span class="font-semibold text-gray-800 dark:text-gray-200">{{ filteredSources.length }}</span> 个结果
          <span v-if="selectedFilters.size > 0" class="text-gray-500">（共 {{ sources.flat(Infinity).length }} 个）</span>
        </template>
      </div>

      <!-- 筛选器头部 -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <i class="fas fa-filter text-gray-500"></i>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
            >资源类型筛选</span
          >
          <span class="text-xs text-gray-500"
            >({{ filteredSources.length }}/{{
              sources.flat(Infinity).length
            }})</span
          >
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="selectedFilters.size > 0"
            @click="clearFilters"
            class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            清除筛选
          </button>
          <button
            @click="toggleFilters"
            class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <i
              :class="showFilters ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
            ></i>
          </button>
        </div>
      </div>

      <!-- 筛选器选项 -->
      <div
        v-show="showFilters"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2"
      >
        <button
          v-for="service in availableServices"
          :key="service"
          @click="toggleFilter(service)"
          :class="[
            'flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200',
            selectedFilters.has(service)
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-600'
              : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600',
          ]"
        >
          <img
            :src="getDiskIcon(service)"
            :alt="service"
            class="w-4 h-4"
            @error="handleImageError"
          />
          <span class="truncate">{{ getDiskName(service) }}</span>
          <span class="text-xs opacity-75"
            >({{ serviceStats[service] || 0 }})</span
          >
        </button>
      </div>
    </div>

    <!-- 骨架屏 -->
    <div v-if="skeletonLoading" class="space-y-3">
      <div
        v-for="i in 3"
        :key="i"
        class="bg-white/60 dark:bg-gray-600/60 shadow p-4 rounded-lg animate-pulse"
      >
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div class="mt-3 flex gap-2">
          <div class="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>

    <!-- 资源列表 -->
    <div
      v-else
      v-for="(item, i) in filteredSources"
      :key="i"
      class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-5 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:border-gray-300/50 dark:hover:border-gray-600/50 transition-all duration-300 group"
    >
      <!-- 资源标题 -->
      <div class="mb-4">
        <h3
          class="text-sm md:text-base font-medium text-gray-800 dark:text-gray-100 leading-relaxed line-clamp-2"
          v-html="getHighlightedName(item)"
        ></h3>
      </div>

      <!-- 网盘链接区域 -->
      <div class="space-y-3">
        <!-- 链接数量统计 -->
        <div
          class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
        >
          <span>共 {{ item.links.length }} 个资源链接</span>
          <span>{{ getItemLinkHintText(item.links) }}</span>
        </div>

        <!-- 网盘链接网格 -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
          <div v-for="(link, index) in item.links" :key="index">
            <a
              href="#"
              class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600/70 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm transition-all duration-200 group/link"
              @click="(e) => handleLinkClick(e, link)"
            >
              <!-- 左侧：网盘图标和名称 -->
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <img
                  :src="getDiskIcon(getResolvedService(link))"
                  :alt="getResolvedService(link)"
                  class="w-6 h-6 shrink-0"
                  @error="handleImageError"
                />
                <span
                  :class="[
                    'text-xs font-medium px-2 py-1 rounded-md truncate',
                    getServiceToneClass(getResolvedService(link)),
                  ]"
                >
                  {{ getDiskName(getResolvedService(link)) }}
                </span>
              </div>

              <!-- 右侧：提取码、复制、访问 -->
              <div class="flex items-center gap-1.5">
                <span
                  v-if="link.pwd"
                  class="px-2 py-1 text-xs font-mono rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors duration-200"
                  @click="copyPwd(link.pwd, $event)"
                  :title="'点击复制提取码：' + link.pwd"
                >
                  {{ link.pwd }}
                </span>
                <button
                  type="button"
                  class="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200"
                  @click="copyLink(link.link, $event)"
                  title="复制链接"
                >
                  <i class="fas fa-copy text-xs"></i>
                </button>
                <i
                  class="fas fa-external-link-alt text-xs text-gray-400 group-hover/link:text-gray-600 dark:group-hover/link:text-gray-300 transition-colors"
                ></i>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选后无结果提示 -->
    <div
      v-if="
        !skeletonLoading && sources.length > 0 && filteredSources.length === 0
      "
      class="bg-white/60 dark:bg-gray-600/60 shadow p-8 rounded-lg text-center"
    >
      <div class="text-gray-500 dark:text-gray-400">
        <i class="fas fa-filter text-3xl mb-3"></i>
        <p class="text-lg font-medium mb-2">没有找到匹配的资源</p>
        <p class="text-sm">当前筛选条件下没有资源，请尝试调整筛选条件</p>
        <button
          @click="clearFilters"
          class="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
        >
          清除筛选条件
        </button>
      </div>
    </div>
  </div>
</template>

<style>
@import "tailwindcss" reference;
</style>

<style scoped>
:deep(mark) {
  background-color: #fef08a;
  color: inherit;
  padding: 0 1px;
  border-radius: 2px;
}

:global(.dark) :deep(mark) {
  background-color: #854d0e;
  color: #fef9c3;
}
</style>
