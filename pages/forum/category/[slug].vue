<template>
  <main class="min-h-screen bg-[#f8fafc] py-4 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
    <section class="mx-auto grid max-w-[1100px] gap-4 px-3 md:grid-cols-[minmax(0,1fr)_270px]">
      <div class="min-w-0 space-y-3">
        <section class="v2-box">
          <div class="v2-node-header">
            <div class="flex min-w-0 items-center gap-3">
              <span class="v2-node-icon"><i :class="[category?.icon || 'fas fa-comments']"></i></span>
              <div class="min-w-0">
                <div class="mb-1 text-xs text-[#999]">
                  <NuxtLink to="/forum" class="hover:text-[#4d5256]">论坛首页</NuxtLink>
                  <span class="mx-1">›</span>
                  <span>{{ category?.name || "加载中..." }}</span>
                </div>
                <h1 class="truncate text-lg font-semibold text-[#333] dark:text-white">{{ category?.name || "加载中..." }}</h1>
                <p class="mt-1 text-xs leading-5 text-[#777] dark:text-slate-400">{{ category?.description || "暂无简介" }}</p>
              </div>
            </div>
            <button class="v2-primary-button shrink-0" type="button" @click="user ? navigateToCreateTopic() : navigateToLogin()">
              {{ user ? "发布主题" : "登录后发布" }}
            </button>
          </div>

          <div v-if="loading" class="divide-y divide-[#e2e2e2] dark:divide-white/10">
            <div v-for="item in 8" :key="item" class="v2-topic-row">
              <div class="h-12 w-12 shrink-0 animate-pulse rounded bg-[#f0f0f0] dark:bg-white/10"></div>
              <div class="min-w-0 flex-1">
                <div class="h-4 w-3/4 animate-pulse rounded bg-[#f0f0f0] dark:bg-white/10"></div>
                <div class="mt-3 h-3 w-1/2 animate-pulse rounded bg-[#f0f0f0] dark:bg-white/10"></div>
              </div>
            </div>
          </div>

          <div v-else-if="!category" class="px-4 py-10 text-center text-sm text-[#999]">
            <div class="text-3xl text-amber-500"><i class="fas fa-circle-exclamation"></i></div>
            <p class="mt-3">板块不存在或已被删除</p>
            <NuxtLink to="/forum" class="mt-4 inline-flex v2-primary-button">返回论坛首页</NuxtLink>
          </div>

          <div v-else-if="!topics || topics.length === 0" class="px-4 py-10 text-center text-sm text-[#999]">
            <div class="text-3xl text-[#ccc]"><i class="fas fa-comments"></i></div>
            <p class="mt-3">这个板块还没有主题</p>
            <button class="mt-4 v2-primary-button" type="button" @click="user ? navigateToCreateTopic() : navigateToLogin()">
              {{ user ? "发布第一个主题" : "登录后发布" }}
            </button>
          </div>

          <ul v-else class="divide-y divide-[#e2e2e2] dark:divide-white/10">
            <li v-for="topic in topics" :key="topic.id" class="v2-topic-row">
              <div class="v2-avatar" :title="topic.author.username">
                {{ getInitial(topic.author?.username) }}
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 items-center gap-2">
                  <span v-if="topic.isSticky" class="v2-label text-[#d15f5f]">置顶</span>
                  <span v-if="topic.isLocked" class="v2-label">锁定</span>
                  <NuxtLink :to="`/forum/topic/${topic.slug}`" class="v2-topic-title">
                    {{ topic.title }}
                  </NuxtLink>
                  <span v-if="topic.viewerState?.hasUnread" class="v2-unread-badge">
                    {{ topic.viewerState.unreadCount > 1 ? `未读 ${topic.viewerState.unreadCount}` : "有新回复" }}
                  </span>
                </div>
                <div class="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[#999]">
                  <span>{{ topic.author.username }}</span>
                  <span>•</span>
                  <span>{{ formatDate(topic.createdAt) }}</span>
                  <template v-if="topic.lastActivityAt">
                    <span>•</span>
                    <span>最近回复 {{ formatDate(topic.lastActivityAt) }}</span>
                  </template>
                </div>
              </div>

              <NuxtLink
                :to="`/forum/topic/${topic.slug}`"
                class="v2-reply-count"
                :aria-label="`${topic._count?.posts || 0} 条回复`"
              >
                {{ topic._count?.posts || 0 }}
              </NuxtLink>
            </li>
          </ul>
        </section>

        <div v-if="pagination && pagination.totalPages > 1" class="v2-box p-2">
          <el-pagination
            background
            layout="prev, pager, next"
            :total="pagination.total"
            :page-size="pagination.pageSize"
            :current-page="pagination.page"
            class="forum-pagination justify-center"
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <aside class="space-y-3">
        <section class="v2-box p-4">
          <div class="text-sm font-semibold text-[#333] dark:text-white">{{ category?.name || "板块" }}</div>
          <p class="mt-2 text-xs leading-5 text-[#777] dark:text-slate-400">{{ category?.description || "暂无简介" }}</p>
          <dl class="mt-3 space-y-2 text-xs">
            <div class="flex justify-between">
              <dt class="text-[#999]">主题总数</dt>
              <dd>{{ pagination?.total || 0 }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-[#999]">排序方式</dt>
              <dd>最近回复</dd>
            </div>
          </dl>
        </section>

        <section class="v2-box">
          <div class="v2-side-header">发帖提示</div>
          <div class="space-y-2 px-4 py-3 text-xs leading-5 text-[#666] dark:text-slate-300">
            <p>标题直接写问题或资源名称。</p>
            <p>正文补充背景、链接、截图或已经尝试过的方法。</p>
            <p>如果进入审核，请在“我的帖子和回复”查看状态。</p>
          </div>
        </section>

        <section v-if="otherCategories.length > 0" class="v2-box">
          <div class="v2-side-header">其他板块</div>
          <div class="flex flex-wrap gap-2 px-4 py-3">
            <button
              v-for="item in otherCategories"
              :key="item.id"
              class="rounded bg-[#f5f5f5] px-2 py-1 text-xs text-[#555] hover:bg-[#e8e8e8] dark:bg-white/10 dark:text-slate-300"
              type="button"
              @click="navigateToCategory(item.slug)"
            >
              {{ item.name }}
            </button>
          </div>
        </section>
      </aside>
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
const token = useCookie("token");
const authHeaders = computed(() =>
  user.value && token.value ? { authorization: `Bearer ${token.value}` } : {}
);

const slug = String(route.params.slug || "");
const page = ref(parseInt(route.query.page || "1"));
const pageSize = 20;
const categoryId = ref(null);

const {
  data: categoryData,
  pending: categoryLoading,
} = await useFetch("/api/forum/categories");

const categories = computed(() => {
  if (!categoryData.value?.success) return [];
  return categoryData.value.data;
});

const category = computed(() => categories.value.find((item) => item.slug === slug) || null);

const otherCategories = computed(() =>
  categories.value.filter((item) => item.slug !== slug).slice(0, 12)
);

watch(
  category,
  (value) => {
    categoryId.value = value?.id || null;
  },
  { immediate: true }
);

useHead({
  title: computed(() =>
    category.value?.name
      ? `${category.value.name} - AIPAN论坛`
      : "AIPAN论坛板块"
  ),
  meta: [
    {
      name: "description",
      content: computed(() =>
        category.value?.description ||
        "浏览 AIPAN 论坛板块下的最新主题讨论。"
      ),
    },
    { name: "robots", content: "index,follow" },
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
  headers: authHeaders,
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

const getInitial = (name) => String(name || "?").charAt(0).toUpperCase();

function handlePageChange(newPage) {
  page.value = newPage;
  router.push({ query: { ...route.query, page: newPage } });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const getCreatePath = () => {
  if (category.value?.id) {
    return `/forum/create?categoryId=${category.value.id}`;
  }
  return "/forum/create";
};

const navigateToCreateTopic = () => {
  router.push(getCreatePath());
};

const navigateToLogin = () => {
  router.push(`/login?redirect=${encodeURIComponent(getCreatePath())}`);
};

const navigateToCategory = (categorySlug) => {
  if (!categorySlug) return;
  router.push(`/forum/category/${categorySlug}`);
};

let forumSocket = null;

const handleForumNewReply = () => {
  refreshTopics();
};

const initForumRealtime = () => {
  if (!user.value || !token.value) return;

  const socketIo = useSocketIo();
  forumSocket = socketIo.initSocket();
  if (!forumSocket) return;

  forumSocket.off("forum:new_reply", handleForumNewReply);
  forumSocket.on("forum:new_reply", handleForumNewReply);
};

onMounted(() => {
  initForumRealtime();
});

onUnmounted(() => {
  if (forumSocket) {
    forumSocket.off("forum:new_reply", handleForumNewReply);
  }
});

watch(
  () => user.value?.id,
  () => {
    initForumRealtime();
    refreshTopics();
  }
);

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

.v2-box {
  overflow: hidden;
  border-radius: 3px;
  border: 1px solid #d9d9d9;
  background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 8%);
}

.dark .v2-box {
  border-color: rgb(255 255 255 / 10%);
  background: rgb(15 23 42 / 88%);
  box-shadow: none;
}

.v2-node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e2e2e2;
  background: linear-gradient(#fff, #f9f9f9);
  padding: 12px;
}

.dark .v2-node-header {
  border-color: rgb(255 255 255 / 10%);
  background: rgb(15 23 42 / 80%);
}

.v2-node-icon,
.v2-avatar {
  display: inline-flex;
  height: 48px;
  width: 48px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: linear-gradient(180deg, #f6f6f6, #e8e8e8);
  color: #778087;
  font-weight: 700;
}

.dark .v2-node-icon,
.dark .v2-avatar {
  background: rgb(255 255 255 / 10%);
  color: #cbd5e1;
}

.v2-topic-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 10px;
  background: #fff;
}

.dark .v2-topic-row {
  background: rgb(15 23 42 / 72%);
}

.v2-topic-row:hover {
  background: #fbfbfb;
}

.dark .v2-topic-row:hover {
  background: rgb(30 41 59 / 80%);
}

.v2-topic-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #333;
  font-size: 16px;
  line-height: 1.35;
}

.v2-topic-title:hover {
  color: #000;
  text-decoration: underline;
}

.dark .v2-topic-title {
  color: #e2e8f0;
}

.dark .v2-topic-title:hover {
  color: #fff;
}

.v2-label {
  border-radius: 3px;
  background: #f5f5f5;
  padding: 2px 5px;
  color: #778087;
  font-size: 12px;
  line-height: 1.4;
}

.dark .v2-label {
  background: rgb(255 255 255 / 10%);
  color: #cbd5e1;
}

.v2-reply-count {
  min-width: 26px;
  border-radius: 12px;
  background: #aab0c6;
  padding: 2px 8px;
  text-align: center;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
}

.v2-reply-count:hover {
  background: #969cb1;
}

.v2-primary-button {
  border-radius: 8px;
  background: rgb(37 99 235);
  border: 0;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 10px;
  text-align: center;
}

.v2-primary-button:hover {
  background: rgb(29 78 216);
}

.dark .v2-primary-button {
  border-color: rgb(255 255 255 / 14%);
  background: rgb(255 255 255 / 10%);
  color: #fff;
}

.v2-side-header {
  border-bottom: 1px solid #eee;
  background: #fafafa;
  color: #999;
  font-size: 12px;
  padding: 10px 12px;
}

.dark .v2-side-header {
  border-color: rgb(255 255 255 / 10%);
  background: rgb(15 23 42 / 88%);
  color: #94a3b8;
}

.v2-box {
  border: 0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 2px rgb(15 23 42 / 6%);
}

.dark .v2-box {
  background: rgb(255 255 255 / 10%);
  box-shadow: none;
}

.v2-node-header,
.v2-side-header {
  border-color: rgb(226 232 240);
  background: #fff;
  color: rgb(100 116 139);
}

.dark .v2-node-header,
.dark .v2-side-header {
  border-color: rgb(255 255 255 / 10%);
  background: transparent;
}

.v2-node-icon,
.v2-avatar {
  border-radius: 8px;
  background: rgb(241 245 249);
  color: rgb(37 99 235);
}

.v2-topic-row {
  min-height: 76px;
  padding: 12px;
}

.v2-topic-row:hover {
  background: rgb(248 250 252);
}

.v2-topic-title {
  color: rgb(15 23 42);
  font-size: 15px;
  font-weight: 600;
}

.v2-topic-title:hover {
  color: rgb(37 99 235);
  text-decoration: none;
}

.v2-label {
  border-radius: 6px;
  background: rgb(241 245 249);
  color: rgb(100 116 139);
}

.v2-unread-badge {
  background: rgb(219 234 254);
  border-radius: 999px;
  color: rgb(29 78 216);
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  padding: 4px 7px;
}

.dark .v2-unread-badge {
  background: rgb(37 99 235 / 18%);
  color: rgb(147 197 253);
}

.v2-reply-count {
  border-radius: 999px;
  background: rgb(241 245 249);
  color: rgb(100 116 139);
}

.v2-reply-count:hover {
  background: rgb(37 99 235);
  color: white;
}

.v2-primary-button {
  border: 0;
  border-radius: 8px;
  background: rgb(37 99 235);
  color: #fff;
  font-size: 12px;
  padding: 8px 12px;
}

.v2-primary-button:hover {
  background: rgb(29 78 216);
}

.forum-pagination.el-pagination.is-background .el-pager li:not(.is-disabled).is-active {
  background: rgb(37 99 235);
  border-color: rgb(37 99 235);
  color: white;
}
</style>
