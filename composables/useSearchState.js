// 搜索状态管理 composable
export const useSearchState = () => {
  // 基础状态
  const sources = ref([]);
  const skeletonLoading = ref(false);
  const searchPerformed = ref(false);
  
  // 加载进度状态
  const loadingProgress = ref({
    total: 0,
    completed: 0,
    isLoading: false,
  });
  
  // 重置所有状态
  const resetAllState = () => {
    sources.value = [];
    skeletonLoading.value = false;
    searchPerformed.value = false;
    loadingProgress.value = {
      total: 0,
      completed: 0,
      isLoading: false,
    };
  };

  // 重置搜索状态
  const resetSearchState = () => {
    sources.value = [];
    searchPerformed.value = false;
    loadingProgress.value = {
      total: 0,
      completed: 0,
      isLoading: false,
    };
  };

  return {
    // 状态
    sources,
    skeletonLoading,
    searchPerformed,
    loadingProgress,
    
    // 方法
    resetAllState,
    resetSearchState
  };
};
