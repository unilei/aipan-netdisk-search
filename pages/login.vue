<script setup>
import { onMounted } from 'vue';
import { useUserStore } from '~/stores/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const { refreshAccessControlConfig } = useAccessControlConfig();

const form = reactive({
  email: "",
  password: "",
  username: "",
  agreedToTerms: false,
});

const formMode = ref('login');
const formRef = ref();
const btnLoading = ref(false);
const pendingActivationEmail = ref('');
const resendLoading = ref(false);

const safeRedirectPath = computed(() => {
  const redirect = route.query.redirect;
  const requestedRedirect = Array.isArray(redirect) ? redirect[0] : redirect;

  if (
    typeof requestedRedirect === "string" &&
    requestedRedirect.startsWith("/") &&
    !requestedRedirect.startsWith("//")
  ) {
    return requestedRedirect;
  }

  return "";
});

const defaultRedirectPath = (user) => {
  return user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
};

// 动态表单验证规则
const formRules = computed(() => ({
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度需在6-20个字符之间", trigger: "blur" },
  ],
  ...(formMode.value === 'register' ? {
    username: [
      { required: true, message: "请输入用户名", trigger: "blur" },
      { min: 2, max: 20, message: "用户名长度需在2-20个字符之间", trigger: "blur" },
    ]
  } : {})
}));

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields();
  form.password = "";
};

// 切换登录/注册模式
const toggleMode = (e) => {
  e.preventDefault();
  formMode.value = formMode.value === 'login' ? 'register' : 'login';
  pendingActivationEmail.value = '';
  nextTick(() => {
    resetForm();
  });
};

const handleResendActivation = async () => {
  if (!pendingActivationEmail.value) {
    return;
  }

  resendLoading.value = true;

  try {
    const res = await $fetch('/api/user/email/resend', {
      method: 'POST',
      body: {
        email: pendingActivationEmail.value,
      },
    });

    if (res?.code === 200) {
      ElMessage.success(res.msg);
      return;
    }

    ElMessage.error(res?.msg || '重发激活邮件失败');
  } catch (error) {
    console.error('重发激活邮件失败:', error);
    ElMessage.error('重发激活邮件失败');
  } finally {
    resendLoading.value = false;
  }
};

// 表单提交处理
const handleSubmit = async () => {
  try {
    const valid = await formRef.value?.validate();
    if (!valid) return;

    // 根据当前模式验证必要字段
    if (formMode.value === 'register' && !form.username) {
      ElMessage.error('请输入用户名');
      return;
    }

    // 注册时验证是否同意协议
    if (formMode.value === 'register' && !form.agreedToTerms) {
      ElMessage.warning('请阅读并同意用户服务协议和隐私政策');
      return;
    }

    btnLoading.value = true;
    const endpoint = formMode.value === 'login' ? '/api/user/login' : '/api/user/register';

    // 根据不同模式准备不同的提交数据
    const submitData = formMode.value === 'login'
      ? { email: form.email, password: form.password }
      : { email: form.email, password: form.password, username: form.username };

    const res = await $fetch(endpoint, {
      method: "POST",
      body: submitData,
    }).catch((err) => {
      ElMessage.error("网络请求失败，请稍后重试");
      console.error(err);
      return null;
    });

    if (!res || res.code !== 200) {
      if (res?.data?.requiresEmailActivation) {
        pendingActivationEmail.value = res.data.email || form.email;
      }
      ElMessage.error(res?.msg || `${formMode.value === 'login' ? '登录' : '注册'}失败`);
      return;
    }

    if (res.data?.requiresEmailActivation) {
      pendingActivationEmail.value = res.data.email || form.email;
      ElMessage.success(res.msg);
      formMode.value = 'login';
      form.password = '';
      return;
    }

    // 先清除旧的用户数据，再设置新的用户信息
    userStore.clearUser();
    await nextTick(); // 确保清除操作完成
    userStore.setUser(res.data.user, res.data.token);
    refreshAccessControlConfig().catch(error => {
      console.warn('Failed to refresh access control config after login:', error);
    });

    if (res.data?.showEmailActivationPrompt) {
      pendingActivationEmail.value = res.data.user?.email || '';
    }

    ElMessage.success(res.msg);

    const redirectPath = safeRedirectPath.value || defaultRedirectPath(res.data.user);

    // 先跳转，再在后台刷新用户信息
    await navigateTo(redirectPath);

    // 在后台安全刷新用户信息以确保数据一致性（不影响跳转）
    userStore.safeRefreshUser().catch(error => {
      console.warn('Failed to refresh user info after login:', error);
    });
  } catch (error) {
    ElMessage.error(`${formMode.value === 'login' ? '登录' : '注册'}失败`);
    console.error(error);
  } finally {
    btnLoading.value = false;
  }
};

