<template>
  <div class="points-overview">
    <el-card class="points-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h3 class="title">
            <el-icon>
              <Coin />
            </el-icon>
            积分概览
          </h3>
          <el-button link @click="$emit('view-history')" class="view-history-btn">
            查看详情
            <el-icon>
              <ArrowRight />
            </el-icon>
          </el-button>
        </div>
      </template>

      <div class="points-content">
        <!-- 当前积分 -->
        <div class="current-points">
          <div class="points-number">{{ pointsData.currentPoints }}</div>
          <div class="points-label">当前积分</div>
        </div>

        <!-- 积分统计 -->
        <div class="points-stats">
          <div class="stat-row">
            <div class="stat-item">
              <div class="stat-value">{{ pointsData.stats?.dailyEarned || 0 }}</div>
              <div class="stat-label">今日获得</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ pointsData.stats?.monthlyEarned || 0 }}</div>
              <div class="stat-label">本月获得</div>
            </div>
          </div>
          <div class="stat-row">
            <div class="stat-item">
              <div class="stat-value">{{ pointsData.stats?.totalEarned || 0 }}</div>
              <div class="stat-label">累计获得</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ pointsData.stats?.totalSpent || 0 }}</div>
              <div class="stat-label">累计消费</div>
            </div>
          </div>
        </div>

        <!-- 积分来源分布 -->
        <div v-if="pointsData.stats?.pointsByType?.length" class="points-sources">
          <h4>积分来源</h4>
          <div class="source-list">
            <div v-for="source in pointsData.stats.pointsByType" :key="source.type" class="source-item">
              <div class="source-info">
                <span class="source-name">{{ getTypeName(source.type) }}</span>
                <span class="source-count">({{ source._count._all }}次)</span>
              </div>
              <div class="source-points">+{{ source._sum.points || 0 }}</div>
            </div>
          </div>
        </div>

        <!-- 最近积分记录 -->
        <div v-if="pointsData.recentHistory?.length" class="recent-history">
          <h4>最近记录</h4>
          <div class="history-list">
            <div v-for="record in pointsData.recentHistory.slice(0, 3)" :key="record.id" class="history-item">
              <div class="history-info">
                <div class="history-desc">{{ record.description || getTypeName(record.type) }}</div>
                <div class="history-time">{{ formatTime(record.createdAt) }}</div>
              </div>
              <div class="history-points" :class="{ 'positive': record.points > 0, 'negative': record.points < 0 }">
                {{ record.points > 0 ? '+' : '' }}{{ record.points }}
              </div>
            </div>
          </div>
        </div>

        <!-- 积分趋势图 -->
        <div v-if="pointsData.stats?.weeklyTrend?.length" class="points-trend">
          <h4>7天趋势</h4>
          <div class="trend-chart">
            <div v-for="(day, index) in pointsData.stats.weeklyTrend" :key="day.date" class="trend-bar">
              <div class="bar" :style="{ height: getTrendBarHeight(day.points) }"></div>
              <div class="bar-label">{{ formatTrendDate(day.date, index) }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Coin, ArrowRight } from '@element-plus/icons-vue'

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

<style scoped>
.points-overview {
  max-width: 600px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #303133;
}

.view-history-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
}

.current-points {
  text-align: center;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.points-number {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 8px;
}

.points-label {
  font-size: 16px;
  opacity: 0.9;
}

.points-stats {
  margin-bottom: 24px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.stat-row:last-child {
  margin-bottom: 0;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 16px;
  background: #F8F9FA;
  border-radius: 8px;
  margin: 0 8px;
}

.stat-item:first-child {
  margin-left: 0;
}

.stat-item:last-child {
  margin-right: 0;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.points-sources,
.recent-history {
  margin-bottom: 24px;
}

.points-sources h4,
.recent-history h4,
.points-trend h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
}

.source-list,
.history-list {
  space-y: 8px;
}

.source-item,
.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #F8F9FA;
  border-radius: 6px;
  margin-bottom: 8px;
}

.source-info,
.history-info {
  flex: 1;
}

.source-name {
  font-weight: 500;
  color: #303133;
}

.source-count {
  color: #909399;
  font-size: 12px;
  margin-left: 4px;
}

.source-points {
  color: #67C23A;
  font-weight: bold;
}

.history-desc {
  color: #303133;
  margin-bottom: 4px;
}

.history-time {
  color: #909399;
  font-size: 12px;
}

.history-points {
  font-weight: bold;
}

.history-points.positive {
  color: #67C23A;
}

.history-points.negative {
  color: #F56C6C;
}

.points-trend {
  margin-bottom: 0;
}

.trend-chart {
  display: flex;
  align-items: end;
  justify-content: space-between;
  height: 80px;
  padding: 0 8px;
  background: #F8F9FA;
  border-radius: 8px;
}

.trend-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  padding: 8px 4px;
}

.bar {
  width: 20px;
  background: linear-gradient(to top, #409EFF, #67C23A);
  border-radius: 2px 2px 0 0;
  margin-bottom: 8px;
  min-height: 2px;
}

.bar-label {
  font-size: 10px;
  color: #909399;
  text-align: center;
}
</style>
