<template>
    <div class="container mx-auto px-4 py-8">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold">社区论坛</h1>
            <div v-if="user">
                <el-button type="primary" @click="navigateToCreateTopic">发布新主题</el-button>
            </div>
            <div v-else>
                <el-button type="primary" @click="navigateToLogin">登录后发布</el-button>
            </div>
        </div>

        <div v-if="loading" class="flex justify-center py-10">
            <el-skeleton :rows="5" animated />
        </div>

        <div v-else-if="!categories || categories.length === 0" class="text-center py-10">
            <el-empty description="暂无论坛分类" />
            <p class="mt-4 text-gray-500">管理员尚未创建任何论坛分类</p>
        </div>

        <div v-else class="grid gap-6">
            <div v-for="category in categories" :key="category.id"
                class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
                <div class="flex items-center">
                    <div v-if="category.icon" class="mr-4 text-3xl">
                        <i :class="category.icon"></i>
                    </div>
                    <div class="flex-1">
                        <NuxtLink :to="`/forum/category/${category.slug}`"
                            class="text-xl font-semibold hover:text-blue-500">
                            {{ category.name }}
                        </NuxtLink>
                        <p class="text-gray-600 dark:text-gray-400 mt-1">{{ category.description }}</p>
                        <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            主题数: {{ category._count?.topics || 0 }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
definePageMeta({
    layout: 'default',
    title: '社区论坛',
    middleware: []
})

const router = useRouter()
const userStore = useUserStore()
const user = computed(() => userStore.user)

const { data: categoriesData, pending: loading, error, refresh } = await useFetch('/api/forum/categories')

const categories = computed(() => {
    if (!categoriesData.value || !categoriesData.value.success) return []
    return categoriesData.value.data
})

const navigateToCreateTopic = () => {
    router.push('/forum/create')
}

const navigateToLogin = () => {
    router.push('/login?redirect=/forum/create')
}

onMounted(() => {
    refresh()
})
</script>