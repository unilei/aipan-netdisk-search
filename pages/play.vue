<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <!-- 顶部导航栏 -->
    <div class="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex items-center gap-4">
          <button 
            @click="goBack"
            class="flex items-center gap-2 px-3 py-2 text-sm font-medium 
                   text-gray-700 dark:text-gray-300 
                   hover:text-purple-600 dark:hover:text-purple-400 
                   bg-gray-100 dark:bg-gray-700
                   hover:bg-gray-50 dark:hover:bg-gray-600
                   rounded-lg transition-all duration-200">
            <i class="fas fa-arrow-left"></i>
            <span>返回</span>
          </button>
          <div class="flex items-center gap-2">
            <i class="fas fa-play-circle text-purple-500"></i>
            <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ vodInfo.vod_name || '正在加载...' }}
            </h1>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center">
          <i class="fas fa-spinner fa-spin text-4xl text-purple-500 mb-4"></i>
          <p class="text-gray-600 dark:text-gray-400">正在加载播放信息...</p>
        </div>
      </div>

      <!-- 主内容 -->
      <div v-else class="space-y-4 sm:space-y-6">
        <!-- 播放器区域 -->
        <div class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
          <!-- 温馨提示 -->
          <div class="bg-red-50 dark:bg-red-900/30 px-4 py-2.5 flex items-center gap-2 border-b border-red-100 dark:border-red-800">
            <i class="fas fa-exclamation-circle text-red-500 animate-pulse"></i>
            <p class="text-sm font-medium text-red-600 dark:text-red-400">
              请勿相信视频中的任何广告内容！
            </p>
          </div>

          <!-- 视频播放器 -->
          <div class="relative bg-black">
            <div class="aspect-video w-full">
              <div v-if="!currentPlayUrl" class="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5">
                <div class="text-center">
                  <i class="fas fa-film text-5xl text-gray-400 dark:text-gray-600 mb-4"></i>
                  <p class="text-lg text-gray-500 dark:text-gray-400 mb-2">请选择播放源和剧集</p>
                  <p class="text-sm text-gray-400 dark:text-gray-500">从下方选择您要观看的内容</p>
                </div>
              </div>
              <iframe 
                v-else
                width="100%" 
                height="100%" 
                :src="currentPlayUrl" 
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen="allowfullscreen" 
                mozallowfullscreen="mozallowfullscreen"
                msallowfullscreen="msallowfullscreen" 
                oallowfullscreen="oallowfullscreen"
                webkitallowfullscreen="webkitallowfullscreen"
                class="w-full h-full">
              </iframe>
            </div>
          </div>
        </div>

        <!-- 播放源和剧集选择 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- 播放源和剧集 -->
          <div class="lg:col-span-2">
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 ring-1 ring-black/5 dark:ring-white/5">
              <!-- 播放源选择 -->
              <div class="mb-6">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <i class="fas fa-server text-purple-500"></i>
                  选择播放源
                  <span class="text-sm font-normal text-gray-500 dark:text-gray-400">
                    (共 {{ playUrlGroups.length }} 个)
                  </span>
                </h2>
                <div class="flex flex-wrap gap-2">
                  <button 
                    v-for="(group, index) in playUrlGroups" 
                    :key="index"
                    @click="selectSource(index)"
                    class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                           ring-1 ring-gray-200 dark:ring-gray-700
                           hover:ring-purple-500 dark:hover:ring-purple-500
                           focus:outline-none focus:ring-2 focus:ring-purple-500"
                    :class="[
                      currentSourceIndex === index 
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white ring-0' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    ]"
                  >
                    <div class="flex items-center gap-2">
                      <span>播放源 {{ index + 1 }}</span>
                      <span class="px-1.5 py-0.5 text-xs rounded-md" 
                            :class="currentSourceIndex === index ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'">
                        {{ group.episodes.length }} 集
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <!-- 剧集选择 -->
              <div v-if="currentSourceEpisodes.length > 0">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <i class="fas fa-list text-purple-500"></i>
                  选择剧集
                  <span class="text-sm font-normal text-gray-500 dark:text-gray-400">
                    (当前: {{ currentEpisodeName }})
                  </span>
                </h2>
                <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-96 overflow-y-auto">
                  <button
                    v-for="(episode, index) in currentSourceEpisodes"
                    :key="index"
                    @click="selectEpisode(index)"
                    class="relative px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200
                           ring-1 ring-gray-200 dark:ring-gray-700 
                           hover:ring-purple-500 dark:hover:ring-purple-500
                           focus:outline-none focus:ring-2 focus:ring-purple-500"
                    :class="[
                      currentEpisodeIndex === index
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white ring-0'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    ]"
                  >
                    <span class="line-clamp-1">{{ episode.number }}</span>
                    <div v-if="currentEpisodeIndex === index" 
                         class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-ping">
                    </div>
                  </button>
                </div>
              </div>

              <!-- 空状态 -->
              <div v-else class="text-center py-12">
                <i class="fas fa-video-slash text-4xl text-gray-400 mb-3"></i>
                <p class="text-gray-500 dark:text-gray-400">暂无可播放的剧集</p>
              </div>
            </div>
          </div>

          <!-- 视频信息侧边栏 -->
          <div class="lg:col-span-1">
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 ring-1 ring-black/5 dark:ring-white/5 sticky top-20">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <i class="fas fa-info-circle text-purple-500"></i>
                视频信息
              </h2>
              <div class="space-y-3">
                <!-- 海报 -->
                <div v-if="vodInfo.vod_pic" class="aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img 
                    :src="vodInfo.vod_pic" 
                    :alt="vodInfo.vod_name"
                    class="w-full h-full object-cover"
                    @error="onImageError"
                  />
                </div>

                <!-- 基本信息 -->
                <div class="space-y-2 text-sm">
                  <div v-if="vodInfo.vod_remarks" class="flex items-center gap-2">
                    <span class="text-gray-500 dark:text-gray-400">状态：</span>
                    <span class="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-md font-medium">
                      {{ vodInfo.vod_remarks }}
                    </span>
                  </div>
                  <div v-if="vodInfo.vod_year" class="flex items-center gap-2">
                    <span class="text-gray-500 dark:text-gray-400">年份：</span>
                    <span class="text-gray-900 dark:text-gray-100">{{ vodInfo.vod_year }}</span>
                  </div>
                  <div v-if="vodInfo.vod_area" class="flex items-center gap-2">
                    <span class="text-gray-500 dark:text-gray-400">地区：</span>
                    <span class="text-gray-900 dark:text-gray-100">{{ vodInfo.vod_area }}</span>
                  </div>
                  <div v-if="vodInfo.vod_director" class="flex items-start gap-2">
                    <span class="text-gray-500 dark:text-gray-400 flex-shrink-0">导演：</span>
                    <span class="text-gray-900 dark:text-gray-100 line-clamp-2">{{ vodInfo.vod_director }}</span>
                  </div>
                  <div v-if="vodInfo.vod_actor" class="flex items-start gap-2">
                    <span class="text-gray-500 dark:text-gray-400 flex-shrink-0">演员：</span>
                    <span class="text-gray-900 dark:text-gray-100 line-clamp-3">{{ vodInfo.vod_actor }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 使用提示 -->
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <i class="fas fa-info-circle text-blue-500"></i>
            使用说明
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
            <div class="flex items-start gap-2">
              <i class="fas fa-check-circle text-green-500 mt-0.5"></i>
              <span>点击上方播放源按钮切换不同线路</span>
            </div>
            <div class="flex items-start gap-2">
              <i class="fas fa-check-circle text-green-500 mt-0.5"></i>
              <span>点击剧集按钮即可开始播放</span>
            </div>
            <div class="flex items-start gap-2">
              <i class="fas fa-check-circle text-green-500 mt-0.5"></i>
              <span>如果视频无法播放，请尝试切换其他播放源</span>
            </div>
            <div class="flex items-start gap-2">
              <i class="fas fa-check-circle text-green-500 mt-0.5"></i>
              <span>播放器支持全屏观看，获得更好体验</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

definePageMeta({
  layout: 'default'
})

// 视频信息
const vodInfo = ref({})
const loading = ref(true)

// 播放相关状态
const currentSourceIndex = ref(0)
const currentEpisodeIndex = ref(0)
const currentPlayUrl = ref('')
const playUrlGroups = ref([])

// 当前播放的剧集名称
const currentEpisodeName = computed(() => {
  if (currentSourceEpisodes.value.length > 0 && currentEpisodeIndex.value < currentSourceEpisodes.value.length) {
    return currentSourceEpisodes.value[currentEpisodeIndex.value].number
  }
  return '未选择'
})

// 当前播放源的剧集列表
const currentSourceEpisodes = computed(() => {
  if (playUrlGroups.value.length > 0 && currentSourceIndex.value < playUrlGroups.value.length) {
    return playUrlGroups.value[currentSourceIndex.value].episodes
  }
  return []
})

// 检查是否是 M3U8 格式
const checkIsM3u8 = (url) => {
  return /\.m3u8$/.test(url)
}

// 解析播放地址
const parsePlayUrl = (vod) => {
  const inputString = vod.vod_play_url
  if (!inputString) {
    return []
  }

  const matches = inputString.match(/#/g)
  let fragments = []

  if (matches && matches.length > 0) {
    fragments = inputString.split('#')
  } else {
    fragments = inputString.split('$$$')
  }

  const episodes = []
  for (let i = 0; i < fragments.length; i++) {
    const episodeInfo = fragments[i].split('$')
    if (episodeInfo.length === 2) {
      const episodeNumber = episodeInfo[0].trim()
      const episodeLink = episodeInfo[1].trim()
      if (episodeLink.length > 20) {
        episodes.push({ 
          number: episodeNumber, 
          link: episodeLink,
          playUrl: vod.playUrl 
        })
      }
    }
  }

  return episodes
}

// 选择播放源
const selectSource = (index) => {
  currentSourceIndex.value = index
  currentEpisodeIndex.value = 0
  
  // 自动播放第一集
  if (currentSourceEpisodes.value.length > 0) {
    selectEpisode(0)
  } else {
    ElMessage.warning('该播放源暂无可用剧集，请选择其他播放源')
  }
}

// 选择剧集
const selectEpisode = (index) => {
  currentEpisodeIndex.value = index
  const episode = currentSourceEpisodes.value[index]
  
  if (episode) {
    if (checkIsM3u8(episode.link)) {
      currentPlayUrl.value = `${episode.playUrl}${episode.link}`
    } else {
      currentPlayUrl.value = episode.link
    }
    
    // 滚动到播放器区域
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }
}

// 图片加载失败处理
const onImageError = (event) => {
  event.target.style.display = 'none'
}

// 返回
const goBack = () => {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    window.location.href = '/'
  }
}

// 页面加载时初始化
onMounted(() => {
  try {
    // 从 URL 参数获取存储 key
    const urlParams = new URLSearchParams(window.location.search)
    const storageKey = urlParams.get('key')
    
    if (storageKey) {
      // 从 sessionStorage 获取视频数据
      const vodDataStr = sessionStorage.getItem(storageKey)
      
      if (vodDataStr) {
        const vodDataArray = JSON.parse(vodDataStr)
        
        // 不删除数据，允许用户刷新页面
        // sessionStorage 会在标签页关闭时自动清除
        
        if (vodDataArray && vodDataArray.length > 0) {
          // 解析所有播放源
          vodDataArray.forEach((vod, index) => {
            const episodes = parsePlayUrl(vod)
            if (episodes.length > 0) {
              playUrlGroups.value.push({
                name: vod.vod_name,
                episodes: episodes
              })
            }
          })

          // 设置视频信息（使用第一个）
          vodInfo.value = vodDataArray[0]

          // 自动播放第一个播放源的第一集
          if (playUrlGroups.value.length > 0 && playUrlGroups.value[0].episodes.length > 0) {
            selectEpisode(0)
          } else {
            ElMessage.warning('暂无可播放内容，请返回重新选择')
          }
        } else {
          ElMessage.error('视频信息无效')
        }
      } else {
        ElMessage.error('未找到视频信息，请重新选择')
      }
    } else {
      ElMessage.error('无效的访问链接')
    }
  } catch (error) {
    console.error('解析视频信息失败:', error)
    ElMessage.error('加载失败，请返回重试')
  } finally {
    loading.value = false
  }
})
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

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}

/* 暗黑模式滚动条 */
.dark ::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.3);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.5);
}
</style>
