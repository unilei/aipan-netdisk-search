<template>
  <NuxtLayout>
    <NuxtPage></NuxtPage>
    <!-- Cookie同意横幅 -->
    <CommonCookieConsent />
  </NuxtLayout>
</template>

<script setup>
import {
  ArrowLeft,
  Delete,
  Document,
  Edit,
  House,
  Loading,
  PictureFilled,
  Plus,
  Refresh,
} from "@element-plus/icons-vue";

const nuxtApp = useNuxtApp();
const colorMode = useColorMode();

const globalElementPlusIcons = {
  ArrowLeft,
  Delete,
  Document,
  Edit,
  House,
  Loading,
  PictureFilled,
  Plus,
  Refresh,
};

for (const [name, component] of Object.entries(globalElementPlusIcons)) {
  nuxtApp.vueApp.component(name, component);
}

// 确保初始化时应用正确的 dark class
onMounted(() => {
  if (process.client) {
    const html = document.documentElement;
    if (colorMode.value === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }
});
</script>
<style>
body {
  background-color: #fcfcfd;
  padding: 0;
  margin: 0 auto;
  transition: background-color 0.3s ease;
}

html.dark body {
  background-color: #111827;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  margin: 0;
  padding: 0;
}

</style>
