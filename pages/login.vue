<script setup>
const form = reactive({
    email: '',
    password: ''
})
const formRef = ref()
const formRules = reactive({
    email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
    ],
})
const token = useCookie('token', {
    maxAge: 60 * 60
})
const loginBtnLoading = ref(false)
const login = async () => {

    formRef.value.validate(async (valid) => {
        if (!valid) return
        loginBtnLoading.value = true
        const res = await $fetch('/api/user/register', {
            method: 'POST',
            body: form
        })
        if (res.code !== 200) {
            ElMessage.error(res.msg)
            loginBtnLoading.value = false
            return
        }
        token.value = res.data.token;
        navigateTo({ path: '/admin/dashboard' })
        loginBtnLoading.value = false
    })

}

</script>
<template>
    <div class="p-20 space-y-10">
        <h1 class="text-center">后台管理面板</h1>
        <div class="max-w-sm mx-auto space-y-10">
            <el-form ref="formRef" :model="form" :rules="formRules" label-width="auto" label-position="top">
                <el-form-item label="邮箱" prop="email">
                    <el-input v-model="form.email" placeholder="请输入邮箱"></el-input>
                </el-form-item>
                <el-form-item label="密码" prop="password">
                    <el-input v-model="form.password" type="password" placeholder="请输入密码"></el-input>
                </el-form-item>
            </el-form>
            <div class="text-center">
                <el-button type="primary" @click="login()" :loading="loginBtnLoading">登录</el-button>
            </div>
        </div>
    </div>
</template>