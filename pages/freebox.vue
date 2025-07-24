<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

// SEO优化
useSeoMeta({
  title: 'AIPAN免费盒子 - VIP视频解析播放器 | 支持爱奇艺腾讯优酷等全网VIP视频',
  description: 'AIPAN免费盒子提供免费的VIP视频解析服务，支持爱奇艺、腾讯视频、优酷、芒果TV、哔哩哔哩等主流视频平台。一键解析，高清播放，完全免费使用。',
  keywords: 'VIP视频解析,免费视频解析,爱奇艺解析,腾讯视频解析,优酷解析,芒果TV解析,哔哩哔哩解析,在线视频播放,AIPAN免费盒子',
  ogTitle: 'AIPAN免费盒子 - VIP视频解析播放器',
  ogDescription: 'AIPAN免费盒子提供免费的VIP视频解析服务，支持全网主流视频平台VIP内容解析播放。',
  twitterTitle: 'AIPAN免费盒子 - VIP视频解析播放器',
  twitterDescription: '免费VIP视频解析！支持爱奇艺腾讯优酷等全网平台，一键解析高清播放！'
})

useHead({
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1, shrink-to-fit=no" },
    { name: "author", content: "爱盼团队" },
    { name: "robots", content: "index, follow" },
    { name: "format-detection", content: "telephone=no" },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://www.aipan.me/freebox" },
    { property: "og:image", content: "https://www.aipan.me/default-og-image.png" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: "https://www.aipan.me/default-og-image.png" }
  ]
})

definePageMeta({
  layout: "default"
})

// 解析接口配置
const parseInterfaces = [
  ['https://im1907.top/?jx=', 'M1907解析接口', '推荐', 'success'],
  ['https://jx.xmflv.com/?url=', '虾米解析接口', '稳定', 'primary'],
  ['https://jx.xymp4.cc/?url=', '咸鱼解析接口', '快速', 'warning'],
  ['https://jx.2s0cn/player/?url=', '极速解析接口', '高清', 'info'],
  ['https://jx.playerjy.com/?url=', 'PlayerJY解析接口', '备用', 'default']
]

// 常用视频网站示例
const videoExamples = [
  { name: '爱奇艺', url: 'https://www.iqiyi.com/v_xxx.html', icon: 'fas fa-video' },
  { name: '腾讯视频', url: 'https://v.qq.com/x/cover/xxx.html', icon: 'fab fa-qq' },
  { name: '优酷', url: 'https://v.youku.com/v_show/id_xxx.html', icon: 'fas fa-play-circle' },
  { name: '芒果TV', url: 'https://www.mgtv.com/b/xxx.html', icon: 'fas fa-tv' },
  { name: '哔哩哔哩', url: 'https://www.bilibili.com/video/BVxxx', icon: 'fab fa-bilibili' }
]

// 响应式数据
const selectedInterface = ref('')
const videoUrl = ref('')
const iframeUrl = ref('')
const isLoading = ref(false)
const isFullscreen = ref(false)
const showHistory = ref(false)
const playHistory = ref([])
const currentInterfaceIndex = ref(0)

// 计算属性
const currentInterfaceName = computed(() => {
  const current = parseInterfaces.find(item => item[0] === selectedInterface.value)
  return current ? current[1] : ''
})

const isValidUrl = computed(() => {
  if (!videoUrl.value) return false
  try {
    new URL(videoUrl.value)
    return true
  } catch {
    return false
  }
})

// 从localStorage获取保存的数据
onMounted(() => {
  const savedInterface = localStorage.getItem('jxjiekou')
  const savedUrl = localStorage.getItem('jxurl')
  const savedHistory = localStorage.getItem('playHistory')

  selectedInterface.value = savedInterface || parseInterfaces[0][0]
  videoUrl.value = savedUrl || ''

  if (savedHistory) {
    try {
      playHistory.value = JSON.parse(savedHistory)
    } catch (e) {
      playHistory.value = []
    }
  }

  // 设置当前接口索引
  currentInterfaceIndex.value = parseInterfaces.findIndex(item => item[0] === selectedInterface.value)
  if (currentInterfaceIndex.value === -1) currentInterfaceIndex.value = 0

  // 设置页面标题
  document.title = 'VIP视频解析 - AIPAN.ME'
})

