<script setup>
useHead({
  title: "TVbox系列数据源接口地址",
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    {
      name: "keywords",
      content:
        "aipan.me,TVbox,数据源,接口地址,猫影视TV,电视盒子接口,数据源接口,免费数据源",
    },
    {
      hid: "description",
      name: "description",
      content:
        "aipan.me是全网最全免费数据源,TVbox系列数据源接口地址,TVbox影视仓电视盒子接口,猫影视TV数据源接口",
    },
    { name: "format-detection", content: "telephone=no" },
  ],
});

const SOURCE_TYPE_LABELS = {
  single: "单仓源",
  warehouse: "多仓源",
  package: "本地包",
  discovery: "扩展源",
  other: "其他",
};
const SOURCE_TYPE_ORDER = ["single", "warehouse", "package", "discovery", "other"];

const tvbox = ref([]);
const searchQuery = ref("");
const activeType = ref("all");
const currentDate = ref("");
const isLoading = ref(true);
const loadError = ref("");
const dataInfo = ref(null);
const { accessStatus, ensureAccess } = useFeatureAccess("tvbox");

const shouldShowAccessNotice = computed(() => {
  return (
    accessStatus.value.loading ||
    (accessStatus.value.checked && !accessStatus.value.allowed)
  );
});

const getAuthHeaders = () => {
  const token = useCookie("token").value;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeSourceItem = (item, index) => {
  const sourceType = item.sourceType || "other";

  return {
    id: item.id || `${sourceType}-${index + 1}`,
    name: item.name || "未命名数据源",
    link: item.link || "",
    sourceType,
    sourceTypeLabel:
      item.sourceTypeLabel || SOURCE_TYPE_LABELS[sourceType] || "其他",
  };
};

const normalizedTvbox = computed(() =>
  tvbox.value.map((item, index) => normalizeSourceItem(item, index))
);

const sourceTypeOptions = computed(() => {
  const counts = normalizedTvbox.value.reduce((result, item) => {
    result[item.sourceType] = (result[item.sourceType] || 0) + 1;
    return result;
  }, {});

  return [
    { value: "all", label: "全部", count: normalizedTvbox.value.length },
    ...SOURCE_TYPE_ORDER.map((type) => ({
      value: type,
      label: SOURCE_TYPE_LABELS[type],
      count: counts[type] || 0,
    })).filter((item) => item.count > 0),
  ];
});

const filteredTvbox = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();

  return normalizedTvbox.value.filter((item) => {
    const matchesType =
      activeType.value === "all" || item.sourceType === activeType.value;
    const matchesSearch =
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.link.toLowerCase().includes(keyword) ||
      item.sourceTypeLabel.toLowerCase().includes(keyword);

    return matchesType && matchesSearch;
  });
});

const hasActiveFilters = computed(() => {
  return Boolean(searchQuery.value.trim()) || activeType.value !== "all";
});

const resultSummary = computed(() => {
  const total = normalizedTvbox.value.length;
  const visible = filteredTvbox.value.length;

  if (!total) return "暂无数据源";
  if (!hasActiveFilters.value) return `共 ${total} 个数据源`;
  return `显示 ${visible} / ${total} 个数据源`;
});

const databaseUpdateTime = computed(() => {
  const lastSyncedAt = dataInfo.value?.database?.lastSyncedAt;
  if (!lastSyncedAt) {
    return "数据库待同步";
  }

  return `数据库更新：${new Date(lastSyncedAt).toLocaleString()}`;
});

const getErrorMessage = (error) => {
  return (
    error?.data?.message ||
    error?.message ||
    "数据源暂时加载失败，请稍后重试"
  );
};

const getData = async ({ forceRefresh = false } = {}) => {
  isLoading.value = true;
  loadError.value = "";

  try {
    const access = await ensureAccess();
    if (!access.allowed) return;

    const res = await $fetch("/api/tvbox", {
      headers: getAuthHeaders(),
      query: forceRefresh ? { refresh: "1" } : undefined,
    });

    tvbox.value = Array.isArray(res.list) ? res.list : [];
    dataInfo.value = res.meta || null;
  } catch (error) {
    console.error("Error loading TVbox data:", error);
    tvbox.value = [];
    dataInfo.value = null;
    loadError.value = getErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  currentDate.value = new Date().toLocaleString();
  getData();
});

const copyTipsMsg = (type, message = "") => {
  ElMessage({
    message: message || (type === "success" ? "复制成功" : "复制失败"),
    type,
  });
};

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    copyTipsMsg("success");
  } catch (err) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
      copyTipsMsg("success");
    } catch (error) {
      copyTipsMsg("error", "您的浏览器不支持复制功能");
    }

    document.body.removeChild(textarea);
  }
};

const refreshData = async () => {
  await getData({ forceRefresh: true });

  if (!loadError.value && !shouldShowAccessNotice.value) {
    ElMessage({
      message: `数据库已刷新，共 ${normalizedTvbox.value.length} 个源`,
      type: "success",
    });
  }
};

const clearFilters = () => {
  searchQuery.value = "";
  activeType.value = "all";
};
</script>

