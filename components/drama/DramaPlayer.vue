<script setup>
import { useUserStore } from '~/stores/user'

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
const showEpisodeList = ref(true) // 默认显示播放列表
const touchStartY = ref(0)
const touchEndY = ref(0)

// 播放器增强功能
const currentPlayerIndex = ref(0)
const playbackSpeed = ref(1)
const volume = ref(1)
const autoPlayNext = ref(true)
const autoPlayCountdown = ref(0)
const isAutoPlaying = ref(false)
const isFavorited = ref(false)
const showControls = ref(true)
const controlsTimer = ref(null)
const showSettings = ref(false)
const showAdBlockTip = ref(false)

// 防抖计时器
let episodeChangeTimer = null

// 播放历史
const watchHistory = ref(new Map())

// 用户状态
const userStore = useUserStore()

// 播放器配置
const playerInterfaces = [
  { name: '播放器1', url: 'https://jx.xmflv.com/?url=', icon: 'fas fa-play-circle', adLevel: 'low' },
  { name: '播放器2', url: 'https://jx.jsonplayer.com/player/?url=', icon: 'fas fa-video', adLevel: 'medium' },
  { name: '播放器3', url: 'https://jx.m3u8.tv/jiexi/?url=', icon: 'fas fa-film', adLevel: 'low' },
  { name: '播放器4', url: 'https://jx.618g.com/?url=', icon: 'fas fa-tv', adLevel: 'high' },
  { name: '播放器5', url: 'https://jx.aidouer.net/?url=', icon: 'fas fa-play', adLevel: 'low' },
  { name: '播放器6', url: 'https://jx.bozrc.com:4433/player/?url=', icon: 'fas fa-video-slash', adLevel: 'medium' }
]

const playbackSpeeds = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1.0x', value: 1 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
  { label: '2.0x', value: 2 }
]

// 生成播放链接
const generatePlayerUrl = (episodeUrl, playerIndex = currentPlayerIndex.value) => {
  const player = playerInterfaces[playerIndex]
  if (!player) return ''

  return player.url + encodeURIComponent(episodeUrl)
}

// 切换播放器
const switchPlayer = (index) => {
  if (index === currentPlayerIndex.value) return

  // 先清空播放器URL
  playerUrl.value = ''
  isLoading.value = true
  currentPlayerIndex.value = index

  // 使用 nextTick 确保 DOM 更新
  nextTick(() => {
    const episode = props.drama.episodes[currentEpisode.value]
    if (episode) {
      // 延迟设置新的播放器URL
      setTimeout(() => {
        playerUrl.value = generatePlayerUrl(episode.url, index)

        setTimeout(() => {
          isLoading.value = false
        }, 800)
      }, 200)
    }
  })
}

// 保存观看历史
const saveWatchHistory = (episodeIndex) => {
  if (!props.drama || !props.drama.id) return

  const key = `${props.drama.id}_${episodeIndex}`
  watchHistory.value.set(key, {
    dramaId: props.drama.id,
    dramaName: props.drama.name || '未知影视',
    episodeIndex,
    timestamp: Date.now()
  })

  // 保存到localStorage
  if (import.meta.client) {
    try {
      const historyData = Array.from(watchHistory.value.entries())
      localStorage.setItem('drama_watch_history', JSON.stringify(historyData))
    } catch (error) {
      if (import.meta.dev) {
        console.warn('Failed to save watch history:', error)
      }
    }
  }
}

// 加载观看历史
const loadWatchHistory = () => {
  if (import.meta.client) {
    try {
      const historyData = localStorage.getItem('drama_watch_history')
      if (historyData) {
        const parsed = JSON.parse(historyData)
        watchHistory.value = new Map(parsed)
      }
    } catch (error) {
      // 在开发环境输出日志
      if (import.meta.dev) {
        console.warn('Failed to load watch history:', error)
      }
    }
  }
}

// 初始化播放器（首次加载时使用）
const initializePlayer = (index) => {
  if (index < 0 || index >= props.drama.episodes.length) return

  currentEpisode.value = index
  isLoading.value = true

  const episode = props.drama.episodes[index]
  if (episode) {
    playerUrl.value = generatePlayerUrl(episode.url)
    saveWatchHistory(index)

    // 初始化时只需要较短的加载时间
    setTimeout(() => {
      isLoading.value = false
    }, 500)
  }
}

