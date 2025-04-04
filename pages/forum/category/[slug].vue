<template>
    <div class="bg-gray-50 dark:bg-gray-900 min-h-screen pb-12">
        <!-- 返回导航 -->
        <div
            class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
            <div class="container mx-auto px-4">
                <div class="py-4 flex items-center text-sm">
                    <NuxtLink to="/forum"
                        class="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center">
                        <i class="fas fa-home mr-1"></i>
                        论坛首页
                    </NuxtLink>
                    <i class="fas fa-chevron-right mx-2 text-gray-400 text-xs"></i>
                    <span class="text-gray-900 dark:text-white font-medium">{{ category?.name || '加载中...' }}</span>
                </div>
            </div>
        </div>

        <div class="container mx-auto px-4 py-6">
            <div v-if="loading" class="flex flex-col space-y-4">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <el-skeleton :rows="2" animated />
                </div>
                <div v-for="i in 5" :key="i" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <el-skeleton :rows="3" animated />
                </div>
            </div>

            <div v-else>
                <!-- 分类信息卡片 -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <div class="flex items-start justify-between">
                        <div class="flex items-start">
                            <div
                                class="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-5 flex-shrink-0">
                                <i
                                    :class="[category?.icon || 'fas fa-folder', 'text-purple-600 dark:text-purple-400 text-3xl']"></i>
                            </div>
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">{{ category?.name }}
                                </h1>
                                <p class="text-gray-600 dark:text-gray-300 text-lg">{{ category?.description }}</p>
                                <div class="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <div class="flex items-center mr-4">
                                        <i class="fas fa-file-alt mr-1"></i>
                                        <span>{{ pagination?.total || 0 }} 主题</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <el-button type="primary" size="large" @click="navigateToCreateTopic"
                                class="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 border-0"
                                :disabled="!user">
                                <template #icon><i class="fas fa-pen-to-square mr-2"></i></template>
                                发布新主题
                            </el-button>
                            <div v-if="!user" class="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                                需要 <a @click="navigateToLogin"
                                    class="text-purple-600 dark:text-purple-400 cursor-pointer hover:underline">登录</a>
                                后发布
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 主题列表 -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
                    <div v-if="!topics || topics.length === 0" class="p-12 text-center">
                        <div class="mb-6">
                            <i class="fas fa-comments text-gray-300 text-6xl"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">暂无主题</h3>
                        <p class="text-gray-500 mb-6">成为第一个发表主题的用户</p>
                        <el-button v-if="user" type="primary" @click="navigateToCreateTopic"
                            class="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 border-0">
                            发布新主题
                        </el-button>
                        <el-button v-else type="primary" @click="navigateToLogin"
                            class="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 border-0">
                            登录后发布
                        </el-button>
                    </div>

                    <div v-else>
                        <div
                            class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 py-3 px-6 text-sm text-gray-500 dark:text-gray-400 flex">
                            <div class="flex-1">主题</div>
                            <div class="w-32 text-center hidden md:block">回复</div>
                            <div class="w-32 text-center hidden md:block">浏览</div>
                            <div class="w-48 text-center hidden md:block">最后回复</div>
                        </div>
                        <ul>
                            <li v-for="topic in topics" :key="topic.id"
                                class="border-b border-gray-100 dark:border-gray-700 last:border-none hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                <NuxtLink :to="`/forum/topic/${topic.slug}`" class="block py-4 px-6">
                                    <div class="flex">
                                        <div class="flex-1 min-w-0 pr-4">
                                            <div class="flex items-center mb-1">
                                                <span v-if="topic.isSticky"
                                                    class="inline-block bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-medium px-2 py-0.5 rounded-full mr-2">
                                                    <i class="fas fa-thumbtack mr-1"></i>置顶
                                                </span>
                                                <span v-if="topic.isLocked"
                                                    class="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium px-2 py-0.5 rounded-full mr-2">
                                                    <i class="fas fa-lock mr-1"></i>已锁定
                                                </span>
                                                <h3 class="text-lg font-medium text-gray-900 dark:text-white truncate">
                                                    {{ topic.title }}
                                                </h3>
                                            </div>
                                            <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                <div class="flex items-center mr-3">
                                                    <div
                                                        class="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 mr-1 overflow-hidden">
                                                        <span>{{ topic.author.username.charAt(0).toUpperCase() }}</span>
                                                    </div>
                                                    <span>{{ topic.author.username }}</span>
                                                </div>
                                                <span class="mr-3 hidden sm:inline">
                                                    <i class="far fa-clock mr-1"></i>{{ formatDate(topic.createdAt) }}
                                                </span>
                                            </div>
                                        </div>

                                        <div
                                            class="w-32 text-center flex flex-col justify-center items-center hidden md:flex">
                                            <span class="text-xl font-semibold text-purple-600 dark:text-purple-400">{{
                                                topic._count.posts
                                            }}</span>
                                            <span class="text-xs text-gray-500 dark:text-gray-400">回复</span>
                                        </div>

                                        <div
                                            class="w-32 text-center flex flex-col justify-center items-center hidden md:flex">
                                            <span class="text-xl font-semibold text-gray-700 dark:text-gray-300">{{
                                                topic.viewCount
                                            }}</span>
                                            <span class="text-xs text-gray-500 dark:text-gray-400">浏览</span>
                                        </div>

                                        <div v-if="topic.lastActivityAt" class="w-48 text-center hidden md:block">
                                            <div class="text-sm text-gray-500 dark:text-gray-400">{{
                                                formatDate(topic.lastActivityAt) }}
                                            </div>
                                        </div>
                                        <div v-else class="w-48 text-center hidden md:block">
                                            <div class="text-sm text-gray-400 dark:text-gray-500">暂无回复</div>
                                        </div>
                                    </div>
                                </NuxtLink>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- 分页 -->
                <div v-if="pagination && pagination.totalPages > 1" class="flex justify-center mt-8">
                    <el-pagination background layout="prev, pager, next" :total="pagination.total"
                        :page-size="pagination.pageSize" :current-page="pagination.page"
                        @current-change="handlePageChange" class="!bg-transparent" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const user = computed(() => userStore.user)

