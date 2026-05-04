<script setup>
import { ref, onMounted } from 'vue';

const showBanner = ref(false);
const showDetail = ref(false);

const cookieSettings = ref({
  necessary: true, // 必需的Cookie，不可禁用
  analytics: true,  // 分析Cookie
  marketing: false  // 营销Cookie
});

// 检查是否已经同意Cookie
onMounted(() => {
  const consent = localStorage.getItem('cookieConsent');
  if (!consent) {
    // 延迟显示，避免影响页面加载
    setTimeout(() => {
      showBanner.value = true;
    }, 1000);
  } else {
    // 加载已保存的设置
    try {
      const saved = JSON.parse(consent);
      cookieSettings.value = { ...cookieSettings.value, ...saved };
    } catch (e) {
      console.error('Failed to parse cookie consent:', e);
    }
  }
});

// 接受所有Cookie
const acceptAll = () => {
  cookieSettings.value = {
    necessary: true,
    analytics: true,
    marketing: true
  };
  saveConsent();
};

// 仅接受必要Cookie
const acceptNecessary = () => {
  cookieSettings.value = {
    necessary: true,
    analytics: false,
    marketing: false
  };
  saveConsent();
};

// 保存自定义设置
const saveCustomSettings = () => {
  saveConsent();
  showDetail.value = false;
};

// 保存同意记录
const saveConsent = () => {
  localStorage.setItem('cookieConsent', JSON.stringify(cookieSettings.value));
  localStorage.setItem('cookieConsentDate', new Date().toISOString());
  showBanner.value = false;
  
  // 这里可以根据用户选择启用/禁用相应的跟踪代码
  if (cookieSettings.value.analytics) {
    enableAnalytics();
  }
  if (cookieSettings.value.marketing) {
    enableMarketing();
  }
};

// 启用分析工具
const enableAnalytics = () => {
  // Google Analytics 已在 nuxt.config.ts 中配置
  console.log('Analytics enabled');
};

// 启用营销工具
const enableMarketing = () => {
  // 如果有营销Cookie，在这里启用
  console.log('Marketing enabled');
};
</script>

<template>
  <!-- Cookie同意横幅 -->
  <transition name="slide-up">
    <div v-if="showBanner" 
         class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-2xl border-t-2 border-blue-500">
      <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <!-- 左侧文字内容 -->
          <div class="flex-1">
            <div class="flex items-start space-x-3">
              <i class="fas fa-cookie-bite text-3xl text-blue-500 mt-1"></i>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  我们使用 Cookie
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  我们使用 Cookie 来改善您的浏览体验、分析网站流量并提供个性化内容。
                  继续浏览本站即表示您同意我们使用 Cookie。
                  了解更多信息，请查看我们的
                  <nuxt-link to="/privacy-policy" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    隐私政策
                  </nuxt-link>。
                </p>
              </div>
            </div>
          </div>

          <!-- 右侧按钮 -->
          <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button @click="showDetail = true"
                    class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200">
              <i class="fas fa-cog mr-2"></i>自定义设置
            </button>
            <button @click="acceptNecessary"
                    class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
              仅必要Cookie
            </button>
            <button @click="acceptAll"
                    class="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg">
              接受全部
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <!-- Cookie设置详情弹窗 -->
  <transition name="fade">
    <div v-if="showDetail" 
         class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
         @click.self="showDetail = false">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <!-- 标题栏 -->
        <div class="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">
            <i class="fas fa-cookie-bite mr-2 text-blue-500"></i>Cookie 设置
          </h3>
          <button @click="showDetail = false" 
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- 内容区域 -->
        <div class="p-6 space-y-6">
          <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Cookie 是存储在您设备上的小文本文件，用于改善您的浏览体验。您可以选择启用或禁用不同类型的 Cookie。
          </p>

          <!-- Cookie类型列表 -->
          <div class="space-y-4">
            <!-- 必要Cookie -->
            <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-1">
                    必要 Cookie
                    <span class="ml-2 px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded">
                      始终启用
                    </span>
                  </h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    这些 Cookie 是网站正常运行所必需的，无法禁用。包括身份验证、安全性和基本功能。
                  </p>
                </div>
                <el-switch v-model="cookieSettings.necessary" disabled class="ml-4" />
              </div>
              <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <strong>示例：</strong>登录状态、会话ID、安全令牌
              </div>
            </div>

            <!-- 分析Cookie -->
            <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-1">
                    分析 Cookie
                  </h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    帮助我们了解访问者如何使用网站，以便改善用户体验。这些数据是匿名收集的。
                  </p>
                </div>
                <el-switch v-model="cookieSettings.analytics" class="ml-4" />
              </div>
              <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <strong>示例：</strong>Google Analytics、访问统计、页面浏览量
              </div>
            </div>

            <!-- 营销Cookie -->
            <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-1">
                    营销 Cookie
                  </h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    用于跟踪访问者在不同网站之间的活动，以展示相关广告。
                  </p>
                </div>
                <el-switch v-model="cookieSettings.marketing" class="ml-4" />
              </div>
              <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <strong>示例：</strong>Google AdSense、广告追踪、推荐系统
              </div>
            </div>
          </div>

          <!-- 更多信息 -->
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              <i class="fas fa-info-circle mr-2 text-blue-500"></i>
              了解更多关于我们如何使用 Cookie 的信息，请阅读我们的
              <nuxt-link to="/privacy-policy" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                隐私政策
              </nuxt-link>。
            </p>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="sticky bottom-0 bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3 border-t dark:border-gray-600">
          <button @click="showDetail = false"
                  class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
            取消
          </button>
          <button @click="saveCustomSettings"
                  class="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md">
            保存设置
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* 滑入动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-up-enter-from {
  transform: translateY(100%);
}

.slide-up-leave-to {
  transform: translateY(100%);
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.dark .overflow-y-auto::-webkit-scrollbar-track {
  background: #374151;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
