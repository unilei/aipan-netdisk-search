<template>
  <div class="admin-page-bg">
    <div class="mx-auto space-y-6">
      <!-- 头部 -->
      <div class="admin-card-bg rounded-lg p-6 shadow-sm">
        <div class="flex flex-col gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">搜索统计</h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">查看用户搜索记录和热门关键词</p>
          </div>
          <!-- 统计周期选择 -->
          <div class="flex flex-wrap items-center gap-4">
            <el-radio-group v-model="statsPeriod" @change="getStats" size="default">
              <el-radio-button :value="'today'">今日</el-radio-button>
              <el-radio-button :value="'week'">本周</el-radio-button>
              <el-radio-button :value="'month'">本月</el-radio-button>
              <el-radio-button :value="'all'">全部</el-radio-button>
              <el-radio-button :value="'custom'">自定义日期</el-radio-button>
            </el-radio-group>
            <el-date-picker
              v-if="statsPeriod === 'custom'"
              v-model="customDate"
              type="date"
              placeholder="选择日期"
              @change="getStats"
              :clearable="false"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </div>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="admin-card-bg rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">总搜索次数</h3>
          <div class="text-3xl font-bold text-blue-600">
            {{ stats.totalSearches }}
          </div>
        </div>
        <div class="admin-card-bg rounded-lg p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold dark:text-gray-200">{{ periodTitle }}</h3>
            <el-tag v-if="customDate && statsPeriod === 'custom'" size="small" type="info">
              {{ formatDate(customDate) }}
            </el-tag>
          </div>
          <div class="text-3xl font-bold text-green-600">
            {{ stats.periodSearches }}
          </div>
        </div>
        <div class="admin-card-bg rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-semibold mb-4 dark:text-gray-200">独立关键词数</h3>
          <div class="text-3xl font-bold text-purple-600">
            {{ stats.uniqueKeywords }}
          </div>
        </div>
      </div>

      <!-- 搜索排行榜 -->
      <div class="admin-card-bg rounded-lg p-6 shadow-sm">
        <div class="flex flex-col gap-4 mb-6">
          <h2 class="text-lg font-semibold dark:text-gray-200">搜索排行榜</h2>
          <div class="flex flex-wrap items-center gap-4">
            <el-radio-group v-model="period" @change="getSearchRanking" size="default">
              <el-radio-button :value="'day'">今日</el-radio-button>
              <el-radio-button :value="'week'">本周</el-radio-button>
              <el-radio-button :value="'month'">本月</el-radio-button>
              <el-radio-button :value="'all'">全部</el-radio-button>
              <el-radio-button :value="'custom'">自定义日期</el-radio-button>
            </el-radio-group>
            <el-date-picker
              v-if="period === 'custom'"
              v-model="rankingCustomDate"
              type="date"
              placeholder="选择日期"
              @change="getSearchRanking"
              :clearable="false"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </div>
        </div>

        <el-table 
          :data="rankingList" 
          stripe 
          v-loading="rankingLoading"
          :empty-text="rankingList.length === 0 ? '暂无搜索数据' : '数据加载中...'"
        >
          <el-table-column label="排名" width="80" align="center">
            <template #default="{ $index }">
              <div class="flex items-center justify-center">
                <span
                  v-if="$index < 3"
                  :class="[
                    'w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold',
                    $index === 0
                      ? 'bg-yellow-500'
                      : $index === 1
                      ? 'bg-gray-400'
                      : 'bg-amber-600',
                  ]"
                >
                  {{ $index + 1 }}
                </span>
                <span v-else class="text-gray-600 font-medium">{{ $index + 1 }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="keyword" label="关键词" min-width="150">
            <template #default="{ row }">
              <span class="font-medium text-gray-800 dark:text-gray-200">{{ row.keyword }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="count" label="搜索次数" width="150" align="center">
            <template #default="{ row }">
              <el-tag type="primary" size="default" round>
                <i class="fas fa-search mr-1"></i>
                {{ row.count }} 次
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastSearchAt" label="最后搜索时间" width="180">
            <template #default="{ row }">
              {{ new Date(row.lastSearchAt).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="flex items-center gap-2">
                <el-button
                  type="primary"
                  size="small"
                  :loading="row.loading"
                  @click="handleSearch(row)"
                >
                  <i class="fas fa-cloud-download-alt mr-1"></i>
                  转存资源
                </el-button>
                <el-tag v-if="row.successCount" type="success" size="small">
                  已转存: {{ row.successCount }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 转存进度弹窗 -->
      <el-dialog
        v-model="transferDialog.visible"
        title="资源转存进度"
        width="500px"
        :close-on-click-modal="false"
      >
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-gray-600"
              >正在转存: {{ transferDialog.keyword }}</span
            >
            <el-tag :type="queueState.isProcessing ? 'warning' : 'success'">
              {{ queueState.isProcessing ? "处理中" : "已完成" }}
            </el-tag>
          </div>

          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex justify-between mb-2">
              <span
                >进度: {{ queueState.processedTasks }}/{{
                  queueState.totalTasks
                }}</span
              >
              <span>成功: {{ queueState.successCount }}</span>
            </div>
            <el-progress
              :percentage="
                Math.round(
                  (queueState.processedTasks / queueState.totalTasks) * 100
                )
              "
              :status="queueState.isProcessing ? '' : 'success'"
            />
          </div>

          <div v-if="queueState.errorCount > 0" class="text-red-500 text-sm">
            失败数量: {{ queueState.errorCount }}
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <el-button
              @click="transferDialog.visible = false"
              :disabled="queueState.isProcessing"
            >
              关闭
            </el-button>
            <el-button
              type="primary"
              @click="handlePauseResume"
              v-if="queueState.isProcessing"
            >
              {{ queueState.isPaused ? "继续" : "暂停" }}
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "admin",
  middleware: ["admin"],
});

const period = ref("all");
const rankingList = ref([]);
const rankingCustomDate = ref("");
const rankingLoading = ref(false);
const stats = reactive({
  totalSearches: 0,
  periodSearches: 0,
  uniqueKeywords: 0,
});

// 统计周期选择
const statsPeriod = ref("today");
const customDate = ref("");

// 计算周期标题
const periodTitle = computed(() => {
  switch (statsPeriod.value) {
    case "today":
      return "今日搜索次数";
    case "week":
      return "本周搜索次数";
    case "month":
      return "本月搜索次数";
    case "all":
      return "全部搜索次数";
    case "custom":
      return "指定日期搜索次数";
    default:
      return "搜索次数";
  }
});

// 格式化日期
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// 转存相关状态
const transferDialog = reactive({
  visible: false,
  keyword: "",
});

const queueState = reactive({
  isProcessing: false,
  totalTasks: 0,
  processedTasks: 0,
  successCount: 0,
  errorCount: 0,
  isPaused: false,
  tasks: [],
});

// 获取夸克配置
const quarkConfig = ref({
  apiUrl: "",
  quarkCookie: "",
  typeId: "",
  userId: "",
  enabled: false,
});

// 导入搜索源配置
import sourcesConfig from "~/assets/vod/clouddrive.json";

// 获取搜索排行榜
const getSearchRanking = async () => {
  rankingLoading.value = true;
  try {
    let url = `/api/admin/search/record?period=${period.value}`;
    if (period.value === "custom" && rankingCustomDate.value) {
      url += `&date=${rankingCustomDate.value}`;
    }
    
    const res = await $fetch(url, {
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });
    if (res.code === 200) {
      // 为每个排行项添加必要的属性
      rankingList.value = res.data.map((item) => ({
        ...item,
        loading: false,
        successCount: 0,
      }));
    }
  } catch (error) {
    console.error("获取搜索排行失败:", error);
    ElMessage.error("获取搜索排行失败");
  } finally {
    rankingLoading.value = false;
  }
};

// 获取统计数据
const getStats = async () => {
  try {
    let url = `/api/admin/search/stats?period=${statsPeriod.value}`;
    if (statsPeriod.value === "custom" && customDate.value) {
      url += `&date=${customDate.value}`;
    }
    
    const res = await $fetch(url, {
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });
    if (res.code === 200) {
      Object.assign(stats, res.data);
    }
  } catch (error) {
    console.error("获取统计数据失败:", error);
    ElMessage.error("获取统计数据失败");
  }
};

// 获取夸克配置
const getQuarkConfig = async () => {
  try {
    const res = await $fetch("/api/admin/settings/quark", {
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });
    if (res.code === 200) {
      quarkConfig.value = res.data;
    }
  } catch (error) {
    console.error("获取夸克配置失败:", error);
    ElMessage.error("获取夸克配置失败");
  }
};

// 随机延迟函数
const randomDelay = (min, max) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// 保存到夸克网盘
const saveToQuarkAsync = async (link, name) => {
  // if (!quarkConfig.value.enabled) {
  //     return false;
  // }

  try {
    if (
      !quarkConfig.value.quarkCookie ||
      !quarkConfig.value.typeId ||
      !quarkConfig.value.userId
    ) {
      throw new Error("夸克网盘配置不完整，请检查配置");
    }

    const saveRes = await $fetch(quarkConfig.value.apiUrl, {
      method: "POST",
      body: {
        shareurl: link,
        savepath: `/yingshifenxiang/${name}`,
      },
      headers: {
        Cookiequark: quarkConfig.value.quarkCookie,
        "Content-Type": "application/json",
      },
    });

    if (saveRes.code === 401 || saveRes.code === 403) {
      ElMessage.error("认证失败，请重新配置夸克网盘");
      return false;
    }

    let shareInfo = saveRes.data.share_info;
    if (shareInfo) {
      await $fetch("/api/quark/post", {
        method: "POST",
        body: {
          name,
          links: JSON.stringify([
            { key: Date.now(), value: shareInfo.share_url },
          ]),
          typeId: quarkConfig.value.typeId,
          userId: quarkConfig.value.userId,
        },
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error("Error saving quark file:", err);
    return false;
  }
};

// 处理队列
const processQueue = async () => {
  if (
    queueState.isProcessing ||
    queueState.tasks.length === 0 ||
    queueState.isPaused ||
    queueState.successCount >= 3
  ) {
    return;
  }

  queueState.isProcessing = true;

  try {
    const task = queueState.tasks[0];
    await randomDelay(2000, 5000);

    const success = await saveToQuarkAsync(task.link, task.name);
    if (success) {
      queueState.successCount++;
      if (queueState.successCount >= 3) {
        queueState.tasks = [];
        ElMessage.success("已完成3个资源的转存");
        return;
      }
    } else {
      queueState.errorCount++;
    }

    queueState.tasks.shift();
    queueState.processedTasks++;
  } catch (error) {
    console.error("Error processing queue:", error);
    queueState.errorCount++;
  } finally {
    queueState.isProcessing = false;
    if (
      queueState.tasks.length > 0 &&
      !queueState.isPaused &&
      queueState.successCount < 3
    ) {
      processQueue();
    }
  }
};

// 处理搜索和转存
const handleSearch = async (row) => {
  if (row.loading) return;
  row.loading = true;

  try {
    // 重置状态
    Object.assign(queueState, {
      isProcessing: false,
      totalTasks: 0,
      processedTasks: 0,
      successCount: 0,
      errorCount: 0,
      isPaused: false,
      tasks: [],
    });

    // 存储所有搜索结果
    let allResults = [];

    // 遍历所有搜索源
    for (const source of sourcesConfig) {
      try {
        const res = await $fetch(source.api, {
          method: "POST",
          body: {
            name: row.keyword,
          },
        });

        if (res.list && Array.isArray(res.list)) {
          allResults.push(...res.list);
        }
      } catch (error) {
        console.error(`搜索源 ${source.api} 失败:`, error);
        continue;
      }
    }

    if (allResults.length > 0) {
      // 获取所有夸克链接
      const quarkLinks = allResults.filter(
        (result) =>
          result.links && result.links.some((link) => link.service === "QUARK")
      );

      // 将任务添加到队列（限制最多3个任务）
      let taskCount = 0;
      for (const result of quarkLinks) {
        const links = result.links.filter((link) => link.service === "QUARK");
        for (const link of links) {
          if (taskCount >= 3) break;
          queueState.tasks.push({
            link: link.link,
            name: result.name,
          });
          taskCount++;
        }
        if (taskCount >= 3) break;
      }

      queueState.totalTasks = queueState.tasks.length;

      if (queueState.totalTasks > 0) {
        transferDialog.visible = true;
        transferDialog.keyword = row.keyword;
        row.successCount = 0;
        const originalSuccessCount = queueState.successCount;

        watch(
          () => queueState.successCount,
          (newCount) => {
            row.successCount = newCount - originalSuccessCount;
          }
        );

        processQueue();
      } else {
        ElMessage.warning("未找到可转存的夸克资源");
      }
    } else {
      ElMessage.warning("未找到相关资源");
    }
  } catch (error) {
    console.error("搜索失败:", error);
    ElMessage.error("搜索失败");
  } finally {
    row.loading = false;
  }
};

// 处理暂停/继续
const handlePauseResume = () => {
  queueState.isPaused = !queueState.isPaused;
  if (!queueState.isPaused) {
    processQueue();
  }
};

onMounted(() => {
  getSearchRanking();
  getStats();
  getQuarkConfig();
});
</script>
