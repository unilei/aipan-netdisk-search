<script setup>
import { onMounted } from 'vue';

const token = useCookie('token');
const router = useRouter();

const form = reactive({
  email: "",
  password: "",
  username: "",
});

const formMode = ref('login');

const formRef = ref();

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

const btnLoading = ref(false);

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields();
  form.password = "";
};

// 切换登录/注册模式
const toggleMode = (e) => {
  e.preventDefault();
  formMode.value = formMode.value === 'login' ? 'register' : 'login';
  nextTick(() => {
    resetForm();
  });
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
      ElMessage.error(res?.msg || `${formMode.value === 'login' ? '登录' : '注册'}失败`);
      return;
    }

    token.value = res.data.token;
    ElMessage.success(res.msg);
    // 根据用户角色跳转到不同的仪表盘
    const redirectPath = res.data.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
    navigateTo({ path: redirectPath });
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
  if (token.value) {
    try {
      // 验证当前用户信息
      const userInfo = await $fetch('/api/user/info', {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      });

      if (userInfo.code === 200) {
        // 根据用户角色跳转
        const redirectPath = userInfo.data.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
        router.push(redirectPath);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      // 如果验证失败，清除 token
      token.value = null;
    }
  }
});
</script>

<template>
  <div class="py-52 flex items-center justify-center bg-gray-50 px-4">
    <div class="w-[420px] bg-white p-6 rounded-lg shadow-lg">
      <!-- Logo或标题区域 -->
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ formMode === 'login' ? '登录' : '注册' }}</h1>
        <p class="text-sm text-gray-600 mt-1">
          {{ formMode === 'login' ? '欢迎回来，请登录您的账号' : '欢迎加入，请填写注册信息' }}
        </p>
      </div>

      <!-- 表单 -->
      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top" class="space-y-4"
        @keypress="handleKeyPress">
        <template v-if="formMode === 'register'">
          <el-form-item label="用户名" prop="username" class="custom-form-item">
            <el-input v-model="form.username" placeholder="请输入用户名" prefix-icon="el-icon-user"
              class="custom-input"></el-input>
          </el-form-item>
        </template>

        <el-form-item label="邮箱" prop="email" class="custom-form-item">
          <el-input v-model="form.email" placeholder="请输入邮箱" prefix-icon="el-icon-message"
            class="custom-input"></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password" class="custom-form-item">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" prefix-icon="el-icon-lock" show-password
            class="custom-input"></el-input>
        </el-form-item>

        <!-- 按钮区域 -->
        <div class="pt-2 space-y-4">
          <el-button type="primary" @click="handleSubmit" :loading="btnLoading"
            class="w-full h-10 text-base font-medium rounded-lg hover:opacity-90 transition-opacity">
            {{ btnLoading ? "处理中..." : (formMode === 'login' ? "登录" : "注册") }}
          </el-button>

          <div class="text-center">
            <a href="#" @click="toggleMode" class="text-blue-600 hover:text-blue-700 text-sm">
              {{ formMode === 'login' ? '没有账号？点击注册' : '已有账号？点击登录' }}
            </a>
          </div>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.custom-form-item :deep(.el-form-item__label) {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  padding-bottom: 0.25rem;
  line-height: 1.25;
}

.custom-input :deep(.el-input__wrapper) {
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  height: 2.5rem;
}

.custom-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

:deep(.el-button--primary) {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

:deep(.el-button--primary:hover) {
  background-color: #2563eb;
  border-color: #2563eb;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .w-\[420px\] {
    width: 90vw;
  }
}
</style>
