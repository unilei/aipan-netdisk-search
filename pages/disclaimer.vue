<script setup>
definePageMeta({
  layout: "netdisk",
});

// SEO配置
useHead({
  title: '免责声明 - AIPAN.ME',
  meta: [
    { name: 'description', content: '爱盼网盘搜索引擎免责声明，本站仅供学习交流使用，不作任何商业用途。' },
    { name: 'keywords', content: '免责声明,使用条款,学习交流,非商业用途' },
  ]
})
</script>

<template>
  <div class="min-h-[calc(100vh-70px)] bg-gray-50 dark:bg-gray-900 py-16">
    <div class="max-w-3xl mx-auto px-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          免责声明
        </h1>
        
        <div class="space-y-6 text-gray-600 dark:text-gray-300">
          <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 space-y-2">
            <h2 class="font-semibold text-blue-700 dark:text-blue-300">使用声明</h2>
            <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>本网站仅供个人学习和技术研究使用</li>
              <li>严禁将本站用于任何商业用途</li>
              <li>用户应遵守相关法律法规，不得从事违法活动</li>
              <li>用户对使用本站的一切行为负责</li>
            </ul>
          </div>

          <div class="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 space-y-2">
            <h2 class="font-semibold text-purple-700 dark:text-purple-300">内容声明</h2>
            <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>本站是一个技术学习项目，主要用于实践 Nuxt.js、SEO、Docker 等技术</li>
              <li>搜索结果来自互联网公开内容的检索</li>
              <li>本站不存储、上传、复制或传播任何资源文件</li>
              <li>如有内容侵犯了您的权益，请通过侵权投诉页面与我们联系</li>
            </ul>
          </div>

          <div class="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 space-y-2">
            <h2 class="font-semibold text-green-700 dark:text-green-300">技术说明</h2>
            <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>本站使用 Nuxt.js 框架进行开发</li>
              <li>采用 Docker 容器化技术进行部署</li>
              <li>实践了 SEO 优化、服务器部署等技术</li>
              <li>网站功能会持续更新，用于探索和实践新技术</li>
            </ul>
          </div>

          <div class="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
            <p class="text-yellow-700 dark:text-yellow-300 text-sm">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              提示：继续使用本站则表示您已阅读、理解并同意本免责声明的所有内容。
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 