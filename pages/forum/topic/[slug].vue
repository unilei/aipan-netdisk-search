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
                    <client-only>
                        <NuxtLink v-if="topic?.category" :to="`/forum/category/${topic.category.slug}`"
                            class="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                            {{ topic.category.name }}
                        </NuxtLink>
                    </client-only>
                    <i class="fas fa-chevron-right mx-2 text-gray-400 text-xs"></i>
                    <span class="text-gray-900 dark:text-white font-medium truncate">{{ topic?.title || '加载中...'
                        }}</span>
                </div>
            </div>
        </div>

        <div class="container mx-auto px-4 py-6">
            <!-- 加载状态 -->
            <div v-if="loading" class="flex flex-col space-y-4">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <el-skeleton :rows="2" animated />
                </div>
                <div v-for="i in 3" :key="i" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <el-skeleton :rows="6" animated />
                </div>
            </div>

            <div v-else-if="error" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">加载失败</h2>
                <p class="text-gray-600 dark:text-gray-400 mb-6">{{ error.message || '无法加载主题内容' }}</p>
                <div class="flex justify-center space-x-4">
                    <el-button @click="refresh">重试</el-button>
                    <NuxtLink to="/forum">
                        <el-button>返回论坛</el-button>
                    </NuxtLink>
                </div>
            </div>

            <div v-else>
                <!-- 主题标题卡片 -->
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <div class="flex items-center">
                                <span v-if="topic.isSticky"
                                    class="inline-block bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-medium px-2 py-0.5 rounded-full mr-2">
                                    <i class="fas fa-thumbtack mr-1"></i>置顶
                                </span>
                                <span v-if="topic.isLocked"
                                    class="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium px-2 py-0.5 rounded-full mr-2">
                                    <i class="fas fa-lock mr-1"></i>已锁定
                                </span>
                                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ topic.title }}</h1>
                            </div>
                            <div class="mt-2 flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400">
                                <div class="flex items-center mr-4">
                                    <div
                                        class="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 mr-1 overflow-hidden">
                                        <span>{{ topic.author.username.charAt(0).toUpperCase() }}</span>
                                    </div>
                                    <span>{{ topic.author.username }}</span>
                                </div>
                                <span class="mr-4">
                                    <i class="far fa-clock mr-1"></i>{{ formatDate(topic.createdAt) }}
                                </span>
                                <span class="mr-4">
                                    <i class="far fa-eye mr-1"></i>{{ topic.viewCount }} 次浏览
                                </span>
                                <span>
                                    <i class="far fa-comment mr-1"></i>{{ posts?.length || 0 }} 个回复
                                </span>
                            </div>
                        </div>

                        <div class="flex space-x-2">
                            <client-only>
                                <el-button v-if="canModerate && !topic.isSticky" size="small" @click="toggleSticky"
                                    class="!bg-purple-50 !text-purple-700 !border-purple-200 hover:!bg-purple-100">
                                    <i class="fas fa-thumbtack mr-1"></i>置顶
                                </el-button>
                                <el-button v-if="canModerate && topic.isSticky" size="small" @click="toggleSticky"
                                    class="!bg-purple-100 !text-purple-700 !border-purple-200 hover:!bg-purple-200">
                                    <i class="fas fa-thumbtack mr-1"></i>取消置顶
                                </el-button>
                                <el-button v-if="canModerate && !topic.isLocked" size="small" @click="toggleLock"
                                    class="!bg-gray-50 !text-gray-700 !border-gray-200 hover:!bg-gray-100">
                                    <i class="fas fa-lock mr-1"></i>锁定
                                </el-button>
                                <el-button v-if="canModerate && topic.isLocked" size="small" @click="toggleLock"
                                    class="!bg-gray-100 !text-gray-700 !border-gray-200 hover:!bg-gray-200">
                                    <i class="fas fa-lock-open mr-1"></i>解除锁定
                                </el-button>
                            </client-only>
                        </div>
                    </div>

                    <div class="border-t border-gray-100 dark:border-gray-700 pt-4">
                        <div class="prose dark:prose-invert max-w-none" v-html="topic.content"></div>
                    </div>
                </div>

                <!-- 回复列表 -->
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">回复 ({{ posts?.length || 0 }})</h2>

                <div v-if="posts && posts.length > 0" class="space-y-4 mb-8">
                    <div v-for="(post, index) in posts" :key="post.id"
                        class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                        <div
                            class="bg-gray-50 dark:bg-gray-750 px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <div class="flex items-center">
                                <div
                                    class="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 mr-2 overflow-hidden">
                                    <span>{{ post.author.username.charAt(0).toUpperCase() }}</span>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">{{ post.author.username }}
                                    </div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(post.createdAt)
                                    }}</div>
                                </div>
                            </div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">
                                #{{ index + 1 }}
                            </div>
                        </div>
                        <div class="p-6">
                            <div class="prose dark:prose-invert max-w-none" v-html="post.content"></div>
                        </div>
                    </div>
                </div>

                <!-- 回复表单 -->
                <div v-if="!topic.isLocked" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">发表回复</h3>

                    <div v-if="user">
                        <el-form @submit.prevent="submitReply">
                            <el-form-item>
                                <client-only>
                                    <template #fallback>
                                        <div
                                            class="border border-gray-200 dark:border-gray-700 rounded p-4 h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                                            <p class="text-gray-400">编辑器加载中...</p>
                                        </div>
                                    </template>
                                    <lazy-md-editor v-model="replyContent" placeholder="在这里输入您的回复内容..." language="zh-CN"
                                        :toolbars="mdEditorToolbars" style="height: 300px" />
                                </client-only>
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" :loading="submitting" @click="submitReply"
                                    class="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 border-0">
                                    发表回复
                                </el-button>
                            </el-form-item>
                        </el-form>
                    </div>
                    <div v-else
                        class="text-center py-6 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-750">
                        <p class="text-gray-600 dark:text-gray-400 mb-4">您需要登录后才能回复</p>
                        <el-button type="primary" @click="navigateToLogin"
                            class="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 border-0">
                            登录 / 注册
                        </el-button>
                    </div>
                </div>

                <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
                    <i class="fas fa-lock text-gray-400 text-xl mb-2"></i>
                    <p class="text-gray-600 dark:text-gray-400">该主题已被锁定，无法回复</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ElMessage } from 'element-plus'
