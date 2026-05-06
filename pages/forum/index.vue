<template>
  <main class="min-h-screen bg-[#f8fafc] pb-10 text-slate-950 dark:bg-slate-950 dark:text-white">
    <section class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="mb-4 flex flex-col gap-3 rounded-lg bg-white p-4 dark:bg-white/10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-lg font-semibold text-slate-950 dark:text-white">AIPAN.ME 论坛</h1>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">今日主题 {{ topics?.length || 0 }}，全部主题 {{ totalTopics }}</p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            class="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
            @click="navigateToCreateTopic"
          >
            <i class="fas fa-pen-to-square mr-1.5"></i>
            发帖
          </button>
          <button
            v-if="!user"
            class="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300"
            @click="navigateToLogin"
          >
            <i class="fas fa-sign-in-alt mr-1.5"></i>
            登录
          </button>
        </div>
      </div>

      <div v-if="loading || topicsLoading" class="space-y-3">
        <div class="overflow-hidden rounded-lg bg-white dark:bg-white/10">
          <div class="bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-white/5 dark:text-slate-200">论坛板块</div>
          <div v-for="item in 4" :key="`category-${item}`" class="grid grid-cols-[minmax(0,1fr)_72px_120px] gap-3 border-t border-slate-100 px-3 py-3 dark:border-white/10">
            <div class="h-4 animate-pulse bg-slate-100 dark:bg-white/10"></div>
            <div class="h-4 animate-pulse bg-slate-100 dark:bg-white/10"></div>
            <div class="h-4 animate-pulse bg-slate-100 dark:bg-white/10"></div>
          </div>
        </div>
        <div class="overflow-hidden rounded-lg bg-white dark:bg-white/10">
          <div class="bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-white/5 dark:text-slate-200">最新主题</div>
          <div v-for="item in 6" :key="`topic-${item}`" class="grid grid-cols-[minmax(0,1fr)_72px_72px_120px] gap-3 border-t border-slate-100 px-3 py-3 dark:border-white/10">
            <div class="h-4 animate-pulse bg-slate-100 dark:bg-white/10"></div>
            <div class="h-4 animate-pulse bg-slate-100 dark:bg-white/10"></div>
            <div class="h-4 animate-pulse bg-slate-100 dark:bg-white/10"></div>
            <div class="h-4 animate-pulse bg-slate-100 dark:bg-white/10"></div>
          </div>
        </div>
      </div>

      <div v-else-if="!categories || categories.length === 0" class="rounded-lg bg-white p-10 text-center dark:bg-white/10">
        <i class="fas fa-folder-open text-3xl text-slate-300 dark:text-slate-600"></i>
        <h2 class="mt-4 text-sm font-semibold text-slate-800 dark:text-white">暂无论坛分类</h2>
        <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">管理员尚未创建任何论坛分类。</p>
      </div>

      <div v-else class="space-y-3">
        <section class="overflow-hidden rounded-lg bg-white dark:bg-white/10">
          <div class="flex items-center justify-between bg-slate-50/80 px-3 py-2 dark:bg-white/5">
            <h2 class="text-xs font-semibold text-slate-700 dark:text-slate-200">论坛板块</h2>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">{{ categories.length }} 个板块</span>
          </div>

          <div class="hidden grid-cols-[minmax(0,1fr)_96px_150px] bg-white px-3 py-2 text-xs text-slate-400 dark:bg-transparent dark:text-slate-500 md:grid">
            <div>版块</div>
            <div class="text-center">主题</div>
            <div>最后发表</div>
          </div>

          <div
            v-for="category in categories"
            :key="category.id"
            class="grid gap-2 border-t border-slate-100 px-3 py-3 transition hover:bg-slate-50/80 dark:border-white/10 dark:hover:bg-white/5 md:grid-cols-[minmax(0,1fr)_96px_150px] md:items-center"
          >
            <button class="flex min-w-0 items-start text-left" @click="navigateToCategory(category.slug)">
              <span class="mr-3 mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                <i :class="[category.icon || 'fas fa-comments', 'text-sm']"></i>
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-slate-950 transition hover:text-blue-600 dark:text-white dark:hover:text-blue-300">{{ category.name }}</span>
                <span class="mt-1 block line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {{ category.description || "暂无简介" }}
                </span>
              </span>
            </button>

            <div class="text-xs text-slate-500 dark:text-slate-400 md:text-center">
              <span class="font-semibold text-slate-700 dark:text-slate-200">{{ category._count?.topics || 0 }}</span>
              <span class="md:hidden"> 个主题</span>
            </div>

            <div class="text-xs leading-5 text-slate-500 dark:text-slate-400">
              <span class="block text-slate-700 dark:text-slate-300">暂无</span>
              <span>进入板块查看最新讨论</span>
            </div>
          </div>
        </section>

        <section class="overflow-hidden rounded-lg bg-white dark:bg-white/10">
          <div class="flex items-center justify-between bg-slate-50/80 px-3 py-2 dark:bg-white/5">
            <h2 class="text-xs font-semibold text-slate-700 dark:text-slate-200">最新主题</h2>
            <button class="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300" @click="navigateToCreateTopic">发表主题</button>
          </div>

          <div v-if="!topics || topics.length === 0" class="p-10 text-center">
            <i class="fas fa-comments text-3xl text-slate-300 dark:text-slate-600"></i>
            <h3 class="mt-4 text-sm font-semibold text-slate-800 dark:text-white">暂无主题</h3>
            <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">成为第一个发表主题的用户。</p>
          </div>

          <div v-else>
            <div class="hidden grid-cols-[minmax(0,1fr)_80px_80px_140px] bg-white px-3 py-2 text-xs text-slate-400 dark:bg-transparent dark:text-slate-500 md:grid">
              <div>主题</div>
              <div class="text-center">回复</div>
              <div class="text-center">浏览</div>
              <div>最后发表</div>
            </div>

            <ul>
              <li
                v-for="topic in topics"
                :key="topic.id"
                class="grid gap-2 border-t border-slate-100 px-3 py-3 transition hover:bg-slate-50/80 dark:border-white/10 dark:hover:bg-white/5 md:grid-cols-[minmax(0,1fr)_80px_80px_140px] md:items-center"
              >
                <div class="min-w-0">
                  <div class="flex min-w-0 items-center gap-2">
                    <i :class="[getTopicIconClass(topic), 'shrink-0 text-xs']"></i>
                    <NuxtLink
                      :to="`/forum/topic/${topic.slug}`"
                      class="truncate text-sm font-semibold text-slate-950 transition hover:text-blue-600 dark:text-white dark:hover:text-blue-300"
                    >
                      <span v-if="topic.isSticky" class="mr-1 text-[11px] text-red-600 dark:text-red-300">[置顶]</span>
                      {{ topic.title }}
                    </NuxtLink>
                  </div>
                  <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <NuxtLink :to="`/forum/category/${topic.category.slug}`" class="text-blue-600 hover:text-blue-700 dark:text-blue-300">
                      {{ topic.category.name }}
                    </NuxtLink>
                    <span>{{ topic.author.username }}</span>
                    <span>{{ formatDate(topic.createdAt) }}</span>
                  </div>
                </div>

                <div class="text-xs text-slate-500 dark:text-slate-400 md:text-center">
                  <span class="font-semibold text-slate-700 dark:text-slate-200">{{ topic._count?.posts || 0 }}</span>
                  <span class="md:hidden"> 回复</span>
                </div>

                <div class="text-xs text-slate-500 dark:text-slate-400 md:text-center">
                  <span class="font-semibold text-slate-700 dark:text-slate-200">{{ topic.viewCount || 0 }}</span>
                  <span class="md:hidden"> 浏览</span>
                </div>

                <div class="text-xs leading-5 text-slate-500 dark:text-slate-400">
                  <span class="block">{{ formatDate(topic.lastActivityAt || topic.createdAt) }}</span>
                  <span>{{ latestLabel(topic) }}</span>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <div v-if="pagination && pagination.totalPages > 1" class="flex justify-center">
          <div class="rounded-lg bg-white/70 p-2 dark:bg-white/10">
            <el-pagination
              background
              layout="prev, pager, next"
              :total="pagination.total"
              :page-size="pagination.pageSize"
              :current-page="pagination.page"
              :hide-on-single-page="true"
              class="forum-pagination"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

