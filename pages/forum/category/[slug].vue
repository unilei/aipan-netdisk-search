<template>
  <main class="min-h-screen bg-[#f8fafc] pb-10 text-slate-950 dark:bg-slate-950 dark:text-white">
    <section class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="mb-4 rounded-lg bg-white px-3 py-2 text-xs text-slate-500 dark:bg-white/10 dark:text-slate-400">
        <NuxtLink to="/forum" class="text-blue-600 hover:text-blue-700 dark:text-blue-300">
          <i class="fas fa-home mr-1"></i>
          论坛首页
        </NuxtLink>
        <i class="fas fa-chevron-right mx-2 text-[10px] text-slate-400"></i>
        <span>{{ category?.name || "加载中..." }}</span>
      </div>

      <div v-if="loading" class="space-y-3">
        <div class="rounded-lg bg-white p-3 dark:bg-white/10">
          <div class="h-5 w-40 animate-pulse bg-slate-100 dark:bg-white/10"></div>
          <div class="mt-3 h-4 w-2/3 animate-pulse bg-slate-100 dark:bg-white/10"></div>
        </div>
        <div class="overflow-hidden rounded-lg bg-white dark:bg-white/10">
          <div v-for="item in 6" :key="item" class="grid grid-cols-[minmax(0,1fr)_90px_90px_140px] gap-3 border-t border-slate-100 px-3 py-3 first:border-t-0 dark:border-white/10">
            <div class="h-4 animate-pulse bg-slate-100 dark:bg-white/10"></div>
            <div class="h-4 animate-pulse bg-slate-100 dark:bg-white/10"></div>
            <div class="h-4 animate-pulse bg-slate-100 dark:bg-white/10"></div>
            <div class="h-4 animate-pulse bg-slate-100 dark:bg-white/10"></div>
          </div>
        </div>
      </div>

      <div v-else>
        <div class="mb-4 overflow-hidden rounded-lg bg-white dark:bg-white/10">
          <div class="flex flex-col gap-3 bg-slate-50/80 px-3 py-3 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex min-w-0 items-center">
              <span class="mr-3 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                <i :class="[category?.icon || 'fas fa-comments', 'text-sm']"></i>
              </span>
              <div class="min-w-0">
                <h1 class="truncate text-base font-semibold text-slate-950 dark:text-white">{{ category?.name }}</h1>
                <p class="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{{ category?.description || "暂无简介" }}</p>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <span class="text-xs text-slate-500 dark:text-slate-400">{{ pagination?.total || 0 }} 个主题</span>
              <button
                class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!user"
                @click="navigateToCreateTopic"
              >
                <i class="fas fa-pen-to-square mr-1.5"></i>
                发帖
              </button>
            </div>
          </div>
          <div v-if="!user" class="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
            需要
            <button class="text-blue-600 hover:text-blue-700 dark:text-blue-300" @click="navigateToLogin">登录</button>
            后发布主题。
          </div>
        </div>

        <section class="overflow-hidden rounded-lg bg-white dark:bg-white/10">
          <div class="flex items-center justify-between bg-slate-50/80 px-3 py-2 dark:bg-white/5">
            <h2 class="text-xs font-semibold text-slate-700 dark:text-slate-200">主题列表</h2>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">版块：{{ category?.name || "-" }}</span>
          </div>

          <div v-if="!topics || topics.length === 0" class="p-10 text-center">
            <i class="fas fa-comments text-3xl text-slate-300 dark:text-slate-600"></i>
            <h3 class="mt-4 text-sm font-semibold text-slate-800 dark:text-white">暂无主题</h3>
            <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">成为第一个发表主题的用户。</p>
            <button
              class="mt-4 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
              @click="user ? navigateToCreateTopic() : navigateToLogin()"
            >
              {{ user ? "发帖" : "登录后发帖" }}
            </button>
          </div>

          <div v-else>
            <div class="hidden grid-cols-[minmax(0,1fr)_110px_90px_150px] bg-white px-3 py-2 text-xs text-slate-400 dark:bg-transparent dark:text-slate-500 md:grid">
              <div>主题</div>
              <div>作者</div>
              <div class="text-center">回复 / 查看</div>
              <div>最后发表</div>
            </div>

            <ul>
              <li
                v-for="topic in topics"
                :key="topic.id"
                class="grid gap-2 border-t border-slate-100 px-3 py-3 transition hover:bg-slate-50/80 dark:border-white/10 dark:hover:bg-white/5 md:grid-cols-[minmax(0,1fr)_110px_90px_150px] md:items-center"
              >
                <div class="min-w-0">
                  <div class="flex min-w-0 items-center gap-2">
                    <i :class="[getTopicIconClass(topic), 'shrink-0 text-xs']"></i>
                    <NuxtLink
                      :to="`/forum/topic/${topic.slug}`"
                      class="truncate text-sm font-semibold text-slate-950 transition hover:text-blue-600 dark:text-white dark:hover:text-blue-300"
                    >
                      <span v-if="topic.isSticky" class="mr-1 text-[11px] text-red-600 dark:text-red-300">[置顶]</span>
                      <span v-if="topic.isLocked" class="mr-1 text-[11px] text-slate-500 dark:text-slate-400">[锁定]</span>
                      {{ topic.title }}
                    </NuxtLink>
                  </div>
                  <div class="mt-1 text-xs text-slate-500 dark:text-slate-400 md:hidden">
                    {{ topic.author.username }} · {{ formatDate(topic.createdAt) }}
                  </div>
                </div>

                <div class="hidden text-xs leading-5 text-slate-500 dark:text-slate-400 md:block">
                  <span class="block text-slate-700 dark:text-slate-300">{{ topic.author.username }}</span>
                  <span>{{ formatDate(topic.createdAt) }}</span>
                </div>

                <div class="text-xs text-slate-500 dark:text-slate-400 md:text-center">
                  <span class="font-semibold text-blue-600 dark:text-blue-300">{{ topic._count?.posts || 0 }}</span>
                  /
                  <span>{{ topic.viewCount || 0 }}</span>
                </div>

                <div class="text-xs leading-5 text-slate-500 dark:text-slate-400">
                  <span class="block">{{ formatDate(topic.lastActivityAt || topic.createdAt) }}</span>
                  <span>{{ topic.lastActivityAt ? "最后回复" : "主题发布" }}</span>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <div v-if="pagination && pagination.totalPages > 1" class="mt-3 flex justify-center">
          <div class="rounded-lg bg-white/70 p-2 dark:bg-white/10">
            <el-pagination
              background
              layout="prev, pager, next"
              :total="pagination.total"
              :page-size="pagination.pageSize"
              :current-page="pagination.page"
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

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const user = computed(() => userStore.user);

