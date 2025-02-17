<template>
    <div class="min-h-[calc(100vh-60px)] bg-gray-50 p-6">
        <div class="max-w-[1240px] mx-auto space-y-6">
            <!-- 头部 -->
            <div class="bg-white rounded-lg p-6 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">系统配置</h1>
                        <p class="text-gray-500 mt-1">管理系统相关配置信息</p>
                    </div>
                </div>
            </div>

            <!-- 配置表单 -->
            <div class="bg-white rounded-lg p-6 shadow-sm">
                <h2 class="text-lg font-semibold mb-4">夸克网盘配置</h2>
                <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
                    <el-form-item label="API URL" prop="apiUrl">
                        <el-input v-model="form.apiUrl" placeholder="请输入 API URL" />
                    </el-form-item>

                    <el-form-item label="Quark Cookie" prop="quarkCookie">
                        <el-input v-model="form.quarkCookie" type="textarea" :rows="3" placeholder="请输入夸克网盘 Cookie" />
                    </el-form-item>

                    <el-form-item label="资源类型" prop="typeId">
                        <el-select v-model="form.typeId" placeholder="请选择资源类型" class="w-full">
                            <el-option v-for="type in resourceTypes" :key="type.id" :label="type.name"
                                :value="type.id" />
                        </el-select>
                    </el-form-item>

                    <el-form-item>
                        <el-button type="primary" @click="handleSubmit" :loading="loading">
                            保存配置
                        </el-button>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>

<script setup>
definePageMeta({
    middleware: ['admin']
});

const formRef = ref(null);
const loading = ref(false);
const resourceTypes = ref([]);

const form = reactive({
    apiUrl: '',
    quarkCookie: '',
    typeId: ''
});

const rules = {
    apiUrl: [
        { required: true, message: '请输入 API URL', trigger: 'blur' },
        { type: 'url', message: '请输入有效的 URL', trigger: 'blur' }
    ],
    quarkCookie: [
        { required: true, message: '请输入夸克网盘 Cookie', trigger: 'blur' }
    ],
    typeId: [
        { required: true, message: '请选择资源类型', trigger: 'change' }
    ]
};

// 获取资源类型列表
const getResourceTypes = async () => {
    try {
        const res = await $fetch('/api/admin/resourcesType/get', {
            headers: {
                Authorization: `Bearer ${useCookie('token').value}`
            }
        });
        if (res.code === 200) {
            resourceTypes.value = res.data;
        }
    } catch (error) {
        console.error('获取资源类型失败:', error);
        ElMessage.error('获取资源类型失败');
    }
};

// 获取配置
const getConfig = async () => {
    try {
        const res = await $fetch('/api/admin/settings/quark', {
            headers: {
                Authorization: `Bearer ${useCookie('token').value}`
            }
        });
        if (res.code === 200) {
            form.apiUrl = res.data.apiUrl || 'http://127.0.0.1:5000/api/quark/sharepage/save';
            form.quarkCookie = res.data.quarkCookie;
            form.typeId = res.data.typeId;
        }
    } catch (error) {
        console.error('获取配置失败:', error);
        ElMessage.error('获取配置失败');
    }
};

// 保存配置
const handleSubmit = async () => {
    if (!formRef.value) return;

    try {
        const valid = await formRef.value.validate();
        if (!valid) return;

        loading.value = true;

        // 获取当前用户信息
        const userInfo = await $fetch('/api/user/info', {
            headers: {
                Authorization: `Bearer ${useCookie('token').value}`
            }
        });

        if (userInfo.code !== 200) {
            throw new Error('Failed to get user info');
        }

        const res = await $fetch('/api/admin/settings/quark', {
            method: 'POST',
            body: {
                apiUrl: form.apiUrl,
                quarkCookie: form.quarkCookie,
                typeId: form.typeId,
                userId: userInfo.data.id  // 使用当前用户ID
            },
            headers: {
                Authorization: `Bearer ${useCookie('token').value}`
            }
        });

        if (res.code === 200) {
            ElMessage.success('配置保存成功');
        } else {
            ElMessage.error(res.msg || '保存失败');
        }
    } catch (error) {
        console.error('保存配置失败:', error);
        ElMessage.error('保存配置失败');
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    getResourceTypes();
    getConfig();
});
</script>