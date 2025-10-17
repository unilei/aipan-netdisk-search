<template>
  <div class="p-4">
    <!-- VOD卡片网格骨架屏 -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <div 
        v-for="i in 12" 
        :key="i"
        class="vod-skeleton-card"
      >
        <!-- 海报骨架 -->
        <div class="aspect-[2/3] rounded-lg overflow-hidden 
                    bg-gray-200 dark:bg-gray-700 
                    shadow-sm
                    animate-pulse
                    flex items-center justify-center">
          <i class="fas fa-film text-2xl text-gray-300 dark:text-gray-600"></i>
        </div>
        
        <!-- 标题骨架 -->
        <div class="mt-2 px-1 space-y-2 animate-pulse">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          
          <!-- 附加信息骨架 -->
          <div class="flex items-center gap-2 mt-1">
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// No props needed for skeleton
</script>

<style scoped>
.vod-skeleton-card {
  /* 防止内容抖动 */
  min-height: 0;
}

/* 脉动动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