const slug = route.params.slug;
const page = ref(parseInt(route.query.page || "1"));
const pageSize = 20;
const categoryId = ref(null);

const {
  data: categoryData,
  pending: categoryLoading,
} = await useFetch("/api/forum/categories");

const category = computed(() => {
  if (!categoryData.value?.success) return null;
  const foundCategory = categoryData.value.data.find((item) => item.slug === slug);
  if (foundCategory?.id) {
    categoryId.value = foundCategory.id;
  }
  return foundCategory;
});

useHead({
  title: computed(() =>
    category.value?.name
      ? `${category.value.name} - AIPAN论坛`
      : "AIPAN论坛分类"
  ),
  meta: [
    {
      name: "description",
      content: computed(() =>
        category.value?.description ||
        "浏览 AIPAN 论坛分类下的最新主题讨论。"
      ),
    },
    { name: "robots", content: "index,follow" },
    {
      property: "og:title",
      content: computed(() =>
        category.value?.name
          ? `${category.value.name} - AIPAN论坛`
          : "AIPAN论坛分类"
      ),
    },
    {
      property: "og:description",
      content: computed(() =>
        category.value?.description ||
        "浏览 AIPAN 论坛分类下的最新主题讨论。"
      ),
    },
  ],
  link: [
    {
      rel: "canonical",
      href: computed(() => `https://www.aipan.me/forum/category/${slug}`),
    },
  ],
});

const {
  data,
  pending: topicsLoading,
  refresh: refreshTopics,
} = await useFetch("/api/forum/topics", {
  query: {
    categoryId: computed(() => categoryId.value),
    page,
    pageSize,
  },
});

const loading = computed(() => categoryLoading.value || topicsLoading.value);

const topics = computed(() => {
  if (!data.value?.success) return [];
  return data.value.data.topics.map((topic) => {
    if (!topic.slug) {
      return {
        ...topic,
        slug: topic.id.toString(),
      };
    }
    return topic;
  });
});

const pagination = computed(() => {
  if (!data.value?.success)
    return { total: 0, page: 1, pageSize, totalPages: 0 };
  return data.value.data.pagination;
});

const getTopicIconClass = (topic) => {
  if (topic.isLocked) return "fas fa-lock text-slate-400";
  if (topic.isSticky) return "fas fa-thumbtack text-red-500";
  return "far fa-comment-dots text-[#7da2c8]";
};

function formatDate(dateString) {
  if (!dateString) return "";
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: zhCN,
    });
  } catch (error) {
    return "未知时间";
  }
}

function handlePageChange(newPage) {
  page.value = newPage;
  router.push({ query: { ...route.query, page: newPage } });
}

const navigateToCreateTopic = () => {
  if (category.value?.id) {
    router.push(`/forum/create?categoryId=${category.value.id}`);
  } else {
    router.push("/forum/create");
  }
};

const navigateToLogin = () => {
  if (category.value?.id) {
    router.push(`/login?redirect=/forum/create?categoryId=${category.value.id}`);
  } else {
    router.push("/login?redirect=/forum/create");
  }
};

watch(
  () => route.query.page,
  (newPage) => {
    page.value = parseInt(newPage || "1");
    refreshTopics();
  }
);

watch(
  () => categoryId.value,
  (newCategoryId) => {
    if (newCategoryId) {
      refreshTopics();
    }
  }
);
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
