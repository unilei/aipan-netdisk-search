<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useColorMode } from "#imports";
import { useUserStore } from "~/stores/user";
import NotificationIcon from "~/components/NotificationIcon.vue";

const colorMode = useColorMode();
const isMenuOpen = ref(false);
const userStore = useUserStore();
const dropdownVisible = ref(false);
const aboutDropdownVisible = ref(false);
const userMenuRef = ref(null);
const aboutMenuRef = ref(null);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const handleLogout = () => {
  userStore.clearUser();
  navigateTo("/");
};

const closeDropdown = (event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    dropdownVisible.value = false;
  }
  if (aboutMenuRef.value && !aboutMenuRef.value.contains(event.target)) {
    aboutDropdownVisible.value = false;
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
    <div
      class="max-w-[1240px] mx-auto flex flex-row items-center justify-between px-[20px]"
    >
      <!-- Mobile Menu Button -->
      <button
        class="md:hidden text-slate-600 dark:text-white"
        @click="toggleMenu"
      >
        <i v-if="!isMenuOpen" class="fa-solid fa-bars text-base"></i>
        <i v-else class="fa-solid fa-xmark text-base"></i>
      </button>

      <!-- Desktop Navigation -->
      <div class="hidden md:flex flex-row items-center gap-4">
        <nuxt-link to="/" class="text-sm text-slate-600 dark:text-white">
          <i class="fa-solid fa-house"></i> 首页
        </nuxt-link>
        <nuxt-link to="/blog" class="text-sm text-slate-600 dark:text-white">
          <i class="fa-solid fa-book"></i> 博客
        </nuxt-link>
        <nuxt-link to="/forum" class="text-sm text-slate-600 dark:text-white">
          <i class="fa-solid fa-comments"></i> 论坛
        </nuxt-link>
        <nuxt-link to="/tv" class="text-sm text-slate-600 dark:text-white">
          <i class="fa-solid fa-tv"></i> 电视TV
        </nuxt-link>
        <nuxt-link to="/tvbox" class="text-sm text-slate-600 dark:text-white">
          <i class="fa-solid fa-tv"></i> TVbox接口
        </nuxt-link>

        <!-- 关于网站下拉菜单 -->
        <div class="relative" ref="aboutMenuRef">
          <div
            class="flex items-center cursor-pointer group"
            @click.stop="aboutDropdownVisible = !aboutDropdownVisible"
          >
            <span
              class="text-sm text-slate-600 dark:text-white flex items-center"
            >
              <i class="fa-solid fa-circle-info mr-1"></i> 免责声明
              <i
                class="fa-solid fa-chevron-down text-xs group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"
              ></i>
            </span>
          </div>

          <!-- 下拉菜单内容 -->
          <div
            v-show="aboutDropdownVisible"
            class="absolute top-full left-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 border border-gray-100 dark:border-gray-700"
          >
            <nuxt-link
              to="/about"
              class="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="aboutDropdownVisible = false"
            >
              <i class="fa-solid fa-circle-info mr-2"></i> 关于网站
            </nuxt-link>
            <nuxt-link
              to="/disclaimer"
              class="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="aboutDropdownVisible = false"
            >
              <i class="fa-solid fa-shield mr-2"></i> 免责声明
            </nuxt-link>
            <nuxt-link
              to="/copyright"
              class="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="aboutDropdownVisible = false"
            >
              <i class="fa-solid fa-copyright mr-2"></i> 侵权投诉
            </nuxt-link>
          </div>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div
        v-show="isMenuOpen"
        class="md:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-800 shadow-lg"
      >
        <div class="flex flex-col py-2">
          <nuxt-link
            to="/"
            class="px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="isMenuOpen = false"
          >
            <i class="fa-solid fa-house"></i> 首页
          </nuxt-link>
          <nuxt-link
            to="/blog"
            class="px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="isMenuOpen = false"
          >
            <i class="fa-solid fa-book"></i> 我的博客
          </nuxt-link>
          <nuxt-link
            to="/tv"
            class="px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="isMenuOpen = false"
          >
            <i class="fa-solid fa-tv"></i> 电视TV
          </nuxt-link>
          <nuxt-link
            to="/tvbox"
            class="px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="isMenuOpen = false"
          >
            <i class="fa-solid fa-tv"></i> TVbox接口
          </nuxt-link>

          <!-- 移动端关于网站分组标题 -->
          <div
            class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-750"
          >
            <i class="fa-solid fa-circle-info"></i> 关于
          </div>

          <nuxt-link
            to="/about"
            class="px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 pl-8"
            @click="isMenuOpen = false"
          >
            <i class="fa-solid fa-circle-info"></i> 关于网站
          </nuxt-link>
          <nuxt-link
            to="/disclaimer"
            class="px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 pl-8"
            @click="isMenuOpen = false"
          >
            <i class="fa-solid fa-shield"></i> 免责声明
          </nuxt-link>
          <nuxt-link
            to="/copyright"
            class="px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 pl-8"
            @click="isMenuOpen = false"
          >
            <i class="fa-solid fa-copyright"></i> 侵权投诉
          </nuxt-link>
        </div>
      </div>

      <div class="flex flex-row items-center gap-4">
        <client-only>
          <el-button
            v-if="colorMode.preference === 'dark'"
            link
            @click="colorMode.preference = 'light'"
          >
            <i class="fa-solid fa-sun text-base"></i>
          </el-button>
          <el-button
            v-if="colorMode.preference === 'light'"
            link
            @click="colorMode.preference = 'dark'"
          >
            <i class="fa-solid fa-moon text-base"></i>
          </el-button>

          <nuxt-link
            class="text-sm text-slate-600 font-bold dark:text-white"
            href="/music"
            title="音乐搜索小助手"
          >
            <i class="fa-solid fa-music text-base"></i>
          </nuxt-link>

          <!-- 通知组件 -->
          <NotificationIcon v-if="userStore.loggedIn" />

          <!-- 登录按钮 / 用户菜单 -->
          <div class="relative" ref="userMenuRef">
            <!-- 未登录状态显示登录按钮 -->
            <nuxt-link
              v-if="!userStore.loggedIn"
              to="/login"
              class="flex items-center"
            >
              <button
                class="text-gray-600 hover:from-blue-600 hover:to-purple-600 text-sm py-1.5 px-4 rounded-full transition-all duration-300 flex items-center gap-1.5 hover:shadow-md"
              >
                <i class="fa-solid fa-user text-xs"></i>
                <span>登录</span>
              </button>
            </nuxt-link>

            <!-- 已登录状态显示用户头像和下拉菜单 -->
            <div v-else class="flex items-center">
              <div
                class="cursor-pointer flex items-center group"
                @click.stop="dropdownVisible = !dropdownVisible"
              >
                <div
                  class="w-8 h-8 rounded-full overflow-hidden border-2 border-transparent group-hover:border-blue-400 transition-all"
                >
                  <img
                    :src="userStore.userAvatar"
                    class="w-full h-full object-cover"
                    alt="用户头像"
                  />
                </div>
                <i
                  class="fa-solid fa-chevron-down ml-1 text-xs text-slate-600 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"
                ></i>
              </div>

              <!-- 下拉菜单 -->
              <div
                v-show="dropdownVisible"
                class="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <nuxt-link
                  v-if="userStore.isAdmin"
                  to="/admin/dashboard"
                  class="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  @click="dropdownVisible = false"
                >
                  <i class="fa-solid fa-gauge-high mr-2 text-blue-500"></i>
                  管理后台
                </nuxt-link>
                <nuxt-link
                  to="/user/dashboard"
                  class="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  @click="dropdownVisible = false"
                >
                  <i class="fa-solid fa-user mr-2 text-green-500"></i> 个人中心
                </nuxt-link>
                <nuxt-link
                  to="/user/profile"
                  class="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  @click="dropdownVisible = false"
                >
                  <i class="fa-solid fa-gear mr-2 text-purple-500"></i> 账号设置
                </nuxt-link>
                <div
                  class="flex items-center px-4 py-2 text-sm text-red-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  @click="handleLogout"
                >
                  <i class="fa-solid fa-right-from-bracket mr-2"></i> 退出登录
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
.router-link-active {
  @apply text-red-600 dark:text-red-400;
}
</style>
