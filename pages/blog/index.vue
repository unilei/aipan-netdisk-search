<script setup>
import moment from 'moment';

const formatDate = (date) => {
    return moment(date).format('YYYY-MM-DD HH:mm:ss')
}
const postsData = ref([])
const page = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)
const categoryId = ref(undefined)
const loading = ref(true)

const getCategories = async () => {
    const res = await $fetch('/api/blog/category/get', {
        method: 'GET',
        headers: {
            "authorization": "Bearer " + useCookie('token').value
        }
    })
    return res.data;
}

const getPosts = async () => {
    loading.value = true
    try {
        let queryJson = {
            page: page.value,
            pageSize: pageSize.value
        }
        if (categoryId.value) {
            queryJson.categoryId = categoryId.value
        }
        const res = await $fetch('/api/blog/posts/get', {
            method: 'GET',
            query: queryJson,
        })
        totalCount.value = res.totalCount;
        postsData.value = res.posts
    } catch (error) {
        console.error('Failed to fetch posts:', error)
    } finally {
        loading.value = false
    }
}

const handleCurrentChange = async (val) => {
    page.value = val
    await getPosts()
}

const handleSizeChange = async (val) => {
    pageSize.value = val
    await getPosts()
}

const handleSelectCategory = (val) => {
    categoryId.value = val
    getPosts()
}

const { data: categoriesData } = await useAsyncData('categories', async () => {
    return await getCategories()
})

onMounted(async () => {
    await getPosts()
})
</script>

<template>
    <div class="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
        <!-- 顶部横幅 -->
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 text-center relative overflow-hidden">
            <div class="absolute inset-0 bg-black opacity-10"></div>
            <div class="relative z-10">
                <h1 class="text-2xl font-bold mb-2">博客天地</h1>
                <p class="text-sm opacity-90">时常发布一些妙趣横生的内容，欢迎各位朋友一同感受这里的独特魅力</p>
            </div>
        </div>

        <!-- 主要内容区 -->
        <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <!-- 左侧文章列表 -->
                <div class="lg:col-span-3">
                    <div class="space-y-6">
                        <!-- 骨架屏 -->
                        <template v-if="loading">
                            <div v-for="i in 3" :key="i"
                                class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
                                <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                                <div class="flex items-center justify-between mt-4">
                                    <div class="flex gap-2">
                                        <div class="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                        <div class="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    </div>
                                    <div class="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                            </div>
                        </template>

                        <!-- 文章列表 -->
                        <template v-else>
                            <div v-for="(item, index) in postsData" :key="index"
                                class="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-6">
                                <nuxt-link :to="'/blog/' + item.slug"
                                    class="block group">
                                    <h2 class="text-xl font-bold text-gray-800 dark:text-white group-hover:text-blue-500 transition-colors duration-300">
                                        {{ item.title }}
                                    </h2>
                                    <div class="mt-4 flex items-center justify-between">
                                        <div class="flex flex-wrap gap-2">
                                            <span v-for="(category, idx) in item.categories" :key="idx"
                                                class="px-3 py-1 text-xs rounded-full bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                                                {{ category.category.name }}
                                            </span>
                                        </div>
                                        <time class="text-sm text-gray-500 dark:text-gray-400">
                                            {{ formatDate(item.createdAt) }}
                                        </time>
                                    </div>
                                </nuxt-link>
                            </div>
                        </template>
                    </div>

                    <!-- 分页 -->
                    <div class="pagination-wrapper" v-if="!loading && totalCount > 0">
                        <el-pagination
                            v-model:current-page="page"
                            v-model:page-size="pageSize"
                            :page-sizes="[10, 20, 30, 50]"
                            size="small"
                            :background="true"
                            layout="total, sizes, prev, pager, next"
                            :total="totalCount"
                            @size-change="handleSizeChange"
                            @current-change="handleCurrentChange"
                            class="pagination-custom"
                        />
                    </div>
                </div>

                <!-- 右侧边栏 -->
                <div class="lg:col-span-1">
                    <!-- 分类骨架屏 -->
                    <div v-if="!categoriesData" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
                        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                        <div class="flex flex-wrap gap-2">
                            <div v-for="i in 5" :key="i" class="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                    </div>

                    <!-- 分类列表 -->
                    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">文章分类</h3>
                        <div class="flex flex-wrap gap-2">
                            <button
                                class="px-4 py-2 rounded-full text-sm transition-colors duration-200"
                                :class="[
                                    categoryId === undefined
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-500 hover:text-white'
                                ]"
                                @click="handleSelectCategory(undefined)"
                            >
                                全部
                            </button>
                            <button
                                v-for="category in categoriesData"
                                :key="category.id"
                                class="px-4 py-2 rounded-full text-sm transition-colors duration-200"
                                :class="[
                                    categoryId === category.id
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-500 hover:text-white'
                                ]"
                                @click="handleSelectCategory(category.id)"
                            >
                                {{ category.name }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pagination-wrapper {
  @apply flex justify-center items-center py-8;
}
</style>