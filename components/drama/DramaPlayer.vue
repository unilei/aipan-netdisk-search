<script setup>
const props = defineProps({
  drama: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

// 播放状态
const currentEpisode = ref(0)
const isLoading = ref(false)
const playerUrl = ref('')
const showEpisodeList = ref(true)
const touchStartY = ref(0)
const touchEndY = ref(0)

// 生成播放链接
const generatePlayerUrl = (episodeUrl) => {
  // 这里可以配置不同的播放器接口
  const playerInterfaces = [
    'https://jx.xmflv.com/?url=',
    'https://jx.jsonplayer.com/player/?url=',
    'https://jx.m3u8.tv/jiexi/?url='
  ]

  // 默认使用第一个播放器
  return playerInterfaces[0] + encodeURIComponent(episodeUrl)
}

// 切换剧集
const selectEpisode = (index) => {
  if (index === currentEpisode.value || index < 0 || index >= props.drama.episodes.length) return

  currentEpisode.value = index
  isLoading.value = true

  const episode = props.drama.episodes[index]
  if (episode) {
    playerUrl.value = generatePlayerUrl(episode.url)
  }

  // 模拟加载时间
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
}

// 上一集
const previousEpisode = () => {
  if (currentEpisode.value > 0) {
    selectEpisode(currentEpisode.value - 1)
  }
}

// 下一集
const nextEpisode = () => {
  if (currentEpisode.value < props.drama.episodes.length - 1) {
    selectEpisode(currentEpisode.value + 1)
  }
}

// 关闭播放器
const closePlayer = () => {
  emit('close')
}

// 切换剧集列表显示
const toggleEpisodeList = () => {
  showEpisodeList.value = !showEpisodeList.value
}

// 触摸事件处理
const handleTouchStart = (e) => {
  touchStartY.value = e.touches[0].clientY
}

const handleTouchEnd = (e) => {
  touchEndY.value = e.changedTouches[0].clientY
  handleSwipe()
}

const handleSwipe = () => {
  const swipeThreshold = 50
  const diff = touchStartY.value - touchEndY.value

  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      // 向上滑动 - 下一集
      nextEpisode()
    } else {
      // 向下滑动 - 上一集
      previousEpisode()
    }
  }
}

// 键盘事件处理
const handleKeydown = (e) => {
  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault()
      previousEpisode()
      break
    case 'ArrowDown':
      e.preventDefault()
      nextEpisode()
      break
    case 'Escape':
      closePlayer()
      break
  }
}

