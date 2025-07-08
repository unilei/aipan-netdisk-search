<script setup>
import DramaCard from '~/components/drama/DramaCard.vue'
import DramaPlayer from '~/components/drama/DramaPlayer.vue'

// SEO配置
useHead({
  title: '短剧大全 - AIPAN.ME',
  meta: [
    { name: 'description', content: '免费观看最新热门短剧，海量短剧资源在线播放，支持多集连播' },
    { name: 'keywords', content: '短剧,免费短剧,在线观看,短剧大全,热门短剧' }
  ]
})

definePageMeta({
  layout: 'custom'
})

// 响应式数据
const dramaList = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)
const selectedCategory = ref(null)

// 播放器状态
const showPlayer = ref(false)
const selectedDrama = ref(null)
const dramaDetail = ref(null)

// 分类数据
const categories = ref([
  { id: null, name: '全部', icon: 'fas fa-th-large' },
  { id: 1, name: '都市', icon: 'fas fa-city' },
  { id: 2, name: '古装', icon: 'fas fa-crown' },
  { id: 3, name: '现代', icon: 'fas fa-clock' },
  { id: 4, name: '言情', icon: 'fas fa-heart' },
  { id: 5, name: '悬疑', icon: 'fas fa-search' },
  { id: 6, name: '喜剧', icon: 'fas fa-laugh' }
])