const slug = route.params.slug
const page = ref(parseInt(route.query.page || '1'))
const pageSize = 20
const categoryId = ref(null)

// 先获取分类信息
const { data: categoryData, pending: categoryLoading, refresh: refreshCategory } = await useFetch(`/api/forum/categories`)

const category = computed(() => {
    if (!categoryData.value?.success) return null
    const foundCategory = categoryData.value.data.find(c => c.slug === slug)
    if (foundCategory && foundCategory.id) {
        categoryId.value = foundCategory.id
    }
    return foundCategory
})

// 在分类信息加载后获取主题列表
const { data, pending: topicsLoading, refresh: refreshTopics } = await useFetch(`/api/forum/topics`, {
    query: {
        categoryId: computed(() => categoryId.value),
        page: page,
        pageSize: pageSize
    }
})

const loading = computed(() => categoryLoading.value || topicsLoading.value)

const topics = computed(() => {
    if (!data.value?.success) return []
    return data.value.data.topics
})

const pagination = computed(() => {
    if (!data.value?.success) return { total: 0, page: 1, pageSize, totalPages: 0 }
    return data.value.data.pagination
})

function formatDate(dateString) {
    try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: zhCN })
    } catch (error) {
        return '未知时间'
    }
}

function handlePageChange(newPage) {
    page.value = newPage
    router.push({ query: { ...route.query, page: newPage } })
}

const navigateToCreateTopic = () => {
    if (category.value?.id) {
        router.push(`/forum/create?categoryId=${category.value.id}`)
    } else {
        router.push('/forum/create')
    }
}

const navigateToLogin = () => {
    if (category.value?.id) {
        router.push(`/login?redirect=/forum/create?categoryId=${category.value.id}`)
    } else {
        router.push('/login?redirect=/forum/create')
    }
}

onMounted(() => {
    refreshTopics()
    refreshCategory()
})

watch(() => route.query.page, (newPage) => {
    page.value = parseInt(newPage || '1')
    refreshTopics()
})

// 监听分类ID变化，当ID获取后刷新主题列表
watch(() => categoryId.value, (newCategoryId) => {
    if (newCategoryId) {
        refreshTopics()
    }
})
</script>

<style>
/* 添加自定义黑暗模式颜色 */
.dark\:bg-gray-750 {
    @apply dark:bg-gray-700/70;
}
</style>