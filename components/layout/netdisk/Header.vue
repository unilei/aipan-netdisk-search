<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useColorMode, useRoute } from "#imports";
import { useUserStore } from "~/stores/user";
import NotificationIcon from "~/components/NotificationIcon.vue";
import { useI18n } from "vue-i18n";
import { publicNavigation, isPublicNavItemActive, isPublicNavPathActive } from "~/utils/publicNavigation";

const { t, locale, locales, setLocale } = useI18n();
const colorMode = useColorMode();
const isMenuOpen = ref(false);
const userStore = useUserStore();
const route = useRoute();
const dropdownVisible = ref(false);
const navDropdownVisible = ref("");
const userMenuRef = ref(null);
const navMenuRef = ref(null);
const { latestReleaseTitle, hasUnreadRelease, markReleaseRead } = useReleaseNotice();

// 获取可用的语言列表（当前语言除外）
const availableLocales = computed(() => {
  return (locales.value).filter(i => i.code !== locale.value);
});

// 切换语言功能
const switchLanguage = (localeCode) => {
  setLocale(localeCode);
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const handleLogout = () => {
  userStore.clearUser();
  navigateTo("/");
};

const toggleNavDropdown = (key) => {
  navDropdownVisible.value = navDropdownVisible.value === key ? "" : key;
};

const closeNavDropdown = () => {
  navDropdownVisible.value = "";
};

const handleNavClick = (itemKey = "") => {
  if (itemKey === "releases") {
    markReleaseRead();
  }
  closeNavDropdown();
  isMenuOpen.value = false;
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
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    dropdownVisible.value = false;
  }
  if (navMenuRef.value && !navMenuRef.value.contains(event.target)) {
    closeNavDropdown();
  }
};

