<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <!-- 卡片头部 -->
    <div
      class="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex justify-between items-center">
        <h3 class="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100 m-0">
          <i class="fa-solid fa-coins text-green-600 dark:text-green-400"></i>
          积分概览
        </h3>
        <button @click="$emit('view-history')"
          class="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 text-sm font-medium">
          查看详情
          <i class="fa-solid fa-arrow-right text-xs"></i>
        </button>
      </div>
    </div>

    <div class="p-6">
      <!-- 当前积分 -->
      <div class="text-center mb-6 p-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl text-white">
        <div class="text-4xl font-bold mb-2">{{ pointsData.currentPoints }}</div>
        <div class="text-lg opacity-90">当前积分</div>
      </div>

      <!-- 积分统计 -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div
          class="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
          <div class="text-xl font-bold text-blue-600 dark:text-blue-400 mb-1">{{ pointsData.stats?.dailyEarned || 0 }}
          </div>
          <div class="text-sm text-blue-600/80 dark:text-blue-400/80">今日获得</div>
        </div>
        <div
          class="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700/50">
          <div class="text-xl font-bold text-green-600 dark:text-green-400 mb-1">{{ pointsData.stats?.monthlyEarned || 0
            }}</div>
          <div class="text-sm text-green-600/80 dark:text-green-400/80">本月获得</div>
        </div>
        <div
          class="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-700/50">
          <div class="text-xl font-bold text-purple-600 dark:text-purple-400 mb-1">{{ pointsData.stats?.totalEarned || 0
            }}</div>
          <div class="text-sm text-purple-600/80 dark:text-purple-400/80">累计获得</div>
        </div>
        <div
          class="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-700/50">
          <div class="text-xl font-bold text-orange-600 dark:text-orange-400 mb-1">{{ pointsData.stats?.totalSpent || 0
            }}</div>
          <div class="text-sm text-orange-600/80 dark:text-orange-400/80">累计消费</div>
        </div>
      </div>

      <!-- 积分来源分布 -->
      <div v-if="pointsData.stats?.pointsByType?.length" class="mb-6">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 m-0">积分来源</h4>
        <div class="space-y-3">
          <div v-for="source in pointsData.stats.pointsByType" :key="source.type"
            class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div class="flex-1">
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ getTypeName(source.type) }}</span>
              <span class="text-gray-500 dark:text-gray-400 text-xs ml-2">({{ source._count._all }}次)</span>
            </div>
            <div class="text-green-600 dark:text-green-400 font-bold">+{{ source._sum.points || 0 }}</div>
          </div>
        </div>
      </div>

      <!-- 最近积分记录 -->
      <div v-if="pointsData.recentHistory?.length" class="mb-6">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 m-0">最近记录</h4>
        <div class="space-y-2">
          <div v-for="record in pointsData.recentHistory.slice(0, 3)" :key="record.id"
            class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div class="flex-1">
              <div class="font-medium text-gray-900 dark:text-gray-100 mb-1">{{ record.description ||
                getTypeName(record.type) }}</div>
              <div class="text-gray-500 dark:text-gray-400 text-xs">{{ formatTime(record.createdAt) }}</div>
            </div>
            <div class="font-bold ml-4" :class="{
              'text-green-600 dark:text-green-400': record.points > 0,
              'text-red-600 dark:text-red-400': record.points < 0
            }">
              {{ record.points > 0 ? '+' : '' }}{{ record.points }}
            </div>
          </div>
        </div>
      </div>

      <!-- 积分趋势图 -->
      <div v-if="pointsData.stats?.weeklyTrend?.length">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 m-0">7天趋势</h4>
        <div class="flex items-end justify-between h-20 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div v-for="(day, index) in pointsData.stats.weeklyTrend" :key="day.date"
            class="flex flex-col items-center flex-1 h-full">
            <div class="w-5 bg-gradient-to-t from-blue-600 to-green-500 rounded-t-sm mb-2 min-h-[2px]"
              :style="{ height: getTrendBarHeight(day.points) }"></div>
            <div class="text-xs text-gray-500 dark:text-gray-400 text-center">{{ formatTrendDate(day.date, index) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'


// 定义事件
defineEmits(['view-history'])

// 响应式数据
const pointsData = ref({
  currentPoints: 0,
  userSince: null,
  stats: null,
  recentHistory: []
})

// 获取积分信息
const fetchPointsData = async () => {
  try {
    const response = await $fetch('/api/user/points', {
      headers: {
        'Authorization': `Bearer ${useCookie('token').value}`
      }
    })

    if (response.code === 200) {
      pointsData.value = response.data
    }
  } catch (error) {
    console.error('获取积分信息失败:', error)
  }
}

// 获取积分类型的中文名称
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

// 格式化时间
const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 1天内
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString()
  }
}

// 格式化趋势图日期
const formatTrendDate = (dateString, index) => {
  const date = new Date(dateString)
  const today = new Date()

  if (index === 6) return '今天'
  if (index === 5) return '昨天'

  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 计算趋势图柱状图高度
const getTrendBarHeight = (points) => {
  if (!pointsData.value.stats?.weeklyTrend?.length) return '0%'

  const maxPoints = Math.max(...pointsData.value.stats.weeklyTrend.map(d => d.points))
  if (maxPoints === 0) return '0%'

  return `${Math.max((points / maxPoints) * 100, 5)}%`
}

// 组件挂载时获取数据
onMounted(() => {
  fetchPointsData()
})

// 暴露刷新方法
defineExpose({
  refresh: fetchPointsData
})
</script>
