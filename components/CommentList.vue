<!-- 评论列表组件 -->
<script setup>
import { ref, onMounted } from 'vue'
import moment from 'moment'
import { marked } from 'marked'
import sensitiveWordFilter from '~/utils/sensitiveWordFilter'

const props = defineProps({
    postId: {
        type: [String, Number],
        required: true
    }
})

const comments = ref([])
const loading = ref(true)
const replyTo = ref(null)

// 格式化日期
const formatDate = (date) => {
    return moment(date).format('YYYY-MM-DD HH:mm')
}

// 过滤并解析评论内容
const parseContent = (content) => {
    const filteredContent = sensitiveWordFilter.filter(content)
    return marked.parse(filteredContent)
}

// 获取评论列表
const fetchComments = async () => {
    try {
        loading.value = true
        const response = await $fetch(`/api/blog/comments/${props.postId}`)
        if (response.code === 200) {
            comments.value = response.data
        }
    } catch (error) {
        console.error('Error fetching comments:', error)
    } finally {
        loading.value = false
    }
}

// 处理新评论添加
const handleCommentAdded = (newComment) => {
    if (newComment.parentId) {
        // 如果是回复，找到父评论并添加到其回复列表中
        const parentComment = comments.value.find(c => c.id === newComment.parentId)
        if (parentComment) {
            if (!parentComment.replies) {
                parentComment.replies = []
            }
            parentComment.replies.unshift(newComment)
        }
    } else {
        // 如果是顶级评论，直接添加到列表开头
        comments.value.unshift(newComment)
    }
    replyTo.value = null // 重置回复状态
}

// 处理回复按钮点击
const handleReply = (comment) => {
    replyTo.value = {
        id: comment.id,
        author: comment.author
    }
}

onMounted(() => {
    fetchComments()
})
</script>

<template>
    <div class="space-y-8">
        <!-- 评论编辑器 -->
        <CommentEditor :post-id="postId" :parent-id="replyTo?.id" :reply-to="replyTo?.author"
            @comment-added="handleCommentAdded" />

        <!-- 评论列表 -->
        <div v-if="loading" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>

        <div v-else-if="comments.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            暂无评论，来说两句吧~
        </div>

        <div v-else class="space-y-6">
            <!-- 评论卡片 -->
            <div v-for="comment in comments" :key="comment.id"
                class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <!-- 主评论 -->
                <div class="p-6">
                    <div class="flex items-start space-x-4">
                        <!-- 头像 -->
                        <img :src="comment.avatar" :alt="comment.author"
                            class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700">

                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-2">
                                    <span class="font-medium text-gray-900 dark:text-white">{{ comment.author }}</span>
                                    <a v-if="comment.website" :href="comment.website" target="_blank"
                                        class="text-blue-500 hover:text-blue-600">
                                        <i class="fas fa-link text-xs"></i>
                                    </a>
                                </div>
                                <time class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(comment.createdAt)
                                    }}</time>
                            </div>

                            <!-- 评论内容 -->
                            <div class="mt-2 prose dark:prose-invert max-w-none text-sm"
                                v-html="parseContent(comment.content)"></div>

                            <!-- 操作按钮 -->
                            <div class="mt-4 flex items-center space-x-4">
                                <button @click="handleReply(comment)"
                                    class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200">
                                    <i class="fas fa-reply mr-1"></i> 回复
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 回复列表 -->
                <div v-if="comment.replies && comment.replies.length > 0"
                    class="ml-14 mt-4 space-y-4 pl-4 border-l-2 border-gray-100 dark:border-gray-700">
                    <div v-for="reply in comment.replies" :key="reply.id"
                        class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                        <div class="flex items-start space-x-4">
                            <!-- 回复者头像 -->
                            <img :src="reply.avatar" :alt="reply.author"
                                class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700">

                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-2">
                                        <span class="font-medium text-gray-900 dark:text-white">{{ reply.author
                                            }}</span>
                                        <span class="text-gray-500 dark:text-gray-400 text-sm">回复</span>
                                        <span class="font-medium text-gray-900 dark:text-white">@{{ comment.author
                                            }}</span>
                                        <a v-if="reply.website" :href="reply.website" target="_blank"
                                            class="text-blue-500 hover:text-blue-600">
                                            <i class="fas fa-link text-xs"></i>
                                        </a>
                                    </div>
                                    <time class="text-sm text-gray-500 dark:text-gray-400">{{
                                        formatDate(reply.createdAt)
                                    }}</time>
                                </div>

                                <!-- 回复内容 -->
                                <div class="mt-2 prose dark:prose-invert max-w-none text-sm"
                                    v-html="parseContent(reply.content)"></div>

                                <!-- 回复按钮 -->
                                <div class="mt-2 flex items-center space-x-4">
                                    <button @click="handleReply(reply)"
                                        class="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200">
                                        <i class="fas fa-reply mr-1"></i> 回复
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 回复编辑器 -->
                <div v-if="replyTo?.id === comment.id" class="mt-4 pl-14">
                    <CommentEditor :post-id="postId" :parent-id="replyTo.id" :reply-to="replyTo.author"
                        @comment-added="handleCommentAdded" class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.prose {
    font-size: 0.875rem;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
}

.dark ::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.1);
}
</style>