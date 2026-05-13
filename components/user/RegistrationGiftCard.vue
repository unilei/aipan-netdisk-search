<template>
  <article
    v-if="gift?.enabled"
    class="flex min-h-[220px] flex-col rounded-xl border border-amber-200 bg-white p-5 transition-colors duration-200 hover:border-amber-300 dark:border-amber-900/60 dark:bg-gray-900 dark:hover:border-amber-700"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex min-w-0 items-start gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xl text-amber-600 dark:bg-amber-900/30 dark:text-amber-200">
          <i class="fa-solid fa-gift"></i>
        </div>
        <div class="min-w-0">
          <h3 class="m-0 text-base font-semibold leading-6 text-gray-950 dark:text-white">
            注册礼包
          </h3>
          <p class="m-0 mt-1 max-w-[360px] text-sm leading-6 text-gray-500 dark:text-gray-400">
            领取 {{ gift.points || 0 }} 限时积分，{{ durationText }} 内有效。
          </p>
        </div>
      </div>
      <span
        :class="[
          'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
          isClaimed
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
        ]"
      >
        {{ isClaimed ? '已领取' : `+${gift.points || 0} 限时积分` }}
      </span>
    </div>

    <div class="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-h-[40px] text-sm leading-6 text-gray-500 dark:text-gray-400">
        <template v-if="isClaimed && gift.expiresAt">
          有效至 {{ formatDateTime(gift.expiresAt) }}
        </template>
        <template v-else-if="gift.claimable">
          每个账号仅可领取一次。
        </template>
        <template v-else>
          {{ gift.message || '当前不可领取。' }}
        </template>
      </div>
      <button
        v-if="isClaimed"
        class="inline-flex min-h-10 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
        type="button"
        disabled
      >
        <i class="fa-solid fa-circle-check"></i>
        已领取
      </button>
      <button
        v-else
        class="inline-flex min-h-10 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        :disabled="!gift.claimable || claiming"
        @click="$emit('claim')"
      >
        <i :class="claiming ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-gift'"></i>
        {{ claiming ? '领取中' : '领取礼包' }}
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  gift: {
    type: Object,
    default: () => null
  },
  claiming: {
    type: Boolean,
    default: false
  }
})

defineEmits(['claim'])

const isClaimed = computed(() => props.gift?.status === 'claimed')

const durationText = computed(() => {
  const minutes = Number(props.gift?.durationMinutes || 0)
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    return hours ? `${days}天${hours}小时` : `${days}天`
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`
  }
  return `${minutes}分钟`
})

const formatDateTime = (dateString) => new Date(dateString).toLocaleString()
</script>
