<template>
  <article
    v-if="drop?.enabled"
    class="flex min-h-[220px] flex-col rounded-xl border border-emerald-200 bg-white p-5 transition-colors duration-200 hover:border-emerald-300 dark:border-emerald-900/60 dark:bg-gray-900 dark:hover:border-emerald-700"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex min-w-0 items-start gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xl text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200">
          <i class="fa-solid fa-bolt"></i>
        </div>
        <div class="min-w-0">
          <h3 class="m-0 text-base font-semibold leading-6 text-gray-950 dark:text-white">
            每日福利
          </h3>
          <p class="m-0 mt-1 max-w-[360px] text-sm leading-6 text-gray-500 dark:text-gray-400">
            今日 {{ drop.releaseTime || '12:00' }} 开始领取，先到先得。
          </p>
        </div>
      </div>
      <span
        :class="[
          'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
          isClaimed
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
            : 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200'
        ]"
      >
        {{ isClaimed ? '今日已领' : rewardLabel }}
      </span>
    </div>

    <div class="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-h-[40px] text-sm leading-6 text-gray-500 dark:text-gray-400">
        <template v-if="isClaimed">
          今日已领取，明天再来。
        </template>
        <template v-else-if="drop.claimable">
          剩余 {{ drop.remainingQuota || 0 }} 份，每份 {{ drop.points || 0 }} 积分。
        </template>
        <template v-else>
          {{ drop.message || '当前不可领取。' }}
        </template>
      </div>
      <button
        class="inline-flex min-h-10 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        :disabled="!drop.claimable || claiming || isClaimed"
        @click="$emit('claim')"
      >
        <i :class="claiming ? 'fa-solid fa-spinner fa-spin' : buttonIcon"></i>
        {{ buttonText }}
      </button>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  drop: {
    type: Object,
    default: () => null
  },
  claiming: {
    type: Boolean,
    default: false
  }
})

defineEmits(['claim'])

const isClaimed = computed(() => props.drop?.status === 'already_claimed')

const rewardLabel = computed(() => {
  const points = Number(props.drop?.points || 0)
  return props.drop?.isTemporary ? `+${points} 限时积分` : `+${points} 积分`
})

const buttonIcon = computed(() => {
  if (isClaimed.value) return 'fa-solid fa-circle-check'
  if (props.drop?.claimable) return 'fa-solid fa-bolt'
  return 'fa-regular fa-clock'
})

const buttonText = computed(() => {
  if (props.claiming) return '领取中'
  if (isClaimed.value) return '已领取'
  if (props.drop?.claimable) return '立即领取'
  if (props.drop?.status === 'not_released') return '未开始'
  if (props.drop?.status === 'sold_out') return '已领完'
  return '不可领取'
})
</script>
