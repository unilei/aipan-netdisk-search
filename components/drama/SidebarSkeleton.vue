<script setup>
// 侧边栏骨架屏组件
</script>

<template>
  <div class="p-6 animate-pulse">
    <!-- Logo区域骨架 -->
    <div class="mb-8">
      <div class="flex items-center mb-4">
        <div class="w-12 h-12 bg-stone-300 dark:bg-slate-600 rounded-2xl mr-4"></div>
        <div>
          <div class="h-5 bg-stone-300 dark:bg-slate-600 rounded w-16 mb-2"></div>
          <div class="h-3 bg-stone-200 dark:bg-slate-700 rounded w-20"></div>
        </div>
      </div>
    </div>

    <!-- 搜索区域骨架 -->
    <div class="mb-8">
      <div class="h-12 bg-stone-200 dark:bg-slate-600 rounded-2xl mb-3"></div>
      <div class="h-12 bg-stone-300 dark:bg-slate-600 rounded-xl"></div>
    </div>

    <!-- 视频源选择骨架 -->
    <div class="mb-8">
      <div class="mb-4">
        <div class="h-3 bg-stone-300 dark:bg-slate-600 rounded w-12"></div>
      </div>
      <div class="space-y-2">
        <div v-for="i in 3" :key="i" class="h-12 bg-stone-200 dark:bg-slate-600 rounded-xl"></div>
      </div>
    </div>

    <!-- 影视源配置骨架 -->
    <div class="mb-8">
      <div class="mb-4">
        <div class="h-3 bg-stone-300 dark:bg-slate-600 rounded w-16"></div>
      </div>
      <div class="h-12 bg-stone-200 dark:bg-slate-600 rounded-xl"></div>
    </div>

    <!-- 分类筛选骨架 -->
    <div>
      <div class="mb-4">
        <div class="h-3 bg-stone-300 dark:bg-slate-600 rounded w-12"></div>
      </div>
      <div class="space-y-2">
        <div v-for="i in 8" :key="i" class="flex items-center">
          <div class="w-6 h-6 bg-stone-200 dark:bg-slate-700 rounded-lg mr-3"></div>
          <div class="flex-1 h-12 bg-stone-200 dark:bg-slate-600 rounded-xl"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 减少动画对性能的影响 */
@media (prefers-reduced-motion: reduce) {
  .animate-pulse {
    animation: none;
  }
}
</style>
