<template>
  <main class="min-h-screen bg-[#f8fafc] py-4 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
    <section class="mx-auto grid max-w-[1100px] gap-4 px-3 md:grid-cols-[minmax(0,1fr)_270px]">
      <div class="min-w-0 space-y-3">
        <section class="v2-box">
          <div class="v2-tabs">
            <div class="v2-tab-list">
              <button class="v2-tab is-active" type="button">全部</button>
              <button
                v-for="category in categories"
                :key="category.id"
                class="v2-tab"
                type="button"
                @click="navigateToCategory(category.slug)"
              >
                {{ category.name }}
              </button>
            </div>
            <button
              class="v2-refresh-button"
              type="button"
              :disabled="isRefreshing"
              :aria-busy="isRefreshing"
              aria-label="刷新主题列表"
              @click="handleRefresh"
            >
              <i :class="['fas fa-rotate-right', { 'animate-spin': isRefreshing }]"></i>
              <span>刷新</span>
            </button>
          </div>

          <div v-if="user && unreadSummary?.unreadTopicCount > 0" class="v2-unread-banner">
            <div class="min-w-0">
              <div class="text-sm font-semibold text-slate-900 dark:text-white">
                你参与的 {{ unreadSummary.unreadTopicCount }} 个主题有新回复
              </div>
              <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                共 {{ unreadSummary.unreadReplyCount }} 条未读回复
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <button class="v2-inline-button" type="button" @click="showUnreadTopics = !showUnreadTopics">
                {{ showUnreadTopics ? "收起" : "查看未读" }}
              </button>
              <button class="v2-inline-button" type="button" :disabled="markingAllRead" @click="markAllForumRead">
                {{ markingAllRead ? "处理中..." : "全部已读" }}
              </button>
            </div>
          </div>

          <div v-if="user && showUnreadTopics && unreadSummary?.topics?.length" class="v2-unread-list">
            <NuxtLink
              v-for="item in unreadSummary.topics"
              :key="item.id"
              :to="`/forum/topic/${item.slug}`"
              class="v2-unread-item"
            >
              <span class="min-w-0 truncate">{{ item.title }}</span>
              <span class="v2-unread-badge">未读 {{ item.unreadCount }}</span>
            </NuxtLink>
          </div>

          <div v-if="loading || topicsLoading" class="divide-y divide-[#e2e2e2] dark:divide-white/10">
            <div v-for="item in 10" :key="item" class="v2-topic-row">
              <div class="h-12 w-12 shrink-0 animate-pulse rounded bg-[#f0f0f0] dark:bg-white/10"></div>
              <div class="min-w-0 flex-1">
                <div class="h-4 w-3/4 animate-pulse rounded bg-[#f0f0f0] dark:bg-white/10"></div>
                <div class="mt-3 h-3 w-1/2 animate-pulse rounded bg-[#f0f0f0] dark:bg-white/10"></div>
              </div>
            </div>
          </div>

          <div v-else-if="!topics || topics.length === 0" class="px-4 py-10 text-center text-sm text-[#999]">
            <div class="text-3xl text-[#ccc]"><i class="fas fa-comments"></i></div>
            <p class="mt-3">还没有主题</p>
            <button class="mt-4 v2-primary-button" type="button" @click="navigateToCreateTopic()">
              发布第一个主题
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
                  <NuxtLink :to="`/forum/category/${topic.category.slug}`" class="v2-node">
                    {{ topic.category.name }}
                  </NuxtLink>
                  <span>•</span>
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
            :hide-on-single-page="true"
            class="forum-pagination justify-center"
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <aside class="space-y-3">
        <section class="v2-box p-4">
          <template v-if="user">
            <div class="flex items-center gap-3">
              <div class="v2-avatar">{{ getInitial(user.username) }}</div>
              <div class="min-w-0">
                <div class="truncate text-sm font-semibold text-[#333] dark:text-white">{{ user.username }}</div>
                <NuxtLink to="/user/forum" class="text-xs text-[#778087] hover:text-[#4d5256] dark:text-slate-400">
                  我的帖子和回复
                </NuxtLink>
              </div>
            </div>
            <button class="mt-4 w-full v2-primary-button" type="button" @click="navigateToCreateTopic()">
              发布主题
            </button>
          </template>
          <template v-else>
            <h1 class="text-lg font-semibold leading-6 text-[#333] dark:text-white">AIPAN 资源交流社区</h1>
            <p class="mt-2 text-sm leading-6 text-[#666] dark:text-slate-300">分享资源线索、使用问题和真实经验。</p>
            <button class="mt-4 w-full v2-primary-button" type="button" @click="navigateToLogin('/forum/create')">
              登录后发布
            </button>
            <div class="mt-3 text-center text-xs text-[#999]">
              已有账号？
              <button class="text-[#778087] hover:text-[#4d5256]" type="button" @click="navigateToLogin('/forum')">登录</button>
            </div>
          </template>
        </section>

        <section class="v2-box p-4" data-feature="daily-redemption-drop">
          <div class="flex items-start gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200">
              <i class="fa-solid fa-bolt"></i>
            </div>
            <div class="min-w-0">
              <div class="text-sm font-semibold text-[#333] dark:text-white">每日福利</div>
              <p class="mt-1 text-xs leading-5 text-[#778087] dark:text-slate-400">
                每天固定时间发放积分，先到先得。
              </p>
            </div>
          </div>
          <div class="mt-3 rounded bg-[#f8f8f8] px-3 py-2 text-xs leading-5 text-[#666] dark:bg-white/10 dark:text-slate-300">
            {{ dailyRedemptionDropHint }}
          </div>
          <button class="mt-3 w-full v2-primary-button" type="button" @click="navigateToDailyRedemptionDrop">
            {{ user ? '去领取' : '登录领取' }}
          </button>
        </section>

        <section class="v2-box">
          <div class="v2-side-header">社区统计</div>
          <dl class="divide-y divide-[#eee] text-sm dark:divide-white/10">
            <div class="flex justify-between px-4 py-2">
              <dt class="text-[#999]">板块</dt>
              <dd>{{ categories.length }}</dd>
            </div>
            <div class="flex justify-between px-4 py-2">
              <dt class="text-[#999]">主题</dt>
              <dd>{{ totalTopics }}</dd>
            </div>
            <div class="flex justify-between px-4 py-2">
              <dt class="text-[#999]">当前页</dt>
              <dd>{{ topics.length }}</dd>
            </div>
          </dl>
        </section>

        <section class="v2-box">
          <div class="v2-side-header">热门主题</div>
          <ol class="space-y-2 px-4 py-3 text-xs leading-5">
            <li v-for="topic in topTopics" :key="topic.id" class="flex gap-2">
              <span class="mt-0.5 h-4 w-4 shrink-0 rounded bg-[#f0f0f0] text-center text-[10px] leading-4 text-[#999] dark:bg-white/10">
                {{ topic._count?.posts || 0 }}
              </span>
              <NuxtLink :to="`/forum/topic/${topic.slug}`" class="line-clamp-2 text-[#333] hover:text-[#000] dark:text-slate-200 dark:hover:text-white">
                {{ topic.title }}
              </NuxtLink>
            </li>
          </ol>
        </section>

        <section class="v2-box">
          <div class="v2-side-header">热门板块</div>
          <div class="flex flex-wrap gap-2 px-4 py-3">
            <button
              v-for="category in categories"
              :key="category.id"
              class="rounded bg-[#f5f5f5] px-2 py-1 text-xs text-[#555] hover:bg-[#e8e8e8] dark:bg-white/10 dark:text-slate-300"
              type="button"
              @click="navigateToCategory(category.slug)"
            >
              {{ category.name }}
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

