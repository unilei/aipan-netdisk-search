<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  sources: {
    type: Array,
    default: () => []
  },
  skeletonLoading: {
    type: Boolean,
    default: false
  }
})

// 网盘图标映射
const diskIcons = {
  ALIYUN: new URL('@/assets/netdisk/aliyun.png', import.meta.url).href,
  QUARK: new URL('@/assets/netdisk/quark.png', import.meta.url).href,
  BAIDU: new URL('@/assets/netdisk/baidu.png', import.meta.url).href,
  XUNLEI: new URL('@/assets/netdisk/xunlei.png', import.meta.url).href,
  OTHER: new URL('@/assets/netdisk/xunlei.png', import.meta.url).href,
}

// 获取网盘图标
const getDiskIcon = (service) => {
  return diskIcons[service] || diskIcons.OTHER
}

// 处理图片加载错误
const handleImageError = (e) => {
  e.target.src = diskIcons.OTHER
}

// 复制提取码
const copyPwd = async (pwd) => {
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
</script>

<template>
  <div class="space-y-3">
    <!-- 骨架屏 -->
    <div v-if="skeletonLoading" class="space-y-3">
      <div v-for="i in 3" :key="i" 
           class="bg-white/60 dark:bg-gray-600/60 shadow p-4 rounded-lg animate-pulse">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div class="mt-3 flex gap-2">
          <div class="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>

    <!-- 资源列表 -->
    <div v-else v-for="(item, i) in sources.flat(Infinity)" :key="i"
         class="bg-white/60 dark:bg-gray-600/60 shadow p-4 rounded-lg
                hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg 
                transition-all duration-300">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <!-- 资源名称 -->
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-700 dark:text-gray-100 break-all" v-html="item.name"></p>
        </div>
        
        <!-- 网盘链接 -->
        <div class="flex flex-wrap gap-2">
          <div v-for="(link, index) in item.links" :key="index">
            <nuxt-link :to="link.link" 
                      target="_blank"
                      class="inline-flex items-center px-3 py-2 rounded-lg
                             bg-gray-100 dark:bg-gray-700/50 
                             hover:bg-gray-200 dark:hover:bg-gray-600
                             transition-colors duration-200">
              <!-- 网盘图标 -->
              <img :src="getDiskIcon(link.service)"
                   :alt="link.service"
                   class="w-5 h-5"
                   @error="handleImageError">
              
              <!-- 提取码 -->
              <span v-if="link.pwd" 
                    class="ml-2 px-2 py-0.5 text-xs rounded-full
                           bg-blue-100 dark:bg-blue-900/30 
                           text-blue-600 dark:text-blue-300
                           cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/30"
                    @click.prevent="copyPwd(link.pwd)"
                    :title="'点击复制提取码：' + link.pwd">
                {{ link.pwd }}
              </span>
            </nuxt-link>
          </div>
        </div>
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
</style>