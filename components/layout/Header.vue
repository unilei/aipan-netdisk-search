<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useColorMode } from "#imports";
import { useUserStore } from "~/stores/user";
import UserMenu from "~/components/common/UserMenu.vue";
import { useI18n } from "vue-i18n";

const colorMode = useColorMode();
const router = useRouter();
const userStore = useUserStore();
const isHeaderFixed = ref(false);
const headerHeight = ref(0);
const headerRef = ref(null);
const { t, locale, locales, setLocale } = useI18n();

// 获取可用的语言列表（当前语言除外）
const availableLocales = computed(() => {
  return (locales.value).filter(i => i.code !== locale.value);
});

// 切换语言功能
const switchLanguage = (localeCode) => {
  setLocale(localeCode);
};

const goHome = () => {
  router.push("/");
};

// 导航菜单
const navItems = [
  {
    name: "header.navItems.music",
    path: "/music",
    icon: {
      light: "fa-solid fa-music",
      dark: "fa-solid fa-music",
    },
  },
  {
    name: "header.navItems.blog",
    path: "/blog",
    icon: {
      light: "fa-solid fa-blog",
      dark: "fa-solid fa-blog",
    },
  },
  {
    name: "header.navItems.forum",
    path: "/forum",
    icon: {
      light: "fa-solid fa-comments",
      dark: "fa-solid fa-comments",
    },
  },
  {
    name: "header.navItems.chat",
    path: "/chat",
    icon: {
      light: "fa-solid fa-message",
      dark: "fa-solid fa-message",
    },
  },
  {
    name: "header.navItems.games",
    path: "/games",
    icon: {
      light: "fa-solid fa-gamepad",
      dark: "fa-solid fa-gamepad",
    },
  },
];

// 监听滚动事件
const handleScroll = () => {
  if (!headerRef.value) return;

  if (!headerHeight.value) {
    headerHeight.value = headerRef.value.offsetHeight;
  }

  if (window.scrollY > 10) {
    isHeaderFixed.value = true;
  } else {
    isHeaderFixed.value = false;
  }
};

const headerClass = computed(() => {
  return {
    "border-b border-gray-200 dark:border-gray-700/50 backdrop-blur-sm bg-white/80 dark:bg-gray-700 z-[3000]": true,
    "fixed top-0 left-0 right-0 shadow-sm": isHeaderFixed.value,
    relative: !isHeaderFixed.value,
  };
});

onMounted(() => {
  userStore.fetchUser();
  window.addEventListener("scroll", handleScroll);

  if (headerRef.value) {
    headerHeight.value = headerRef.value.offsetHeight;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div>
    <header ref="headerRef" :class="headerClass">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo 区域 -->
          <div
            class="flex cursor-pointer items-center justify-center gap-2 md:gap-2 hover:scale-105 transition-transform duration-300"
            @click="goHome()">
            <img class="w-6 h-6 md:w-12 md:h-12 dark:opacity-90" src="@/assets/my-logo.png" alt="logo" />
            <div class="text-left">
              <h1
                class="text-xs md:text-sm font-bold bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                AIPAN.ME
              </h1>
              <p class="text-gray-600 text-[10px] md:text-xs dark:text-gray-400">
                {{ $t('subtitle') }}
              </p>
            </div>
          </div>

          <!-- 导航和工具区域 -->
            <div class="flex items-center space-x-4">
              <!-- 导航菜单 -->
              <nav class="hidden sm:flex items-center space-x-4">
                <nuxt-link v-for="item in navItems" :key="item.path" :to="item.path"
                  class="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-300 dark:hover:bg-gray-800/80">
                  <i :class="colorMode.preference === 'light'
                    ? item.icon.light
                    : item.icon.dark
                    " class="mr-2 transition-opacity duration-200 dark:opacity-90"></i>
                  {{ $t(item.name) }}
                </nuxt-link>
              </nav>

              <client-only>
              <!-- 语言切换按钮 -->
              <div class="hidden sm:flex items-center space-x-2">
                <button v-for="loc in availableLocales" :key="loc.code"
                  class="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
                  @click="switchLanguage(loc.code)">
                  {{ $t(`language.${loc.code}`) }}
                </button>
              </div>

              <!-- 主题切换按钮 -->
              <button
                class="p-2 rounded-lg transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-300 dark:hover:bg-gray-800/80"
                @click="
                  colorMode.preference =
                  colorMode.preference === 'dark' ? 'light' : 'dark'
                  ">
                <i v-if="colorMode.preference === 'dark'"
                  class="fa-solid fa-sun transition-transform duration-300 hover:rotate-90"></i>
                <i v-else class="fa-solid fa-moon transition-transform duration-300 hover:rotate-90"></i>
              </button>
              <!-- 用户菜单 -->
              <UserMenu />
              </client-only>
            </div>
        </div>
      </div>
    </header>
    <!-- 当header固定时，添加一个占位元素避免内容跳动 -->
    <div v-if="isHeaderFixed" :style="`height: ${headerHeight}px`"></div>
  </div>
</template>

<style scoped>
@import "tailwindcss" reference;

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
