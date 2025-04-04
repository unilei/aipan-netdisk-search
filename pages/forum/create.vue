<template>
    <div class="bg-gray-50 dark:bg-gray-900 min-h-screen pb-12">
        <!-- 返回导航 -->
        <div
            class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
            <div class="max-w-6xl mx-auto px-4">
                <div class="py-3 flex items-center text-xs">
                    <NuxtLink to="/forum"
                        class="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center">
                        <i class="fas fa-home mr-1 text-xs"></i>
                        论坛首页
                    </NuxtLink>
                    <i class="fas fa-chevron-right mx-2 text-gray-400 text-[10px]"></i>
                    <span class="text-gray-900 dark:text-white">发布新主题</span>
                </div>
            </div>
        </div>

        <div class="max-w-6xl mx-auto px-4 py-4">
            <div v-if="!user" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
                <i class="fas fa-lock text-gray-300 text-2xl mb-3"></i>
                <h2 class="text-base font-medium text-gray-800 dark:text-gray-200 mb-2">需要登录</h2>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">请登录后发布主题</p>
                <el-button type="primary" @click="navigateToLogin"
                    class="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 border-0 !text-xs">
                    登录 / 注册
                </el-button>
            </div>

            <div v-else>
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
                    <h1 class="text-sm font-medium text-gray-900 dark:text-white mb-3">发布新主题</h1>
                    <el-form ref="formRef" :model="form" label-position="top" @submit.prevent="handleSubmit"
                        :rules="rules">
                        <el-form-item label="选择分类" prop="categoryId" class="mb-3">
                            <el-select v-model="form.categoryId" placeholder="请选择分类" class="w-full">
                                <el-option v-for="category in categories" :key="category.id" :label="category.name"
                                    :value="category.id" />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="标题" prop="title" class="mb-3">
                            <el-input v-model="form.title" placeholder="请输入标题" maxlength="100" show-word-limit />
                        </el-form-item>

                        <el-form-item prop="content" label="内容" class="mb-3">
                            <client-only>
                                <template #fallback>
                                    <div
                                        class="border border-gray-200 dark:border-gray-700 rounded p-4 h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                                        <p class="text-gray-400 text-xs">编辑器加载中...</p>
                                    </div>
                                </template>
                                <lazy-md-editor v-model="form.content" placeholder="在这里输入您的主题内容..." language="zh-CN"
                                    :toolbars="mdEditorToolbars" style="height: 300px" />
                            </client-only>
                        </el-form-item>

                        <el-form-item>
                            <div class="flex space-x-3">
                                <el-button type="primary" native-type="submit" :loading="submitting"
                                    class="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 border-0 !text-xs !h-8">
                                    发布主题
                                </el-button>
                                <el-button @click="router.push('/forum')" class="!text-xs !h-8">
                                    取消
                                </el-button>
                            </div>
                        </el-form-item>
                    </el-form>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">发帖指南</h3>

                    <div class="text-gray-600 text-xs dark:text-gray-400 space-y-3">
                        <p>
                            <i class="fas fa-check-circle text-green-500 mr-2"></i>
                            请选择正确的分类，以便其他用户更容易找到您的主题。
                        </p>
                        <p>
                            <i class="fas fa-check-circle text-green-500 mr-2"></i>
                            标题应简明扼要地概括主题内容，避免使用全部大写字母和过多标点符号。
                        </p>
                        <p>
                            <i class="fas fa-check-circle text-green-500 mr-2"></i>
                            内容应详细、有条理，如果有代码片段，请使用代码格式进行标记。
                        </p>
                        <p>
                            <i class="fas fa-exclamation-circle text-yellow-500 mr-2"></i>
                            请勿发布违反社区规则的内容，包括但不限于广告、侵权、歧视等内容。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { defineAsyncComponent, shallowRef } from 'vue'
import 'md-editor-v3/lib/style.css'

// 使用defineAsyncComponent异步加载编辑器组件
const LazyMdEditor = defineAsyncComponent({
    loader: () => import('md-editor-v3').then(mod => mod.MdEditor),
    delay: 200,
    timeout: 3000,
    errorComponent: {
        template: `<div class="border border-red-200 dark:border-red-800 rounded p-4 bg-red-50 dark:bg-red-900/50">
                <p class="text-red-500 dark:text-red-400 text-xs">编辑器加载失败，请刷新页面重试</p>
               </div>`
    },
    suspensible: false
})

// 编辑器工具栏预定义
const mdEditorToolbars = shallowRef([
    'bold', 'italic', 'strikethrough', 'sub', 'sup', 'quote',
    'unorderedList', 'orderedList', 'codeRow', 'code',
    'link', 'image', 'table', 'revoke', 'next', 'preview'
])

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const user = computed(() => userStore.user)

const formRef = ref(null)

// 获取分类列表
const { data: categoriesData } = await useFetch('/api/forum/categories')
const categories = computed(() => {
    if (!categoriesData.value?.success) return []
    return categoriesData.value.data
})

// 表单数据
const form = reactive({
    categoryId: route.query.categoryId ? parseInt(route.query.categoryId) : '',
    title: '',
    content: ''
})

// 表单验证规则
const rules = {
    categoryId: [
        { required: true, message: '请选择分类', trigger: 'change' }
    ],
    title: [
        { required: true, message: '请输入标题', trigger: 'blur' },
        { min: 3, max: 100, message: '标题长度应在3到100个字符之间', trigger: 'blur' }
    ],
    content: [
        { required: true, message: '请输入内容', trigger: 'blur' }
    ]
}

// 表单提交
const submitting = ref(false)

const handleSubmit = async () => {
    if (submitting.value) return

    if (!form.title.trim()) {
        ElMessage.error('请输入标题')
        return
    }

    if (!form.content.trim()) {
        ElMessage.error('请输入内容')
        return
    }

    try {
        submitting.value = true
        const response = await $fetch('/api/forum/topics', {
            method: 'POST',
            body: {
                title: form.title,
                content: form.content,
                categoryId: form.categoryId
            },
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })

        if (response.success) {
            // 根据主题状态决定后续操作
            if (response.data && response.data.status === 'approved') {
                // 已批准的主题直接跳转到详情页
                ElMessage.success('发布成功')
                router.push(`/forum/topic/${response.data.slug}`)
            } else {
                // 待审核的主题显示提示信息并返回论坛首页
                ElMessage.success('主题已提交，等待审核')
                router.push('/forum')
            }
        } else {
            ElMessage.error(response.message || '发布失败')
        }
    } catch (error) {
        console.error('主题发布失败:', error)
        ElMessage.error('发布失败')
    } finally {
        submitting.value = false
    }
}

function navigateToLogin() {
    router.push(`/login?redirect=/forum/create`)
}

// 检查用户是否已登录
onMounted(() => {
    if (!user.value) {
        ElMessage.warning('请登录后发布主题')
    }
})
</script>

<style>
/* 缩小编辑器字体大小 */
:deep(.md-editor-content) {
    font-size: 0.875rem;
}

:deep(.md-editor-toolbar) {
    font-size: 0.875rem;
}
</style>