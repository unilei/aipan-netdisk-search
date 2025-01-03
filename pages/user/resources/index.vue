<template>
  <div class="min-h-[calc(100vh-60px)] bg-gray-50 dark:bg-gray-900 p-6">
    <div class="max-w-[1000px] mx-auto">
      <!-- 头部区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-200">我的资源</h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">管理你的资源投稿</p>
          </div>
          <div class="flex items-center space-x-4">
            <el-button @click="() => navigateTo('/user/dashboard')">
              返回
            </el-button>
            <el-button type="primary" @click="() => navigateTo('/user/resources/new')">
              投稿资源
            </el-button>
          </div>
        </div>
      </div>

      <!-- 资源列表 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <el-table
          v-loading="loading"
          :data="resources"
          style="width: 100%"
        >
          <el-table-column prop="name" label="资源名称" min-width="200">
            <template #default="{ row }">
              <div class="flex items-center">
                <span class="text-gray-900 dark:text-gray-200">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="flex items-center space-x-2">
                <el-button
                  type="primary"
                  link
                  @click="handleView(row)"
                >
                  查看
                </el-button>
                <el-button
                  v-if="row.status !== 'approved'"
                  type="primary"
                  link
                  @click="handleEdit(row)"
                >
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  link
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="flex justify-end mt-4">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

definePageMeta({
  middleware: ['auth']
})

const { $message } = useNuxtApp()
const token = useCookie('token')

// 状态
const loading = ref(false)
const resources = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取资源列表
const fetchResources = async () => {
  try {
    loading.value = true
    const res = await $fetch('/api/user/resources/list', {
      method: 'GET',
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      },
      headers: {
        "authorization": "Bearer " + token.value
      }
    })

    if (res.code === 200) {
      resources.value = res.data.list
      total.value = res.data.pagination.total
    }
  } catch (error) {
    console.error('获取资源列表失败:', error)
    $message.error('获取资源列表失败')
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

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchResources()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchResources()
}

// 操作处理
const handleView = (row) => {
  navigateTo(`/user/resources/${row.id}`)
}

const handleEdit = (row) => {
  navigateTo(`/user/resources/${row.id}/edit`)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个资源吗？',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const res = await $fetch(`/api/user/resources/${row.id}`, {
      method: 'DELETE',
      headers: {
        "authorization": "Bearer " + token.value
      }
    })

    if (res.code === 200) {
      $message.success('删除成功')
      fetchResources()
    } else {
      throw new Error(res.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除资源失败:', error)
      $message.error(error.message || '删除失败')
    }
  }
}

// 页面加载时获取资源列表
onMounted(() => {
  fetchResources()
})
</script> 