// 获取短剧列表
const fetchDramaList = async (page = 1, keyword = '', categoryId = null) => {
  loading.value = true

  try {
    const query = {
      page,
      limit: 24,
      keyword: keyword.trim()
    }

    // 如果有分类ID，添加到查询参数
    if (categoryId) {
      query.type_id = categoryId
    }

    const { data } = await $fetch('/api/drama/list', { query })

    if (page === 1) {
      dramaList.value = data.list
    } else {
      dramaList.value.push(...data.list)
    }

    currentPage.value = data.page
    totalPages.value = data.pagecount
    total.value = data.total

  } catch (error) {
    console.error('获取短剧列表失败:', error)
    ElMessage.error('获取短剧列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 搜索短剧
const searchDrama = async () => {
  currentPage.value = 1
  await fetchDramaList(1, searchKeyword.value, selectedCategory.value)
}

// 加载更多
const loadMore = async () => {
  if (currentPage.value < totalPages.value && !loading.value) {
    await fetchDramaList(currentPage.value + 1, searchKeyword.value, selectedCategory.value)
  }
}

// 选择短剧播放
const selectDrama = async (drama) => {
  try {
    loading.value = true

    // 获取短剧详情
    const { data } = await $fetch('/api/drama/detail', {
      query: { ids: drama.id }
    })

    if (data && data.episodes && data.episodes.length > 0) {
      selectedDrama.value = drama
      dramaDetail.value = data
      showPlayer.value = true
    } else {
      ElMessage.warning('该短剧暂无播放源')
    }

  } catch (error) {
    console.error('获取短剧详情失败:', error)
    ElMessage.error('获取短剧详情失败')
  } finally {
    loading.value = false
  }
}

// 关闭播放器
const closePlayer = () => {
  showPlayer.value = false
  selectedDrama.value = null
  dramaDetail.value = null
}

// 选择分类
const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId
  currentPage.value = 1
  fetchDramaList(1, searchKeyword.value, categoryId)
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  currentPage.value = 1
  fetchDramaList(1, '', selectedCategory.value)
}

// 初始化
onMounted(() => {
  fetchDramaList()
})
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">
    <!-- 播放器模态框 -->
    <DramaPlayer v-if="showPlayer && dramaDetail" :drama="dramaDetail" @close="closePlayer" />

    <!-- 左侧固定导航 -->
    <aside
      class="fixed left-0 top-0 w-72 h-full bg-white/80 dark:bg-slate-700/90 backdrop-blur-xl border-r border-stone-200/50 dark:border-slate-600/50 overflow-y-auto z-40 shadow-2xl shadow-amber-500/5 dark:shadow-slate-900/20">
      <div class="p-6">
        <!-- 导航标题 -->
        <div class="mb-6">
          <nuxt-link to="/">
            <h2 class="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2 flex items-center group">
              <div
                class="w-8 h-8 bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-700 dark:to-orange-800 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/30 transition-all duration-300 group-hover:scale-105">
                <i class="fas fa-film text-amber-800 dark:text-amber-100 text-sm"></i>
              </div>
              <span
                class="bg-gradient-to-r from-stone-800 to-stone-600 dark:from-stone-100 dark:to-stone-300 bg-clip-text text-transparent">短剧大全</span>
            </h2>
          </nuxt-link>
          <p class="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">海量短剧资源，免费在线观看</p>
        </div>

        <!-- 搜索框 -->
        <div class="mb-6">
          <div class="relative group">
            <label for="drama-search" class="sr-only">搜索短剧</label>
            <input id="drama-search" v-model="searchKeyword" type="search" placeholder="搜索短剧..." autocomplete="off"
              aria-label="搜索短剧"
              class="w-full px-4 py-3 pl-10 pr-4 text-sm text-stone-700 dark:text-stone-200 bg-white/70 dark:bg-slate-600/70 backdrop-blur-sm border border-stone-300/50 dark:border-slate-500/50 rounded-2xl focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-slate-600 focus:shadow-lg focus:shadow-amber-500/10 placeholder-stone-500 dark:placeholder-stone-400 transition-all duration-300 group-hover:shadow-md"
              @keyup.enter="searchDrama">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none" aria-hidden="true">
              <i
                class="fas fa-search text-stone-400 dark:text-stone-500 text-sm group-focus-within:text-amber-500 transition-colors duration-300"></i>
            </div>
            <!-- 清除搜索 -->
            <div v-if="searchKeyword" class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <button @click="clearSearch"
                class="w-5 h-5 bg-stone-200 dark:bg-slate-500 rounded-full flex items-center justify-center hover:bg-stone-300 dark:hover:bg-slate-400 transition-colors">
                <i class="fas fa-times text-xs text-stone-600 dark:text-stone-300"></i>
              </button>
            </div>
          </div>

          <!-- 搜索按钮 -->
          <button @click="searchDrama" :disabled="loading"
            class="w-full mt-3 px-4 py-3 bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-700 dark:to-orange-700 text-amber-900 dark:text-amber-100 font-medium rounded-xl hover:from-amber-300 hover:to-orange-300 dark:hover:from-amber-600 dark:hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center justify-center">
            <i class="fas fa-search mr-2"></i>
            {{ loading ? '搜索中...' : '搜索短剧' }}
          </button>
        </div>

        <!-- 分类筛选 -->
        <nav class="space-y-1" role="navigation" aria-label="短剧分类">
          <div class="mb-4">
            <p class="text-xs font-semibold text-stone-600 dark:text-stone-400 px-2 uppercase tracking-wider">热门分类</p>
          </div>

          <button v-for="category in categories" :key="category.id" @click="selectCategory(category.id)" :class="[
            'w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none group relative overflow-hidden',
            selectedCategory === category.id
              ? 'bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-700 dark:to-orange-700 text-amber-900 dark:text-amber-100 shadow-lg shadow-amber-500/20'
              : 'text-stone-700 dark:text-stone-300 hover:bg-white/60 dark:hover:bg-slate-600/60 hover:shadow-md backdrop-blur-sm'
          ]">
            <div class="flex items-center justify-between relative z-10">
              <div class="flex items-center">
                <div :class="[
                  'w-6 h-6 rounded-lg flex items-center justify-center mr-3 transition-all duration-300',
                  selectedCategory === category.id
                    ? 'bg-amber-300/50 dark:bg-amber-600/50 shadow-md'
                    : 'bg-stone-300/50 dark:bg-slate-500/50 group-hover:bg-stone-400/50 dark:group-hover:bg-slate-400/50'
                ]">
                  <i :class="category.icon" class="text-xs"></i>
                </div>
                <span class="font-medium text-sm">{{ category.name }}</span>
              </div>
            </div>
          </button>
        </nav>
      </div>
    </aside>

    <!-- 右侧内容区域 -->
    <div class="flex-1 ml-72">
      <!-- 顶部信息栏 -->
      <div
        class="bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl border-b border-stone-200/50 dark:border-slate-600/50 px-6 py-6 sticky top-0 z-30">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1
              class="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2 bg-gradient-to-r from-stone-800 to-stone-600 dark:from-stone-100 dark:to-stone-300 bg-clip-text text-transparent">
              {{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name + '短剧' : '全部短剧'}}
            </h1>
            <p class="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">
              {{ searchKeyword ? `搜索"${searchKeyword}"的结果` : '精选优质短剧资源，免费在线观看' }}
            </p>
          </div>
          <div
            class="bg-gradient-to-br from-amber-100/80 to-orange-100/80 dark:from-slate-600/80 dark:to-slate-700/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-amber-200/50 dark:border-slate-500/50 shadow-lg shadow-amber-500/5">
            <div class="text-center">
              <p class="text-xs text-stone-500 dark:text-stone-400 font-medium mb-1">统计信息</p>
              <div class="flex items-center space-x-3">
                <div class="text-center">
                  <p class="text-base font-bold text-stone-800 dark:text-stone-100">{{ total }}</p>
                  <p class="text-xs text-stone-500 dark:text-stone-400">短剧</p>
                </div>
                <div class="w-px h-6 bg-stone-300 dark:bg-slate-500"></div>
                <div class="text-center">
                  <p class="text-base font-bold text-stone-800 dark:text-stone-100">{{ currentPage }}</p>
                  <p class="text-xs text-stone-500 dark:text-stone-400">页码</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 移动端搜索和分类 -->
        <div class="lg:hidden">
          <!-- 搜索框 -->
          <div class="mb-4">
            <div class="relative">
              <input v-model="searchKeyword" type="search" placeholder="搜索..." autocomplete="off"
                class="w-full px-3 py-2 pl-10 pr-3 text-sm text-stone-700 dark:text-stone-200 bg-white dark:bg-slate-600 border border-stone-300 dark:border-slate-500 rounded-2xl focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 placeholder-stone-500 dark:placeholder-stone-400 transition-colors"
                @keyup.enter="searchDrama">
              <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <i class="fas fa-search text-stone-400 dark:text-stone-500 text-sm"></i>
              </div>
            </div>
          </div>

          <!-- 分类按钮 -->
          <div class="flex flex-wrap gap-2">
            <button v-for="category in categories" :key="category.id" @click="selectCategory(category.id)" :class="[
              'px-3 py-2 rounded-xl text-sm font-medium transition-colors focus:outline-none',
              selectedCategory === category.id
                ? 'bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-100'
                : 'bg-white dark:bg-slate-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-500 border border-stone-300 dark:border-slate-500'
            ]">
              {{ category.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex flex-col justify-center items-center py-20" role="status" aria-live="polite">
        <div
          class="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 dark:border-slate-500 border-t-amber-500 dark:border-t-amber-400"
          aria-hidden="true"></div>
        <span class="sr-only">正在加载短剧数据...</span>
        <p class="text-stone-600 dark:text-stone-400 text-sm mt-4 transition-colors">正在加载短剧数据...</p>
      </div>

      <!-- 短剧内容区域 -->
      <div v-else
        class="p-6 bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-yellow-50/50 dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-900/50 min-h-screen">
        <!-- 短剧网格 -->
        <div v-if="dramaList.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-8"
          role="list">
          <article v-for="drama in dramaList" :key="drama.id" class="drama-card group" role="listitem">
            <DramaCard :drama="drama" @select="selectDrama" />
          </article>
        </div>

        <!-- 加载更多按钮 -->
        <div v-if="!loading && currentPage < totalPages" class="text-center py-8">
          <button @click="loadMore"
            class="px-8 py-4 bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-700 dark:to-orange-700 text-amber-900 dark:text-amber-100 font-medium rounded-xl hover:from-amber-300 hover:to-orange-300 dark:hover:from-amber-600 dark:hover:to-orange-600 transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center justify-center mx-auto">
            <i class="fas fa-plus mr-2"></i>
            加载更多短剧
          </button>
        </div>

        <!-- 没有更多数据 -->
        <div v-if="!loading && dramaList.length > 0 && currentPage >= totalPages" class="text-center py-8">
          <p class="text-stone-500 dark:text-stone-400">已加载全部内容</p>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && dramaList.length === 0" class="text-center py-20">
          <div class="text-stone-400 dark:text-stone-500 mb-4">
            <i class="fas fa-film text-4xl"></i>
          </div>
          <h3 class="text-xl font-medium text-stone-800 dark:text-stone-100 mb-2 transition-colors">
            {{ searchKeyword ? '未找到相关短剧' : '暂无短剧数据' }}
          </h3>
          <p class="text-stone-600 dark:text-stone-400 mb-6 transition-colors">
            {{ searchKeyword ? '尝试使用不同的关键词搜索' : '请稍后再试或联系管理员' }}
          </p>
          <button v-if="searchKeyword || selectedCategory" @click="clearSearch"
            class="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline font-medium transition-colors">
            清除筛选条件
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drama-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  will-change: transform;
}

/* 优化GPU加速 */
.drama-card:hover {
  transform: translateZ(0);
}

/* 文本截断工具类 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 屏幕阅读器专用类 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 响应式调整 */
@media (max-width: 1024px) {

  /* 平板端隐藏左侧导航，改为顶部筛选 */
  aside {
    display: none;
  }

  .flex-1.ml-72 {
    margin-left: 0;
  }
}

@media (max-width: 640px) {
  .drama-card:hover {
    transform: none;
  }

  /* 移动端触摸优化 */
  .drama-card {
    -webkit-tap-highlight-color: transparent;
  }

  /* 移动端网格调整 */
  .grid-cols-1.sm\\:grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-4.xl\\:grid-cols-5.\\32xl\\:grid-cols-6 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 性能优化 */
.drama-card {
  contain: layout style paint;
}

/* 图片优化 */
img {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {

  .drama-card,
  .transition-all {
    transition: none;
  }

  .animate-spin {
    animation: none;
  }
}

/* 优化滚动性能 */
.overflow-y-auto {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}
</style>
