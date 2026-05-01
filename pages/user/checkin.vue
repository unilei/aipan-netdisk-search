<template>
  <div class="min-h-[calc(100vh-60px)] overflow-x-hidden bg-gray-50 py-5 dark:bg-gray-950 md:py-6">
    <div class="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
      <div class="mb-5">
        <div class="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          <button
            class="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            type="button"
            aria-label="返回首页"
            @click="navigateTo('/')"
          >
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <span>积分中心</span>
          <i class="fa-solid fa-angle-right text-xs"></i>
          <span class="text-gray-950 dark:text-white">获取积分</span>
        </div>

        <div class="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-5 dark:border-gray-800 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 class="m-0 text-2xl font-semibold tracking-normal text-gray-950 dark:text-white md:text-3xl">
              积分中心
            </h1>
            <p class="m-0 mt-2 text-sm text-gray-500 dark:text-gray-400">
              签到获得永久积分，转存验证获得限时积分。
            </p>
          </div>
          <span
            :class="[
              'inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium',
              checkInStatusSnapshot?.hasCheckedInToday
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
            ]"
          >
            <i :class="checkInStatusSnapshot?.hasCheckedInToday ? 'fa-solid fa-circle-check' : 'fa-regular fa-calendar'"></i>
            {{ checkInStatusSnapshot?.hasCheckedInToday ? '今日已签到' : '今日待签到' }}
          </span>
        </div>
      </div>

      <div class="space-y-6">
        <section class="rounded-xl bg-gray-100/80 p-4 dark:bg-gray-900/50 md:p-5">
          <div class="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 class="m-0 text-lg font-semibold text-gray-950 dark:text-white">获取积分</h2>
              <p class="m-0 mt-1 text-sm text-gray-500 dark:text-gray-400">选择一个任务完成，积分会自动更新到账号。</p>
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ taskSummaryText }}</span>
          </div>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <UserCheckInCard
              @checked-in="handlePointsChanged"
              @status-loaded="handleCheckInStatusLoaded"
            />

            <article class="flex min-h-[220px] flex-col rounded-xl border border-gray-200 bg-white p-5 transition-colors duration-200 hover:border-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700">
              <div class="flex items-start justify-between gap-4">
                <div class="flex min-w-0 items-start gap-4">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xl text-blue-600 dark:bg-blue-900/30 dark:text-blue-200">
                    <i class="fa-solid fa-cloud-arrow-up"></i>
                  </div>
                  <div class="min-w-0">
                    <h3 class="m-0 text-base font-semibold leading-6 text-gray-950 dark:text-white">转存验证</h3>
                    <p class="m-0 mt-1 max-w-[360px] text-sm leading-6 text-gray-500 dark:text-gray-400">
                      转存指定资源并提交分享链接，验证通过后获得限时积分。
                    </p>
                  </div>
                </div>
                <span
                  :class="[
                    'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                    transferTask.enabled
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  ]"
                >
                  {{ transferTaskLabel }}
                </span>
              </div>

              <div class="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-end sm:justify-between">
                <div class="text-sm leading-6 text-gray-500 dark:text-gray-400">
                  有效期 {{ transferDurationLabel }}，同一次转存不会重复奖励。
                </div>
                <button
                  class="inline-flex min-h-10 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  :disabled="!pointsSummaryLoaded || !transferTask.enabled"
                  @click="handleTransferTask"
                >
                  {{ pointsSummaryLoaded ? '去验证' : '读取中' }}
                </button>
              </div>
            </article>
          </div>
        </section>

        <section class="space-y-3">
          <div>
            <h2 class="m-0 text-lg font-semibold text-gray-950 dark:text-white">积分概览</h2>
            <p class="m-0 mt-1 text-sm text-gray-500 dark:text-gray-400">查看有效积分、来源、趋势和最近记录。</p>
          </div>
          <UserPointsOverview
            ref="pointsOverviewRef"
            @view-history="activeTab = 'points-history'"
            @points-loaded="handlePointsSnapshot"
          />
        </section>

        <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div class="border-b border-gray-200 dark:border-gray-700">
            <nav class="flex px-5" aria-label="Tabs">
              <button
                :class="[
                  'mr-8 border-b-2 px-1 py-3.5 text-sm font-medium transition-colors duration-200',
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
                  'border-b-2 px-1 py-3.5 text-sm font-medium transition-colors duration-200',
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

            <div v-if="activeTab === 'checkin-history'" class="p-5">
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

              <div v-if="checkInHistory.monthStats" class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40">
                  <div class="text-xs text-gray-500 dark:text-gray-400">签到天数</div>
                  <div class="mt-1 text-lg font-semibold text-gray-950 dark:text-white">
                    {{ checkInHistory.monthStats.checkInCount }}
                  </div>
                </div>
                <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40">
                  <div class="text-xs text-gray-500 dark:text-gray-400">获得积分</div>
                  <div class="mt-1 text-lg font-semibold text-gray-950 dark:text-white">
                    {{ checkInHistory.monthStats.totalPoints }}
                  </div>
                </div>
                <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40">
                  <div class="text-xs text-gray-500 dark:text-gray-400">最长连续</div>
                  <div class="mt-1 text-lg font-semibold text-gray-950 dark:text-white">
                    {{ checkInHistory.monthStats.maxConsecutiveDays }}
                  </div>
                </div>
                <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40">
                  <div class="text-xs text-gray-500 dark:text-gray-400">签到率</div>
                  <div class="mt-1 text-lg font-semibold text-gray-950 dark:text-white">
                    {{ checkInHistory.monthStats.checkInRate }}%
                  </div>
                </div>
              </div>

              <div class="max-h-[480px] space-y-2 overflow-y-auto">
                <div v-if="checkInHistory.checkIns?.length === 0" class="rounded-lg border border-dashed border-gray-300 py-12 text-center dark:border-gray-700">
                  <p class="m-0 text-gray-500 dark:text-gray-400">本月暂无签到记录</p>
                </div>

                <template v-else>
                  <div
                    v-for="checkIn in checkInHistory.checkIns"
                    :key="checkIn.id"
                    class="flex items-center rounded-lg bg-gray-50 p-3 transition-colors duration-200 hover:bg-gray-100 dark:bg-gray-900/40 dark:hover:bg-gray-700"
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

            <div v-if="activeTab === 'points-history'" class="p-5">
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

              <div class="max-h-[480px] space-y-2 overflow-y-auto">
                <div v-if="pointsHistory.history?.length === 0" class="rounded-lg border border-dashed border-gray-300 py-12 text-center dark:border-gray-700">
                  <p class="m-0 text-gray-500 dark:text-gray-400">暂无积分记录</p>
                </div>

                <template v-else>
                  <div
                    v-for="record in pointsHistory.history"
                    :key="record.id"
                    class="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors duration-200 hover:bg-gray-100 dark:bg-gray-900/40 dark:hover:bg-gray-700"
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
                      class="ml-4 text-base font-semibold"
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
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'

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
const defaultTransferTask = {
  enabled: false,
  rewardPoints: 1000,
  durationMinutes: 1440
}
const pointsSummary = ref({
  transferTask: defaultTransferTask
})
const pointsSummaryLoaded = ref(false)
const transferTask = computed(() => pointsSummary.value.transferTask || defaultTransferTask)
const transferTaskLabel = computed(() => {
  if (!pointsSummaryLoaded.value) return '读取中'
  return transferTask.value.enabled ? `+${transferTask.value.rewardPoints || 0} 积分` : '未开启'
})
const transferDurationLabel = computed(() => {
  if (!pointsSummaryLoaded.value) return '读取中'
  return transferTask.value.enabled ? formatDuration(transferTask.value.durationMinutes) : '未开启'
})
const taskSummaryText = computed(() => {
  if (!pointsSummaryLoaded.value) return '正在读取任务配置'
  return `${1 + (transferTask.value.enabled ? 1 : 0)} 个可用任务`
})
const checkInStatusSnapshot = ref(null)

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

const handleCheckInStatusLoaded = (status) => {
  checkInStatusSnapshot.value = status
}

const handlePointsSnapshot = (data) => {
  pointsSummary.value = {
    ...pointsSummary.value,
    ...(data || {})
  }
  pointsSummaryLoaded.value = true
}

const handleTransferTask = () => {
  navigateTo('/quark-verification?purpose=points&redirect=/user/checkin')
}

const formatDuration = (minutes) => {
  const value = Number(minutes || 0)
  if (value >= 1440) {
    const days = Math.floor(value / 1440)
    const hours = Math.floor((value % 1440) / 60)
    return hours ? `${days}天${hours}小时` : `${days}天`
  }
  if (value >= 60) {
    const hours = Math.floor(value / 60)
    const remainingMinutes = value % 60
    return remainingMinutes ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`
  }
  return `${value}分钟`
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
