<template>
  <div class="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
    <div class="mx-auto max-w-6xl space-y-6">
      <header class="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <i class="fa-solid fa-coins"></i>
            <span>积分管理</span>
            <i class="fa-solid fa-angle-right text-xs"></i>
            <span class="text-gray-900 dark:text-white">每日抢兑</span>
          </div>
          <h1 class="mt-3 text-2xl font-bold text-gray-900 dark:text-white">每日抢兑</h1>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            设置每日积分福利，用户到点即可领取。
          </p>
        </div>
        <el-button :loading="loading" @click="loadOverview">
          <i class="fa-solid fa-rotate-right mr-2"></i>
          刷新
        </el-button>
      </header>

      <section class="grid gap-4 md:grid-cols-3">
        <div class="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-900">
          <div class="text-sm text-gray-500 dark:text-gray-400">今日日期</div>
          <div class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{{ today.claimDateKey || '-' }}</div>
        </div>
        <div class="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-900">
          <div class="text-sm text-gray-500 dark:text-gray-400">今日已领取</div>
          <div class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{{ today.claimedCount || 0 }} / {{ today.dailyQuota || 0 }}</div>
        </div>
        <div class="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-900">
          <div class="text-sm text-gray-500 dark:text-gray-400">开放时间</div>
          <div class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{{ form.releaseTime || '-' }}</div>
        </div>
      </section>

      <section class="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900">
        <div class="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="m-0 text-lg font-semibold text-gray-900 dark:text-white">发放配置</h2>
            <p class="m-0 mt-1 text-sm text-gray-500 dark:text-gray-400">保存后立即生效。</p>
          </div>
          <el-switch
            v-model="form.enabled"
            active-text="已开启"
            inactive-text="未开启"
          />
        </div>

        <el-form label-position="top" :model="form" class="grid gap-4 md:grid-cols-2">
          <el-form-item label="活动名称">
            <el-input v-model="form.name" maxlength="80" show-word-limit />
          </el-form-item>
          <el-form-item label="每日开放时间">
            <el-input v-model="form.releaseTime" placeholder="12:00" />
          </el-form-item>
          <el-form-item label="每日份数">
            <el-input-number v-model="form.dailyQuota" :min="1" :max="100000" class="w-full" controls-position="right" />
          </el-form-item>
          <el-form-item label="每份积分">
            <el-input-number v-model="form.points" :min="1" :max="1000000" class="w-full" controls-position="right" />
          </el-form-item>
          <el-form-item label="奖励类型">
            <el-radio-group v-model="form.rewardMode">
              <el-radio-button label="permanent">永久积分</el-radio-button>
              <el-radio-button label="temporary">限时积分</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="form.rewardMode === 'temporary'" label="限时积分有效期（分钟）">
            <el-input-number v-model="form.pointsExpiresInMinutes" :min="1" :max="525600" class="w-full" controls-position="right" />
          </el-form-item>
          <el-form-item label="每人每日次数">
            <el-input-number v-model="form.maxClaimsPerUserPerDay" :min="1" :max="10" class="w-full" controls-position="right" />
          </el-form-item>
          <el-form-item label="最小注册天数">
            <el-input-number v-model="form.minimumAccountAgeDays" :min="0" :max="3650" class="w-full" controls-position="right" />
          </el-form-item>
          <el-form-item label="领取门槛">
            <el-checkbox v-model="form.requireEmailVerified">需要邮箱已验证</el-checkbox>
          </el-form-item>
          <el-form-item label="活动说明" class="md:col-span-2">
            <el-input v-model="form.description" type="textarea" :rows="3" maxlength="1000" show-word-limit />
          </el-form-item>
        </el-form>

        <div class="mt-6 flex justify-end">
          <el-button type="primary" :loading="saving" @click="saveConfig">
            保存配置
          </el-button>
        </div>
      </section>

      <section class="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="m-0 text-lg font-semibold text-gray-900 dark:text-white">最近领取</h2>
          <span class="text-sm text-gray-500 dark:text-gray-400">最多显示 20 条</span>
        </div>
        <div v-loading="loading">
          <el-table :data="recentClaims" empty-text="暂无领取记录">
            <el-table-column label="用户" min-width="180">
              <template #default="{ row }">
                <div class="font-medium text-gray-900 dark:text-white">{{ row.user?.username || '-' }}</div>
                <div class="text-xs text-gray-500">{{ row.user?.email || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="points" label="积分" width="120" />
            <el-table-column prop="claimDate" label="领取日期" width="160">
              <template #default="{ row }">{{ formatDate(row.claimDate) }}</template>
            </el-table-column>
            <el-table-column prop="createdAt" label="领取时间" width="200">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

definePageMeta({
  layout: 'admin'
})

const token = useCookie('token')
const loading = ref(false)
const saving = ref(false)
const today = ref({})
const recentClaims = ref([])
const form = ref({
  enabled: false,
  name: '每日福利',
  description: '每天固定时间发放，先到先得。',
  releaseTime: '12:00',
  dailyQuota: 100,
  points: 100,
  rewardMode: 'permanent',
  pointsExpiresInMinutes: 1440,
  maxClaimsPerUserPerDay: 1,
  requireEmailVerified: false,
  minimumAccountAgeDays: 0
})

const applyOverview = (overview) => {
  const config = overview?.config || {}
  form.value = {
    ...form.value,
    ...config,
    rewardMode: config.pointsExpiresInMinutes ? 'temporary' : 'permanent',
    pointsExpiresInMinutes: config.pointsExpiresInMinutes || 1440
  }
  today.value = overview?.today || {}
  recentClaims.value = overview?.recentClaims || []
}

const loadOverview = async () => {
  loading.value = true
  try {
    const res = await $fetch('/api/admin/points/daily-redemption-drop', {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
    if (res.code === 200) {
      applyOverview(res.data)
      return
    }
    ElMessage.error(res.msg || '加载每日抢兑配置失败')
  } catch (error) {
    console.error('加载每日抢兑配置失败:', error)
    ElMessage.error(error?.data?.message || '加载每日抢兑配置失败')
  } finally {
    loading.value = false
  }
}

const saveConfig = async () => {
  saving.value = true
  try {
    const res = await $fetch('/api/admin/points/daily-redemption-drop', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      body: {
        ...form.value,
        pointsExpiresInMinutes:
          form.value.rewardMode === 'temporary' ? form.value.pointsExpiresInMinutes : null
      }
    })
    if (res.code === 200) {
      applyOverview(res.data)
      ElMessage.success(res.msg || '每日抢兑已保存')
      return
    }
    ElMessage.error(res.msg || '保存每日抢兑配置失败')
  } catch (error) {
    console.error('保存每日抢兑配置失败:', error)
    ElMessage.error(error?.data?.message || '保存每日抢兑配置失败')
  } finally {
    saving.value = false
  }
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString()
}

const formatDateTime = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

onMounted(() => {
  loadOverview()
})
</script>
