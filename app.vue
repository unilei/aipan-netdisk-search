<template>
  <NuxtLayout>
    <NuxtPage></NuxtPage>
    <div>
      <el-dialog
        v-model="showDisclaimer"
        :width="dialogWidth"
        :modal="true"
        :lock-scroll="true"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="true"
      >
        <div className="max-w-2xl mx-auto p-6 space-y-6 text-center">
          <h1 className="text-xl font-bold text-gray-800 leading-relaxed">
            项目声明
          </h1>
          <div className="space-y-4 text-gray-700">
            <p className="text-lg">
              创建这个项目的初衷，是为了打造一个便捷的个人休闲娱乐平台。然而，随着项目的发展，似乎已经逐渐偏离了最初的方向。😊
            </p>

            <p className="text-lg">
              衷心感谢每一位支持和喜爱这个项目的朋友。但考虑到项目传播范围的扩大，部分内容可能不适合广泛传播。为此，我决定删除相关内容并关闭开源库。🙏
            </p>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-lg font-medium text-blue-900">
                恳请已使用本项目的朋友：
                <br />
                请仅供个人使用，不要随意传播，更不要用于商业盈利。
              </p>
            </div>

            <p className="text-lg font-semibold mt-6">
              岁末年关，让我们共同守护初心，砥砺前行。
            </p>
            <div>
              <nuxt-link to="/terms">查看条款</nuxt-link>
            </div>
          </div>
          <div>
            <button
              type="button"
              class="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
              @click="acceptDisclaimer"
            >
              我已阅读并同意
            </button>
          </div>
        </div>
      </el-dialog>
    </div>
  </NuxtLayout>
</template>

<script setup>
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import { ref, computed } from "vue";

const nuxtApp = useNuxtApp();

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  nuxtApp.vueApp.component(key, component);
}

const isMobile = computed(() => {
  if (useNuxtApp().isClient) {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }
  return false;
});
const dialogWidth = computed(() => (isMobile.value ? "90%" : "50%"));
const showDisclaimer = ref(true);
const acceptDisclaimer = () => {
  showDisclaimer.value = false;
  localStorage.setItem("disclaimerAccepted2", "true");
};

onMounted(() => {
  const hasAccepted = localStorage.getItem("disclaimerAccepted2");
  if (hasAccepted) {
    showDisclaimer.value = false;
  }
});
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
