<template>
  <article
    class="flex min-h-[220px] flex-col rounded-xl border border-gray-200 bg-white p-5 transition-colors duration-200 hover:border-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex min-w-0 items-start gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xl text-blue-600 dark:bg-blue-900/30 dark:text-blue-200">
          <i class="fa-regular fa-newspaper"></i>
        </div>
        <div class="min-w-0">
          <h3 class="m-0 text-base font-semibold leading-6 text-gray-950 dark:text-white">
            {{ task.title }}
          </h3>
          <p class="m-0 mt-1 max-w-[360px] text-sm leading-6 text-gray-500 dark:text-gray-400">
            {{ task.description || '阅读指定文章后领取积分奖励。' }}
          </p>
        </div>
      </div>
      <span
        :class="[
          'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
          isCompleted
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
            : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
        ]"
      >
        {{ isCompleted ? '已领取' : `+${task.points || 0} 积分` }}
      </span>
    </div>

    <div class="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-h-[40px] text-sm leading-6 text-gray-500 dark:text-gray-400">
        每个账号可领取 {{ task.claimLimit || 1 }} 次，当前已领取 {{ task.completedCount || 0 }} 次。
      </div>
      <div class="shrink-0">
        <button
          v-if="isCompleted"
          class="inline-flex min-h-10 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
          type="button"
          disabled
        >
          <i class="fa-solid fa-circle-check"></i>
          已完成
        </button>
        <button
          v-else-if="!opened"
          class="inline-flex min-h-10 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
          type="button"
          @click="$emit('open', task)"
        >
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
          去阅读
        </button>
        <button
          v-else
          class="inline-flex min-h-10 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          type="button"
          :disabled="remainingSeconds > 0 || claiming"
          @click="$emit('claim', task)"
        >
          <i :class="claiming ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-gift'"></i>
          <template v-if="claiming">领取中</template>
          <template v-else-if="remainingSeconds > 0">{{ remainingSeconds }} 秒后领取</template>
          <template v-else>领取积分</template>
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  opened: {
    type: Boolean,
    default: false
  },
  remainingSeconds: {
    type: Number,
    default: 0
  },
  claiming: {
    type: Boolean,
    default: false
  }
})

defineEmits(['open', 'claim'])

const isCompleted = computed(() => props.task.status === 'completed' || !props.task.canClaim)
</script>
