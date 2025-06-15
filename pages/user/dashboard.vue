<template>
  <div class="min-h-[calc(100vh-60px)] bg-gray-50 dark:bg-gray-900">
    <div class="max-w-[1240px] mx-auto p-6">
      <!-- 用户信息卡片 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
        <div class="relative h-32 bg-gradient-to-r from-blue-500 to-purple-500">
          <div class="absolute -bottom-12 left-6">
            <div class="w-24 h-24 rounded-full bg-white dark:bg-gray-700 p-1">
              <img :src="userStore.userAvatar" alt="avatar" class="w-full h-full rounded-full object-cover" />
            </div>
          </div>
        </div>
        <div class="pt-14 px-6 pb-6">
          <div class="flex justify-between items-start">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-200">
                {{ userStore.user?.username }}
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                {{ userStore.user?.email }}
              </p>
            </div>
            <div class="flex items-center space-x-3">
              <button @click="() => navigateTo('/user/profile')"
                class="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-1.5 hover:shadow-md">
                <i class="fa-solid fa-user-pen"></i>
                <span>编辑资料</span>
              </button>

              <button @click="handleLogout"
                class="border border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 text-sm py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-1.5 hover:shadow-md">
                <i class="fa-solid fa-right-from-bracket"></i>
                <span>退出登录</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据统计 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">资源总数</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-200 mt-1">{{ stats?.resourceCount || 0 }}</p>
            </div>
            <el-icon class="text-3xl text-blue-500">
              <Files />
            </el-icon>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">文章总数</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-200 mt-1">{{ stats?.postCount || 0 }}</p>
            </div>
            <el-icon class="text-3xl text-green-500">
              <Document />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-200">我的资源</h2>
            <el-icon class="text-2xl text-blue-500">
              <Upload />
            </el-icon>
          </div>
          <p class="text-gray-500 dark:text-gray-400 mb-4">查看你的资源</p>
          <el-button type="primary" @click="() => navigateTo('/user/resources/list')" class="w-full">
            管理您投稿的资源
          </el-button>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-200">我的文章</h2>
            <el-icon class="text-2xl text-green-500">
              <Edit />
            </el-icon>
          </div>
          <p class="text-gray-500 dark:text-gray-400 mb-4">查看你的文章</p>
          <el-button type="success" @click="() => navigateTo('/user/posts/list')" class="w-full">
            管理您投稿的文章
          </el-button>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-200">我的论坛</h2>
            <el-icon class="text-2xl text-indigo-500">
              <i class="fas fa-comments"></i>
            </el-icon>
          </div>
          <p class="text-gray-500 dark:text-gray-400 mb-4">管理您的主题和回复</p>
          <el-button type="primary" @click="() => navigateTo('/user/forum')" class="w-full">
            <i class="fas fa-list-ul mr-1"></i>
            管理论坛内容
          </el-button>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-200">VOD 视频源</h2>
            <el-icon class="text-2xl text-purple-500">
              <i class="fas fa-film"></i>
            </el-icon>
          </div>
          <p class="text-gray-500 dark:text-gray-400 mb-4">管理您的视频源配置</p>
          <el-button type="warning" @click="() => navigateTo('/user/vod-settings')" class="w-full">
            <i class="fas fa-cog mr-1"></i>
            配置视频源
          </el-button>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-200">音乐验证码</h2>
            <el-icon class="text-2xl text-orange-500">
              <i class="fas fa-music"></i>
            </el-icon>
          </div>
          <p class="text-gray-500 dark:text-gray-400 mb-4">获取当前音乐页面验证码</p>
          <el-button type="primary" @click="getMusicPassword" class="w-full" :loading="musicPasswordLoading">
            <i class="fas fa-key mr-1"></i>
            获取验证码
          </el-button>
        </div>
      </div>

      <!-- 最近活动 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">最近活动</h2>
        <div v-if="activities?.length" class="space-y-4">
          <div v-for="activity in activities" :key="activity.id"
            class="flex items-center p-4 border border-gray-100 dark:border-gray-700 rounded-lg">
            <el-icon class="text-2xl mr-4" :class="getActivityIconClass(activity.type)">
              <component :is="getActivityIcon(activity.type)" />
            </el-icon>
            <div>
              <p class="text-gray-900 dark:text-gray-200">{{ activity.content }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ new Date(activity.createdAt).toLocaleString() }}
              </p>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-gray-500 dark:text-gray-400 py-4">
          暂无活动记录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  UserFilled,
  Files,
  Document,
  Star,
  Download,
  Upload,
  Edit,
  Management
} from '@element-plus/icons-vue'
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()
definePageMeta({
  middleware: ['auth']
})

const stats = ref(null)
const activities = ref([])
const musicPasswordLoading = ref(false)

// 获取统计数据
const fetchStats = async () => {
  try {
    const res = await $fetch('/api/user/stats', {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    if (res.code === 200) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取最近活动
const fetchActivities = async () => {
  try {
    const res = await $fetch('/api/user/activities', {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    if (res.code === 200) {
      activities.value = res.data
    }
  } catch (error) {
    console.error('获取活动数据失败:', error)
  }
}

// 获取活动图标
const getActivityIcon = (type) => {
  const iconMap = {
    'resource': Files,
    'post': Document,
    'like': Star,
    'download': Download
  }
  return iconMap[type] || Document
}

// 获取活动图标样式
const getActivityIconClass = (type) => {
  const classMap = {
    'resource': 'text-blue-500',
    'post': 'text-green-500',
    'like': 'text-red-500',
    'download': 'text-purple-500'
  }
  return classMap[type] || 'text-gray-500'
}

// 获取音乐验证码
const getMusicPassword = async () => {
  musicPasswordLoading.value = true
  try {
    const res = await $fetch('/api/music/password')
    if (res.code === 200) {
      const { password, enabled } = res.data
      if (enabled) {
        ElMessageBox.alert(
          `当前音乐验证码为：${password}`,
          '音乐验证码',
          {
            confirmButtonText: '复制验证码',
            type: 'info',
            showClose: false
          }
        ).then(() => {
          // 复制到剪贴板
          navigator.clipboard.writeText(password).then(() => {
            ElMessage.success('验证码已复制到剪贴板')
          }).catch(() => {
            ElMessage.warning('复制失败，请手动复制')
          })
        })
      } else {
        ElMessage.info('音乐验证功能已关闭')
      }
    } else {
      ElMessage.error('获取验证码失败')
    }
  } catch (error) {
    console.error('获取音乐验证码失败:', error)
    ElMessage.error('获取验证码失败')
  } finally {
    musicPasswordLoading.value = false
  }
}

// 处理登出
const handleLogout = () => {
  userStore.clearUser()
  navigateTo('/')
}

onMounted(() => {
  fetchStats()
  fetchActivities()
})
</script>