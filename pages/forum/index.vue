<template>
  <div class="bg-gray-50 dark:bg-gray-900 min-h-screen pb-12">
    <!-- 顶部横幅 -->
    <div class="bg-gradient-to-r from-purple-600 to-blue-400 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="max-w-4xl">
          <h1 class="text-xl font-bold mb-2">社区论坛</h1>
          <p class="text-sm text-blue-100 mb-4">
            分享想法、提问、参与讨论，连接社区中的每一个人
          </p>
          <div class="flex space-x-4">
            <el-button type="default" size="small" @click="navigateToCreateTopic" :disabled="!user"
              class="!bg-white !text-purple-700 hover:!bg-purple-50 border-0">
              <template #icon><i class="fas fa-pen-to-square mr-2"></i></template>
              发布新主题
            </el-button>
            <el-button v-if="!user" type="default" size="small" @click="navigateToLogin"
              class="!bg-transparent !text-white hover:!bg-purple-600 border border-white">
              <template #icon><i class="fas fa-sign-in-alt mr-2"></i></template>
              登录账户
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div v-if="loading || topicsLoading" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
        <!-- 分类骨架屏 -->
        <h2 class="text-sm font-bold mb-4 text-left text-gray-800 dark:text-white flex items-center">
          <div class="w-4 h-4 mr-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </h2>

        <!-- 分类列表骨架 -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <div v-for="i in 4" :key="`category-${i}`"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col">
            <div class="p-3 flex items-start flex-1">
              <div class="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-lg mr-3"></div>
              <div class="flex-1">
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            </div>
            <div class="px-3 py-2 bg-gray-50 dark:bg-gray-750">
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
            </div>
          </div>
        </div>

        <!-- 主题列表骨架 -->
        <h2 class="text-sm font-bold mb-4 text-left text-gray-800 dark:text-white flex items-center">
          <div class="w-4 h-4 mr-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </h2>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-4">
          <!-- 主题列表表头骨架 -->
          <div class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 py-2 px-4 flex">
            <div class="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div class="w-24 hidden md:block ml-2 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div class="w-24 hidden md:block ml-2 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div class="w-36 hidden md:block ml-2 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>

          <!-- 主题列表项骨架 -->
          <div v-for="i in 5" :key="`topic-${i}`" class="border-b border-gray-100 dark:border-gray-700">
            <div class="py-3 px-4">
              <div class="flex">
                <div class="flex-1 pr-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div class="flex items-center mb-1">
                    <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-12 mr-2"></div>
                    <div class="flex items-center">
                      <div class="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full mr-1"></div>
                      <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mr-3"></div>
                    </div>
                    <div class="flex items-center">
                      <div class="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full mr-1"></div>
                      <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                    </div>
                  </div>
                </div>

                <div class="w-24 text-center hidden md:block">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-8 mb-1"></div>
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-12"></div>
                </div>

                <div class="w-24 text-center hidden md:block">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-8 mb-1"></div>
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-12"></div>
                </div>

                <div class="w-36 text-center hidden md:block">
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!categories || categories.length === 0"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
        <div class="mb-6">
          <i class="fas fa-folder-open text-gray-300 text-6xl"></i>
        </div>
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          暂无论坛分类
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          管理员尚未创建任何论坛分类
        </p>
      </div>

      <div v-else>
        <!-- 论坛分类区域 -->
        <h2 class="text-sm font-bold mb-4 text-gray-800 dark:text-white flex items-center">
          <i class="fas fa-layer-group mr-2 text-purple-600 dark:text-purple-400"></i>
          论坛分类
        </h2>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <div v-for="category in categories" :key="category.id"
            class="rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-700 flex flex-col"
            :class="[
              getCategoryColorClass(category.id).bgLight,
              'bg-opacity-30 dark:bg-opacity-20',
            ]">
            <div class="p-3 flex items-start flex-1">
              <div v-if="category.icon" :class="[
                'w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center mr-3',
                getCategoryColorClass(category.id).bgLight,
              ]">
                <i :class="[
                  category.icon,
                  getCategoryColorClass(category.id).text,
                  'text-xs',
                ]"></i>
              </div>
              <div v-else :class="[
                'w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center mr-3',
                getCategoryColorClass(category.id).bgLight,
              ]">
                <i :class="[
                  'fas fa-folder',
                  getCategoryColorClass(category.id).text,
                  'text-xs',
                ]"></i>
              </div>
              <div class="flex-1">
                <h3 class="text-xs font-semibold mb-1 text-gray-800 dark:text-white">
                  {{ category.name }}
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                  {{ category.description }}
                </p>
                <div class="flex text-xs text-gray-500 dark:text-gray-400">
                  <div class="flex items-center mr-2">
                    <i class="fas fa-file-alt mr-1 text-xs"></i>
                    <span class="text-xs">{{
                      category._count?.topics || 0
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="px-3 py-2 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700">
              <button @click="navigateToCategory(category.slug)"
                class="w-full text-xs text-purple-600 dark:text-purple-400 font-medium hover:text-purple-800 dark:hover:text-purple-300 flex items-center justify-between">
                进入板块
                <i class="fas fa-arrow-right text-xs"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 最新主题区域 -->
        <h2 class="text-sm font-bold mb-4 text-gray-800 dark:text-white flex items-center">
          <i class="fas fa-file-alt mr-2 text-blue-600 dark:text-blue-400"></i>
          最新主题
        </h2>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-4">
          <div v-if="!topics || topics.length === 0" class="p-8 text-center">
            <div class="mb-4">
              <i class="fas fa-comments text-gray-300 text-4xl"></i>
            </div>
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              暂无主题
            </h3>
            <p class="text-xs text-gray-500 mb-4">成为第一个发表主题的用户</p>
            <el-button v-if="user" type="primary" @click="navigateToCreateTopic"
              class="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 border-0 !text-xs">
              发布新主题
            </el-button>
          </div>
          <div v-else>
            <div
              class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 py-2 px-4 text-xs text-gray-500 dark:text-gray-400 flex">
              <div class="flex-1">主题</div>
              <div class="w-24 text-center hidden md:block">回复</div>
              <div class="w-24 text-center hidden md:block">浏览</div>
              <div class="w-36 text-center hidden md:block">最后回复</div>
            </div>

            <ul>
              <li v-for="topic in topics" :key="topic.id"
                class="border-b border-gray-100 dark:border-gray-700 last:border-none hover:bg-gray-50 dark:hover:bg-transparent transition-colors">
                <div class="py-3 px-4">
                  <div class="flex">
                    <div class="flex-1 pr-3">
                      <!-- 标题 -->
                      <div class="mb-2 flex items-center">
                        <NuxtLink :to="`/forum/topic/${topic.slug}`"
                          class="text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 text-sm font-medium">
                          <span v-if="topic.isSticky"
                            class="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 text-xs rounded px-1 mr-1.5 align-text-top inline-block">置顶</span>
                          {{ topic.title }}
                        </NuxtLink>
                      </div>

                      <!-- 元信息 -->
                      <div class="flex items-center text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                        <span
                          class="bg-gray-100 dark:bg-gray-750 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded text-xs mr-2">
                          {{ topic.category.name }}
                        </span>
                        <div class="flex items-center mr-3">
                          <div class="w-4 h-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-1">
                            <img :src="getAvatarUrl(topic.author)" :alt="topic.author.username"
                              class="w-full h-full object-cover" />
                          </div>
                          <span>{{ topic.author.username }}</span>
                        </div>
                        <div class="flex items-center">
                          <i class="far fa-clock mr-1 text-xs"></i>
                          <span>{{ formatDate(topic.createdAt) }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- 回复数 -->
                    <div class="w-24 text-center hidden md:block">
                      <div class="text-gray-700 dark:text-gray-300 text-sm font-medium">
                        {{ topic._count?.posts }}
                      </div>
                      <div class="text-gray-500 dark:text-gray-400 text-xs">
                        回复
                      </div>
                    </div>

                    <!-- 浏览数 -->
                    <div class="w-24 text-center hidden md:block">
                      <div class="text-gray-700 dark:text-gray-300 text-sm font-medium">
                        {{ topic.viewCount }}
                      </div>
                      <div class="text-gray-500 dark:text-gray-400 text-xs">
                        浏览
                      </div>
                    </div>

                    <!-- 最后回复时间 -->
                    <div class="w-36 text-center hidden md:block text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDate(topic.lastActivityAt || topic.createdAt) }}
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="pagination && pagination.totalPages > 1" class="flex justify-center mt-4">
          <el-pagination background layout="prev, pager, next" :total="pagination.total"
            :page-size="pagination.pageSize" :current-page="pagination.page" @current-change="handlePageChange"
            :hide-on-single-page="true" class="forum-pagination" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

// SEO优化
useSeoMeta({
  title: 'AIPAN论坛 - 用户交流社区 | 分享讨论技术话题',
  description: 'AIPAN论坛是一个活跃的用户交流社区，用户可以在这里分享想法、提问、参与讨论。涵盖技术交流、资源分享、使用心得等多个话题分类，连接社区中的每一个人。',
  keywords: '论坛社区,用户交流,技术讨论,资源分享,问答社区,AIPAN论坛,在线讨论,社区互动',
  ogTitle: 'AIPAN论坛 - 用户交流社区',
  ogDescription: 'AIPAN论坛是活跃的用户交流社区，分享想法、提问、参与讨论，连接社区中的每一个人。',
  twitterTitle: 'AIPAN论坛 - 用户交流社区',
  twitterDescription: '活跃的用户交流社区！分享想法、提问、参与讨论，连接社区中的每一个人。'
});

definePageMeta({
  layout: "default",
  title: "社区论坛",
  middleware: [],
});

const router = useRouter();
const userStore = useUserStore();
const user = computed(() => userStore.user);

// 获取分类数据
const {
  data: categoriesData,
  pending: loading,
  error,
  refresh,
} = await useFetch("/api/forum/categories");

const categories = computed(() => {
  if (!categoriesData.value || !categoriesData.value.success) return [];
  return categoriesData.value.data;
});

// 计算总主题数（基于分类数据）
const totalTopics = computed(() => {
  if (!categories.value) return 0;
  return categories.value.reduce((total, category) => {
    return total + (category._count?.topics || 0);
  }, 0);
});

// 分页和查询参数
const page = ref(1);
const pageSize = ref(10);

// 获取主题列表
const {
  data: topicsData,
  pending: topicsLoading,
  refresh: refreshTopics,
} = await useFetch(
  () => `/api/forum/topics?page=${page.value}&pageSize=${pageSize.value}`
);

// 主题列表和分页信息
const topics = computed(() => {
  if (!topicsData.value || !topicsData.value.success) return [];
  return topicsData.value.data.topics;
});

const pagination = computed(() => {
  if (!topicsData.value || !topicsData.value.success) return null;
  return topicsData.value.data.pagination;
});

// 分类颜色列表
const categoryColors = [
  {
    bgLight: "bg-purple-100 dark:bg-purple-900",
    text: "text-purple-600 dark:text-purple-400",
  },
  {
    bgLight: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-600 dark:text-blue-400",
  },
  {
    bgLight: "bg-green-100 dark:bg-green-900",
    text: "text-green-600 dark:text-green-400",
  },
  {
    bgLight: "bg-red-100 dark:bg-red-900",
    text: "text-red-600 dark:text-red-400",
  },
  {
    bgLight: "bg-yellow-100 dark:bg-yellow-900",
    text: "text-yellow-600 dark:text-yellow-400",
  },
  {
    bgLight: "bg-indigo-100 dark:bg-indigo-900",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  {
    bgLight: "bg-pink-100 dark:bg-pink-900",
    text: "text-pink-600 dark:text-pink-400",
  },
  {
    bgLight: "bg-teal-100 dark:bg-teal-900",
    text: "text-teal-600 dark:text-teal-400",
  },
];

// 获取分类颜色
const getCategoryColorClass = (categoryId) => {
  const colorIndex =
    (typeof categoryId === "number" ? categoryId : parseInt(categoryId)) %
    categoryColors.length;
  return categoryColors[colorIndex];
};

// 获取用户头像URL
const getAvatarUrl = (author) => {
  if (!author?.username) return "";
  return `https://api.dicebear.com/7.x/${author.avatarStyle || "avataaars"
    }/svg?seed=${encodeURIComponent(author.username)}`;
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
};

// 页码变化处理
const handlePageChange = (newPage) => {
  page.value = newPage;
  refreshTopics();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const navigateToCreateTopic = () => {
  if (!user.value) {
    navigateToLogin();
    return;
  }
  router.push("/forum/create");
};

const navigateToLogin = () => {
  router.push("/login?redirect=/forum/create");
};

const navigateToCategory = (slug) => {
  if (!slug) return;
  router.push(`/forum/category/${slug}`);
};

onMounted(() => {
  refresh();
  refreshTopics();
});
</script>

<style>
/* 添加自定义黑暗模式颜色 */
.dark\:bg-gray-750 {
  @apply dark:bg-gray-700/70;
}

/* 添加文本截断 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
