<script setup>
import { ElMessage } from 'element-plus'

import { ref, computed, watch } from 'vue'

const props = defineProps({
  sources: {
    type: Array,
    default: () => []
  },
  skeletonLoading: {
    type: Boolean,
    default: false
  },
  redirectStatus: {
    type: Boolean,
    default: true
  }
})



// 筛选相关状态
const selectedFilters = ref(new Set())
const showFilters = ref(false)

// 网盘图标映射
const diskIcons = {
  ALIYUN: new URL('@/assets/netdisk/aliyun1.png', import.meta.url).href,
  QUARK: new URL('@/assets/netdisk/quark1.png', import.meta.url).href,
  BAIDU: new URL('@/assets/netdisk/baidu.png', import.meta.url).href,
  XUNLEI: new URL('@/assets/netdisk/xunlei.png', import.meta.url).href,
  UC: new URL('@/assets/netdisk/uc.png', import.meta.url).href,
  OTHER: new URL('@/assets/netdisk/other.svg', import.meta.url).href,
  115: new URL('@/assets/netdisk/115.svg', import.meta.url).href,
  TIANYI: new URL('@/assets/netdisk/189.png', import.meta.url).href,
  MOBILE: new URL('@/assets/netdisk/caiyun.png', import.meta.url).href,
  PIKPAK: new URL('@/assets/netdisk/pikpak.png', import.meta.url).href,
  123: new URL('@/assets/netdisk/123.png', import.meta.url).href,
}

// 网盘名称映射
const diskNames = {
  ALIYUN: '阿里云盘',
  QUARK: '夸克网盘',
  BAIDU: '百度网盘',
  XUNLEI: '迅雷网盘',
  UC: 'UC网盘',
  115: '115网盘',
  TIANYI: '天翼云盘',
  MOBILE: '移动云盘',
  PIKPAK: 'PikPak',
  123: '123网盘',
  OTHER: '其他'
}

// 获取网盘图标
const getDiskIcon = (service) => {
  return diskIcons[service] || diskIcons.OTHER
}

// 获取网盘名称
const getDiskName = (service) => {
  return diskNames[service] || '其他'
}

// 获取所有可用的网盘类型
const availableServices = computed(() => {
  const services = new Set()
  props.sources.flat(Infinity).forEach(item => {
    item.links?.forEach(link => {
      if (link.service) {
        services.add(link.service)
      }
    })
  })
  return Array.from(services).sort()
})

// 筛选后的数据
const filteredSources = computed(() => {
  if (selectedFilters.value.size === 0) {
    return props.sources.flat(Infinity)
  }

  return props.sources.flat(Infinity).filter(item => {
    return item.links?.some(link => selectedFilters.value.has(link.service))
  })
})

// 统计每种网盘的数量
const serviceStats = computed(() => {
  const stats = {}
  props.sources.flat(Infinity).forEach(item => {
    item.links?.forEach(link => {
      if (link.service) {
        stats[link.service] = (stats[link.service] || 0) + 1
      }
    })
  })
  return stats
})

// 切换筛选器
const toggleFilter = (service) => {
  if (selectedFilters.value.has(service)) {
    selectedFilters.value.delete(service)
  } else {
    selectedFilters.value.add(service)
  }
  // 触发响应式更新
  selectedFilters.value = new Set(selectedFilters.value)
}

// 清除所有筛选
const clearFilters = () => {
  selectedFilters.value.clear()
  selectedFilters.value = new Set()
}

// 切换筛选面板显示
const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

// 处理图片加载错误
const handleImageError = (e) => {
  e.target.src = diskIcons.OTHER
}

// 复制提取码
const copyPwd = async (pwd, event) => {
  // 阻止事件冒泡和默认行为，防止页面滚动
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  
  try {
    await navigator.clipboard.writeText(pwd)
    ElMessage({
      message: '提取码已复制到剪贴板',
      type: 'success',
      duration: 2000
    })
  } catch (err) {
    ElMessage({
      message: '复制失败，请手动复制',
      type: 'error',
      duration: 2000
    })
  }
}

