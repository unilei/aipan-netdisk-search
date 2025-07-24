<script setup>
import moment from 'moment';

// SEO优化
useSeoMeta({
    title: 'AIPAN博客 - 技术分享与生活感悟平台 | 编程技术·开发经验·生活随笔',
    description: 'AIPAN博客是一个优质的内容分享平台，汇聚技术文章、编程教程、开发经验、生活感悟等多样化内容。用户可以在这里发布博客文章，分享知识和见解，与社区成员交流学习。',
    keywords: 'AIPAN博客,技术博客,编程教程,开发经验,技术分享,生活感悟,博客平台,内容创作,知识分享',
    ogTitle: 'AIPAN博客 - 技术分享与生活感悟平台',
    ogDescription: 'AIPAN博客汇聚技术文章、编程教程、开发经验、生活感悟等优质内容，与社区成员交流学习。',
    twitterTitle: 'AIPAN博客 - 技术分享与生活感悟平台',
    twitterDescription: '优质内容分享平台！技术文章、编程教程、开发经验、生活感悟，与社区交流学习！'
});

useHead({
    meta: [
        {
            name: 'keywords',
            content: 'AIPAN博客,技术博客,编程教程,开发经验,技术分享,生活感悟'
        },
        // Open Graph / Facebook
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'AIPAN.ME 博客 - 分享技术、生活和见解' },
        {
            property: 'og:description',
            content: '爱盼博客是一个分享技术、生活和见解的平台。在这里，你可以找到关于编程、技术趋势、生活感悟等多样化的优质内容。'
        },
        { property: 'og:image', content: 'https://www.aipan.me/default-og-image.png' },
        { property: 'og:url', content: 'https://www.aipan.me/blog' },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'AIPAN.ME 博客 - 分享技术、生活和见解' },
        {
            name: 'twitter:description',
            content: '爱盼博客是一个分享技术、生活和见解的平台。在这里，你可以找到关于编程、技术趋势、生活感悟等多样化的优质内容。'
        },
        { name: 'twitter:image', content: 'https://www.aipan.me/default-og-image.png' },
        // 其他重要的meta标签
        { name: 'robots', content: 'index,follow' },
        { name: 'author', content: 'AIPAN.ME' }
    ],
    link: [
        { rel: 'canonical', href: 'https://www.aipan.me/blog' }
    ],
    // 添加结构化数据
    script: [
        {
            type: 'application/ld+json',
            children: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Blog',
                name: 'AIPAN.ME 博客',
                description: '爱盼博客是一个分享技术、生活和见解的平台。',
                url: 'https://www.aipan.me/blog',
                publisher: {
                    '@type': 'Organization',
                    name: 'AIPAN.ME',
                    logo: {
                        '@type': 'ImageObject',
                        url: 'https://www.aipan.me/logo.png'
                    }
                }
            })
        }
    ]
})

const formatDate = (date) => {
    return moment(date).format('YYYY-MM-DD')
}

const postsData = ref([])
const page = ref(1)
const pageSize = ref(16)
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
        postsData.value = res.posts || [];
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
    <div class="min-h-[calc(100vh-140px)] bg-gray-50 dark:bg-gray-900">
        <div class="max-w-[1240px] mx-auto px-4 py-12">
            <!-- 分类导航 -->
            <div class="mb-12">
                <div class="flex items-center justify-center flex-wrap gap-4">
                    <button class="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200" :class="[
                        categoryId === undefined
                            ? 'bg-blue-500 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white border border-gray-200 dark:border-gray-700'
                    ]" @click="handleSelectCategory(undefined)">
                        全部文章
                    </button>
                    <button v-for="category in categoriesData" :key="category.id"
                        class="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200" :class="[
                            categoryId === category.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white border border-gray-200 dark:border-gray-700'
                        ]" @click="handleSelectCategory(category.id)">
                        {{ category.name }}
                    </button>
                </div>
            </div>

            <!-- 文章列表 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                <!-- 骨架屏 -->
                <template v-if="loading">
                    <div v-for="i in 12" :key="i"
                        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden animate-pulse border border-gray-200 dark:border-gray-700">
                        <div class="p-6 space-y-4">

                            <!-- 分类标签骨架 -->
                            <div class="flex gap-2">
                                <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
                                <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
                            </div>
                            <!-- 标题骨架 -->
                            <div class="space-y-2">
                                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            </div>
                            <!-- 日期和阅读更多骨架 -->
                            <div class="flex items-center justify-between">
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- 文章卡片 -->
                <template v-else>
                    <div v-if="postsData.length === 0" class="col-span-full">
                        <div class="text-center py-20">
                            <div
                                class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                                <svg class="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none"
                                    stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                                    </path>
                                </svg>
                            </div>
                            <h3 class="text-base font-semibold text-gray-600 dark:text-gray-400 mb-2">暂无文章</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-500">该分类下还没有发布文章</p>
                        </div>
                    </div>
                    <nuxt-link v-for="(item, index) in postsData" :key="index" :to="'/blog/' + item.slug"
                        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700">
                        <!-- 文章信息 -->
                        <div class="p-6 space-y-4">

                            <div class="flex flex-wrap gap-2">
                                <span v-for="(category, idx) in item.categories" :key="idx"
                                    class="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                    {{ category.category.name }}
                                </span>
                            </div>
                            <div class="space-y-3">
                                <h2 class="text-sm font-bold text-gray-800 dark:text-white line-clamp-2 leading-tight">
                                    {{ item.title }}
                                </h2>
                                <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <time class="flex items-center space-x-1">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z">
                                            </path>
                                        </svg>
                                        <span>{{ formatDate(item.createdAt) }}</span>
                                    </time>
                                    <div class="flex items-center space-x-1">
                                        <span class="text-xs">阅读更多</span>
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M9 5l7 7-7 7"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </nuxt-link>
                </template>
            </div>

            <!-- 分页 -->
            <div v-if="!loading && totalCount > 0" class="mt-16 flex justify-center">
                <div
                    class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4">
                    <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[12, 24, 36]"
                        :background="true" layout="prev, pager, next, sizes, jumper" :total="totalCount"
                        @size-change="handleSizeChange" @current-change="handleCurrentChange"
                        class="pagination-custom" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 自定义分页样式 */
:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
    background: rgb(59 130 246);
    border-color: rgb(59 130 246);
    color: white;
}

:deep(.el-pagination.is-background .el-pager li) {
    background-color: transparent;
    color: inherit;
    border: 1px solid rgb(229 231 235);
    margin: 0 2px;
    border-radius: 8px;
    transition: all 0.2s ease;
}

:deep(.el-pagination.is-background .el-pager li:hover:not(.is-active)) {
    background: rgb(59 130 246);
    color: white;
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
    background: rgb(59 130 246);
    color: white;
    border: none;
    border-radius: 8px;
    transition: all 0.2s ease;
}

:deep(.el-pagination .btn-prev:hover),
:deep(.el-pagination .btn-next:hover) {
    background: rgb(37 99 235);
}

/* 基础过渡效果 */
.group {
    transition: all 0.2s ease;
}

/* 文章标题多行省略 */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* 响应式优化 */
@media (max-width: 768px) {
    .grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
}

@media (min-width: 769px) and (max-width: 1024px) {
    .grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* 滚动条样式 */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: rgb(243 244 246);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: rgb(59 130 246);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgb(37 99 235);
}

/* 暗色模式滚动条 */
.dark ::-webkit-scrollbar-track {
    background: rgb(31 41 55);
}
</style>