// 切换剧集
const selectEpisode = (index, isInitial = false) => {
  if (index < 0 || index >= props.drama.episodes.length) return

  // 如果是同一集且不是初始化，则不做任何操作
  if (index === currentEpisode.value && !isInitial) return

  // 如果是初始化，使用初始化方法
  if (isInitial) {
    initializePlayer(index)
    return
  }

  // 停止自动播放倒计时
  stopAutoPlayCountdown()

  // 先清空播放器URL，强制卸载当前播放器
  playerUrl.value = ''
  currentEpisode.value = index
  isLoading.value = true

  // 使用 nextTick 确保 DOM 更新后再加载新的播放器
  nextTick(() => {
    const episode = props.drama.episodes[index]
    if (episode) {
      // 延迟设置新的播放器URL，避免冲突
      setTimeout(() => {
        playerUrl.value = generatePlayerUrl(episode.url)
        saveWatchHistory(index)

        // 再延迟一点移除加载状态
        setTimeout(() => {
          isLoading.value = false
        }, 800)
      }, 200)
    }
  })
}

// 自动播放下一集相关
let autoPlayTimer = null

// const startAutoPlayCountdown = () => {
//   if (!autoPlayNext.value || currentEpisode.value >= props.drama.episodes.length - 1) return

//   autoPlayCountdown.value = 10
//   isAutoPlaying.value = true

//   autoPlayTimer = setInterval(() => {
//     autoPlayCountdown.value--
//     if (autoPlayCountdown.value <= 0) {
//       stopAutoPlayCountdown()
//       nextEpisode()
//     }
//   }, 1000)
// }

const stopAutoPlayCountdown = () => {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
  autoPlayCountdown.value = 0
  isAutoPlaying.value = false
}

