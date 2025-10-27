<template>
    <div class="min-h-[calc(100vh-60px)] bg-gray-50 dark:bg-gray-900">
        <div class="max-w-[1240px] mx-auto p-6">
            <!-- 头部区域 -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
                <div class="relative h-24 bg-linear-to-r from-blue-500 to-purple-500">
                    <div class="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white/10 backdrop-blur-sm">
                        <div class="flex items-center space-x-2 text-sm text-white">
                            <nuxt-link to="/user/dashboard"
                                class="hover:text-white/80 flex items-center transition-colors duration-200">
                                <el-icon class="mr-1">
                                    <i class="fas fa-home"></i>
                                </el-icon>
                                用户中心
                            </nuxt-link>
                            <span>/</span>
                            <span>VOD 设置</span>
                        </div>
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-2">VOD 视频源配置</h1>
                            <p class="text-gray-500 dark:text-gray-400">
                                管理您的VOD视频源配置，添加自定义源或导入配置文件
                                <el-tag v-if="userStore.loggedIn" size="small" type="success"
                                    class="ml-2">配置将自动保存到您的账户</el-tag>
                            </p>
                        </div>
                        <el-button @click="() => navigateTo('/user/dashboard')" class="flex items-center">
                            <el-icon class="mr-1">
                                <i class="fas fa-arrow-left"></i>
                            </el-icon>
                            返回用户中心
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- 视频源设置组件 -->
            <VodSettings ref="vodSettingsRef" :inline="true" @update:sources="handleSourcesUpdate" />

            <!-- 操作按钮区域 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-200">配置视频源</h2>
                        <el-icon class="text-2xl text-blue-500">
                            <i class="fas fa-cog"></i>
                        </el-icon>
                    </div>
                    <p class="text-gray-500 dark:text-gray-400 mb-4">添加或修改您的视频源</p>
                    <el-button type="primary" @click="openVodSettings" class="w-full">
                        打开配置
                    </el-button>
                </div>
                <div v-if="sources.length > 0"
                    class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-200">导出配置</h2>
                        <el-icon class="text-2xl text-green-500">
                            <i class="fas fa-download"></i>
                        </el-icon>
                    </div>
                    <p class="text-gray-500 dark:text-gray-400 mb-4">导出当前视频源配置</p>
                    <el-button type="success" @click="exportConfig" class="w-full">
                        导出配置文件
                    </el-button>
                </div>
                <div v-if="userStore.loggedIn"
                    class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-200">刷新配置</h2>
                        <el-icon class="text-2xl text-orange-500">
                            <i class="fas fa-sync-alt"></i>
                        </el-icon>
                    </div>
                    <p class="text-gray-500 dark:text-gray-400 mb-4">从云端重新加载配置</p>
                    <el-button type="warning" @click="loadSources" :loading="loading" class="w-full">
                        重新加载
                    </el-button>
                </div>
            </div>

            <!-- 表格区域 -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <template v-if="isLoading || loading">
                    <div class="py-12 flex justify-center items-center">
                        <el-skeleton :rows="5" animated />
                    </div>
                </template>
                <template v-else-if="sources && sources.length">
                    <el-table :data="sources" style="width: 100%" :border="true" class="custom-table">
                        <el-table-column type="index" label="序号" width="80" align="center" />
                        <el-table-column prop="name" label="视频源名称" min-width="200">
                            <template #default="{ row }">
                                <div class="flex items-center group">
                                    <el-icon class="mr-2 text-purple-500">
                                        <i class="fas fa-play-circle"></i>
                                    </el-icon>
                                    <span class="dark:text-gray-200">{{ row.name }}</span>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="type" label="类型" width="120">
                            <template #default="{ row }">
                                <el-tag :type="row.type === 'json' ? 'primary' : 'success'" size="small">
                                    {{ row.type.toUpperCase() }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="api" label="API地址" min-width="250" show-overflow-tooltip>
                            <template #default="{ row }">
                                <div class="flex items-center">
                                    <el-icon class="mr-2 text-blue-500">
                                        <i class="fas fa-link"></i>
                                    </el-icon>
                                    <span class="text-gray-500 dark:text-gray-400 truncate">{{ row.api }}</span>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="playUrl" label="播放器地址" min-width="250" show-overflow-tooltip>
                            <template #default="{ row }">
                                <div class="flex items-center">
                                    <el-icon class="mr-2 text-green-500">
                                        <i class="fas fa-film"></i>
                                    </el-icon>
                                    <span class="text-gray-500 dark:text-gray-400 truncate">{{ row.playUrl }}</span>
                                </div>
                            </template>
                        </el-table-column>
                    </el-table>
                </template>
                <template v-else>
                    <el-empty description="暂无视频源配置">
                        <template #description>
                            <p>您还没有保存任何VOD视频源配置</p>
                        </template>
                        <el-button type="primary" @click="openVodSettings">
                            立即添加
                        </el-button>
                    </el-empty>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'
import { useVodSources } from '~/composables/useVodSources'
import VodSettings from '~/components/search/VodSettings.vue'

definePageMeta({
    middleware: ['auth']
})

const userStore = useUserStore()
const vodSettingsRef = ref(null)
const { sources, isLoading, saveSources, loadSources } = useVodSources()
const loading = ref(false)

// 打开VOD设置对话框
const openVodSettings = () => {
    vodSettingsRef.value.showDialog = true
}

// 处理源更新
const handleSourcesUpdate = async (newSources) => {
    loading.value = true
    try {
        const success = await saveSources(newSources)
        if (success) {
            ElMessage({
                message: '视频源配置已保存',
                type: 'success',
            })
        } else {
            ElMessage({
                message: '视频源配置保存失败',
                type: 'error',
            })
        }
    } catch (error) {
        console.error('保存视频源配置时发生错误:', error)
        ElMessage({
            message: '保存视频源配置时发生错误',
            type: 'error',
        })
    } finally {
        loading.value = false
    }
}

// 导出配置
const exportConfig = () => {
    if (!sources.value.length) return

    // 创建一个Blob对象
    const blob = new Blob([JSON.stringify(sources.value, null, 2)], { type: 'application/json' })

    // 创建下载链接
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `vod-config-${new Date().toISOString().split('T')[0]}.json`

    // 触发下载
    document.body.appendChild(link)
    link.click()

    // 清理
    document.body.removeChild(link)
}

// 在组件挂载时加载用户配置
onMounted(async () => {
    loading.value = true
    try {
        await loadSources()
    } catch (error) {
        console.error('加载视频源配置时发生错误:', error)
        ElMessage({
            message: '加载视频源配置时发生错误',
            type: 'error',
        })
    } finally {
        loading.value = false
    }
})
</script>

<style scoped>
@import "tailwindcss" reference;

:deep(.el-table) {
    --el-table-header-bg-color: theme('colors.gray.50');
    --el-table-row-hover-bg-color: theme('colors.purple.50');
}

:deep(.custom-table) {
    @apply border-t-0 border-l-0 border-r-0;
}

.dark :deep(.el-table) {
    --el-table-header-bg-color: theme('colors.gray.700');
    --el-table-bg-color: theme('colors.gray.800');
    --el-table-tr-bg-color: theme('colors.gray.800');
    --el-table-row-hover-bg-color: theme('colors.gray.700');
    --el-table-border-color: theme('colors.gray.700');
    --el-table-text-color: theme('colors.gray.300');
    --el-table-header-text-color: theme('colors.gray.300');
}

/* 表格行样式 */
.dark :deep(.el-table th.el-table__cell) {
    background-color: theme('colors.gray.700');
}

.dark :deep(.el-table .el-table__cell) {
    color: theme('colors.gray.300');
}

:deep(.el-empty__description p) {
    @apply text-gray-500 dark:text-gray-400;
}
</style>