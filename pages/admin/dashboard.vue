<script setup>
import { 
    House, 
    Folder, 
    Document, 
    Monitor, 
    ArrowRight, 
    TrendCharts, 
    CircleCheck 
} from '@element-plus/icons-vue'

definePageMeta({
    middleware: ['auth']
})

// 定义卡片数据
const menuCards = [
    {
        title: '网盘管理',
        description: '管理和维护云盘文件系统',
        icon: Folder,
        link: '/admin/clouddrive',
        color: 'bg-blue-500'
    },
    {
        title: '博客管理',
        description: '管理博客文章和内容',
        icon: Document,
        link: '/admin/blog',
        color: 'bg-green-500'
    },
    {
        title: 'Alist源管理',
        description: '管理Alist存储源配置',
        icon: Monitor,
        link: '/admin/alist',
        color: 'bg-purple-500'
    }
]

// 统计数据
const stats = reactive({
    cloudFiles: {
        count: 0,
        loading: true
    },
    blogPosts: {
        count: 0,
        loading: true
    },
    alistSources: {
        count: 0,
        loading: true
    }
})

// 获取云盘文件数量
const getCloudFilesCount = async () => {
    try {
        const res = await $fetch('/api/admin/clouddrive/stats', {
            method: 'GET',
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })
        stats.cloudFiles.count = res.count
    } catch (error) {
        console.error('Failed to fetch cloud files count:', error)
    } finally {
        stats.cloudFiles.loading = false
    }
}

// 获取博客文章数量
const getBlogPostsCount = async () => {
    try {
        const res = await $fetch('/api/admin/blog/posts/stats', {
            method: 'GET',
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })
        stats.blogPosts.count = res.count
    } catch (error) {
        console.error('Failed to fetch blog posts count:', error)
    } finally {
        stats.blogPosts.loading = false
    }
}

// 获取Alist源数量
const getAlistSourcesCount = async () => {
    try {
        const res = await $fetch('/api/admin/alist/stats', {
            method: 'GET',
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })
        stats.alistSources.count = res.count
    } catch (error) {
        console.error('Failed to fetch alist sources count:', error)
    } finally {
        stats.alistSources.loading = false
    }
}

// 页面加载时获取统计数据
onMounted(() => {
    getCloudFilesCount()
    getBlogPostsCount()
    getAlistSourcesCount()
})
</script>

<template>
    <div class="min-h-[calc(100vh-60px)] bg-gray-50 p-6">
        <div class="max-w-[1240px] mx-auto space-y-6">
            <!-- 头部区域 -->
            <div class="bg-white rounded-lg p-6 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">后台管理面板</h1>
                        <p class="text-gray-500 mt-1">欢迎使用管理系统，请选择要进行的操作</p>
                    </div>
                    <el-button type="primary" @click="() => navigateTo('/')" class="flex items-center">
                        <el-icon class="mr-1"><House /></el-icon>
                        返回首页
                    </el-button>
                </div>
            </div>

            <!-- 功能卡片区域 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <NuxtLink 
                    v-for="card in menuCards" 
                    :key="card.title"
                    :to="card.link"
                    class="block"
                >
                    <div 
                        class="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group"
                    >
                        <div class="flex items-start space-x-4">
                            <div 
                                :class="[card.color, 'p-3 rounded-lg text-white']"
                            >
                                <el-icon :size="24"><component :is="card.icon" /></el-icon>
                            </div>
                            <div class="flex-1">
                                <h3 class="text-lg font-semibold text-gray-900 group-hover:text-primary">
                                    {{ card.title }}
                                </h3>
                                <p class="text-gray-500 mt-1 text-sm">
                                    {{ card.description }}
                                </p>
                            </div>
                            <div class="text-gray-400 group-hover:text-primary">
                                <el-icon :size="20"><ArrowRight /></el-icon>
                            </div>
                        </div>
                    </div>
                </NuxtLink>
            </div>

            <!-- 统计信息区域 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div class="flex items-center space-x-2">
                        <el-icon :size="20" class="text-blue-500"><Folder /></el-icon>
                        <h3 class="text-gray-500 text-sm font-medium">云盘文件数</h3>
                    </div>
                    <div class="mt-2 flex items-baseline">
                        <el-skeleton-item v-if="stats.cloudFiles.loading" variant="text" class="w-16 h-8" />
                        <template v-else>
                            <span class="text-2xl font-semibold text-gray-900">{{ stats.cloudFiles.count }}</span>
                            <span class="ml-2 text-sm text-gray-500">个文件</span>
                        </template>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div class="flex items-center space-x-2">
                        <el-icon :size="20" class="text-green-500"><Document /></el-icon>
                        <h3 class="text-gray-500 text-sm font-medium">博客文章数</h3>
                    </div>
                    <div class="mt-2 flex items-baseline">
                        <el-skeleton-item v-if="stats.blogPosts.loading" variant="text" class="w-16 h-8" />
                        <template v-else>
                            <span class="text-2xl font-semibold text-gray-900">{{ stats.blogPosts.count }}</span>
                            <span class="ml-2 text-sm text-gray-500">篇文章</span>
                        </template>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div class="flex items-center space-x-2">
                        <el-icon :size="20" class="text-purple-500"><Monitor /></el-icon>
                        <h3 class="text-gray-500 text-sm font-medium">存储源数量</h3>
                    </div>
                    <div class="mt-2 flex items-baseline">
                        <el-skeleton-item v-if="stats.alistSources.loading" variant="text" class="w-16 h-8" />
                        <template v-else>
                            <span class="text-2xl font-semibold text-gray-900">{{ stats.alistSources.count }}</span>
                            <span class="ml-2 text-sm text-blue-600 flex items-center">
                                <el-icon :size="16" class="mr-0.5"><CircleCheck /></el-icon>
                                活跃
                            </span>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.group:hover .group-hover\:text-primary {
    color: rgb(var(--el-color-primary));
}
</style>