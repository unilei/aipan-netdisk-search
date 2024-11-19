<script setup>
import { useDoubanStore } from "~/stores/douban";
import { badWords } from "~/utils/sensitiveWords";

definePageMeta({
  layout: 'netdisk',
})
const doubanStore = useDoubanStore()
const searchKeyword = ref('')
const router = useRouter()
const doubanCache = useCookie('doubanCache', {
  maxAge: 60 * 60 * 24
})

// 图片加载状态管理
const imageLoadStatus = ref({})

// 处理图片加载完成
const handleImageLoad = (movieId) => {
  imageLoadStatus.value[movieId] = 'loaded'
}

// 处理图片加载失败
const handleImageError = (movieId) => {
  imageLoadStatus.value[movieId] = 'error'
}

// 获取优化后的图片URL
const getOptimizedImageUrl = (url) => {
  if (!url) return '/placeholder.jpg'
  // 使用 weserv.nl 的参数优化图片加载
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=300&h=400&fit=cover&q=70&default=https://images.weserv.nl/?url=${encodeURIComponent('/placeholder.jpg')}`
}

// 获取高质量图片URL
const getHighQualityImageUrl = (url) => {
  if (!url) return '/placeholder.jpg'
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=300&h=400&fit=cover&q=90&default=https://images.weserv.nl/?url=${encodeURIComponent('/placeholder.jpg')}`
}

const search = (keyword) => {
  if (!keyword) return
  if (badWords.includes(keyword)) {
    return alert('请勿输入敏感词')
  }
  router.push({ path: '/search', query: { keyword: encodeURIComponent(keyword) } })
}

const doubanData = ref([])

watch(doubanData, (newValue, oldValue) => {
  doubanData.value = newValue
})

const colorMode = useColorMode()

const goDouban = (movie) => {
  // window.open(movie.url, '_blank')
  router.push({ path: '/search', query: { keyword: encodeURIComponent(movie.title) } })
}

onMounted(async () => {
  if (doubanCache.value === 'aipan.me') {
    doubanData.value = doubanStore.doubanData
  } else {
    await doubanStore.getDoubanData()
    doubanData.value = doubanStore.doubanData
    doubanCache.value = 'aipan.me'
  }
})
</script>

<template>
  <div class="custom-bg min-h-screen py-[60px] transition-colors duration-300">
    <div class="flex flex-col items-center justify-center gap-4 mt-[60px] animate-fadeIn">
      <div class="flex items-center justify-center gap-4 hover:scale-105 transition-transform duration-300">
        <img class="w-24 h-24 rounded-2xl shadow-lg" src="@/assets/my-logo.png" alt="logo">
        <div class="text-center">
          <h1 class="text-4xl text-gray-800 font-bold dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AIPAN.ME</h1>
          <p class="text-gray-600 text-sm dark:text-gray-300 mt-2">爱盼 - 资源随心，娱乐无限</p>
        </div>
      </div>
    </div>
    <div class="max-w-[1240px] mx-auto mt-[30px]">
      <div class="w-[85%] md:w-[700px] mx-auto">
        <div class="relative group">
          <input 
            class="w-full pl-6 pr-[70px] py-4 rounded-full text-sm bg-white dark:bg-gray-700 border-2 border-transparent 
            focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all duration-300 shadow-lg
            dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
            v-model="searchKeyword" 
            placeholder="请输入关键词搜索" 
            @keydown.enter="search(searchKeyword)"
          />
          <button 
            type="button"
            class="search-btn absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full 
            bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
            text-white transition-all duration-300 transform hover:scale-105 active:scale-95
            shadow-lg hover:shadow-blue-500/50 dark:hover:shadow-blue-600/30"
            @click="search(searchKeyword)"
          >
            <el-icon :size="22" class="transition-transform duration-300 group-hover:rotate-12">
              <Search></Search>
            </el-icon>
          </button>
        </div>
      </div>
    </div>
    <div class="h-16"></div>
    <div class="mx-5 xl:max-w-[1200px] xl:mx-auto my-10" v-for="(item, i) in doubanData" :key="i">
      <h1 class="flex flex-row items-center text-sm sm:text-base text-gray-700 font-bold dark:text-white mt-[20px] mb-4">
        <div class="flex gap-1 mr-2">
          <span class="w-1 h-5 bg-blue-400 rounded-full"></span>
          <span class="w-1 h-5 bg-green-400 rounded-full"></span>
          <span class="w-1 h-5 bg-red-400 rounded-full"></span>
        </div>
        <span class="hover:text-blue-500 transition-colors duration-300">{{ item.name }}</span>
      </h1>
      <div class="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-8 gap-4 mt-[10px]">
        <div
          v-for="(movie, index) in item.data" 
          :key="index"
          @click="goDouban(movie)"
          class="group cursor-pointer bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-md 
          hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div class="relative overflow-hidden bg-gray-100 dark:bg-gray-600">
            <!-- 加载占位 -->
            <div 
              v-if="!imageLoadStatus[`${item.name}-${index}`]"
              class="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-600"
            >
              <div class="flex items-center justify-center h-full">
                <el-icon class="animate-spin text-gray-400" :size="24">
                  <Loading />
                </el-icon>
              </div>
            </div>
            
            <!-- 高质量图片 -->
            <img
              :src="getOptimizedImageUrl(movie.cover)"
              class="w-full h-[180px] lg:h-[220px] xl:h-44 object-cover transition-all duration-300 group-hover:scale-110"
              :class="{
                'opacity-0': !imageLoadStatus[`${item.name}-${index}`],
                'opacity-100': imageLoadStatus[`${item.name}-${index}`] === 'loaded'
              }"
              loading="lazy"
              decoding="async"
              @load="handleImageLoad(`${item.name}-${index}`)"
              @error="handleImageError(`${item.name}-${index}`)"
              :alt="item.name"
              referrerpolicy="no-referrer"
            />

            <!-- 加载失败显示 -->
            <div 
              v-if="imageLoadStatus[`${item.name}-${index}`] === 'error'"
              class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700"
            >
              <div class="text-center">
                <el-icon class="text-gray-400 mb-2" :size="24">
                  <PictureFilled />
                </el-icon>
                <p class="text-xs text-gray-500">加载失败</p>
              </div>
            </div>

            <div class="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </div>
          <div class="p-2">
            <p class="text-sm text-center truncate dark:text-gray-100 font-medium group-hover:text-blue-500 transition-colors duration-300">
              {{ movie.title }}
              <span class="text-yellow-500 ml-1">{{ movie.rate }}</span>
            </p>
          </div>
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

:deep(.el-input__wrapper.is-focus) {
  --el-input-focus-border-color: #3b82f6;
}

.custom-bg {
  position: relative;
  background-image: url('@/assets/hero-bg-1.png');
  background-size: 100% auto;
  background-position: top;
  background-repeat: no-repeat;
  background-color: rgba(245, 246, 249, 0.95);
}

.custom-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.95) 100%);
  z-index: -1;
}

:root.dark .custom-bg {
  background-color: rgba(31, 41, 55, 0.97);
}

:root.dark .custom-bg::before {
  background: linear-gradient(180deg, rgba(31, 41, 55, 0) 0%, rgba(31, 41, 55, 0.98) 100%);
}

.search-btn {
  animation: pulse 2s infinite;
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

/* 当输入框获得焦点时，停止按钮动画 */
.el-input__wrapper.is-focus + .search-btn {
  animation: none;
}

/* 图片渐进加载动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>