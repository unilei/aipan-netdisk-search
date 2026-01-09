<template>
  <div
    class="min-h-[calc(100vh-194px)] flex items-center justify-center bg-gray-100 dark:bg-gray-900"
  >
    <div
      class="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
    >
      <div class="flex flex-row items-center justify-center gap-3 mb-8">
        <a href="/">
          <img
            class="w-[40px] h-[40px]"
            src="@/assets/my-logo.png"
            alt="logo"
          />
        </a>
        <h1
          class="text-2xl font-bold text-center text-gray-900 dark:text-white"
        >
          音乐搜索验证
        </h1>
      </div>

      <div class="space-y-4">
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >请输入访问密码</label
          >
          <input
            type="password"
            v-model="password"
            @keyup.enter="handleSubmit"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="请输入密码"
          />
        </div>

        <div v-if="error" class="text-red-500 dark:text-red-400 text-sm">
          {{ error }}
        </div>

        <button
          @click="handleSubmit"
          :disabled="loading"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="loading" class="mr-2">
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </span>
          {{ loading ? "验证中..." : "验证" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { simpleEncode } from "~/utils/index.js";

const password = ref("");
const error = ref("");
const loading = ref(false);

// Check if music verification is enabled on page load
onMounted(async () => {
  try {
    const response = await $fetch("/api/music/password");
    const { enabled } = response.data || {};

    // If music verification is disabled, redirect directly to music page
    if (!enabled) {
      navigateTo("/music");
    }
  } catch (error) {
    console.error("Failed to check music verification status:", error);
  }
});

const handleSubmit = async () => {
  if (!password.value) {
    error.value = "请输入密码";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    // Get current password and enabled status from database
    const response = await $fetch("/api/music/password");
    const { password: currentPassword, enabled } = response.data || {};

    // If music verification is disabled, redirect directly to music page
    if (!enabled) {
      navigateTo("/music");
      return;
    }

    if (password.value !== (currentPassword || "aipan.me2026")) {
      error.value = "密码错误";
      return;
    }

    // Set encoded password in cookie
    const musicAuth = useCookie("music-auth");
    musicAuth.value = simpleEncode(password.value);

    // Redirect to music page
    navigateTo("/music");
  } catch (error) {
    console.error("验证失败:", error);
    error.value = "验证失败，请重试";
  } finally {
    loading.value = false;
  }
};
</script>
