<template>
    <div class="container mx-auto px-4 py-8">
        <div class="flex items-center mb-6">
            <NuxtLink to="/forum" class="text-blue-500 hover:underline mr-2">
                <i class="el-icon-arrow-left"></i> 返回论坛首页
            </NuxtLink>
            <h1 class="text-2xl font-bold">发布新主题</h1>
        </div>

        <div v-if="!user" class="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <el-empty description="请先登录" />
            <p class="mt-4 text-gray-500">您需要先登录才能发布主题</p>
            <el-button type="primary" class="mt-4" @click="navigateToLogin">去登录</el-button>
        </div>

        <div v-else-if="categoriesLoading || !categories || categories.length === 0" class="text-center py-10">
            <el-skeleton v-if="categoriesLoading" :rows="5" animated />
            <template v-else>
                <el-empty description="暂无分类" />
                <p class="mt-4 text-gray-500">管理员尚未创建任何论坛分类</p>
            </template>
        </div>

        <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <el-form :model="form" @submit.prevent="submitForm">
                <el-form-item label="分类" required>
                    <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
                        <el-option v-for="category in categories" :key="category.id" :label="category.name"
                            :value="category.id" />
                    </el-select>
                </el-form-item>

                <el-form-item label="标题" required>
                    <el-input v-model="form.title" placeholder="请输入主题标题" maxlength="100" show-word-limit />
                </el-form-item>

                <el-form-item label="内容" required>
                    <MdEditor v-model="form.content" language="zh-CN"
                        :toolbars="['bold', 'italic', 'strikethrough', 'sub', 'sup', 'quote', 'unorderedList', 'orderedList', 'codeRow', 'code', 'link', 'image', 'table', 'revoke', 'next', 'preview', 'htmlPreview', 'catalog']"
                        style="height: 400px" />
                </el-form-item>

                <el-form-item class="flex justify-end">
                    <el-button @click="navigateToForum">取消</el-button>
                    <el-button type="primary" native-type="submit"
                        :disabled="submitting || !form.title || !form.content || !form.categoryId">
                        {{ submitting ? '发布中...' : '发布主题' }}
                    </el-button>
                </el-form-item>
            </el-form>
        </div>
    </div>
</template>

<script setup>
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

definePageMeta({
    layout: 'default',
    title: '发布新主题',
    middleware: []
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const user = computed(() => userStore.user)

// 表单数据
const form = reactive({
    title: '',
    content: '',
    categoryId: route.query.categoryId ? parseInt(route.query.categoryId) : '',
})

const submitting = ref(false)

// 获取分类列表
const { data: categoriesData, pending: categoriesLoading, refresh: refreshCategories } = await useFetch('/api/forum/categories')

const categories = computed(() => {
    if (!categoriesData.value || !categoriesData.value.success) return []
    return categoriesData.value.data
})

// 导航函数
const navigateToForum = () => {
    router.push('/forum')
}

const navigateToLogin = () => {
    router.push(`/login?redirect=/forum/create${route.query.categoryId ? `?categoryId=${route.query.categoryId}` : ''}`)
}

async function submitForm() {
    if (submitting.value || !form.title || !form.content || !form.categoryId) return

    submitting.value = true

    try {
        const token = useCookie('token').value
        const response = await $fetch('/api/forum/topics', {
            method: 'POST',
            body: form,
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (response.success) {
            // 显示成功消息
            ElMessage.success('主题发布成功')

            // 跳转到主题页面
            router.push(`/forum/topic/${response.data.slug}`)
        } else {
            ElMessage.error(response.message || '发布失败')
        }
    } catch (error) {
        console.error('发布主题失败:', error)
        ElMessage.error('发布主题失败，请重试')
    } finally {
        submitting.value = false
    }
}

onMounted(async () => {
    // 确保用户数据已加载
    if (!userStore.user) {
        await userStore.fetchUser()
    }
    refreshCategories()
})
</script>