useSeoMeta({
  title: "AIPAN论坛 - 用户交流社区 | 分享讨论技术话题",
  description:
    "AIPAN论坛是一个活跃的用户交流社区，用户可以在这里分享想法、提问、参与讨论。涵盖技术交流、资源分享、使用心得等多个话题板块，连接社区中的每一个人。",
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
const token = useCookie("token");
const authHeaders = computed(() =>
  user.value && token.value ? { authorization: `Bearer ${token.value}` } : {}
);

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
  () => `/api/forum/topics?page=${page.value}&pageSize=${pageSize.value}`,
  {
    headers: authHeaders,
  }
);

const topics = computed(() => {
  if (!topicsData.value || !topicsData.value.success) return [];
  return topicsData.value.data.topics;
});

const topTopics = computed(() =>
  [...topics.value]
    .sort((a, b) => (b._count?.posts || 0) - (a._count?.posts || 0))
    .slice(0, 10)
);

const pagination = computed(() => {
  if (!topicsData.value || !topicsData.value.success) return null;
  return topicsData.value.data.pagination;
});

const isRefreshing = computed(() => loading.value || topicsLoading.value);
const unreadSummary = ref(null);
const showUnreadTopics = ref(false);
const markingAllRead = ref(false);
const dailyRedemptionDrop = ref(null);
const dailyRedemptionDropLoading = ref(false);
let forumUnreadPollTimer = null;
let forumSocket = null;

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

const getInitial = (name) => String(name || "?").charAt(0).toUpperCase();

const getCreatePath = (categoryId) => {
  return categoryId ? `/forum/create?categoryId=${categoryId}` : "/forum/create";
};

const handlePageChange = (newPage) => {
  page.value = newPage;
  refreshTopics();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const handleRefresh = async () => {
  page.value = 1;
  await Promise.all([refresh(), refreshTopics(), fetchUnreadSummary(), fetchDailyRedemptionDrop()]);
};

const dailyRedemptionDropHint = computed(() => {
  if (!user.value) return "登录后查看开放时间和剩余份数。";
  if (dailyRedemptionDropLoading.value) return "正在读取今日福利。";
  if (!dailyRedemptionDrop.value) return "今日福利暂不可用。";
  if (!dailyRedemptionDrop.value.enabled) return "今日福利暂未开放。";
  if (dailyRedemptionDrop.value.status === "not_released") {
    return dailyRedemptionDrop.value.message || `今日 ${dailyRedemptionDrop.value.releaseTime} 开始领取。`;
  }
  if (dailyRedemptionDrop.value.status === "sold_out") return "今日已领完，明天再来。";
  if (dailyRedemptionDrop.value.status === "already_claimed") return "今日已领取，明天再来。";
  if (dailyRedemptionDrop.value.claimable) {
    return `剩余 ${dailyRedemptionDrop.value.remainingQuota || 0} 份，每份 ${dailyRedemptionDrop.value.points || 0} 积分。`;
  }
  return dailyRedemptionDrop.value.message || "到用户中心查看领取状态。";
});

const fetchUnreadSummary = async () => {
  if (!user.value || !token.value) {
    unreadSummary.value = null;
    showUnreadTopics.value = false;
    return;
  }

  try {
    const response = await $fetch("/api/forum/unread-summary", {
      headers: {
        authorization: `Bearer ${token.value}`,
      },
    });

    if (response.success) {
      unreadSummary.value = response.data;
      if (!response.data?.unreadTopicCount) {
        showUnreadTopics.value = false;
      }
    }
  } catch (error) {
    console.error("获取论坛未读摘要失败:", error);
  }
};

const markAllForumRead = async () => {
  if (!user.value || !token.value || markingAllRead.value) return;

  try {
    markingAllRead.value = true;
    const response = await $fetch("/api/forum/unread/mark-all-read", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token.value}`,
      },
    });

    if (response.success) {
      unreadSummary.value = response.data?.summary || null;
      showUnreadTopics.value = false;
      await refreshTopics();
    }
  } catch (error) {
    console.error("标记论坛未读为已读失败:", error);
  } finally {
    markingAllRead.value = false;
  }
};

const fetchDailyRedemptionDrop = async () => {
  if (!user.value || !token.value) {
    dailyRedemptionDrop.value = null;
    return;
  }

  try {
    dailyRedemptionDropLoading.value = true;
    const response = await $fetch("/api/user/points/daily-redemption-drop/status", {
      headers: {
        authorization: `Bearer ${token.value}`,
      },
    });

    if (response.code === 200) {
      dailyRedemptionDrop.value = response.data;
    }
  } catch (error) {
    console.error("获取每日福利状态失败:", error);
    dailyRedemptionDrop.value = null;
  } finally {
    dailyRedemptionDropLoading.value = false;
  }
};

const handleForumNewReply = async () => {
  await Promise.all([fetchUnreadSummary(), refreshTopics()]);
};

const initForumRealtime = () => {
  if (!user.value || !token.value) return;

  const socketIo = useSocketIo();
  forumSocket = socketIo.initSocket();
  if (!forumSocket) return;

  forumSocket.off("forum:new_reply", handleForumNewReply);
  forumSocket.on("forum:new_reply", handleForumNewReply);
};

const navigateToCreateTopic = (categoryId) => {
  const target = getCreatePath(categoryId);
  if (!user.value) {
    navigateToLogin(target);
    return;
  }
  router.push(target);
};

const navigateToLogin = (redirect = "/forum/create") => {
  router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
};

const navigateToDailyRedemptionDrop = () => {
  if (!user.value) {
    navigateToLogin("/user/checkin");
    return;
  }
  router.push("/user/checkin");
};

const navigateToCategory = (slug) => {
  if (!slug) return;
  router.push(`/forum/category/${slug}`);
};

onMounted(() => {
  refresh();
  refreshTopics();
  fetchUnreadSummary();
  fetchDailyRedemptionDrop();
  forumUnreadPollTimer = window.setInterval(fetchUnreadSummary, 60000);
  initForumRealtime();
});

onUnmounted(() => {
  if (forumUnreadPollTimer) {
    window.clearInterval(forumUnreadPollTimer);
  }
  if (forumSocket) {
    forumSocket.off("forum:new_reply", handleForumNewReply);
  }
});

watch(
  () => user.value?.id,
  () => {
    fetchUnreadSummary();
    fetchDailyRedemptionDrop();
    initForumRealtime();
    refreshTopics();
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

.v2-tabs {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: space-between;
  border-bottom: 1px solid #e2e2e2;
  background: linear-gradient(#fff, #f9f9f9);
  padding: 10px;
}

.v2-tab-list {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.dark .v2-tabs {
  border-color: rgb(255 255 255 / 10%);
  background: rgb(15 23 42 / 80%);
}

.v2-tab {
  border-radius: 3px;
  padding: 4px 8px;
  color: #555;
  font-size: 13px;
  line-height: 1.4;
}

.v2-tab:hover,
.v2-tab.is-active {
  background: rgb(15 23 42);
  color: #fff;
}

.v2-refresh-button {
  align-items: center;
  border-radius: 8px;
  color: rgb(100 116 139);
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 600;
  gap: 6px;
  line-height: 1;
  margin-left: auto;
  padding: 7px 10px;
}

.v2-refresh-button:hover {
  background: rgb(241 245 249);
  color: rgb(37 99 235);
}

.v2-refresh-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
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

.dark .v2-avatar {
  background: rgb(255 255 255 / 10%);
  color: #cbd5e1;
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

.v2-node,
.v2-label {
  border-radius: 3px;
  background: #f5f5f5;
  padding: 2px 5px;
  color: #778087;
  line-height: 1.4;
}

.v2-node:hover {
  background: #e8e8e8;
  color: #4d5256;
}

.dark .v2-node,
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

.v2-tabs,
.v2-side-header {
  border-color: rgb(226 232 240);
  background: #fff;
  color: rgb(100 116 139);
}

.dark .v2-tabs,
.dark .v2-side-header {
  border-color: rgb(255 255 255 / 10%);
  background: transparent;
}

.v2-tab {
  border-radius: 8px;
  color: rgb(71 85 105);
  font-size: 12px;
  font-weight: 500;
  padding: 6px 10px;
}

.v2-tab:hover,
.v2-tab.is-active {
  background: rgb(15 23 42);
  color: #fff;
}

.dark .v2-tab:hover,
.dark .v2-tab.is-active {
  background: #fff;
  color: rgb(15 23 42);
}

.v2-topic-row {
  min-height: 76px;
  padding: 12px;
}

.v2-topic-row:hover {
  background: rgb(248 250 252);
}

.v2-unread-banner {
  align-items: center;
  background: rgb(239 246 255);
  border-bottom: 1px solid rgb(191 219 254);
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 10px 12px;
}

.dark .v2-unread-banner {
  background: rgb(30 41 59 / 75%);
  border-color: rgb(255 255 255 / 10%);
}

.v2-unread-list {
  border-bottom: 1px solid rgb(226 232 240);
  padding: 6px 12px;
}

.v2-unread-item {
  align-items: center;
  color: rgb(51 65 85);
  display: flex;
  font-size: 12px;
  gap: 8px;
  justify-content: space-between;
  padding: 6px 0;
}

.v2-unread-item:hover {
  color: rgb(37 99 235);
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

.v2-inline-button {
  border-radius: 8px;
  color: rgb(37 99 235);
  font-size: 12px;
  font-weight: 700;
  padding: 6px 8px;
}

.v2-inline-button:hover {
  background: rgb(219 234 254);
}

.v2-inline-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.v2-avatar {
  border-radius: 8px;
  background: rgb(241 245 249);
  color: rgb(37 99 235);
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

.v2-node,
.v2-label {
  border-radius: 6px;
  background: rgb(241 245 249);
  color: rgb(100 116 139);
}

.v2-node:hover {
  background: rgb(226 232 240);
  color: rgb(37 99 235);
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
}

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