// 处理回车提交
const handleKeyPress = (e) => {
  if (e.key === "Enter") {
    handleSubmit();
  }
};

// 添加登录状态检查
onMounted(async () => {
  if (route.query.verified === '1') {
    ElMessage.success('邮箱激活成功，请登录');
  }

  if (userStore.loggedIn) {
    const redirectPath = safeRedirectPath.value || defaultRedirectPath(userStore.user);
    router.push(redirectPath);
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
    <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div class="relative h-32 bg-linear-to-r from-blue-500 to-purple-500 flex items-center justify-center">
        <div class="absolute inset-0 bg-black opacity-20"></div>
        <h1 class="text-3xl font-bold text-white z-10">{{ formMode === 'login' ? '欢迎回来' : '创建账号' }}</h1>
      </div>

      <div class="p-8">
        <p class="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
          {{ formMode === 'login' ? '登录您的账号以访问全部功能' : '注册新账号加入我们的社区' }}
        </p>

        <div
          v-if="pendingActivationEmail"
          class="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-200"
        >
          <p>邮箱 {{ pendingActivationEmail }} 尚未激活，请先完成邮箱验证。</p>
          <button
            type="button"
            class="mt-3 inline-flex items-center rounded-md bg-amber-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="resendLoading"
            @click="handleResendActivation"
          >
            <i v-if="resendLoading" class="fa-solid fa-circle-notch fa-spin mr-2"></i>
            重发激活邮件
          </button>
        </div>

        <!-- 表单 -->
        <el-form ref="formRef" :model="form" :rules="formRules" label-position="top" class="space-y-5"
          @keypress="handleKeyPress">
          <template v-if="formMode === 'register'">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" placeholder="请输入用户名">
                <template #prefix>
                  <i class="fa-solid fa-user text-gray-400"></i>
                </template>
              </el-input>
            </el-form-item>
          </template>

          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱">
              <template #prefix>
                <i class="fa-solid fa-envelope text-gray-400"></i>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password>
              <template #prefix>
                <i class="fa-solid fa-lock text-gray-400"></i>
              </template>
            </el-input>
          </el-form-item>

          <!-- 注册时的协议同意 -->
          <template v-if="formMode === 'register'">
            <el-form-item>
              <div class="flex items-start sm:items-center space-x-2">
                <el-checkbox v-model="form.agreedToTerms" />
                <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  我已阅读并同意
                  <nuxt-link to="/user-agreement" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">《用户服务协议》</nuxt-link>
                  和
                  <nuxt-link to="/privacy-policy" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">《隐私政策》</nuxt-link>
                </p>
              </div>
            </el-form-item>
          </template>

          <!-- 按钮区域 -->
          <div class="pt-2 space-y-4">
            <button type="button" @click="handleSubmit" :disabled="btnLoading"
              class="w-full bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed">
              <i v-if="btnLoading" class="fa-solid fa-circle-notch fa-spin mr-2"></i>
              <span>{{ btnLoading ? "处理中..." : (formMode === 'login' ? "登录" : "注册") }}</span>
            </button>

            <div class="text-center mt-4">
              <a href="#" @click="toggleMode" class="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                {{ formMode === 'login' ? '没有账号？点击注册' : '已有账号？点击登录' }}
              </a>
            </div>
          </div>
        </el-form>

        <!-- 社交登录或其他信息 -->
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p class="text-xs text-center text-gray-500 dark:text-gray-400">
            登录即表示您同意我们的
            <nuxt-link to="/user-agreement" class="text-blue-600 dark:text-blue-400 hover:underline">用户协议</nuxt-link>、
            <nuxt-link to="/privacy-policy" class="text-blue-600 dark:text-blue-400 hover:underline">隐私政策</nuxt-link>
            和
            <nuxt-link to="/disclaimer" class="text-blue-600 dark:text-blue-400 hover:underline">免责声明</nuxt-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-form-item__label) {
  font-size: 0.9rem;
  font-weight: 500;
  color: #4b5563;
  padding-bottom: 0.25rem;
}

:deep(.el-input__wrapper) {
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

:deep(.el-input__prefix) {
  padding-left: 0.5rem;
}

/* 黑暗模式下的样式调整 */
.dark :deep(.el-input__wrapper) {
  background-color: #1f2937;
  box-shadow: none;
  border: 1px solid #374151;
}

.dark :deep(.el-input__inner) {
  color: #f3f4f6;
}

.dark :deep(.el-form-item__label) {
  color: #d1d5db;
}

/* 按钮悬停效果 */
button:hover:not(:disabled) {
  transform: translateY(-1px);
}

/* 加载动画效果 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.fa-spin {
  animation: spin 1s linear infinite;
}
</style>
