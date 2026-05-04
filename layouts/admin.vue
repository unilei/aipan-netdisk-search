<template>
  <div class="min-h-screen admin-page-bg">
    <!-- 侧边栏 -->
    <aside
      :class="[
        'fixed top-0 left-0 z-40 h-screen transition-transform',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'sm:translate-x-0'
      ]"
      class="w-64"
    >
      <div class="h-full flex flex-col admin-card-bg border-r border-gray-200 dark:border-gray-700">
        <!-- Logo区域 -->
        <div class="flex items-center justify-between mb-5 px-6 py-4 flex-shrink-0">
          <NuxtLink to="/admin/dashboard" class="flex items-center">
            <span class="text-xl font-bold text-gray-900 dark:text-white">管理后台</span>
          </NuxtLink>
          <button
            @click="sidebarOpen = false"
            class="sm:hidden text-gray-500 hover:text-gray-900 dark:hover:text-white"
            aria-label="关闭侧边栏"
          >
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <!-- 导航菜单 - 可滚动区域 -->
        <div class="flex-1 overflow-y-auto px-3">
          <ul class="space-y-1 font-medium pb-4">
            <li v-for="group in menuGroups" :key="group.id">
              <!-- 单级菜单项 -->
              <NuxtLink
                v-if="group.single"
                :to="group.path"
                @click="handleMenuClick"
                class="flex items-center p-3 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                :class="{'bg-gray-100 dark:bg-gray-700': isActive(group.path)}"
              >
                <i :class="group.icon" class="w-5 text-gray-500 dark:text-gray-400" aria-hidden="true"></i>
                <span class="ml-3">{{ group.title }}</span>
              </NuxtLink>

              <!-- 可展开的分组菜单 -->
              <template v-else>
                <button
                  @click="toggleGroup(group.id)"
                  class="flex items-center w-full p-3 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  :class="{'bg-gray-100 dark:bg-gray-700': isGroupActive(group)}"
                  :aria-expanded="isGroupExpanded(group.id).toString()"
                  :aria-label="`${isGroupExpanded(group.id) ? '收起' : '展开'}${group.title}`"
                >
                  <i :class="group.icon" class="w-5 text-gray-500 dark:text-gray-400" aria-hidden="true"></i>
                  <span class="ml-3 flex-1 text-left">{{ group.title }}</span>
                  <i 
                    class="fas fa-chevron-down text-xs text-gray-400 transition-transform duration-200"
                    :class="{'rotate-180': isGroupExpanded(group.id)}"
                    aria-hidden="true"
                  ></i>
                </button>
                
                <!-- 二级菜单 -->
                <ul v-show="isGroupExpanded(group.id)" class="mt-1 space-y-1 pl-6">
                  <li v-for="child in group.children" :key="child.path">
                    <NuxtLink
                      :to="child.path"
                      @click="handleMenuClick"
                      class="flex items-center p-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      :class="{'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white': isActive(child.path)}"
                    >
                      <i :class="child.icon" class="w-4 h-4 text-gray-400" aria-hidden="true"></i>
                      <span class="ml-2">{{ child.title }}</span>
                    </NuxtLink>
                  </li>
                </ul>
              </template>
            </li>
          </ul>
        </div>

        <!-- 底部操作 - 固定在底部 -->
        <div class="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            @click="handleLogout"
            class="flex items-center w-full p-3 text-gray-900 dark:text-white rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            aria-label="退出登录"
          >
            <i class="fas fa-sign-out-alt w-5 text-gray-500" aria-hidden="true"></i>
            <span class="ml-3">退出登录</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- 主内容区域 -->
    <div class="sm:ml-64">
      <!-- 顶部导航栏 -->
      <nav class="admin-card-bg border-b border-gray-200 dark:border-gray-700">
        <div class="px-3 py-3 lg:px-5 lg:pl-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center justify-start">
              <!-- 移动端菜单按钮 -->
              <button
                @click="sidebarOpen = !sidebarOpen"
                class="sm:hidden p-2 text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                :aria-label="sidebarOpen ? '关闭菜单' : '打开菜单'"
                :aria-expanded="sidebarOpen.toString()"
              >
                <i class="fas fa-bars" aria-hidden="true"></i>
              </button>
              <!-- 面包屑导航 -->
              <div class="flex items-center ml-3">
                <div class="text-sm">
                  <span class="text-gray-500">{{ currentPageTitle }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <NuxtLink
                to="/"
                class="text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center"
              >
                <i class="fas fa-home mr-2" aria-hidden="true"></i>
                返回首页
              </NuxtLink>
              <!-- 用户信息 -->
              <div class="flex items-center">
                <ClientOnly>
                  <span class="text-sm text-gray-900 dark:text-white">{{ userStore.user?.username || 'Admin' }}</span>
                  <template #fallback>
                    <span class="text-sm text-gray-900 dark:text-white">Admin</span>
                  </template>
                </ClientOnly>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- 页面内容 -->
      <main class="p-4 md:p-6">
        <slot />
      </main>
    </div>

    <!-- 移动端遮罩 -->
    <div
      v-if="sidebarOpen"
      @click="sidebarOpen = false"
      class="fixed inset-0 z-30 bg-gray-900/50 sm:hidden"
    ></div>
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { logout } = useAuth();

const sidebarOpen = ref(false);

// 菜单配置 - 静态数据无需computed
const menuGroups = [
  {
    id: 'dashboard',
    title: '控制面板',
    path: '/admin/dashboard',
    icon: 'fas fa-tachometer-alt',
    single: true
  },
  {
    id: 'content',
    title: '内容管理',
    icon: 'fas fa-file-alt',
    children: [
      { title: '博客管理', path: '/admin/blog', icon: 'fas fa-blog' },
      { title: '用户文章', path: '/admin/user-posts', icon: 'fas fa-book-reader' },
      { title: '发布日志', path: '/admin/releases', icon: 'fas fa-bullhorn' },
      { title: '评论管理', path: '/admin/comments', icon: 'fas fa-comments' }
    ]
  },
  {
    id: 'data',
    title: '数据管理',
    icon: 'fas fa-database',
    children: [
      { title: '网盘管理', path: '/admin/clouddrive', icon: 'fas fa-folder' },
      { title: 'Alist源', path: '/admin/alist', icon: 'fas fa-server' },
      { title: '用户资源', path: '/admin/user-resources', icon: 'fas fa-folder-open' },
      { title: 'ES索引内容', path: '/admin/search-index/user-resources', icon: 'fas fa-search' }
    ]
  },
  {
    id: 'community',
    title: '社区管理',
    icon: 'fas fa-users',
    children: [
      { title: '聊天管理', path: '/admin/chat', icon: 'fas fa-comment-dots' },
      { title: '论坛管理', path: '/admin/forum/topics', icon: 'fas fa-users' },
      { title: '举报管理', path: '/admin/reports', icon: 'fas fa-flag' }
    ]
  },
  {
    id: 'system',
    title: '系统管理',
    icon: 'fas fa-cog',
    children: [
      { title: '用户管理', path: '/admin/users', icon: 'fas fa-user-friends' },
      { title: '导航管理', path: '/admin/navigation', icon: 'fas fa-bars' },
      { title: '搜索统计', path: '/admin/search-stats', icon: 'fas fa-chart-line' },
      { title: '系统配置', path: '/admin/settings', icon: 'fas fa-cog' }
    ]
  }
];

// 默认展开所有分组
const expandedGroups = ref(['content', 'data', 'community', 'system']);

// 切换分组展开状态
const toggleGroup = (groupId) => {
  const index = expandedGroups.value.indexOf(groupId);
  if (index > -1) {
    expandedGroups.value.splice(index, 1);
  } else {
    expandedGroups.value.push(groupId);
  }
};

// 判断路由是否激活 - 精确匹配，避免误判
const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/');
};

// 判断分组是否有激活的子项
const isGroupActive = (group) => {
  if (group.single) return isActive(group.path);
  return group.children?.some(child => isActive(child.path));
};

// 判断分组是否展开
const isGroupExpanded = (groupId) => {
  return expandedGroups.value.includes(groupId);
};

// 当前页面标题
const currentPageTitle = computed(() => {
  for (const group of menuGroups) {
    if (group.single && isActive(group.path)) return group.title;
    if (group.children) {
      const activeChild = group.children.find(child => isActive(child.path));
      if (activeChild) return activeChild.title;
    }
  }
  return '管理后台';
});

// 点击子菜单后关闭移动端侧边栏
const handleMenuClick = () => {
  if (process.client && window.innerWidth < 640) {
    sidebarOpen.value = false;
  }
};

// 退出登录
const handleLogout = () => {
  logout();
  router.push('/');
};
</script>

<style scoped>
/* 确保侧边栏在小屏幕上正确显示 */
@media (max-width: 640px) {
  aside {
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }
}
</style>