// 初始化第一集
onMounted(() => {
  if (props.drama.episodes && props.drama.episodes.length > 0) {
    selectEpisode(0)
  }

  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="drama-player fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-50 flex flex-col"
    @touchstart="handleTouchStart" @touchend="handleTouchEnd">

    <!-- 顶部导航栏 -->
    <div
      class="bg-white/10 dark:bg-slate-700/30 backdrop-blur-xl border-b border-stone-200/20 dark:border-slate-600/30 px-6 py-4 sticky top-0 z-40">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <div
            class="w-10 h-10 bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-700 dark:to-orange-800 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-amber-500/20">
            <i class="fas fa-play text-amber-800 dark:text-amber-100 text-lg"></i>
          </div>
          <div>
            <h2
              class="text-lg font-bold text-white mb-1 bg-gradient-to-r from-white to-stone-200 bg-clip-text text-transparent">
              {{ drama.name }}
            </h2>
            <p class="text-stone-300 text-sm">
              第{{ currentEpisode + 1 }}集 / 共{{ drama.episodes.length }}集
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-3">
          <!-- 剧集列表切换按钮 -->
          <button @click="toggleEpisodeList"
            class="lg:hidden px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 backdrop-blur-sm">
            <i class="fas fa-list mr-2"></i>
            选集
          </button>

          <!-- 关闭按钮 -->
          <button @click="closePlayer"
            class="w-10 h-10 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="flex-1 flex">
      <!-- 视频播放器区域 -->
      <div class="flex-1 relative bg-black">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-2 border-stone-300 border-t-amber-500 mx-auto mb-4">
            </div>
            <p class="text-white text-lg font-medium">正在加载播放器...</p>
            <p class="text-stone-400 text-sm mt-2">请稍候</p>
          </div>
        </div>

        <!-- 视频播放器 -->
        <iframe v-if="playerUrl && !isLoading" :src="playerUrl" class="w-full h-full" frameborder="0" allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>

        <!-- 无播放源状态 -->
        <div v-if="!playerUrl && !isLoading" class="absolute inset-0 flex items-center justify-center bg-black/80">
          <div class="text-center">
            <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-exclamation-triangle text-red-400 text-2xl"></i>
            </div>
            <h3 class="text-white text-xl font-semibold mb-2">暂无播放源</h3>
            <p class="text-stone-400">该剧集暂时无法播放</p>
          </div>
        </div>

        <!-- 播放控制悬浮按钮 -->
        <div class="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
          <!-- 上一集 -->
          <button @click="previousEpisode" :disabled="currentEpisode <= 0"
            class="w-12 h-12 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:opacity-50 text-white rounded-full transition-all duration-300 backdrop-blur-sm flex items-center justify-center"
            :class="{ 'cursor-not-allowed': currentEpisode <= 0 }">
            <i class="fas fa-step-backward"></i>
          </button>

          <!-- 播放/暂停 (预留) -->
          <div
            class="w-14 h-14 bg-amber-500/80 hover:bg-amber-500/90 text-white rounded-full transition-all duration-300 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-amber-500/30">
            <i class="fas fa-play text-lg"></i>
          </div>

          <!-- 下一集 -->
          <button @click="nextEpisode" :disabled="currentEpisode >= drama.episodes.length - 1"
            class="w-12 h-12 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:opacity-50 text-white rounded-full transition-all duration-300 backdrop-blur-sm flex items-center justify-center"
            :class="{ 'cursor-not-allowed': currentEpisode >= drama.episodes.length - 1 }">
            <i class="fas fa-step-forward"></i>
          </button>
        </div>

        <!-- 滑动提示 -->
        <div class="absolute top-4 right-4 bg-black/50 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm">
          <i class="fas fa-hand-paper mr-2"></i>
          上下滑动切换剧集
        </div>
      </div>

      <!-- 剧集列表侧边栏 -->
      <aside :class="[
        'w-80 bg-white/10 dark:bg-slate-700/30 backdrop-blur-xl border-l border-stone-200/20 dark:border-slate-600/30 overflow-y-auto transition-all duration-300',
        showEpisodeList ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      ]">
        <div class="p-6">
          <!-- 剧集列表标题 -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-white flex items-center">
                <div
                  class="w-6 h-6 bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-700 dark:to-orange-800 rounded-lg flex items-center justify-center mr-3">
                  <i class="fas fa-list text-amber-800 dark:text-amber-100 text-xs"></i>
                </div>
                选集播放
              </h3>
              <button @click="toggleEpisodeList" class="lg:hidden text-stone-300 hover:text-white transition-colors">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 rounded-full w-16"></div>
          </div>

          <!-- 剧集网格 -->
          <div class="grid grid-cols-4 gap-3">
            <button v-for="(episode, index) in drama.episodes" :key="index" @click="selectEpisode(index)" :class="[
              'episode-btn px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden',
              currentEpisode === index
                ? 'bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-700 dark:to-orange-700 text-amber-900 dark:text-amber-100 shadow-lg shadow-amber-500/20'
                : 'bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white backdrop-blur-sm'
            ]">
              <!-- 背景装饰 -->
              <div v-if="currentEpisode === index"
                class="absolute inset-0 bg-gradient-to-r from-amber-300/20 to-orange-300/20 dark:from-amber-600/20 dark:to-orange-600/20">
              </div>

              <span class="relative z-10">{{ episode.number }}</span>
            </button>
          </div>

          <!-- 快速导航 -->
          <div class="mt-6 pt-6 border-t border-stone-200/20 dark:border-slate-600/30">
            <h4 class="text-sm font-semibold text-stone-300 mb-3">快速导航</h4>
            <div class="flex items-center justify-between">
              <button @click="selectEpisode(0)"
                class="px-3 py-2 bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white rounded-lg text-sm transition-all duration-300">
                <i class="fas fa-fast-backward mr-1"></i>
                第一集
              </button>
              <button @click="selectEpisode(drama.episodes.length - 1)"
                class="px-3 py-2 bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white rounded-lg text-sm transition-all duration-300">
                最新集
                <i class="fas fa-fast-forward ml-1"></i>
              </button>
            </div>
          </div>

          <!-- 播放信息 -->
          <div class="mt-6 pt-6 border-t border-stone-200/20 dark:border-slate-600/30">
            <div class="bg-white/5 rounded-xl p-4 backdrop-blur-sm">
              <h4 class="text-sm font-semibold text-white mb-2">播放信息</h4>
              <div class="space-y-2 text-xs text-stone-300">
                <div class="flex justify-between">
                  <span>当前集数:</span>
                  <span class="text-amber-400">第{{ currentEpisode + 1 }}集</span>
                </div>
                <div class="flex justify-between">
                  <span>总集数:</span>
                  <span>{{ drama.episodes.length }}集</span>
                </div>
                <div class="flex justify-between">
                  <span>播放进度:</span>
                  <span>{{ Math.round((currentEpisode + 1) / drama.episodes.length * 100) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- 移动端剧集列表遮罩 -->
    <div v-if="showEpisodeList" @click="toggleEpisodeList" class="lg:hidden fixed inset-0 bg-black/50 z-30"></div>
  </div>
</template>
<style scoped>
.drama-player {
  backdrop-filter: blur(20px);
}

.episode-btn {
  transition: all 0.3s ease;
  will-change: transform;
}

.episode-btn:hover {
  transform: translateY(-2px) scale(1.02);
}

.episode-btn:active {
  transform: translateY(0) scale(0.98);
}

/* 滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 响应式调整 */
@media (max-width: 1024px) {
  aside {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    z-index: 40;
  }
}

@media (max-width: 640px) {
  .episode-btn:hover {
    transform: none;
  }

  .episode-btn {
    -webkit-tap-highlight-color: transparent;
  }
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {

  .episode-btn,
  .transition-all {
    transition: none;
  }

  .animate-spin {
    animation: none;
  }
}
</style>
