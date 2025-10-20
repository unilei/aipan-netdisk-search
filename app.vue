<template>
  <NuxtLayout>
    <NuxtPage></NuxtPage>
    <!-- Cookie同意横幅 -->
    <CommonCookieConsent />
  </NuxtLayout>
</template>

<script setup>
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

const nuxtApp = useNuxtApp();
const colorMode = useColorMode();

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  nuxtApp.vueApp.component(key, component);
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

/* @font-face {
  font-family: "Douyin Meihao";
  src: url("./assets/fonts/抖音美好体.ttf") format("truetype");
  font-display: swap;
  font-weight: 100 200 300 400 500 600 700 800 900;
  font-style: normal;
}

@font-face {
  font-family: "Fangzheng Kaiti Jian";
  src: url("./assets/fonts/方正楷体简体.ttf") format("truetype");
  font-display: swap;
  font-weight: 100 200 300 400 500 600 700 800 900;
  font-style: normal;
} */
</style>
