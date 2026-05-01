<template>
  <div class="min-h-[calc(100vh-60px)] bg-gray-50 py-6 dark:bg-gray-900 md:py-8">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mb-6 flex flex-col gap-2 md:mb-8">
        <h1 class="m-0 text-2xl font-semibold tracking-normal text-gray-950 dark:text-white md:text-3xl">
          积分中心
        </h1>
        <p class="m-0 text-sm text-gray-600 dark:text-gray-400">
          签到获得永久积分，完成网盘转存验证获得限时积分。
        </p>
      </div>

      <div class="space-y-6">
        <UserPointsOverview
          ref="pointsOverviewRef"
          @view-history="activeTab = 'points-history'"
          @transfer="handleTransferTask"
        />

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <UserCheckInCard @checked-in="handlePointsChanged" />

          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="border-b border-gray-200 dark:border-gray-700">
              <nav class="flex px-6" aria-label="Tabs">
                <button
                  :class="[
                    'mr-8 border-b-2 px-1 py-4 text-sm font-medium transition-colors duration-200',
                    activeTab === 'checkin-history'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  ]"
                  type="button"
                  @click="activeTab = 'checkin-history'"
                >
                  <span class="inline-flex items-center gap-2">
                    <i class="fa-solid fa-calendar-days"></i>
                    签到历史
                  </span>
                </button>

                <button
                  :class="[
                    'border-b-2 px-1 py-4 text-sm font-medium transition-colors duration-200',
                    activeTab === 'points-history'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  ]"
                  type="button"
                  @click="activeTab = 'points-history'"
                >
                  <span class="inline-flex items-center gap-2">
                    <i class="fa-solid fa-coins"></i>
                    积分记录
                  </span>
                </button>
              </nav>
            </div>

            <div v-if="activeTab === 'checkin-history'" class="p-6">
              <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 class="m-0 text-base font-semibold text-gray-950 dark:text-white">签到历史</h2>
                  <p class="m-0 mt-1 text-sm text-gray-500 dark:text-gray-400">按月份查看签到次数、积分和连续天数。</p>
                </div>
                <el-date-picker
                  v-model="selectedMonth"
                  type="month"
                  placeholder="选择月份"
                  format="YYYY年MM月"
                  value-format="YYYY-MM"
                  class="w-full sm:w-auto"
                  @change="fetchCheckInHistory"
                />
              </div>

              <div v-if="checkInHistory.monthStats" class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/40">
                  <div class="text-xs text-gray-500 dark:text-gray-400">签到天数</div>
                  <div class="mt-1 text-xl font-semibold text-gray-950 dark:text-white">
                    {{ checkInHistory.monthStats.checkInCount }}
                  </div>
                </div>
                <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/40">
                  <div class="text-xs text-gray-500 dark:text-gray-400">获得积分</div>
                  <div class="mt-1 text-xl font-semibold text-gray-950 dark:text-white">
                    {{ checkInHistory.monthStats.totalPoints }}
                  </div>
                </div>
                <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/40">
                  <div class="text-xs text-gray-500 dark:text-gray-400">最长连续</div>
                  <div class="mt-1 text-xl font-semibold text-gray-950 dark:text-white">
                    {{ checkInHistory.monthStats.maxConsecutiveDays }}
                  </div>
                </div>
                <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/40">
                  <div class="text-xs text-gray-500 dark:text-gray-400">签到率</div>
                  <div class="mt-1 text-xl font-semibold text-gray-950 dark:text-white">
                    {{ checkInHistory.monthStats.checkInRate }}%
                  </div>
                </div>
              </div>

              <div class="max-h-[520px] space-y-2 overflow-y-auto">
                <div v-if="checkInHistory.checkIns?.length === 0" class="rounded-lg border border-dashed border-gray-300 py-12 text-center dark:border-gray-700">
                  <p class="m-0 text-gray-500 dark:text-gray-400">本月暂无签到记录</p>
                </div>

                <template v-else>
                  <div
                    v-for="checkIn in checkInHistory.checkIns"
                    :key="checkIn.id"
                    class="flex items-center rounded-lg bg-gray-50 p-4 transition-colors duration-200 hover:bg-gray-100 dark:bg-gray-900/40 dark:hover:bg-gray-700"
                  >
                    <div class="mr-4 flex min-w-[56px] flex-col items-center">
                      <div class="text-lg font-semibold text-gray-950 dark:text-white">
                        {{ formatDate(checkIn.checkInDate, 'DD') }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ formatDate(checkIn.checkInDate, 'MM/DD') }}
                      </div>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="font-semibold text-emerald-600 dark:text-emerald-300">+{{ checkIn.points }} 积分</div>
                      <div class="mt-1 text-sm text-gray-500 dark:text-gray-400">连续 {{ checkIn.consecutiveDays }} 天</div>
                    </div>
                    <i class="fa-solid fa-circle-check text-emerald-500 dark:text-emerald-300"></i>
                  </div>
                </template>
              </div>

              <div v-if="checkInHistory.pagination?.totalPages > 1" class="mt-6 flex justify-center">
                <el-pagination
                  v-model:current-page="checkInPage"
                  :page-size="checkInHistory.pagination.limit"
                  :total="checkInHistory.pagination.total"
                  layout="prev, pager, next"
                  class="pagination-custom"
                  @current-change="fetchCheckInHistory"
                />
              </div>
            </div>

            <div v-if="activeTab === 'points-history'" class="p-6">
              <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 class="m-0 text-base font-semibold text-gray-950 dark:text-white">积分记录</h2>
                  <p class="m-0 mt-1 text-sm text-gray-500 dark:text-gray-400">筛选不同来源，查看永久和限时积分明细。</p>
                </div>
                <div class="flex flex-col gap-3 sm:flex-row">
                  <el-select
                    v-model="pointsFilter.type"
                    placeholder="积分类型"
                    clearable
                    class="w-full sm:w-44"
                    @change="fetchPointsHistory"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="每日签到" value="checkin" />
                    <el-option label="连续签到奖励" value="bonus" />
                    <el-option label="转存奖励" value="transfer" />
                    <el-option label="积分消费" value="consume" />
                    <el-option label="管理员调整" value="admin" />
                  </el-select>

                  <el-date-picker
                    v-model="pointsFilter.dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    format="YYYY/MM/DD"
                    value-format="YYYY-MM-DD"
                    class="w-full sm:w-auto"
                    @change="fetchPointsHistory"
                  />
                </div>
              </div>

              <div class="max-h-[520px] space-y-2 overflow-y-auto">
                <div v-if="pointsHistory.history?.length === 0" class="rounded-lg border border-dashed border-gray-300 py-12 text-center dark:border-gray-700">
                  <p class="m-0 text-gray-500 dark:text-gray-400">暂无积分记录</p>
                </div>

                <template v-else>
                  <div
                    v-for="record in pointsHistory.history"
                    :key="record.id"
                    class="flex items-center justify-between rounded-lg bg-gray-50 p-4 transition-colors duration-200 hover:bg-gray-100 dark:bg-gray-900/40 dark:hover:bg-gray-700"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="font-medium text-gray-950 dark:text-white">
                          {{ record.description || getTypeName(record.type) }}
                        </span>
                        <span class="rounded-md bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                          {{ record.typeName || getTypeName(record.type) }}
                        </span>
                        <span
                          v-if="record.isTemporary"
                          :class="[
                            'rounded-md px-2 py-0.5 text-xs font-medium',
                            record.isExpired
                              ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
                          ]"
                        >
                          {{ record.isExpired ? '已过期' : '限时积分' }}
                        </span>
                      </div>
                      <div class="mt-1 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span>{{ formatDateTime(record.createdAt) }}</span>
                        <span v-if="record.isTemporary && record.expiresAt">有效至 {{ formatDateTime(record.expiresAt) }}</span>
                      </div>
                    </div>
                    <div
                      class="ml-4 text-lg font-semibold"
                      :class="record.points >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'"
                    >
                      {{ record.points > 0 ? '+' : '' }}{{ record.points }}
                    </div>
                  </div>
                </template>
              </div>

              <div v-if="pointsHistory.pagination?.totalPages > 1" class="mt-6 flex justify-center">
                <el-pagination
                  v-model:current-page="pointsPage"
                  :page-size="pointsHistory.pagination.limit"
                  :total="pointsHistory.pagination.total"
                  layout="prev, pager, next"
                  class="pagination-custom"
                  @current-change="fetchPointsHistory"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'

