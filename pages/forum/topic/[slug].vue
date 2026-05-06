<template>
  <main class="min-h-screen bg-[#f8fafc] pb-10 text-slate-950 dark:bg-slate-950 dark:text-white">
    <section class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="mb-4 rounded-lg bg-white px-3 py-2 text-xs text-slate-500 dark:bg-white/10 dark:text-slate-400">
        <NuxtLink to="/forum" class="text-blue-600 hover:text-blue-700 dark:text-blue-300">
          <i class="fas fa-home mr-1"></i>
          论坛首页
        </NuxtLink>
        <i class="fas fa-chevron-right mx-2 text-[10px] text-slate-400"></i>
        <client-only>
          <NuxtLink
            v-if="topic?.category"
            :to="`/forum/category/${topic.category.slug}`"
            class="text-blue-600 hover:text-blue-700 dark:text-blue-300"
          >
            {{ topic.category.name }}
          </NuxtLink>
        </client-only>
        <i class="fas fa-chevron-right mx-2 text-[10px] text-slate-400"></i>
        <span class="truncate">{{ topic?.title || "加载中..." }}</span>
      </div>

      <div v-if="loading" class="space-y-3">
        <div class="rounded-lg bg-white p-4 dark:bg-white/10">
          <el-skeleton :rows="2" animated />
        </div>
        <div v-for="item in 3" :key="item" class="rounded-lg bg-white p-4 dark:bg-white/10">
          <el-skeleton :rows="4" animated />
        </div>
      </div>

      <div v-else-if="error || !topic" class="rounded-lg bg-white p-10 text-center dark:bg-white/10">
        <i class="fas fa-exclamation-triangle text-3xl text-amber-500"></i>
        <h1 class="mt-4 text-base font-semibold text-slate-800 dark:text-white">加载失败</h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">{{ error?.message || "无法加载主题内容" }}</p>
        <div class="mt-5 flex justify-center gap-2">
          <button class="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300" @click="refresh">
            重试
          </button>
          <NuxtLink to="/forum" class="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300">
            返回论坛
          </NuxtLink>
        </div>
      </div>

      <div v-else class="space-y-3">
        <div class="overflow-hidden rounded-lg bg-white dark:bg-white/10">
          <div class="flex flex-col gap-3 bg-slate-50/80 px-3 py-3 dark:bg-white/5 md:flex-row md:items-center md:justify-between">
            <div class="min-w-0">
              <div class="flex min-w-0 items-center gap-2">
                <span v-if="topic.isSticky" class="shrink-0 text-[11px] font-medium text-red-600 dark:text-red-300">[置顶]</span>
                <span v-if="topic.isLocked" class="shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400">[锁定]</span>
                <h1 class="truncate text-base font-semibold text-slate-950 dark:text-white">{{ topic.title }}</h1>
              </div>
              <div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>查看 {{ topic.viewCount || 0 }}</span>
                <span>回复 {{ posts?.length || 0 }}</span>
                <span><client-only>{{ formatDate(topic.createdAt) }}</client-only></span>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <CommonReportButton
                v-if="topic?.id"
                content-type="topic"
                :content-id="topic.id"
                :content-title="topic.title"
              />
              <client-only>
                <button
                  v-if="canModerate"
                  class="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-white hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300"
                  @click="toggleSticky"
                >
                  <i class="fas fa-thumbtack mr-1"></i>
                  {{ topic.isSticky ? "取消置顶" : "置顶" }}
                </button>
                <button
                  v-if="canModerate"
                  class="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-white hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300"
                  @click="toggleLock"
                >
                  <i :class="[topic.isLocked ? 'fas fa-lock-open' : 'fas fa-lock', 'mr-1']"></i>
                  {{ topic.isLocked ? "解除锁定" : "锁定" }}
                </button>
              </client-only>
            </div>
          </div>
        </div>

        <article class="overflow-hidden rounded-lg bg-white dark:bg-white/10">
          <div class="grid md:grid-cols-[170px_minmax(0,1fr)]">
            <aside class="border-b border-slate-100 bg-slate-50/80 px-3 py-4 dark:border-white/10 dark:bg-white/5 md:border-b-0 md:border-r">
              <div class="flex items-center gap-3 md:block md:text-center">
                <div class="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-blue-50 text-base font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-300 md:h-16 md:w-16">
                  {{ getInitial(topic.author?.username) }}
                </div>
                <div class="min-w-0 md:mt-2">
                  <div class="truncate text-xs font-semibold text-slate-900 dark:text-white">{{ topic.author.username }}</div>
                  <div class="mt-1 text-[11px] text-slate-500 dark:text-slate-400">楼主</div>
                </div>
              </div>
            </aside>

            <div class="min-w-0">
              <header class="flex items-center justify-between border-b border-slate-100 bg-white px-3 py-2 text-xs text-slate-500 dark:border-white/10 dark:bg-transparent dark:text-slate-400">
                <span>发表于 <client-only>{{ formatDate(topic.createdAt) }}</client-only></span>
                <span>#楼主</span>
              </header>
              <div class="px-4 py-5">
                <div class="forum-markdown markdown-body" v-html="parsedContent"></div>
              </div>
            </div>
          </div>
        </article>

        <div class="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
          回复列表 ({{ posts?.length || 0 }})
        </div>

        <div v-if="posts && posts.length > 0" class="space-y-3">
          <ForumPostItem
            v-for="(post, index) in posts"
            :key="post.id"
            :post="post"
            :index="index + 1"
            :topic="topic"
            :user="user"
            :can-reply="!topic.isLocked"
            @reply="replyToPost"
          />
        </div>
        <div v-else class="rounded-lg bg-white p-6 text-center text-xs text-slate-500 dark:bg-white/10 dark:text-slate-400">
          暂无回复。
        </div>

        <section v-if="!topic.isLocked" class="overflow-hidden rounded-lg bg-white dark:bg-white/10">
          <div class="bg-slate-50/80 px-3 py-2 dark:bg-white/5">
            <h2 class="text-xs font-semibold text-slate-700 dark:text-slate-200">
              <template v-if="replyingTo">
                回复 #{{ posts.findIndex((item) => item.id === replyingTo) + 1 }}
                <button class="ml-2 text-slate-500 hover:underline" @click="cancelReply">取消</button>
              </template>
              <template v-else>快速回复</template>
            </h2>
          </div>

          <div v-if="user" class="p-3">
            <client-only>
              <template #fallback>
                <div class="flex h-[180px] items-center justify-center rounded-lg bg-slate-50 dark:bg-white/5">
                  <p class="text-xs text-slate-400">编辑器加载中...</p>
                </div>
              </template>
              <MarkdownEditor
                ref="mdEditorRef"
                v-model="replyContent"
                placeholder="在这里输入您的回复内容，支持 Markdown 格式..."
                minHeight="170px"
                :onSave="submitReply"
              />
            </client-only>
            <div class="mt-3">
              <button
                class="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="submitting"
                @click="submitReply"
              >
                {{ submitting ? "发表中..." : "发表回复" }}
              </button>
            </div>
          </div>

          <div v-else class="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            您需要登录后才能回复。
            <button class="ml-1 text-blue-600 hover:text-blue-700 dark:text-blue-300" @click="navigateToLogin">立即登录</button>
          </div>
        </section>

        <div v-else class="rounded-lg bg-white p-4 text-center text-xs text-slate-500 dark:bg-white/10 dark:text-slate-400">
          <i class="fas fa-lock mr-1"></i>
          该主题已被锁定，无法回复。
        </div>
      </div>
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
const slug = route.params.slug;

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
} = await useFetch(`/api/forum/topics/${slug}`);