// 播放视频
const playVideo = async () => {
  if (!selectedInterface.value || !videoUrl.value) {
    ElMessage.warning('请选择解析接口并输入视频地址')
    return
  }

  if (!isValidUrl.value) {
    ElMessage.error('请输入有效的视频地址')
    return
  }

  isLoading.value = true

  try {
    // 添加到播放历史
    addToHistory(videoUrl.value, currentInterfaceName.value)

    iframeUrl.value = selectedInterface.value + videoUrl.value
    localStorage.setItem('jxjiekou', selectedInterface.value)
    localStorage.setItem('jxurl', videoUrl.value)

    // 滚动到播放区域
    await nextTick()
    const playerElement = document.getElementById('video-player')
    if (playerElement) {
      playerElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    ElNotification({
      title: '解析成功',
      message: `正在使用 ${currentInterfaceName.value} 解析播放`,
      type: 'success',
      duration: 3000
    })
  } catch (error) {
    ElMessage.error('解析失败，请尝试其他接口')
  } finally {
    isLoading.value = false
  }
}

// 切换解析接口
const switchInterface = (direction = 'next') => {
  if (direction === 'next') {
    currentInterfaceIndex.value = (currentInterfaceIndex.value + 1) % parseInterfaces.length
  } else {
    currentInterfaceIndex.value = currentInterfaceIndex.value === 0
      ? parseInterfaces.length - 1
      : currentInterfaceIndex.value - 1
  }

  selectedInterface.value = parseInterfaces[currentInterfaceIndex.value][0]

  if (videoUrl.value && iframeUrl.value) {
    playVideo()
  }
}

// 添加到播放历史
const addToHistory = (url, interfaceName) => {
  const historyItem = {
    url,
    interfaceName,
    title: extractVideoTitle(url),
    timestamp: Date.now()
  }

  // 移除重复项
  playHistory.value = playHistory.value.filter(item => item.url !== url)
  // 添加到开头
  playHistory.value.unshift(historyItem)
  // 限制历史记录数量
  if (playHistory.value.length > 10) {
    playHistory.value = playHistory.value.slice(0, 10)
  }

  localStorage.setItem('playHistory', JSON.stringify(playHistory.value))
}

// 提取视频标题
const extractVideoTitle = (url) => {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname

    if (hostname.includes('iqiyi')) return '爱奇艺视频'
    if (hostname.includes('qq.com')) return '腾讯视频'
    if (hostname.includes('youku')) return '优酷视频'
    if (hostname.includes('mgtv')) return '芒果TV'
    if (hostname.includes('bilibili')) return '哔哩哔哩'

    return '视频'
  } catch {
    return '视频'
  }
}

// 从历史记录播放
const playFromHistory = (historyItem) => {
  videoUrl.value = historyItem.url
  // 尝试使用相同的接口
  const interfaceItem = parseInterfaces.find(item => item[1] === historyItem.interfaceName)
  if (interfaceItem) {
    selectedInterface.value = interfaceItem[0]
    currentInterfaceIndex.value = parseInterfaces.findIndex(item => item[0] === selectedInterface.value)
  }
  playVideo()
  showHistory.value = false
}

// 清空历史记录
const clearHistory = () => {
  playHistory.value = []
  localStorage.removeItem('playHistory')
  ElMessage.success('历史记录已清空')
}

// 新窗口打开
const openInNewWindow = () => {
  if (!selectedInterface.value || !videoUrl.value) {
    ElMessage.warning('请选择解析接口并输入视频地址')
    return
  }

  if (!isValidUrl.value) {
    ElMessage.error('请输入有效的视频地址')
    return
  }

  localStorage.setItem('jxjiekou', selectedInterface.value)
  localStorage.setItem('jxurl', videoUrl.value)
  addToHistory(videoUrl.value, currentInterfaceName.value)
  window.open(selectedInterface.value + videoUrl.value)
}

// 全屏切换
const toggleFullscreen = () => {
  const playerElement = document.getElementById('video-player')
  if (!playerElement) return

  if (!isFullscreen.value) {
    if (playerElement.requestFullscreen) {
      playerElement.requestFullscreen()
    } else if (playerElement.webkitRequestFullscreen) {
      playerElement.webkitRequestFullscreen()
    } else if (playerElement.mozRequestFullScreen) {
      playerElement.mozRequestFullScreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    }
  }
}

// 监听全屏状态变化
onMounted(() => {
  const handleFullscreenChange = () => {
    isFullscreen.value = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement)
  }

  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
})

// 清空输入
const clearInput = () => {
  videoUrl.value = ''
  iframeUrl.value = ''
}

// 粘贴剪贴板内容
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    if (text && text.startsWith('http')) {
      videoUrl.value = text
      ElMessage.success('已粘贴剪贴板内容')
    } else {
      ElMessage.warning('剪贴板中没有有效的网址')
    }
  } catch (error) {
    ElMessage.error('无法访问剪贴板，请手动粘贴')
  }
}

// 处理回车键
const handleKeyup = (event) => {
  if (event.key === 'Enter') {
    playVideo()
  }
}

