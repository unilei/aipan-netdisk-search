<template>
  <div
    class="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300"
  >
    <div class="max-w-[1240px] mx-auto px-4 py-12 sm:py-20">
      <!-- Error State -->
      <div v-if="error" class="flex flex-col items-center justify-center space-y-6">
        <el-icon :size="64" class="text-red-500">
          <Warning />
        </el-icon>
        <div class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 text-center">
          {{ error }}
        </div>
        <el-button type="primary" @click="goBack">返回首页</el-button>
      </div>

      <!-- Normal State -->
      <div v-else class="flex flex-col items-center justify-center space-y-6 sm:space-y-8">
        <!-- Loading Animation -->
        <div class="relative w-12 h-12 sm:w-16 sm:h-16">
          <div class="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
          <div
            class="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"
          ></div>
        </div>

        <!-- Title -->
        <div class="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-200 text-center">
          正在离开【爱盼迷 - aipan.me】
        </div>

        <!-- Target URL Display -->
        <div class="w-full max-w-2xl">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-2 text-center">
            目标链接：
          </div>
          <div
            class="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div class="text-xs sm:text-sm text-gray-700 dark:text-gray-300 break-all text-center">
              {{ displayUrl }}
            </div>
          </div>
        </div>

        <!-- Countdown Progress -->
        <div class="w-full max-w-md space-y-2">
          <div class="text-center">
            <span class="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
              {{ countdown }}
            </span>
            <span class="text-sm sm:text-base text-gray-600 dark:text-gray-400 ml-2">
              秒后自动跳转
            </span>
          </div>
          <el-progress
            :percentage="progressPercentage"
            :show-text="false"
            :stroke-width="8"
            color="#9333ea"
          />
        </div>

        <!-- Disclaimer -->
        <div class="w-full max-w-2xl bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 sm:p-6 backdrop-blur-sm border border-yellow-200 dark:border-yellow-800">
          <div class="flex items-start space-x-3">
            <div class="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <p class="font-medium text-gray-800 dark:text-gray-200">
                ⚠️ 重要提示
              </p>
              <p>
                • 全站链接通过开源搜索API获取，本站不存储、控制、传播任何文件
              </p>
              <p>
                • 跳转至官方网盘，文件安全性需自行判断，切勿打开可疑文件
              </p>
              <p>
                • 本站作为非营利性开源项目，无任何收费行为，请勿向任何人付款
              </p>
              <p class="text-red-600 dark:text-red-400 font-medium">
                • 如发现违规内容，请立即向网盘官方举报
              </p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <el-button size="large" @click="goBack">
            <i class="fas fa-home mr-2"></i>
            返回首页
          </el-button>
          <el-button type="primary" size="large" @click="handleRedirect">
            <i class="fas fa-external-link-alt mr-2"></i>
            立即跳转 ({{ countdown }}s)
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Warning } from '@element-plus/icons-vue'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

// 页面配置
definePageMeta({
  layout: 'none'
})

// SEO 配置
useHead({
  title: '页面跳转中 - 爱盼迷 - aipan.me',
  meta: [
    { name: 'description', content: '正在跳转到外部链接，请注意网络安全' },
    { name: 'robots', content: 'noindex,nofollow' }
  ]
})

const route = useRoute()
const router = useRouter()

// 状态管理
const countdown = ref(5) // 改为5秒，更合理的等待时间
const initialCountdown = 5
const targetUrl = ref('')
const error = ref('')
const isRedirecting = ref(false)

// URL 显示优化（截取过长的 URL）
const displayUrl = computed(() => {
  if (!targetUrl.value) return ''
  if (targetUrl.value.length > 100) {
    return targetUrl.value.substring(0, 100) + '...'
  }
  return targetUrl.value
})

// 进度百分比
const progressPercentage = computed(() => {
  return ((initialCountdown - countdown.value) / initialCountdown) * 100
})

// URL 验证函数
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  
  try {
    const urlObj = new URL(url)
    // 只允许 http 和 https 协议
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false
    }
    // 防止跳转到本地地址
    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(urlObj.hostname)) {
      return false
    }
    return true
  } catch {
    return false
  }
}

// 定时器引用
let timerInterval = null

// 开始倒计时
const startCountdown = () => {
  timerInterval = setInterval(() => {
    countdown.value--
    
    if (countdown.value <= 0) {
      clearInterval(timerInterval)
      timerInterval = null
      handleRedirect()
    }
  }, 1000)
}

// 处理跳转
const handleRedirect = () => {
  if (isRedirecting.value) return
  
  isRedirecting.value = true
  
  try {
    if (!targetUrl.value) {
      throw new Error('目标链接为空')
    }
    
    // 打开新窗口
    const newWindow = window.open(targetUrl.value, '_blank', 'noopener,noreferrer')
    
    // 检查是否被浏览器阻止
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      ElMessage.warning('弹窗被浏览器阻止，请允许弹窗后重试')
      isRedirecting.value = false
      return
    }
    
    // 跳转成功，延迟关闭当前页面
    setTimeout(() => {
      // 尝试关闭当前标签页
      window.close()
      // 如果无法关闭（某些浏览器限制），则返回首页
      setTimeout(() => {
        router.replace('/')
      }, 100)
    }, 500)
    
  } catch (err) {
    console.error('跳转失败:', err)
    ElMessage.error('跳转失败，请手动复制链接')
    isRedirecting.value = false
  }
}

// 返回首页
const goBack = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  router.replace('/')
}

// 组件挂载
onMounted(() => {
  try {
    // 获取目标 URL
    const url = route.query.url
    
    if (!url) {
      error.value = '缺少跳转链接参数'
      return
    }
    
    // 解码 URL
    const decodedUrl = decodeURIComponent(url)
    
    // 验证 URL
    if (!isValidUrl(decodedUrl)) {
      error.value = '无效的跳转链接'
      return
    }
    
    targetUrl.value = decodedUrl
    
    // 开始倒计时
    startCountdown()
    
  } catch (err) {
    console.error('初始化失败:', err)
    error.value = '页面初始化失败'
  }
})

// 组件卸载前清理
onBeforeUnmount(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
})

// 监听页面可见性变化（用户切换标签页时暂停倒计时）
if (import.meta.client) {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
      }
    } else {
      if (!timerInterval && countdown.value > 0 && !error.value) {
        startCountdown()
      }
    }
  }
  
  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })
  
  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })
}
</script>

<style scoped>
@import "tailwindcss" reference;
</style>