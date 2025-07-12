<script setup>
import DramaPlayer from '~/components/drama/DramaPlayer.vue'

// 获取路由参数
const route = useRoute()
const dramaId = route.params.id

// SEO配置
useHead({
  title: '播放中 - 壳儿 - AIPAN.ME',
  meta: [
    { name: 'description', content: '正在播放影视内容 - 壳儿免费在线观看' },
    { name: 'keywords', content: '壳儿,免费影视,在线播放,影视播放器' }
  ]
})

definePageMeta({
  layout: 'custom'
})

const { selectedVodSource } = useVodSources()
console.log(selectedVodSource.value)

// 响应式数据
const loading = ref(true)
const error = ref(null)
const dramaDetail = ref(null)

// 获取影视详情
const fetchDramaDetail = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await $fetch('/api/drama/detail', {
      method: 'POST',
      body: {
        ids: dramaId,
        source: selectedVodSource.value,
        _t: Date.now()
      }
    })

    console.log(response)

    // 检查响应的code
    if (response.code !== 200) {
      throw new Error(response.msg || '获取影视详情失败')
    }

    const { data } = response

    // 检查返回的数据结构
    if (data) {

      // 检查是否有剧集数据
      if (data.episodes && Array.isArray(data.episodes) && data.episodes.length > 0) {
        dramaDetail.value = data
      } else {
        console.error('影视详情数据结构异常:', data)
        error.value = '该影视暂无播放源'
      }
    } else {
      error.value = '获取影视详情失败'
    }

  } catch (err) {
    console.error('获取影视详情失败:', err)
    error.value = '获取影视详情失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 返回影视列表
const goBack = () => {
  navigateTo('/drama')
}

// 初始化
onMounted(() => {
  if (dramaId) {
    fetchDramaDetail()
  } else {
    error.value = '无效的影视ID'
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-black">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-2 border-stone-300 border-t-amber-500 mx-auto mb-4">
        </div>
        <p class="text-white text-xl font-medium">正在加载影视详情...</p>
        <p class="text-stone-400 text-sm mt-2">请稍候</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-exclamation-triangle text-red-400 text-2xl"></i>
        </div>
        <p class="text-white text-xl font-medium mb-4">{{ error }}</p>
        <button @click="goBack"
          class="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-full hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg shadow-amber-500/20 focus:ring-4 focus:outline-none focus:ring-amber-300">
          <i class="fas fa-arrow-left mr-2"></i>
          返回影视列表
        </button>
      </div>
    </div>

    <!-- 播放器 -->
    <DramaPlayer v-else-if="dramaDetail" :drama="dramaDetail" @close="goBack" />
  </div>
</template>

<style scoped>
/* 确保播放页面全屏显示 */
.min-h-screen {
  min-height: 100vh;
  min-height: 100dvh;
  /* 动态视口高度 */
}

/* 移动端优化 */
@media (max-width: 768px) {
  .min-h-screen {
    min-height: 100vh;
    min-height: 100svh;
    /* 小视口高度 */
  }
}
</style>
