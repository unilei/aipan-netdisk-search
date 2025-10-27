<template>
  <div class="vod-detail-card">
    <!-- 网格布局展示多个影视卡片 -->
    <div v-if="vodData && vodData.length > 0" 
         class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
      <div 
        v-for="(vod, index) in vodData" 
        :key="`${vod.vod_id}-${index}`"
        class="vod-card group cursor-pointer"
        @click="selectVod(vod)"
      >
        <!-- 海报容器 -->
        <div class="relative aspect-[2/3] rounded-lg overflow-hidden 
                    bg-gray-100 dark:bg-gray-800/90 
                    shadow-sm dark:shadow-gray-900/30
                    ring-1 ring-black/5 dark:ring-white/10 
                    transition-all duration-200 
                    group-hover:ring-2 group-hover:ring-gray-300 dark:group-hover:ring-gray-600
                    group-hover:shadow-md
                    group-hover:scale-[1.02]">
          <!-- 海报图片 -->
          <img 
            v-if="vod.vod_pic"
            :src="vod.vod_pic" 
            :alt="vod.vod_name"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            @error="onImageError($event)"
          />
          <!-- 占位图 -->
          <div v-else class="w-full h-full flex items-center justify-center 
                            bg-linear-to-br from-gray-200 to-gray-300 
                            dark:from-gray-700 dark:to-gray-800">
            <i class="fas fa-film text-4xl text-gray-400 dark:text-gray-500"></i>
          </div>
          
          <!-- 悬停遮罩 -->
          <div class="absolute inset-0 
                      bg-linear-to-t from-black/70 via-black/20 to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200
                      flex flex-col justify-end p-2.5">
            <!-- 播放按钮 -->
            <div class="flex items-center justify-center mb-1.5">
              <div class="w-10 h-10 rounded-full 
                          bg-white dark:bg-gray-100 
                          shadow-md
                          flex items-center justify-center
                          transform scale-0 group-hover:scale-100 
                          transition-transform duration-200 delay-50">
                <i class="fas fa-play text-gray-900 text-sm ml-0.5"></i>
              </div>
            </div>
            
            <!-- 来源标签 -->
            <div v-if="vod.sourceName" class="flex items-center gap-1 text-xs text-white/95">
              <i class="fas fa-server text-xs"></i>
              <span>{{ vod.sourceName }}</span>
            </div>
          </div>
          
          <!-- 角标 -->
          <div class="absolute top-2 right-2 flex flex-col gap-1">
            <!-- 高清标签 -->
            <span v-if="vod.vod_remarks" 
                  class="px-2 py-0.5 text-xs font-medium rounded-md bg-orange-500 text-white shadow-lg">
              {{ vod.vod_remarks }}
            </span>
          </div>
        </div>
        
        <!-- 标题信息 -->
        <div class="mt-2 px-1">
          <h3 class="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 
                     group-hover:text-gray-900 dark:group-hover:text-white transition-colors"
              :title="vod.vod_name">
            {{ vod.vod_name }}
          </h3>
          
          <!-- 附加信息 -->
          <div v-if="vod.vod_year || vod.vod_area" class="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span v-if="vod.vod_year">{{ vod.vod_year }}</span>
            <span v-if="vod.vod_year && vod.vod_area">·</span>
            <span v-if="vod.vod_area" class="line-clamp-1">{{ vod.vod_area }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 自定义详情弹窗 -->
    <teleport to="body">
      <transition name="modal-fade">
        <div 
          v-if="showDetailDialog" 
          class="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-3
                 bg-black/50 dark:bg-black/70 
                 backdrop-blur-sm overflow-y-auto"
          @click="closeDetail"
        >
          <!-- 模态框容器 -->
          <transition name="modal-slide">
            <div 
              v-if="showDetailDialog"
              class="relative w-full max-w-3xl mx-auto
                     bg-white dark:bg-gray-800 
                     rounded-lg sm:rounded-xl
                     shadow-xl
                     overflow-hidden"
              @click.stop
            >
              <!-- 关闭按钮 -->
              <button 
                @click="closeDetail"
                class="absolute top-2 right-2 sm:top-3 sm:right-3 z-10
                       w-8 h-8 sm:w-9 sm:h-9
                       flex items-center justify-center
                       bg-white dark:bg-gray-700
                       border border-gray-200 dark:border-gray-600
                       rounded-md
                       text-gray-500 dark:text-gray-400
                       hover:bg-gray-50 dark:hover:bg-gray-600
                       hover:text-gray-700 dark:hover:text-gray-200
                       transition-colors duration-150"
                aria-label="关闭"
              >
                <i class="fas fa-times text-sm"></i>
              </button>

              <!-- 模态框内容 -->
              <div v-if="selectedVod" class="flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-1.5rem)]">
                <!-- 标题栏 -->
                <div class="px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12
                           bg-gray-50 dark:bg-gray-900
                           border-b border-gray-200 dark:border-gray-700">
                  <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 
                            leading-tight line-clamp-1">
                    {{ selectedVod.vod_name }}
                  </h2>
                </div>

                <!-- 主体内容 -->
                <div class="flex-1 overflow-y-auto p-3 sm:p-4">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <!-- 左侧海报 -->
                    <div class="md:col-span-1">
                      <div class="aspect-[2/3] rounded-lg overflow-hidden
                                 bg-gray-100 dark:bg-gray-700
                                 shadow-sm
                                 border border-gray-200 dark:border-gray-600">
                        <img 
                          v-if="selectedVod.vod_pic"
                          :src="selectedVod.vod_pic" 
                          :alt="selectedVod.vod_name"
                          class="w-full h-full object-cover"
                          @error="onImageError($event)"
                        />
                        <div v-else class="w-full h-full flex items-center justify-center
                                          bg-gray-100 dark:bg-gray-700">
                          <i class="fas fa-film text-3xl sm:text-4xl 
                                   text-gray-300 dark:text-gray-600"></i>
                        </div>
                      </div>
                    </div>
                    
                    <!-- 右侧详情 -->
                    <div class="md:col-span-2 space-y-2 sm:space-y-2.5">
                      <!-- 基本信息 -->
                      <div class="space-y-1.5 sm:space-y-2">
                        <!-- 状态 -->
                        <div v-if="selectedVod.vod_remarks" class="flex items-start gap-2">
                          <span class="flex-shrink-0 w-16 sm:w-20 text-xs sm:text-sm font-medium 
                                     text-gray-600 dark:text-gray-400">
                            状态：
                          </span>
                          <span class="px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-medium 
                                     text-white bg-orange-500 rounded-full shadow-sm">
                            {{ selectedVod.vod_remarks }}
                          </span>
                        </div>
                        
                        <!-- 年份 -->
                        <div v-if="selectedVod.vod_year" class="flex items-start gap-2">
                          <span class="flex-shrink-0 w-16 sm:w-20 text-xs sm:text-sm font-medium 
                                     text-gray-600 dark:text-gray-400">
                            年份：
                          </span>
                          <span class="flex-1 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                            {{ selectedVod.vod_year }}
                          </span>
                        </div>
                        
                        <!-- 地区 -->
                        <div v-if="selectedVod.vod_area" class="flex items-start gap-2">
                          <span class="flex-shrink-0 w-16 sm:w-20 text-xs sm:text-sm font-medium 
                                     text-gray-600 dark:text-gray-400">
                            地区：
                          </span>
                          <span class="flex-1 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                            {{ selectedVod.vod_area }}
                          </span>
                        </div>
                        
                        <!-- 导演 -->
                        <div v-if="selectedVod.vod_director" class="flex items-start gap-2">
                          <span class="flex-shrink-0 w-16 sm:w-20 text-xs sm:text-sm font-medium 
                                     text-gray-600 dark:text-gray-400">
                            导演：
                          </span>
                          <span class="flex-1 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                            {{ selectedVod.vod_director }}
                          </span>
                        </div>
                        
                        <!-- 演员 -->
                        <div v-if="selectedVod.vod_actor" class="flex items-start gap-2">
                          <span class="flex-shrink-0 w-16 sm:w-20 text-xs sm:text-sm font-medium 
                                     text-gray-600 dark:text-gray-400">
                            演员：
                          </span>
                          <span class="flex-1 text-xs sm:text-sm text-gray-800 dark:text-gray-200 
                                     line-clamp-3">
                            {{ selectedVod.vod_actor }}
                          </span>
                        </div>
                        
                        <!-- 简介 -->
                        <div v-if="selectedVod.vod_content" class="flex items-start gap-2">
                          <span class="flex-shrink-0 w-16 sm:w-20 text-xs sm:text-sm font-medium 
                                     text-gray-600 dark:text-gray-400">
                            简介：
                          </span>
                          <div class="flex-1">
                            <div 
                              :class="[
                                'text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed vod-content',
                                !contentExpanded ? 'line-clamp-3' : ''
                              ]"
                              v-html="selectedVod.vod_content">
                            </div>
                            <!-- 查看更多按钮 -->
                            <button
                              v-if="selectedVod.vod_content && selectedVod.vod_content.length > 100"
                              @click="contentExpanded = !contentExpanded"
                              class="mt-1 text-xs text-blue-600 dark:text-blue-400 
                                     hover:text-blue-700 dark:hover:text-blue-300
                                     transition-colors duration-150"
                            >
                              {{ contentExpanded ? '收起' : '查看更多' }}
                              <i :class="contentExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="ml-0.5 text-[10px]"></i>
                            </button>
                          </div>
                        </div>
                        
                        <!-- 来源 -->
                        <div v-if="selectedVod.sourceName" class="flex items-start gap-2">
                          <span class="flex-shrink-0 w-16 sm:w-20 text-xs sm:text-sm font-medium 
                                     text-gray-600 dark:text-gray-400">
                            来源：
                          </span>
                          <span class="text-xs sm:text-sm font-medium 
                                     text-blue-600 dark:text-blue-400">
                            {{ selectedVod.sourceName }}
                          </span>
                        </div>
                      </div>
                      
                      <!-- 播放按钮 -->
                      <div class="pt-1 sm:pt-2">
                        <button 
                          @click="playVod"
                          class="w-full py-2 sm:py-2.5 px-4
                                 flex items-center justify-center gap-2
                                 bg-gray-900 hover:bg-gray-800
                                 dark:bg-gray-700 dark:hover:bg-gray-600
                                 text-white text-sm font-medium
                                 rounded-md
                                 shadow-sm
                                 transition-colors duration-150"
                        >
                          <i class="fas fa-play text-xs sm:text-sm"></i>
                          <span>立即播放</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  vodData: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['play-vod'])

