<template>
  <div class="min-h-[calc(100vh-60px)] bg-gray-50 dark:bg-gray-900 p-6">
    <div class="max-w-[1000px] mx-auto">
      <!-- 头部区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-200">资源详情</h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">查看资源信息</p>
          </div>
          <div class="flex items-center space-x-4">
            <el-button @click="() => navigateTo('/user/resources')">
              返回
            </el-button>
            <el-button 
              v-if="resource?.status !== 'approved'"
              type="primary" 
              @click="() => navigateTo(`/user/resources/${id}/edit`)"
            >
              编辑
            </el-button>
          </div>
        </div>
      </div>

      <!-- 详情区域 -->
      <div v-loading="loading" class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-6">
        <template v-if="resource">
          <!-- 基本信息 -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold text-gray-900 dark:text-gray-200">
                {{ resource.name }}
              </h2>
              <el-tag :type="getStatusType(resource.status)">
                {{ getStatusText(resource.status) }}
              </el-tag>
            </div>
            <div class="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
              <span>创建时间：{{ formatDate(resource.createdAt) }}</span>
            </div>
          </div>

          <!-- 资源链接 -->
          <div class="space-y-2">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-200">资源链接</h3>
            <div class="space-y-2">
              <div 
                v-for="(link, index) in parseLinks(resource.links)" 
                :key="index"
                class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg break-all"
              >
                {{ link.value }}
              </div>
            </div>
          </div>

          <!-- 资源描述 -->
          <div class="space-y-2">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-200">资源描述</h3>
            <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg whitespace-pre-wrap">
              {{ resource.description }}
            </div>
          </div>

          <!-- 审核信息 -->
          <div v-if="resource.status === 'rejected'" class="space-y-2">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-200">拒绝原因</h3>
            <div class="p-4 bg-red-50 dark:bg-red-900 rounded-lg text-red-600 dark:text-red-200">
              {{ resource.rejectReason || '无' }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import dayjs from 'dayjs'

definePageMeta({
  middleware: ['auth']
})

const route = useRoute()
const { $message } = useNuxtApp()
const token = useCookie('token')

const id = route.params.id
const loading = ref(false)
const resource = ref(null)

// 获取资源详情
const fetchResource = async () => {
  try {
    loading.value = true
    const res = await $fetch(`/api/user/resources/${id}`, {
      method: 'GET',
      headers: {
        "authorization": "Bearer " + token.value
      }
    })

    if (res.code === 200) {
      resource.value = res.data
    }
  } catch (error) {
    console.error('获取资源详情失败:', error)
    $message.error('获取资源详情失败')
  } finally {
    loading.value = false
  }
}

// 状态处理
const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return map[status] || '未知'
}

// 日期格式化
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 解析链接
const parseLinks = (links) => {
  try {
    return JSON.parse(links)
  } catch {
    return []
  }
}

// 页面加载时获取资源详情
onMounted(() => {
  fetchResource()
})
</script> 