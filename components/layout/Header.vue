<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useColorMode, useRoute } from "#imports";
import { useUserStore } from "~/stores/user";
import UserMenu from "~/components/common/UserMenu.vue";
import { useI18n } from "vue-i18n";
import { publicNavigation, isPublicNavItemActive, isPublicNavPathActive } from "~/utils/publicNavigation";

const colorMode = useColorMode();
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const isHeaderFixed = ref(false);
const isMobileMenuOpen = ref(false);
const navDropdownVisible = ref("");
const headerHeight = ref(0);
const headerRef = ref(null);
const navMenuRef = ref(null);
const { t, locale, locales, setLocale } = useI18n();
const { latestReleaseTitle, hasUnreadRelease, markReleaseRead } = useReleaseNotice();

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

const toggleNavDropdown = (key) => {
  navDropdownVisible.value = navDropdownVisible.value === key ? "" : key;
};

const closeNavDropdown = () => {
  navDropdownVisible.value = "";
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  closeNavDropdown();
};

const handleNavClick = (itemKey = "") => {
  if (itemKey === "releases") {
    markReleaseRead();
  }
  closeNavDropdown();
  isMobileMenuOpen.value = false;
};

const isNavItemActive = (item) => isPublicNavItemActive(route.path, item);

const isNavChildActive = (child) => isPublicNavPathActive(route.path, child.path);

const showReleaseBadge = (key) => key === "releases" && hasUnreadRelease.value;

const getChildTitle = (child) => {
  if (child.key === "releases") return latestReleaseTitle.value || "有新的发布日志";
  if (child.gated) return "需要登录";
  return "";
};

const closeDropdown = (event) => {
  if (navMenuRef.value && !navMenuRef.value.contains(event.target)) {
    closeNavDropdown();
  }
};

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
  document.addEventListener("click", closeDropdown);

  if (headerRef.value) {
    headerHeight.value = headerRef.value.offsetHeight;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
  document.removeEventListener("click", closeDropdown);
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
            <div class="flex items-center space-x-3">
              <!-- 导航菜单 -->
              <nav ref="navMenuRef" class="hidden sm:flex items-center gap-1">
                <div v-for="item in publicNavigation" :key="item.key" class="relative">
                  <nuxt-link
                    v-if="item.path"
                    :to="item.path"
                    class="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800/80 dark:hover:text-blue-300"
                    :class="isNavItemActive(item) ? 'bg-blue-50 text-blue-600 dark:bg-gray-800/80 dark:text-blue-300' : ''"
                    @click="handleNavClick(item.key)"
                  >
                    <i :class="item.icon" class="transition-opacity duration-200 dark:opacity-90"></i>
                    {{ $t(item.labelKey) }}
                  </nuxt-link>

                  <template v-else>
                    <button
                      class="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800/80 dark:hover:text-blue-300"
                      :class="isNavItemActive(item) || navDropdownVisible === item.key ? 'bg-blue-50 text-blue-600 dark:bg-gray-800/80 dark:text-blue-300' : ''"
                      @click.stop="toggleNavDropdown(item.key)"
                    >
                      <i :class="item.icon" class="transition-opacity duration-200 dark:opacity-90"></i>
                      {{ $t(item.labelKey) }}
                      <span
                        v-if="item.key === 'more' && hasUnreadRelease"
                        class="h-2 w-2 rounded-full bg-red-500"
                        :title="latestReleaseTitle || '有新的发布日志'"
                      ></span>
                      <i class="fa-solid fa-chevron-down text-[10px] transition-transform" :class="navDropdownVisible === item.key ? 'rotate-180' : ''"></i>
                    </button>

                    <div
                      v-show="navDropdownVisible === item.key"
                      class="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                    >
                      <nuxt-link
                        v-for="child in item.children"
                        :key="child.key"
                        :to="child.path"
                        :title="getChildTitle(child)"
                        class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-300"
                        :class="isNavChildActive(child) ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300' : ''"
                        @click="handleNavClick(child.key)"
                      >
                        <i :class="child.icon" class="w-4 text-center"></i>
                        <span class="min-w-0 flex-1 truncate">{{ $t(child.labelKey) }}</span>
                        <span
                          v-if="showReleaseBadge(child.key)"
                          class="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                        >
                          NEW
                        </span>
                      </nuxt-link>
                    </div>
                  </template>
                </div>
              </nav>

              <button
                class="sm:hidden rounded-lg p-2 text-gray-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800/80 dark:hover:text-blue-300"
                :aria-label="isMobileMenuOpen ? '关闭菜单' : '打开菜单'"
                @click="toggleMobileMenu"
              >
                <i v-if="!isMobileMenuOpen" class="fa-solid fa-bars"></i>
                <i v-else class="fa-solid fa-xmark"></i>
              </button>

              <client-only>
              <!-- 语言切换按钮 -->
              <div class="hidden sm:flex items-center space-x-2">
                <button v-for="loc in availableLocales" :key="loc.code"
                  class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-all duration-300 hover:bg-gray-200 hover:text-blue-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-blue-300"
                  :aria-label="`${$t('language.switch')}: ${$t(`language.${loc.code}`)}`"
                  :title="$t(`language.${loc.code}`)"
                  @click="switchLanguage(loc.code)">
                  <i class="fa-solid fa-language"></i>
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
      <div
        v-show="isMobileMenuOpen"
        class="sm:hidden border-t border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="max-h-[calc(100vh-64px)] overflow-y-auto py-2">
          <template v-for="item in publicNavigation" :key="item.key">
            <nuxt-link
              v-if="item.path"
              :to="item.path"
              class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-100 dark:hover:bg-gray-700 dark:hover:text-blue-300"
              :class="isNavItemActive(item) ? 'text-blue-600 dark:text-blue-300' : ''"
              @click="handleNavClick(item.key)"
            >
              <i :class="item.icon" class="w-4 text-center"></i>
              {{ $t(item.labelKey) }}
            </nuxt-link>

            <div v-else>
              <div class="mt-1 flex items-center gap-2 bg-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-750 dark:text-gray-300">
                <i :class="item.icon"></i>
                {{ $t(item.labelKey) }}
              </div>
              <nuxt-link
                v-for="child in item.children"
                :key="child.key"
                :to="child.path"
                :title="getChildTitle(child)"
                class="flex items-center gap-3 px-8 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-100 dark:hover:bg-gray-700 dark:hover:text-blue-300"
                :class="isNavChildActive(child) ? 'text-blue-600 dark:text-blue-300' : ''"
                @click="handleNavClick(child.key)"
              >
                <i :class="child.icon" class="w-4 text-center"></i>
                <span class="min-w-0 flex-1 truncate">{{ $t(child.labelKey) }}</span>
                <span
                  v-if="showReleaseBadge(child.key)"
                  class="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                >
                  NEW
                </span>
              </nuxt-link>
            </div>
          </template>

          <div class="mt-1 bg-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-750 dark:text-gray-300">
            <i class="fa-solid fa-language"></i>
            {{ $t('language.switch') }}
          </div>
          <div class="flex gap-2 px-4 py-3">
            <button
              v-for="loc in availableLocales"
              :key="loc.code"
              class="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 transition-all duration-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              @click="switchLanguage(loc.code); isMobileMenuOpen = false"
            >
              {{ $t(`language.${loc.code}`) }}
            </button>
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
