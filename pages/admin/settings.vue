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

            <!-- 群二维码配置 -->
            <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <h2 class="text-lg font-semibold">群二维码配置</h2>
                        <el-tag v-if="groupQrForm.enabled" type="success" size="small">已启用</el-tag>
                        <el-tag v-else type="info" size="small">已禁用</el-tag>
                    </div>
                    <div class="flex items-center gap-4">
                        <el-switch v-model="groupQrForm.enabled" active-text="启用显示" inactive-text="关闭显示" class="ml-2"
                            @change="handleGroupQrEnabledChange" />
                    </div>
                </div>

                <el-form ref="groupQrFormRef" :model="groupQrForm" :rules="groupQrRules" label-width="120px">
                    <el-form-item label="标题" prop="title">
                        <el-input v-model="groupQrForm.title" placeholder="请输入显示标题"
                            :disabled="!groupQrForm.enabled" />
                        <div class="mt-1 text-xs text-gray-500">
                            在搜索结果和页面头部显示的标题文字
                        </div>
                    </el-form-item>

                    <el-form-item label="描述" prop="description">
                        <el-input v-model="groupQrForm.description" type="textarea" :rows="2" placeholder="请输入描述信息"
                            :disabled="!groupQrForm.enabled" />
                        <div class="mt-1 text-xs text-gray-500">
                            显示在二维码下方的描述文字
                        </div>
                    </el-form-item>

                    <el-form-item label="二维码图片" prop="qrCodeUrl">
                        <el-input v-model="groupQrForm.qrCodeUrl" placeholder="请输入二维码图片链接"
                            :disabled="!groupQrForm.enabled">
                            <template #prepend>
                                <span>URL</span>
                            </template>
                        </el-input>
                        <div class="mt-1 text-xs text-gray-500">
                            请输入二维码图片的完整URL地址，支持 https:// 或 http:// 链接
                        </div>
                    </el-form-item>

                    <el-form-item label="显示位置">
                        <div class="space-y-2">
                            <el-checkbox v-model="groupQrForm.showInHeader" :disabled="!groupQrForm.enabled">
                                页面头部（右上角）
                            </el-checkbox>
                            <br>
                            <el-checkbox v-model="groupQrForm.showInSearchResults" :disabled="!groupQrForm.enabled">
                                搜索结果首条
                            </el-checkbox>
                        </div>
                        <div class="mt-1 text-xs text-gray-500">
                            选择二维码显示的位置
                        </div>
                    </el-form-item>

                    <el-form-item>
                        <div class="flex items-center gap-4">
                            <el-button type="primary" @click="handleGroupQrSubmit" :loading="groupQrLoading"
                                :disabled="!groupQrForm.enabled">
                                保存配置
                            </el-button>
                            <el-button @click="resetGroupQrForm" :disabled="!groupQrForm.enabled">
                                重置表单
                            </el-button>
                        </div>
                    </el-form-item>
                </el-form>
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

                <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
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

                    <el-divider></el-divider>

                    <div class="mb-4">
                        <h3 class="text-base font-medium text-gray-900">访问验证配置</h3>
                        <p class="text-xs text-gray-500 mt-1">配置用户访问站点前需要提交的夸克转存信息</p>
                    </div>

                    <el-form-item label="开启验证">
                        <el-switch v-model="form.verificationEnabled" active-text="启用验证" inactive-text="关闭验证" />
                    </el-form-item>

                    <el-form-item label="目标分享链接" prop="shareLink">
                        <el-input v-model="form.shareLink" placeholder="请输入需要用户转存的夸克分享链接"
                            :disabled="!form.verificationEnabled" />
                        <div class="mt-1 text-xs text-gray-500">
                            用户提交的转存链接将与此链接内容比对，仅支持无提取码的公开链接
                        </div>
                    </el-form-item>

                    <el-form-item label="访问时长(分钟)" prop="accessDurationMinutes">
                        <el-input-number v-model="form.accessDurationMinutes" :min="5" :max="1440" :step="5"
                            :disabled="!form.verificationEnabled" class="w-full" />
                        <div class="mt-1 text-xs text-gray-500">
                            验证通过后允许访问的时长，最终到期不会超过当日24点；默认 {{ DEFAULT_ACCESS_DURATION }} 分钟
                        </div>
                    </el-form-item>

                    <el-form-item>
                        <div class="flex items-center gap-4">
                            <el-button type="primary" @click="handleSubmit" :loading="loading">
                                保存配置
                            </el-button>
                            <el-button @click="resetForm">
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
const groupQrLoading = ref(false)
const resourceTypes = ref([])

