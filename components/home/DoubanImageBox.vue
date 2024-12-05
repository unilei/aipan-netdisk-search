<script setup>
import placeHolderImage from "~/assets/placeholder.webp";

defineProps({
  doubanData: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["goDouban"]);

// 图片加载状态管理
const imageLoadStatus = ref({});

// 获取代理图片URL
const getProxyImageUrl = (url) => {
  if (!url) return placeHolderImage;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

// 处理图片加载完成
const handleImageLoad = (movieId) => {
  imageLoadStatus.value[movieId] = "loaded";
};

// 处理图片加载失败
const handleImageError = (movieId, event) => {
  imageLoadStatus.value[movieId] = "error";
  // 尝试重新加载一次
  if (!event.target.dataset.retried) {
    event.target.dataset.retried = "true";
    setTimeout(() => {
      event.target.src = getProxyImageUrl(event.target.dataset.originalSrc);
    }, 1000);
  }
};

// 图片观察器
const imageObserver = ref(null);
const imageRefs = ref({});

// 初始化Intersection Observer
onMounted(() => {
  imageObserver.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const movieId = entry.target.dataset.movieId;
          entry.target.src = getProxyImageUrl(entry.target.dataset.originalSrc);
          imageObserver.value.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "50px 0px",
      threshold: 0.01,
    }
  );
});

onUnmounted(() => {
  if (imageObserver.value) {
    imageObserver.value.disconnect();
  }
});

// 设置图片引用并开始观察
const setImageRef = (el, movieId, originalSrc) => {
  if (el && imageObserver.value) {
    imageRefs.value[movieId] = el;
    el.dataset.movieId = movieId;
    el.dataset.originalSrc = originalSrc;
    imageObserver.value.observe(el);
  }
};

const colorMode = useColorMode();

const goDouban = (movie) => {
  emit("goDouban", movie);
};
</script>

<template>
  <div
    v-for="(item, i) in doubanData"
    :key="i"
    class="mx-5 xl:max-w-[1200px] xl:mx-auto my-10"
  >
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
      <span
        class="hover:text-blue-500 transition-colors duration-300 cursor-pointer"
        >{{ item.name }}</span
      >
      <span class="ml-2 text-xs text-gray-400 dark:text-gray-500"
        >{{ item.data.length }} 部</span
      >
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
            :ref="(el) => setImageRef(el, `${item.name}-${index}`, movie.cover)"
            :src="placeHolderImage"
            class="w-full h-[180px] lg:h-[220px] xl:h-44 object-cover transition-all duration-300 group-hover:scale-105"
            :class="{
              'opacity-0': !imageLoadStatus[`${item.name}-${index}`],
              'opacity-100 blur-0':
                imageLoadStatus[`${item.name}-${index}`] === 'loaded',
              'blur-sm': imageLoadStatus[`${item.name}-${index}`] === 'loading',
            }"
            loading="lazy"
            decoding="async"
            @load="handleImageLoad(`${item.name}-${index}`)"
            @error="handleImageError(`${item.name}-${index}`, $event)"
            :alt="movie.title"
            referrerpolicy="no-referrer"
          />
          <!-- 评分标签 -->
          <div
            v-if="
              movie.rate &&
              imageLoadStatus[`${item.name}-${index}`] === 'loaded'
            "
            class="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/50 backdrop-blur rounded-md transform transition-all duration-300 group-hover:scale-110 group-hover:bg-black/70"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-3 h-3 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
            <span class="text-white text-xs font-medium">{{ movie.rate }}</span>
          </div>
          <!-- 加载失败显示 -->
          <div
            v-if="imageLoadStatus[`${item.name}-${index}`] === 'error'"
            class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700"
          >
            <div class="text-center p-3">
              <el-icon class="text-gray-400 mb-2" :size="24">
                <PictureFilled />
              </el-icon>
              <p class="text-xs text-gray-500">暂无图片</p>
            </div>
          </div>

          <!-- 悬停遮罩 -->
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <div class="absolute bottom-0 left-0 right-0 p-3">
              <p class="text-white text-sm font-medium mb-1 line-clamp-2">
                {{ movie.title }}
              </p>
              <div class="flex items-center gap-2">
                <span
                  v-if="movie.rate"
                  class="flex items-center gap-1 text-yellow-400 text-xs font-bold"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-3 h-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                  </svg>
                  {{ movie.rate }}
                </span>
                <span class="text-gray-300 text-xs">{{ movie.year }}</span>
              </div>
            </div>
          </div>

          <!-- 悬停遮罩 -->
        </div>

        <div class="p-2">
          <p
            class="text-sm text-center truncate dark:text-gray-100 font-medium group-hover:text-blue-500 transition-colors duration-300"
          >
            {{ movie.title }}
          </p>
          <p
            class="text-xs text-center text-gray-500 dark:text-gray-400 mt-0.5"
          >
            {{ movie.year }}
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
