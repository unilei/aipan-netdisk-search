<script setup>
import moment from 'moment';
import { useUnsplash } from '~/composables/useUnsplash';

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
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <!-- 顶部横幅 -->
        <div class="relative h-[300px] overflow-hidden">
            <!-- 背景图 -->
            <div class="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700">
                <div class="absolute inset-0 bg-black/20"></div>
                <!-- 装饰图形 -->
                <div class="absolute inset-0 opacity-10">
                    <div
                        class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_500px_at_50%_200px,rgba(255,255,255,0.1),transparent)]">
                    </div>
                </div>
            </div>
            <!-- 内容 -->
            <div class="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center items-center text-white">
                <h1 class="text-4xl md:text-5xl font-bold mb-4">博客天地</h1>
                <p class="text-lg md:text-xl opacity-90 text-center max-w-2xl">
                    分享技术见解，记录生活点滴
                </p>
            </div>
        </div>

        <!-- 主要内容区 -->
        <div class="max-w-7xl mx-auto px-4 py-12">
            <!-- 分类导航 -->
            <div class="mb-8 flex items-center justify-center flex-wrap gap-3">
                <button class="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300" :class="[
                    categoryId === undefined
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white hover:shadow-md hover:shadow-blue-500/20'
                ]" @click="handleSelectCategory(undefined)">
                    全部文章
                </button>
                <button v-for="category in categoriesData" :key="category.id"
                    class="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300" :class="[
                        categoryId === category.id
                            ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white hover:shadow-md hover:shadow-blue-500/20'
                    ]" @click="handleSelectCategory(category.id)">
                    {{ category.name }}
                </button>
            </div>

            <!-- 文章列表 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- 骨架屏 -->
                <template v-if="loading">
                    <div v-for="i in 6" :key="i"
                        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden animate-pulse">
                        <div class="h-48 bg-gray-200 dark:bg-gray-700"></div>
                        <div class="p-6">
                            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                    </div>
                </template>

                <!-- 文章卡片 -->
                <template v-else>
                    <nuxt-link v-for="(item, index) in postsData" :key="index" :to="'/blog/' + item.slug"
                        class="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                        <!-- 文章封面图 -->
                        <div class="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-700">
                            <img :src="item.cover"
                                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                :alt="item.title" loading="lazy" @error="handleImageError(item)" />
                            <!-- 添加图片来源信息 -->
                            <div v-if="item.unsplashCredit"
                                class="absolute bottom-0 right-0 p-1 text-xs text-white/80 bg-black/50">
                                Photo by
                                <a :href="item.unsplashCredit.link" target="_blank" rel="noopener noreferrer"
                                    class="hover:text-white">
                                    {{ item.unsplashCredit.name }}
                                </a>
                            </div>
                            <div
                                class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            </div>
                        </div>
                        <!-- 文章信息 -->
                        <div class="p-6">
                            <div class="flex gap-2 mb-3">
                                <span v-for="(category, idx) in item.categories" :key="idx"
                                    class="px-2.5 py-1 text-xs rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                    {{ category.category.name }}
                                </span>
                            </div>
                            <h2
                                class="text-lg font-bold text-gray-800 dark:text-white group-hover:text-blue-500 transition-colors duration-300 line-clamp-2 mb-2">
                                {{ item.title }}
                            </h2>
                            <time class="text-sm text-gray-500 dark:text-gray-400">
                                {{ formatDate(item.createdAt) }}
                            </time>
                        </div>
                    </nuxt-link>
                </template>
            </div>

            <!-- 分页 -->
            <div v-if="!loading && totalCount > 0" class="mt-12 flex justify-center">
                <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[12, 24, 36]"
                    :background="true" layout="prev, pager, next" :total="totalCount" @size-change="handleSizeChange"
                    @current-change="handleCurrentChange" class="pagination-custom" />
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 自定义分页样式 */
:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
    background-color: rgb(59 130 246);
}

:deep(.el-pagination.is-background .el-pager li) {
    background-color: transparent;
    color: inherit;
}

/* 文章卡片阴影过渡 */
.group {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
    transition: transform 0.3s ease, opacity 0.3s ease;
    opacity: 0;
}

img.loaded {
    opacity: 1;
}

/* 优化卡片悬浮效果 */
.group:hover {
    transform: translateY(-2px);
}

/* 添加图片加载动画 */
@keyframes imageLoad {
    from {
        opacity: 0;
        transform: scale(1.05);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

.group img {
    animation: imageLoad 0.3s ease forwards;
}
</style>