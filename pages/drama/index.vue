<script setup>
import DramaCard from '~/components/drama/DramaCard.vue'
import DramaSkeleton from '~/components/drama/DramaSkeleton.vue'
import SidebarSkeleton from '~/components/drama/SidebarSkeleton.vue'
import { useUserStore } from '~/stores/user'
import { useVodSources } from '~/composables/useVodSources'

// SEO配置
useHead({
  title: '壳儿 - AIPAN.ME',
  meta: [
    { name: 'description', content: '壳儿 - 免费观看最新热门影视剧集，海量高清资源在线播放，支持多集连播' },
    { name: 'keywords', content: '壳儿,免费影视,在线观看,影视大全,热门剧集,电影电视剧' }
  ]
})

definePageMeta({
  layout: 'custom'
})

// 响应式数据
const dramaList = ref([])
const loading = ref(false)
const initialLoading = ref(true) // 初始化加载状态
const searchKeyword = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)
const selectedCategory = ref(null)

// 分类数据
const categories = ref([])
const categoriesLoading = ref(false)
const expandedCategories = ref(new Set())

// 用户状态
const userStore = useUserStore()

// VOD源管理
const { sources: vodSources, selectedVodSource, loadSources, switchVodSource: switchSource } = useVodSources()

// 获取分类列表
const fetchCategories = async () => {
  categoriesLoading.value = true

  try {
    const response = await $fetch('/api/drama/categories', {
      method: "post",
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: {
        _t: Date.now(),
        source: selectedVodSource.value
      }
    })

    if (response.success) {
      categories.value = response.data
    } else {
      categories.value = []
    }

  } catch (error) {
    console.error('获取分类失败:', error)
    categories.value = [
      { id: null, name: '全部', icon: 'fas fa-th-large', count: 0 },
      { id: 1, name: '电影', icon: 'fas fa-film', count: 0 },
      { id: 2, name: '电视剧', icon: 'fas fa-tv', count: 0 },
      { id: 3, name: '动漫', icon: 'fas fa-dragon', count: 0 },
      { id: 4, name: '综艺', icon: 'fas fa-microphone', count: 0 }
    ]
  } finally {
    categoriesLoading.value = false
  }
}

// 获取影视列表
const fetchDramaList = async (page = 1, keyword = '', category = null) => {
  loading.value = true

  try {

    const bodyParams = {
      source: selectedVodSource.value,
      page,
      limit: 24,
      _t: Date.now()
    }

    if (keyword) {
      bodyParams.keyword = keyword.trim()
    }
    // 如果有分类，添加到查询参数
    if (category) {
      bodyParams.type_id = category
    }

    const { data } = await $fetch('/api/drama/list', {
      method: 'POST',
      body: bodyParams
    })

    if (page === 1) {
      dramaList.value = data.list
    } else {
      dramaList.value.push(...data.list)
    }

    currentPage.value = data.page
    totalPages.value = data.pagecount
    total.value = data.total

  } catch (error) {
    console.error('获取影视列表失败:', error)
    ElMessage.error('获取影视列表失败，请稍后重试')
  } finally {
    loading.value = false
    initialLoading.value = false // 初始化完成
  }
}

// 搜索影视
const searchDrama = () => {
  currentPage.value = 1
  fetchDramaList(1, searchKeyword.value, selectedCategory.value)
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  currentPage.value = 1
  fetchDramaList(1, '', selectedCategory.value)
}

// 加载更多
const loadMore = () => {
  if (currentPage.value < totalPages.value && !loading.value) {
    fetchDramaList(currentPage.value + 1, searchKeyword.value, selectedCategory.value)
  }
}

