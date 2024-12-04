<script setup>
const form = reactive({
  email: "",
  password: "",
});
const formRef = ref();
const formRules = reactive({
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度需在6-20个字符之间", trigger: "blur" },
  ],
});

const token = useCookie("token", {
  maxAge: 60 * 60,
});

const loginBtnLoading = ref(false);

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields();
  form.password = "";
};

// 登录处理
const login = async () => {
  try {
    const valid = await formRef.value?.validate();
    if (!valid) return;

    loginBtnLoading.value = true;
    const res = await $fetch("/api/user/register", {
      method: "POST",
      body: form,
    }).catch((err) => {
      ElMessage.error("网络请求失败，请稍后重试");
      console.error(err);
      return null;
    });

    if (!res || res.code !== 200) {
      ElMessage.error(res?.msg || "登录失败");
      return;
    }

    token.value = res.data.token;
    ElMessage.success("登录成功");
    navigateTo({ path: "/admin/dashboard" });
  } catch (error) {
    ElMessage.error("登录失败");
    console.error(error);
  } finally {
    loginBtnLoading.value = false;
  }
};

// 处理回车提交
const handleKeyPress = (e) => {
  if (e.key === "Enter") {
    login();
  }
};
</script>

<template>
  <div class="py-52 flex items-center justify-center bg-gray-50 px-4">
    <div class="w-[420px] bg-white p-6 rounded-lg shadow-lg">
      <!-- Logo或标题区域 -->
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">后台管理系统</h1>
        <p class="text-sm text-gray-600 mt-1">欢迎回来，请登录您的账号</p>
      </div>

      <!-- 登录表单 -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-position="top"
        class="space-y-4"
        @keypress="handleKeyPress"
      >
        <el-form-item label="邮箱" prop="email" class="custom-form-item">
          <el-input
            v-model="form.email"
            placeholder="请输入邮箱"
            prefix-icon="el-icon-message"
            class="custom-input"
          ></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password" class="custom-form-item">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            show-password
            class="custom-input"
          ></el-input>
        </el-form-item>

        <!-- 按钮区域 -->
        <div class="pt-2">
          <el-button
            type="primary"
            @click="login"
            :loading="loginBtnLoading"
            class="w-full h-10 text-base font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            {{ loginBtnLoading ? "登录中..." : "登录" }}
          </el-button>
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
