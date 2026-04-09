<script setup lang="ts">
const route = useRoute();

const status = ref<"loading" | "success" | "error">("loading");
const message = ref("正在验证邮箱，请稍候...");

const verifyEmail = async () => {
  const token = String(route.query.token || "");

  if (!token) {
    status.value = "error";
    message.value = "缺少验证参数，请重新打开邮件中的链接。";
    return;
  }

  try {
    const res = await $fetch<{ code: number; msg: string }>("/api/user/email/verify", {
      method: "POST",
      body: {
        token,
      },
    });

    if (res.code === 200) {
      status.value = "success";
      message.value = res.msg || "邮箱激活成功，请返回登录。";
      return;
    }

    status.value = "error";
    message.value = res.msg || "邮箱验证失败";
  } catch (error) {
    console.error("邮箱验证失败:", error);
    status.value = "error";
    message.value = "邮箱验证失败，请稍后重试。";
  }
};

onMounted(() => {
  verifyEmail();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 py-16 dark:bg-gray-900">
    <div class="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
      <div
        class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
        :class="{
          'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300': status === 'loading',
          'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300': status === 'success',
          'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300': status === 'error',
        }"
      >
        <i
          :class="{
            'fa-solid fa-circle-notch fa-spin': status === 'loading',
            'fa-solid fa-circle-check': status === 'success',
            'fa-solid fa-circle-xmark': status === 'error',
          }"
          class="text-2xl"
        ></i>
      </div>

      <h1 class="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
        邮箱验证
      </h1>
      <p class="text-sm leading-6 text-gray-600 dark:text-gray-300">
        {{ message }}
      </p>

      <div class="mt-8 flex justify-center gap-3">
        <NuxtLink
          to="/login"
          class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          返回登录
        </NuxtLink>
        <NuxtLink
          to="/"
          class="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          返回首页
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
