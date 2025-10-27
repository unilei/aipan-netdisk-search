<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div class="max-w-4xl mx-auto px-4">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                <h1 class="text-xl font-medium text-gray-900 dark:text-white mb-4">修复论坛主题Slug</h1>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">此工具将自动修复所有缺失slug的论坛主题</p>

                <div class="flex items-center space-x-4">
                    <el-button type="primary" @click="fixMissingSlugs" :loading="loading"
                        class="!bg-linear-to-r !from-purple-600 !to-blue-600 border-0">
                        <i class="fas fa-wrench mr-2"></i> 修复缺失的Slug
                    </el-button>
                    <el-button @click="router.push('/admin/forum')">
                        <i class="fas fa-arrow-left mr-2"></i> 返回论坛管理
                    </el-button>
                </div>
            </div>

            <!-- 结果显示 -->
            <div v-if="results.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">修复结果</h2>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">成功修复了 {{ results.length }} 个主题</p>

                <el-table :data="results" style="width: 100%" border stripe>
                    <el-table-column prop="id" label="ID" width="80" />
                    <el-table-column prop="title" label="标题" />
                    <el-table-column prop="oldSlug" label="原Slug" />
                    <el-table-column prop="newSlug" label="新Slug" />
                </el-table>
            </div>
        </div>
    </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['admin']
});

const router = useRouter()
const loading = ref(false)
const results = ref([])

// 修复缺失的slug
async function fixMissingSlugs() {
    loading.value = true
    try {
        const response = await $fetch('/api/forum/topics/update-missing-slugs', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${useCookie('token').value}`
            }
        })

        if (response.success) {
            results.value = response.data
            ElMessage.success(response.message || '修复成功')
        } else {
            ElMessage.error(response.message || '修复失败')
        }
    } catch (error) {
        console.error('修复slug失败:', error)
        ElMessage.error('修复失败：' + (error.message || '服务器错误'))
    } finally {
        loading.value = false
    }
}
</script>