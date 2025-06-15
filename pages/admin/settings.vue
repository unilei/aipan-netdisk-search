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

            <!-- 音乐验证码配置 -->
            <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <h2 class="text-lg font-semibold">音乐验证码配置</h2>
                        <el-tag v-if="musicForm.enabled" type="success" size="small">已启用</el-tag>
                        <el-tag v-else type="info" size="small">已禁用</el-tag>
                    </div>
                    <div class="flex items-center gap-4">
                        <el-switch v-model="musicForm.enabled" active-text="启用验证" inactive-text="关闭验证" class="ml-2"
                            @change="handleMusicEnabledChange" />
                    </div>
                </div>

                <el-form ref="musicFormRef" :model="musicForm" :rules="musicRules" label-width="120px"
                    :disabled="!musicForm.enabled">
                    <el-form-item label="访问密码" prop="password">
                        <el-input v-model="musicForm.password" placeholder="请输入音乐页面访问密码" :disabled="!musicForm.enabled"
                            show-password>
                            <template #append>
                                <el-button @click="resetMusicPassword">
                                    重置
                                </el-button>
                            </template>
                        </el-input>
                        <div class="mt-1 text-xs text-gray-500">
                            默认密码：aipan.me2025
                        </div>
                    </el-form-item>

                    <el-form-item>
                        <div class="flex items-center gap-4">
                            <el-button type="primary" @click="handleMusicSubmit" :loading="musicLoading"
                                :disabled="!musicForm.enabled">
                                保存配置
                            </el-button>
                            <el-button @click="resetMusicForm" :disabled="!musicForm.enabled">
                                重置表单
                            </el-button>
                        </div>
                    </el-form-item>
                </el-form>
            </div>

            <!-- 夸克网盘配置 -->
            <div class="bg-white rounded-lg p-6 shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <h2 class="text-lg font-semibold">夸克网盘配置</h2>
                        <el-tag v-if="form.enabled" type="success" size="small">已启用</el-tag>
                        <el-tag v-else type="info" size="small">已禁用</el-tag>
                    </div>
                    <div class="flex items-center gap-4">
                        <el-switch v-model="form.enabled" active-text="启用转存" inactive-text="关闭转存" class="ml-2"
                            @change="handleEnabledChange" />
                    </div>
                </div>

                <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" :disabled="!form.enabled">
                    <el-form-item label="API URL" prop="apiUrl">
                        <el-input v-model="form.apiUrl" placeholder="请输入 API URL" :disabled="!form.enabled">
                            <template #append>
                                <el-button @click="resetApiUrl">
                                    重置
                                </el-button>
                            </template>
                        </el-input>
                        <div class="mt-1 text-xs text-gray-500">
                            默认值：http://127.0.0.1:5000/api/quark/sharepage/save
                        </div>
                    </el-form-item>

                    <el-form-item label="Quark Cookie" prop="quarkCookie">
                        <el-input v-model="form.quarkCookie" type="textarea" :rows="3" placeholder="请输入夸克网盘 Cookie"
                            :disabled="!form.enabled" />
                        <div class="mt-1 text-xs text-gray-500">
                            请从夸克网盘页面获取 Cookie，确保包含必要的认证信息
                        </div>
                    </el-form-item>

                    <el-form-item label="资源类型" prop="typeId">
                        <el-select v-model="form.typeId" placeholder="请选择资源类型" class="w-full" :disabled="!form.enabled">
                            <el-option v-for="type in resourceTypes" :key="type.id" :label="type.name"
                                :value="type.id" />
                        </el-select>
                        <div class="mt-1 text-xs text-gray-500">
                            选择转存资源的默认分类
                        </div>
                    </el-form-item>

                    <el-form-item>
                        <div class="flex items-center gap-4">
                            <el-button type="primary" @click="handleSubmit" :loading="loading"
                                :disabled="!form.enabled">
                                保存配置
                            </el-button>
                            <el-button @click="resetForm" :disabled="!form.enabled">
                                重置表单
                            </el-button>
                        </div>
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
const loading = ref(false)
const musicLoading = ref(false)
const resourceTypes = ref([])

