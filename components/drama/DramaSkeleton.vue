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
    <div 
      v-for="i in count" 
      :key="i" 
      class="bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg shadow-stone-500/5 dark:shadow-slate-900/20 border border-stone-200/50 dark:border-slate-600/50 animate-pulse"
    >
      <!-- 封面图片骨架 -->
      <div class="aspect-[3/4] bg-gradient-to-br from-stone-200 to-stone-300 dark:from-slate-600 dark:to-slate-700 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-500/20 to-transparent animate-shimmer"></div>
      </div>
      
      <!-- 内容区域骨架 -->
      <div class="p-4 space-y-3">
        <!-- 标题骨架 -->
        <div class="space-y-2">
          <div class="h-4 bg-stone-300 dark:bg-slate-600 rounded-lg w-3/4"></div>
          <div class="h-4 bg-stone-300 dark:bg-slate-600 rounded-lg w-1/2"></div>
        </div>
        
        <!-- 信息标签骨架 -->
        <div class="flex items-center gap-2">
          <div class="h-6 bg-stone-200 dark:bg-slate-600 rounded-full w-12"></div>
          <div class="h-6 bg-stone-200 dark:bg-slate-600 rounded-full w-16"></div>
        </div>
        
        <!-- 描述骨架 -->
        <div class="space-y-2">
          <div class="h-3 bg-stone-200 dark:bg-slate-600 rounded w-full"></div>
          <div class="h-3 bg-stone-200 dark:bg-slate-600 rounded w-4/5"></div>
          <div class="h-3 bg-stone-200 dark:bg-slate-600 rounded w-3/5"></div>
        </div>
        
        <!-- 播放按钮骨架 -->
        <div class="pt-2">
          <div class="h-10 bg-gradient-to-r from-stone-200 to-stone-300 dark:from-slate-600 dark:to-slate-700 rounded-xl w-full"></div>
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
