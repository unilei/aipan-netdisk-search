<template>
    <div class="bg-gray-50 dark:bg-gray-900 min-h-screen pb-12">
        <!-- 顶部横幅 -->
        <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div class="container mx-auto px-4 py-12">
                <div class="max-w-4xl">
                    <h1 class="text-4xl font-bold mb-4">社区论坛</h1>
                    <p class="text-xl text-blue-100 mb-6">分享想法、提问、参与讨论，连接社区中的每一个人</p>
                    <div class="flex space-x-4">
                        <el-button type="primary" size="large" @click="navigateToCreateTopic" :disabled="!user"
                            class="!bg-white !text-purple-700 hover:!bg-purple-50 border-0">
                            <template #icon><i class="fas fa-pen-to-square mr-2"></i></template>
                            发布新主题
                        </el-button>
                        <el-button v-if="!user" type="default" size="large" @click="navigateToLogin"
                            class="!bg-transparent !text-white hover:!bg-purple-600 border border-white">
                            <template #icon><i class="fas fa-sign-in-alt mr-2"></i></template>
                            登录账户
                        </el-button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 分类列表 -->
        <div class="container mx-auto px-4 -mt-6">
            <!-- 统计信息卡片 -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-8 p-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="flex items-center p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div class="bg-purple-100 dark:bg-purple-900 p-3 rounded-full mr-4">
                            <i class="fas fa-comments text-purple-600 dark:text-purple-400"></i>
                        </div>
                        <div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">板块数量</div>
                            <div class="text-xl font-bold">{{ categories?.length || 0 }}</div>
                        </div>
                    </div>
                    <div class="flex items-center p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div class="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                            <i class="fas fa-file-alt text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">主题数量</div>
                            <div class="text-xl font-bold">{{ totalTopics }}</div>
                        </div>
                    </div>
                    <div class="flex items-center p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div class="bg-purple-100 dark:bg-purple-900 p-3 rounded-full mr-4">
                            <i class="fas fa-users text-purple-600 dark:text-purple-400"></i>
                        </div>
                        <div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">社区成员</div>
                            <div class="text-xl font-bold">{{ user ? '已登录' : '未登录' }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                <el-skeleton :rows="3" animated class="mb-6" />
                <el-skeleton :rows="3" animated class="mb-6" />
                <el-skeleton :rows="3" animated />
            </div>

            <div v-else-if="!categories || categories.length === 0"
                class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
                <div class="mb-6">
                    <i class="fas fa-folder-open text-gray-300 text-6xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">暂无论坛分类</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-6">管理员尚未创建任何论坛分类</p>
            </div>

            <div v-else>
                <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-white flex items-center">
                    <i class="fas fa-layer-group mr-2 text-purple-600 dark:text-purple-400"></i>
                    论坛分类
                </h2>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div v-for="category in categories" :key="category.id"
                        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700 flex flex-col">
                        <div class="p-5 flex items-start flex-1">
                            <div v-if="category.icon"
                                class="w-12 h-12 flex-shrink-0 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-4">
                                <i :class="[category.icon, 'text-purple-600 dark:text-purple-400 text-2xl']"></i>
                            </div>
                            <div v-else
                                class="w-12 h-12 flex-shrink-0 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-4">
                                <i class="fas fa-folder text-purple-600 dark:text-purple-400 text-2xl"></i>
                            </div>
                            <div class="flex-1">
                                <h3 class="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
                                    {{ category.name }}
                                </h3>
                                <p class="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{{ category.description }}
                                </p>
                                <div class="flex text-sm text-gray-500 dark:text-gray-400 mb-2">
                                    <div class="flex items-center mr-4">
                                        <i class="fas fa-file-alt mr-1"></i>
                                        <span>{{ category._count?.topics || 0 }} 主题</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div
                            class="px-5 py-3 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700">
                            <NuxtLink :to="`/forum/category/${category.slug}`"
                                class="text-purple-600 dark:text-purple-400 font-medium hover:text-purple-800 dark:hover:text-purple-300 flex items-center justify-between">
                                进入板块
                                <i class="fas fa-arrow-right"></i>
                            </NuxtLink>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
definePageMeta({
    layout: 'default',
    title: '社区论坛',
    middleware: []
})

const router = useRouter()
const userStore = useUserStore()
const user = computed(() => userStore.user)

const { data: categoriesData, pending: loading, error, refresh } = await useFetch('/api/forum/categories')

const categories = computed(() => {
    if (!categoriesData.value || !categoriesData.value.success) return []
    return categoriesData.value.data
})

// 计算总主题数
const totalTopics = computed(() => {
    if (!categories.value) return 0
    return categories.value.reduce((total, category) => {
        return total + (category._count?.topics || 0)
    }, 0)
})

const navigateToCreateTopic = () => {
    if (!user.value) {
        navigateToLogin()
        return
    }
    router.push('/forum/create')
}

const navigateToLogin = () => {
    router.push('/login?redirect=/forum/create')
}

onMounted(() => {
    refresh()
})
</script>

<style>
/* 添加自定义黑暗模式颜色 */
.dark\:bg-gray-750 {
    @apply dark:bg-gray-700/70;
}

/* 添加文本截断 */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>