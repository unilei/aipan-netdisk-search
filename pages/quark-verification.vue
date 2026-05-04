<template>
  <div class="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <!-- Logo和标题 -->
      <div class="text-center mb-8">
        <img src="/logo.png" alt="Logo" class="w-16 h-16 mx-auto mb-4" />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">{{ pageTitle }}</h1>
        <p class="text-gray-600 dark:text-gray-400">{{ pageSubtitle }}</p>
      </div>

      <!-- 验证卡片 -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
        <!-- 说明信息 -->
        <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="text-sm text-blue-800 dark:text-blue-200">
              <p class="font-medium mb-2">验证说明</p>
              <div class="space-y-2">
                <p>{{ instructionText }}</p>
                <p v-if="verificationPurpose === 'access'" class="text-xs">验证后有效时间：{{ getAccessDurationText() }}。</p>
                <p v-if="verificationPurpose === 'points' && shareConfig.transferRewardEnabled" class="text-xs text-green-700 dark:text-green-300">
                  验证成功可获得 {{ shareConfig.transferRewardPoints }} 限时积分，{{ getTransferRewardDurationText() }}内有效。
                </p>
                <p v-if="verificationPurpose === 'access'" class="text-xs text-orange-600 dark:text-orange-400">注意：不同的浏览器需要分别验证。</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 目标分享链接 -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ targetLabel }}
          </label>
          <div class="relative">
            <input 
              :value="shareConfig.shareLink" 
              readonly 
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm pr-20"
            />
            <div class="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
              <button 
                @click="copyShareLink"
                class="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                复制
              </button>
            </div>
          </div>
          <div class="mt-2 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <span>需要查看更多信息？</span>
            <button 
              type="button" 
              class="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline" 
              @click="openShareLink"
            >
              打开原始链接
            </button>
          </div>
        </div>

        <!-- 用户分享链接输入 -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            请输入您分享后的链接
          </label>
          <input 
            v-model="verificationForm.shareLink" 
            placeholder="粘贴您在夸克网盘中重新分享生成的链接"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            @keydown.enter="submitVerification"
          />
          <p v-if="verificationForm.error" class="mt-2 text-sm text-red-600 dark:text-red-400">
            {{ verificationForm.error }}
          </p>
        </div>

        <!-- 操作按钮 -->
        <div class="flex space-x-3">
          <button 
            @click="goBack"
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            返回
          </button>
          <button 
            @click="submitVerification"
            :disabled="verificationForm.loading || !verificationForm.shareLink?.trim()"
            class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            <svg v-if="verificationForm.loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ verificationForm.loading ? '验证中...' : submitLabel }}
          </button>
        </div>
      </div>

      <!-- 底部链接 -->
      <div class="text-center mt-6">
        <NuxtLink to="/" class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          返回首页
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from "~/stores/user";
import { openUrlWithNoOpener } from "~/utils/externalNavigation";
import { getSingleQueryValue } from "~/utils/routeQuery";

definePageMeta({
  layout: false,
  middleware: [] // 跳过验证中间件
});

// 页面元数据
useHead({
  title: '访问验证 - AIPAN.ME',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
});

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { refreshAccessControlConfig } = useAccessControlConfig();

const verificationPurpose = computed(() =>
  getSingleQueryValue(route.query.purpose) === 'points' ? 'points' : 'access'
);
const pageTitle = computed(() =>
  verificationPurpose.value === 'points' ? '转存获取积分' : '网盘链接访问验证'
);
const pageSubtitle = computed(() =>
  verificationPurpose.value === 'points' ? '完成任务后获得限时积分' : '请完成验证以访问网盘资源'
);
const instructionText = computed(() =>
  verificationPurpose.value === 'points'
    ? '请先转存下方积分任务链接到您的夸克网盘，再重新分享并提交您的分享链接。'
    : '为防止资源滥用，请先转存到您的夸克网盘，再重新分享并提交您的分享链接，验证通过后即可访问站点。'
);
const targetLabel = computed(() =>
  verificationPurpose.value === 'points' ? '积分任务链接' : '目标分享链接'
);
const submitLabel = computed(() =>
  verificationPurpose.value === 'points' ? '验证并领取积分' : '验证并继续'
);

// 解码加密的链接
const decodeTargetLink = async () => {
  try {
    const token = getSingleQueryValue(route.query.token);
    const link = getSingleQueryValue(route.query.link);

    if (token) {
      // 使用服务器端解密API
      const decryptRes = await $fetch('/api/quark/decrypt-link', {
        method: 'POST',
        body: {
          token
        }
      });
      
      if (decryptRes.code === 200) {
        return decryptRes.data.link;
      } else {
        console.error('解密失败:', decryptRes.msg);
        return null;
      }
    } else if (link) {
      // 兼容旧版本（直接传递链接）
      return link;
    }
    return null;
  } catch (error) {
    console.error('链接解码失败:', error);
    return null;
  }
};

// 验证表单状态
const verificationForm = reactive({
  shareLink: '',
  loading: false,
  error: ''
});

// 分享配置
const shareConfig = ref({
  verificationEnabled: false,
  shareLink: '',
  accessVerificationShareLink: '',
  accessDurationMinutes: 1440, // 默认24小时
  transferRewardEnabled: true,
  transferRewardShareLink: '',
  transferRewardPoints: 1000,
  transferRewardDurationMinutes: 1440
});

