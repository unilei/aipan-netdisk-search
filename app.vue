<template>
    <NuxtLayout>
        <NuxtPage></NuxtPage>
    </NuxtLayout>
</template>

<script setup>
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const nuxtApp = useNuxtApp()

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    nuxtApp.vueApp.component(key, component)
}

</script>
<style>
body {
    background-color: #fcfcfd;
    padding: 0;
    margin: 0 auto;
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

@font-face {
    font-family: "Douyin Meihao";
    src: url('./assets/fonts/抖音美好体.ttf') format('truetype');
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
}
</style>