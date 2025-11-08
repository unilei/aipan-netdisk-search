<template>
  <div
    class="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300"
  >
    <SearchHeader
      :keyword="keyword"
      @search="search"
      class="mb-2"
    />

    <client-only>
      <!-- Category Tabs -->
      <CategoryTabs
        :categories="categories"
        :current-category="category"
        :show-settings-button="!userStore.loggedIn"
        :loading-progress="loadingProgress"
        @switch-category="switchCategory"
      />
    </client-only>

    <!-- 群二维码显示在搜索结果前 -->
    <div
      v-if="shouldShowInSearchResults && searchPerformed"
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3"
    >
      <GroupQrCode variant="search-result" />
    </div>

    <!-- Main Content Area -->
    <SearchContent
      :category="category"
      :sources="sources"
      :skeleton-loading="skeletonLoading"
      :vod-data="vodData"
      :loading-status="loadingStatus"
      :loading-progress="loadingProgress"
      :search-performed="searchPerformed"
    />
  </div>
</template>

<script setup>
import SearchHeader from "~/components/search/SearchHeader.vue";
import CategoryTabs from "~/components/search/CategoryTabs.vue";
import SearchContent from "~/components/search/SearchContent.vue";
import GroupQrCode from "~/components/GroupQrCode.vue";
import sourcesApiEndpointsGuest from "~/assets/vod/clouddrive.json";
import sourcesApiEndpointsLoggedIn from "~/assets/vod/clouddrive-login.json";
import { badWords } from "~/utils/sensitiveWords";
import { useUserStore } from "~/stores/user";
import { useVodSources } from "~/composables/useVodSources";
import { useSearchState } from "~/composables/useSearchState";
import { useSearchLogic } from "~/composables/useSearchLogic";
import { useQuarkConfig } from "~/composables/useQuarkConfig";
import { useSearchQueue } from "~/composables/useSearchQueue";
import { useGroupQrConfig } from "~/composables/useGroupQrConfig";

definePageMeta({
  layout: "custom",
});

// 基础设置
const route = useRoute();
const userStore = useUserStore();

// 使用 composables
const { sources: vodConfigSources, loadSources } = useVodSources();
const {
  sources,
  vodData,
  skeletonLoading,
  searchPerformed,
  loadingProgress,
  loadingStatus,
  category,
  categories,
  switchCategory,
} = useSearchState();

const { handleSearch, searchByVod, cleanup } = useSearchLogic();
const { getQuarkConfig } = useQuarkConfig();
const { stopQueueProcessing } = useSearchQueue();
const { shouldShowInSearchResults, getConfig: getGroupQrConfig } =
  useGroupQrConfig();

// 关键词
const keyword = ref(route.query.keyword ? decodeURIComponent(route.query.keyword) : '');

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
const search = (searchText) => {
  keyword.value = searchText;
  searchByKeyword();
};

// 搜索函数
const searchByKeyword = async () => {
  if (!keyword.value || keyword.value.trim() === "") {
    return;
  }

  // 敏感词检查
  if (checkSensitiveWords(keyword.value)) {
    ElMessage.error("搜索内容包含敏感词，请修改后重试");
    return;
  }

  // 立即设置搜索状态和加载状态，避免显示空状态
  searchPerformed.value = true;

  if (category.value === "clouddrive") {
    // 立即设置加载状态
    loadingProgress.value.isLoading = true;
    loadingProgress.value.total = sourcesApiEndpoints.value.length;
    loadingProgress.value.completed = 0;

    await handleSearch(
      keyword.value,
      sources,
      loadingProgress,
      sourcesApiEndpoints.value
    );
  } else if (category.value === "onlineVod") {
    // 立即设置VOD加载状态
    loadingStatus.value.clear();
    // 为每个VOD源设置加载状态
    vodConfigSources.value.forEach((vodApi) => {
      loadingStatus.value.set(vodApi.api, true);
    });

    await searchByVod(keyword.value, vodData, loadingStatus, vodConfigSources);
  }
};

// 初始化
onMounted(async () => {
  try {
    await Promise.all([
      getQuarkConfig(),
      getGroupQrConfig(),
      loadSources()
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

// 监听路由变化
watch(
  () => route.query.keyword,
  (newKeyword) => {
    if (newKeyword) {
      keyword.value = decodeURIComponent(newKeyword);
      searchByKeyword();
    } else {
      keyword.value = '';
    }
  }
);

// 监听分类变化
watch(category, async () => {
  // 执行搜索
  if (keyword.value && keyword.value.trim() !== "") {
    await searchByKeyword();
  }
});
</script>

<style scoped>
@import "tailwindcss" reference;
</style>