onMounted(() => {
  userStore.fetchUser();
  document.addEventListener("click", closeDropdown);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeDropdown);
});
</script>
<template>
  <div class="backdrop-blur py-4 fixed top-0 left-0 w-full z-50">
    <div class="max-w-[1240px] mx-auto flex flex-row items-center justify-between px-[20px]">
      <!-- Mobile Menu Button -->
      <button class="md:hidden text-slate-600 dark:text-white" @click="toggleMenu">
        <i v-if="!isMenuOpen" class="fa-solid fa-bars text-base"></i>
        <i v-else class="fa-solid fa-xmark text-base"></i>
      </button>

      <!-- Desktop Navigation -->
      <nav ref="navMenuRef" class="hidden md:flex flex-row items-center gap-1">
        <div v-for="item in publicNavigation" :key="item.key" class="relative">
          <nuxt-link
            v-if="item.path"
            :to="item.path"
            class="flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-white dark:hover:bg-white/10"
            :class="isNavItemActive(item) ? 'text-blue-600 dark:text-blue-300' : ''"
            @click="handleNavClick(item.key)"
          >
            <i :class="item.icon"></i>
            {{ $t(item.labelKey) }}
          </nuxt-link>

          <template v-else>
            <button
              class="flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-white dark:hover:bg-white/10"
              :class="isNavItemActive(item) || navDropdownVisible === item.key ? 'text-blue-600 dark:text-blue-300' : ''"
              @click.stop="toggleNavDropdown(item.key)"
            >
              <i :class="item.icon"></i>
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
                class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-gray-100 hover:text-slate-950 dark:text-white dark:hover:bg-gray-700"
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

      <!-- Mobile Navigation -->
      <div v-show="isMenuOpen" class="md:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-800 shadow-lg">
        <div class="max-h-[calc(100vh-72px)] overflow-y-auto py-2">
          <template v-for="item in publicNavigation" :key="item.key">
            <nuxt-link
              v-if="item.path"
              :to="item.path"
              class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
              :class="isNavItemActive(item) ? 'text-blue-600 dark:text-blue-300' : ''"
              @click="handleNavClick(item.key)"
            >
              <i :class="item.icon" class="w-4 text-center"></i>
              {{ $t(item.labelKey) }}
            </nuxt-link>

            <div v-else>
              <div class="mt-1 flex items-center gap-2 bg-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-gray-750 dark:text-gray-300">
                <i :class="item.icon"></i>
                {{ $t(item.labelKey) }}
              </div>
              <nuxt-link
                v-for="child in item.children"
                :key="child.key"
                :to="child.path"
                :title="getChildTitle(child)"
                class="flex items-center gap-3 px-8 py-2.5 text-sm text-slate-600 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
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

          <!-- 移动端语言切换按钮 -->
          <div class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-750">
            <i class="fa-solid fa-language"></i> {{ $t('language.switch') }}
          </div>
          <div class="px-4 py-3 flex gap-2">
            <button v-for="loc in availableLocales" :key="loc.code"
              class="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
              @click="switchLanguage(loc.code); isMenuOpen = false">
              {{ $t(`language.${loc.code}`) }}
            </button>
          </div>
        </div>
      </div>

      <div class="flex flex-row items-center gap-4">
        <client-only>
          <!-- 语言切换按钮 (仅桌面显示) -->
          <div class="hidden md:flex items-center mr-2">
            <button v-for="loc in availableLocales" :key="loc.code"
              class="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-all duration-300 hover:bg-gray-200 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-blue-300"
              :aria-label="`${$t('language.switch')}: ${$t(`language.${loc.code}`)}`"
              :title="$t(`language.${loc.code}`)"
              @click="switchLanguage(loc.code)">
              <i class="fa-solid fa-language"></i>
            </button>
          </div>

          <el-button v-if="colorMode.preference === 'dark'" link @click="colorMode.preference = 'light'">
            <i class="fa-solid fa-sun text-base"></i>
          </el-button>
          <el-button v-if="colorMode.preference === 'light'" link @click="colorMode.preference = 'dark'">
            <i class="fa-solid fa-moon text-base"></i>
          </el-button>

          <!-- 通知组件 -->
          <NotificationIcon v-if="userStore.loggedIn" />

          <!-- 登录按钮 / 用户菜单 -->
          <div class="relative" ref="userMenuRef">
            <!-- 未登录状态显示登录按钮 -->
            <nuxt-link v-if="!userStore.loggedIn" to="/login" class="flex items-center">
              <button
                class="text-gray-600 hover:from-blue-600 hover:to-purple-600 text-sm py-1.5 px-4 rounded-full transition-all duration-300 flex items-center gap-1.5 hover:shadow-md">
                <i class="fa-solid fa-user text-xs"></i>
                <span>{{ $t('header.user.login') }}</span>
              </button>
            </nuxt-link>

            <!-- 已登录状态显示用户头像和下拉菜单 -->
            <div v-else class="flex items-center">
              <div class="cursor-pointer flex items-center group" @click.stop="dropdownVisible = !dropdownVisible">
                <div
                  class="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent group-hover:border-blue-400 transition-all">
                  <img :src="userStore.userAvatar" class="w-full h-full object-cover" alt="用户头像" />
                </div>
                <i
                  class="fa-solid fa-chevron-down ml-1 text-xs text-slate-600 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"></i>
              </div>

              <!-- 下拉菜单 -->
              <div v-show="dropdownVisible"
                class="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 border border-gray-100 dark:border-gray-700 overflow-hidden">
                <nuxt-link v-if="userStore.isAdmin" to="/admin/dashboard"
                  class="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  @click="dropdownVisible = false">
                  <i class="fa-solid fa-gauge-high mr-2 text-blue-500"></i>
                  {{ $t('header.user.admin') }}
                </nuxt-link>
                <nuxt-link to="/user/dashboard"
                  class="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  @click="dropdownVisible = false">
                  <i class="fa-solid fa-user mr-2 text-green-500"></i>
                  {{ $t('header.user.dashboard') }}
                </nuxt-link>
                <nuxt-link to="/user/checkin"
                  class="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  @click="dropdownVisible = false">
                  <i class="fa-solid fa-calendar-check mr-2 text-yellow-500"></i>
                  签到中心
                </nuxt-link>
                <nuxt-link to="/user/profile"
                  class="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  @click="dropdownVisible = false">
                  <i class="fa-solid fa-gear mr-2 text-purple-500"></i> {{ $t('header.user.profile') }}
                </nuxt-link>
                <div
                  class="flex items-center px-4 py-2 text-sm text-red-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  @click="handleLogout">
                  <i class="fa-solid fa-right-from-bracket mr-2"></i> {{ $t('header.user.logout') }}
                </div>
              </div>
            </div>
          </div>
        </client-only>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "tailwindcss" reference;

.router-link-active {
  @apply text-red-600 dark:text-red-400;
}
</style>
