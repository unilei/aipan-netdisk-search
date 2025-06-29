<template>
  <div class="space-y-4">
    <!-- Header Skeleton -->
    <div class="flex flex-col sm:flex-row justify-between items-center gap-2 mb-4 px-2 animate-pulse">
      <div class="h-6 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg w-48"></div>
      <div class="h-8 bg-red-100/50 dark:bg-red-900/30 rounded-full w-64"></div>
    </div>

    <!-- Video Player Skeleton -->
    <div class="relative rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 backdrop-blur-sm">
      <div class="aspect-video w-full bg-gray-200/50 dark:bg-gray-700/50 animate-pulse">
        <div class="absolute inset-0 flex items-center justify-center">
          <i class="fas fa-film text-4xl text-gray-400 dark:text-gray-600"></i>
        </div>
      </div>
    </div>

    <!-- Episodes List Skeleton -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-2">
      <div v-for="i in 12" :key="i"
        class="h-10 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg animate-pulse"></div>
    </div>
  </div>
</template>

<script setup>
// No props needed for skeleton
</script>
