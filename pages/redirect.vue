<template>
  <div class="min-h-[calc(100vh-194px)] bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
    <div class="max-w-[1240px] mx-auto px-4 py-20">
      <div class="flex flex-col items-center justify-center space-y-4 sm:space-y-8">
        <!-- Loading Animation -->
        <div class="relative w-8 h-8 sm:w-16 sm:h-16">
          <div class="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
          <div class="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <!-- Title -->
        <div class="text-sm sm:text-2xl font-bold text-gray-800 dark:text-gray-200 text-center">
          即将离开 - 爱盼-资源随心，娱乐无限
        </div>

        <!-- Link -->
        <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-all px-4 text-center max-w-2xl">
          {{ targetUrl }}
        </div>

        <!-- Countdown -->
        <div class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          {{ countdown }}秒后自动跳转...
        </div>

        <!-- Disclaimer -->
        <div class="max-w-2xl bg-white/50 dark:bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
          <div class="flex items-start space-x-3">
            <el-icon class="text-yellow-500 mt-1 flex-shrink-0"><Warning /></el-icon>
            <div class="space-y-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <p>全站链接通过蜘蛛程序收集自网盘分享链接,所有内容均为网络公开资源,以非人工方式自动生成,网站本身不储存、复制、传播、控制编辑任何网盘文件,也不提供下载服务,其链接跳转至官方网盘,文件的有效性和安全性需要您自行判断。</p>
              <p>本站遵守相关法律法规,坚决杜绝一切违规不良信息,如您发现任何涉嫌违规的网盘信息,请立即向网盘官方网站举报</p>
              <p>本站作为非经营性网站,所有服务仅供学习交流使用,无任何收费请求,切勿上当支付。</p>
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex gap-4">
          <el-button type="default" @click="goBack">返回上一页</el-button>
          <el-button type="primary" @click="handleRedirect">同意并立即跳转</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Warning } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const countdown = ref(30)
const targetUrl = ref('')
let timer = null

onMounted(() => {
  // 从 URL 参数中获取目标链接
  targetUrl.value = route.query.url
  if (!targetUrl.value) {
    router.push('/')
    return
  }

  // 开始倒计时
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      handleRedirect()
    }
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})

const handleRedirect = () => {
  if (targetUrl.value) {
    window.open(targetUrl.value, '_blank')
    router.back()
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.el-button {
  @apply font-medium border-none shadow-sm hover:shadow-md relative overflow-hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.el-button:hover {
  transform: translateY(-1px);
}

/* Loading animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style> 