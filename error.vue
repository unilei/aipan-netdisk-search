<script setup>
const error = useError()

// SEO 配置
useHead({
  title: `${error.value?.statusCode || 404} - 页面未找到 - 爱盼 - aipan.me`,
  meta: [
    { name: 'robots', content: 'noindex,nofollow' }
  ]
})

// 根据错误类型显示不同信息
const errorInfo = computed(() => {
  const statusCode = error.value?.statusCode || 404
  
  const errorMap = {
    404: {
      title: '页面走失了',
      description: '抱歉，您访问的页面不存在或已被移除',
      icon: 'fa-ghost',
      suggestions: [
        '检查URL是否正确',
        '返回首页重新开始',
        '使用搜索功能查找内容'
      ]
    },
    500: {
      title: '服务器开小差了',
      description: '抱歉，服务器遇到了一些问题',
      icon: 'fa-server',
      suggestions: [
        '刷新页面重试',
        '稍后再试',
        '联系管理员'
      ]
    },
    403: {
      title: '访问被拒绝',
      description: '抱歉，您没有权限访问此页面',
      icon: 'fa-lock',
      suggestions: [
        '检查是否已登录',
        '确认访问权限',
        '联系管理员'
      ]
    }
  }
  
  return errorMap[statusCode] || errorMap[404]
})

// 快捷链接
const quickLinks = [
  { name: '首页', path: '/', icon: 'fa-home' },
  { name: '导航', path: '/nav', icon: 'fa-compass' },
]

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    navigateTo('/')
  }
}

// 清除错误并返回首页
const handleClearError = () => {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center p-4 overflow-hidden relative">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-20 left-10 w-72 h-72 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-300/10 dark:bg-pink-500/5 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
    </div>

    <!-- 主要内容 -->
    <div class="relative z-10 w-full max-w-4xl">
      <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-12 border border-gray-200/50 dark:border-gray-700/50">
        <!-- 错误代码和图标 -->
        <div class="text-center mb-8">
          <div class="inline-block relative">
            <!-- 错误代码 -->
            <h1 class="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-linear-to-r from-purple-600 via-blue-600 to-pink-600 dark:from-purple-400 dark:via-blue-400 dark:to-pink-400 mb-4 animate-pulse">
              {{ error?.statusCode || 404 }}
            </h1>
            
            <!-- 浮动图标 -->
            <div class="absolute -top-4 -right-4 w-20 h-20 bg-linear-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <i :class="['fas', errorInfo.icon, 'text-white text-3xl']"></i>
            </div>
          </div>
        </div>

        <!-- 错误信息 -->
        <div class="text-center mb-8 space-y-3">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
            {{ errorInfo.title }}
          </h2>
          <p class="text-base sm:text-lg text-gray-600 dark:text-gray-300">
            {{ errorInfo.description }}
          </p>
          
          <!-- 错误详情（开发环境） -->
          <div v-if="error?.message" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <p class="text-sm text-red-600 dark:text-red-400 font-mono">
              {{ error.message }}
            </p>
          </div>
        </div>

        <!-- 建议 -->
        <div class="mb-8 p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <i class="fas fa-lightbulb text-yellow-500"></i>
            您可以尝试
          </h3>
          <ul class="space-y-2">
            <li v-for="(suggestion, index) in errorInfo.suggestions" :key="index" class="flex items-start gap-3 text-gray-600 dark:text-gray-300">
              <i class="fas fa-check-circle text-green-500 mt-1"></i>
              <span>{{ suggestion }}</span>
            </li>
          </ul>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
          <el-button
            type="primary"
            size="large"
            class="flex-1 rounded-xl! bg-linear-to-r! from-purple-500 to-blue-500 border-none! hover:from-purple-600 hover:to-blue-600 shadow-lg"
            @click="handleClearError"
          >
            <i class="fas fa-home mr-2"></i>
            返回首页
          </el-button>
          
          <el-button
            size="large"
            class="flex-1 rounded-xl! bg-white! dark:bg-gray-700! hover:bg-gray-50! dark:hover:bg-gray-600!"
            @click="goBack"
          >
            <i class="fas fa-arrow-left mr-2"></i>
            返回上一页
          </el-button>
        </div>

        <!-- 快捷链接 -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-8">
          <h3 class="text-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
            或者访问这些页面
          </h3>
          <div class="flex items-center justify-center gap-3 mt-3">
            <nuxt-link
              v-for="link in quickLinks"
              :key="link.path"
              :to="link.path"
              class="group flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 hover:shadow-md hover:scale-105"
            >
              <div class="w-12 h-12 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <i :class="['fas', link.icon, 'text-lg']"></i>
              </div>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                {{ link.name }}
              </span>
            </nuxt-link>
          </div>
        </div>

        <!-- 底部提示 -->
        <div class="mt-8 text-center">
          <p class="text-xs text-gray-400 dark:text-gray-500">
            如果问题持续存在，请
            <nuxt-link to="/about" class="text-purple-600 dark:text-purple-400 hover:underline">
              联系我们
            </nuxt-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 动画优化 */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* 减弱动画支持 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
