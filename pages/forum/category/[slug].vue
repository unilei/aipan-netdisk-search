<template>
    <div class="container mx-auto px-4 py-8">
        <div class="flex items-center mb-4">
            <NuxtLink to="/forum" class="text-blue-500 hover:underline mr-2">
                <i class="el-icon-arrow-left"></i> 返回论坛首页
            </NuxtLink>
        </div>

        <div v-if="loading" class="flex justify-center py-10">
            <el-skeleton :rows="5" animated />
        </div>

        <div v-else>
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-2xl font-bold">{{ category?.name }}</h1>
                    <p class="text-gray-600 dark:text-gray-400 mt-1">{{ category?.description }}</p>
                </div>
                <div v-if="user">
                    <el-button type="primary" @click="navigateToCreateTopic">发布新主题</el-button>
                </div>
                <div v-else>
                    <el-button type="primary" @click="navigateToLogin">登录后发布</el-button>
                </div>
            </div>

            <div v-if="!topics || topics.length === 0" class="text-center py-10">
                <el-empty description="暂无主题" />
                <p class="mt-4 text-gray-500">成为第一个发表主题的用户</p>
            </div>

            <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow">
                <ul>
                    <li v-for="topic in topics" :key="topic.id"
                        class="border-b border-gray-200 dark:border-gray-700 last:border-none">
                        <NuxtLink :to="`/forum/topic/${topic.slug}`"
                            class="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div class="flex justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <span v-if="topic.isSticky"
                                            class="text-xs bg-red-500 text-white rounded px-2 py-1 mr-2">置顶</span>
                                        <h3 class="text-lg font-medium">{{ topic.title }}</h3>
                                    </div>
                                    <div class="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                        <span>{{ topic.author.username }}</span>
                                        <span class="mx-2">•</span>
                                        <span>{{ formatDate(topic.createdAt) }}</span>
                                        <span class="mx-2">•</span>
                                        <span>{{ topic._count.posts }} 回复</span>
                                        <span class="mx-2">•</span>
                                        <span>{{ topic.viewCount }} 浏览</span>
                                    </div>
                                </div>
                                <div v-if="topic.lastActivityAt" class="text-xs text-gray-500 dark:text-gray-400">
                                    最后回复: {{ formatDate(topic.lastActivityAt) }}
                                </div>
                            </div>
                        </NuxtLink>
                    </li>
                </ul>
            </div>

            <!-- 分页 -->
            <div v-if="pagination.totalPages > 1" class="flex justify-center mt-6">
                <el-pagination layout="prev, pager, next" :total="pagination.total" :page-size="pagination.pageSize"
                    :current-page="pagination.page" @current-change="handlePageChange" />
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