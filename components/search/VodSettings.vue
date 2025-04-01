<template>
    <div>
        <!-- Settings Button (仅在inline模式下显示) -->
        <el-button v-if="!props.inline" type="warning" plain @click="showDialog = true" title="VOD设置">
            <i class="fas fa-cog mr-1"></i>
            <span>设置</span>
        </el-button>

        <!-- Settings Dialog -->
        <client-only>
            <el-dialog v-model="showDialog" title="VOD 设置" :width="isMobile ? '94%' : '500px'"
                :close-on-click-modal="false" class="vod-settings-dialog" append-to-body :modal-class="'dialog-modal'"
                :lock-scroll="true" align-center fullscreen-class="mobile-fullscreen" :fullscreen="isMobile">
                <div class="space-y-6">
                    <!-- Remote JSON URL -->
                    <div class="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="fas fa-cloud-download-alt text-purple-500 dark:text-purple-400"></i>
                            <label class="text-sm font-medium">远程JSON地址</label>
                        </div>
                        <div class="flex gap-2">
                            <el-input v-model="jsonUrl" placeholder="输入JSON文件URL" clearable>
                                <template #prefix>
                                    <i class="fas fa-link text-gray-400"></i>
                                </template>
                                <template #append>
                                    <el-button type="primary" :loading="loading" @click="loadFromRemote">
                                        <i class="fas fa-download mr-1"></i>
                                        加载
                                    </el-button>
                                </template>
                            </el-input>
                        </div>
                    </div>

                    <!-- Local JSON File -->
                    <div class="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="fas fa-file-upload text-blue-500 dark:text-blue-400"></i>
                            <label class="text-sm font-medium">本地JSON文件</label>
                        </div>
                        <el-upload class="upload-demo w-full" action="" :auto-upload="false" :show-file-list="false"
                            accept=".json" @change="handleFileUpload">
                            <el-button
                                class="w-full h-20 flex flex-col items-center justify-center !bg-white/50 dark:!bg-gray-700/50 hover:!bg-white/70 dark:hover:!bg-gray-700/70">
                                <i class="fas fa-cloud-upload-alt text-2xl mb-2 text-gray-400"></i>
                                <span>点击选择文件</span>
                            </el-button>
                        </el-upload>
                    </div>

                    <!-- Manual Input -->
                    <div class="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-edit text-green-500 dark:text-green-400"></i>
                                <label class="text-sm font-medium">手动输入</label>
                            </div>
                            <el-button type="success" size="small" @click="addNewSource" plain>
                                <i class="fas fa-plus mr-1"></i>
                                添加源
                            </el-button>
                        </div>
                        <div class="max-h-60 overflow-y-auto space-y-4">
                            <div v-for="(source, index) in manualSources" :key="index"
                                class="bg-white/50 dark:bg-gray-700/50 rounded-lg p-4 relative backdrop-blur-sm border border-gray-100 dark:border-gray-600">
                                <el-button class="absolute right-2 top-2" type="danger" size="small" circle
                                    @click="removeSource(index)">
                                    <i class="fas fa-times"></i>
                                </el-button>
                                <div class="grid gap-3 pt-2">
                                    <el-input v-model="source.name" placeholder="名称">
                                        <template #prefix>
                                            <i class="fas fa-tag text-gray-400"></i>
                                        </template>
                                    </el-input>
                                    <el-input v-model="source.api" placeholder="API地址">
                                        <template #prefix>
                                            <i class="fas fa-link text-gray-400"></i>
                                        </template>
                                    </el-input>
                                    <el-input v-model="source.playUrl" placeholder="播放器地址">
                                        <template #prefix>
                                            <i class="fas fa-play text-gray-400"></i>
                                        </template>
                                    </el-input>
                                    <el-input v-model="source.key" placeholder="唯一标识">
                                        <template #prefix>
                                            <i class="fas fa-key text-gray-400"></i>
                                        </template>
                                    </el-input>
                                    <el-select v-model="source.type" placeholder="类型" class="w-full">
                                        <template #prefix>
                                            <i class="fas fa-code text-gray-400"></i>
                                        </template>
                                        <el-option label="JSON" value="json" />
                                        <el-option label="XML" value="xml" />
                                    </el-select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Preview -->
                    <div v-if="currentSources.length"
                        class="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-list text-orange-500 dark:text-orange-400"></i>
                                <label class="text-sm font-medium">当前配置预览</label>
                            </div>
                            <span
                                class="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
                                共 {{ currentSources.length }} 个源
                            </span>
                        </div>
                        <div class="max-h-40 overflow-y-auto">
                            <el-table :data="currentSources" size="small" border>
                                <el-table-column prop="name" label="名称" />
                                <el-table-column prop="type" label="类型" width="80" />
                            </el-table>
                        </div>
                    </div>
                </div>

                <template #footer>
                    <div class="flex justify-between items-center">
                        <el-button @click="resetSources" type="danger" plain>
                            <i class="fas fa-trash-alt mr-1"></i>
                            重置
                        </el-button>
                        <div class="space-x-2">
                            <el-button @click="showDialog = false">取消</el-button>
                            <el-button type="primary" @click="handleSave">
                                <i class="fas fa-save mr-1"></i>
                                保存
                            </el-button>
                        </div>
                    </div>
                </template>
            </el-dialog>
        </client-only>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useWindowSize } from '@vueuse/core'