// 选中的影视
const selectedVod = ref(null)
const showDetailDialog = ref(false)
// 简介展开状态
const contentExpanded = ref(false)

// 选择影视
const selectVod = (vod) => {
  selectedVod.value = vod
  showDetailDialog.value = true
  contentExpanded.value = false // 重置展开状态
}

// 关闭详情
const closeDetail = () => {
  showDetailDialog.value = false
  contentExpanded.value = false // 重置展开状态
  setTimeout(() => {
    selectedVod.value = null
  }, 300)
}

// 播放影视
const playVod = () => {
  if (selectedVod.value) {
    // 查找相同名称的所有播放源
    const relatedVods = props.vodData.filter(item => 
      item.vod_name === selectedVod.value.vod_name || 
      (item.vod_id && selectedVod.value.vod_id && item.vod_id === selectedVod.value.vod_id)
    )
    
    // 如果找到多个播放源，使用它们；否则只使用当前的
    const vodDataArray = relatedVods.length > 0 ? relatedVods : [selectedVod.value]
    
    // 生成唯一的存储 key
    const storageKey = `vodData_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 将数据存储到 sessionStorage
    sessionStorage.setItem(storageKey, JSON.stringify(vodDataArray))
    
    // 构建播放页面 URL（只传递 key）
    const playUrl = `/play?key=${storageKey}`
    
    // 在新标签页打开
    window.open(playUrl, '_blank')
    closeDetail()
  }
}

// ESC键关闭
const handleEscape = (e) => {
  if (e.key === 'Escape' && showDetailDialog.value) {
    closeDetail()
  }
}

// 监听对话框状态，控制body滚动
watch(showDetailDialog, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', handleEscape)
  }
})

// 组件卸载时清理
onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', handleEscape)
})

// 图片加载失败处理
const onImageError = (event) => {
  // 使用占位图
  event.target.style.display = 'none'
  const parent = event.target.parentElement
  if (parent && !parent.querySelector('.placeholder-icon')) {
    const placeholder = document.createElement('div')
    placeholder.className = 'placeholder-icon w-full h-full flex items-center justify-center bg-linear-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800'
    placeholder.innerHTML = '<i class="fas fa-film text-4xl text-gray-400 dark:text-gray-600"></i>'
    parent.appendChild(placeholder)
  }
}
</script>

<style scoped>
/* 文本截断 */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 卡片悬停效果 */
.vod-card {
  will-change: transform;
}

/* 模态框动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.7, 0, 0.84, 0);
}

.modal-slide-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.modal-slide-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

/* 富文本内容样式 */
.vod-content {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.vod-content :deep(p) {
  margin-bottom: 0.5rem;
}

.vod-content :deep(p:last-child) {
  margin-bottom: 0;
}

.vod-content :deep(br) {
  display: block;
  content: "";
  margin-top: 0.25rem;
}

.vod-content :deep(strong),
.vod-content :deep(b) {
  font-weight: 600;
  color: inherit;
}

.vod-content :deep(em),
.vod-content :deep(i) {
  font-style: italic;
}

.vod-content :deep(a) {
  color: rgb(147, 51, 234);
  text-decoration: underline;
  transition: color 0.2s;
}

.vod-content :deep(a:hover) {
  color: rgb(168, 85, 247);
}

:deep(.dark) .vod-content :deep(a) {
  color: rgb(168, 85, 247);
}

:deep(.dark) .vod-content :deep(a:hover) {
  color: rgb(192, 132, 252);
}
</style>
