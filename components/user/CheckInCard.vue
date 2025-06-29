<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <!-- 卡片头部 -->
    <div
      class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex justify-between items-center">
        <h3 class="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100 m-0">
          <i class="fa-solid fa-calendar-days text-blue-600 dark:text-blue-400"></i>
          每日签到
        </h3>
        <div class="flex items-center gap-1">
          <span class="text-sm text-gray-500 dark:text-gray-400">当前积分：</span>
          <span class="text-lg font-bold text-orange-500 dark:text-orange-400">{{ userStore.user?.points || 0 }}</span>
        </div>
      </div>
    </div>

    <div class="p-6">
      <!-- 签到状态 -->
      <div class="text-center mb-6">
        <div v-if="checkInStatus.hasCheckedInToday" class="py-8">
          <i class="fa-solid fa-circle-check text-green-500 dark:text-green-400 mb-4 text-5xl"></i>
          <h4 class="text-xl font-semibold text-green-600 dark:text-green-400 mb-2 m-0">今日已签到</h4>
          <p class="text-gray-500 dark:text-gray-400 m-0">获得了 {{ checkInStatus.todayCheckIn?.points || 0 }} 积分</p>
        </div>
        <div v-else class="py-8">
          <el-button type="primary" size="large" :loading="isCheckingIn" @click="handleCheckIn"
            class="mb-3 px-8 py-3 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <i class="fa-solid fa-star mr-2"></i>
            立即签到
          </el-button>
          <p class="text-gray-500 dark:text-gray-400 text-sm m-0">签到可获得积分奖励</p>
        </div>
      </div>

      <!-- 签到统计 -->
      <div class="grid grid-cols-3 gap-4 py-6 border-t border-b border-gray-200 dark:border-gray-700 mb-6">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">{{ checkInStatus.currentConsecutiveDays
            }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">连续签到</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">{{ checkInStatus.monthlyCheckInCount }}
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">本月签到</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">{{ checkInStatus.totalCheckInCount }}
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">累计签到</div>
        </div>
      </div>

      <!-- 下一个奖励提示 -->
      <div v-if="checkInStatus.nextReward"
        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <i class="fa-solid fa-star text-blue-600 dark:text-blue-400 text-lg"></i>
          <span class="text-blue-800 dark:text-blue-200 font-medium">
            连续签到{{ checkInStatus.nextReward.days }}天可获得额外{{ checkInStatus.nextReward.points }}积分
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- 签到成功弹窗 -->
  <el-dialog v-model="showSuccessDialog" title="签到成功" width="400px" align-center>
    <div class="text-center py-6">
      <i class="fa-solid fa-circle-check text-green-500 mb-4 text-6xl"></i>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 m-0">签到成功！</h3>
      <div class="space-y-3">
        <p class="text-gray-600 dark:text-gray-400 m-0">
          获得积分：<span class="text-orange-500 dark:text-orange-400 font-bold">+{{ lastCheckInResult?.earnedPoints || 0
          }}</span>
        </p>
        <p class="text-gray-600 dark:text-gray-400 m-0">
          当前积分：<span class="text-orange-500 dark:text-orange-400 font-bold">{{ lastCheckInResult?.totalPoints || 0
          }}</span>
        </p>
        <p class="text-gray-600 dark:text-gray-400 m-0">
          连续签到：<span class="text-orange-500 dark:text-orange-400 font-bold">{{ lastCheckInResult?.consecutiveDays || 0
          }}天</span>
        </p>
        <div v-if="lastCheckInResult?.bonusPoints > 0"
          class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg">
          <p class="text-blue-600 dark:text-blue-400 font-semibold m-0 mb-2">🎉 {{ lastCheckInResult?.bonusDescription
          }}</p>
          <p class="text-gray-600 dark:text-gray-400 m-0">
            额外奖励：<span class="text-orange-500 dark:text-orange-400 font-bold">+{{ lastCheckInResult?.bonusPoints
            }}</span>
          </p>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button type="primary" @click="showSuccessDialog = false">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

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
