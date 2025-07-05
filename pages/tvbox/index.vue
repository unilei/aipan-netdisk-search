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

const tvbox = ref([]);
const searchQuery = ref("");
const currentDate = ref("");
const isLoading = ref(true);
const cacheInfo = ref(null);

// 从Redis缓存获取数据
const getDataFromCache = async () => {
  try {
    const res = await $fetch("/api/cache/tvbox", {
      method: "GET",
      query: {
        action: "get",
      },
    });

    if (res.code === 200 && res.data) {
      console.log("TVbox data loaded from Redis cache");
      tvbox.value = res.data;
      return true; // 缓存命中
    }
    return false; // 缓存未命中
  } catch (error) {
    console.error("Error fetching from Redis cache:", error);
    return false; // 当作缓存未命中处理
  }
};

// 保存数据到Redis缓存
const saveDataToCache = async (data) => {
  try {
    await $fetch("/api/cache/tvbox", {
      method: "POST",
      query: {
        action: "set",
        ttl: 86400, // 1天的缓存时间
      },
      body: data,
    });
    console.log("TVbox data saved to Redis cache");
  } catch (error) {
    console.error("Error saving to Redis cache:", error);
  }
};

// 获取缓存信息
const getCacheInfo = async () => {
  try {
    const res = await $fetch("/api/cache/tvbox", {
      method: "GET",
      query: {
        action: "info",
      },
    });

    if (res.code === 200) {
      cacheInfo.value = res.data;
    }
  } catch (error) {
    console.error("Error fetching cache info:", error);
  }
};

const getData = async () => {
  isLoading.value = true;

  // 先尝试从缓存获取
  const cacheHit = await getDataFromCache();

  if (!cacheHit) {
    // 缓存未命中，从API获取数据
    const res = await $fetch("/api/tvbox");
    tvbox.value = res.list || [];

    // 将数据保存到缓存
    if (tvbox.value.length > 0) {
      await saveDataToCache(tvbox.value);
    }
  }

  // 获取缓存信息
  await getCacheInfo();

  isLoading.value = false;
};

// 过滤后的数据源列表
const filteredTvbox = computed(() => {
  return tvbox.value.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.link.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchesSearch;
  });
});

// 计算缓存过期时间的友好显示
const cacheExpiryTime = computed(() => {
  if (!cacheInfo.value || !cacheInfo.value.exists || cacheInfo.value.ttl <= 0) {
    return "无缓存";
  }

  const ttl = cacheInfo.value.ttl;
  if (ttl < 60) {
    return `${ttl}秒后过期`;
  } else if (ttl < 3600) {
    return `${Math.floor(ttl / 60)}分钟后过期`;
  } else if (ttl < 86400) {
    return `${Math.floor(ttl / 3600)}小时后过期`;
  } else {
    return `${Math.floor(ttl / 86400)}天后过期`;
  }
});

onMounted(() => {
  // 设置当前日期（仅在客户端执行，避免hydration mismatch）
  currentDate.value = new Date().toLocaleString();
  getData();
});

const copyTipsMsg = (type, message = "") => {
  ElMessage({
    message: message || (type === "success" ? "复制成功" : "复制失败"),
    type: type,
  });
};

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    copyTipsMsg("success");
  } catch (err) {
    // 降级方案
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      copyTipsMsg("success");
    } catch (err) {
      copyTipsMsg("error", "您的浏览器不支持复制功能");
    }
    document.body.removeChild(textarea);
  }
};

// 手动刷新数据
const refreshData = async () => {
  // 首先删除缓存
  try {
    await $fetch("/api/cache/tvbox", {
      method: "GET",
      query: {
        action: "delete",
      },
    });
    console.log("TVbox cache deleted");
  } catch (error) {
    console.error("Error deleting cache:", error);
  }

  // 然后重新获取数据
  await getData();

  // 显示提示
  ElMessage({
    message: "数据已刷新",
    type: "success",
  });
};
</script>

