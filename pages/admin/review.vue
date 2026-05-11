<template>
  <div class="space-y-6">
    <div class="admin-card-bg rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <i class="fas fa-clipboard-check text-blue-500"></i>
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
              审核
            </h1>
          </div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            汇总待审核内容、举报和人工处理入口。
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <el-button @click="refreshReviewCounts" :loading="loading">
            <i class="fas fa-sync-alt mr-2"></i>
            刷新
          </el-button>
          <NuxtLink to="/admin/sensitive-words">
            <el-button>
              <i class="fas fa-filter mr-2"></i>
              敏感词配置
            </el-button>
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="admin-card-bg rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
          待处理总数
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-3xl font-semibold text-gray-900 dark:text-white">
            {{ totalPending }}
          </span>
          <span class="text-sm text-gray-500 dark:text-gray-400">项</span>
        </div>
        <div class="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {{ updatedAt ? `更新于 ${updatedAt}` : "等待刷新" }}
        </div>
      </div>

      <div class="admin-card-bg rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
        <div class="flex items-start gap-3">
          <div class="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-500 dark:bg-orange-900/20">
            <i class="fas fa-shield-alt"></i>
          </div>
          <div>
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">
              审核策略
            </h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              敏感词策略决定内容是直接允许、进入人工审核还是拒绝。具体词库维护已放在独立菜单，避免混在系统配置里。
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="admin-card-bg rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div class="mb-5 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            审核队列
          </h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            点击进入对应列表处理待审核项。
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="item in reviewItems"
          :key="item.key"
          class="rounded-lg border border-gray-200 p-4 transition hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:hover:border-blue-600"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800"
                :class="item.iconColor"
              >
                <i :class="item.icon"></i>
              </div>
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  {{ item.title }}
                </h3>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ item.description }}
                </p>
              </div>
            </div>
            <el-tag v-if="item.error" type="danger" size="small">异常</el-tag>
            <el-tag v-else type="warning" size="small">待审核</el-tag>
          </div>

          <div class="mt-5 flex items-end justify-between">
            <div>
              <el-skeleton-item
                v-if="item.loading"
                variant="text"
                class="h-8 w-14"
              />
              <div v-else class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ item.count }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ item.error ? "读取失败" : "待处理" }}
              </div>
            </div>
            <NuxtLink :to="item.path">
              <el-button size="small" type="primary" plain>
                进入处理
              </el-button>
            </NuxtLink>
          </div>

          <div
            v-if="item.showModerationPreview"
            class="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700"
          >
            <div class="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              触发关键词
            </div>
            <div v-if="item.loading" class="space-y-2">
              <el-skeleton-item variant="text" class="h-5 w-full" />
              <el-skeleton-item variant="text" class="h-5 w-4/5" />
            </div>
            <div v-else-if="item.preview.length" class="space-y-3">
              <div
                v-for="entry in item.preview"
                :key="`${item.key}-${entry.id}`"
                class="rounded-md bg-gray-50 p-3 dark:bg-gray-800"
              >
                <div class="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                  {{ entry.title }}
                </div>
                <div v-if="entry.matches.length" class="mt-2 flex flex-wrap gap-2">
                  <el-tag
                    v-for="match in entry.matches"
                    :key="`${entry.id}-${match.word}-${match.category}`"
                    :type="getRiskTagType(match.risk)"
                    size="small"
                  >
                    {{ match.word }} · {{ getCategoryLabel(match.category) }}
                  </el-tag>
                </div>
                <div v-else class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  未命中敏感词，可能由人工或其它规则进入待审核。
                </div>
              </div>
            </div>
            <div v-else class="text-xs text-gray-500 dark:text-gray-400">
              当前没有待审核样本。
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "admin",
  middleware: ["admin"],
});

const loading = ref(false);
const updatedAt = ref("");

