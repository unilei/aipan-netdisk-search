<script setup>
definePageMeta({
  layout: "netdisk",
});

// SEO配置
useHead({
  title: '侵权投诉 - AIPAN.ME',
  meta: [
    { name: 'description', content: '爱盼网盘搜索引擎侵权投诉页面，我们重视知识产权保护，及时处理侵权内容。' },
    { name: 'keywords', content: '侵权投诉,版权保护,内容举报,DMCA' },
  ]
})
</script>

<template>
  <div class="min-h-[calc(100vh-70px)] bg-gray-50 dark:bg-gray-900 py-16">
    <div class="max-w-3xl mx-auto px-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          侵权投诉
        </h1>
        
        <div class="space-y-6 text-gray-600 dark:text-gray-300">
          <p class="leading-relaxed">
            AIPAN.ME 重视知识产权保护，我们会认真对待所有的侵权投诉请求。如果您发现本站的搜索结果中包含侵犯您知识产权的内容，请通过以下方式联系我们：
          </p>

          <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 space-y-2">
            <h2 class="font-semibold text-blue-700 dark:text-blue-300">投诉须知：</h2>
            <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>请提供您的身份证明和权利证明文件</li>
              <li>详细说明被侵权的具体内容和链接</li>
              <li>提供您的联系方式，以便我及时回复</li>
              <li>声明投诉内容的真实性，并承担相应的法律责任</li>
            </ul>
          </div>

          <div class="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 space-y-2">
            <h2 class="font-semibold text-green-700 dark:text-green-300">关于本站：</h2>
            <div class="space-y-2 text-gray-700 dark:text-gray-300">
              <p class="leading-relaxed">AIPAN.ME 不仅是一个搜索引擎网站，更是一个创意实践的技术乐园。这里承载着开发者的奇思妙想，每一个有趣的想法都可能在这里落地生根。我们的愿景是：</p>
              <ul class="list-disc list-inside space-y-2">
                <li>将创意转化为现实，让每个有趣的想法都有实现的可能</li>
                <li>以学习为核心目的，探索和实践最新的网站开发技术</li>
                <li>基于 Nuxt.js、Docker、SEO 等技术，打造全栈开发的实验场</li>
                <li>严格遵守非商业用途原则，专注于技术学习与创新</li>
              </ul>
              <p class="text-sm italic mt-2">这是一个用代码实现梦想的地方，每一个功能的开发都源于对技术的热爱和对创新的追求。</p>
            </div>
          </div>

          <div class="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 space-y-2">
            <h2 class="font-semibold text-purple-700 dark:text-purple-300">免责声明：</h2>
            <div class="space-y-2 text-gray-700 dark:text-gray-300">
              <p>AIPAN.ME 是一个学习工具，我们：</p>
              <ul class="list-disc list-inside space-y-2">
                <li>不存储、上传、复制或传播任何资源文件</li>
                <li>仅作为信息检索工具，展示来自互联网的搜索结果</li>
                <li>所有资源均来自第三方网站，本站不对其内容的准确性、合法性负责</li>
                <li>如果您认为搜索结果中的某些内容侵犯了您的权益，请及时与我联系</li>
              </ul>
            </div>
          </div>

          <div class="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-2">
            <h2 class="font-semibold text-gray-900 dark:text-gray-100">联系方式：</h2>
            <div class="space-y-2">
              <p>
                <i class="fas fa-envelope mr-2 text-blue-500"></i>
                邮箱：ahagwybwqs@gmail.com
              </p>
              <p>
                <i class="fas fa-clock mr-2 text-blue-500"></i>
                处理时间：收到投诉后，我会在 2-3 个工作日内进行处理
              </p>
            </div>
          </div>

          <div class="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
            <p class="text-yellow-700 dark:text-yellow-300 text-sm">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              提示：我们将对所有投诉信息严格保密，并尽快处理您的诉求。感谢您的理解与支持！
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 