// 填入示例地址
const fillExample = (example) => {
  videoUrl.value = example.url
  ElMessage.info(`已填入${example.name}示例地址，请替换为实际视频地址`)
}
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
    <!-- 页面头部 -->
    <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-6xl mx-auto px-4 py-6">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            <i class="fas fa-play-circle text-blue-600 mr-3"></i>
            AIPAN免费盒子
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            免费VIP视频解析播放器，支持全网主流视频平台
          </p>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <main class="max-w-6xl mx-auto px-4 py-8">
      <!-- 解析工具区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <div class="space-y-6">
          <!-- 解析接口选择 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                <i class="fas fa-server mr-2"></i>
                选择解析接口
              </label>
              <div class="flex items-center space-x-2">
                <button @click="switchInterface('prev')" class="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                  title="上一个接口">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button @click="switchInterface('next')" class="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                  title="下一个接口">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div v-for="[url, name, tag, type] in parseInterfaces" :key="url"
                @click="selectedInterface = url; currentInterfaceIndex = parseInterfaces.findIndex(item => item[0] === url)"
                :class="[
                  'p-3 border-2 rounded-lg cursor-pointer transition-all duration-200',
                  selectedInterface === url
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                ]">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">{{ name }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span :class="[
                        'px-2 py-1 rounded-full text-xs',
                        type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          type === 'primary' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            type === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              type === 'info' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      ]">{{ tag }}</span>
                    </div>
                  </div>
                  <i v-if="selectedInterface === url" class="fas fa-check-circle text-blue-500"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- 视频地址输入 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                <i class="fas fa-link mr-2"></i>
                视频播放地址
              </label>
              <div class="flex items-center space-x-2">
                <button @click="pasteFromClipboard"
                  class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="粘贴剪贴板">
                  <i class="fas fa-paste mr-1"></i>粘贴
                </button>
                <button @click="showHistory = !showHistory"
                  class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="播放历史">
                  <i class="fas fa-history mr-1"></i>历史
                </button>
              </div>
            </div>
            <div class="relative">
              <input v-model="videoUrl" type="text" placeholder="输入视频播放地址，如：https://v.youku.com/v_show/id_xxxx" :class="[
                'w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors',
                isValidUrl || !videoUrl ? 'border-gray-300 dark:border-gray-600' : 'border-red-300 dark:border-red-600'
              ]" @keyup="handleKeyup" />
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                <i v-if="isValidUrl && videoUrl" class="fas fa-check-circle text-green-500"></i>
                <i v-else-if="!isValidUrl && videoUrl" class="fas fa-exclamation-circle text-red-500"></i>
                <button v-if="videoUrl" @click="clearInput"
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <!-- 播放历史下拉 -->
            <div v-if="showHistory && playHistory.length > 0"
              class="mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <div class="p-3 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">播放历史</span>
                <button @click="clearHistory" class="text-xs text-red-500 hover:text-red-700">清空</button>
              </div>
              <div v-for="(item, index) in playHistory" :key="index" @click="playFromHistory(item)"
                class="p-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0">
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ item.title }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ item.url }}</div>
                    <div class="text-xs text-gray-400 dark:text-gray-500">{{ item.interfaceName }} • {{ new
                      Date(item.timestamp).toLocaleString() }}</div>
                  </div>
                  <i class="fas fa-play text-blue-500 ml-2"></i>
                </div>
              </div>
            </div>

            <!-- 常用网站示例 -->
            <div class="mt-3">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">常用网站示例：</div>
              <div class="flex flex-wrap gap-2">
                <button v-for="example in videoExamples" :key="example.name" @click="fillExample(example)"
                  class="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <i :class="example.icon" class="mr-1"></i>{{ example.name }}
                </button>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button @click="playVideo" :disabled="isLoading || !videoUrl" :class="[
              'flex-1 font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center',
              isLoading || !videoUrl
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5',
              'text-white'
            ]">
              <i v-if="isLoading" class="fas fa-spinner fa-spin mr-2"></i>
              <i v-else class="fas fa-play mr-2"></i>
              {{ isLoading ? '解析中...' : '立即播放' }}
            </button>
            <button @click="openInNewWindow" :disabled="!videoUrl" :class="[
              'flex-1 font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center',
              !videoUrl
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5',
              'text-white'
            ]">
              <i class="fas fa-external-link-alt mr-2"></i>
              新窗口播放
            </button>
          </div>
        </div>
      </div>

      <!-- 视频播放区域 -->
      <div v-if="iframeUrl" id="video-player" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            <i class="fas fa-play-circle text-blue-600 mr-2"></i>
            正在播放
          </h3>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ currentInterfaceName }}</span>
            <button @click="switchInterface('prev')"
              class="p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="切换到上一个接口">
              <i class="fas fa-step-backward"></i>
            </button>
            <button @click="switchInterface('next')"
              class="p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="切换到下一个接口">
              <i class="fas fa-step-forward"></i>
            </button>
            <button @click="toggleFullscreen"
              class="p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="全屏播放">
              <i :class="isFullscreen ? 'fas fa-compress' : 'fas fa-expand'"></i>
            </button>
          </div>
        </div>

        <div class="relative">
          <div class="aspect-video bg-black rounded-lg overflow-hidden relative">
            <!-- 加载状态 -->
            <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
              <div class="text-center text-white">
                <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
                <div>正在解析视频...</div>
              </div>
            </div>

            <iframe :src="iframeUrl" class="w-full h-full" frameborder="0" allowfullscreen webkitallowfullscreen
              mozallowfullscreen @load="isLoading = false">
            </iframe>
          </div>

          <!-- 播放器控制提示 -->
          <div class="mt-3 text-center">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              <i class="fas fa-lightbulb mr-1"></i>
              提示：如果无法播放，请尝试切换其他解析接口或刷新页面
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷操作区域 -->
      <div v-if="!iframeUrl"
        class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-8">
        <div class="text-center">
          <div class="text-6xl text-blue-500 mb-4">
            <i class="fas fa-video"></i>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">开始您的观影之旅</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">输入视频地址，选择解析接口，即可免费观看VIP视频</p>

          <!-- 快速示例 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div v-for="example in videoExamples" :key="example.name" @click="fillExample(example)"
              class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500">
              <div class="text-center">
                <i :class="example.icon" class="text-2xl text-blue-500 mb-2"></i>
                <div class="font-medium text-gray-900 dark:text-white">{{ example.name }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">点击填入示例</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 使用说明和功能介绍 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 使用说明 -->
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
          <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            <i class="fas fa-info-circle mr-2"></i>
            使用说明
          </h3>
          <div class="text-blue-800 dark:text-blue-200 space-y-3">
            <div class="flex items-start">
              <i class="fas fa-check-circle text-green-500 mr-2 mt-1 flex-shrink-0"></i>
              <span>支持解析爱奇艺、腾讯视频、优酷、芒果TV、哔哩哔哩等主流视频平台</span>
            </div>
            <div class="flex items-start">
              <i class="fas fa-check-circle text-green-500 mr-2 mt-1 flex-shrink-0"></i>
              <span>请复制完整的视频播放页面地址，不是视频文件地址</span>
            </div>
            <div class="flex items-start">
              <i class="fas fa-check-circle text-green-500 mr-2 mt-1 flex-shrink-0"></i>
              <span>如果当前接口无法播放，可快速切换其他解析接口</span>
            </div>
            <div class="flex items-start">
              <i class="fas fa-check-circle text-green-500 mr-2 mt-1 flex-shrink-0"></i>
              <span>支持全屏播放，提供更好的观看体验</span>
            </div>
            <div class="flex items-start">
              <i class="fas fa-exclamation-triangle text-yellow-500 mr-2 mt-1 flex-shrink-0"></i>
              <span>本服务仅供学习交流使用，请支持正版内容</span>
            </div>
          </div>
        </div>

        <!-- 功能特色 -->
        <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
          <h3 class="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">
            <i class="fas fa-star mr-2"></i>
            功能特色
          </h3>
          <div class="text-green-800 dark:text-green-200 space-y-3">
            <div class="flex items-start">
              <i class="fas fa-rocket text-blue-500 mr-2 mt-1 flex-shrink-0"></i>
              <span>多接口智能切换，确保播放成功率</span>
            </div>
            <div class="flex items-start">
              <i class="fas fa-history text-purple-500 mr-2 mt-1 flex-shrink-0"></i>
              <span>播放历史记录，快速重播喜爱内容</span>
            </div>
            <div class="flex items-start">
              <i class="fas fa-clipboard text-orange-500 mr-2 mt-1 flex-shrink-0"></i>
              <span>一键粘贴剪贴板，操作更便捷</span>
            </div>
            <div class="flex items-start">
              <i class="fas fa-expand-arrows-alt text-red-500 mr-2 mt-1 flex-shrink-0"></i>
              <span>支持全屏播放，沉浸式观看体验</span>
            </div>
            <div class="flex items-start">
              <i class="fas fa-mobile-alt text-indigo-500 mr-2 mt-1 flex-shrink-0"></i>
              <span>响应式设计，完美适配各种设备</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 自定义样式 */
.aspect-video {
  aspect-ratio: 16 / 9;
}

/* 全屏样式 */
#video-player:fullscreen {
  background: black;
  padding: 0;
}

#video-player:fullscreen .aspect-video {
  height: 100vh;
  border-radius: 0;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .flex-col {
    flex-direction: column;
  }

  .grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

/* 按钮悬停效果 */
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 加载动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fa-spin {
  animation: spin 1s linear infinite;
}
</style>