const cancelAutoPlay = () => {
  stopAutoPlayCountdown()
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

// 收藏功能
const toggleFavorite = () => {
  isFavorited.value = !isFavorited.value

  // 保存到localStorage
  if (import.meta.client) {
    const favorites = JSON.parse(localStorage.getItem('drama_favorites') || '[]')
    if (isFavorited.value) {
      if (!favorites.includes(props.drama.id)) {
        favorites.push(props.drama.id)
      }
    } else {
      const index = favorites.indexOf(props.drama.id)
      if (index > -1) {
        favorites.splice(index, 1)
      }
    }
    localStorage.setItem('drama_favorites', JSON.stringify(favorites))
  }
}

// 检查是否已收藏
const checkFavoriteStatus = () => {
  if (import.meta.client && props.drama && props.drama.id) {
    try {
      const favorites = JSON.parse(localStorage.getItem('drama_favorites') || '[]')
      isFavorited.value = favorites.includes(props.drama.id)
    } catch (error) {
      if (import.meta.dev) {
        console.warn('Failed to check favorite status:', error)
      }
    }
  }
}

// 播放速度控制
const changePlaybackSpeed = (speed) => {
  playbackSpeed.value = speed
  // 这里可以通过postMessage与iframe通信来控制播放速度
  // 实际实现需要根据具体的播放器接口
}

// 音量控制
const changeVolume = (vol) => {
  volume.value = Math.max(0, Math.min(1, vol))
  // 同样需要与播放器通信
}

// 切换设置面板
const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

// 打开VOD设置 - 根据用户登录状态处理
const openVodSettings = () => {
  if (userStore.loggedIn) {
    // 已登录用户直接跳转到配置页面
    navigateTo('/user/vod-settings')
  } else {
    // 未登录用户跳转到登录页面
    navigateTo('/login')
  }
}

// 自动隐藏控制栏
const autoHideControls = () => {
  // 清除之前的定时器
  if (controlsTimer.value) {
    clearTimeout(controlsTimer.value)
  }

  // 显示控制栏
  showControls.value = true

  // 3秒后自动隐藏
  controlsTimer.value = setTimeout(() => {
    showControls.value = false
  }, 3000)
}

// 鼠标移动时显示控制栏
const handleMouseMove = () => {
  autoHideControls()
}

// 处理 iframe 加载完成
const handleIframeLoad = () => {
  if (import.meta.dev) {
    console.log('Player iframe loaded successfully')
  }
}

// 处理 iframe 加载错误
const handleIframeError = (error) => {
  if (import.meta.dev) {
    console.error('Player iframe error:', error)
  }
  isLoading.value = false
}

// 模拟视频结束事件（实际应该从播放器接收）
// const onVideoEnded = () => {
//   if (autoPlayNext.value && currentEpisode.value < props.drama.episodes.length - 1) {
//     startAutoPlayCountdown()
//   }
// }

// 关闭播放器
const closePlayer = () => {
  stopAutoPlayCountdown()
  emit('close')
}

// 格式化剧集标题
const formatEpisodeTitle = (title) => {
  // 如果标题是日期格式（如20250516），转换为更友好的格式
  const datePattern = /^(\d{4})(\d{2})(\d{2})(.*)$/
  const match = title.match(datePattern)

  if (match) {
    const [, , month, day, extra] = match
    const formattedDate = `${parseInt(month)}/${parseInt(day)}`
    return extra ? `${formattedDate}${extra}` : formattedDate
  }

  // 不再截断标题，让它保留完整内容
  return title
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
  // 如果正在输入，不处理快捷键
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault()
      previousEpisode()
      break
    case 'ArrowDown':
      e.preventDefault()
      nextEpisode()
      break
    case 'ArrowLeft':
      e.preventDefault()
      // 快退10秒（需要播放器支持）
      break
    case 'ArrowRight':
      e.preventDefault()
      // 快进10秒（需要播放器支持）
      break
    case 'f':
    case 'F':
      e.preventDefault()
      // 全屏切换（需要播放器支持）
      break
    case 'm':
    case 'M':
      e.preventDefault()
      // 静音切换
      changeVolume(volume.value > 0 ? 0 : 1)
      break
    case 's':
    case 'S':
      e.preventDefault()
      // 切换设置面板
      toggleSettings()
      break
    case 'l':
    case 'L':
      e.preventDefault()
      // 切换剧集列表
      toggleEpisodeList()
      break
    case 'c':
    case 'C':
      e.preventDefault()
      // 取消自动播放
      if (isAutoPlaying.value) {
        cancelAutoPlay()
      }
      break
    case 'Escape':
      if (showSettings.value) {
        showSettings.value = false
      } else if (!showEpisodeList.value) {
        showEpisodeList.value = true
      } else {
        closePlayer()
      }
      break
    case '1':
    case '2':
    case '3':
    case '4':
      e.preventDefault()
      const playerIndex = parseInt(e.key) - 1
      if (playerIndex < playerInterfaces.length) {
        switchPlayer(playerIndex)
      }
      break
  }
}

// 初始化
onMounted(async () => {
  // 加载观看历史和收藏状态
  loadWatchHistory()
  checkFavoriteStatus()

  // 检查是否有观看历史，如果有则从历史位置开始
  const historyKey = `${props.drama.id}_`
  let lastWatchedEpisode = 0

  for (const [key, value] of watchHistory.value.entries()) {
    if (key.startsWith(historyKey)) {
      if (value.episodeIndex > lastWatchedEpisode) {
        lastWatchedEpisode = value.episodeIndex
      }
    }
  }

  if (props.drama.episodes && props.drama.episodes.length > 0) {
    // 使用初始化标记，避免清空 URL
    selectEpisode(lastWatchedEpisode, true)
  }

  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown)

  // 初始自动隐藏控制栏
  autoHideControls()

  // 检查是否首次使用，显示广告提示
  if (import.meta.client) {
    const hasSeenAdTip = localStorage.getItem('has_seen_ad_tip')
    if (!hasSeenAdTip) {
      showAdBlockTip.value = true
      localStorage.setItem('has_seen_ad_tip', 'true')
    }
  }

  // 模拟视频播放结束事件（实际应该从播放器接收）
  // 这里可以添加与iframe播放器的通信逻辑
})

