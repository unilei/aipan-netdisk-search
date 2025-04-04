<template>
    <div class="container mx-auto px-4 py-8">
        <div class="flex items-center mb-4">
            <client-only>
                <NuxtLink :to="category?.slug ? `/forum/category/${category.slug}` : '/forum'"
                    class="text-blue-500 hover:underline mr-2">
                    <i class="el-icon-arrow-left"></i> 返回{{ category?.name ? category.name : '论坛' }}
                </NuxtLink>
            </client-only>
        </div>

        <div v-if="loading" class="flex justify-center py-10">
            <el-skeleton :rows="10" animated />
        </div>

        <div v-else-if="!topic" class="text-center py-10">
            <el-empty description="主题不存在" />
            <NuxtLink to="/forum" class="mt-4 inline-block text-blue-500 hover:underline">
                返回论坛首页
            </NuxtLink>
        </div>

        <div v-else>
            <!-- 主题内容 -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 overflow-hidden">
                <div class="p-6">
                    <div class="flex items-center mb-4">
                        <span v-if="topic.isSticky"
                            class="text-xs bg-red-500 text-white rounded px-2 py-1 mr-2">置顶</span>
                        <h1 class="text-2xl font-bold">{{ topic.title }}</h1>
                    </div>

                    <div class="flex justify-between text-sm text-gray-500 mb-6">
                        <div class="flex items-center">
                            <span>{{ topic.author.username }}</span>
                            <span class="mx-2">•</span>
                            <span>{{ formatDate(topic.createdAt) }}</span>
                            <span class="mx-2">•</span>
                            <span>{{ topic.viewCount }} 浏览</span>
                        </div>
                        <div>
                            {{ formatDateTime(topic.createdAt) }}
                        </div>
                    </div>

                    <div class="prose dark:prose-invert max-w-none" v-html="formattedContent"></div>
                </div>
            </div>

            <!-- 回复列表 -->
            <div class="mb-6">
                <h2 class="text-xl font-bold mb-4">{{ posts.length ? `${posts.length} 条回复` : '暂无回复' }}</h2>

                <div v-if="posts.length === 0" class="text-center py-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <p class="text-gray-500">暂无回复，成为第一个回复的用户</p>
                </div>

                <div v-else>
                    <div v-for="(post, index) in posts" :key="post.id"
                        class="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-4 overflow-hidden">
                        <div class="p-6">
                            <div class="flex justify-between items-start mb-4">
                                <div class="flex items-center">
                                    <div class="mr-4">
                                        <span
                                            class="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full px-3 py-1 text-sm">
                                            {{ post.author.username }}
                                        </span>
                                    </div>
                                    <div class="text-sm text-gray-500">
                                        {{ formatDate(post.createdAt) }}
                                    </div>
                                </div>
                                <div class="text-sm text-gray-500">
                                    #{{ index + 1 }}
                                </div>
                            </div>

                            <div class="prose dark:prose-invert max-w-none" v-html="formatPostContent(post.content)">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 分页 -->
                <div v-if="pagination.totalPages > 1" class="flex justify-center mt-6">
                    <el-pagination layout="prev, pager, next" :total="pagination.total" :page-size="pagination.pageSize"
                        :current-page="pagination.page" @current-change="handlePageChange" />
                </div>
            </div>

            <!-- 回复表单 -->
            <div v-if="!topic.isLocked" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 class="text-xl font-bold mb-4">发表回复</h2>

                <div v-if="!user" class="text-center py-4">
                    <p class="mb-4 text-gray-500">请先登录后回复</p>
                    <el-button type="primary" @click="navigateToLogin">
                        去登录
                    </el-button>
                </div>

                <div v-else>
                    <el-form @submit.prevent="submitReply">
                        <el-form-item>
                            <el-input v-model="replyContent" type="textarea" :rows="6" placeholder="请输入回复内容" />
                        </el-form-item>
                        <el-form-item class="flex justify-end">
                            <el-button type="primary" :disabled="!replyContent.trim() || submitting"
                                @click="submitReply">
                                {{ submitting ? '提交中...' : '发表回复' }}
                            </el-button>
                        </el-form-item>
                    </el-form>
                </div>
            </div>

            <div v-else class="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 text-center">
                <p class="text-gray-500">此主题已锁定，无法回复</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { format } from 'date-fns'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const user = computed(() => userStore.user)

const slug = route.params.slug
const page = ref(parseInt(route.query.page || '1'))

// 表单数据
const replyContent = ref('')
const submitting = ref(false)

// 获取主题详情
const { data, pending: loading, refresh } = await useFetch(`/api/forum/topics/${slug}`, {
    query: {
        page: page,
    }
})

const topic = computed(() => {
    if (!data.value?.success) return null
    return data.value.data.topic
})

const posts = computed(() => {
    if (!data.value?.success) return []
    return data.value.data.posts
})

const pagination = computed(() => {
    if (!data.value?.success) return { total: 0, page: 1, pageSize: 20, totalPages: 0 }
    return data.value.data.pagination
})

const category = computed(() => {
    if (!topic.value) return null
    return topic.value.category
})

// 处理Markdown内容的安全渲染
const formattedContent = computed(() => {
    if (!topic.value) return ''
    if (process.client) {
        return DOMPurify.sanitize(marked(topic.value.content))
    }
    return marked(topic.value.content)
})

function formatPostContent(content) {
    if (process.client) {
        return DOMPurify.sanitize(marked(content))
    }
    return marked(content)
}

function formatDate(dateString) {
    try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: zhCN })
    } catch (error) {
        return '未知时间'
    }
}

function formatDateTime(dateString) {
    try {
        return format(new Date(dateString), 'yyyy-MM-dd HH:mm')
    } catch (error) {
        return '未知时间'
    }
}

function handlePageChange(newPage) {
    page.value = newPage
    router.push({ query: { ...route.query, page: newPage } })
}

const navigateToLogin = () => {
    router.push(`/login?redirect=/forum/topic/${slug}`)
}

async function submitReply() {
    if (!replyContent.value.trim() || submitting.value) return

    submitting.value = true

    try {
        const token = useCookie('token').value
        const response = await $fetch('/api/forum/posts', {
            method: 'POST',
            body: {
                content: replyContent.value,
                topicId: topic.value.id
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (response.success) {
            // 清空表单
            replyContent.value = ''
            // 刷新帖子列表
            refresh()

            // 显示成功消息
            ElMessage.success('回复成功')
        } else {
            ElMessage.error(response.message || '回复失败')
        }
    } catch (error) {
        console.error('发表回复失败:', error)
        ElMessage.error('发表回复失败，请重试')
    } finally {
        submitting.value = false
    }
}

onMounted(() => {
    // 不再调用refreshUser，因为已改用userStore直接获取
})

watch(() => route.query.page, (newPage) => {
    page.value = parseInt(newPage || '1')
    refresh()
})
</script>