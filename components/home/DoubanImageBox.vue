<script setup>
defineProps({
    doubanData: {
        type: Array,
        default: () => []
    }
})
const emit = defineEmits(['goDouban'])
// 图片代理服务配置
const imageProxies = [
    (url) => `/api/proxy-image?url=${encodeURIComponent(url)}`,
    (url) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=300&h=400&fit=cover&q=70&default=https://images.weserv.nl/?url=${encodeURIComponent('/placeholder.jpg')}`,
]

// 图片加载状态管理
const imageLoadStatus = ref({})
const proxyIndex = ref({}) // 记录每个图片当前使用的代理服务索引

// 处理图片加载完成
const handleImageLoad = (movieId) => {
    imageLoadStatus.value[movieId] = 'loaded'
}

// 处理图片加载失败
const handleImageError = (movieId, imgUrl) => {
    // 如果当前代理索引未初始化，设置为0
    if (typeof proxyIndex.value[movieId] === 'undefined') {
        proxyIndex.value[movieId] = 0
    }

    // 如果还有下一个代理可以尝试
    if (proxyIndex.value[movieId] < imageProxies.length - 1) {
        proxyIndex.value[movieId]++
        // 强制重新渲染图片
        imageLoadStatus.value[movieId] = 'loading'
    } else {
        // 所有代理都尝试失败了
        imageLoadStatus.value[movieId] = 'error'
        // 重置代理索引，以便下次重试从第一个开始
        proxyIndex.value[movieId] = 0
    }
}

// 获取优化后的图片URL
const getOptimizedImageUrl = (url) => {
    if (!url) return '/placeholder.jpg'
    const movieId = url // 使用URL作为唯一标识
    // 如果代理索引未初始化，设置为0
    if (typeof proxyIndex.value[movieId] === 'undefined') {
        proxyIndex.value[movieId] = 0
    }
    return imageProxies[proxyIndex.value[movieId]](url)
}

// 获取高质量图片URL
const getHighQualityImageUrl = (url) => {
    if (!url) return '/placeholder.jpg'
    const movieId = url
    if (!proxyIndex.value[movieId]) {
        proxyIndex.value[movieId] = 0
    }
    return imageProxies[proxyIndex.value[movieId]](url)
}

 
const colorMode = useColorMode()

const goDouban = (movie) => { 
    emit('goDouban', movie)
}
 
</script>

<template>
    <div class="mx-5 xl:max-w-[1200px] xl:mx-auto my-10" v-for="(item, i) in doubanData" :key="i">
        <h1 class="flex flex-row items-center text-sm sm:text-base text-gray-700 font-bold dark:text-white mt-[20px] mb-4 group">
            <div class="flex gap-1 mr-2">
                <span class="w-1 h-5 bg-blue-400 rounded-full group-hover:h-6 transition-all duration-300"></span>
                <span class="w-1 h-5 bg-green-400 rounded-full group-hover:h-4 transition-all duration-300 delay-75"></span>
                <span class="w-1 h-5 bg-red-400 rounded-full group-hover:h-6 transition-all duration-300 delay-150"></span>
            </div>
            <span class="hover:text-blue-500 transition-colors duration-300 cursor-pointer">{{ item.name }}</span>
            <span class="ml-2 text-xs text-gray-400 dark:text-gray-500">{{ item.data.length }} 部</span>
        </h1>

        <div class="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-8 gap-4 mt-[10px]">
            <div v-for="(movie, index) in item.data" :key="index" @click="goDouban(movie)" 
                class="group cursor-pointer bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-md 
                hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div class="relative overflow-hidden bg-gray-100 dark:bg-gray-600">
                    <!-- 加载占位 -->
                    <div v-if="!imageLoadStatus[`${item.name}-${index}`]"
                        class="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-600">
                        <div class="flex items-center justify-center h-full">
                            <el-icon class="animate-spin text-gray-400" :size="24">
                                <Loading />
                            </el-icon>
                        </div>
                    </div>

                    <!-- 高质量图片 -->
                    <img :src="getOptimizedImageUrl(movie.cover)"
                        class="w-full h-[180px] lg:h-[220px] xl:h-44 object-cover transition-all duration-300 group-hover:scale-105"
                        :class="{
                            'opacity-0': !imageLoadStatus[`${item.name}-${index}`],
                            'opacity-100': imageLoadStatus[`${item.name}-${index}`] === 'loaded'
                        }" 
                        loading="lazy" 
                        decoding="async" 
                        @load="handleImageLoad(`${item.name}-${index}`)"
                        @error="handleImageError(`${item.name}-${index}`, movie.cover)" 
                        :alt="movie.title"
                        referrerpolicy="no-referrer" />

                    <!-- 加载失败显示 -->
                    <div v-if="imageLoadStatus[`${item.name}-${index}`] === 'error'"
                        class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                        <div class="text-center p-3">
                            <el-icon class="text-gray-400 mb-2" :size="24">
                                <PictureFilled />
                            </el-icon>
                            <p class="text-xs text-gray-500">加载失败</p>
                        </div>
                    </div>

                    <!-- 悬停遮罩 -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div class="absolute bottom-0 left-0 right-0 p-3">
                            <p class="text-white text-sm font-medium mb-1">{{ movie.title }}</p>
                            <div class="flex items-center gap-2">
                                <span class="text-yellow-400 text-xs font-bold">{{ movie.rate }}</span>
                                <span class="text-gray-200 text-xs">{{ movie.year }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="p-2">
                    <p class="text-sm text-center truncate dark:text-gray-100 font-medium group-hover:text-blue-500 transition-colors duration-300">
                        {{ movie.title }}
                        <span class="text-yellow-500 ml-1 font-bold">{{ movie.rate }}</span>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-fadeIn {
    animation: fadeIn 0.8s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
 
@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
    }

    70% {
        box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
}
</style>