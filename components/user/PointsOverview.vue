<template>
  <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <div class="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div class="p-5">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p class="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">有效积分</p>
            <div class="flex flex-wrap items-end gap-3">
              <div class="text-3xl font-semibold tracking-normal text-gray-950 dark:text-white md:text-4xl">
                {{ displayCurrentPoints }}
              </div>
              <span class="pb-1 text-sm text-gray-500 dark:text-gray-400">永久积分 + 未过期限时积分</span>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <span
              v-if="isLoading"
              class="inline-flex items-center rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400"
            >
              更新中
            </span>
            <button
              class="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
              type="button"
              :disabled="isLoading"
              @click="fetchPointsData"
            >
              <i class="fa-solid fa-rotate-right text-xs"></i>
              刷新
            </button>
            <button
              class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              type="button"
              @click="$emit('view-history')"
            >
              <i class="fa-solid fa-list text-xs"></i>
              查看明细
            </button>
          </div>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-3">
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-950/40">
            <div class="text-xs text-gray-500 dark:text-gray-400">永久积分</div>
            <div class="mt-1 text-xl font-semibold text-gray-950 dark:text-white">
              {{ displayBreakdown.permanentPoints }}
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">签到、连续奖励、管理员调整</p>
          </div>

          <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-950/40">
            <div class="text-xs text-gray-500 dark:text-gray-400">限时积分</div>
            <div class="mt-1 text-xl font-semibold text-gray-950 dark:text-white">
              {{ displayBreakdown.temporaryPoints }}
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">未过期转存奖励自动计入</p>
          </div>

          <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-950/40">
            <div class="text-xs text-gray-500 dark:text-gray-400">最近过期</div>
            <div class="mt-1 text-sm font-semibold text-gray-950 dark:text-white">
              {{ formatExpireTime(displayBreakdown.nextExpiringAt) }}
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">过期后不再计入访问门槛</p>
          </div>
        </div>
      </div>

      <aside class="border-t border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-950/30 lg:border-l lg:border-t-0">
        <h2 class="m-0 text-base font-semibold text-gray-950 dark:text-white">收支统计</h2>
        <div class="mt-4 grid grid-cols-2 gap-3">
          <div class="rounded-lg bg-white p-3 dark:bg-gray-900">
            <div class="text-xs text-gray-500 dark:text-gray-400">今日获得</div>
            <div class="mt-1 text-lg font-semibold text-gray-950 dark:text-white">
              {{ pointsData.stats?.dailyEarned || 0 }}
            </div>
          </div>
          <div class="rounded-lg bg-white p-3 dark:bg-gray-900">
            <div class="text-xs text-gray-500 dark:text-gray-400">本月获得</div>
            <div class="mt-1 text-lg font-semibold text-gray-950 dark:text-white">
              {{ pointsData.stats?.monthlyEarned || 0 }}
            </div>
          </div>
          <div class="rounded-lg bg-white p-3 dark:bg-gray-900">
            <div class="text-xs text-gray-500 dark:text-gray-400">累计获得</div>
            <div class="mt-1 text-lg font-semibold text-gray-950 dark:text-white">
              {{ pointsData.stats?.totalEarned || 0 }}
            </div>
          </div>
          <div class="rounded-lg bg-white p-3 dark:bg-gray-900">
            <div class="text-xs text-gray-500 dark:text-gray-400">累计消费</div>
            <div class="mt-1 text-lg font-semibold text-gray-950 dark:text-white">
              {{ pointsData.stats?.totalSpent || 0 }}
            </div>
          </div>
        </div>
      </aside>
    </div>

    <div class="grid border-t border-gray-200 dark:border-gray-700 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div class="p-5">
        <div v-if="pointsData.stats?.weeklyTrend?.length">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="m-0 text-base font-semibold text-gray-950 dark:text-white">7天趋势</h2>
            <span class="text-xs text-gray-500 dark:text-gray-400">只统计获得积分</span>
          </div>
          <div class="flex h-24 items-end justify-between gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-950/40">
            <div
              v-for="(day, index) in pointsData.stats.weeklyTrend"
              :key="day.date"
              class="flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <div
                class="w-5 rounded-t bg-blue-600 transition-all duration-300"
                :style="{ height: getTrendBarHeight(day.points) }"
              ></div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ formatTrendDate(day.date, index) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-gray-200 p-5 dark:border-gray-700 lg:border-l lg:border-t-0">
        <div v-if="pointsData.stats?.pointsByType?.length">
          <h2 class="m-0 mb-3 text-base font-semibold text-gray-950 dark:text-white">积分来源</h2>
          <div class="space-y-2">
            <div
              v-for="source in pointsData.stats.pointsByType"
              :key="source.type"
              class="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-950/40"
            >
              <div class="min-w-0">
                <div class="truncate text-sm font-medium text-gray-950 dark:text-white">
                  {{ getTypeName(source.type) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ source._count._all }} 次</div>
              </div>
              <div class="font-semibold text-emerald-600 dark:text-emerald-300">
                {{ formatSignedPoints(source._sum.points || 0) }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="pointsData.recentHistory?.length" class="mt-6">
          <h2 class="m-0 mb-3 text-base font-semibold text-gray-950 dark:text-white">最近记录</h2>
          <div class="space-y-2">
            <div
              v-for="record in pointsData.recentHistory.slice(0, 4)"
              :key="record.id"
              class="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-950/40"
            >
              <div class="min-w-0">
                <div class="truncate text-sm font-medium text-gray-950 dark:text-white">
                  {{ record.description || getTypeName(record.type) }}
                </div>
                <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{{ formatTime(record.createdAt) }}</span>
                  <span v-if="record.isTemporary" :class="record.isExpired ? 'text-gray-500' : 'text-amber-600 dark:text-amber-300'">
                    {{ record.isExpired ? '已过期' : `有效至 ${formatShortDate(record.expiresAt)}` }}
                  </span>
                </div>
              </div>
              <div
                class="ml-4 font-semibold"
                :class="record.points >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'"
              >
                {{ formatSignedPoints(record.points) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";

import { useUserStore } from "~/stores/user";

const emit = defineEmits(["view-history", "points-loaded"]);

const emptyBreakdown = {
  permanentPoints: 0,
  temporaryPoints: 0,
  effectivePoints: 0,
  nextExpiringAt: null,
};

const pointsData = ref({
  currentPoints: 0,
  breakdown: emptyBreakdown,
  userSince: null,
  stats: null,
  recentHistory: [],
  transferTask: {
    enabled: false,
    rewardPoints: 1000,
    durationMinutes: 1440,
  },
});

const userStore = useUserStore();
const isLoading = ref(true);
const hasLoaded = ref(false);
const hasMounted = ref(false);

const breakdown = computed(() => pointsData.value.breakdown || emptyBreakdown);
const hasUserPointsSnapshot = computed(() => Boolean(
  hasMounted.value &&
    userStore.user &&
    (
      userStore.user.effectivePoints !== undefined ||
      userStore.user.points !== undefined ||
      userStore.user.pointsBreakdown
    )
));
const userBreakdown = computed(() => {
  const effectivePoints = Number(userStore.user?.effectivePoints ?? userStore.user?.points ?? 0);
  return userStore.user?.pointsBreakdown || {
    permanentPoints: Number(userStore.user?.permanentPoints ?? userStore.user?.points ?? 0),
    temporaryPoints: Number(userStore.user?.temporaryPoints ?? 0),
    effectivePoints,
    nextExpiringAt: userStore.user?.nextExpiringAt ?? null,
  };
});
const hasReliablePoints = computed(() => hasLoaded.value || hasUserPointsSnapshot.value);
const displayBreakdown = computed(() => {
  if (!hasReliablePoints.value) {
    return {
      permanentPoints: "—",
      temporaryPoints: "—",
      effectivePoints: "—",
      nextExpiringAt: null,
    };
  }
  return hasLoaded.value ? breakdown.value : userBreakdown.value;
});
const displayCurrentPoints = computed(() => (
  hasReliablePoints.value
    ? Number(
      hasLoaded.value
        ? pointsData.value.currentPoints || 0
        : userBreakdown.value.effectivePoints || 0
    )
    : "—"
));
const fetchPointsData = async () => {
  isLoading.value = true;
  try {
    const response = await $fetch("/api/user/points", {
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });

    if (response.code === 200) {
      pointsData.value = {
        ...pointsData.value,
        ...response.data,
      };
      hasLoaded.value = true;
      if (userStore.user) {
        userStore.user.points = response.data.currentPoints;
        userStore.user.permanentPoints = response.data.permanentPoints;
        userStore.user.temporaryPoints = response.data.temporaryPoints;
        userStore.user.effectivePoints = response.data.effectivePoints;
        userStore.user.nextExpiringAt = response.data.nextExpiringAt;
        userStore.user.pointsBreakdown = response.data.breakdown;
      }
      emit("points-loaded", response.data);
    }
  } catch (error) {
    console.error("获取积分信息失败:", error);
  } finally {
    isLoading.value = false;
  }
};

const getTypeName = (type) => {
  const typeNames = {
    checkin: "每日签到",
    bonus: "连续签到奖励",
    consume: "积分消费",
    admin: "管理员调整",
    activity: "活动奖励",
    task: "任务奖励",
    transfer: "转存奖励",
  };
  return typeNames[type] || type;
};

const formatSignedPoints = (points) => {
  const value = Number(points || 0);
  return `${value > 0 ? "+" : ""}${value}`;
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return date.toLocaleDateString();
};

const formatShortDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString([], {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatExpireTime = (dateString) => {
  if (!dateString) return "暂无限时积分";
  return formatShortDate(dateString);
};

const formatDuration = (minutes) => {
  const value = Number(minutes || 0);
  if (value >= 1440) {
    const days = Math.floor(value / 1440);
    const hours = Math.floor((value % 1440) / 60);
    return hours ? `${days}天${hours}小时` : `${days}天`;
  }
  if (value >= 60) {
    const hours = Math.floor(value / 60);
    const remainingMinutes = value % 60;
    return remainingMinutes ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  }
  return `${value}分钟`;
};

const formatTrendDate = (dateString, index) => {
  const date = new Date(dateString);
  if (index === 6) return "今天";
  if (index === 5) return "昨天";
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const getTrendBarHeight = (points) => {
  if (!pointsData.value.stats?.weeklyTrend?.length) return "2px";
  const maxPoints = Math.max(...pointsData.value.stats.weeklyTrend.map((d) => d.points));
  if (maxPoints === 0) return "2px";
  return `${Math.max((points / maxPoints) * 100, 8)}%`;
};

onMounted(() => {
  hasMounted.value = true;
  fetchPointsData();
});

defineExpose({
  refresh: fetchPointsData,
});
</script>
