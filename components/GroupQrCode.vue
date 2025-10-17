<template>
  <div v-if="config.enabled && config.qrCodeUrl" class="group-qr-container">
    <!-- 搜索结果紧凑样式 -->
    <div v-if="variant === 'search-result'" 
         class="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-200/60 dark:border-blue-700/60 rounded-lg p-3 transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600">
      <div class="flex items-center gap-3">
        <!-- 二维码图片 -->
        <div class="flex-shrink-0">
          <div class="relative">
            <img 
              :src="config.qrCodeUrl" 
              :alt="config.title"
              class="w-14 h-14 rounded-md shadow-sm transition-transform duration-200 hover:scale-105"
              @error="onImageError"
              @load="onImageLoad"
            />
            <div v-if="imageLoading" class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md">
              <i class="fas fa-spinner fa-spin text-gray-400 text-xs"></i>
            </div>
          </div>
        </div>
        
        <!-- 文字内容 -->
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 truncate">
            {{ config.title }}
          </h3>
          <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {{ config.description }}
          </p>
        </div>
        
        <!-- 小图标 -->
        <div class="flex-shrink-0">
          <div class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <i class="fas fa-qrcode text-blue-600 dark:text-blue-400 text-xs"></i>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 头部右上角样式 -->
    <div v-else-if="variant === 'header'" 
         class="group-qr-header relative">
      <!-- 触发按钮 -->
      <button 
        @click="showPopover = !showPopover"
        class="p-2 md:p-2.5 rounded-lg transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-300 dark:hover:bg-gray-700/80 relative"
        :class="{ 'bg-blue-50 text-blue-600 dark:bg-gray-700/80 dark:text-blue-300': showPopover }"
      >
        <i class="fas fa-qrcode text-base md:text-lg"></i>
      </button>
      
      <!-- 弹出层 -->
      <transition name="popover">
        <div v-if="showPopover" 
             class="absolute right-0 top-full mt-2 w-64 
                    bg-white dark:bg-gray-800 
                    rounded-xl 
                    shadow-lg dark:shadow-gray-900/50
                    border border-gray-200 dark:border-gray-700/80
                    backdrop-blur-sm
                    p-4 z-50"
             @click.stop>
          <!-- 关闭按钮 -->
          <button 
            @click="showPopover = false"
            class="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <i class="fas fa-times text-xs"></i>
          </button>
          
          <div class="text-center">
            <!-- 二维码图片 -->
            <div class="mb-3">
              <img 
                :src="config.qrCodeUrl" 
                :alt="config.title"
                class="w-32 h-32 mx-auto rounded-lg shadow-sm"
                @error="onImageError"
                @load="onImageLoad"
              />
              <div v-if="imageLoading" class="w-32 h-32 mx-auto flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                <i class="fas fa-spinner fa-spin text-gray-400"></i>
              </div>
            </div>
            
            <!-- 标题和描述 -->
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              {{ config.title }}
            </h4>
            <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {{ config.description }}
            </p>
          </div>
        </div>
      </transition>
      
      <!-- 点击外部关闭弹出层 -->
      <div v-if="showPopover" 
           class="fixed inset-0 z-40" 
           @click="showPopover = false">
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'search-result', // 'search-result' | 'header'
    validator: (value) => ['search-result', 'header'].includes(value)
  }
})

// 响应式数据
const showPopover = ref(false)
const imageLoading = ref(true)
const imageError = ref(false)

// 配置数据
const config = reactive({
  enabled: true,
  title: '为防止网站和谐，请扫码获取最新网址',
  description: '长按识别二维码或扫码进群',
  qrCodeUrl: '',
  showInHeader: true,
  showInSearchResults: true
})

// 图片加载处理
const onImageLoad = () => {
  imageLoading.value = false
  imageError.value = false
}

const onImageError = () => {
  imageLoading.value = false
  imageError.value = true
  console.warn('群二维码图片加载失败')
}

// 获取配置数据
const loadConfig = async () => {
  try {
    const response = await $fetch('/api/group-qr/config')
    if (response.code === 200) {
      Object.assign(config, response.data)
    }
  } catch (error) {
    console.error('获取群二维码配置失败:', error)
  }
}

// 组件挂载时加载配置
onMounted(() => {
  loadConfig()
})

// 暴露重新加载配置的方法
defineExpose({
  loadConfig
})
</script>

<style scoped>
/* 弹出层动画 */
.popover-enter-active,
.popover-leave-active {
  transition: all 0.3s ease;
  transform-origin: top right;
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-10px);
}

.popover-enter-to,
.popover-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* 文本截断 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .group-qr-header .absolute {
    right: -10px;
    width: 280px;
  }
}

/* 确保弹出层在最顶层 */
.group-qr-header {
  position: relative;
  z-index: 50;
}

/* 小红点动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}
</style>