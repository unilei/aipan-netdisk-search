<template>
    <div class="min-h-[calc(100vh-60px)] bg-gray-50 dark:bg-gray-900 p-6">
        <div class="max-w-[1000px] mx-auto">
            <!-- 头部区域 -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-200">写文章</h1>
                        <p class="text-gray-500 dark:text-gray-400 mt-1">分享你的想法和经验</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <el-button @click="() => navigateTo('/user/dashboard')">
                            返回
                        </el-button>
                        <el-button type="primary" @click="handleSubmit" :loading="submitting">
                            发布文章
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- 编辑区域 -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-6">
                <div class="space-y-4">
                    <!-- 标题输入 -->
                    <el-input v-model="form.title" placeholder="请输入文章标题" :maxlength="100" show-word-limit
                        class="text-lg" />

                    <!-- 分类选择 -->
                    <el-select v-model="form.category" placeholder="选择文章分类" class="w-full">
                        <el-option v-for="item in categories" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>

                    <!-- 标签输入 -->
                    <el-select v-model="form.tags" multiple filterable allow-create default-first-option
                        :reserve-keyword="false" placeholder="请选择或输入标签" class="w-full">
                        <el-option v-for="item in tags" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>

                    <!-- Markdown编辑器 -->
                    <client-only>
                        <v-md-editor v-model="form.content" height="500px" @save="handleSubmit" />
                    </client-only>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
definePageMeta({
    middleware: ['auth']
})

const { $message } = useNuxtApp()

// 表单数据
const form = reactive({
    title: '',
    category: '',
    tags: [],
    content: ''
})

// 提交状态
const submitting = ref(false)

// 分类选项
const categories = [
    { value: 'technology', label: '技术' },
    { value: 'life', label: '生活' },
    { value: 'thoughts', label: '随想' },
    { value: 'tutorial', label: '教程' }
]

// 预设标签
const tags = [
    { value: 'JavaScript', label: 'JavaScript' },
    { value: 'Python', label: 'Python' },
    { value: 'Vue', label: 'Vue' },
    { value: 'React', label: 'React' },
    { value: 'Node.js', label: 'Node.js' }
]

// 提交文章
const handleSubmit = async () => {
    // 表单验证
    if (!form.title.trim()) {
        $message.warning('请输入文章标题')
        return
    }
    if (!form.category) {
        $message.warning('请选择文章分类')
        return
    }
    if (!form.content.trim()) {
        $message.warning('请输入文章内容')
        return
    }

    submitting.value = true
    try {
        const res = await $fetch('/api/blog/posts', {
            method: 'POST',
            body: {
                title: form.title,
                category: form.category,
                tags: form.tags,
                content: form.content
            },
            headers: {
                'Authorization': `Bearer ${useCookie('token').value}`
            }
        })

        if (res.code === 200) {
            $message.success('文章发布成功')
            // 跳转到文章列表
            navigateTo('/user/contributions')
        } else {
            throw new Error(res.msg || '发布失败')
        }
    } catch (error) {
        console.error('发布文章失败:', error)
        $message.error(error.message || '发布失败，请重试')
    } finally {
        submitting.value = false
    }
}
</script>