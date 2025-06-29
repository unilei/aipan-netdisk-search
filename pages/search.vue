<template>
  <div
    class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
    <search-header :keyword="keyword" @search="search" class="mb-2"></search-header>

    <!-- Category Tabs -->
    <CategoryTabs :categories="categories" :current-category="category" :show-settings-button="!userStore.loggedIn"
      :loading-progress="loadingProgress" @switch-category="switchCategory" />

    <!-- Main Content Area -->
    <SearchContent :category="category" :sources="sources" :skeleton-loading="skeletonLoading" :vod-data="vodData"
      :loading-status="loadingStatus" :loading-progress="loadingProgress" :search-performed="searchPerformed" />
  </div>
</template>

<script setup>
import SearchHeader from "~/components/search/SearchHeader.vue";
import CategoryTabs from "~/components/search/CategoryTabs.vue";
import SearchContent from "~/components/search/SearchContent.vue";
import sourcesApiEndpoints from "~/assets/vod/clouddrive.json";
import { badWords } from "~/utils/sensitiveWords";
import { useUserStore } from "~/stores/user";
import { useVodSources } from "~/composables/useVodSources";
import { useSearchState } from "~/composables/useSearchState";
import { useSearchLogic } from "~/composables/useSearchLogic";
import { useQuarkConfig } from "~/composables/useQuarkConfig";
import { useSearchQueue } from "~/composables/useSearchQueue";

definePageMeta({
  layout: "custom",
});

// 基础设置
const route = useRoute();
const userStore = useUserStore();
const config = useRuntimeConfig();

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
  resetSearchState,
  resetVodState
} = useSearchState();

const { smartCache } = useSmartCache();
const { handleSearch, searchByVod, cleanup } = useSearchLogic();
const { getQuarkConfig } = useQuarkConfig();
const { stopQueueProcessing } = useSearchQueue();

// 关键词
const keyword = ref(decodeURIComponent(route.query.keyword));

// 敏感词检查
const checkSensitiveWords = (text) => {
  return badWords.some(word => text.toLowerCase().includes(word.toLowerCase()));
};

// 搜索函数
const search = async () => {
  if (!keyword.value || keyword.value.trim() === "") {
    return;
  }

  // 敏感词检查
  if (checkSensitiveWords(keyword.value)) {
    ElMessage.error("搜索内容包含敏感词，请修改后重试");
    return;
  }

  searchPerformed.value = true;

  if (category.value === "clouddrive") {
    await handleSearch(keyword.value, sources, loadingProgress, sourcesApiEndpoints);
  } else if (category.value === "onlineVod") {
    await searchByVod(keyword.value, vodData, loadingStatus, vodConfigSources);
  }
};

// 初始化
onMounted(async () => {
  // 初始化缓存系统
  if (import.meta.client && smartCache) {
    smartCache.init();
  }

  await getQuarkConfig();
  await loadSources();

  if (keyword.value && keyword.value.trim() !== "") {
    await search();
  }
});

// 清理
onUnmounted(() => {
  stopQueueProcessing();
  cleanup();

  // 清理缓存系统
  if (smartCache && typeof smartCache.destroy === 'function') {
    smartCache.destroy();
  }
});

// 监听路由变化
watch(() => route.query.keyword, (newKeyword) => {
  if (newKeyword) {
    keyword.value = decodeURIComponent(newKeyword);
    search();
  }
});

// 监听分类变化
watch(category, (newCategory) => {
  if (keyword.value && keyword.value.trim() !== "") {
    search();
  }
});
</script>

<style scoped>
/* Button styles */
.el-button {
  @apply font-medium border-none shadow-sm hover:shadow-md relative overflow-hidden;
  transition: all 0.3s ease;
}

.el-button:hover {
  transform: translateY(-1px);
}

/* Hide scrollbar */
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

/* Progress bar */
:deep(.el-progress-bar__inner) {
  @apply bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500;
}

:deep(.el-progress-bar__outer) {
  @apply bg-gray-100/50 dark:bg-gray-700/50 rounded-full overflow-hidden;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Scrollbar */
::-webkit-scrollbar {
  @apply w-1.5 h-1.5;
}

::-webkit-scrollbar-thumb {
  @apply bg-gradient-to-b from-purple-400/40 to-blue-400/40 rounded-full;
}

/* Animations */
@keyframes shimmer {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

.animate-pulse {
  animation: pulse 2s ease infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}
</style>
