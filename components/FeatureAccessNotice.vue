<template>
  <div
    class="rounded-lg border border-blue-100 bg-white/90 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800/90"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-start gap-4">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
        >
          <i :class="iconClass"></i>
        </div>
        <div>
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">
            {{ title }}
          </h3>
          <p class="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
            {{ message }}
          </p>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <NuxtLink
          v-if="status.reason === 'login'"
          :to="loginPath"
          class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          登录
        </NuxtLink>
        <NuxtLink
          v-if="status.reason === 'points'"
          to="/user/checkin"
          class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          获取积分
        </NuxtLink>
        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          返回首页
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  status: {
    type: Object,
    required: true,
  },
  featureName: {
    type: String,
    default: "该功能",
  },
});

const route = useRoute();

const loginPath = computed(() => {
  return `/login?redirect=${encodeURIComponent(route.fullPath || "/")}`;
});

const iconClass = computed(() => {
  if (props.status.loading) return "fas fa-spinner fa-spin";
  if (props.status.reason === "points") return "fas fa-coins";
  if (props.status.reason === "login") return "fas fa-user-lock";
  return "fas fa-shield-alt";
});

const title = computed(() => {
  if (props.status.loading) return "正在确认访问权限";
  if (props.status.reason === "points") return "积分不足";
  if (props.status.reason === "login") return "请先登录";
  return "暂时无法访问";
});

const message = computed(() => {
  if (props.status.loading) {
    return "正在读取登录状态和积分配置，请稍候。";
  }

  if (props.status.reason === "points") {
    return `${props.featureName}需要至少 ${props.status.requiredPoints} 积分，当前积分 ${props.status.currentPoints}。`;
  }

  if (props.status.reason === "login") {
    return `${props.featureName}需要登录后访问，当前最低积分门槛为 ${props.status.requiredPoints}。`;
  }

  return `${props.featureName}当前不可用，请稍后再试。`;
});
</script>
