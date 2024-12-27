<script setup>
const { data: movieData } = await useFetch('https://netdisk.aipan.me/api/movie/daily')

onMounted(() => {
    console.log(movieData.value)
    // SEO配置
    useHead({
        title: computed(() => movieInfo.value?.电影名称 ? `${movieInfo.value.电影名称} - 每日电影推荐 | AIPAN.ME` : '每日电影推荐 | AIPAN.ME'),
        meta: [
            {
                name: 'description',
                content: computed(() =>
                    movieInfo.value?.剧情简介
                        ? `${movieInfo.value.剧情简介.slice(0, 150)}...`
                        : '每日精选优质电影推荐，发现值得一看的电影，包含影片简介、评分、影评等详细信息。'
                )
            },
            {
                name: 'keywords',
                content: computed(() =>
                    movieInfo.value
                        ? `${movieInfo.value.电影名称},${movieInfo.value.导演},${movieInfo.value.主演},电影推荐,影评,电影评分`
                        : '每日电影,电影推荐,电影评分,电影资讯,电影点评'
                )
            },
            // Open Graph / Facebook
            { property: 'og:type', content: 'article' },
            {
                property: 'og:title',
                content: computed(() => movieInfo.value?.电影名称 ? `${movieInfo.value.电影名称} - 每日电影推荐` : '每日电影推荐 | AIPAN.ME')
            },
            {
                property: 'og:description',
                content: computed(() =>
                    movieInfo.value?.剧情简介
                        ? `${movieInfo.value.剧情简介.slice(0, 150)}...`
                        : '每日精选优质电影推荐，发现值得一看的电影。'
                )
            },
            {
                property: 'og:image',
                content: computed(() => movieData.value?.data?.poster_url)
            },
            // Twitter
            { name: 'twitter:card', content: 'summary_large_image' },
            {
                name: 'twitter:title',
                content: computed(() => movieInfo.value?.电影名称 ? `${movieInfo.value.电影名称} - 每日电影推荐` : '每日电影推荐 | AIPAN.ME')
            },
            {
                name: 'twitter:description',
                content: computed(() =>
                    movieInfo.value?.剧情简介
                        ? `${movieInfo.value.剧情简介.slice(0, 150)}...`
                        : '每日精选优质电影推荐，发现值得一看的电影。'
                )
            },
            {
                name: 'twitter:image',
                content: computed(() => movieData.value?.data?.poster_url)
            },
            // 其他重要的meta标签
            { name: 'robots', content: 'index,follow' },
            { name: 'author', content: 'AIPAN.ME' },
            {
                name: 'article:published_time',
                content: computed(() => movieInfo.value?.上映日期 || new Date().toISOString())
            },
        ],
        link: [
            { rel: 'canonical', href: 'https://aipan.me/movie/daily' }
        ]
    })
})

// 解析电影信息字符串为对象
const movieInfo = computed(() => {
    if (!movieData.value?.data?.movie_info) return null

    const info = {}
    const lines = movieData.value.data.movie_info.split('\n')

    lines.forEach(line => {
        if (!line.startsWith('- ')) return
        const [key, value] = line.substring(2).split('：')
        if (key && value) {
            info[key.trim()] = value.trim()
        }
    })

    return info
})

// 解析影评信息
const reviews = computed(() => {
    if (!movieData.value?.data?.reviews) return []

    const reviewList = []
    const lines = movieData.value.data.reviews.split('\n\n')

    lines.forEach(block => {
        if (!block.trim()) return
        const review = {}
        const reviewLines = block.split('\n')

        reviewLines.forEach(line => {
            if (!line.startsWith('- ')) return
            const [key, value] = line.substring(2).split('：')
            if (key && value) {
                review[key.trim()] = value.trim()
            }
        })

        if (Object.keys(review).length > 0) {
            reviewList.push(review)
        }
    })

    return reviewList
})

// 添加加载状态
const isLoading = ref(true)
onMounted(() => {
    setTimeout(() => {
        isLoading.value = false
    }, 500)
})

// 格式化日期
const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

definePageMeta({
    layout: 'netdisk'
})
</script>