onUnmounted(() => {
  // 清理定时器和事件监听
  stopAutoPlayCountdown()
  if (controlsTimer.value) {
    clearTimeout(controlsTimer.value)
  }
  if (episodeChangeTimer) {
    clearTimeout(episodeChangeTimer)
  }
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="drama-player h-screen bg-linear-to-br from-gray-900 via-gray-800 to-black flex flex-col overflow-hidden"
    @touchstart="handleTouchStart" @touchend="handleTouchEnd">

    <!-- 顶部导航栏 -->
    <div class="bg-black/80 backdrop-blur-xl border-b border-gray-800 px-3 sm:px-6 py-2 sm:py-3 sticky top-0 z-40">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          <div
            class="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
            <i class="fas fa-play text-white text-xs sm:text-sm"></i>
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="text-sm sm:text-base lg:text-lg font-bold text-white truncate">
              {{ drama.name }}
            </h2>
            <p class="text-gray-400 text-xs sm:text-sm">
              第 <span class="text-amber-500 font-semibold">{{ currentEpisode + 1 }}</span> 集 / 共 {{
                drama.episodes.length }} 集
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <!-- 收藏按钮 -->
          <button @click="toggleFavorite" :class="[
            'w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-all duration-200 flex items-center justify-center min-h-[44px] sm:min-h-0',
            isFavorited
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 active:bg-red-500/40'
              : 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-400'
          ]">
            <i :class="isFavorited ? 'fas fa-heart' : 'far fa-heart'" class="text-sm sm:text-base"></i>
          </button>

          <!-- VOD源配置按钮 (隐藏在小屏幕) -->
          <button @click="openVodSettings"
            class="hidden sm:flex w-9 h-9 bg-gray-800 hover:bg-blue-500/20 active:bg-blue-500/30 text-gray-400 hover:text-blue-400 rounded-lg transition-all duration-200 items-center justify-center"
            title="配置影视源">
            <i class="fas fa-video text-base"></i>
          </button>

          <!-- 设置按钮 -->
          <button @click="toggleSettings"
            class="w-8 h-8 sm:w-9 sm:h-9 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-400 rounded-lg transition-all duration-200 flex items-center justify-center min-h-[44px] sm:min-h-0">
            <i class="fas fa-cog text-sm sm:text-base"></i>
          </button>

          <!-- 剧集列表切换按钮 -->
          <button @click="toggleEpisodeList"
            class="px-2 py-1.5 sm:px-3 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-300 rounded-lg text-xs sm:text-sm transition-all duration-200 min-h-[44px] sm:min-h-0 flex items-center"
            :class="showEpisodeList ? 'bg-amber-500/20 text-amber-400' : ''">
            <i class="fas fa-list mr-1 sm:mr-1.5 text-xs"></i>
            <span class="hidden xs:inline">选集</span>
          </button>

          <!-- 关闭按钮 -->
          <button @click="closePlayer"
            class="w-8 h-8 sm:w-9 sm:h-9 bg-gray-800 hover:bg-red-500/20 active:bg-red-500/30 text-gray-400 hover:text-red-400 rounded-lg transition-all duration-200 flex items-center justify-center min-h-[44px] sm:min-h-0">
            <i class="fas fa-times text-sm sm:text-base"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="flex-1 flex overflow-hidden min-h-0">
      <!-- 视频播放器区域 -->
      <div class="flex-1 relative bg-black min-h-0" @mousemove="handleMouseMove" @click="handleMouseMove">
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
        <iframe v-if="playerUrl && !isLoading" :key="playerUrl" :src="playerUrl" class="w-full h-full" frameborder="0"
          allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          @load="handleIframeLoad" @error="handleIframeError"></iframe>

        <!-- 无播放源状态 -->
        <div v-if="!playerUrl && !isLoading" class="absolute inset-0 flex items-center justify-center bg-black/80">
          <div class="text-center">
            <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-exclamation-triangle text-red-400 text-2xl"></i>
            </div>
            <h3 class="text-white text-xl font-semibold mb-2">暂无播放源</h3>
            <p class="text-stone-400">该影视暂时无法播放</p>
          </div>
        </div>

        <!-- 播放控制悬浮按钮 -->
        <div v-if="showControls && (currentEpisode > 0 || currentEpisode < drama.episodes.length - 1)"
          class="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-black/60 hover:bg-black/80 px-3 py-2 rounded-full backdrop-blur-xl border border-gray-800/50 transition-all duration-300 opacity-70 hover:opacity-100">
          <!-- 上一集 -->
          <button v-if="currentEpisode > 0" @click="previousEpisode"
            class="w-9 h-9 sm:w-8 sm:h-8 bg-gray-800/60 hover:bg-gray-700 active:bg-gray-600 text-gray-300 hover:text-white rounded-full transition-all duration-200 flex items-center justify-center min-h-[44px] sm:min-h-0">
            <i class="fas fa-backward text-xs"></i>
          </button>

          <!-- 当前集数显示 -->
          <span class="text-xs sm:text-xs text-gray-300 px-2 font-medium">
            {{ currentEpisode + 1 }} / {{ drama.episodes.length }}
          </span>

          <!-- 下一集 -->
          <button v-if="currentEpisode < drama.episodes.length - 1" @click="nextEpisode"
            class="w-9 h-9 sm:w-8 sm:h-8 bg-gray-800/60 hover:bg-gray-700 active:bg-gray-600 text-gray-300 hover:text-white rounded-full transition-all duration-200 flex items-center justify-center min-h-[44px] sm:min-h-0">
            <i class="fas fa-forward text-xs"></i>
          </button>
        </div>

        <!-- 自动播放下一集倒计时 -->
        <div v-if="isAutoPlaying"
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white p-6 rounded-2xl backdrop-blur-sm text-center">
          <div class="mb-4">
            <div class="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <i class="fas fa-forward text-amber-400 text-2xl"></i>
            </div>
            <h3 class="text-lg font-semibold mb-2">即将播放下一集</h3>
            <p class="text-stone-300 text-sm">第{{ currentEpisode + 2 }}集</p>
          </div>

          <div class="mb-4">
            <div class="text-3xl font-bold text-amber-400 mb-2">{{ autoPlayCountdown }}</div>
            <div class="w-32 h-2 bg-white/20 rounded-full mx-auto overflow-hidden">
              <div
                class="h-full bg-linear-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-1000"
                :style="{ width: `${(10 - autoPlayCountdown) * 10}%` }"></div>
            </div>
          </div>

          <button @click="cancelAutoPlay"
            class="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-300">
            <i class="fas fa-times mr-2"></i>
            取消
          </button>
        </div>

        <!-- 设置面板 -->
        <div v-if="showSettings"
          class="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-auto bg-black/95 text-white p-3 sm:p-4 rounded-xl backdrop-blur-sm w-auto sm:w-80 max-h-[85vh] sm:max-h-[80vh] overflow-y-auto z-50">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">播放设置</h3>
            <button @click="toggleSettings" class="text-stone-300 hover:text-white transition-colors">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- 播放器选择 -->
          <div class="mb-4">
            <h4 class="text-sm font-medium text-stone-300 mb-2">播放器选择</h4>
            <p class="text-xs text-stone-400 mb-3">如遇广告过多，请切换其他播放器</p>
            <div class="grid grid-cols-2 gap-2">
              <button v-for="(player, index) in playerInterfaces" :key="index" @click="switchPlayer(index)" :class="[
                'relative px-3 py-2 text-sm rounded-lg transition-all duration-300 flex flex-col items-center justify-center',
                currentPlayerIndex === index
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-gray-700/50'
              ]">
                <div class="flex items-center mb-1">
                  <i :class="player.icon" class="mr-1.5 text-xs"></i>
                  <span class="text-xs font-medium">{{ player.name }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-[10px] text-stone-500">广告:</span>
                  <div class="flex gap-0.5">
                    <span v-for="n in 3" :key="n" :class="[
                      'w-1 h-1 rounded-full',
                      n <= (player.adLevel === 'low' ? 1 : player.adLevel === 'medium' ? 2 : 3)
                        ? player.adLevel === 'low' ? 'bg-green-500' : player.adLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                        : 'bg-gray-600'
                    ]"></span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- 播放速度 -->
          <div class="mb-4">
            <h4 class="text-sm font-medium text-stone-300 mb-2">播放速度</h4>
            <div class="flex flex-wrap gap-2">
              <button v-for="speed in playbackSpeeds" :key="speed.value" @click="changePlaybackSpeed(speed.value)"
                :class="[
                  'px-3 py-1 text-sm rounded-lg transition-all duration-300',
                  playbackSpeed === speed.value
                    ? 'bg-amber-500/30 text-amber-300'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                ]">
                {{ speed.label }}
              </button>
            </div>
          </div>

          <!-- 自动播放设置 -->
          <div class="mb-4">
            <label class="flex items-center justify-between">
              <span class="text-sm font-medium text-stone-300">自动播放下一集</span>
              <button @click="autoPlayNext = !autoPlayNext" :class="[
                'w-12 h-6 rounded-full transition-all duration-300 relative',
                autoPlayNext ? 'bg-amber-500' : 'bg-white/20'
              ]">
                <div :class="[
                  'w-5 h-5 bg-white rounded-full transition-all duration-300 absolute top-0.5',
                  autoPlayNext ? 'left-6' : 'left-0.5'
                ]"></div>
              </button>
            </label>
          </div>

          <!-- 快捷键说明 -->
          <div>
            <h4 class="text-sm font-medium text-stone-300 mb-2">快捷键</h4>
            <div class="text-xs text-stone-400 space-y-1">
              <div class="flex justify-between">
                <span>上/下箭头:</span>
                <span>切换集数</span>
              </div>
              <div class="flex justify-between">
                <span>M:</span>
                <span>静音</span>
              </div>
              <div class="flex justify-between">
                <span>S:</span>
                <span>设置</span>
              </div>
              <div class="flex justify-between">
                <span>1-4:</span>
                <span>切换播放器</span>
              </div>
            </div>
          </div>

          <!-- 广告屏蔽提示 -->
          <div class="mt-4 pt-4 border-t border-gray-700">
            <h4 class="text-sm font-medium text-stone-300 mb-2">广告屏蔽建议</h4>
            <div class="text-xs text-stone-400 space-y-2">
              <div class="flex items-start">
                <i class="fas fa-shield-alt text-amber-500 mr-2 mt-0.5"></i>
                <span>推荐安装广告屏蔽扩展（如 uBlock Origin、AdGuard）</span>
              </div>
              <div class="flex items-start">
                <i class="fas fa-exchange-alt text-amber-500 mr-2 mt-0.5"></i>
                <span>切换不同播放器可能有不同的广告情况</span>
              </div>
              <div class="flex items-start">
                <i class="fas fa-clock text-amber-500 mr-2 mt-0.5"></i>
                <span>部分播放器的广告会在几秒后自动跳过</span>
              </div>
              <div class="flex items-start">
                <i class="fas fa-info-circle text-amber-500 mr-2 mt-0.5"></i>
                <span class="text-[11px]">技术限制：由于跨域安全策略，无法直接过滤广告切片</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 滑动提示和控制按钮 -->
        <div v-if="showControls"
          class="absolute top-4 right-4 flex flex-col items-end gap-2 opacity-50 hover:opacity-100 transition-opacity duration-300">
          <div
            class="bg-black/40 text-gray-400 px-2.5 py-1 rounded-lg text-xs backdrop-blur-sm border border-gray-800/50 hidden sm:flex items-center">
            <i class="fas fa-arrows-alt-v mr-1 text-amber-500/70 text-xs"></i>
            <span class="text-xs">上下滑动切换</span>
          </div>
          <!-- 桌面端播放列表切换按钮 -->
          <button @click="toggleEpisodeList"
            class="hidden lg:flex items-center bg-black/40 hover:bg-black/60 text-gray-400 hover:text-white px-2.5 py-1 rounded-lg text-xs backdrop-blur-sm border border-gray-800/50 transition-all duration-200">
            <i :class="showEpisodeList ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"
              class="mr-1 text-amber-500/70 text-xs"></i>
            <span class="text-xs">{{ showEpisodeList ? '隐藏' : '显示' }}列表</span>
          </button>
        </div>

        <!-- 广告屏蔽提示弹窗 -->
        <div v-if="showAdBlockTip"
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white p-6 rounded-2xl backdrop-blur-sm max-w-md z-50">
          <div class="flex items-start mb-4">
            <i class="fas fa-info-circle text-amber-500 text-xl mr-3 mt-1"></i>
            <div>
              <h3 class="text-lg font-semibold mb-2">关于视频广告</h3>
              <p class="text-sm text-stone-300 mb-3">由于使用第三方播放器，可能会出现广告。您可以：</p>
              <ul class="text-sm text-stone-400 space-y-2">
                <li class="flex items-start">
                  <span class="text-amber-500 mr-2">•</span>
                  <span>切换不同的播放器（设置中可选）</span>
                </li>
                <li class="flex items-start">
                  <span class="text-amber-500 mr-2">•</span>
                  <span>安装浏览器广告屏蔽扩展</span>
                </li>
                <li class="flex items-start">
                  <span class="text-amber-500 mr-2">•</span>
                  <span>等待广告自动结束（通常5-15秒）</span>
                </li>
              </ul>
            </div>
          </div>
          <div class="flex justify-end">
            <button @click="showAdBlockTip = false"
              class="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-all duration-300">
              我知道了
            </button>
          </div>
        </div>
      </div>

      <!-- 剧集列表侧边栏 -->
      <aside v-if="showEpisodeList" :class="[
        'w-full sm:w-80 lg:w-96 bg-gray-900/95 backdrop-blur-xl border-l border-gray-800 transition-all duration-300 flex flex-col overflow-hidden',
        'translate-x-0 fixed sm:relative top-0 right-0 h-full z-40 sm:z-auto'
      ]">
        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
          <!-- 剧集列表标题 -->
          <div class="mb-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-white flex items-center">
                <i class="fas fa-list text-amber-500 text-sm mr-2"></i>
                选集播放
                <span class="ml-2 text-xs text-gray-500 font-normal">共 {{ drama.episodes.length }} 集</span>
              </h3>
              <button @click="toggleEpisodeList" class="lg:hidden text-gray-400 hover:text-white transition-colors p-1">
                <i class="fas fa-times text-lg"></i>
              </button>
            </div>
          </div>

          <!-- 剧集网格 -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-2">
            <button v-for="(episode, index) in drama.episodes" :key="index" @click="selectEpisode(index)" :class="[
              'episode-btn relative px-2 py-3 sm:py-2.5 text-xs font-medium rounded-lg transition-all duration-200 overflow-hidden group min-w-0 h-18 sm:h-16 min-h-[44px]',
              currentEpisode === index
                ? 'bg-linear-to-r from-amber-500 to-orange-600 text-white shadow-md ring-1 ring-amber-500/50'
                : 'bg-gray-800/50 hover:bg-gray-800 active:bg-gray-700 text-gray-400 hover:text-white border border-gray-700/50'
            ]">
              <!-- 播放中动画 -->
              <div v-if="currentEpisode === index"
                class="absolute inset-0 bg-linear-to-r from-amber-500/10 to-orange-600/10">
              </div>

              <!-- 观看历史标记 -->
              <div v-if="watchHistory.has(`${drama.id}_${index}`) && currentEpisode !== index"
                class="absolute top-1 right-1 w-2 h-2 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full">
              </div>

              <!-- 集数标签优化 -->
              <span class="relative z-10 flex flex-col items-center justify-center h-full w-full">
                <span class="text-[10px] sm:text-[10px] text-gray-500 block">第{{ index + 1 }}集</span>
                <span class="text-xs sm:text-[11px] font-semibold block w-full px-1 leading-tight"
                  :title="formatEpisodeTitle(episode.number)">{{ formatEpisodeTitle(episode.number) }}</span>
              </span>
            </button>
          </div>

          <!-- 快速导航 -->
          <div class="mt-4 pt-4 border-t border-gray-800">
            <h4 class="text-xs font-medium text-gray-400 mb-3">快速导航</h4>
            <div class="flex items-center gap-2">
              <button @click="selectEpisode(0)"
                class="flex-1 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg text-xs transition-all duration-200 border border-gray-700/50">
                <i class="fas fa-fast-backward mr-1 text-[10px]"></i>
                第一集
              </button>
              <button @click="selectEpisode(drama.episodes.length - 1)"
                class="flex-1 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg text-xs transition-all duration-200 border border-gray-700/50">
                最新集
                <i class="fas fa-fast-forward ml-1 text-[10px]"></i>
              </button>
            </div>
          </div>

          <!-- 播放信息 -->
          <div class="mt-4 pt-4 border-t border-gray-800">
            <div class="bg-gray-800/30 rounded-lg p-3">
              <h4 class="text-xs font-medium text-gray-400 mb-3 flex items-center">
                <i class="fas fa-chart-line mr-1.5 text-amber-500 text-xs"></i>
                播放进度
              </h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-xs text-gray-500">当前</span>
                  <span class="text-xs font-medium text-amber-500">第 {{ currentEpisode + 1 }} 集</span>
                </div>
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-xs text-gray-500">进度</span>
                    <span class="text-xs text-gray-400">{{ Math.round((currentEpisode + 1) / drama.episodes.length *
                      100) }}%</span>
                  </div>
                  <div class="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-linear-to-r from-amber-500 to-orange-600 rounded-full transition-all duration-500"
                      :style="{ width: `${(currentEpisode + 1) / drama.episodes.length * 100}%` }">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 影视详情 -->
          <div class="mt-4 pt-4 border-t border-gray-800">
            <div class="bg-gray-800/30 rounded-lg p-3">
              <h4 class="text-xs font-medium text-gray-400 mb-3 flex items-center">
                <i class="fas fa-info-circle mr-1.5 text-amber-500 text-xs"></i>
                影视信息
              </h4>
              <div class="space-y-1.5 text-xs">
                <div v-if="drama.year" class="flex items-start">
                  <span class="text-gray-500 w-12 flex-shrink-0">年份</span>
                  <span class="text-gray-300">{{ drama.year }}</span>
                </div>
                <div v-if="drama.area" class="flex items-start">
                  <span class="text-gray-500 w-12 flex-shrink-0">地区</span>
                  <span class="text-gray-300">{{ drama.area }}</span>
                </div>
                <div v-if="drama.actor" class="flex items-start">
                  <span class="text-gray-500 w-12 flex-shrink-0">主演</span>
                  <span class="text-gray-300 line-clamp-2">{{ drama.actor }}</span>
                </div>
                <div v-if="drama.score && parseFloat(drama.score) > 0" class="flex items-center pt-1">
                  <span class="text-gray-500 w-12 flex-shrink-0">评分</span>
                  <div class="flex items-center">
                    <i class="fas fa-star text-amber-500 mr-1 text-[10px]"></i>
                    <span class="text-amber-500 font-medium">{{ drama.score }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- 移动端剧集列表遮罩 -->
    <div v-if="showEpisodeList" @click="toggleEpisodeList" class="sm:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"></div>
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

/* 移动端优化 */
@media (max-width: 640px) {
  .drama-player {
    padding: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
  }
  
  .episode-btn:hover {
    transform: none;
  }

  .episode-btn {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  
  /* 移动端按钮优化 */
  button {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  
  /* 防止移动端缩放 */
  input, select, textarea {
    font-size: 16px;
  }
  
  /* 移动端滚动优化 */
  .overflow-y-auto {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
  .xs\:inline {
    display: inline;
  }
  
  .h-18 {
    height: 4.5rem;
  }
}

/* 响应式调整 */
@media (max-width: 1024px) {
  aside {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    z-index: 40;
    display: flex;
    flex-direction: column;
  }
}

/* 安全区域适配 */
@supports (padding: max(0px)) {
  .drama-player {
    padding-left: max(env(safe-area-inset-left), 0px);
    padding-right: max(env(safe-area-inset-right), 0px);
    padding-top: max(env(safe-area-inset-top), 0px);
    padding-bottom: max(env(safe-area-inset-bottom), 0px);
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

/* 文本截断样式 */
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
</style>
