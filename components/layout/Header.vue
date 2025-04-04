<script setup>
const colorMode = useColorMode();
const router = useRouter();

const goHome = () => {
  router.push("/");
};

// 导航菜单
const navItems = [
  {
    name: "音乐",
    path: "/music",
    icon: {
      light: "fa-solid fa-music",
      dark: "fa-solid fa-music",
    },
  },
  {
    name: "博客",
    path: "/blog",
    icon: {
      light: "fa-solid fa-blog",
      dark: "fa-solid fa-blog",
    },
  },
  {
    name: "论坛",
    path: "/forum",
    icon: {
      light: "fa-solid fa-comments",
      dark: "fa-solid fa-comments",
    },
  },
];
</script>

<template>
  <el-affix :z-index="3000">
    <header class="border-b border-gray-200 dark:border-gray-700/50 backdrop-blur-sm bg-white/80 dark:bg-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo 区域 -->
          <div
            class="flex cursor-pointer items-center justify-center gap-2 md:gap-2 hover:scale-105 transition-transform duration-300"
            @click="goHome()">
            <img class="w-6 h-6 md:w-12 md:h-12 dark:opacity-90" src="@/assets/my-logo.png" alt="logo" />
            <div class="text-left">
              <h1
                class="text-xs md:text-sm text-gray-800 font-bold dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                AIPAN.ME
              </h1>
              <p class="text-gray-600 text-[10px] md:text-xs dark:text-gray-400">
                爱盼 - 资源随心，娱乐无限
              </p>
            </div>
          </div>

          <!-- 导航和工具区域 -->
          <client-only>
            <div class="flex items-center space-x-4">
              <!-- 导航菜单 -->
              <nav class="hidden sm:flex items-center space-x-4">
                <nuxt-link v-for="item in navItems" :key="item.path" :to="item.path"
                  class="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-300 dark:hover:bg-gray-800/80">
                  <i :class="colorMode.preference === 'light' ? item.icon.light : item.icon.dark"
                    class="mr-2 transition-opacity duration-200 dark:opacity-90"></i>
                  {{ item.name }}
                </nuxt-link>
              </nav>

              <!-- 主题切换按钮 -->
              <button
                class="p-2 rounded-lg transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-300 dark:hover:bg-gray-800/80"
                @click="
                  colorMode.preference =
                  colorMode.preference === 'dark' ? 'light' : 'dark'
                  ">
                <i v-if="colorMode.preference === 'dark'"
                  class="fa-solid fa-sun   transition-transform duration-300 hover:rotate-90"></i>
                <i v-else class="fa-solid fa-moon  transition-transform duration-300 hover:rotate-90"></i>
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
  @apply text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-gray-800/80;
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
  content: "";
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

:root.dark .logo-hover::after {
  background: linear-gradient(90deg, #60a5fa, #a78bfa);
}
</style>
