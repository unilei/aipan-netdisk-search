<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import placeHolderImage from '~/assets/placeholder.webp'

const props = defineProps({
  drama: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['select'])

const handleSelect = () => {
  emit('select', props.drama)
}

// Image proxy and lazy loading logic
const imageLoadStatus = ref('loading')
const loadedImages = ref(new Set())
const imageCache = ref(new Map())
const imageObserver = ref(null)
const imageRef = ref(null)

const getProxyImageUrl = (url) => {
  if (!url) return placeHolderImage
  const cacheKey = url
  if (imageCache.value.has(cacheKey)) {
    return imageCache.value.get(cacheKey)
  }
  const proxyUrl = `//wsrv.nl/?url=${encodeURIComponent(url)}`
  imageCache.value.set(cacheKey, proxyUrl)
  return proxyUrl
}

const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(url)
    img.onerror = reject
    img.src = url
  })
}

const handleImageLoad = () => {
  imageLoadStatus.value = 'loaded'
  loadedImages.value.add(props.drama.id || props.drama.name)
}

const handleImageError = (event) => {
  imageLoadStatus.value = 'error'
  if (!event.target.dataset.retried) {
    event.target.dataset.retried = 'true'
    const originalSrc = event.target.dataset.originalSrc
    setTimeout(async () => {
      try {
        const proxyUrl = getProxyImageUrl(originalSrc)
        await preloadImage(proxyUrl)
        if (event.target) {
          event.target.src = proxyUrl
        }
      } catch (error) {
        console.error('Image reload failed:', error)
        imageLoadStatus.value = 'error'
      }
    }, 1000)
  }
}

const setImageRef = (el) => {
  if (el && imageObserver.value) {
    imageRef.value = el
    const dramaId = props.drama.id || props.drama.name
    const originalSrc = props.drama.pic
    
    el.dataset.dramaId = dramaId
    el.dataset.originalSrc = originalSrc

    if (loadedImages.value.has(dramaId)) {
      el.src = getProxyImageUrl(originalSrc)
    } else {
      el.src = placeHolderImage
      imageObserver.value.observe(el)
    }
  }
}

onMounted(() => {
  imageObserver.value = new IntersectionObserver(
    (entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          const dramaId = entry.target.dataset.dramaId
          const originalSrc = entry.target.dataset.originalSrc

          if (!loadedImages.value.has(dramaId)) {
            try {
              const proxyUrl = getProxyImageUrl(originalSrc)
              await preloadImage(proxyUrl)
              if (entry.target) {
                entry.target.src = proxyUrl
                imageLoadStatus.value = 'loaded'
              }
            } catch (error) {
              console.error('Image load failed:', error)
              handleImageError({ target: entry.target })
            }
          } else {
            entry.target.src = getProxyImageUrl(originalSrc)
          }
          imageObserver.value.unobserve(entry.target)
        }
      })
    },
    {
      rootMargin: '200px 0px',
      threshold: 0.01,
    }
  )
})

onUnmounted(() => {
  if (imageObserver.value) {
    imageObserver.value.disconnect()
  }
  imageCache.value.clear()
  loadedImages.value.clear()
})

</script>

<template>
  <div
    class="drama-card relative bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden border border-stone-200/50 dark:border-slate-600/50"
    @click="handleSelect">
    <!-- 封面图片 -->
    <div class="relative aspect-[9/14] overflow-hidden">
      <!-- 加载状态 -->
      <div v-if="imageLoadStatus === 'loading'"
        class="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
        <div class="flex items-center justify-center h-full">
          <i class="fas fa-spinner fa-spin text-gray-400 text-2xl"></i>
        </div>
      </div>

      <img :ref="setImageRef" :src="placeHolderImage" :alt="drama.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
        :class="{
          'opacity-0': imageLoadStatus === 'loading',
          'opacity-100': imageLoadStatus === 'loaded',
          'blur-sm': imageLoadStatus === 'loading'
        }"
        loading="lazy" decoding="async"
        @load="handleImageLoad"
        @error="handleImageError"
        referrerpolicy="no-referrer" />

      <!-- 错误状态 -->
      <div v-if="imageLoadStatus === 'error'"
        class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
        <div class="text-center p-3">
          <i class="fas fa-image text-gray-400 text-2xl mb-2"></i>
          <p class="text-xs text-gray-500">图片加载失败</p>
        </div>
      </div>

      <!-- 播放按钮覆盖层 -->
      <div
        class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
        <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <i class="fas fa-play-circle text-white text-3xl sm:text-4xl"></i>
        </div>
      </div>

      <!-- 类型标签 -->
      <div
        class="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-gradient-to-r from-purple-400 to-purple-600 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shadow-lg">
        {{ drama.remarks || drama.type || '影视' }}
      </div>

      <!-- 评分标签 -->
      <div v-if="drama.score && parseFloat(drama.score) > 0"
        class="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center shadow-lg">
        <i class="fas fa-star mr-1 text-xs"></i>
        {{ drama.score }}
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="p-3 absolute bottom-0 left-0 right-0 bg-black/40 dark:bg-black/50 ">
      <!-- 标题 -->
      <h3
        class="font-semibold text-stone-200 dark:text-stone-100 text-xs sm:text-sm mb-1.5 sm:mb-2 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight">
        {{ drama.name }}
      </h3>
      <!-- 标签 -->
      <div v-if="drama.tags && drama.tags.length > 0" class="flex flex-wrap gap-1 mb-2">
        <span v-for="tag in drama.tags.slice(0, 2)" :key="tag"
          class="text-xs bg-stone-100 dark:bg-slate-600 text-stone-600 dark:text-stone-300 px-1.5 py-0.5 rounded">
          {{ tag }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drama-card {
  transform: translateY(0);
  transition: transform 0.2s ease;
  contain: layout style paint;
}

.drama-card:hover {
  transform: translateY(-2px);
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .drama-card:hover {
    transform: none;
  }

  .drama-card {
    -webkit-tap-highlight-color: transparent;
  }
}

/* 减少动画对性能的影响 */
@media (prefers-reduced-motion: reduce) {

  .drama-card,
  .transition-all,
  .transition-transform,
  .transition-colors,
  .transition-opacity {
    transition: none;
  }
}

/* 图片优化 */
img {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
</style>
