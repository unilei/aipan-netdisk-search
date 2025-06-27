<template>
  <div class="checkin-card">
    <el-card class="checkin-main-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h3 class="title">
            <el-icon><Calendar /></el-icon>
            每日签到
          </h3>
          <div class="points-display">
            <span class="points-label">当前积分：</span>
            <span class="points-value">{{ userStore.user?.points || 0 }}</span>
          </div>
        </div>
      </template>

      <div class="checkin-content">
        <!-- 签到状态 -->
        <div class="checkin-status">
          <div v-if="checkInStatus.hasCheckedInToday" class="checked-in">
            <el-icon class="success-icon" size="48"><CircleCheck /></el-icon>
            <h4>今日已签到</h4>
            <p>获得了 {{ checkInStatus.todayCheckIn?.points || 0 }} 积分</p>
          </div>
          <div v-else class="not-checked-in">
            <el-button 
              type="primary" 
              size="large" 
              :loading="isCheckingIn"
              @click="handleCheckIn"
              class="checkin-btn"
            >
              <el-icon><Star /></el-icon>
              立即签到
            </el-button>
            <p class="checkin-tip">签到可获得积分奖励</p>
          </div>
        </div>

        <!-- 签到统计 -->
        <div class="checkin-stats">
          <div class="stat-item">
            <div class="stat-number">{{ checkInStatus.currentConsecutiveDays }}</div>
            <div class="stat-label">连续签到</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ checkInStatus.monthlyCheckInCount }}</div>
            <div class="stat-label">本月签到</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ checkInStatus.totalCheckInCount }}</div>
            <div class="stat-label">累计签到</div>
          </div>
        </div>

        <!-- 下一个奖励提示 -->
        <div v-if="checkInStatus.nextReward" class="next-reward">
          <el-alert
            :title="`连续签到${checkInStatus.nextReward.days}天可获得额外${checkInStatus.nextReward.points}积分`"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
      </div>
    </el-card>

    <!-- 签到成功弹窗 -->
    <el-dialog
      v-model="showSuccessDialog"
      title="签到成功"
      width="400px"
      align-center
    >
      <div class="success-content">
        <el-icon class="success-icon-large" size="64" color="#67C23A"><CircleCheck /></el-icon>
        <h3>签到成功！</h3>
        <div class="reward-info">
          <p>获得积分：<span class="highlight">+{{ lastCheckInResult?.earnedPoints || 0 }}</span></p>
          <p>当前积分：<span class="highlight">{{ lastCheckInResult?.totalPoints || 0 }}</span></p>
          <p>连续签到：<span class="highlight">{{ lastCheckInResult?.consecutiveDays || 0 }}天</span></p>
          <div v-if="lastCheckInResult?.bonusPoints > 0" class="bonus-info">
            <p class="bonus-text">🎉 {{ lastCheckInResult?.bonusDescription }}</p>
            <p>额外奖励：<span class="highlight">+{{ lastCheckInResult?.bonusPoints }}</span></p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showSuccessDialog = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Calendar, CircleCheck, Star } from '@element-plus/icons-vue'
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()

// 响应式数据
const checkInStatus = ref({
  hasCheckedInToday: false,
  todayCheckIn: null,
  currentConsecutiveDays: 0,
  monthlyCheckInCount: 0,
  totalCheckInCount: 0,
  currentPoints: 0,
  nextReward: null
})

const isCheckingIn = ref(false)
const showSuccessDialog = ref(false)
const lastCheckInResult = ref(null)

// 获取签到状态
const fetchCheckInStatus = async () => {
  try {
    const response = await $fetch('/api/user/checkin/status', {
      headers: {
        'Authorization': `Bearer ${useCookie('token').value}`
      }
    })
    
    if (response.code === 200) {
      checkInStatus.value = response.data
    }
  } catch (error) {
    console.error('获取签到状态失败:', error)
  }
}

// 执行签到
const handleCheckIn = async () => {
  if (isCheckingIn.value) return
  
  isCheckingIn.value = true
  
  try {
    const response = await $fetch('/api/user/checkin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${useCookie('token').value}`
      }
    })
    
    if (response.code === 200) {
      lastCheckInResult.value = response.data
      showSuccessDialog.value = true
      
      // 更新用户积分
      if (userStore.user) {
        userStore.user.points = response.data.totalPoints
      }
      
      // 刷新签到状态
      await fetchCheckInStatus()
      
      ElMessage.success('签到成功！')
    } else {
      ElMessage.error(response.msg || '签到失败')
    }
  } catch (error) {
    console.error('签到失败:', error)
    ElMessage.error('签到失败，请稍后重试')
  } finally {
    isCheckingIn.value = false
  }
}

// 组件挂载时获取签到状态
onMounted(() => {
  fetchCheckInStatus()
})
</script>

<style scoped>
.checkin-card {
  max-width: 500px;
  margin: 0 auto;
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

.points-display {
  display: flex;
  align-items: center;
  gap: 4px;
}

.points-label {
  color: #909399;
  font-size: 14px;
}

.points-value {
  color: #E6A23C;
  font-weight: bold;
  font-size: 16px;
}

.checkin-content {
  text-align: center;
}

.checkin-status {
  margin-bottom: 24px;
}

.checked-in {
  padding: 20px;
}

.success-icon {
  color: #67C23A;
  margin-bottom: 12px;
}

.checked-in h4 {
  margin: 8px 0;
  color: #67C23A;
}

.checked-in p {
  color: #909399;
  margin: 0;
}

.not-checked-in {
  padding: 20px;
}

.checkin-btn {
  margin-bottom: 12px;
  padding: 12px 24px;
  font-size: 16px;
}

.checkin-tip {
  color: #909399;
  margin: 0;
  font-size: 14px;
}

.checkin-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
  border-top: 1px solid #EBEEF5;
  border-bottom: 1px solid #EBEEF5;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
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

.next-reward {
  margin-top: 16px;
}

.success-content {
  text-align: center;
  padding: 20px;
}

.success-icon-large {
  margin-bottom: 16px;
}

.success-content h3 {
  margin: 0 0 20px 0;
  color: #303133;
}

.reward-info p {
  margin: 8px 0;
  color: #606266;
}

.highlight {
  color: #E6A23C;
  font-weight: bold;
}

.bonus-info {
  margin-top: 16px;
  padding: 12px;
  background: #F0F9FF;
  border-radius: 6px;
}

.bonus-text {
  color: #409EFF;
  font-weight: bold;
}
</style>
