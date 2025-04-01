<script setup>
const footerLinks = [
  { name: '关于网站', path: '/about' },
  { name: '免责声明', path: '/disclaimer' },
  { name: '侵权投诉', path: '/copyright' },
];
</script>

<template>
  <footer class="bg-slate-100 dark:bg-slate-800 dark:text-white py-6 space-y-2">

    <!-- 版权信息 -->
    <p class="text-center text-xs sm:text-sm">
      © 2024 AIPAN.ME 爱盼 - 资源随心，娱乐无限
    </p>
    <!-- 页脚链接 -->
    <div class="flex items-center justify-center space-x-4">
      <template v-for="(link, index) in footerLinks" :key="link.path">
        <nuxt-link :to="link.path"
          class="text-sm text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-300">
          {{ link.name }}
        </nuxt-link>
        <span v-if="index < footerLinks.length - 1" class="text-gray-300 dark:text-gray-600">|</span>
      </template>
    </div>

    <!-- 声明信息 -->
    <p class="text-center text-xs sm:text-sm px-4  mx-auto text-gray-600 dark:text-gray-400">
      声明：本站内容皆来自网络公开资源。本站不储存、复制、传播任何文件，不做任何盈利，仅作个人公益学习，请勿非法&商业传播。
    </p>
  </footer>
</template>

<style scoped></style>