const topic = computed(() => {
  if (!data.value?.success) return null;
  return data.value.data.topic;
});

const posts = computed(() => {
  if (!data.value?.success) return [];
  return data.value.data.posts;
});

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
  return user.value.role === "ADMIN" || user.value.role === "MODERATOR";
});

const replyContent = ref("");
const submitting = ref(false);
const replyingTo = ref(null);
const mdEditorRef = ref(null);

const parsedContent = computed(() => {
  if (!topic.value?.content) return "";
  return sanitizeHtml(marked.parse(topic.value.content));
});

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

  try {
    submitting.value = true;
    const response = await $fetch(`/api/forum/topics/${slug}/reply`, {
      method: "POST",
      body: {
        content: replyContent.value,
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
  setTimeout(() => {
    if (mdEditorRef.value) {
      mdEditorRef.value.$el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, 100);
}

function cancelReply() {
  replyingTo.value = null;
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
  router.push(`/login?redirect=/forum/topic/${slug}`);
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

.forum-markdown {
  color: #334155;
  font-size: 13px;
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
  color: #0f172a;
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
  color: rgb(37 99 235);
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
  border-left: 2px solid #dbeafe;
  color: #64748b;
  margin: 14px 0;
  padding-left: 12px;
}

.forum-markdown img {
  max-width: 100%;
}
</style>
