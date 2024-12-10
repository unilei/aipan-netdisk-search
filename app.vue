<template>
  <NuxtLayout>
    <NuxtPage></NuxtPage>
    <div>
      <el-dialog
        v-model="showDisclaimer"
        title="使用须知"
        :width="dialogWidth"
        :modal="true"
        :lock-scroll="true"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="false"
        class="disclaimer-dialog"
      >
        <div class="disclaimer-content">
          <h3>责任声明</h3>
          <p>欢迎使用本网站。在使用本站服务之前，请您仔细阅读以下声明：</p>
          <ol>
            <li>
              本网站所有资源均来自网络公开资源，本站不存储、不制作、不复制、不传播任何文件。
            </li>
            <li>
              本网站是免费开源的，并且仅作为个人学习交流使用，不进行任何商业运营和盈利活动。
            </li>
            <li>
              严禁使用本站传播任何违法违规内容，包括但不限于：
              <ul>
                <li>色情淫秽内容</li>
                <li>赌博相关内容</li>
                <li>毒品相关内容</li>
                <li>暴力恐怖内容</li>
                <li>其他违反法律法规的内容</li>
              </ul>
            </li>
            <li>用户应遵守相关法律法规，对自己的行为负责。</li>
            <li>
              如果本站内容侵犯了您的权益，请通过留言方式及时告知，我们将第一时间删除相关内容。
            </li>
            <li>
              用户使用本站即表示同意承担所有风险，本站不对任何损失承担责任。
            </li>
            <li>本站保留随时修改或中断服务的权利，不需事先通知用户。</li>
          </ol>
          <el-button
            type="primary"
            size="large"
            class="agree-button"
            @click="acceptDisclaimer"
            >我已阅读并同意</el-button
          >
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
  localStorage.setItem("disclaimerAccepted", "true");
};

onMounted(() => {
  const hasAccepted = localStorage.getItem("disclaimerAccepted");
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

/* Dialog styles */
/* Dialog styles */
.disclaimer-dialog .el-dialog {
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin: 0 auto !important;
}

.disclaimer-dialog .el-dialog__header {
  margin: 0;
  padding: 20px 20px 10px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.disclaimer-dialog .el-dialog__header .el-dialog__title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

/* Content styles */
.disclaimer-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 20px;
  color: #333;
  line-height: 1.6;
  font-size: 15px;
}

.disclaimer-content h3 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}

.disclaimer-content p {
  margin-bottom: 15px;
}

.disclaimer-content ol {
  padding-left: 20px;
  margin-bottom: 15px;
}

.disclaimer-content ol li {
  margin-bottom: 15px;
}

.disclaimer-content ul {
  padding-left: 20px;
  margin: 10px 0;
}

.disclaimer-content ul li {
  margin-bottom: 8px;
  color: #666;
}

.disclaimer-content .agree-button {
  display: block;
  margin: 30px auto 0;
  padding: 12px 30px;
  font-size: 16px;
  border-radius: 4px;
  background: var(--el-color-primary);
  transition: all 0.3s;
  width: 100%;
  max-width: 300px;
}

.disclaimer-content .agree-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Mobile optimizations */
@media screen and (max-width: 768px) {
  .disclaimer-dialog .el-dialog {
    margin-top: 10vh !important;
  }

  .disclaimer-dialog .el-dialog__header {
    padding: 15px;
  }

  .disclaimer-dialog .el-dialog__header .el-dialog__title {
    font-size: 18px;
  }

  .disclaimer-content {
    padding: 15px;
    font-size: 14px;
    max-height: 65vh;
  }

  .disclaimer-content h3 {
    font-size: 16px;
    margin-bottom: 15px;
  }

  .disclaimer-content ol {
    padding-left: 15px;
  }

  .disclaimer-content ul {
    padding-left: 15px;
  }

  .disclaimer-content .agree-button {
    padding: 10px 20px;
    font-size: 15px;
    margin-top: 20px;
  }
}
</style>
