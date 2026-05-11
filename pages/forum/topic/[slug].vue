<template>
  <main class="min-h-screen bg-[#f8fafc] py-4 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
    <section class="mx-auto grid max-w-[1100px] gap-4 px-3 md:grid-cols-[minmax(0,1fr)_270px]">
      <div class="min-w-0 space-y-3">
        <div class="v2-box v2-crumb">
          <NuxtLink to="/forum" class="hover:text-[#4d5256]">论坛首页</NuxtLink>
          <span>›</span>
          <client-only>
            <NuxtLink v-if="topic?.category" :to="`/forum/category/${topic.category.slug}`" class="hover:text-[#4d5256]">
              {{ topic.category.name }}
            </NuxtLink>
            <span v-else>主题</span>
          </client-only>
        </div>

        <div v-if="loading" class="v2-box p-4">
          <el-skeleton :rows="8" animated />
        </div>

        <div v-else-if="error || !topic" class="v2-box px-4 py-10 text-center text-sm text-[#666] dark:text-slate-300">
          <i class="fas fa-exclamation-triangle text-3xl text-amber-500"></i>
          <h1 class="mt-4 text-base font-semibold text-[#333] dark:text-white">加载失败</h1>
          <p class="mt-2">{{ error?.message || "无法加载主题内容" }}</p>
          <div class="mt-5 flex justify-center gap-2">
            <button class="v2-muted-button" type="button" @click="refresh">重试</button>
            <NuxtLink to="/forum" class="v2-muted-button">返回论坛</NuxtLink>
          </div>
        </div>

        <template v-else>
          <section class="v2-box">
            <div class="v2-topic-header">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2 text-xs text-[#999]">
                  <NuxtLink v-if="topic.category" :to="`/forum/category/${topic.category.slug}`" class="v2-node">
                    {{ topic.category.name }}
                  </NuxtLink>
                  <span v-if="topic.isSticky" class="v2-label text-[#d15f5f]">置顶</span>
                  <span v-if="topic.isLocked" class="v2-label">锁定</span>
                </div>
                <h1 class="mt-3 text-2xl font-semibold leading-snug text-[#333] dark:text-white">
                  {{ topic.title }}
                </h1>
                <div class="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[#999]">
                  <span>{{ topic.author.username }}</span>
                  <span>•</span>
                  <span><client-only>{{ formatDate(topic.createdAt) }}</client-only></span>
                  <span>•</span>
                  <span>{{ topic.viewCount || 0 }} 次浏览</span>
                  <span>•</span>
                  <span>{{ replyTotal }} 条回复</span>
                </div>
              </div>
              <div class="v2-avatar v2-avatar-lg" :title="topic.author.username">
                {{ getInitial(topic.author?.username) }}
              </div>
            </div>

            <div class="v2-topic-tools">
              <CommonReportButton
                v-if="topic?.id"
                content-type="topic"
                :content-id="topic.id"
                :content-title="topic.title"
              />
              <client-only>
                <button v-if="canModerate" class="v2-muted-button" type="button" @click="toggleSticky">
                  {{ topic.isSticky ? "取消置顶" : "置顶" }}
                </button>
                <button v-if="canModerate" class="v2-muted-button" type="button" @click="toggleLock">
                  {{ topic.isLocked ? "解除锁定" : "锁定" }}
                </button>
              </client-only>
            </div>
          </section>

          <article class="v2-box">
            <div class="v2-side-header">主题内容</div>
            <div class="v2-content forum-markdown markdown-body" v-html="parsedContent"></div>
          </article>

          <section class="v2-box">
            <div class="v2-side-header flex items-center justify-between">
              <span>{{ replyTotal }} 条回复</span>
              <button v-if="user && !topic.isLocked" class="text-xs text-[#778087] hover:text-[#4d5256]" type="button" @click="scrollToReplyEditor">
                快速回复
              </button>
            </div>

            <div v-if="posts && posts.length > 0">
              <ForumPostItem
                v-for="(post, index) in posts"
                :key="post.id"
                :post="post"
                :index="replyFloor(index)"
                :topic="topic"
                :user="user"
                :can-reply="!topic.isLocked"
                @reply="replyToPost"
              />
            </div>
            <div v-else class="px-4 py-6 text-center text-xs text-[#999]">
              暂无回复。{{ topic.isLocked ? "该主题已锁定。" : "你可以写第一条回复。" }}
            </div>
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

          <section v-if="!topic.isLocked" ref="replySectionRef" class="v2-box">
            <div class="v2-side-header">
              <template v-if="replyingToPost">
                回复 #{{ replyingToPost.floorLabel }} · {{ replyingToPost.author?.username || "用户" }}
                <button class="ml-2 text-xs text-[#778087] hover:text-[#4d5256]" type="button" @click="cancelReply">取消</button>
              </template>
              <template v-else>写回复</template>
            </div>

            <div v-if="user" class="p-4">
              <client-only>
                <template #fallback>
                  <div class="flex h-[180px] items-center justify-center bg-[#f5f5f5] dark:bg-white/5">
                    <p class="text-xs text-[#999]">编辑器加载中...</p>
                  </div>
                </template>
                <MarkdownEditor
                  ref="mdEditorRef"
                  v-model="replyContent"
                  placeholder="写下你的回复，补充信息或给出建议。支持 Markdown。"
                  minHeight="180px"
                  :onSave="submitReply"
                />
              </client-only>
              <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span class="text-xs text-[#999]">{{ replyContent.trim().length }} 字</span>
                <button class="v2-primary-button" type="button" :disabled="submitting" @click="submitReply">
                  {{ submitting ? "发布中..." : "发布回复" }}
                </button>
              </div>
            </div>

            <div v-else class="p-6 text-center text-xs text-[#999]">
              请先登录后再回复。
              <button class="ml-1 text-[#778087] hover:text-[#4d5256]" type="button" @click="navigateToLogin">立即登录</button>
            </div>
          </section>

          <div v-else class="v2-box p-4 text-center text-xs text-[#999]">
            <i class="fas fa-lock mr-1"></i>
            该主题已被锁定，无法回复。
          </div>
        </template>
      </div>

      <aside v-if="topic" class="space-y-3">
        <section class="v2-box p-4">
          <div class="flex items-center gap-3">
            <div class="v2-avatar" :title="topic.author.username">{{ getInitial(topic.author?.username) }}</div>
            <div class="min-w-0">
              <div class="truncate text-sm font-semibold text-[#333] dark:text-white">{{ topic.author.username }}</div>
              <div class="mt-1 text-xs text-[#999]">楼主</div>
            </div>
          </div>
        </section>

        <section class="v2-box">
          <div class="v2-side-header">主题统计</div>
          <dl class="divide-y divide-[#eee] text-sm dark:divide-white/10">
            <div class="flex justify-between px-4 py-2">
              <dt class="text-[#999]">浏览</dt>
              <dd>{{ topic.viewCount || 0 }}</dd>
            </div>
            <div class="flex justify-between px-4 py-2">
              <dt class="text-[#999]">回复</dt>
              <dd>{{ replyTotal }}</dd>
            </div>
            <div class="flex justify-between px-4 py-2">
              <dt class="text-[#999]">状态</dt>
              <dd>{{ topic.isLocked ? "已锁定" : "可回复" }}</dd>
            </div>
          </dl>
        </section>

        <section v-if="topic.category" class="v2-box p-4">
          <div class="text-xs text-[#999]">所在板块</div>
          <NuxtLink :to="`/forum/category/${topic.category.slug}`" class="mt-2 block text-base font-semibold text-[#333] hover:text-[#000] dark:text-white">
            {{ topic.category.name }}
          </NuxtLink>
          <NuxtLink :to="`/forum/create?categoryId=${topic.category.id}`" class="mt-4 inline-flex v2-primary-button">
            在该板块发帖
          </NuxtLink>
        </section>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ElMessage } from "element-plus";