// 处理链接点击
const handleLinkClick = async (e, link) => {
  e.preventDefault();
  
  // 首先检查验证功能是否启用
  try {
    const configRes = await $fetch('/api/quark/setting');
    const isVerificationEnabled = configRes?.data?.verificationEnabled || false;
    
    // 如果验证未启用，直接访问链接
    if (!isVerificationEnabled) {
      if (props.redirectStatus) {
        const redirectUrl = `/redirect?url=${encodeURIComponent(link.link)}`;
        window.open(redirectUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.open(link.link, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    
    // 验证功能已启用，检查验证状态
    const { checkQuarkVerification } = await import('@/middleware/quark-verification.ts');
    
    const isVerified = await checkQuarkVerification();
    if (!isVerified) {
      // 需要验证，将链接加密后跳转到验证页面
      try {
        // 使用服务器端加密API
        const encryptRes = await $fetch('/api/quark/encrypt-link', {
          method: 'POST',
          body: {
            link: link.link
          }
        });
        
        if (encryptRes.code === 200) {
          const verificationUrl = `/quark-verification?token=${encodeURIComponent(encryptRes.data.token)}&from=netdisk`;
          return navigateTo(verificationUrl);
        } else {
          throw new Error(encryptRes.msg || '加密失败');
        }
      } catch (error) {
        console.error('链接加密失败:', error);
        ElMessage.error('链接处理失败，请稍后重试');
        return;
      }
    }
    
    // 验证通过，正常访问链接
    if (props.redirectStatus) {
      // 在新窗口中打开 redirect 页面
      const redirectUrl = `/redirect?url=${encodeURIComponent(link.link)}`;
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    } else {
      // 直接在新窗口中打开链接
      window.open(link.link, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.error('检查验证配置失败:', error);
    // 如果检查配置失败，默认直接访问链接（降级处理）
    if (props.redirectStatus) {
      const redirectUrl = `/redirect?url=${encodeURIComponent(link.link)}`;
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.open(link.link, '_blank', 'noopener,noreferrer');
    }
  }
};
</script>

<template>
  <div class="space-y-3">
    <!-- 筛选器 -->
    <div v-if="!skeletonLoading && sources.length > 0"
      class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 shadow-sm">
      <!-- 筛选器头部 -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <i class="fas fa-filter text-gray-500"></i>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">网盘筛选</span>
          <span class="text-xs text-gray-500">({{ filteredSources.length }}/{{ sources.flat(Infinity).length }})</span>
        </div>
        <div class="flex items-center gap-2">
          <button v-if="selectedFilters.size > 0" @click="clearFilters"
            class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
            清除筛选
          </button>
          <button @click="toggleFilters"
            class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <i :class="showFilters ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </button>
        </div>
      </div>

      <!-- 筛选器选项 -->
      <div v-show="showFilters" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        <button v-for="service in availableServices" :key="service" @click="toggleFilter(service)" :class="[
          'flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200',
          selectedFilters.has(service)
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-600'
            : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
        ]">
          <img :src="getDiskIcon(service)" :alt="service" class="w-4 h-4" @error="handleImageError">
          <span class="truncate">{{ getDiskName(service) }}</span>
          <span class="text-xs opacity-75">({{ serviceStats[service] || 0 }})</span>
        </button>
      </div>
    </div>

    <!-- 骨架屏 -->
    <div v-if="skeletonLoading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="bg-white/60 dark:bg-gray-600/60 shadow p-4 rounded-lg animate-pulse">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div class="mt-3 flex gap-2">
          <div class="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>

    <!-- 资源列表 -->
    <div v-else v-for="(item, i) in filteredSources" :key="i" class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-5
                hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:border-gray-300/50 dark:hover:border-gray-600/50
                transition-all duration-300 group">

      <!-- 资源标题 -->
      <div class="mb-4">
        <h3 class="text-sm md:text-base font-medium text-gray-800 dark:text-gray-100 leading-relaxed line-clamp-2"
          v-html="item.name"></h3>
      </div>

      <!-- 网盘链接区域 -->
      <div class="space-y-3">
        <!-- 链接数量统计 -->
        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>共 {{ item.links.length }} 个网盘链接</span>
          <span>点击图标访问 • 点击提取码复制</span>
        </div>

        <!-- 网盘链接网格 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <div v-for="(link, index) in item.links" :key="index">
            <a href="#" class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600
                      bg-gray-50 dark:bg-gray-700/50
                      hover:bg-gray-100 dark:hover:bg-gray-600/70 hover:border-gray-300 dark:hover:border-gray-500
                      hover:shadow-sm transition-all duration-200 group/link" @click="(e) => handleLinkClick(e, link)">

              <!-- 左侧：网盘图标和名称 -->
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <img :src="getDiskIcon(link.service)" :alt="link.service" class="w-6 h-6 flex-shrink-0"
                  @error="handleImageError">
                <span class="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">
                  {{ getDiskName(link.service) }}
                </span>
              </div>

              <!-- 右侧：提取码或访问按钮 -->
              <div class="flex items-center gap-2">
                <span v-if="link.pwd" class="px-2 py-1 text-xs font-mono rounded-md
                             bg-blue-100 dark:bg-blue-900/40
                             text-blue-700 dark:text-blue-300
                             border border-blue-200 dark:border-blue-700
                             cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/50
                             transition-colors duration-200" @click="copyPwd(link.pwd, $event)"
                  :title="'点击复制提取码：' + link.pwd">
                  {{ link.pwd }}
                </span>
                <i
                  class="fas fa-external-link-alt text-xs text-gray-400 group-hover/link:text-gray-600 dark:group-hover/link:text-gray-300 transition-colors"></i>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选后无结果提示 -->
    <div v-if="!skeletonLoading && sources.length > 0 && filteredSources.length === 0"
      class="bg-white/60 dark:bg-gray-600/60 shadow p-8 rounded-lg text-center">
      <div class="text-gray-500 dark:text-gray-400">
        <i class="fas fa-filter text-3xl mb-3"></i>
        <p class="text-lg font-medium mb-2">没有找到匹配的资源</p>
        <p class="text-sm">当前筛选条件下没有资源，请尝试调整筛选条件</p>
        <button @click="clearFilters"
          class="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors">
          清除筛选条件
        </button>
      </div>
    </div>
  </div>
</template>

<style>
em {
  @apply text-blue-600 dark:text-blue-400 mx-0.5 not-italic font-medium;
}

.dark em {
  @apply text-blue-400;
}

/* 添加链接hover效果 */
.disk-link {
  @apply relative overflow-hidden;
}

.disk-link::after {
  content: '';
  @apply absolute inset-0 bg-current opacity-0 transition-opacity duration-200;
}

.disk-link:hover::after {
  @apply opacity-10;
}

/* 优化骨架屏动画 */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }

  100% {
    background-position: 200% 0;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* 文本截断样式 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 网盘链接卡片样式 */
.disk-card {
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.disk-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* 提取码样式优化 */
.extract-code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  letter-spacing: 0.5px;
}

/* 响应式网格优化 */
@media (max-width: 640px) {
  .grid-responsive {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1025px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .grid-responsive {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>