<script setup>
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

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  try {
    const date = new Date(timeStr)
    return date.toLocaleDateString('zh-CN')
  } catch {
    return timeStr
  }
}
</script>

<template>
  <div
    class="drama-card bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
    @click="handleSelect">
    <!-- 封面图片 -->
    <div class="relative aspect-[3/4] overflow-hidden">
      <img :src="drama.pic || '/placeholder-drama.jpg'" :alt="drama.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"
        @error="$event.target.src = '/placeholder-drama.jpg'" />

      <!-- 播放按钮覆盖层 -->
      <div
        class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
        <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <i class="fas fa-play-circle text-white text-4xl"></i>
        </div>
      </div>

      <!-- 类型标签 -->
      <div class="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
        {{ drama.remarks || drama.type || '影视' }}
      </div>

      <!-- 评分标签 -->
      <div v-if="drama.score && parseFloat(drama.score) > 0"
        class="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
        <i class="fas fa-star mr-1"></i>
        {{ drama.score }}
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="p-4">
      <!-- 标题 -->
      <h3
        class="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
        {{ drama.name }}
      </h3>

      <!-- 演员信息 -->
      <div v-if="drama.actor" class="text-xs text-gray-600 dark:text-gray-400 mb-1 line-clamp-1">
        <i class="fas fa-user mr-1"></i>
        {{ drama.actor }}
      </div>

      <!-- 标签 -->
      <div v-if="drama.tags && drama.tags.length > 0" class="flex flex-wrap gap-1 mb-2">
        <span v-for="tag in drama.tags.slice(0, 2)" :key="tag"
          class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
          {{ tag }}
        </span>
      </div>

      <!-- 底部信息 -->
      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{{ drama.year || drama.type }}</span>
        <span>{{ formatTime(drama.time) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drama-card {
  transform: translateY(0);
  transition: transform 0.2s ease;
}

.drama-card:hover {
  transform: translateY(-4px);
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
</style>
