<!-- 评论编辑器组件 -->
<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import 'highlight.js/styles/atom-one-dark.css'
import sensitiveWordFilter from '~/utils/sensitiveWordFilter'
import { sanitizeHtml } from '~/utils/sanitize'

const props = defineProps({
    postId: {
        type: [String, Number],
        required: true
    },
    parentId: {
        type: [String, Number],
        default: null
    },
    replyTo: {
        type: String,
        default: ''
    }
})

const emit = defineEmits(['comment-added'])

const content = ref('')
const author = ref('')
const email = ref('')
const website = ref('')
const isPreview = ref(false)
const isSubmitting = ref(false)

// 预览内容
const previewContent = computed(() => {
    if (!content.value) return ''
    return sanitizeHtml(marked.parse(content.value))
})

// 提交评论
const submitComment = async () => {
    if (!content.value.trim()) {
        alert('评论内容不能为空')
        return
    }

    // 检查敏感词
    if (sensitiveWordFilter.hasSensitiveWords(content.value)) {
        const sensitiveWords = sensitiveWordFilter.findSensitiveWords(content.value)
        const filteredContent = sensitiveWordFilter.filter(content.value)
        content.value = filteredContent // 自动替换为过滤后的内容
        alert(`评论包含敏感词：${sensitiveWords.join('、')}，请修改后重新提交`)
        return
    }

    try {
        isSubmitting.value = true
        const response = await $fetch('/api/blog/comments/create', {
            method: 'POST',
            body: {
                postId: props.postId,
                parentId: props.parentId,
                content: content.value,
                author: author.value,
                email: email.value,
                website: website.value
            }
        })

        if (response.code === 200) {
            // 保存删除 token 到 localStorage
            if (response.data.deleteToken) {
                window.localStorage.setItem(`comment_delete_token_${response.data.id}`, response.data.deleteToken)
            }

            // 清空表单
            content.value = ''
            if (!props.parentId) {
                author.value = ''
                email.value = ''
                website.value = ''
            }
            // 通知父组件
            emit('comment-added', response.data)

        } else {
            alert(response.message || '评论发布失败')
        }
    } catch (error) {
        console.error('Error submitting comment:', error)
        alert('评论发布失败，请稍后重试')
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
        <!-- 回复提示 -->
        <div v-if="replyTo" class="mb-4 text-sm text-gray-600 dark:text-gray-400">
            回复给 <span class="font-medium text-blue-500">{{ replyTo }}</span>
        </div>

        <!-- 编辑器工具栏 -->
        <div class="flex items-center space-x-4 mb-4">
            <button @click="isPreview = !isPreview"
                class="px-3 py-1 text-xs rounded-full transition-colors duration-200"
                :class="isPreview ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'">
                {{ isPreview ? '编辑' : '预览' }}
            </button>
            <a href="https://www.markdownguide.org/basic-syntax/" target="_blank"
                class="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400">
                Markdown 语法
            </a>
        </div>

        <!-- 编辑区域 -->
        <div v-show="!isPreview" class="space-y-4">
            <textarea v-model="content" rows="6"
                class="w-full px-4 py-3 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                :placeholder="replyTo ? `回复 ${replyTo}...` : '写下你的评论...'"
                @keydown.tab.prevent="content += '    '"></textarea>

            <!-- 评论者信息 -->
            <div v-if="!parentId" class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <input v-model="author" type="text"
                    class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="昵称（选填）">
                <input v-model="email" type="email"
                    class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="邮箱（选填）">
                <input v-model="website" type="url"
                    class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="网站（选填）">
            </div>
        </div>

        <!-- 预览区域 -->
        <div v-show="isPreview"
            class="min-h-[150px] p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 prose dark:prose-invert max-w-none"
            :class="{ 'text-gray-500 dark:text-gray-400 italic': !content }">
            <div v-if="content" v-html="previewContent"></div>
            <div v-else>预览区域</div>
        </div>

        <!-- 提交按钮 -->
        <div class="mt-4 flex justify-end">
            <button @click="submitComment" :disabled="isSubmitting"
                class="px-6 py-2 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ isSubmitting ? '发布中...' : '发布评论' }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.prose {
    font-size: 12px;
}

/* 自定义滚动条 */
textarea::-webkit-scrollbar {
    width: 8px;
}

textarea::-webkit-scrollbar-track {
    background: transparent;
}

textarea::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
}

.dark textarea::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.1);
}
</style>