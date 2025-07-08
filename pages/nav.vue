<template>
  <div
    class="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">
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
                <i class="fas fa-compass text-amber-800 dark:text-amber-100 text-sm"></i>
              </div>
              <span
                class="bg-gradient-to-r from-stone-800 to-stone-600 dark:from-stone-100 dark:to-stone-300 bg-clip-text text-transparent">爱盼导航</span>
            </h2>
          </nuxt-link>
          <p class="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">探索精选网站，发现无限可能</p>
        </div>

        <!-- 搜索框 -->
        <div class="mb-6">
          <div class="relative group">
            <label for="navigation-search" class="sr-only">搜索导航项</label>
            <input id="navigation-search" v-model="searchQuery" type="search" placeholder="搜索网站..." autocomplete="off"
              aria-label="搜索导航项"
              class="w-full px-4 py-3 pl-10 pr-4 text-sm text-stone-700 dark:text-stone-200 bg-white/70 dark:bg-slate-600/70 backdrop-blur-sm border border-stone-300/50 dark:border-slate-500/50 rounded-2xl focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-slate-600 focus:shadow-lg focus:shadow-amber-500/10 placeholder-stone-500 dark:placeholder-stone-400 transition-all duration-300 group-hover:shadow-md">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none" aria-hidden="true">
              <i
                class="fas fa-search text-stone-400 dark:text-stone-500 text-sm group-focus-within:text-amber-500 transition-colors duration-300"></i>
            </div>
            <!-- 搜索建议提示 -->
            <div v-if="searchQuery" class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <button @click="searchQuery = ''"
                class="w-5 h-5 bg-stone-200 dark:bg-slate-500 rounded-full flex items-center justify-center hover:bg-stone-300 dark:hover:bg-slate-400 transition-colors">
                <i class="fas fa-times text-xs text-stone-600 dark:text-stone-300"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 分类导航 -->
        <nav class="space-y-1" role="navigation" aria-label="导航分类">
          <div class="mb-4">
            <p class="text-xs font-semibold text-stone-600 dark:text-stone-400 px-2 uppercase tracking-wider">网站分类</p>
          </div>

          <a v-for="category in categories" :key="category.id" :href="`#category-${category.id}`"
            @click="scrollToCategory(category.id)" :class="[
              'w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none group relative overflow-hidden block',
              activeCategory === category.id
                ? 'bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-700 dark:to-orange-700 text-amber-900 dark:text-amber-100 shadow-lg shadow-amber-500/20'
                : 'text-stone-700 dark:text-stone-300 hover:bg-white/60 dark:hover:bg-slate-600/60 hover:shadow-md backdrop-blur-sm'
            ]" :aria-pressed="activeCategory === category.id">
            <!-- 背景装饰 -->
            <div v-if="activeCategory === category.id"
              class="absolute inset-0 bg-gradient-to-r from-amber-300/20 to-orange-300/20 dark:from-amber-600/20 dark:to-orange-600/20">
            </div>
            <div class="flex items-center justify-between relative z-10">
              <div class="flex items-center">
                <div :class="[
                  'w-6 h-6 rounded-lg flex items-center justify-center mr-3 transition-all duration-300',
                  activeCategory === category.id
                    ? 'bg-amber-300/50 dark:bg-amber-600/50 shadow-md'
                    : 'bg-stone-300/50 dark:bg-slate-500/50 group-hover:bg-stone-400/50 dark:group-hover:bg-slate-400/50'
                ]">
                  <i :class="getCategoryIcon(category.name)" class="text-xs"></i>
                </div>
                <span class="font-medium text-sm">{{ category.name }}</span>
              </div>
              <span :class="[
                'text-xs px-2 py-1 rounded-lg font-semibold transition-all duration-300',
                activeCategory === category.id
                  ? 'bg-amber-300/60 dark:bg-amber-600/60 text-amber-900 dark:text-amber-100 shadow-sm'
                  : 'bg-stone-300/60 dark:bg-slate-500/60 text-stone-700 dark:text-stone-300 group-hover:bg-stone-400/60 dark:group-hover:bg-slate-400/60'
              ]">{{ category.items.length }}</span>
            </div>
          </a>
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
              {{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : '全部导航'}}
            </h1>
            <p class="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">
              {{ searchQuery ? `搜索"${searchQuery}"的结果` : '精选优质网站资源，一站式满足您的数字生活需求' }}
            </p>
          </div>
          <div
            class="bg-gradient-to-br from-amber-100/80 to-orange-100/80 dark:from-slate-600/80 dark:to-slate-700/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-amber-200/50 dark:border-slate-500/50 shadow-lg shadow-amber-500/5">
            <div class="text-center">
              <p class="text-xs text-stone-500 dark:text-stone-400 font-medium mb-1">统计信息</p>
              <div class="flex items-center space-x-3">
                <div class="text-center">
                  <p class="text-base font-bold text-stone-800 dark:text-stone-100">
                    {{ searchQuery || selectedCategory ? filteredCategories.length : categories.length }}
                  </p>
                  <p class="text-xs text-stone-500 dark:text-stone-400">分类</p>
                </div>
                <div class="w-px h-6 bg-stone-300 dark:bg-slate-500"></div>
                <div class="text-center">
                  <p class="text-base font-bold text-stone-800 dark:text-stone-100">
                    {{ searchQuery || selectedCategory ? filteredTotalItems : totalItems }}
                  </p>
                  <p class="text-xs text-stone-500 dark:text-stone-400">网站</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 移动端分类筛选 -->
        <div class="lg:hidden">
          <!-- 搜索框 -->
          <div class="mb-4">
            <div class="relative">
              <input v-model="searchQuery" type="search" placeholder="搜索..." autocomplete="off"
                class="w-full px-3 py-2 pl-10 pr-3 text-sm text-stone-700 dark:text-stone-200 bg-white dark:bg-slate-600 border border-stone-300 dark:border-slate-500 rounded-2xl focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 placeholder-stone-500 dark:placeholder-stone-400 transition-colors">
              <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <i class="fas fa-search text-stone-400 dark:text-stone-500 text-sm"></i>
              </div>
            </div>
          </div>

          <!-- 分类按钮 -->
          <div class="flex flex-wrap gap-2">
            <button @click="selectedCategory = null" :class="[
              'px-3 py-2 rounded-xl text-sm font-medium transition-colors focus:outline-none',
              selectedCategory === null
                ? 'bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-100'
                : 'bg-white dark:bg-slate-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-500 border border-stone-300 dark:border-slate-500'
            ]">
              全部 ({{ totalItems }})
            </button>

            <button v-for="category in categories" :key="category.id" @click="selectedCategory = category.id" :class="[
              'px-3 py-2 rounded-xl text-sm font-medium transition-colors focus:outline-none',
              selectedCategory === category.id
                ? 'bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-100'
                : 'bg-white dark:bg-slate-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-500 border border-stone-300 dark:border-slate-500'
            ]">
              {{ category.name }} ({{ category.items.length }})
            </button>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex flex-col justify-center items-center py-20" role="status" aria-live="polite">
        <div
          class="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 dark:border-slate-500 border-t-amber-500 dark:border-t-amber-400"
          aria-hidden="true"></div>
        <span class="sr-only">正在加载导航数据...</span>
        <p class="text-stone-600 dark:text-stone-400 text-sm mt-4 transition-colors">正在加载导航数据...</p>
      </div>

      <!-- 导航内容区域 -->
      <div v-else
        class="p-6 bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-yellow-50/50 dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-900/50 min-h-screen">
        <!-- 分类区块展示 -->
        <div class="space-y-8">
          <section v-for="category in filteredCategories" :key="category.id" :id="`category-${category.id}`"
            class="category-section">
            <!-- 分类标题 -->
            <div class="mb-6">
              <div class="flex items-center mb-3">
                <div
                  class="w-10 h-10 bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-700 dark:to-orange-800 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-amber-500/20">
                  <i :class="getCategoryIcon(category.name)" class="text-amber-800 dark:text-amber-100 text-lg"></i>
                </div>
                <div>
                  <h2
                    class="text-sm font-bold text-stone-800 dark:text-stone-100 mb-1 bg-gradient-to-r from-stone-800 to-stone-600 dark:from-stone-100 dark:to-stone-300 bg-clip-text text-transparent">
                    {{ category.name }}
                  </h2>
                  <p class="text-xs text-stone-600 dark:text-stone-400">{{ category.items.length }} 个网站</p>
                </div>
              </div>
              <div class="h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 rounded-full w-16"></div>
            </div>

            <!-- 该分类下的导航项网格 -->
            <div
              class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
              role="list">
              <article v-for="item in category.items" :key="`${category.id}-${item.path}`" class="nav-card group"
                role="listitem">
                <nuxt-link :to="item.path" :target="item.target || '_self'"
                  :rel="item.target === '_blank' ? 'noopener noreferrer' : undefined"
                  class="block focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-4 focus:ring-offset-transparent rounded-2xl"
                  :aria-label="`访问${item.title}${item.target === '_blank' ? '（在新窗口打开）' : ''}`">
                  <!-- 精致卡片 -->
                  <div
                    class="bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-stone-200/50 dark:border-slate-600/50 rounded-2xl p-4 h-full transition-all duration-300 hover:border-amber-300/70 dark:hover:border-amber-600/70 hover:shadow-2xl hover:shadow-amber-500/10 dark:hover:shadow-slate-900/20 hover:-translate-y-1 hover:scale-[1.02] min-h-[140px] flex flex-col relative overflow-hidden group-hover:bg-white dark:group-hover:bg-slate-700/90">

                    <!-- 背景装饰 -->
                    <div
                      class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-200/20 to-orange-300/20 dark:from-amber-600/10 dark:to-orange-700/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500">
                    </div>

                    <!-- 头部：图标和状态 -->
                    <div class="flex items-start justify-between mb-4 relative z-10">
                      <!-- 图标容器 -->
                      <div
                        class="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-800 dark:to-orange-900 rounded-xl flex-shrink-0 group-hover:from-amber-200 group-hover:to-orange-300 dark:group-hover:from-amber-700 dark:group-hover:to-orange-800 transition-all duration-300 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/30 group-hover:scale-105">
                        <!-- 网站图标或FontAwesome图标 -->
                        <img v-if="getWebsiteIcon(item.path) && !iconErrors[item.path]" :src="getWebsiteIcon(item.path)"
                          :alt="`${item.title} 图标`" class="w-5 h-5 rounded-lg shadow-sm" loading="lazy" decoding="async"
                          @error="handleIconError(item.path)" @load="handleIconLoad(item.path)" />
                        <i v-else :class="['fas', item.icon]" class="text-amber-800 dark:text-amber-100 text-sm"></i>
                      </div>

                      <!-- 状态指示器 -->
                      <div class="flex items-center">
                        <!-- 外部链接标识 -->
                        <div v-if="item.target === '_blank'" class="w-5 h-5 flex items-center justify-center"
                          aria-hidden="true">
                          <i class="fas fa-external-link-alt text-orange-800 dark:text-orange-100 text-xs"></i>
                        </div>
                        <!-- 内部页面标识 -->
                        <div v-else aria-hidden="true"></div>
                      </div>
                    </div>

                    <!-- 内容区域 -->
                    <div class="flex-1 flex flex-col relative z-10">
                      <!-- 标题 -->
                      <h3
                        class="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-2 line-clamp-2 leading-tight group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors">
                        {{ item.title }}
                      </h3>

                      <!-- 描述 -->
                      <p v-if="item.description"
                        class="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mb-3 flex-1 line-clamp-2 group-hover:text-stone-500 dark:group-hover:text-stone-300 transition-colors">
                        {{ item.description }}
                      </p>
                      <div v-else class="flex-1"></div>
                    </div>
                  </div>
                </nuxt-link>
              </article>
            </div>
          </section>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && categories.length > 0 && filteredCategories.length === 0" class="text-center py-20">
        <div class="text-stone-400 dark:text-stone-500 mb-4">
          <i class="fas fa-search text-4xl"></i>
        </div>
        <h3 class="text-xl font-medium text-stone-800 dark:text-stone-100 mb-2 transition-colors">未找到相关导航项</h3>
        <p class="text-stone-600 dark:text-stone-400 mb-6 transition-colors">
          尝试使用不同的关键词搜索，或者
          <button @click="clearFilters"
            class="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline font-medium transition-colors">
            清除筛选条件
          </button>
        </p>
      </div>

      <!-- 无数据状态 -->
      <div v-if="!loading && categories.length === 0" class="text-center py-20">
        <div class="text-stone-400 dark:text-stone-500 mb-4">
          <i class="fas fa-compass text-4xl"></i>
        </div>
        <h3 class="text-xl font-medium text-stone-800 dark:text-stone-100 mb-2 transition-colors">暂无导航数据</h3>
        <p class="text-stone-600 dark:text-stone-400 transition-colors">请稍后再试或联系管理员</p>
      </div>
    </div>
  </div>

