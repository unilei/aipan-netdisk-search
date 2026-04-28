<!-- 评论列表组件 -->
<script setup>
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { marked } from 'marked'
import sensitiveWordFilter from '~/utils/sensitiveWordFilter'
import { sanitizeHtml } from '~/utils/sanitize'

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
    return format(new Date(date), 'yyyy-MM-dd HH:mm')
}

// 过滤并解析评论内容
const parseContent = (content) => {
    const filteredContent = sensitiveWordFilter.filter(content)
    return sanitizeHtml(marked.parse(filteredContent))
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

// 检查是否可以删除评论
const canDelete = (commentId) => {
    if (typeof window !== 'undefined') {
        return !!window.localStorage.getItem(`comment_delete_token_${commentId}`)
    }
    return false
}

// 处理删除评论
const handleDelete = async (comment) => {
    try {
        // 从 localStorage 获取删除 token
        const deleteToken = window.localStorage.getItem(`comment_delete_token_${comment.id}`)

        const response = await $fetch(`/api/blog/comments/${comment.id}`, {
            method: 'DELETE',
            body: { deleteToken }
        })

        if (response.code === 200) {
            // 如果是回复评论
            if (comment.parentId) {
                const parentComment = comments.value.find(c => c.id === comment.parentId)
                if (parentComment && parentComment.replies) {
                    parentComment.replies = parentComment.replies.filter(r => r.id !== comment.id)
                }
            } else {
                // 如果是主评论
                comments.value = comments.value.filter(c => c.id !== comment.id)
            }
        }
    } catch (error) {
        console.error('Error deleting comment:', error)
    }
}

onMounted(() => {
    fetchComments()
})
</script>

<template>
    <div class="space-y-6">
        <!-- 评论编辑器 -->
        <CommentEditor :post-id="postId" :parent-id="replyTo?.id" :reply-to="replyTo?.author"
            @comment-added="handleCommentAdded" />

        <!-- 评论列表 -->
        <div v-if="loading" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>

        <div v-else-if="comments.length === 0" class="text-center text-xs py-8 text-gray-500 dark:text-gray-400">
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
                                    <span class="font-medium text-gray-900 text-xs dark:text-white">{{ comment.author }}</span>
                                    <a v-if="comment.website" :href="comment.website" target="_blank"
                                        class="text-blue-500 hover:text-blue-600">
                                        <i class="fas fa-link text-xs"></i>
                                    </a>
                                </div>
                                <time class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(comment.createdAt)
                                    }}</time>
                            </div>

                            <!-- 评论内容 -->
                            <div class="mt-2 dark:prose-invert max-w-none text-xs"
                                v-html="parseContent(comment.content)"></div>

                            <!-- 操作按钮 -->
                            <div class="mt-4 flex items-center space-x-4">
                                <button @click="handleReply(comment)"
                                    class="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200">
                                    <i class="fas fa-reply mr-1"></i> 回复
                                </button>
                                <button v-if="canDelete(comment.id)" @click="handleDelete(comment)"
                                    class="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200">
                                    <i class="fas fa-trash-alt mr-1"></i> 删除
                                </button>
                                <CommonReportButton 
                                    content-type="comment"
                                    :content-id="comment.id"
                                    :content-title="`${comment.author}的评论`"
                                />
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
                                        <span class="font-medium text-xs text-gray-900 dark:text-white">{{ reply.author
                                            }}</span>
                                        <span class="text-gray-500  dark:text-gray-400 text-xs">回复</span>
                                        <span class="font-medium text-xs text-gray-900 dark:text-white">@{{ comment.author
                                            }}</span>
                                        <a v-if="reply.website" :href="reply.website" target="_blank"
                                            class="text-blue-500 hover:text-blue-600">
                                            <i class="fas fa-link text-xs"></i>
                                        </a>
                                    </div>
                                    <time class="text-xs text-gray-500 dark:text-gray-400">{{
                                        formatDate(reply.createdAt)
                                        }}</time>
                                </div>

                                <!-- 回复内容 -->
                                <div class="mt-2 prose dark:prose-invert max-w-none text-xs"
                                    v-html="parseContent(reply.content)"></div>

                                <!-- 回复按钮 -->
                                <div class="mt-2 flex items-center space-x-4">
                                    <button @click="handleReply(reply)"
                                        class="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200">
                                        <i class="fas fa-reply mr-1"></i> 回复
                                    </button>
                                    <button v-if="canDelete(reply.id)" @click="handleDelete(reply)"
                                        class="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200">
                                        <i class="fas fa-trash-alt mr-1"></i> 删除
                                    </button>
                                    <CommonReportButton 
                                        content-type="comment"
                                        :content-id="reply.id"
                                        :content-title="`${reply.author}的回复`"
                                    />
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