import { computed, ref, onMounted } from "vue";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import MarkdownEditor from "~/components/MarkdownEditor.vue";
import { sanitizeHtml } from "~/utils/sanitize";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const user = computed(() => userStore.user);
const slug = String(route.params.slug || "");
const page = ref(parseInt(route.query.page || "1"));
const pageSize = 20;

marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  langPrefix: "hljs language-",
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (__) { }
    }
    return hljs.highlightAuto(code).value;
  },
});

const {
  data,
  pending: loading,
  error,
  refresh,
} = await useFetch(`/api/forum/topics/${slug}`, {
  query: {
    page,
    pageSize,
  },
});

const topic = computed(() => {
  if (!data.value?.success) return null;
  return data.value.data.topic;
});

const posts = computed(() => {
  if (!data.value?.success) return [];
  return data.value.data.posts;
});

const pagination = computed(() => {
  if (!data.value?.success) return { total: 0, page: 1, pageSize, totalPages: 0 };
  return data.value.data.pagination;
});

const replyTotal = computed(() => pagination.value?.total || 0);

const topicDescription = computed(() => {
  if (!topic.value?.content) {
    return "浏览 AIPAN 论坛主题详情与回复讨论。";
  }

  const plainText = topic.value.content
    .replace(/#+\s/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>-]/g, "")
    .replace(/\n/g, " ")
    .trim();

  return plainText.length > 160 ? `${plainText.slice(0, 160)}...` : plainText;
});

useHead({
  title: computed(() =>
    topic.value?.title ? `${topic.value.title} - AIPAN论坛` : "AIPAN论坛主题"
  ),
  meta: [
    {
      name: "description",
      content: topicDescription,
    },
    { name: "robots", content: "index,follow" },
    { property: "og:type", content: "article" },
    {
      property: "og:title",
      content: computed(() =>
        topic.value?.title ? `${topic.value.title} - AIPAN论坛` : "AIPAN论坛主题"
      ),
    },
    {
      property: "og:description",
      content: topicDescription,
    },
  ],
  link: [
    {
      rel: "canonical",
      href: computed(() => `https://www.aipan.me/forum/topic/${slug}`),
    },
  ],
});

const canModerate = computed(() => {
  if (!user.value) return false;
  const role = String(user.value.role || "").toLowerCase();
  return role === "admin" || role === "moderator";
});

const replyContent = ref("");
const submitting = ref(false);
const replyingTo = ref(null);
const mdEditorRef = ref(null);
const replySectionRef = ref(null);

const parsedContent = computed(() => {
  if (!topic.value?.content) return "";
  return sanitizeHtml(marked.parse(topic.value.content));
});

const flatPosts = computed(() =>
  flattenPosts(posts.value, "", (pagination.value.page - 1) * pagination.value.pageSize)
);

const replyingToPost = computed(() => {
  if (!replyingTo.value) return null;
  return flatPosts.value.find((post) => String(post.id) === String(replyingTo.value)) || null;
});

function flattenPosts(items = [], prefix = "", rootOffset = 0) {
  return items.flatMap((post, index) => {
    const floorLabel = prefix ? `${prefix}.${index + 1}` : `${rootOffset + index + 1}`;
    return [
      { ...post, floorLabel },
      ...flattenPosts(post.children || [], floorLabel, 0),
    ];
  });
}

function replyFloor(index) {
  return (pagination.value.page - 1) * pagination.value.pageSize + index + 1;
}

function getInitial(name) {
  return String(name || "?").charAt(0).toUpperCase();
}

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

async function submitReply() {
  if (!replyContent.value.trim()) {
    ElMessage.warning("回复内容不能为空");
    return;
  }

  if (replyContent.value.trim().length < 2) {
    ElMessage.warning("回复内容至少需要2个字符");
    return;
  }

  try {
    submitting.value = true;
    const response = await $fetch(`/api/forum/topics/${slug}/reply`, {
      method: "POST",
      body: {
        content: replyContent.value.trim(),
        parentId: replyingTo.value,
      },
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });

    if (response.success) {
      ElMessage.success(response.message || "回复成功");
      replyContent.value = "";
      replyingTo.value = null;

      if (response.data && response.data.status === "approved") {
        refresh();
      }
    } else {
      ElMessage.error(response.message || "回复失败");
    }
  } catch (error) {
    console.error("发布回复失败:", error);
    ElMessage.error("发布回复失败");
  } finally {
    submitting.value = false;
  }
}

function replyToPost(postId) {
  replyingTo.value = postId;
  scrollToReplyEditor();
}

function cancelReply() {
  replyingTo.value = null;
}

function scrollToReplyEditor() {
  setTimeout(() => {
    const target = mdEditorRef.value?.$el || replySectionRef.value;
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, 100);
}

function handlePageChange(newPage) {
  page.value = newPage;
  router.push({ query: { ...route.query, page: newPage } });
  refresh();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function toggleSticky() {
  if (!topic.value) return;

  try {
    const response = await $fetch(`/api/forum/topics/${slug}/sticky`, {
      method: "POST",
      body: {
        isSticky: !topic.value.isSticky,
      },
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });

    if (response.success) {
      ElMessage.success(topic.value.isSticky ? "已取消置顶" : "已置顶");
      refresh();
    } else {
      ElMessage.error(response.message || "操作失败");
    }
  } catch (error) {
    console.error("操作失败:", error);
    ElMessage.error("操作失败，请稍后重试");
  }
}

async function toggleLock() {
  if (!topic.value) return;

  try {
    const response = await $fetch(`/api/forum/topics/${slug}/lock`, {
      method: "POST",
      body: {
        isLocked: !topic.value.isLocked,
      },
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });

    if (response.success) {
      ElMessage.success(topic.value.isLocked ? "已解除锁定" : "已锁定");
      refresh();
    } else {
      ElMessage.error(response.message || "操作失败");
    }
  } catch (error) {
    console.error("操作失败:", error);
    ElMessage.error("操作失败，请稍后重试");
  }
}

function navigateToLogin() {
  router.push(`/login?redirect=${encodeURIComponent(`/forum/topic/${slug}`)}`);
}

onMounted(async () => {
  try {
    await $fetch(`/api/forum/topics/${slug}/view`, {
      method: "GET",
      query: {
        _t: Date.now(),
      },
    });
  } catch (error) {
    console.error("增加浏览量失败:", error);
  }
});
</script>

<style>
@import "tailwindcss" reference;

.v2-box {
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  box-shadow: 0 1px 0 rgb(0 0 0 / 0.04);
  overflow: hidden;
}

.dark .v2-box {
  background: rgb(15 23 42 / 0.92);
  border-color: rgb(255 255 255 / 0.12);
}

.v2-crumb {
  align-items: center;
  color: #778087;
  display: flex;
  flex-wrap: wrap;
  font-size: 12px;
  gap: 8px;
  padding: 10px 12px;
}

.v2-side-header {
  background: #fff;
  border-bottom: 1px solid #eee;
  color: #999;
  font-size: 12px;
  line-height: 1;
  padding: 10px 12px;
}

.dark .v2-side-header {
  background: rgb(30 41 59 / 0.75);
  border-bottom-color: rgb(255 255 255 / 0.1);
  color: rgb(148 163 184);
}

.v2-topic-header {
  align-items: flex-start;
  display: flex;
  gap: 14px;
  padding: 16px;
}

.v2-topic-tools {
  align-items: center;
  background: #fafafa;
  border-top: 1px solid #eee;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  padding: 10px 12px;
}

.dark .v2-topic-tools {
  background: rgb(30 41 59 / 0.5);
  border-top-color: rgb(255 255 255 / 0.1);
}

.v2-avatar {
  align-items: center;
  background: linear-gradient(135deg, #f5f5f5, #d8d8d8);
  border-radius: 4px;
  color: #666;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 16px;
  font-weight: 700;
  height: 48px;
  justify-content: center;
  line-height: 1;
  overflow: hidden;
  text-transform: uppercase;
  width: 48px;
}

.v2-avatar-lg {
  height: 73px;
  width: 73px;
}

.dark .v2-avatar {
  background: linear-gradient(135deg, rgb(51 65 85), rgb(15 23 42));
  color: rgb(226 232 240);
}

.v2-node {
  background: #f5f5f5;
  border-radius: 3px;
  color: #777;
  padding: 2px 6px;
}

.dark .v2-node {
  background: rgb(255 255 255 / 0.08);
  color: rgb(203 213 225);
}

.v2-label {
  background: #f5f5f5;
  border-radius: 3px;
  color: #999;
  padding: 2px 6px;
}

.dark .v2-label {
  background: rgb(255 255 255 / 0.08);
  color: rgb(203 213 225);
}

.v2-content {
  padding: 16px;
}

.v2-primary-button,
.v2-muted-button {
  border-radius: 3px;
  display: inline-flex;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  padding: 8px 12px;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.v2-primary-button {
  background: #4d90fe;
  color: white;
}

.v2-primary-button:hover {
  background: #357ae8;
}

.v2-primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.v2-muted-button {
  background: #f5f5f5;
  border: 1px solid #ddd;
  color: #666;
}

.v2-muted-button:hover {
  background: #e8e8e8;
  color: #333;
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

.v2-crumb,
.v2-side-header {
  border-color: rgb(226 232 240);
  background: #fff;
  color: rgb(100 116 139);
}

.dark .v2-crumb,
.dark .v2-side-header {
  border-color: rgb(255 255 255 / 10%);
  background: transparent;
}

.v2-topic-tools {
  background: rgb(248 250 252);
  border-color: rgb(226 232 240);
}

.dark .v2-topic-tools {
  background: transparent;
}

.v2-avatar {
  border-radius: 8px;
  background: rgb(241 245 249);
  color: rgb(37 99 235);
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

.v2-muted-button {
  border: 0;
  border-radius: 8px;
  background: rgb(241 245 249);
  color: rgb(71 85 105);
}

.v2-muted-button:hover {
  background: rgb(226 232 240);
  color: rgb(37 99 235);
}

.forum-markdown {
  color: #333;
  font-size: 14px;
  line-height: 1.85;
  overflow-wrap: anywhere;
}

.dark .forum-markdown {
  color: #cbd5e1;
}

.forum-markdown p,
.forum-markdown ul,
.forum-markdown ol {
  margin-bottom: 12px;
}

.forum-markdown h1,
.forum-markdown h2,
.forum-markdown h3,
.forum-markdown h4 {
  color: #333;
  font-weight: 600;
  margin: 18px 0 10px;
}

.dark .forum-markdown h1,
.dark .forum-markdown h2,
.dark .forum-markdown h3,
.dark .forum-markdown h4 {
  color: #f8fafc;
}

.forum-markdown a {
  color: #778087;
}

.dark .forum-markdown a {
  color: #93c5fd;
}

.forum-markdown pre {
  background: #0f172a;
  color: #e2e8f0;
  margin: 14px 0;
  overflow-x: auto;
  padding: 12px;
}

.forum-markdown code {
  background: rgba(15, 23, 42, 0.06);
  padding: 0.15em 0.35em;
}

.forum-markdown pre code {
  background: transparent;
  padding: 0;
}

.forum-markdown blockquote {
  border-left: 2px solid #e2e2e2;
  color: #666;
  margin: 14px 0;
  padding-left: 12px;
}

.forum-markdown img {
  max-width: 100%;
}

.forum-pagination.el-pagination.is-background .el-pager li:not(.is-disabled).is-active {
  background: rgb(37 99 235);
  border-color: rgb(37 99 235);
  color: white;
}
</style>