const musicForm = reactive({
    enabled: true,
    password: 'aipan.me2025'
});

const groupQrForm = reactive({
    enabled: true,
    title: '为防止网站和谐，请扫码获取最新网址',
    description: '长按识别二维码或扫码进群',
    qrCodeUrl: '',
    showInHeader: true,
    showInSearchResults: true
});

const DEFAULT_API_URL = 'http://127.0.0.1:5000/api/quark/sharepage/save';
const DEFAULT_ACCESS_DURATION = 1440;

const form = reactive({
    apiUrl: '',
    quarkCookie: '',
    typeId: '',
    enabled: false,
    verificationEnabled: false,
    shareLink: '',
    accessDurationMinutes: DEFAULT_ACCESS_DURATION
});

const musicRules = {
    password: [
        { required: true, message: '请输入访问密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
    ]
};

const groupQrRules = {
    title: [
        { required: true, message: '请输入标题', trigger: 'blur' },
        { min: 1, max: 100, message: '标题长度在 1 到 100 个字符', trigger: 'blur' }
    ],
    description: [
        { max: 200, message: '描述长度不能超过 200 个字符', trigger: 'blur' }
    ],
    qrCodeUrl: [
        {
            validator: (rule, value, callback) => {
                if (!groupQrForm.enabled) {
                    callback();
                    return;
                }
                if (!value || value.trim() === '') {
                    callback(new Error('启用显示时二维码图片链接不能为空'));
                    return;
                }
                try {
                    new URL(value);
                    callback();
                } catch (error) {
                    callback(new Error('请输入有效的URL地址'));
                }
            },
            trigger: 'blur'
        }
    ]
};

const validateUrl = (_rule, value, callback) => {
    if (!form.enabled) {
        callback();
        return;
    }

    if (!value) {
        callback(new Error('请输入 API URL'));
        return;
    }

    try {
        new URL(value);
        callback();
    } catch (error) {
        callback(new Error('请输入有效的 URL'));
    }
};

const requiredWhenEnabled = (message) => {
    return (_rule, value, callback) => {
        if (!form.enabled) {
            callback();
            return;
        }
        if (value === undefined || value === null || value === '') {
            callback(new Error(message));
            return;
        }
        callback();
    };
};

const validateShareLink = (_rule, value, callback) => {
    if (!form.verificationEnabled) {
        callback();
        return;
    }

    if (!value) {
        callback(new Error('请输入夸克分享链接'));
        return;
    }

    const pattern = /https?:\/\/pan\.quark\.cn\/s\/[A-Za-z0-9]+/;
    if (!pattern.test(value)) {
        callback(new Error('请输入有效的夸克分享链接'));
        return;
    }

    callback();
};

const validateAccessDuration = (_rule, value, callback) => {
    if (!form.verificationEnabled) {
        callback();
        return;
    }

    if (typeof value !== 'number') {
        callback(new Error('请输入访问时长'));
        return;
    }

    if (value < 5) {
        callback(new Error('访问时长至少为5分钟'));
        return;
    }

    if (value > 1440) {
        callback(new Error('访问时长不能超过1440分钟'));
        return;
    }

    callback();
};

const rules = {
    apiUrl: [
        { validator: validateUrl, trigger: 'blur' }
    ],
    quarkCookie: [
        { validator: requiredWhenEnabled('请输入夸克网盘 Cookie'), trigger: 'blur' }
    ],
    typeId: [
        { validator: requiredWhenEnabled('请选择资源类型'), trigger: 'change' }
    ],
    shareLink: [
        { validator: validateShareLink, trigger: 'blur' }
    ],
    accessDurationMinutes: [
        { validator: validateAccessDuration, trigger: ['blur', 'change'] }
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
        form.verificationEnabled = false;
        form.shareLink = '';
        form.accessDurationMinutes = DEFAULT_ACCESS_DURATION;
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
            form.quarkCookie = res.data.quarkCookie || '';
            form.typeId = res.data.typeId || '';
            form.enabled = res.data.enabled ?? false;
            form.verificationEnabled = res.data.verificationEnabled ?? false;
            form.shareLink = res.data.shareLink || '';
            form.accessDurationMinutes = res.data.accessDurationMinutes ?? DEFAULT_ACCESS_DURATION;
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
                userId: userInfo.data.id,
                enabled: form.enabled,
                verificationEnabled: form.verificationEnabled,
                shareLink: form.shareLink,
                accessDurationMinutes: form.accessDurationMinutes
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
const groupQrFormRef = ref(null);

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

// 群二维码相关方法
const handleGroupQrEnabledChange = (value) => {
    if (!value) {
        ElMessageBox.confirm(
            '关闭群二维码显示将隐藏所有相关内容，是否继续？',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        ).then(() => {
            handleGroupQrSubmit();
        }).catch(() => {
            groupQrForm.enabled = true;
        });
    } else {
        handleGroupQrSubmit();
    }
};

const resetGroupQrForm = () => {
    ElMessageBox.confirm(
        '确定要重置群二维码配置吗？',
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(() => {
        groupQrFormRef.value?.resetFields();
        groupQrForm.title = '为防止网站和谐，请扫码获取最新网址';
        groupQrForm.description = '长按识别二维码或扫码进群';
        groupQrForm.qrCodeUrl = '';
        groupQrForm.showInHeader = true;
        groupQrForm.showInSearchResults = true;
        handleGroupQrSubmit();
    });
};

const handleGroupQrSubmit = async () => {
    if (!groupQrFormRef.value) return;

    try {
        if (groupQrForm.enabled) {
            const valid = await groupQrFormRef.value.validate();
            if (!valid) return;
        }

        groupQrLoading.value = true;

        const res = await $fetch('/api/admin/settings/group-qr', {
            method: 'POST',
            body: {
                enabled: groupQrForm.enabled,
                title: groupQrForm.title,
                description: groupQrForm.description,
                qrCodeUrl: groupQrForm.qrCodeUrl,
                showInHeader: groupQrForm.showInHeader,
                showInSearchResults: groupQrForm.showInSearchResults
            },
            headers: {
                Authorization: `Bearer ${useCookie('token').value}`
            }
        });

        if (res.code === 200) {
            ElMessage.success('群二维码配置保存成功');
        } else {
            ElMessage.error(res.msg || '保存失败');
        }
    } catch (error) {
        console.error('保存群二维码配置失败:', error);
        ElMessage.error('保存配置失败');
    } finally {
        groupQrLoading.value = false;
    }
};

const getGroupQrConfig = async () => {
    try {
        const res = await $fetch('/api/admin/settings/group-qr', {
            headers: {
                Authorization: `Bearer ${useCookie('token').value}`
            }
        });
        if (res.code === 200) {
            groupQrForm.enabled = res.data.enabled ?? true;
            groupQrForm.title = res.data.title || '为防止网站和谐，请扫码获取最新网址';
            groupQrForm.description = res.data.description || '长按识别二维码或扫码进群';
            groupQrForm.qrCodeUrl = res.data.qrCodeUrl || '';
            groupQrForm.showInHeader = res.data.showInHeader ?? true;
            groupQrForm.showInSearchResults = res.data.showInSearchResults ?? true;
        }
    } catch (error) {
        console.error('获取群二维码配置失败:', error);
        ElMessage.error('获取群二维码配置失败');
    }
};

onMounted(() => {
    getResourceTypes();
    getConfig();
    getMusicConfig();
    getGroupQrConfig();
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