</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

definePageMeta({
  layout: "custom",
});

// SEO配置
useHead({
  title: '网站导航 - AIPAN.ME',
  meta: [
    {
      name: 'description',
      content: 'AIPAN.ME网站导航，精选优质网站资源，包括常用工具、影视资源、音乐播放、AI工具等，一站式满足您的数字生活需求。'
    },
    {
      name: 'keywords',
      content: '网站导航,AIPAN导航,常用工具,影视资源,音乐播放,AI工具,数字生活,一站式服务'
    }
  ]
})

// 主题切换功能
const isDark = ref(false)

// 初始化主题
const initTheme = () => {
  if (import.meta.client) {
    // 检查本地存储的主题设置
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      isDark.value = savedTheme === 'dark'
    } else {
      // 检查系统偏好
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme()
  }
}

// 应用主题
const applyTheme = () => {
  if (import.meta.client) {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
}

// 获取分类图标
const getCategoryIcon = (categoryName) => {
  const iconMap = {
    '常用': 'fas fa-star',
    '影视': 'fas fa-film',
    '音乐': 'fas fa-music',
    'AI工具': 'fas fa-robot',
    '工具': 'fas fa-tools',
    '游戏': 'fas fa-gamepad',
    '学习': 'fas fa-graduation-cap',
    '设计': 'fas fa-palette',
    '开发': 'fas fa-code',
    '社交': 'fas fa-users',
    '购物': 'fas fa-shopping-cart',
    '新闻': 'fas fa-newspaper',
    '生活': 'fas fa-home',
    '办公': 'fas fa-briefcase'
  }
  return iconMap[categoryName] || 'fas fa-folder'
}

// 响应式数据
const loading = ref(true)
const categories = ref([])
const searchQuery = ref('')
const selectedCategory = ref(null)
const activeCategory = ref(null) // 当前激活的分类（用于锚点导航）
const iconErrors = ref({}) // 记录图标加载失败的URL
const iconCache = ref({}) // 图标缓存

// 计算属性
const totalItems = computed(() => {
  return categories.value.reduce((total, category) => total + category.items.length, 0)
})

// 筛选后的分类（优化性能）
const filteredCategories = computed(() => {
  const categoriesData = categories.value
  if (!categoriesData.length) return []

  let result = categoriesData

  // 按分类筛选
  if (selectedCategory.value) {
    result = result.filter(category => category.id === selectedCategory.value)
  }

  // 按搜索关键词筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    // 使用 Map 缓存搜索结果
    result = result.map(category => {
      const filteredItems = category.items.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(query)
        const descMatch = item.description && item.description.toLowerCase().includes(query)
        return titleMatch || descMatch
      })

      return filteredItems.length > 0 ? {
        ...category,
        items: filteredItems
      } : null
    }).filter(Boolean)
  }

  return result
})