const musicForm = reactive({
    enabled: true,
    password: 'aipan.me2025'
});

const DEFAULT_API_URL = 'http://127.0.0.1:5000/api/quark/sharepage/save';

const form = reactive({
    apiUrl: '',
    quarkCookie: '',
    typeId: '',
    enabled: false
});

const musicRules = {
    password: [
        { required: true, message: '请输入访问密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
    ]
};

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

// 处理启用状态变化
const handleEnabledChange = (value) => {
    if (!value) {
        ElMessageBox.confirm(
            '关闭转存功能将停止所有自动转存操作，是否继续？',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        ).then(() => {
            handleSubmit();
        }).catch(() => {
            form.enabled = true;
        });
    }
};

// 重置 API URL
const resetApiUrl = () => {
    form.apiUrl = DEFAULT_API_URL;
};

// 重置表单
const resetForm = () => {
    ElMessageBox.confirm(
        '确定要重置所有配置吗？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(() => {
        formRef.value?.resetFields();
        form.apiUrl = DEFAULT_API_URL;
    });
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
            form.apiUrl = res.data.apiUrl || DEFAULT_API_URL;
            form.quarkCookie = res.data.quarkCookie;
            form.typeId = res.data.typeId;
            form.enabled = res.data.enabled;
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
        // 如果是禁用状态，跳过表单验证
        if (form.enabled) {
            const valid = await formRef.value.validate();
            if (!valid) return;
        }

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
                userId: userInfo.data.id,
                enabled: form.enabled
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

// 音乐验证码相关方法
const musicFormRef = ref(null);

const handleMusicEnabledChange = (value) => {
    if (!value) {
        ElMessageBox.confirm(
            '关闭音乐验证将允许所有用户访问音乐页面，是否继续？',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        ).then(() => {
            handleMusicSubmit();
        }).catch(() => {
            musicForm.enabled = true;
        });
    } else {
        // 启用验证时也需要调用API更新字段
        handleMusicSubmit();
    }
};

const resetMusicPassword = () => {
    musicForm.password = 'aipan.me2025';
    // 调用API保存到数据库
    handleMusicSubmit();
};

const resetMusicForm = () => {
    ElMessageBox.confirm(
        '确定要重置音乐验证码配置吗？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(() => {
        musicFormRef.value?.resetFields();
        musicForm.password = 'aipan.me2025';
        // 调用API保存到数据库
        handleMusicSubmit();
    });
};

const handleMusicSubmit = async () => {
    if (!musicFormRef.value) return;

    try {
        if (musicForm.enabled) {
            const valid = await musicFormRef.value.validate();
            if (!valid) return;
        }

        musicLoading.value = true;

        const res = await $fetch('/api/admin/settings/music', {
            method: 'POST',
            body: {
                enabled: musicForm.enabled,
                password: musicForm.password
            },
            headers: {
                Authorization: `Bearer ${useCookie('token').value}`
            }
        });

        if (res.code === 200) {
            ElMessage.success('音乐验证码配置保存成功');
        } else {
            ElMessage.error(res.msg || '保存失败');
        }
    } catch (error) {
        console.error('保存音乐验证码配置失败:', error);
        ElMessage.error('保存配置失败');
    } finally {
        musicLoading.value = false;
    }
};

const getMusicConfig = async () => {
    try {
        const res = await $fetch('/api/admin/settings/music', {
            headers: {
                Authorization: `Bearer ${useCookie('token').value}`
            }
        });
        if (res.code === 200) {
            musicForm.enabled = res.data.enabled ?? true;
            musicForm.password = res.data.password || 'aipan.me2025';
        }
    } catch (error) {
        console.error('获取音乐验证码配置失败:', error);
        ElMessage.error('获取音乐验证码配置失败');
    }
};

onMounted(() => {
    getResourceTypes();
    getConfig();
    getMusicConfig();
});
</script>

<style scoped>
.el-form :deep(.el-form-item__label) {
    font-weight: 500;
}

.el-input :deep(.el-input__wrapper),
.el-select :deep(.el-input__wrapper) {
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.el-input :deep(.el-input__wrapper.is-focus),
.el-select :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}
</style>