<template>
  <div class="tvbox-page min-h-[calc(100vh-130px)] py-12 transition-colors duration-300">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <section class="mb-8 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl">
            <p class="mb-2 text-sm font-medium text-sky-600 dark:text-sky-400">
              TVBox 数据源
            </p>
            <h1 class="text-3xl font-semibold tracking-normal text-slate-950 dark:text-white md:text-4xl">
              TVbox系列数据源接口地址
            </h1>
            <p class="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
              单仓、多仓和本地包统一聚合，按需搜索和复制。
            </p>
          </div>

          <div class="grid grid-cols-3 gap-3 text-center sm:min-w-[360px]">
            <div class="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <div class="text-xl font-semibold text-slate-950 dark:text-white">
                {{ normalizedTvbox.length }}
              </div>
              <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                总源数
              </div>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <div class="text-xl font-semibold text-slate-950 dark:text-white">
                {{ sourceTypeOptions.length > 1 ? sourceTypeOptions.length - 1 : 0 }}
              </div>
              <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                类型
              </div>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <div class="text-xl font-semibold text-slate-950 dark:text-white">
                {{ filteredTvbox.length }}
              </div>
              <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                当前显示
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span v-if="currentDate" class="inline-flex items-center gap-2">
            <i class="fas fa-clock text-slate-400"></i>
            {{ currentDate }}
          </span>
          <span class="inline-flex items-center gap-2">
            <i class="fas fa-database text-slate-400"></i>
            {{ databaseUpdateTime }}
          </span>
        </div>
      </section>

      <FeatureAccessNotice
        v-if="shouldShowAccessNotice"
        :status="accessStatus"
        feature-name="TVBox"
        class="mb-10"
      />

      <template v-else>
        <section class="mb-6 space-y-4">
          <div class="flex flex-col gap-3 lg:flex-row">
            <label class="relative flex-1">
              <span class="sr-only">搜索数据源</span>
              <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索名称、链接或类型"
                class="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-10 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-950"
              />
              <button
                v-if="searchQuery"
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                title="清空搜索"
                @click="searchQuery = ''"
              >
                <i class="fas fa-times"></i>
              </button>
            </label>

            <button
              type="button"
              class="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              :disabled="isLoading"
              @click="refreshData"
            >
              <i :class="['fas fa-sync-alt', { 'animate-spin': isLoading }]"></i>
              刷新
            </button>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="option in sourceTypeOptions"
                :key="option.value"
                type="button"
                :class="[
                  'inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm transition',
                  activeType === option.value
                    ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-950 dark:text-sky-200'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white',
                ]"
                @click="activeType = option.value"
              >
                <span>{{ option.label }}</span>
                <span class="text-xs opacity-70">{{ option.count }}</span>
              </button>
            </div>

            <div class="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span>{{ resultSummary }}</span>
              <button
                v-if="hasActiveFilters"
                type="button"
                class="font-medium text-sky-700 transition hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-100"
                @click="clearFilters"
              >
                重置
              </button>
            </div>
          </div>
        </section>

        <div
          v-if="isLoading"
          class="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        >
          <div
            v-for="item in 6"
            :key="item"
            class="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 dark:border-slate-800 md:grid-cols-[220px_1fr_96px]"
          >
            <div class="h-5 animate-pulse rounded bg-slate-100 dark:bg-slate-800"></div>
            <div class="h-10 animate-pulse rounded bg-slate-100 dark:bg-slate-800"></div>
            <div class="h-10 animate-pulse rounded bg-slate-100 dark:bg-slate-800"></div>
          </div>
        </div>

        <div
          v-else-if="loadError"
          class="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/60 dark:bg-red-950/30"
        >
          <div class="text-base font-medium text-red-700 dark:text-red-200">
            {{ loadError }}
          </div>
          <button
            type="button"
            class="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700"
            @click="refreshData"
          >
            <i class="fas fa-rotate-right"></i>
            重新加载
          </button>
        </div>

        <div
          v-else-if="filteredTvbox.length === 0"
          class="rounded-lg border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900"
        >
          <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800">
            <i class="fas fa-search"></i>
          </div>
          <p class="font-medium text-slate-700 dark:text-slate-200">
            未找到匹配的数据源
          </p>
          <button
            v-if="hasActiveFilters"
            type="button"
            class="mt-3 text-sm font-medium text-sky-700 transition hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-100"
            @click="clearFilters"
          >
            清空筛选
          </button>
        </div>

        <div
          v-else
          class="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        >
          <article
            v-for="item in filteredTvbox"
            :key="item.id"
            class="grid gap-3 border-b border-slate-100 p-4 transition last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/70 md:grid-cols-[minmax(180px,0.7fr)_minmax(0,1fr)_96px] md:items-center"
          >
            <div class="min-w-0">
              <div class="flex min-w-0 items-center gap-2">
                <h2 class="truncate text-sm font-semibold text-slate-950 dark:text-white">
                  {{ item.name }}
                </h2>
                <span class="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {{ item.sourceTypeLabel }}
                </span>
              </div>
            </div>

            <input
              class="source-link-input h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              type="text"
              :value="item.link"
              readonly
            />

            <button
              type="button"
              class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-sky-500 hover:text-sky-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:text-sky-200"
              @click="copy(item.link)"
            >
              <i class="fas fa-copy"></i>
              复制
            </button>
          </article>
        </div>
      </template>
    </div>

    <el-backtop
      :right="24"
      :bottom="24"
      class="!flex !h-11 !w-11 items-center justify-center !rounded-lg !bg-slate-950 !text-white !shadow-lg transition hover:!bg-slate-800 dark:!bg-white dark:!text-slate-950 dark:hover:!bg-slate-200"
    >
      <i class="fas fa-arrow-up"></i>
    </el-backtop>
  </div>
</template>

<style scoped>
.tvbox-page {
  background: #f8fafc;
}

:root.dark .tvbox-page {
  background: #020617;
}

.source-link-input {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}
</style>
