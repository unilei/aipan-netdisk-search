<template>
  <div
    class="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300"
  >
    <SearchHeader
      :keyword="keyword"
      @search="search"
      class="mb-2"
    />

    <!-- 群二维码显示在搜索结果前 -->
    <div
      v-if="shouldShowInSearchResults && searchPerformed && !skeletonLoading && !shouldShowAccessNotice"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3"
    >
      <GroupQrCode variant="search-result" />
    </div>

    <div
      v-if="shouldShowAccessNotice"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4"
    >
      <FeatureAccessNotice :status="accessStatus" feature-name="网盘搜索" />
    </div>

    <!-- Main Content Area -->
    <SearchContent
      v-else
      :sources="sources"
      :skeleton-loading="skeletonLoading"
      :loading-progress="loadingProgress"
      :search-performed="searchPerformed"
    />
  </div>
</template>

<script setup>
import SearchHeader from "~/components/search/SearchHeader.vue";
import SearchContent from "~/components/search/SearchContent.vue";
import GroupQrCode from "~/components/GroupQrCode.vue";
import sourcesApiEndpointsGuest from "~/assets/vod/clouddrive.json";
import sourcesApiEndpointsLoggedIn from "~/assets/vod/clouddrive-login.json";
import { badWords } from "~/utils/sensitiveWords";
import { useUserStore } from "~/stores/user";
import { useSearchState } from "~/composables/useSearchState";
import { useSearchLogic } from "~/composables/useSearchLogic";
import { useQuarkConfig } from "~/composables/useQuarkConfig";
import { useSearchQueue } from "~/composables/useSearchQueue";
import { useGroupQrConfig } from "~/composables/useGroupQrConfig";
import { getLegacyDecodedQueryValue } from "~/utils/routeQuery";

definePageMeta({
  layout: "custom",
});

// 基础设置
const route = useRoute();

// SEO配置
const seoKeyword = computed(() => String(route.query.keyword || ''));

useHead({
  title: computed(() => seoKeyword.value ? `${seoKeyword.value} - 搜索结果 - 爱盼` : '搜索 - 爱盼'),
  meta: [
    { name: 'description', content: computed(() => seoKeyword.value ? `在爱盼搜索“${seoKeyword.value}”的网盘资源结果，支持百度网盘、阿里云盘、夸克网盘等多源搜索。` : '爱盼网盘资源搜索，支持百度网盘、阿里云盘、夸克网盘等多源搜索。') }
  ]
});
const userStore = useUserStore();

// 使用 composables
const {
  sources,
  skeletonLoading,
  searchPerformed,
  loadingProgress,
} = useSearchState();

const { handleSearch, cleanup } = useSearchLogic();
const { getQuarkConfig } = useQuarkConfig();
const { stopQueueProcessing } = useSearchQueue();
const { shouldShowInSearchResults, getConfig: getGroupQrConfig } =
  useGroupQrConfig();
const { accessStatus, ensureAccess } = useFeatureAccess("netdiskSearch");

// 关键词
const keyword = ref(getLegacyDecodedQueryValue(route.query.keyword));
const shouldShowAccessNotice = computed(() => {
  return accessStatus.value.loading ||
    (accessStatus.value.checked && !accessStatus.value.allowed);
});

// 根据登录状态选择搜索源
const sourcesApiEndpoints = computed(() => {
  const endpoints = userStore.loggedIn ? sourcesApiEndpointsLoggedIn : sourcesApiEndpointsGuest;
  return endpoints;
});

// 敏感词检查
const checkSensitiveWords = (text) => {
  if (!text || typeof text !== 'string') return false;
  return badWords.some((word) =>
    text.toLowerCase().includes(word.toLowerCase())
  );
};

const resetLoadingState = () => {
  skeletonLoading.value = false;
  loadingProgress.value = {
    total: 0,
    completed: 0,
    isLoading: false,
  };
};

const startSearchLoadingState = () => {
  sources.value = [];
  searchPerformed.value = true;
  skeletonLoading.value = true;
  loadingProgress.value = {
    total: sourcesApiEndpoints.value.length,
    completed: 0,
    isLoading: true,
  };
};

const search = (searchText) => {
  keyword.value = searchText;
  searchByKeyword();
};

// 搜索函数
const searchByKeyword = async () => {
  if (!keyword.value || keyword.value.trim() === "") {
    sources.value = [];
    searchPerformed.value = false;
    resetLoadingState();
    return;
  }

  // 敏感词检查
  if (checkSensitiveWords(keyword.value)) {
    sources.value = [];
    searchPerformed.value = false;
    resetLoadingState();
    ElMessage.error("搜索内容包含敏感词，请修改后重试");
    return;
  }

  const access = await ensureAccess();
  if (!access.allowed) {
    sources.value = [];
    searchPerformed.value = false;
    resetLoadingState();
    return;
  }

  startSearchLoadingState();

  await handleSearch(
    keyword.value,
    sources,
    loadingProgress,
    sourcesApiEndpoints.value
  );
};

// 初始化
onMounted(async () => {
  try {
    await Promise.all([
      getQuarkConfig(),
      getGroupQrConfig(),
      ensureAccess()
    ]);

    if (keyword.value && keyword.value.trim() !== "") {
      await searchByKeyword();
    }
  } catch (error) {
    console.error('初始化失败:', error);
  }
});

// 清理
onUnmounted(() => {
  stopQueueProcessing();
  cleanup();
});

// 监听搜索结果，第一批结果到达时关闭 skeleton
watch(
  sources,
  (newSources) => {
    if (skeletonLoading.value && newSources.length > 0) {
      skeletonLoading.value = false;
    }
  },
  { deep: true }
);

// 搜索完成时确保 skeleton 关闭
watch(
  () => loadingProgress.value.isLoading,
  (isLoading) => {
    if (!isLoading) {
      skeletonLoading.value = false;
    }
  }
);

// 监听路由变化
watch(
  () => route.query.keyword,
  (newKeyword) => {
    const normalizedKeyword = getLegacyDecodedQueryValue(newKeyword);

    if (normalizedKeyword) {
      keyword.value = normalizedKeyword;
      searchByKeyword();
    } else {
      keyword.value = '';
      sources.value = [];
      searchPerformed.value = false;
      resetLoadingState();
    }
  }
);

</script>

<style scoped>
@import "tailwindcss" reference;
</style>