import UserCheckInCard from '~/components/user/CheckInCard.vue'
import UserPointsOverview from '~/components/user/PointsOverview.vue'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const activeTab = ref('checkin-history')
const selectedMonth = ref(new Date().toISOString().slice(0, 7))
const checkInPage = ref(1)
const pointsPage = ref(1)
const pointsOverviewRef = ref(null)

const checkInHistory = ref({
  checkIns: [],
  pagination: null,
  monthStats: null
})

const pointsHistory = ref({
  history: [],
  pagination: null,
  stats: null
})

const pointsFilter = ref({
  type: '',
  dateRange: null
})

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
        Authorization: `Bearer ${useCookie('token').value}`
      }
    })

    if (response.code === 200) {
      checkInHistory.value = response.data
    }
  } catch (error) {
    console.error('获取签到历史失败:', error)
  }
}

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
        Authorization: `Bearer ${useCookie('token').value}`
      }
    })

    if (response.code === 200) {
      pointsHistory.value = response.data
    }
  } catch (error) {
    console.error('获取积分历史失败:', error)
  }
}

const handlePointsChanged = async () => {
  await pointsOverviewRef.value?.refresh?.()
  await fetchCheckInHistory()
  if (activeTab.value === 'points-history') {
    await fetchPointsHistory()
  }
}

const handleTransferTask = () => {
  navigateTo('/quark-verification?purpose=points&redirect=/user/checkin')
}

const formatDate = (dateString, format) => {
  const date = new Date(dateString)
  if (format === 'DD') {
    return date.getDate().toString().padStart(2, '0')
  }
  if (format === 'MM/DD') {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`
  }
  return date.toLocaleDateString()
}

const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString()
}

const getTypeName = (type) => {
  const typeNames = {
    checkin: '每日签到',
    bonus: '连续签到奖励',
    consume: '积分消费',
    admin: '管理员调整',
    activity: '活动奖励',
    task: '任务奖励',
    transfer: '转存奖励'
  }
  return typeNames[type] || type
}

watch(activeTab, (newTab) => {
  if (newTab === 'checkin-history') {
    fetchCheckInHistory()
  } else if (newTab === 'points-history') {
    fetchPointsHistory()
  }
})

onMounted(() => {
  fetchCheckInHistory()
})
</script>
