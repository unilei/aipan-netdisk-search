// 搜索状态管理 composable
export const useSearchState = () => {
  // 基础状态
  const sources = ref([]);
  const vodData = ref([]);
  const skeletonLoading = ref(false);
  const searchPerformed = ref(false);
  
  // 加载进度状态
  const loadingProgress = ref({
    total: 0,
    completed: 0,
    isLoading: false,
  });
  
  // VOD加载状态
  const loadingStatus = ref(new Map());
  
  // 从URL读取初始分类
  const route = useRoute();
  const initialCategory = route.query.category || "clouddrive";
  
  // 分类状态
  const category = ref(initialCategory);
  
  // 分类配置
  const categories = [
    {
      value: "clouddrive",
      label: "网盘搜索",
      icon: "fas fa-cloud",
      description: "搜索各大网盘资源"
    },
    {
      value: "onlineVod",
      label: "在线影视",
      icon: "fas fa-play-circle",
      description: "搜索在线影视资源"
    }
  ];

  // 切换分类
  const switchCategory = (newCategory) => {
    category.value = newCategory;
    
    // 更新URL参数
    const router = useRouter();
    const currentQuery = { ...route.query };
    router.push({
      query: {
        ...currentQuery,
        category: newCategory
      }
    });
    
    // 重置相关状态
    if (newCategory === "clouddrive") {
      vodData.value = [];
      loadingStatus.value.clear();
    } else if (newCategory === "onlineVod") {
      sources.value = [];
      loadingProgress.value = {
        total: 0,
        completed: 0,
        isLoading: false,
      };
    }
  };

  // 重置所有状态
  const resetAllState = () => {
    sources.value = [];
    vodData.value = [];
    skeletonLoading.value = false;
    searchPerformed.value = false;
    loadingProgress.value = {
      total: 0,
      completed: 0,
      isLoading: false,
    };
    loadingStatus.value.clear();
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

  // 重置VOD状态
  const resetVodState = () => {
    vodData.value = [];
    searchPerformed.value = false;
    loadingStatus.value.clear();
  };

  return {
    // 状态
    sources,
    vodData,
    skeletonLoading,
    searchPerformed,
    loadingProgress,
    loadingStatus,
    category,
    categories,
    
    // 方法
    switchCategory,
    resetAllState,
    resetSearchState,
    resetVodState
  };
};
