<script setup>
// 骨架屏组件，用于初始化加载状态
defineProps({
  count: {
    type: Number,
    default: 24
  }
})
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
    <div v-for="i in count" :key="i"
      class="bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg shadow-stone-500/5 dark:shadow-slate-900/20 border border-stone-200/50 dark:border-slate-600/50 animate-pulse">
      <!-- 封面图片骨架 -->
      <div
        class="aspect-[9/14] bg-gradient-to-br from-stone-200 to-stone-300 dark:from-slate-600 dark:to-slate-700 relative overflow-hidden">
        <div
          class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-500/20 to-transparent animate-shimmer">
        </div>
      </div>
    </div>
  </div>
</template>

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

/* 响应式优化 */
@media (max-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
}

@media (max-width: 480px) {
  .grid {
    gap: 0.5rem;
  }

  .p-4 {
    padding: 0.75rem;
  }
}

/* 减少动画对性能的影响 */
@media (prefers-reduced-motion: reduce) {

  .animate-pulse,
  .animate-shimmer {
    animation: none;
  }
}
</style>