<template>
  <div class="custom-bg py-[60px] min-h-[calc(100vh-130px)] transition-colors duration-300">
    <div class="max-w-[1240px] mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-fadeIn">
      <!-- 头部区域 -->
      <div class="text-center mb-12">
        <h1
          class="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          TVbox系列数据源接口地址
        </h1>
        <div class="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <span v-if="currentDate" class="flex items-center">
            <i class="fas fa-clock mr-2"></i> {{ currentDate }}
          </span>
          <span v-if="cacheInfo && cacheInfo.exists"
            class="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium shadow-sm">
            <i class="fas fa-database mr-1"></i> {{ cacheExpiryTime }}
          </span>
          <button @click="refreshData"
            class="ml-1 p-2 rounded-full text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-300"
            title="刷新数据">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      <!-- 搜索区域 -->
      <div class="max-w-3xl mx-auto mb-10 space-y-6">
        <div class="relative group w-full md:w-[700px] mx-auto">
          <input type="text" v-model="searchQuery" placeholder="搜索数据源..."
            class="w-full pl-6 pr-12 py-4 rounded-full text-sm bg-white dark:bg-gray-800/80 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all duration-300 shadow-lg dark:shadow-gray-900/30 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
          <span class="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">
            <i class="fas fa-search transition-transform duration-300 group-hover:scale-110"></i>
          </span>
        </div>
      </div>

      <!-- 数据源列表 -->
      <div v-if="isLoading" class="flex items-center justify-center py-16">
        <div class="text-center">
          <div class="relative w-16 h-16 mx-auto mb-4">
            <div class="absolute inset-0 border-4 border-blue-500/30 dark:border-blue-700/30 rounded-full"></div>
            <div
              class="absolute inset-0 border-4 border-t-transparent border-blue-500 dark:border-blue-400 rounded-full animate-spin">
            </div>
          </div>
          <p class="text-gray-600 dark:text-gray-400 font-medium">
            正在加载数据源...
          </p>
        </div>
      </div>

      <div v-else-if="filteredTvbox.length === 0" class="flex items-center justify-center py-16">
        <div class="text-center">
          <div class="w-20 h-20 mx-auto mb-4 text-gray-300 dark:text-gray-600">
            <i class="fas fa-search-minus text-5xl"></i>
          </div>
          <p class="text-gray-600 dark:text-gray-400 font-medium">
            未找到匹配的数据源
          </p>
        </div>
      </div>

      <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="(item, index) in filteredTvbox" :key="index"
          class="bg-white dark:bg-gray-800/90 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden transform hover:scale-[1.02] border border-gray-100 dark:border-gray-700/50">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              {{ item.name }}
            </h3>

            <div class="flex items-center gap-2">
              <input type="text" :value="item.link" readonly
                class="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/70 rounded-lg border border-gray-200 dark:border-gray-700 dark:text-gray-200 focus:outline-none transition-colors duration-300" />
              <button @click="copy(item.link)"
                class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-400 dark:to-blue-500 dark:hover:from-blue-500 dark:hover:to-blue-600 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-blue-500/30 dark:hover:shadow-blue-400/20">
                <i class="fas fa-copy mr-1"></i> 复制
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Backtop -->
    <el-backtop :right="24" :bottom="24"
      class="!bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 dark:from-purple-400 dark:to-blue-400 dark:hover:from-purple-500 dark:hover:to-blue-500 !w-12 !h-12 transition-all duration-300 !rounded-xl group hover:scale-110 !shadow-lg hover:!shadow-xl dark:!shadow-gray-900/30 backdrop-blur-sm flex items-center justify-center">
      <i class="fas fa-arrow-up text-white group-hover:animate-bounce"></i>
    </el-backtop>
  </div>
</template>

<style scoped>
.custom-bg {
  position: relative;
  background-image: url("@/assets/hero-bg-1.png");
  background-size: 100% auto;
  background-position: top;
  background-repeat: no-repeat;
  background-color: rgba(245, 246, 249, 0.95);
}

.custom-bg::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.95) 100%);
  z-index: -1;
}

:root.dark .custom-bg {
  background-color: rgba(17, 24, 39, 0.95);
}

:root.dark .custom-bg::before {
  background: linear-gradient(180deg,
      rgba(17, 24, 39, 0) 0%,
      rgba(17, 24, 39, 0.98) 100%);
}

.animate-fadeIn {
  animation: fadeIn 0.8s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
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

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
