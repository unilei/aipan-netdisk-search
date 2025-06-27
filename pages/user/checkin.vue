<template>
  <div class="checkin-page">
    <div class="container">
      <div class="page-header">
        <h1>签到中心</h1>
        <p>每日签到获得积分，连续签到有额外奖励</p>
      </div>

      <div class="checkin-layout">
        <!-- 左侧：签到卡片和积分概览 -->
        <div class="left-section">
          <UserCheckInCard class="checkin-card-section" />
          <UserPointsOverview ref="pointsOverviewRef" class="points-overview-section"
            @view-history="activeTab = 'points-history'" />
        </div>

        <!-- 右侧：历史记录 -->
        <div class="right-section">
          <el-card class="history-card" shadow="hover">
            <template #header>
              <el-tabs v-model="activeTab" class="history-tabs">
                <el-tab-pane label="签到历史" name="checkin-history">
                  <template #label>
                    <span class="tab-label">
                      <el-icon>
                        <Calendar />
                      </el-icon>
                      签到历史
                    </span>
                  </template>
                </el-tab-pane>
                <el-tab-pane label="积分记录" name="points-history">
                  <template #label>
                    <span class="tab-label">
                      <el-icon>
                        <Coin />
                      </el-icon>
                      积分记录
                    </span>
                  </template>
                </el-tab-pane>
              </el-tabs>
            </template>

            <!-- 签到历史 -->
            <div v-if="activeTab === 'checkin-history'" class="checkin-history">
              <!-- 月份选择器 -->
              <div class="month-selector">
                <el-date-picker v-model="selectedMonth" type="month" placeholder="选择月份" format="YYYY年MM月"
                  value-format="YYYY-MM" @change="fetchCheckInHistory" />
              </div>

              <!-- 月度统计 -->
              <div v-if="checkInHistory.monthStats" class="month-stats">
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-number">{{ checkInHistory.monthStats.checkInCount }}</div>
                    <div class="stat-label">签到天数</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-number">{{ checkInHistory.monthStats.totalPoints }}</div>
                    <div class="stat-label">获得积分</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-number">{{ checkInHistory.monthStats.maxConsecutiveDays }}</div>
                    <div class="stat-label">最长连续</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-number">{{ checkInHistory.monthStats.checkInRate }}%</div>
                    <div class="stat-label">签到率</div>
                  </div>
                </div>
              </div>

              <!-- 签到记录列表 -->
              <div class="checkin-list">
                <div v-if="checkInHistory.checkIns?.length === 0" class="empty-state">
                  <el-empty description="本月暂无签到记录" />
                </div>
                <div v-else>
                  <div v-for="checkIn in checkInHistory.checkIns" :key="checkIn.id" class="checkin-item">
                    <div class="checkin-date">
                      <div class="date-number">{{ formatDate(checkIn.checkInDate, 'DD') }}</div>
                      <div class="date-text">{{ formatDate(checkIn.checkInDate, 'MM/DD') }}</div>
                    </div>
                    <div class="checkin-info">
                      <div class="checkin-points">+{{ checkIn.points }} 积分</div>
                      <div class="checkin-consecutive">连续 {{ checkIn.consecutiveDays }} 天</div>
                    </div>
                    <div class="checkin-status">
                      <el-icon class="success-icon">
                        <CircleCheck />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 分页 -->
              <div v-if="checkInHistory.pagination?.totalPages > 1" class="pagination">
                <el-pagination v-model:current-page="checkInPage" :page-size="checkInHistory.pagination.limit"
                  :total="checkInHistory.pagination.total" layout="prev, pager, next"
                  @current-change="fetchCheckInHistory" />
              </div>
            </div>

            <!-- 积分记录 -->
            <div v-if="activeTab === 'points-history'" class="points-history">
              <!-- 筛选器 -->
              <div class="history-filters">
                <el-select v-model="pointsFilter.type" placeholder="积分类型" clearable @change="fetchPointsHistory">
                  <el-option label="全部" value="" />
                  <el-option label="每日签到" value="checkin" />
                  <el-option label="连续签到奖励" value="bonus" />
                  <el-option label="积分消费" value="consume" />
                  <el-option label="管理员调整" value="admin" />
                </el-select>

                <el-date-picker v-model="pointsFilter.dateRange" type="daterange" range-separator="至"
                  start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY/MM/DD" value-format="YYYY-MM-DD"
                  @change="fetchPointsHistory" />
              </div>

              <!-- 积分记录列表 -->
              <div class="points-list">
                <div v-if="pointsHistory.history?.length === 0" class="empty-state">
                  <el-empty description="暂无积分记录" />
                </div>
                <div v-else>
                  <div v-for="record in pointsHistory.history" :key="record.id" class="points-item">
                    <div class="points-info">
                      <div class="points-desc">{{ record.description || getTypeName(record.type) }}</div>
                      <div class="points-time">{{ formatDateTime(record.createdAt) }}</div>
                    </div>
                    <div class="points-amount"
                      :class="{ 'positive': record.points > 0, 'negative': record.points < 0 }">
                      {{ record.points > 0 ? '+' : '' }}{{ record.points }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 分页 -->
              <div v-if="pointsHistory.pagination?.totalPages > 1" class="pagination">
                <el-pagination v-model:current-page="pointsPage" :page-size="pointsHistory.pagination.limit"
                  :total="pointsHistory.pagination.total" layout="prev, pager, next"
                  @current-change="fetchPointsHistory" />
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Calendar, Coin, CircleCheck } from '@element-plus/icons-vue'
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

<style scoped>
.checkin-page {
  min-height: 100vh;
  background: #F5F7FA;
  padding: 20px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 28px;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 16px;
}

.checkin-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.left-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.checkin-card-section,
.points-overview-section {
  width: 100%;
}

.right-section {
  width: 100%;
}

.history-card {
  min-height: 600px;
}

.history-tabs {
  margin: -20px -20px 0 -20px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.month-selector {
  margin-bottom: 20px;
}

.month-stats {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  text-align: center;
  padding: 16px;
  background: #F8F9FA;
  border-radius: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.checkin-list,
.points-list {
  max-height: 400px;
  overflow-y: auto;
}

.checkin-item,
.points-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #EBEEF5;
  transition: background-color 0.2s;
}

.checkin-item:hover,
.points-item:hover {
  background: #F8F9FA;
}

.checkin-item:last-child,
.points-item:last-child {
  border-bottom: none;
}

.checkin-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 16px;
  min-width: 60px;
}

.date-number {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
}

.date-text {
  font-size: 12px;
  color: #909399;
}

.checkin-info {
  flex: 1;
}

.checkin-points {
  font-weight: bold;
  color: #67C23A;
  margin-bottom: 4px;
}

.checkin-consecutive {
  font-size: 14px;
  color: #909399;
}

.checkin-status {
  margin-left: 16px;
}

.success-icon {
  color: #67C23A;
  font-size: 20px;
}

.history-filters {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.points-info {
  flex: 1;
}

.points-desc {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.points-time {
  font-size: 12px;
  color: #909399;
}

.points-amount {
  font-size: 18px;
  font-weight: bold;
  margin-left: 16px;
}

.points-amount.positive {
  color: #67C23A;
}

.points-amount.negative {
  color: #F56C6C;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .checkin-layout {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .history-filters {
    flex-direction: column;
  }

  .checkin-item,
  .points-item {
    padding: 12px;
  }
}
</style>
