<template>
  <article
    class="flex min-h-[220px] flex-col rounded-xl border border-gray-200 bg-white p-5 transition-colors duration-200 hover:border-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex min-w-0 items-start gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xl text-blue-600 dark:bg-blue-900/30 dark:text-blue-200">
          <i class="fa-regular fa-calendar"></i>
        </div>
        <div class="min-w-0">
          <h3 class="m-0 text-base font-semibold leading-6 text-gray-950 dark:text-white">
            每日签到
          </h3>
          <p class="m-0 mt-1 max-w-[360px] text-sm leading-6 text-gray-500 dark:text-gray-400">
            每天领取永久积分，连续签到会获得额外奖励。
          </p>
        </div>
      </div>
      <span
        :class="[
          'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
          checkInStatus.hasCheckedInToday
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
            : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
        ]"
      >
        {{ checkInStatus.hasCheckedInToday ? `已领取 ${checkInStatus.todayCheckIn?.points || 0} 积分` : `+${baseCheckInPoints} 积分` }}
      </span>
    </div>

    <div class="mt-4 grid grid-cols-3 gap-3 text-sm">
      <div>
        <div class="font-semibold text-gray-950 dark:text-white">{{ checkInStatus.currentConsecutiveDays }} 天</div>
        <div class="mt-1 text-gray-500 dark:text-gray-400">连续签到</div>
      </div>
      <div>
        <div class="font-semibold text-gray-950 dark:text-white">{{ checkInStatus.monthlyCheckInCount }} 次</div>
        <div class="mt-1 text-gray-500 dark:text-gray-400">本月完成</div>
      </div>
      <div>
        <div class="font-semibold text-gray-950 dark:text-white">{{ displayCurrentPoints }}</div>
        <div class="mt-1 text-gray-500 dark:text-gray-400">有效积分</div>
      </div>
    </div>

    <div class="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-h-[40px] text-sm leading-6 text-gray-500 dark:text-gray-400">
        <template v-if="checkInStatus.nextReward">
          连续签到 {{ checkInStatus.nextReward.days }} 天可额外获得 {{ checkInStatus.nextReward.points }} 积分。
        </template>
        <template v-else>
          继续保持签到，永久积分会累计到账号余额。
        </template>
      </div>
      <div class="shrink-0">
        <button
          v-if="checkInStatus.hasCheckedInToday"
          class="inline-flex min-h-10 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
          type="button"
          disabled
        >
          <i class="fa-solid fa-circle-check"></i>
          今日已完成
        </button>
        <button
          v-else
          class="inline-flex min-h-10 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          type="button"
          :disabled="isCheckingIn"
          @click="handleCheckIn"
        >
          <i :class="isCheckingIn ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-star'"></i>
          {{ isCheckingIn ? '签到中' : '立即签到' }}
        </button>
      </div>
    </div>
  </article>

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
          <p class="text-blue-600 dark:text-blue-400 font-semibold m-0 mb-2">{{ lastCheckInResult?.bonusDescription
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
import { computed, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

import { useUserStore } from '~/stores/user'

const userStore = useUserStore()
const { refreshAccessControlConfig } = useAccessControlConfig()
const emit = defineEmits(['checked-in', 'status-loaded'])
const baseCheckInPoints = 10

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
const hasMounted = ref(false)
const hasLoadedStatus = ref(false)

const displayCurrentPoints = computed(() => {
  if (hasLoadedStatus.value) {
    return Number(checkInStatus.value.currentPoints || 0)
  }
  if (hasMounted.value && userStore.user?.points !== undefined) {
    return Number(userStore.user.points || 0)
  }
  return '—'
})

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
      hasLoadedStatus.value = true
      emit('status-loaded', response.data)
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
        userStore.user.permanentPoints = response.data.permanentPoints
        userStore.user.temporaryPoints = response.data.temporaryPoints
        userStore.user.effectivePoints = response.data.effectivePoints
        userStore.user.nextExpiringAt = response.data.nextExpiringAt
        userStore.user.pointsBreakdown = response.data.pointsBreakdown
      }
      refreshAccessControlConfig().catch(error => {
        console.warn('Failed to refresh access control config after points change:', error)
      })

      // 刷新签到状态
      await fetchCheckInStatus()
      emit('checked-in', response.data)

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
  hasMounted.value = true
  fetchCheckInStatus()
})
</script>
