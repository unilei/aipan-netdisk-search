<script setup>
import { ref, onMounted, withDirectives, vModelSelect } from 'vue'
import { ElMessage } from 'element-plus'

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
    { property: "og:image", content: "/logo.png" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: "/logo.png" }
  ]
})

definePageMeta({
  layout: "default"
})

// 解析接口配置
const parseInterfaces = [
  ['https://jx.xmflv.com/?url=', '虾米解析接口'],
  ['https://im1907.top/?jx=', 'M1907解析接口'],
  ['https://jx.xymp4.cc/?url=', '咸鱼解析接口'],
  ['https://jx.2s0cn/player/?url=', '极速解析接口'],
  ['https://jx.playerjy.com/?url=', 'PlayerJY解析接口']
]

// 响应式数据
const selectedInterface = ref('')
const videoUrl = ref('')
const iframeUrl = ref('')

// 从localStorage获取保存的数据
onMounted(() => {
  const savedInterface = localStorage.getItem('jxjiekou')
  const savedUrl = localStorage.getItem('jxurl')
  
  selectedInterface.value = savedInterface || parseInterfaces[0][0]
  videoUrl.value = savedUrl || ''
  
  // 设置页面标题
  document.title = 'VIP视频解析 - AIPAN.ME'
})

// 播放视频
const playVideo = () => {
  if (!selectedInterface.value || !videoUrl.value) {
    ElMessage.warning('请选择解析接口并输入视频地址')
    return
  }
  
  iframeUrl.value = selectedInterface.value + videoUrl.value
  localStorage.setItem('jxjiekou', selectedInterface.value)
  localStorage.setItem('jxurl', videoUrl.value)
  
  ElMessage.success('开始解析播放')
}

// 新窗口打开
const openInNewWindow = () => {
  if (!selectedInterface.value || !videoUrl.value) {
    ElMessage.warning('请选择解析接口并输入视频地址')
    return
  }
  
  localStorage.setItem('jxjiekou', selectedInterface.value)
  localStorage.setItem('jxurl', videoUrl.value)
  window.open(selectedInterface.value + videoUrl.value)
}

// 清空输入
const clearInput = () => {
  videoUrl.value = ''
  iframeUrl.value = ''
}

// 处理回车键
const handleKeyup = (event) => {
  if (event.key === 'Enter') {
    playVideo()
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <i class="fas fa-server mr-2"></i>
              选择解析接口
            </label>
            <select 
              v-model="selectedInterface"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
            >
              <option v-for="[url, name] in parseInterfaces" :key="url" :value="url">
                {{ name }}
              </option>
            </select>
          </div>

          <!-- 视频地址输入 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <i class="fas fa-link mr-2"></i>
              视频播放地址
            </label>
            <div class="relative">
              <input
                v-model="videoUrl"
                type="text"
                placeholder="输入视频播放地址，如：https://v.youku.com/v_show/id_xxxx"
                class="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                @keyup="handleKeyup"
              />
              <button
                v-if="videoUrl"
                @click="clearInput"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              @click="playVideo"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <i class="fas fa-play mr-2"></i>
              立即播放
            </button>
            <button
              @click="openInNewWindow"
              class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <i class="fas fa-external-link-alt mr-2"></i>
              新窗口播放
            </button>
          </div>
        </div>
      </div>

      <!-- 视频播放区域 -->
      <div v-if="iframeUrl" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <div class="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            :src="iframeUrl"
            class="w-full h-full"
            frameborder="0"
            allowfullscreen
            webkitallowfullscreen
            mozallowfullscreen
          ></iframe>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
        <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          <i class="fas fa-info-circle mr-2"></i>
          使用说明
        </h3>
        <div class="text-blue-800 dark:text-blue-200 space-y-2">
          <p>• 本站支持解析爱奇艺、腾讯视频、优酷、乐视、芒果TV、搜狐、土豆、PPTV、华数TV、ACFUN、哔哩哔哩、M3U8、1905电影、酷6、56视频等网站视频</p>
          <p>• 请复制完整的视频播放页面地址，不是视频文件地址</p>
          <p>• 如果当前接口无法播放，请尝试切换其他解析接口</p>
          <p>• 本服务仅供学习交流使用，请支持正版内容</p>
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

/* 移动端优化 */
@media (max-width: 640px) {
  .flex-col {
    flex-direction: column;
  }
}
</style>
