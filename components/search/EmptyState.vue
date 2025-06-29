<template>
  <div class="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
    <div
      class="p-8 rounded-full bg-gradient-to-br from-purple-100/50 to-blue-100/50 dark:from-purple-900/20 dark:to-blue-900/20 mb-6 shadow-lg backdrop-blur-sm group hover:scale-105 transition-all duration-300">
      <i
        class="fas fa-search text-5xl text-purple-500/70 dark:text-purple-400/70 group-hover:rotate-12 transition-transform duration-300"></i>
    </div>
    <h3 class="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
      未找到相关结果
    </h3>
    <p class="text-sm mt-3 opacity-75">试试以下建议：</p>
    <ul class="mt-4 text-sm space-y-2 text-center">
      <li>• 检查输入是否正确</li>
      <li>• 尝试使用不同的关键词</li>
    </ul>
  </div>
</template>

<script setup>
// No props needed for empty state
</script>