useSeoMeta({
  title: "AIPAN论坛 - 用户交流社区 | 分享讨论技术话题",
  description:
    "AIPAN论坛是一个活跃的用户交流社区，用户可以在这里分享想法、提问、参与讨论。涵盖技术交流、资源分享、使用心得等多个话题分类，连接社区中的每一个人。",
  keywords: "论坛社区,用户交流,技术讨论,资源分享,问答社区,AIPAN论坛,在线讨论,社区互动",
  ogTitle: "AIPAN论坛 - 用户交流社区",
  ogDescription: "AIPAN论坛是活跃的用户交流社区，分享想法、提问、参与讨论，连接社区中的每一个人。",
  twitterTitle: "AIPAN论坛 - 用户交流社区",
  twitterDescription: "活跃的用户交流社区！分享想法、提问、参与讨论，连接社区中的每一个人。",
});

definePageMeta({
  layout: "default",
  title: "社区论坛",
  middleware: [],
});

const router = useRouter();
const userStore = useUserStore();
const user = computed(() => userStore.user);

const {
  data: categoriesData,
  pending: loading,
  refresh,
} = await useFetch("/api/forum/categories");

const categories = computed(() => {
  if (!categoriesData.value || !categoriesData.value.success) return [];
  return categoriesData.value.data;
});

const totalTopics = computed(() => {
  if (!categories.value) return 0;
  return categories.value.reduce((total, category) => {
    return total + (category._count?.topics || 0);
  }, 0);
});

const page = ref(1);
const pageSize = ref(20);

const {
  data: topicsData,
  pending: topicsLoading,
  refresh: refreshTopics,
} = await useFetch(
  () => `/api/forum/topics?page=${page.value}&pageSize=${pageSize.value}`
);

const topics = computed(() => {
  if (!topicsData.value || !topicsData.value.success) return [];
  return topicsData.value.data.topics;
});

const pagination = computed(() => {
  if (!topicsData.value || !topicsData.value.success) return null;
  return topicsData.value.data.pagination;
});

const getTopicIconClass = (topic) => {
  if (topic.isLocked) return "fas fa-lock text-slate-400";
  if (topic.isSticky) return "fas fa-thumbtack text-red-500";
  return "far fa-comment-dots text-[#7da2c8]";
};

const latestLabel = (topic) => {
  return topic.lastActivityAt ? "最后回复" : "主题发布";
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: zhCN,
    });
  } catch (error) {
    return "未知时间";
  }
};

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
@import "tailwindcss" reference;

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.forum-pagination.el-pagination.is-background .el-pager li:not(.is-disabled).is-active {
  background: rgb(37 99 235);
  border-color: rgb(37 99 235);
  color: white;
}
</style>
