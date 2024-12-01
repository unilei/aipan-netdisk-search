<script setup>
  import placeHolderImage from '~/assets/placeholder.webp'

  defineProps({
    doubanData: {
      type: Array,
      default: () => [],
    },
  })

  const emit = defineEmits(['goDouban'])

  // 图片加载状态管理
  const imageLoadStatus = ref({})

  // 获取代理图片URL
  const getProxyImageUrl = url => {
    if (!url) return placeHolderImage
    return `/api/image-proxy?url=${encodeURIComponent(url)}`
  }

  // 处理图片加载完成
  const handleImageLoad = movieId => {
    imageLoadStatus.value[movieId] = 'loaded'
  }

  // 处理图片加载失败
  const handleImageError = (movieId, event) => {
    imageLoadStatus.value[movieId] = 'error'
    event.target.src = placeHolderImage
  }

  const goDouban = movie => {
    emit('goDouban', movie)
  }
</script>

<template>
  <div v-for="(item, i) in doubanData" :key="i" class="mx-5 xl:max-w-[1200px] xl:mx-auto my-10">
    <h1
      class="flex flex-row items-center text-sm sm:text-base text-gray-700 font-bold dark:text-white mt-[20px] mb-4 group"
    >
      <div class="flex gap-1 mr-2">
        <span
          class="w-1 h-5 bg-blue-400 rounded-full group-hover:h-6 transition-all duration-300"
        ></span>
        <span
          class="w-1 h-5 bg-green-400 rounded-full group-hover:h-4 transition-all duration-300 delay-75"
        ></span>
        <span
          class="w-1 h-5 bg-red-400 rounded-full group-hover:h-6 transition-all duration-300 delay-150"
        ></span>
      </div>
      <span class="hover:text-blue-500 transition-colors duration-300 cursor-pointer">{{
        item.name
      }}</span>
      <span class="ml-2 text-xs text-gray-400 dark:text-gray-500">{{ item.data.length }} 部</span>
    </h1>

    <div
      class="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-8 gap-4 mt-[10px]"
    >
      <div
        v-for="(movie, index) in item.data"
        :key="index"
        class="group cursor-pointer bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        @click="goDouban(movie)"
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

          <!-- 图片 -->
          <img
            :src="getProxyImageUrl(movie.cover)"
            :alt="movie.title"
            loading="lazy"
            class="w-full aspect-[3/4] object-cover transition-opacity duration-300"
            :class="{
              'opacity-0': !imageLoadStatus[`${item.name}-${index}`],
              'opacity-100': imageLoadStatus[`${item.name}-${index}`] === 'loaded',
            }"
            @load="handleImageLoad(`${item.name}-${index}`)"
            @error="handleImageError(`${item.name}-${index}`, $event)"
          />
        </div>

        <div class="p-2">
          <h3
            class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-500 transition-colors duration-300"
          >
            {{ movie.title }}
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ movie.year }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