import { useVodSources } from '~/composables/useVodSources'

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 640)
const { sources: savedSources, saveSources: saveVodSources } = useVodSources()

const props = defineProps({
    inline: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:sources'])

const showDialog = ref(false)
const jsonUrl = ref('')
const loading = ref(false)
const manualSources = ref([])
const currentSources = ref([])

// 从远程加载JSON
const loadFromRemote = async () => {
    if (!jsonUrl.value) {
        ElMessage.warning('请输入JSON地址')
        return
    }

    loading.value = true
    try {
        const response = await fetch(jsonUrl.value)
        const data = await response.json()
        if (Array.isArray(data)) {
            currentSources.value = data
            ElMessage.success('加载成功')
        } else {
            throw new Error('Invalid JSON format')
        }
    } catch (error) {
        ElMessage.error('加载失败：' + error.message)
    } finally {
        loading.value = false
    }
}

// 处理本地文件上传
const handleFileUpload = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result)
            if (Array.isArray(data)) {
                currentSources.value = data
                ElMessage.success('文件加载成功')
            } else {
                throw new Error('Invalid JSON format')
            }
        } catch (error) {
            ElMessage.error('文件解析失败：' + error.message)
        }
    }
    reader.readAsText(file.raw)
}

// 添加新的手动源
const addNewSource = () => {
    manualSources.value.push({
        key: '',
        name: '',
        api: '',
        playUrl: '',
        type: 'json'
    })
}

// 移除手动源
const removeSource = (index) => {
    manualSources.value.splice(index, 1)
}

// 重置所有源
const resetSources = () => {
    currentSources.value = []
    manualSources.value = []
    jsonUrl.value = ''
    ElMessage.success('已重置所有设置')
}

// 保存所有源
const handleSave = async () => {
    // 合并手动输入的源
    const allSources = [...currentSources.value, ...manualSources.value]

    // 检查源的合法性
    const invalidSources = allSources.filter(source =>
        !source.key || !source.name || !source.api || !source.playUrl || !source.type
    )

    if (invalidSources.length > 0) {
        ElMessage.error('部分源配置不完整，请检查所有必填字段')
        return
    }

    // 使用composable保存数据
    loading.value = true
    try {
        const result = await saveVodSources(allSources)
        if (result) {
            // 触发更新
            emit('update:sources', allSources)
            ElMessage.success('保存成功')
            showDialog.value = false
        } else {
            ElMessage.error('保存失败，请重试')
        }
    } catch (error) {
        console.error('保存视频源配置时出错:', error)
        ElMessage.error('保存失败：' + (error.message || '未知错误'))
    } finally {
        loading.value = false
    }
}

// 初始化时加载已保存的设置
onMounted(() => {
    currentSources.value = savedSources.value || []
})

// 暴露方法和属性给父组件
defineExpose({
    showDialog
})
</script>

<style scoped>
.vod-settings-dialog :deep(.el-dialog__body) {
    max-height: 70vh;
    overflow-y: auto;
}

.vod-settings-dialog :deep(.el-upload) {
    width: auto;
}

.vod-settings-dialog :deep(.el-button--small) {
    padding: 6px 12px;
}

/* 修复弹框样式 */
.vod-settings-dialog :deep(.el-dialog) {
    @apply bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-xl backdrop-blur-xl border border-white/20 dark:border-gray-700/20;
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    margin: 0 !important;
}

/* 遮罩层样式 */
:deep(.dialog-modal) {
    @apply bg-black/60 backdrop-blur-sm;
}

.vod-settings-dialog :deep(.el-dialog__header) {
    @apply mb-4 pb-4 border-b border-gray-100/50 dark:border-gray-700/50;
    margin-right: 0;
    padding: 20px 20px 0;
}

.vod-settings-dialog :deep(.el-dialog__headerbtn) {
    @apply top-4 right-4;
}

.vod-settings-dialog :deep(.el-dialog__title) {
    @apply text-gray-900 dark:text-gray-100 font-medium;
}

.vod-settings-dialog :deep(.el-dialog__body) {
    @apply text-gray-600 dark:text-gray-300;
    padding: 0 20px;
}

.vod-settings-dialog :deep(.el-dialog__footer) {
    @apply border-t border-gray-100/50 dark:border-gray-700/50 mt-4;
    padding: 20px;
}

/* 输入框样式 */
.vod-settings-dialog :deep(.el-input__wrapper) {
    @apply bg-white/70 dark:bg-gray-700/70 border-0 backdrop-blur-sm transition-all duration-300;
    box-shadow: none !important;
}

