<script setup>
import musicDarkSvg from '~/assets/theme/music-dark.svg'
import musicLightSvg from '~/assets/theme/music-light.svg'
import blogDarkSvg from '~/assets/icons/blog-dark.svg'
import blogLightSvg from '~/assets/icons/blog-light.svg'
const colorMode = useColorMode()
const router = useRouter()

const goHome = () => {
  router.push('/')
}

// 导航菜单
const navItems = [
  {
    name: '音乐',
    path: '/music',
    icon: {
      light: musicDarkSvg,
      dark: musicLightSvg
    }
  },
  {
    name: '博客',
    path: '/blog',
    icon: {
      light: blogLightSvg,
      dark: blogDarkSvg
    }
  }
]
</script>

<template>
  <el-affix :z-index="3000">
    <header class="border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo 区域 -->
          <div class="flex items-center space-x-3" @click="goHome()">
            <img 
              class="w-10 h-10 transition-transform duration-300 hover:scale-110" 
              src="@/assets/my-logo.png" 
              alt="logo"
            >
            <h1 class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
              爱盼-网盘资源搜索
            </h1>
          </div>

          <!-- 导航和工具区域 -->
          <client-only>
            <div class="flex items-center space-x-4">
              <!-- 导航菜单 -->
              <nav class="hidden sm:flex items-center space-x-4">
                <nuxt-link
                  v-for="item in navItems"
                  :key="item.path"
                  :to="item.path"
                  class="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                    text-gray-600 hover:text-blue-600 hover:bg-blue-50
                    dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-700"
                >
                  <img 
                    :src="colorMode.preference === 'light' ? item.icon.light : item.icon.dark"
                    class="w-5 h-5 mr-2"
                    :alt="item.name"
                  >
                  {{ item.name }}
                </nuxt-link>
              </nav>

              <!-- 主题切换按钮 -->
              <button
                class="p-2 rounded-lg transition-colors duration-200
                  text-gray-600 hover:text-blue-600 hover:bg-blue-50
                  dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-700"
                @click="colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'"
              >
                <img 
                  v-if="colorMode.preference === 'dark'"
                  class="w-5 h-5"
                  src="@/assets/theme/entypo--light-up.svg"
                  alt="切换亮色模式"
                >
                <img
                  v-else
                  class="w-5 h-5"
                  src="@/assets/theme/icon-park-solid--dark-mode.svg"
                  alt="切换暗色模式"
                >
              </button>
            </div>
          </client-only>
        </div>
      </div>
    </header>
  </el-affix>
</template>

<style scoped>
.router-link-active {
  @apply text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-gray-700;
}

/* 添加渐变动画 */
@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Logo hover 效果 */
.logo-hover {
  position: relative;
}

.logo-hover::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #9333ea);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.logo-hover:hover::after {
  transform: scaleX(1);
}
</style>