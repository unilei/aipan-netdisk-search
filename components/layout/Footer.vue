<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const footerLinks = [
  { name: 'footer.links.about', path: '/about' },
  { name: 'footer.links.disclaimer', path: '/disclaimer' },
  { name: 'footer.links.copyright', path: '/copyright' },
];
</script>

<template>
  <footer class="bg-slate-100 dark:bg-slate-800 dark:text-white py-6 space-y-2">

    <!-- 版权信息 -->
    <p class="text-center text-xs sm:text-sm">
      {{ $t('footer.copyright') }}
    </p>
    <!-- 页脚链接 -->
    <div class="flex items-center justify-center space-x-4">
      <template v-for="(link, index) in footerLinks" :key="link.path">
        <nuxt-link :to="link.path"
          class="text-sm text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-300">
          {{ $t(link.name) }}
        </nuxt-link>
        <span v-if="index < footerLinks.length - 1" class="text-gray-300 dark:text-gray-600">|</span>
      </template>
    </div>

    <!-- 声明信息 -->
    <p class="text-center text-xs sm:text-sm px-4 mx-auto text-gray-600 dark:text-gray-400">
      {{ $t('footer.statement') }}
    </p>
  </footer>
</template>

<style scoped></style>
