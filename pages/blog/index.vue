<script setup>
import moment from 'moment';
import { useUnsplash } from '~/composables/useUnsplash';

// SEO配置
useHead({
    title: 'AIPAN.ME 博客 - 分享技术、生活和见解',
    meta: [
        {
            name: 'description',
            content: '爱盼博客是一个分享技术、生活和见解的平台。在这里，你可以找到关于编程、技术趋势、生活感悟等多样化的优质内容。'
        },
        {
            name: 'keywords',
            content: '博客,AIPAN.ME,技术博客,编程,生活感悟'
        },
        // Open Graph / Facebook
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'AIPAN.ME 博客 - 分享技术、生活和见解' },
        {
            property: 'og:description',
            content: '爱盼博客是一个分享技术、生活和见解的平台。在这里，你可以找到关于编程、技术趋势、生活感悟等多样化的优质内容。'
        },
        { property: 'og:image', content: '/blog-default-og.jpg' },
        { property: 'og:url', content: 'https://aipan.me/blog' },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'AIPAN.ME 博客 - 分享技术、生活和见解' },
        {
            name: 'twitter:description',
            content: '爱盼博客是一个分享技术、生活和见解的平台。在这里，你可以找到关于编程、技术趋势、生活感悟等多样化的优质内容。'
        },
        { name: 'twitter:image', content: '/blog-default-og.jpg' },
        // 其他重要的meta标签
        { name: 'robots', content: 'index,follow' },
        { name: 'author', content: 'AIPAN.ME' }
    ],
    link: [
        { rel: 'canonical', href: 'https://aipan.me/blog' }
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
                url: 'https://aipan.me/blog',
                publisher: {
                    '@type': 'Organization',
                    name: 'AIPAN.ME',
                    logo: {
                        '@type': 'ImageObject',
                        url: 'https://aipan.me/logo.png'
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
const pageSize = ref(12)
const totalCount = ref(0)
const categoryId = ref(undefined)
const loading = ref(true)

const { getCachedPhoto } = useUnsplash();

const getCategories = async () => {
    const res = await $fetch('/api/blog/category/get', {
        method: 'GET',
        headers: {
            "authorization": "Bearer " + useCookie('token').value
        }
    })
    return res.data;
}

// 添加默认图片列表
const defaultImages = [
    'https://images.unsplash.com/photo-1516116216624-53e697fedbea',  // 极简主义
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085',  // 编程
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',  // 编码
    'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1',  // 技术
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1',  // 科技
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b',  // 科技
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5',  // 代码
    'https://images.unsplash.com/photo-1537432376769-00f5c2f4c8d2',  // 极简
];

// 修改获取随机图片的函数
const getRandomUnsplashImage = (width = 800, height = 400) => {
    const randomImage = defaultImages[Math.floor(Math.random() * defaultImages.length)];
    // 添加 Unsplash 图片参数
    return `${randomImage}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
};

const imageCache = ref(new Map());

const getCachedImage = (post) => {
    if (post.cover) return post.cover;
    if (imageCache.value.has(post.id)) {
        return imageCache.value.get(post.id);
    }
    const randomImage = getRandomUnsplashImage();
    imageCache.value.set(post.id, randomImage);
    return randomImage;
};

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

        // 为每篇文章获取封面图
        const posts = await Promise.all(res.posts.map(async post => {
            if (post.cover) return post;
            const photo = await getCachedPhoto(post.id);
            return {
                ...post,
                cover: photo?.url,
                unsplashCredit: photo?.credit
            };
        }));

        postsData.value = posts;
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

// 修改错误处理函数
const handleImageError = async (item) => {
    const photo = await getCachedPhoto(item.id + '-retry');
    if (photo) {
        item.cover = photo.url;
        item.unsplashCredit = photo.credit;
    }
};

const { data: categoriesData } = await useAsyncData('categories', async () => {
    return await getCategories()
})

onMounted(async () => {
    await getPosts()
})
</script>

<template>
    <div
        class="min-h-[calc(100vh-140px)] bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 transition-all duration-500">
        <!-- 顶部横幅 -->
        <div class="relative h-[200px] overflow-hidden">
            <!-- 背景图 -->
            <div class="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                <div class="absolute inset-0 bg-black/30"></div>
                <!-- 动态装饰图形 -->
                <div class="absolute inset-0 opacity-20">
                    <div class="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
                    <div
                        class="absolute top-20 right-20 w-24 h-24 bg-white/10 rounded-full blur-lg animate-float-delayed">
                    </div>
                    <div
                        class="absolute bottom-10 left-1/3 w-20 h-20 bg-white/10 rounded-full blur-md animate-float-slow">
                    </div>
                    <div
                        class="absolute inset-0 bg-[radial-gradient(circle_600px_at_50%_300px,rgba(255,255,255,0.1),transparent)]">
                    </div>
                </div>
                <!-- 网格背景 -->
                <div class="absolute inset-0 opacity-5">
                    <div class="w-full h-full"
                        style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 30px 30px;">
                    </div>
                </div>
            </div>
            <!-- 内容 -->
            <div class="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center items-center text-white">
                <div class="text-center space-y-6 animate-fade-in-up">
                    <h1
                        class="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent drop-shadow-lg">
                        博客天地
                    </h1>
                    <p class="text-sm md:text-base opacity-90 max-w-3xl leading-relaxed">
                        分享技术见解，记录生活点滴，探索无限可能
                    </p>
                    <div class="flex items-center justify-center space-x-4 text-sm opacity-80">
                        <div class="flex items-center space-x-2">
                            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span>持续更新</span>
                        </div>
                        <div class="w-1 h-4 bg-white/30"></div>
                        <div class="flex items-center space-x-2">
                            <div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <span>{{ totalCount }} 篇文章</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 主要内容区 -->
        <div class="max-w-[1240px] mx-auto px-4 py-12">
            <!-- 分类导航 -->
            <div class="mb-12">
                <div class="text-center mb-6">
                    <h2 class="text-lg font-bold text-gray-800 dark:text-white mb-2">文章分类</h2>
                    <div class="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
                </div>
                <div class="flex items-center justify-center flex-wrap gap-4">
                    <button
                        class="group relative px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105"
                        :class="[
                            categoryId === undefined
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white hover:shadow-lg hover:shadow-blue-500/25 border border-gray-200 dark:border-gray-700'
                        ]" @click="handleSelectCategory(undefined)">
                        <span class="relative z-10">全部文章</span>
                        <div v-if="categoryId === undefined"
                            class="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        </div>
                    </button>
                    <button v-for="category in categoriesData" :key="category.id"
                        class="group relative px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105"
                        :class="[
                            categoryId === category.id
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white hover:shadow-lg hover:shadow-blue-500/25 border border-gray-200 dark:border-gray-700'
                        ]" @click="handleSelectCategory(category.id)">
                        <span class="relative z-10">{{ category.name }}</span>
                        <div v-if="categoryId === category.id"
                            class="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        </div>
                    </button>
                </div>
            </div>

            <!-- 文章列表 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                <!-- 骨架屏 -->
                <template v-if="loading">
                    <div v-for="i in 8" :key="i"
                        class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden animate-pulse border border-gray-100 dark:border-gray-700">
                        <div
                            class="h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 relative">
                            <div
                                class="absolute inset-0 bg-gradient-to-t from-gray-300/50 to-transparent dark:from-gray-600/50">
                            </div>
                        </div>
                        <div class="p-6 space-y-4">
                            <div class="flex gap-2">
                                <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
                                <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
                            </div>
                            <div class="space-y-2">
                                <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            </div>
                            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
                        class="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transform hover:-translate-y-2 hover:scale-[1.02]">
                        <!-- 文章封面图 -->
                        <div
                            class="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                            <img :src="item.cover"
                                class="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:rotate-1"
                                :alt="item.title" loading="lazy" @error="handleImageError(item)" />
                            <!-- 添加图片来源信息 -->
                            <div v-if="item.unsplashCredit"
                                class="absolute bottom-2 right-2 px-2 py-1 text-xs text-white/90 bg-black/60 rounded-md backdrop-blur-sm">
                                Photo by
                                <a :href="item.unsplashCredit.link" target="_blank" rel="noopener noreferrer"
                                    class="hover:text-blue-300 transition-colors">
                                    {{ item.unsplashCredit.name }}
                                </a>
                            </div>
                            <!-- 渐变遮罩 -->
                            <div
                                class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                            </div>
                            <!-- 阅读按钮 -->
                            <div
                                class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                                <div
                                    class="bg-white/20 backdrop-blur-md rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z">
                                        </path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <!-- 文章信息 -->
                        <div class="p-6 space-y-4">
                            <div class="flex flex-wrap gap-2">
                                <span v-for="(category, idx) in item.categories" :key="idx"
                                    class="px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                    {{ category.category.name }}
                                </span>
                            </div>
                            <div class="space-y-3">
                                <h2
                                    class="text-sm font-bold text-gray-800 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-purple-500 group-hover:bg-clip-text transition-all duration-300 line-clamp-2 leading-tight">
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
                                    <div
                                        class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <span class="text-xs">阅读更多</span>
                                        <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    background: linear-gradient(135deg, rgb(59 130 246), rgb(147 51 234));
    border-color: rgb(59 130 246);
}

:deep(.el-pagination.is-background .el-pager li) {
    background-color: transparent;
    color: inherit;
    border: 1px solid rgb(229 231 235);
    margin: 0 2px;
    border-radius: 8px;
    transition: all 0.3s ease;
}

:deep(.el-pagination.is-background .el-pager li:hover:not(.is-active)) {
    background: linear-gradient(135deg, rgb(59 130 246), rgb(147 51 234));
    color: white;
    transform: translateY(-1px);
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
    background: linear-gradient(135deg, rgb(59 130 246), rgb(147 51 234));
    color: white;
    border: none;
    border-radius: 8px;
    transition: all 0.3s ease;
}

:deep(.el-pagination .btn-prev:hover),
:deep(.el-pagination .btn-next:hover) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* 动画效果 */
@keyframes float {

    0%,
    100% {
        transform: translateY(0px) rotate(0deg);
    }

    50% {
        transform: translateY(-20px) rotate(5deg);
    }
}

@keyframes float-delayed {

    0%,
    100% {
        transform: translateY(0px) rotate(0deg);
    }

    50% {
        transform: translateY(-15px) rotate(-3deg);
    }
}

@keyframes float-slow {

    0%,
    100% {
        transform: translateY(0px) rotate(0deg);
    }

    50% {
        transform: translateY(-10px) rotate(2deg);
    }
}

@keyframes fade-in-up {
    from {
        opacity: 0;
        transform: translateY(30px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-float {
    animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
    animation: float-delayed 8s ease-in-out infinite;
}

.animate-float-slow {
    animation: float-slow 10s ease-in-out infinite;
}

.animate-fade-in-up {
    animation: fade-in-up 1s ease-out;
}

/* 文章卡片阴影过渡 */
.group {
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 文章标题多行省略 */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* 优化图片加载过渡 */
img {
    transition: all 0.5s ease;
    opacity: 0;
}

img.loaded {
    opacity: 1;
}

/* 添加图片加载动画 */
@keyframes imageLoad {
    from {
        opacity: 0;
        transform: scale(1.1);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

.group img {
    animation: imageLoad 0.6s ease forwards;
}

/* 渐变文字效果 */
.bg-clip-text {
    -webkit-background-clip: text;
    background-clip: text;
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
    background: linear-gradient(135deg, rgb(59 130 246), rgb(147 51 234));
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, rgb(37 99 235), rgb(126 34 206));
}

/* 暗色模式滚动条 */
.dark ::-webkit-scrollbar-track {
    background: rgb(31 41 55);
}
</style>