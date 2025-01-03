<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useColorMode } from "@vueuse/core";
import placeHolderImage from "~/assets/placeholder.webp";

defineProps({
  doubanData: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["goDouban"]);
// Add cookie for tab persistence
const activeTabCookie = useCookie("douban_active_tab", {
  maxAge: 60 * 60 * 24 * 7, // 7 days
});
const activeTab = ref(parseInt(activeTabCookie.value) || 0);

// Watch for tab changes and update cookie
watch(activeTab, (newValue) => {
  activeTabCookie.value = newValue.toString();
});

const imageLoadStatus = ref({});
const loadedImages = ref(new Set());
const imageCache = ref(new Map());

const getProxyImageUrl = (url) => {
  if (!url) return placeHolderImage;
  const cacheKey = url;
  if (imageCache.value.has(cacheKey)) {
    return imageCache.value.get(cacheKey);
  }
  const proxyUrl = `//wsrv.nl/?url=${encodeURIComponent(url)}`;
  const fallbackUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
  imageCache.value.set(cacheKey, proxyUrl);
  return proxyUrl;
};

const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = reject;
    img.src = url;
  });
};

const handleImageLoad = (movieId) => {
  imageLoadStatus.value[movieId] = "loaded";
  loadedImages.value.add(movieId);
};

const handleImageError = (movieId, event) => {
  imageLoadStatus.value[movieId] = "error";
  if (!event.target.dataset.retried) {
    event.target.dataset.retried = "true";
    const originalSrc = event.target.dataset.originalSrc;
    setTimeout(async () => {
      try {
        const proxyUrl = getProxyImageUrl(originalSrc);
        await preloadImage(proxyUrl);
        if (event.target) {
          event.target.src = proxyUrl;
        }
      } catch (error) {
        console.error("Image reload failed:", error);
      }
    }, 1000);
  }
};

const imageObserver = ref(null);
const imageRefs = ref({});

onMounted(() => {
  imageObserver.value = new IntersectionObserver(
    (entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          const movieId = entry.target.dataset.movieId;
          const originalSrc = entry.target.dataset.originalSrc;

          if (!loadedImages.value.has(movieId)) {
            try {
              const proxyUrl = getProxyImageUrl(originalSrc);
              await preloadImage(proxyUrl);
              if (entry.target) {
                entry.target.src = proxyUrl;
              }
            } catch (error) {
              console.error("Image load failed:", error);
              handleImageError(movieId, { target: entry.target });
            }
          } else {
            entry.target.src = getProxyImageUrl(originalSrc);
          }
          imageObserver.value.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "200px 0px",
      threshold: 0.01,
    }
  );
});

onUnmounted(() => {
  if (imageObserver.value) {
    imageObserver.value.disconnect();
  }
  imageCache.value.clear();
  loadedImages.value.clear();
  imageRefs.value = {};
});

const setImageRef = (el, movieId, originalSrc) => {
  if (el && imageObserver.value) {
    imageRefs.value[movieId] = el;
    el.dataset.movieId = movieId;
    el.dataset.originalSrc = originalSrc;

    if (loadedImages.value.has(movieId)) {
      el.src = getProxyImageUrl(originalSrc);
    } else {
      el.src = placeHolderImage;
      imageObserver.value.observe(el);
    }
  }
};

const colorMode = useColorMode();

const goDouban = (movie) => {
  emit("goDouban", movie);
};
</script>

<template>
  <div class="mx-5 xl:max-w-[1200px] xl:mx-auto my-10">
    <!-- Enhanced Custom Tabs -->
    <div class="relative mb-6">
      <div class="flex items-center justify-center gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide">
        <button v-for="(item, index) in doubanData" :key="index"
          class="relative px-5 py-2 text-sm font-medium transition-all duration-300 whitespace-nowrap rounded-full border group"
          :class="[
            activeTab === index
              ? 'text-white border-transparent bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
              : 'text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/10 dark:hover:to-purple-900/10'
          ]" @click="activeTab = index">
          <span class="relative z-10 flex items-center gap-2">
            {{ item.name }}
            <span class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full" :class="[
              activeTab === index
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-400'
            ]">
              {{ item.data.length }}
            </span>
          </span>
        </button>
      </div>
    </div>

    <!-- Tab Content with Animation -->
    <div class="relative">
      <div v-for="(item, i) in doubanData" :key="i" class="transition-all duration-500 transform" :class="[
        activeTab === i
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
      ]">
        <div class="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-[10px]">
          <div v-for="(movie, index) in item.data" :key="index"
            class="group cursor-pointer bg-white dark:bg-gray-700 rounded-md overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            @click="goDouban(movie)">
            <div class="relative overflow-hidden bg-gray-100 dark:bg-gray-600">
              <div v-if="!imageLoadStatus[`${item.name}-${index}`]"
                class="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-600">
                <div class="flex items-center justify-center h-full">
                  <svg class="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                </div>
              </div>

              <img :ref="(el) => setImageRef(el, `${item.name}-${index}`, movie.cover)" :src="placeHolderImage"
                class="w-full aspect-[270/405] object-cover transition-all duration-300 group-hover:scale-105" :class="{
                  'opacity-0': !imageLoadStatus[`${item.name}-${index}`],
                  'opacity-100 blur-0':
                    imageLoadStatus[`${item.name}-${index}`] === 'loaded',
                  'blur-sm': imageLoadStatus[`${item.name}-${index}`] === 'loading',
                }" loading="lazy" decoding="async" @load="handleImageLoad(`${item.name}-${index}`)"
                @error="handleImageError(`${item.name}-${index}`, $event)" :alt="movie.title"
                referrerpolicy="no-referrer" />
              <div v-if="imageLoadStatus[`${item.name}-${index}`] === 'error'"
                class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <div class="text-center p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mx-auto text-gray-400 mb-2" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p class="text-xs text-gray-500">暂无图片</p>
                </div>
              </div>

              <div
                class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div class="absolute bottom-0 left-0 right-0 p-3">
                  <p class="text-white text-sm font-medium mb-1 line-clamp-2">
                    {{ movie.title }}
                  </p>
                  <div class="flex items-center gap-2">
                    <span v-if="movie.rate" class="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {{ movie.rate }}
                    </span>
                    <span class="text-gray-300 text-xs">{{ movie.year }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-2">
              <p
                class="text-sm text-center truncate dark:text-gray-100 group-hover:text-indigo-500 transition-colors duration-300">
                {{ movie.title }}
              </p>
              <p class="text-xs text-center text-gray-500 dark:text-gray-400 mt-0.5">
                {{ movie.year }}
              </p>
            </div>
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

/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-hide {
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */
}

/* Add new animation for tab transitions */
.tab-enter-active,
.tab-leave-active {
  transition: all 0.3s ease;
}

.tab-enter-from,
.tab-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.tab-enter-to,
.tab-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