const reviewItems = reactive([
  {
    key: "userPosts",
    title: "用户文章",
    description: "用户提交的文章内容",
    endpoint: "/api/admin/user-posts/get",
    path: "/admin/user-posts?status=pending",
    icon: "fas fa-book-reader",
    iconColor: "text-blue-500",
    count: 0,
    loading: false,
    error: false,
    showModerationPreview: true,
    preview: [],
  },
  {
    key: "userResources",
    title: "用户资源",
    description: "用户提交的网盘资源",
    endpoint: "/api/admin/user-resources/get",
    path: "/admin/user-resources?status=pending",
    icon: "fas fa-folder-open",
    iconColor: "text-green-500",
    count: 0,
    loading: false,
    error: false,
    showModerationPreview: true,
    preview: [],
  },
  {
    key: "forumTopics",
    title: "论坛主题",
    description: "待审核论坛主题",
    endpoint: "/api/admin/forum/topics",
    path: "/admin/forum/topics?status=pending",
    icon: "fas fa-users",
    iconColor: "text-purple-500",
    count: 0,
    loading: false,
    error: false,
  },
  {
    key: "forumPosts",
    title: "论坛回复",
    description: "待审核论坛回复",
    endpoint: "/api/admin/forum/posts",
    path: "/admin/forum/posts?status=pending",
    icon: "fas fa-comment-dots",
    iconColor: "text-cyan-500",
    count: 0,
    loading: false,
    error: false,
  },
  {
    key: "reports",
    title: "举报",
    description: "用户举报和投诉",
    endpoint: "/api/admin/reports/list",
    path: "/admin/reports?status=pending",
    icon: "fas fa-flag",
    iconColor: "text-red-500",
    count: 0,
    loading: false,
    error: false,
  },
]);

const totalPending = computed(() => {
  return reviewItems.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
});

const authHeaders = () => ({
  Authorization: `Bearer ${useCookie("token").value}`,
});

const moderationCategoryLabels = {
  custom: "自定义",
  gambling: "赌博博彩",
  porn: "色情低俗",
  fraud: "诈骗黑产",
  illegal_finance: "非法金融",
  pyramid_scheme: "传销拉人头",
  cult: "邪教极端",
  violence: "暴力危险",
  political_person: "政治人物",
  spam_or_contextual: "广告/上下文风险",
};

const getResponseTotal = (response) => {
  const candidates = [
    response?.pagination?.total,
    response?.data?.pagination?.total,
    response?.data?.total,
    response?.total,
  ];

  const total = candidates.find((value) => Number.isFinite(Number(value)));
  return Number(total || 0);
};

const getResponseRows = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const getRiskTagType = (risk) => {
  if (risk === "high") return "danger";
  if (risk === "low") return "info";
  return "warning";
};

const getCategoryLabel = (category) => moderationCategoryLabels[category] || category || "自定义";

const getReviewEntryTitle = (item, row) => {
  if (item.key === "userResources") {
    return row.name || `资源 #${row.id}`;
  }

  return row.title || `文章 #${row.id}`;
};

const buildModerationPreview = (item, response) =>
  getResponseRows(response)
    .map((row) => {
      const seen = new Set();
      const matches = [];

      for (const match of row.moderation?.matches || []) {
        const word = String(match.word || match.normalizedWord || "").trim();
        if (!word) continue;

        const key = `${word}:${match.category || "custom"}`;
        if (seen.has(key)) continue;
        seen.add(key);

        matches.push({
          word,
          category: match.category || "custom",
          risk: match.risk || "medium",
        });
      }

      return {
        id: row.id,
        title: getReviewEntryTitle(item, row),
        matches: matches.slice(0, 6),
      };
    })
    .sort((a, b) => {
      if (b.matches.length !== a.matches.length) {
        return b.matches.length - a.matches.length;
      }

      return 0;
    })
    .slice(0, 3);

const fetchReviewCount = async (item) => {
  item.loading = true;
  item.error = false;

  try {
    const response = await $fetch(item.endpoint, {
      method: "GET",
      params: {
        page: 1,
        pageSize: item.showModerationPreview ? 20 : 1,
        status: "pending",
        ...(item.showModerationPreview ? { includeModeration: true } : {}),
      },
      headers: authHeaders(),
    });

    item.count = getResponseTotal(response);
    if (item.showModerationPreview) {
      item.preview = buildModerationPreview(item, response);
    }
  } catch (error) {
    console.error(`获取${item.title}待审核数量失败:`, error);
    item.count = 0;
    item.error = true;
    if (item.showModerationPreview) {
      item.preview = [];
    }
  } finally {
    item.loading = false;
  }
};

const refreshReviewCounts = async () => {
  loading.value = true;
  await Promise.all(reviewItems.map((item) => fetchReviewCount(item)));
  updatedAt.value = new Date().toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  loading.value = false;
};

onMounted(() => {
  refreshReviewCounts();
});
</script>
