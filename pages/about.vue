<script setup>
definePageMeta({
  layout: "netdisk",
});

// SEO配置
useHead({
  title: '关于网站 - ailookzy.com',
  meta: [
    { name: 'description', content: 'ailookzy.com 是专业的网盘资源搜索引擎，专注于提供高质量的网盘资源搜索服务。' },
    { name: 'keywords', content: '关于我们,网盘搜索,资源搜索,百度网盘,阿里云盘,夸克网盘' },
  ]
})
</script>

<template>
  <div class="min-h-[calc(100vh-70px)] bg-gray-50 dark:bg-gray-900 py-16">
    <div class="max-w-3xl mx-auto px-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          关于 ailookzy.com
        </h1>
        
        <div class="space-y-6 text-gray-600 dark:text-gray-300">
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-6">
            <p class="text-lg leading-relaxed">
              ailookzy.com 是专业的网盘资源搜索引擎，为用户提供快速、准确的网盘资源搜索服务。我们致力于打造最好的网盘资源发现平台。
            </p>
          </div>

          <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 space-y-2">
            <h2 class="font-semibold text-blue-700 dark:text-blue-300">我们的优势</h2>
            <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>支持百度网盘、阿里云盘、夸克网盘多平台搜索</li>
              <li>快速、准确的搜索结果</li>
              <li>简洁易用的操作界面</li>
              <li>持续更新的资源库</li>
            </ul>
          </div>

          <div class="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 space-y-2">
            <h2 class="font-semibold text-purple-700 dark:text-purple-300">搜索功能</h2>
            <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>支持多平台网盘资源搜索</li>
              <li>智能关键词匹配算法</li>
              <li>实时搜索结果显示</li>
              <li>多类型资源分类显示</li>
              <li>响应式设计，支持多端适配</li>
            </ul>
          </div>

          <div class="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 space-y-2">
            <h2 class="font-semibold text-green-700 dark:text-green-300">资源类型</h2>
            <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>影视资源（电影、电视剧、纪录片等）</li>
              <li>音乐资源（歌曲、专辑、音效等）</li>
              <li>软件应用（系统软件、工具软件等）</li>
              <li>文档资料（电子书、教程、文档等）</li>
            </ul>
          </div>

          <div class="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
            <p class="text-yellow-700 dark:text-yellow-300">
              <i class="fas fa-search mr-2"></i>
              我们致力于提供最优质的网盘资源搜索服务，让用户轻松找到所需资源！
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 