// 选择影视播放
const selectDrama = async (drama) => {
  try {
    loading.value = true

    const { data } = await $fetch('/api/drama/detail', {
      method: 'POST',
      body: {
        ids: drama.id,
        source: selectedVodSource.value,
        _t: Date.now()
      }
    })

    if (data && data.episodes && data.episodes.length > 0) {
      await navigateTo(`/drama/play/${drama.id}`)
    } else {
      ElMessage.warning('该影视暂无播放源')
    }

  } catch (error) {
    console.error('获取影视详情失败:', error)
    ElMessage.error('获取影视详情失败')
  } finally {
    loading.value = false
  }
}

// 选择分类
const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId
  currentPage.value = 1
  fetchDramaList(1, searchKeyword.value, categoryId)
}

// 切换分类展开状态
const toggleCategory = (categoryId) => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
}

// 切换视频源
const switchVodSource = (sourceKey) => {
  switchSource(sourceKey)
  currentPage.value = 1
  // 重新获取数据
  fetchDramaList(1, searchKeyword.value, selectedCategory.value)
}



// 初始化
onMounted(async () => {
  await loadSources()
  // 如果有选中的视频源，获取数据
  if (selectedVodSource.value) {
    await fetchCategories()
    await fetchDramaList()
  }
})
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">
    <!-- 左侧固定导航 -->
    <aside
      class="fixed left-0 top-0 w-72 h-full bg-white/80 dark:bg-slate-700/90 backdrop-blur-xl border-r border-stone-200/50 dark:border-slate-600/50 overflow-y-auto z-40 shadow-2xl shadow-amber-500/5 dark:shadow-slate-900/20 hidden lg:block">

      <!-- 侧边栏骨架屏 -->
      <SidebarSkeleton v-if="initialLoading" />

      <!-- 侧边栏内容 -->
      <div v-else class="p-6">
        <!-- Logo区域 -->
        <div class="mb-8">
          <div class="flex items-center mb-4">
            <div
              class="w-12 h-12 bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-700 dark:to-orange-800 rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-amber-500/20">
              <i class="fas fa-play text-amber-800 dark:text-amber-100 text-xl"></i>
            </div>
            <div>
              <h1
                class="text-xl font-bold text-stone-800 dark:text-stone-100 bg-gradient-to-r from-stone-800 to-stone-600 dark:from-stone-100 dark:to-stone-300 bg-clip-text text-transparent">
                壳儿
              </h1>
              <p class="text-xs text-stone-500 dark:text-stone-400">免费在线观看</p>
            </div>
          </div>
        </div>

        <!-- 搜索区域 -->
        <div class="mb-8">
          <div class="relative group">
            <input v-model="searchKeyword" type="search" placeholder="搜索影视剧集..." autocomplete="off"
              class="w-full px-4 py-3 pl-10 pr-4 text-sm text-stone-700 dark:text-stone-200 bg-white/70 dark:bg-slate-600/70 backdrop-blur-sm border border-stone-300/50 dark:border-slate-500/50 rounded-2xl focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-slate-600 focus:shadow-lg focus:shadow-amber-500/10 placeholder-stone-500 dark:placeholder-stone-400 transition-all duration-300 group-hover:shadow-md"
              @keyup.enter="searchDrama">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <i
                class="fas fa-search text-stone-400 dark:text-stone-500 text-sm group-focus-within:text-amber-500 transition-colors duration-300"></i>
            </div>
            <div v-if="searchKeyword" class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <button @click="clearSearch"
                class="w-5 h-5 bg-stone-200 dark:bg-slate-500 rounded-full flex items-center justify-center hover:bg-stone-300 dark:hover:bg-slate-400 transition-colors">
                <i class="fas fa-times text-xs text-stone-600 dark:text-stone-300"></i>
              </button>
            </div>
          </div>

          <button @click="searchDrama" :disabled="loading"
            class="w-full mt-3 px-4 py-3 bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-700 dark:to-orange-700 text-amber-900 dark:text-amber-100 font-medium rounded-xl hover:from-amber-300 hover:to-orange-300 dark:hover:from-amber-600 dark:hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center justify-center">
            <i class="fas fa-search mr-2"></i>
            {{ loading ? '搜索中...' : '搜索影视' }}
          </button>
        </div>

        <!-- 视频源选择区域 -->
        <div v-if="vodSources.length > 0" class="mb-8">
          <div class="mb-4">
            <p class="text-xs font-semibold text-stone-600 dark:text-stone-400 px-2 uppercase tracking-wider">视频源</p>
          </div>

          <div class="space-y-2">
            <button v-for="source in vodSources" :key="source.key" @click="switchVodSource(source.key)" :class="[
              'w-full px-4 py-3 text-left rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none group relative overflow-hidden',
              selectedVodSource?.key === source.key
                ? 'bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-700 dark:to-emerald-700 text-green-900 dark:text-green-100 shadow-lg shadow-green-500/20'
                : 'text-stone-700 dark:text-stone-300 hover:bg-white/60 dark:hover:bg-slate-600/60 hover:shadow-md backdrop-blur-sm'
            ]">
              <div class="flex items-center justify-between relative z-10">
                <div class="flex items-center">
                  <div :class="[
                    'w-6 h-6 rounded-lg flex items-center justify-center mr-3 transition-all duration-300',
                    selectedVodSource?.key === source.key
                      ? 'bg-green-300/50 dark:bg-green-600/50 shadow-md'
                      : 'bg-stone-300/50 dark:bg-slate-500/50 group-hover:bg-stone-400/50 dark:group-hover:bg-slate-400/50'
                  ]">
                    <i class="fas fa-video text-xs"></i>
                  </div>
                  <span class="font-medium text-sm">{{ source.name }}</span>
                </div>
                <div v-if="selectedVodSource?.key === source.key" class="flex items-center">
                  <i class="fas fa-check text-green-600 dark:text-green-400 text-sm"></i>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- 影视源配置区域 -->
        <div v-if="!userStore.loggedIn" class="mb-8">
          <div class="mb-4">
            <p class="text-xs font-semibold text-stone-600 dark:text-stone-400 px-2 uppercase tracking-wider">影视源配置</p>
          </div>

          <el-popover placement="right" trigger="hover" :width="320"
            popper-class="backdrop-blur-md bg-white/90 dark:bg-gray-800/90 border border-gray-100/50 dark:border-gray-700/50 rounded-xl shadow-xl">
            <template #reference>
              <button
                class="w-full px-4 py-3 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-700 dark:to-purple-700 text-blue-900 dark:text-blue-100 font-medium rounded-xl hover:from-blue-300 hover:to-purple-300 dark:hover:from-blue-600 dark:hover:to-purple-600 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center justify-center group">
                <i class="fas fa-cog mr-2 group-hover:rotate-45 transition-transform duration-300"></i>
                配置影视源
              </button>
            </template>
            <div class="p-3">
              <div class="flex items-start gap-3">
                <div class="text-blue-500 mt-1">
                  <i class="fas fa-info-circle text-xl"></i>
                </div>
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    登录以保存影视源配置
                  </h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    登录后可以将您的影视源配置保存到云端，在任何设备上使用相同的影视源。
                  </p>
                  <div class="flex gap-2">
                    <el-button type="primary" @click="navigateTo('/login')" size="small" class="!rounded-lg">
                      <i class="fas fa-sign-in-alt mr-1"></i> 登录
                    </el-button>
                    <el-button @click="navigateTo('/user/vod-settings')" size="small" class="!rounded-lg">
                      <i class="fas fa-cog mr-1"></i> 管理配置
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-popover>
        </div>

        <!-- 分类筛选 -->
        <nav class="space-y-1">
          <div class="mb-4">
            <p class="text-xs font-semibold text-stone-600 dark:text-stone-400 px-2 uppercase tracking-wider">影视分类</p>
          </div>

          <div v-if="categoriesLoading" class="space-y-2">
            <div v-for="i in 6" :key="i"
              class="px-4 py-3 bg-stone-200/50 dark:bg-slate-600/50 rounded-xl animate-pulse">
              <div class="flex items-center">
                <div class="w-6 h-6 bg-stone-300/50 dark:bg-slate-500/50 rounded-lg mr-3"></div>
                <div class="h-4 bg-stone-300/50 dark:bg-slate-500/50 rounded w-16"></div>
              </div>
            </div>
          </div>

          <template v-else>
            <div v-for="category in categories" :key="category.id" class="category-item">
              <!-- 主分类 -->
              <div class="flex items-center">
                <!-- 展开/收起按钮 -->
                <button v-if="category.children && category.children.length > 0" @click="toggleCategory(category.id)"
                  class="w-6 h-6 flex items-center justify-center mr-2 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
                  <i :class="expandedCategories.has(category.id) ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"
                    class="text-xs"></i>
                </button>
                <div v-else class="w-6 mr-2"></div>

                <!-- 分类按钮 -->
                <button @click="selectCategory(category.id)" :class="[
                  'flex-1 text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none group relative overflow-hidden',
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
                    <span v-if="category.count > 0"
                      class="text-xs text-stone-500 dark:text-stone-400 bg-stone-200/50 dark:bg-slate-600/50 px-2 py-1 rounded-full">
                      {{ category.count }}
                    </span>
                  </div>
                </button>
              </div>

              <!-- 子分类 -->
              <div v-if="category.children && category.children.length > 0 && expandedCategories.has(category.id)"
                class="ml-8 mt-1 space-y-1">
                <button v-for="child in category.children" :key="child.id" @click="selectCategory(child.id)" :class="[
                  'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 focus:outline-none group relative overflow-hidden',
                  selectedCategory === child.id
                    ? 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-800 dark:to-orange-800 text-amber-800 dark:text-amber-200 shadow-md shadow-amber-500/10'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-white/40 dark:hover:bg-slate-600/40 hover:shadow-sm backdrop-blur-sm'
                ]">
                  <div class="flex items-center justify-between relative z-10">
                    <div class="flex items-center">
                      <div :class="[
                        'w-5 h-5 rounded-md flex items-center justify-center mr-2 transition-all duration-300',
                        selectedCategory === child.id
                          ? 'bg-amber-200/50 dark:bg-amber-700/50 shadow-sm'
                          : 'bg-stone-200/50 dark:bg-slate-600/50 group-hover:bg-stone-300/50 dark:group-hover:bg-slate-500/50'
                      ]">
                        <i :class="child.icon" class="text-xs"></i>
                      </div>
                      <span class="font-medium text-sm">{{ child.name }}</span>
                    </div>
                    <span v-if="child.count > 0"
                      class="text-xs text-stone-400 dark:text-stone-500 bg-stone-100/50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded-full">
                      {{ child.count }}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </template>
        </nav>
      </div>
    </aside>

    <!-- 右侧内容区域 -->
    <div class="flex-1 lg:ml-72">
      <!-- 顶部信息栏 -->
      <div
        class="bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl border-b border-stone-200/50 dark:border-slate-600/50 px-4 sm:px-6 py-4 sm:py-6 sticky top-0 z-30">

        <!-- 初始化骨架屏 -->
        <div v-if="initialLoading" class="animate-pulse">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
            <div class="flex-1">
              <div class="h-6 bg-stone-300 dark:bg-slate-600 rounded w-32 mb-2"></div>
              <div class="h-4 bg-stone-200 dark:bg-slate-700 rounded w-48"></div>
            </div>
            <div class="w-full sm:w-auto">
              <div class="h-20 bg-stone-200 dark:bg-slate-600 rounded-xl w-full sm:w-40"></div>
            </div>
          </div>
        </div>

        <!-- 正常内容 -->
        <div v-else class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div class="flex-1">
            <h1
              class="text-lg sm:text-xl font-bold text-stone-800 dark:text-stone-100 mb-2 bg-gradient-to-r from-stone-800 to-stone-600 dark:from-stone-100 dark:to-stone-300 bg-clip-text text-transparent">
              {{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : '壳儿'}}
            </h1>
            <p class="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">
              {{ searchKeyword ? `搜索"${searchKeyword}"的结果` : '精选优质影视资源，免费在线观看' }}
            </p>
          </div>
          <div
            class="bg-gradient-to-br from-amber-100/80 to-orange-100/80 dark:from-slate-600/80 dark:to-slate-700/80 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-amber-200/50 dark:border-slate-500/50 shadow-lg shadow-amber-500/5 w-full sm:w-auto">
            <div class="text-center">
              <p class="text-xs text-stone-500 dark:text-stone-400 font-medium mb-1">统计信息</p>
              <div class="flex items-center justify-center space-x-3">
                <div class="text-center">
                  <p class="text-sm sm:text-base font-bold text-stone-800 dark:text-stone-100">{{ total }}</p>
                  <p class="text-xs text-stone-500 dark:text-stone-400">影视</p>
                </div>
                <div class="w-px h-6 bg-stone-300 dark:bg-slate-500"></div>
                <div class="text-center">
                  <p class="text-sm sm:text-base font-bold text-stone-800 dark:text-stone-100">{{ currentPage }}</p>
                  <p class="text-xs text-stone-500 dark:text-stone-400">页码</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 移动端搜索和分类 -->
        <div class="lg:hidden">
          <!-- 移动端骨架屏 -->
          <div v-if="initialLoading" class="animate-pulse">
            <div class="mb-4">
              <div class="h-10 bg-stone-200 dark:bg-slate-600 rounded-2xl"></div>
            </div>
            <div class="flex flex-wrap gap-2">
              <div v-for="i in 6" :key="i" class="h-8 w-16 bg-stone-200 dark:bg-slate-600 rounded-xl"></div>
            </div>
          </div>

          <!-- 移动端正常内容 -->
          <div v-else>
            <div class="mb-4">
              <div class="relative">
                <input v-model="searchKeyword" type="search" placeholder="搜索..." autocomplete="off"
                  class="w-full px-3 py-2 pl-10 pr-3 text-sm text-stone-700 dark:text-stone-200 bg-white dark:bg-slate-600 border border-stone-300 dark:border-slate-500 rounded-2xl focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 placeholder-stone-500 dark:placeholder-stone-400 transition-colors"
                  @keyup.enter="searchDrama">
                <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <i class="fas fa-search text-stone-400 dark:text-stone-500 text-sm"></i>
                </div>
                <div v-if="searchKeyword" class="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <button @click="clearSearch"
                    class="w-5 h-5 bg-stone-200 dark:bg-slate-500 rounded-full flex items-center justify-center hover:bg-stone-300 dark:hover:bg-slate-400 transition-colors">
                    <i class="fas fa-times text-xs text-stone-600 dark:text-stone-300"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <div v-if="categoriesLoading" class="flex flex-wrap gap-2">
                <div v-for="i in 6" :key="i" class="px-3 py-2 bg-stone-200 dark:bg-slate-600 rounded-xl animate-pulse">
                  <div class="h-4 w-12 bg-stone-300 dark:bg-slate-500 rounded"></div>
                </div>
              </div>

              <button v-else v-for="category in categories" :key="category.id" @click="selectCategory(category.id)"
                :class="[
                  'px-3 py-2 rounded-xl text-sm font-medium transition-colors focus:outline-none flex items-center gap-2',
                  selectedCategory === category.id
                    ? 'bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-100'
                    : 'bg-white dark:bg-slate-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-500 border border-stone-300 dark:border-slate-500'
                ]">
                <i :class="category.icon" class="text-xs"></i>
                <span>{{ category.name }}</span>
                <span v-if="category.count > 0"
                  class="text-xs opacity-60 bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-full">
                  {{ category.count }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 影视内容区域 -->
      <div
        class="p-4 sm:p-6 bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-yellow-50/50 dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-900/50 min-h-screen">

        <!-- 初始化骨架屏 -->
        <div v-if="initialLoading">
          <DramaSkeleton :count="24" />
        </div>

        <!-- 加载状态 -->
        <div v-else-if="loading && dramaList.length === 0" class="flex flex-col justify-center items-center py-20">
          <div
            class="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 dark:border-slate-500 border-t-amber-500 dark:border-t-amber-400">
          </div>
          <p class="text-stone-600 dark:text-stone-400 text-sm mt-4 transition-colors">正在加载影视数据...</p>
        </div>

        <!-- 影视网格 -->
        <div v-else-if="dramaList.length > 0">
          <div
            class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 mb-8">
            <article v-for="drama in dramaList" :key="drama.id" class="drama-card group">
              <DramaCard :drama="drama" @select="selectDrama" />
            </article>
          </div>

          <!-- 加载更多时的骨架屏 -->
          <div v-if="loading"
            class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 mb-8">
            <DramaSkeleton :count="12" />
          </div>
        </div>

        <!-- 加载更多按钮 -->
        <div v-if="!initialLoading && !loading && currentPage < totalPages" class="text-center py-8">
          <button @click="loadMore"
            class="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-700 dark:to-orange-700 text-amber-900 dark:text-amber-100 font-medium rounded-xl hover:from-amber-300 hover:to-orange-300 dark:hover:from-amber-600 dark:hover:to-orange-600 transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center justify-center mx-auto text-sm sm:text-base">
            <i class="fas fa-plus mr-2"></i>
            加载更多
          </button>
        </div>

        <!-- 没有更多数据 -->
        <div v-if="!initialLoading && !loading && dramaList.length > 0 && currentPage >= totalPages"
          class="text-center py-8">
          <p class="text-stone-500 dark:text-stone-400 text-sm">已加载全部内容</p>
        </div>

        <!-- 空状态 -->
        <div v-if="!initialLoading && !loading && dramaList.length === 0" class="text-center py-20">
          <div class="text-stone-400 dark:text-stone-500 mb-4">
            <i class="fas fa-film text-3xl sm:text-4xl"></i>
          </div>
          <h3 class="text-lg sm:text-xl font-medium text-stone-800 dark:text-stone-100 mb-2 transition-colors">
            {{ searchKeyword ? '未找到相关影视' : '暂无影视数据' }}
          </h3>
          <p class="text-stone-600 dark:text-stone-400 mb-6 transition-colors text-sm sm:text-base">
            {{ searchKeyword ? '尝试使用不同的关键词搜索' : '请稍后再试或联系管理员' }}
          </p>
          <button v-if="searchKeyword || selectedCategory" @click="clearSearch"
            class="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline font-medium transition-colors text-sm sm:text-base">
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

.drama-card:hover {
  transform: translateZ(0);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

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

/* 响应式设计优化 */
@media (max-width: 1024px) {
  aside {
    display: none;
  }

  .lg\\:ml-72 {
    margin-left: 0;
  }
}

@media (max-width: 640px) {
  .drama-card:hover {
    transform: none;
  }

  .drama-card {
    -webkit-tap-highlight-color: transparent;
  }

  /* 移动端网格优化 */
  .grid {
    gap: 0.75rem;
  }
}

@media (max-width: 480px) {

  /* 超小屏幕优化 */
  .grid {
    gap: 0.5rem;
  }

  /* 减少内边距 */
  .p-4 {
    padding: 0.75rem;
  }

  /* 优化按钮大小 */
  .px-6 {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .py-3 {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
}

/* 平板设备优化 */
@media (min-width: 768px) and (max-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.drama-card {
  contain: layout style paint;
}

img {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

@media (prefers-reduced-motion: reduce) {

  .drama-card,
  .transition-all {
    transition: none;
  }

  .animate-spin {
    animation: none;
  }
}

.overflow-y-auto {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.category-item {
  margin-bottom: 2px;
}

.category-item:last-child {
  margin-bottom: 0;
}
</style>
