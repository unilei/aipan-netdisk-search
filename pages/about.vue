<script setup>
definePageMeta({
  layout: "netdisk",
});

// SEO配置
useHead({
  title: '关于网站 - AIPAN.ME',
  meta: [
    { name: 'description', content: 'AIPAN.ME 是一个创意实践的技术平台，集搜索引擎和创新功能于一体，专注于技术学习和实践。' },
    { name: 'keywords', content: '关于我们,技术学习,创新平台,Nuxt.js,Docker,SEO' },
  ]
})
</script>

<template>
  <div class="min-h-[calc(100vh-70px)] bg-gray-50 dark:bg-gray-900 py-16">
    <div class="max-w-3xl mx-auto px-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          关于 AIPAN.ME
        </h1>
        
        <div class="space-y-6 text-gray-600 dark:text-gray-300">
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-6">
            <p class="text-lg leading-relaxed">
              AIPAN.ME 是一个创意实践的技术乐园。这里承载着开发者的奇思妙想，每一个有趣的想法都可能在这里落地生根。
            </p>
          </div>

          <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 space-y-2">
            <h2 class="font-semibold text-blue-700 dark:text-blue-300">我们的愿景</h2>
            <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>打造一个技术学习和实践的开放平台</li>
              <li>探索和实现有趣的创新功能</li>
              <li>分享技术经验和学习心得</li>
              <li>持续优化用户体验和网站性能</li>
            </ul>
          </div>

          <div class="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 space-y-2">
            <h2 class="font-semibold text-purple-700 dark:text-purple-300">技术特色</h2>
            <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>基于 Nuxt.js 构建的现代化前端框架</li>
              <li>使用 Docker 实现容器化部署</li>
              <li>注重 SEO 优化和性能提升</li>
              <li>采用响应式设计，支持多端适配</li>
              <li>深色模式支持，提供舒适的浏览体验</li>
            </ul>
          </div>

          <div class="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 space-y-2">
            <h2 class="font-semibold text-green-700 dark:text-green-300">功能特点</h2>
            <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>简洁的博客系统</li>
              <li>好玩的在线TV播放器</li>
              <li>用户友好的界面设计</li>
              <li>持续添加创新功能</li>
            </ul>
          </div>

          <div class="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
            <p class="text-yellow-700 dark:text-yellow-300">
              <i class="fas fa-lightbulb mr-2"></i>
              我们始终保持对技术的热情和创新的追求，欢迎您一起探索这个充满可能的平台！
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 