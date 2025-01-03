<template>
  <div class="min-h-[calc(100vh-60px)] bg-gray-50 dark:bg-gray-900">
    <div class="max-w-[1240px] mx-auto p-6 space-y-6">
      <!-- 头部区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-200">用户中心</h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">欢迎回来，{{ user?.username }}</p>
          </div>
          <div class="flex items-center space-x-4">
            <el-button type="primary" @click="() => navigateTo('/')" class="flex items-center">
              <el-icon class="mr-1">
                <House />
              </el-icon>
              返回首页
            </el-button>
            <button @click="handleLogout" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
              登出
            </button>
          </div>
        </div>
      </div>

      <!-- 功能卡片区域 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- 博客投稿 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-200">博客投稿</h2>
            <el-icon class="text-2xl text-blue-500">
              <Document />
            </el-icon>
          </div>
          <p class="text-gray-500 dark:text-gray-400 mb-4">分享你的想法和经验</p>
          <el-button type="primary" @click="() => navigateTo('/user/posts/new')" class="w-full">
            写文章
          </el-button>
        </div>

        <!-- 资源投稿 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-200">资源投稿</h2>
            <el-icon class="text-2xl text-green-500">
              <Edit />
            </el-icon>
          </div>
          <p class="text-gray-500 dark:text-gray-400 mb-4">分享你的资源</p>
          <el-button type="success" @click="() => navigateTo('/user/resources/new')" class="w-full">
            上传资源
          </el-button>
        </div>

        <!-- 我的投稿 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-200">我的投稿</h2>
            <el-icon class="text-2xl text-purple-500">
              <Document />
            </el-icon>
          </div>
          <p class="text-gray-500 dark:text-gray-400 mb-4">管理你的投稿内容</p>
          <el-button type="info" @click="() => navigateTo('/user/contributions')" class="w-full">
            查看投稿
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { House, Document, Edit } from '@element-plus/icons-vue'
const { logout } = useAuth();

definePageMeta({
  middleware: ['auth']
})

const token = useCookie('token');
const user = ref(null);

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await $fetch('/api/user/info', {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    });
    if (res.code === 200) {
      user.value = res.data;
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

onMounted(() => {
  fetchUserInfo();
});

const handleLogout = () => {
  logout();
};
</script>