.vod-settings-dialog :deep(.el-input__wrapper:hover) {
    @apply bg-white/90 dark:bg-gray-700/90;
}

.vod-settings-dialog :deep(.el-input__wrapper.is-focus) {
    @apply bg-white dark:bg-gray-700 ring-2 ring-purple-500/50;
}

.vod-settings-dialog :deep(.el-input__inner) {
    @apply text-gray-900 dark:text-gray-100;
}

.vod-settings-dialog :deep(.el-input-group__append) {
    @apply p-0 border-0;
}

.vod-settings-dialog :deep(.el-input-group__append button) {
    @apply border-0 rounded-none rounded-r-lg h-full px-4;
}

.vod-settings-dialog :deep(.el-input__prefix-icon) {
    @apply text-gray-400 dark:text-gray-500;
}

/* Select 样式 */
.vod-settings-dialog :deep(.el-select__wrapper) {
    @apply bg-white/70 dark:bg-gray-700/70 border-0 backdrop-blur-sm transition-all duration-300;
}

.vod-settings-dialog :deep(.el-select__wrapper:hover) {
    @apply bg-white/90 dark:bg-gray-700/90;
}

/* 表格样式 */
.vod-settings-dialog :deep(.el-table) {
    @apply bg-transparent overflow-hidden rounded-lg;
    --el-table-border-color: theme('colors.gray.200' / 50%);
    --el-table-header-bg-color: theme('colors.white' / 70%);
    --el-table-row-hover-bg-color: theme('colors.purple.50' / 50%);
}

.dark .vod-settings-dialog :deep(.el-table) {
    --el-table-border-color: theme('colors.gray.700' / 50%);
    --el-table-header-bg-color: theme('colors.gray.800' / 70%);
    --el-table-row-hover-bg-color: theme('colors.purple.900' / 30%);
}

/* 滚动条样式 */
.vod-settings-dialog :deep(.el-dialog__body)::-webkit-scrollbar {
    @apply w-1.5;
}

.vod-settings-dialog :deep(.el-dialog__body)::-webkit-scrollbar-track {
    @apply bg-transparent;
}

.vod-settings-dialog :deep(.el-dialog__body)::-webkit-scrollbar-thumb {
    @apply bg-gray-300/50 dark:bg-gray-600/50 rounded-full hover:bg-gray-400/50 dark:hover:bg-gray-500/50;
}

/* 按钮动画 */
.vod-settings-dialog :deep(.el-button) {
    @apply transition-all duration-300;
}

.vod-settings-dialog :deep(.el-button:not(.is-disabled):hover) {
    @apply transform scale-105;
    filter: brightness(1.1);
}

/* 卡片悬停效果 */
.source-card {
    @apply transition-all duration-300;
}

.source-card:hover {
    @apply transform scale-[1.02] shadow-lg;
}

/* 移动端适配 */
@media (max-width: 640px) {
    .vod-settings-dialog :deep(.el-dialog) {
        @apply !m-0 max-h-[100vh] !rounded-none;
    }

    .vod-settings-dialog :deep(.el-dialog__body) {
        @apply !p-3;
    }

    .vod-settings-dialog :deep(.el-dialog__header) {
        @apply !p-3 !pb-0;
    }

    .vod-settings-dialog :deep(.el-dialog__footer) {
        @apply !p-3;
    }

    /* 移动端卡片样式 */
    .bg-gray-50\/50 {
        @apply !p-3;
    }

    /* 移动端输入框样式 */
    .el-input :deep(.el-input__wrapper) {
        @apply !text-sm;
    }

    /* 移动端按钮样式 */
    .el-button {
        @apply !text-sm;
    }

    /* 移动端表格样式 */
    .el-table {
        @apply !text-sm;
    }

    /* 移动端间距调整 */
    .space-y-6 {
        @apply !space-y-3;
    }

    .grid.gap-3 {
        @apply !gap-2;
    }

    /* 移动端上传按钮 */
    .upload-demo .el-button {
        @apply !h-16;
    }

    /* 移动端图标大小 */
    .text-2xl {
        @apply !text-xl;
    }

    /* 移动端滚动区域 */
    .max-h-60 {
        @apply !max-h-[40vh];
    }

    .max-h-40 {
        @apply !max-h-[30vh];
    }

    /* 移动端底部按钮组 */
    .el-dialog__footer .space-x-2 {
        @apply !space-x-1;
    }

    /* 移动端预览计数器 */
    .rounded-full {
        @apply !text-xs !px-1.5 !py-0.5;
    }
}

/* 移动端全屏样式 */
:deep(.mobile-fullscreen) {
    @apply !overflow-hidden;
}

:deep(.mobile-fullscreen) .el-dialog__body {
    height: calc(100vh - 120px);
    @apply !overflow-y-auto;
}
</style>