const setAccessState = (value) => {
  if (typeof window === 'undefined') return;
  if (value === null) {
    window.localStorage.removeItem('quark_access_verification');
  } else {
    // 设置验证状态
    const accessDurationMinutes = shareConfig.value.accessDurationMinutes || 1440;
    
    if (accessDurationMinutes === 1440) {
      // 默认24小时：使用当天开始时间（兼容原有逻辑）
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      window.localStorage.setItem('quark_access_verification', JSON.stringify({
        timestamp: todayStart.getTime()
      }));
    } else {
      // 自定义时长：使用当前时间戳
      window.localStorage.setItem('quark_access_verification', JSON.stringify({
        timestamp: Date.now()
      }));
    }
  }
};

// 加载分享配置
const loadShareConfig = async () => {
  try {
    const res = await $fetch('/api/quark/setting');
    if ((res.success || res.code === 200) && res.data) {
      const accessVerificationShareLink = res.data.accessVerificationShareLink || res.data.shareLink || '';
      const transferRewardShareLink = res.data.transferRewardShareLink || '';
      shareConfig.value = {
        verificationEnabled: Boolean(res.data.verificationEnabled),
        shareLink: verificationPurpose.value === 'points'
          ? transferRewardShareLink
          : accessVerificationShareLink,
        accessVerificationShareLink,
        accessDurationMinutes: Number(res.data.accessDurationMinutes ?? 1440) || 1440,
        transferRewardEnabled: Boolean(res.data.transferRewardEnabled ?? true),
        transferRewardShareLink,
        transferRewardPoints: Number(res.data.transferRewardPoints ?? 1000) || 1000,
        transferRewardDurationMinutes: Number(res.data.transferRewardDurationMinutes ?? 1440) || 1440
      };
    }
  } catch (error) {
    console.error('加载分享配置失败:', error);
  }
};

const formatDurationText = (minutes) => {
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    return remainingHours ? `${days}天${remainingHours}小时` : `${days}天`;
  }

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  }

  return `${minutes}分钟`;
};

const getTransferRewardDurationText = () => {
  return formatDurationText(shareConfig.value.transferRewardDurationMinutes || 1440);
};

// 获取访问时长文本
const getAccessDurationText = () => {
  const minutes = shareConfig.value.accessDurationMinutes;
  
  // 默认24小时（每日过期模式）
  if (minutes === 1440) {
    return '当天 23:59 之前有效，次日需重新验证';
  }
  
  // 自定义时长模式
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    if (remainingHours === 0) {
      return `${days}天`;
    } else {
      return `${days}天${remainingHours}小时`;
    }
  } else if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}小时`;
    } else {
      return `${hours}小时${remainingMinutes}分钟`;
    }
  } else {
    return `${minutes}分钟`;
  }
};

// 复制分享链接
const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareConfig.value.shareLink);
    ElMessage.success('链接已复制到剪贴板');
  } catch (error) {
    console.error('复制失败:', error);
    ElMessage.error('复制失败，请手动复制');
  }
};

// 打开分享链接
const openShareLink = () => {
  if (shareConfig.value.shareLink) {
    const opened = openUrlWithNoOpener(shareConfig.value.shareLink);
    if (!opened) {
      ElMessage.warning('弹窗被浏览器阻止，请允许弹窗后重试');
    }
  }
};

// 提交验证
const submitVerification = async () => {
  if (!verificationForm.shareLink?.trim()) {
    verificationForm.error = '请输入您转存后的分享链接';
    return;
  }

  verificationForm.loading = true;
  verificationForm.error = '';

  try {
    const from = getSingleQueryValue(route.query.from);
    const token = getSingleQueryValue(route.query.token);
    const legacyLink = getSingleQueryValue(route.query.link);
    const redirectPath = getSingleQueryValue(route.query.redirect);

    const tokenCookie = useCookie('token');
    const headers = tokenCookie.value
      ? { Authorization: `Bearer ${tokenCookie.value}` }
      : undefined;

    const res = await $fetch('/api/quark/validate', {
      method: 'POST',
      headers,
      body: {
        shareLink: verificationForm.shareLink.trim(),
        purpose: verificationPurpose.value
      }
    });

    if (res.code === 200) {
      if (verificationPurpose.value === 'access') {
        setAccessState(true);
      }

      const reward = res.reward || res.data?.reward;
      if (reward?.granted) {
        ElMessage.success(`验证成功，获得 ${reward.points} 限时积分`);
        await Promise.allSettled([
          userStore.safeRefreshUser(),
          refreshAccessControlConfig()
        ]);
      } else if (reward?.alreadyGranted) {
        ElMessage.success('验证成功，该链接已领取过积分');
      } else {
        ElMessage.success('验证成功，正在跳转...');
      }
      
      // 判断跳转逻辑
      if (from === 'netdisk' && (token || legacyLink)) {
        // 从网盘链接点击过来的，解码并打开链接
        const targetLink = await decodeTargetLink();
        if (targetLink) {
          const opened = openUrlWithNoOpener(targetLink);
          if (!opened) {
            ElMessage.warning('弹窗被浏览器阻止，请允许弹窗后重试');
            return;
          }
        } else {
          ElMessage.error('链接解码失败或已过期');
        }
        
        // 返回上一页或首页
        if (window.history.length > 1) {
          await router.back();
        } else {
          await router.push('/');
        }
      } else {
        // 跳转到原始页面，保留完整的URL路径和参数
        await router.push(redirectPath || '/search');
      }
    } else {
      verificationForm.error = res.msg || '验证失败，请检查您的分享链接';
    }
  } catch (error) {
    console.error('验证分享链接失败:', error);
    verificationForm.error = '验证失败，请稍后重试';
  } finally {
    verificationForm.loading = false;
  }
};

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};

// 页面加载时检查配置
onMounted(() => {
  loadShareConfig();
});
</script>

<style scoped>
/* 自定义样式 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
