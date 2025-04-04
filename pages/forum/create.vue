<template>
    <div class="bg-gray-50 dark:bg-gray-900 min-h-screen pb-12">
        <!-- 返回导航 -->
        <div
            class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
            <div class="container mx-auto px-4">
                <div class="py-4 flex items-center text-sm">
                    <NuxtLink to="/forum"
                        class="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center">
                        <i class="fas fa-home mr-1"></i>
                        论坛首页
                    </NuxtLink>
                    <i class="fas fa-chevron-right mx-2 text-gray-400 text-xs"></i>
                    <span class="text-gray-900 dark:text-white font-medium">发布新主题</span>
                </div>
            </div>
        </div>

        <div class="container mx-auto px-4 py-6">
            <div v-if="!user" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                <i class="fas fa-user-lock text-purple-500 text-4xl mb-4"></i>
                <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">需要登录</h2>
                <p class="text-gray-600 dark:text-gray-400 mb-6">您需要登录后才能发布主题</p>
                <el-button type="primary" @click="navigateToLogin"
                    class="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 border-0">
                    登录 / 注册
                </el-button>
            </div>

            <div v-else>
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">发布新主题</h1>

                    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" status-icon
                        @submit.prevent="handleSubmit">

                        <el-form-item label="分类" prop="categoryId" class="mb-6">
                            <el-select v-model="form.categoryId" placeholder="请选择分类" class="w-full"
                                :loading="loadingCategories">
                                <el-option v-for="category in categories" :key="category.id" :label="category.name"
                                    :value="category.id">
                                    <div class="flex items-center">
                                        <i v-if="category.icon"
                                            :class="[category.icon, 'mr-2 text-purple-600 dark:text-purple-400']"></i>
                                        <span>{{ category.name }}</span>
                                    </div>
                                </el-option>
                            </el-select>
                        </el-form-item>

                        <el-form-item label="标题" prop="title" class="mb-6">
                            <el-input v-model="form.title" placeholder="请输入主题标题（5-100个字符）" maxlength="100"
                                show-word-limit />
                        </el-form-item>

                        <el-form-item prop="content" label="主题内容">
                            <client-only>
                                <template #fallback>
                                    <div
                                        class="border border-gray-200 dark:border-gray-700 rounded p-4 h-[400px] flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                                        <p class="text-gray-400">编辑器加载中...</p>
                                    </div>
                                </template>
                                <lazy-md-editor v-model="form.content" placeholder="在这里输入您的主题内容..." language="zh-CN"
                                    :toolbars="mdEditorToolbars" style="height: 400px" />
                            </client-only>
                        </el-form-item>

                        <el-form-item>
                            <div class="flex space-x-4">
                                <el-button type="primary" native-type="submit" :loading="submitting"
                                    class="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 border-0">
                                    发布主题
                                </el-button>
                                <NuxtLink to="/forum">
                                    <el-button>取消</el-button>
                                </NuxtLink>
                            </div>
                        </el-form-item>
                    </el-form>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">发帖指南</h3>

                    <div class="text-gray-600 dark:text-gray-400 space-y-3">
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
import 'md-editor-v3/lib/style.css'
import { defineAsyncComponent, shallowRef } from 'vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const user = computed(() => userStore.user)

// 表单和验证规则
const formRef = ref(null)
const form = reactive({
    categoryId: route.query.categoryId || '',
    title: '',
    content: ''
})

const rules = {
    categoryId: [
        { required: true, message: '请选择分类', trigger: 'change' }
    ],
    title: [
        { required: true, message: '请输入标题', trigger: 'blur' },
        { min: 5, max: 100, message: '标题长度应在5到100个字符之间', trigger: 'blur' }
    ],
    content: [
        { required: true, message: '请输入内容', trigger: 'blur' },
        { min: 10, message: '内容至少需要10个字符', trigger: 'blur' }
    ]
}

// 加载分类
const { data: categoriesData, pending: loadingCategories } = await useFetch('/api/forum/categories')
const categories = computed(() => {
    if (!categoriesData.value?.success) return []
    return categoriesData.value.data
})

// 表单提交
const submitting = ref(false)

// 使用defineAsyncComponent异步加载编辑器组件
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

// 编辑器工具栏预定义
const mdEditorToolbars = shallowRef([
    'bold', 'italic', 'strikethrough', 'sub', 'sup', 'quote',
    'unorderedList', 'orderedList', 'codeRow', 'code',
    'link', 'image', 'table', 'revoke', 'next', 'preview'
])

const handleSubmit = async () => {
    if (!user.value) {
        navigateToLogin()
        return
    }

    const valid = await formRef.value.validate().catch(() => false)

    if (!valid) {
        ElMessage.warning('请正确填写表单信息')
        return
    }

    submitting.value = true

    try {
        const response = await $fetch('/api/forum/topics', {
            method: 'POST',
            body: {
                title: form.title,
                content: form.content,
                categoryId: form.categoryId
            }
        })

        if (response.success) {
            ElMessage.success('主题发布成功')
            router.push(`/forum/topic/${response.data.slug}`)
        } else {
            ElMessage.error(response.message || '发布失败')
        }
    } catch (error) {
        console.error('发布主题失败:', error)
        ElMessage.error('发布失败，请稍后重试')
    } finally {
        submitting.value = false
    }
}

const navigateToLogin = () => {
    const redirect = encodeURIComponent(route.fullPath)
    router.push(`/login?redirect=${redirect}`)
}

// 检查用户登录状态
onMounted(() => {
    if (!user.value) {
        ElMessage.warning('您需要登录后才能发布主题')
    }
})
</script>