<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useUserStore } from "~/stores/user";
import NotificationIcon from "~/components/NotificationIcon.vue";

const router = useRouter();
const userStore = useUserStore();
const dropdownVisible = ref(false);
const userMenuRef = ref(null);

// 关闭用户下拉菜单
const closeDropdown = (event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    dropdownVisible.value = false;
  }
};

// 处理登出
const handleLogout = () => {
  dropdownVisible.value = false;
  userStore.clearUser();
  router.push("/");
};

onMounted(() => {
  document.addEventListener("click", closeDropdown);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeDropdown);
});
</script>

<template>
  <client-only>
    <div class="flex items-center space-x-2">
      <!-- 通知组件 -->
      <NotificationIcon v-if="userStore.loggedIn" />

      <!-- 登录按钮 / 用户菜单 -->
      <div class="relative" ref="userMenuRef">
        <!-- 未登录状态显示登录按钮 -->
        <nuxt-link
          v-if="!userStore.loggedIn"
          to="/login"
          class="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-300 dark:hover:bg-gray-800/80"
        >
          <i class="fa-solid fa-user mr-2"></i>
          {{ $t("header.user.login") }}
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
            class="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-9999 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <nuxt-link
              v-if="userStore.isAdmin"
              to="/admin/dashboard"
              class="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="dropdownVisible = false"
            >
              <i class="fa-solid fa-gauge-high mr-2 text-blue-500"></i>
              {{ $t("header.user.admin") }}
            </nuxt-link>
            <nuxt-link
              to="/user/dashboard"
              class="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="dropdownVisible = false"
            >
              <i class="fa-solid fa-user mr-2 text-green-500"></i>
              {{ $t("header.user.dashboard") }}
            </nuxt-link>
            <nuxt-link
              to="/user/checkin"
              class="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="dropdownVisible = false"
            >
              <i class="fa-solid fa-calendar-check mr-2 text-yellow-500"></i>
              签到中心
            </nuxt-link>
            <nuxt-link
              to="/user/profile"
              class="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="dropdownVisible = false"
            >
              <i class="fa-solid fa-gear mr-2 text-purple-500"></i>
              {{ $t("header.user.profile") }}
            </nuxt-link>
            <div
              class="flex items-center px-4 py-2 text-sm text-red-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="handleLogout"
            >
              <i class="fa-solid fa-right-from-bracket mr-2"></i>
              {{ $t("header.user.logout") }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </client-only>
</template>