<template>
    <div
        class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-16 px-4 sm:px-6 lg:px-8">

        <div class="max-w-4xl mx-auto">
            <div class="flex items-center  gap-4 py-4">
                <nuxt-link to="/"
                    class="group flex items-center gap-3 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg hover:shadow-blue-500/30 transform hover:scale-105 transition-all duration-300">
                    <i class="fa-solid fa-arrow-left text-xs"></i>
                    <span class="text-xs">返回首页</span>
                </nuxt-link>
            </div>
            <!-- 页面标题 -->
            <div class="text-center mb-12 animate-fadeIn">
                <h1
                    class="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    每日推荐
                </h1>
                <p class="mt-3 text-gray-600 dark:text-gray-400">发现精彩影片，感受电影魅力</p>
            </div>

            <!-- 加载动画 -->
            <div v-if="isLoading" class="flex justify-center items-center h-96">
                <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>

            <!-- 电影卡片 -->
            <div v-else
                class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden animate-fadeIn">
                <div class="md:flex">
                    <!-- 海报 -->
                    <div class="md:flex-shrink-0 relative group">
                        <img :src="movieData?.data?.poster_url" :alt="movieInfo?.电影名称"
                            class="h-[450px] w-full md:w-80 object-cover transition-all duration-500 group-hover:scale-105"
                            loading="lazy" />
                        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent 
                                  opacity-0 group-hover:opacity-100 transition-all duration-500">
                        </div>
                    </div>

                    <!-- 电影信息 -->
                    <div class="p-8 flex-1 relative overflow-hidden">
                        <!-- 装饰背景 -->
                        <div
                            class="absolute -right-20 -top-20 w-40 h-40 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl">
                        </div>
                        <div
                            class="absolute -left-20 -bottom-20 w-40 h-40 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl">
                        </div>

                        <div class="relative">
                            <div class="flex items-center justify-between mb-6">
                                <h1
                                    class="text-3xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                                    {{ movieInfo?.电影名称 }}
                                </h1>
                                <div
                                    class="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold shadow-lg hover:shadow-orange-500/20 transition-shadow duration-300">
                                    {{ movieInfo?.评分 }}
                                </div>
                            </div>

                            <div class="space-y-4">
                                <div v-for="(field, key) in {
                                    导演: 'user-tie',
                                    主演: 'users',
                                    类型: 'film',
                                    片长: 'clock',
                                    上映日期: 'calendar'
                                }" :key="key"
                                    class="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-300">
                                    <i :class="`fas fa-${field} w-6 text-blue-500 dark:text-blue-400`"></i>
                                    <span class="font-medium min-w-20 text-gray-700 dark:text-gray-300">{{ key
                                        }}：</span>
                                    <span class="ml-2 text-gray-600 dark:text-gray-400">{{
                                        key === '上映日期' ? formatDate(movieInfo?.[key]) : movieInfo?.[key]
                                        }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 剧情简介 -->
                <div class="p-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-film mr-3 text-blue-500"></i>
                        剧情简介
                    </h2>
                    <p
                        class="text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl">
                        {{ movieInfo?.剧情简介 }}
                    </p>
                </div>
            </div>

            <!-- 影评区域 -->
            <div class="mt-12 animate-fadeIn animation-delay-300">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <i class="fas fa-comments mr-3 text-blue-500"></i>
                    影评鉴赏
                </h2>
                <div class="space-y-6">
                    <div v-for="(review, index) in reviews" :key="index" class="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-6 
                               hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5 
                               transition-all duration-300 transform hover:-translate-y-1">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center">
                                <div
                                    class="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 
                                          flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                                    <span class="text-white font-medium text-lg">{{ review.评论者?.charAt(0) }}</span>
                                </div>
                                <div class="ml-4">
                                    <h3
                                        class="font-medium text-gray-900 dark:text-white text-lg group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-300">
                                        {{ review.评论者 }}
                                    </h3>
                                    <div class="flex items-center mt-1">
                                        <div class="flex items-center text-yellow-400">
                                            <i class="fas fa-star mr-1"></i>
                                            <span class="text-sm font-medium">
                                                {{ review.评分?.replace('/10', '') || 'N/A' }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p class="text-gray-600 dark:text-gray-300 leading-relaxed">{{ review.评论内容 }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-fadeIn {
    animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animation-delay-300 {
    animation-delay: 300ms;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.min-w-20 {
    min-width: 5rem;
}

/* 添加滚动条样式 */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

.dark ::-webkit-scrollbar-thumb {
    background: #475569;
}

.dark ::-webkit-scrollbar-thumb:hover {
    background: #64748b;
}
</style>
