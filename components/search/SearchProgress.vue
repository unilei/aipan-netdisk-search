<template>
  <div
    class="w-full sm:flex-1 flex items-center gap-4 bg-white/50 dark:bg-gray-700/50 rounded-xl p-3 transition-all duration-300 backdrop-blur-sm ring-1 ring-gray-200/50 dark:ring-gray-700/50 shadow-sm group">
    <div class="flex-1 relative overflow-hidden rounded-md">
      <el-progress :percentage="Math.round(
        (loadingProgress.completed / loadingProgress.total) * 100
      )
        " :stroke-width="6" :show-text="false" class="flex-1">
      </el-progress>
      <div
        class="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer">
      </div>
    </div>
    <span
      class="text-sm text-purple-600 dark:text-purple-400 font-medium whitespace-nowrap flex items-center gap-2">
      <i class="fas fa-spinner fa-spin group-hover:animate-bounce"></i>
      搜索中...
      <span class="font-semibold">{{ loadingProgress.completed }}/{{
        loadingProgress.total
      }}</span>
    </span>
  </div>
</template>

<script setup>
defineProps({
  loadingProgress: {
    type: Object,
    required: true,
    default: () => ({
      total: 0,
      completed: 0,
      isLoading: false
    })
  }
})
</script>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
</style>
