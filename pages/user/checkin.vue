<template>
  <div class="min-h-[calc(100vh-60px)] bg-gray-50 dark:bg-gray-900 py-6 md:py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="text-center mb-8 md:mb-12">
        <h1
          class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          签到中心
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          每日签到获得积分，连续签到有额外奖励
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        <!-- 左侧：签到卡片和积分概览 -->
        <div class="space-y-6">
          <UserCheckInCard />
          <UserPointsOverview ref="pointsOverviewRef" @view-history="activeTab = 'points-history'" />
        </div>

        <!-- 右侧：历史记录 -->
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <!-- 标签页头部 -->
          <div class="border-b border-gray-200 dark:border-gray-700">
            <nav class="flex space-x-8 px-6" aria-label="Tabs">
              <button @click="activeTab = 'checkin-history'" :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
                activeTab === 'checkin-history'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
              ]">
                <div class="flex items-center space-x-2">
                  <i class="fa-solid fa-calendar-days"></i>
                  <span>签到历史</span>
                </div>
              </button>
              <button @click="activeTab = 'points-history'" :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
                activeTab === 'points-history'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
              ]">
                <div class="flex items-center space-x-2">
                  <i class="fa-solid fa-coins"></i>
                  <span>积分记录</span>
                </div>
              </button>
            </nav>
          </div>

          <!-- 签到历史内容 -->
          <div v-if="activeTab === 'checkin-history'" class="p-6">
            <!-- 月份选择器 -->
            <div class="mb-6">
              <el-date-picker v-model="selectedMonth" type="month" placeholder="选择月份" format="YYYY年MM月"
                value-format="YYYY-MM" @change="fetchCheckInHistory" class="w-full sm:w-auto" />
            </div>

            <!-- 月度统计 -->
            <div v-if="checkInHistory.monthStats" class="mb-8">
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 text-center border border-blue-200 dark:border-blue-700/50">
                  <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {{ checkInHistory.monthStats.checkInCount }}
                  </div>
                  <div class="text-sm text-blue-600/80 dark:text-blue-400/80">签到天数</div>
                </div>
                <div
                  class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 text-center border border-green-200 dark:border-green-700/50">
                  <div class="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {{ checkInHistory.monthStats.totalPoints }}
                  </div>
                  <div class="text-sm text-green-600/80 dark:text-green-400/80">获得积分</div>
                </div>
                <div
                  class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 text-center border border-purple-200 dark:border-purple-700/50">
                  <div class="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {{ checkInHistory.monthStats.maxConsecutiveDays }}
                  </div>
                  <div class="text-sm text-purple-600/80 dark:text-purple-400/80">最长连续</div>
                </div>
                <div
                  class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 text-center border border-orange-200 dark:border-orange-700/50">
                  <div class="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                    {{ checkInHistory.monthStats.checkInRate }}%
                  </div>
                  <div class="text-sm text-orange-600/80 dark:text-orange-400/80">签到率</div>
                </div>
              </div>
            </div>

            <!-- 签到记录列表 -->
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <div v-if="checkInHistory.checkIns?.length === 0" class="text-center py-12">
                <div class="text-gray-400 dark:text-gray-500 text-lg mb-2">📅</div>
                <p class="text-gray-500 dark:text-gray-400">本月暂无签到记录</p>
              </div>
              <div v-else class="space-y-2">
                <div v-for="checkIn in checkInHistory.checkIns" :key="checkIn.id"
                  class="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                  <div class="flex flex-col items-center mr-4 min-w-[60px]">
                    <div class="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {{ formatDate(checkIn.checkInDate, 'DD') }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDate(checkIn.checkInDate, 'MM/DD') }}
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="font-semibold text-green-600 dark:text-green-400 mb-1">
                      +{{ checkIn.points }} 积分
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      连续 {{ checkIn.consecutiveDays }} 天
                    </div>
                  </div>
                  <div class="ml-4">
                    <i class="fa-solid fa-circle-check text-green-500 dark:text-green-400 text-xl"></i>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分页 -->
            <div v-if="checkInHistory.pagination?.totalPages > 1" class="mt-6 flex justify-center">
              <el-pagination v-model:current-page="checkInPage" :page-size="checkInHistory.pagination.limit"
                :total="checkInHistory.pagination.total" layout="prev, pager, next"
                @current-change="fetchCheckInHistory" class="pagination-custom" />
            </div>
          </div>

          <!-- 积分记录内容 -->
          <div v-if="activeTab === 'points-history'" class="p-6">
            <!-- 筛选器 -->
            <div class="flex flex-col sm:flex-row gap-4 mb-6">
              <el-select v-model="pointsFilter.type" placeholder="积分类型" clearable @change="fetchPointsHistory"
                class="w-full sm:w-48">
                <el-option label="全部" value="" />
                <el-option label="每日签到" value="checkin" />
                <el-option label="连续签到奖励" value="bonus" />
                <el-option label="积分消费" value="consume" />
                <el-option label="管理员调整" value="admin" />
              </el-select>

              <el-date-picker v-model="pointsFilter.dateRange" type="daterange" range-separator="至"
                start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY/MM/DD" value-format="YYYY-MM-DD"
                @change="fetchPointsHistory" class="w-full sm:w-auto" />
            </div>

            <!-- 积分记录列表 -->
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <div v-if="pointsHistory.history?.length === 0" class="text-center py-12">
                <div class="text-gray-400 dark:text-gray-500 text-lg mb-2">💰</div>
                <p class="text-gray-500 dark:text-gray-400">暂无积分记录</p>
              </div>
              <div v-else class="space-y-2">
                <div v-for="record in pointsHistory.history" :key="record.id"
                  class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                  <div class="flex-1">
                    <div class="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {{ record.description || getTypeName(record.type) }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ formatDateTime(record.createdAt) }}
                    </div>
                  </div>
                  <div class="text-lg font-bold ml-4" :class="{
                    'text-green-600 dark:text-green-400': record.points > 0,
                    'text-red-600 dark:text-red-400': record.points < 0
                  }">
                    {{ record.points > 0 ? '+' : '' }}{{ record.points }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 分页 -->
            <div v-if="pointsHistory.pagination?.totalPages > 1" class="mt-6 flex justify-center">
              <el-pagination v-model:current-page="pointsPage" :page-size="pointsHistory.pagination.limit"
                :total="pointsHistory.pagination.total" layout="prev, pager, next" @current-change="fetchPointsHistory"
                class="pagination-custom" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

import UserCheckInCard from '~/components/user/CheckInCard.vue'
import UserPointsOverview from '~/components/user/PointsOverview.vue'

// 页面元数据
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// 响应式数据
const activeTab = ref('checkin-history')
const selectedMonth = ref(new Date().toISOString().slice(0, 7)) // YYYY-MM 格式
const checkInPage = ref(1)
const pointsPage = ref(1)

const pointsOverviewRef = ref(null)

// 签到历史数据
const checkInHistory = ref({
  checkIns: [],
  pagination: null,
  monthStats: null
})

// 积分历史数据
const pointsHistory = ref({
  history: [],
  pagination: null,
  stats: null
})

// 积分筛选条件
const pointsFilter = ref({
  type: '',
  dateRange: null
})

// 获取签到历史
const fetchCheckInHistory = async () => {
  try {
    const [year, month] = selectedMonth.value.split('-')
    const response = await $fetch('/api/user/checkin/history', {
      query: {
        year: parseInt(year),
        month: parseInt(month),
        page: checkInPage.value,
        limit: 20
      },
      headers: {
        'Authorization': `Bearer ${useCookie('token').value}`
      }
    })

    if (response.code === 200) {
      checkInHistory.value = response.data
    }
  } catch (error) {
    console.error('获取签到历史失败:', error)
  }
}

// 获取积分历史
const fetchPointsHistory = async () => {
  try {
    const query = {
      page: pointsPage.value,
      limit: 20
    }

    if (pointsFilter.value.type) {
      query.type = pointsFilter.value.type
    }

    if (pointsFilter.value.dateRange?.length === 2) {
      query.startDate = pointsFilter.value.dateRange[0]
      query.endDate = pointsFilter.value.dateRange[1]
    }

    const response = await $fetch('/api/user/points/history', {
      query,
      headers: {
        'Authorization': `Bearer ${useCookie('token').value}`
      }
    })

    if (response.code === 200) {
      pointsHistory.value = response.data
    }
  } catch (error) {
    console.error('获取积分历史失败:', error)
  }
}

// 格式化日期
const formatDate = (dateString, format) => {
  const date = new Date(dateString)
  if (format === 'DD') {
    return date.getDate().toString().padStart(2, '0')
  } else if (format === 'MM/DD') {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`
  }
  return date.toLocaleDateString()
}

// 格式化日期时间
const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 获取积分类型名称
const getTypeName = (type) => {
  const typeNames = {
    'checkin': '每日签到',
    'bonus': '连续签到奖励',
    'consume': '积分消费',
    'admin': '管理员调整',
    'activity': '活动奖励',
    'task': '任务奖励'
  }
  return typeNames[type] || type
}

// 监听标签切换
watch(activeTab, (newTab) => {
  if (newTab === 'checkin-history') {
    fetchCheckInHistory()
  } else if (newTab === 'points-history') {
    fetchPointsHistory()
  }
})

// 组件挂载时获取数据
onMounted(() => {
  fetchCheckInHistory()
})
</script>