import { defineAsyncComponent, shallowRef } from 'vue'
import 'md-editor-v3/lib/style.css'

// 使用defineAsyncComponent异步加载编辑器组件，并添加loading和error处理
const LazyMdEditor = defineAsyncComponent({
    loader: () => import('md-editor-v3').then(mod => mod.MdEditor),
    delay: 200,
    timeout: 3000,
    errorComponent: {
        template: `<div class="border border-red-200 dark:border-red-800 rounded p-4 bg-red-50 dark:bg-red-900/50">
                <p class="text-red-500 dark:text-red-400">编辑器加载失败，请刷新页面重试</p>
               </div>`
    },
    suspensible: false
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const user = computed(() => userStore.user)
const slug = route.params.slug

// 编辑器工具栏预定义
const mdEditorToolbars = shallowRef([
    'bold', 'italic', 'strikethrough', 'sub', 'sup', 'quote',
    'unorderedList', 'orderedList', 'codeRow', 'code',
    'link', 'image', 'table', 'revoke', 'next', 'preview'
])

const { data, pending: loading, error, refresh } = await useFetch(`/api/forum/topics/${slug}`)

const topic = computed(() => {
    if (!data.value?.success) return null
    return data.value.data.topic
})

const posts = computed(() => {
    if (!data.value?.success) return []
    return data.value.data.posts
})

// 检查用户是否有权限管理该主题（管理员或版主）
const canModerate = computed(() => {
    if (!user.value) return false
    return user.value.role === 'ADMIN' || user.value.role === 'MODERATOR'
})

const replyContent = ref('')
const submitting = ref(false)

function formatDate(dateString) {
    try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: zhCN })
    } catch (error) {
        return '未知时间'
    }
}

async function submitReply() {
    if (!replyContent.value.trim()) {
        ElMessage.warning('回复内容不能为空')
        return
    }

    submitting.value = true

    try {
        const response = await $fetch(`/api/forum/topics/${slug}/reply`, {
            method: 'POST',
            body: {
                content: replyContent.value
            },
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })

        if (response.success) {
            ElMessage.success('回复成功')
            replyContent.value = ''
            refresh()
        } else {
            ElMessage.error(response.message || '回复失败')
        }
    } catch (error) {
        console.error('回复发送失败:', error)
        ElMessage.error('回复失败，请稍后重试')
    } finally {
        submitting.value = false
    }
}

async function toggleSticky() {
    if (!topic.value) return

    try {
        const response = await $fetch(`/api/forum/topics/${slug}/sticky`, {
            method: 'POST',
            body: {
                isSticky: !topic.value.isSticky
            },
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })

        if (response.success) {
            ElMessage.success(topic.value.isSticky ? '已取消置顶' : '已置顶')
            refresh()
        } else {
            ElMessage.error(response.message || '操作失败')
        }
    } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error('操作失败，请稍后重试')
    }
}

async function toggleLock() {
    if (!topic.value) return

    try {
        const response = await $fetch(`/api/forum/topics/${slug}/lock`, {
            method: 'POST',
            body: {
                isLocked: !topic.value.isLocked
            },
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })

        if (response.success) {
            ElMessage.success(topic.value.isLocked ? '已解除锁定' : '已锁定')
            refresh()
        } else {
            ElMessage.error(response.message || '操作失败')
        }
    } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error('操作失败，请稍后重试')
    }
}

function navigateToLogin() {
    router.push(`/login?redirect=/forum/topic/${slug}`)
}

// 浏览量暂时不记录，等待后端API实现
onMounted(async () => {
    // 调用浏览量记录API
    try {
        await $fetch(`/api/forum/topics/${slug}/view`, {
            method: 'GET',
            // 添加一个随机数作为查询参数，避免缓存
            query: {
                _t: Date.now()
            }
        })
    } catch (error) {
        // 如果记录浏览量失败，不影响用户体验，只是在控制台记录错误
        console.error('增加浏览量失败:', error)
    }
})
</script>

<style>
/* 添加自定义黑暗模式颜色 */
.dark\:bg-gray-750 {
    @apply dark:bg-gray-700/70;
}

/* 文章内容样式 */
.prose img {
    @apply rounded-lg;
    max-width: 100%;
    height: auto;
}

.prose pre {
    @apply rounded-md bg-gray-100 dark:bg-gray-800 p-4 overflow-x-auto text-sm;
}

.prose code {
    @apply bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm;
}

.prose blockquote {
    @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic;
}

.prose a {
    @apply text-blue-600 dark:text-blue-400 hover:underline;
}
</style>