// 筛选后的总导航项数
const filteredTotalItems = computed(() => {
  return filteredCategories.value.reduce((total, category) => total + category.items.length, 0)
})

// 加载导航数据
const loadNavigation = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/navigation')

    if (response.success) {
      categories.value = response.data
    } else {
      console.error('加载导航数据失败:', response.message)
    }
  } catch (error) {
    console.error('加载导航数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取网站图标（带缓存优化）
const getWebsiteIcon = (path) => {
  // 只对外部链接尝试获取favicon
  if (!path || !path.startsWith('http')) {
    return null
  }

  // 检查缓存
  if (iconCache.value[path]) {
    return iconCache.value[path]
  }

  try {
    const url = new URL(path)
    // 使用Google的favicon服务
    const iconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`
    // 缓存结果
    iconCache.value[path] = iconUrl
    return iconUrl
  } catch (error) {
    console.warn('无法解析URL:', path)
    return null
  }
}

// 处理图标加载错误
const handleIconError = (path) => {
  iconErrors.value[path] = true
}

// 处理图标加载成功
const handleIconLoad = (path) => {
  iconErrors.value[path] = false
}

// 滚动到指定分类
const scrollToCategory = (categoryId) => {
  // 清除搜索和分类筛选，显示所有内容
  searchQuery.value = ''
  selectedCategory.value = null

  // 设置当前激活的分类
  activeCategory.value = categoryId

  // 等待 DOM 更新后滚动
  nextTick(() => {
    const element = document.getElementById(`category-${categoryId}`)
    if (element) {
      // 使用 scrollIntoView 配合 CSS scroll-margin-top
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  })
}

// 清除筛选条件
const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = null
  activeCategory.value = null
}

// 节流函数
const throttle = (func, delay) => {
  let timeoutId
  let lastExecTime = 0
  return function (...args) {
    const currentTime = Date.now()

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args)
      lastExecTime = currentTime
    } else {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func.apply(this, args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

// 监听滚动事件，更新激活的分类（使用节流优化性能）
const handleScroll = throttle(() => {
  if (import.meta.client && categories.value.length > 0) {
    const sections = categories.value.map(category => ({
      id: category.id,
      element: document.getElementById(`category-${category.id}`)
    })).filter(section => section.element)

    if (sections.length === 0) return

    let currentActive = null
    const headerHeight = 120 // 顶部信息栏高度
    const scrollTop = window.scrollY + headerHeight + 50 // 考虑顶部信息栏高度的偏移量

    for (const section of sections) {
      const rect = section.element.getBoundingClientRect()
      const elementTop = rect.top + window.scrollY

      if (scrollTop >= elementTop) {
        currentActive = section.id
      }
    }

    if (currentActive !== activeCategory.value) {
      activeCategory.value = currentActive
    }
  }
}, 100) // 100ms 节流

// 页面挂载时加载数据和初始化主题
onMounted(() => {
  loadNavigation()
  initTheme()

  // 添加滚动监听
  if (import.meta.client) {
    window.addEventListener('scroll', handleScroll, { passive: true })
  }
})

// 页面卸载时清理事件监听
onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.nav-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  will-change: transform;
}

/* 优化GPU加速 */
.nav-card:hover {
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
  .nav-card:hover {
    transform: none;
  }

  /* 移动端触摸优化 */
  .nav-card {
    -webkit-tap-highlight-color: transparent;
  }

  /* 移动端网格调整 */
  .grid-cols-1.sm\\:grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-4.xl\\:grid-cols-5.\\32xl\\:grid-cols-6 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 性能优化 */
.category-section {
  contain: layout style paint;
  scroll-margin-top: 120px;
  /* 为锚点滚动添加顶部偏移 */
}

/* 图片优化 */
img {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

/* 减少动画偏好支持 */
@media (prefers-reduced-motion: reduce) {

  .nav-card,
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
