<template>
  <div class="bg-gray-50 dark:bg-gray-900 min-h-screen pb-12">
    <!-- 返回导航 -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="py-3 flex items-center text-xs">
          <NuxtLink to="/forum"
            class="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center">
            <i class="fas fa-home mr-1 text-xs"></i>
            论坛首页
          </NuxtLink>
          <i class="fas fa-chevron-right mx-2 text-gray-400 text-[10px]"></i>
          <client-only>
            <NuxtLink v-if="topic?.category" :to="`/forum/category/${topic.category.slug}`"
              class="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
              {{ topic.category.name }}
            </NuxtLink>
          </client-only>
          <i class="fas fa-chevron-right mx-2 text-gray-400 text-[10px]"></i>
          <span class="text-gray-900 dark:text-white truncate">{{
            topic?.title || "加载中..."
            }}</span>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex flex-col space-y-3">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <el-skeleton :rows="2" animated />
        </div>
        <div v-for="i in 3" :key="i" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <el-skeleton :rows="4" animated />
        </div>
      </div>

      <div v-else-if="error || !topic" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
        <i class="fas fa-exclamation-triangle text-yellow-500 text-3xl mb-3"></i>
        <h2 class="text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
          加载失败
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {{ error?.message || "无法加载主题内容" }}
        </p>
        <div class="flex justify-center space-x-3">
          <el-button @click="refresh" size="small" class="!text-xs">重试</el-button>
          <NuxtLink to="/forum">
            <el-button size="small" class="!text-xs">返回论坛</el-button>
          </NuxtLink>
        </div>
      </div>

      <div v-else>
        <!-- 主题标题卡片 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
          <div class="flex justify-between items-start mb-3">
            <div>
              <div class="flex items-center">
                <span v-if="topic.isSticky"
                  class="inline-block bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-[10px] font-medium px-1.5 py-0.5 rounded-full mr-1.5">
                  <i class="fas fa-thumbtack mr-0.5 text-[10px]"></i>置顶
                </span>
                <span v-if="topic.isLocked"
                  class="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-[10px] font-medium px-1.5 py-0.5 rounded-full mr-1.5">
                  <i class="fas fa-lock mr-0.5 text-[10px]"></i>已锁定
                </span>
                <h1 class="text-base font-medium text-gray-900 dark:text-white">
                  {{ topic.title }}
                </h1>
              </div>
              <div class="mt-2 flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400">
                <div class="flex items-center mr-3">
                  <div
                    class="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 mr-1 overflow-hidden text-[10px]">
                    <span>{{
                      topic.author.username.charAt(0).toUpperCase()
                      }}</span>
                  </div>
                  <span>{{ topic.author.username }}</span>
                </div>
                <span class="mr-3">
                  <i class="far fa-clock mr-1 text-xs"></i><client-only>{{ formatDate(topic.createdAt) }}</client-only>
                </span>
                <span class="mr-3">
                  <i class="far fa-eye mr-1 text-xs"></i>{{ topic.viewCount }} 次浏览
                </span>
                <span>
                  <i class="far fa-comment mr-1 text-xs"></i>{{ posts?.length || 0 }} 个回复
                </span>
              </div>
            </div>

            <div class="flex space-x-2">
              <!-- 举报按钮 -->
              <CommonReportButton 
                v-if="topic?.id"
                content-type="topic"
                :content-id="topic.id"
                :content-title="topic.title"
              />
              
              <client-only>
                <el-button v-if="canModerate && !topic.isSticky" size="small" @click="toggleSticky"
                  class="!bg-purple-50 !text-purple-700 !border-purple-200 hover:!bg-purple-100 !text-xs !h-7">
                  <i class="fas fa-thumbtack mr-1 text-xs"></i>置顶
                </el-button>
                <el-button v-if="canModerate && topic.isSticky" size="small" @click="toggleSticky"
                  class="!bg-purple-100 !text-purple-700 !border-purple-200 hover:!bg-purple-200 !text-xs !h-7">
                  <i class="fas fa-thumbtack mr-1 text-xs"></i>取消置顶
                </el-button>
                <el-button v-if="canModerate && !topic.isLocked" size="small" @click="toggleLock"
                  class="!bg-gray-50 !text-gray-700 !border-gray-200 hover:!bg-gray-100 !text-xs !h-7">
                  <i class="fas fa-lock mr-1 text-xs"></i>锁定
                </el-button>
                <el-button v-if="canModerate && topic.isLocked" size="small" @click="toggleLock"
                  class="!bg-gray-100 !text-gray-700 !border-gray-200 hover:!bg-gray-200 !text-xs !h-7">
                  <i class="fas fa-lock-open mr-1 text-xs"></i>解除锁定
                </el-button>
              </client-only>
            </div>
          </div>

          <div class="px-6 py-4">
            <div class="markdown-body prose prose-sm dark:prose-invert max-w-none" v-html="parsedContent"></div>
          </div>
        </div>

        <!-- 回复列表 -->
        <h2 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
          回复 ({{ posts?.length || 0 }})
        </h2>

        <div v-if="posts && posts.length > 0" class="space-y-3 mb-6">
          <!-- 递归组件用于显示嵌套回复 -->
          <ForumPostItem v-for="(post, index) in posts" :key="post.id" :post="post" :index="index + 1" :topic="topic"
            :user="user" :can-reply="!topic.isLocked" @reply="replyToPost" />
        </div>

        <!-- 回复表单 -->
        <div v-if="!topic.isLocked" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            <template v-if="replyingTo">
              回复 #{{posts.findIndex((p) => p.id === replyingTo) + 1}}
              <el-button size="small" @click="cancelReply" class="ml-2 !text-xs !text-gray-500">
                <i class="fas fa-times mr-1"></i>取消回复
              </el-button>
            </template>
            <template v-else> 发表回复 </template>
          </h3>

          <div v-if="user">
            <div class="space-y-4">
              <div>
                <client-only>
                  <template #fallback>
                    <div
                      class="border border-gray-200 dark:border-gray-700 rounded p-4 h-[250px] flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                      <p class="text-gray-400 text-xs">编辑器加载中...</p>
                    </div>
                  </template>
                  <MarkdownEditor v-model="replyContent" placeholder="在这里输入您的回复内容，支持Markdown格式..." minHeight="150px"
                    :onSave="submitReply" ref="mdEditorRef" />
                </client-only>
              </div>
              <div>
                <el-button type="primary" :loading="submitting" @click="submitReply"
                  class="!bg-linear-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 border-0 !text-xs !h-8">
                  发表回复
                </el-button>
              </div>
            </div>
          </div>
          <div v-else
            class="text-center py-4 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-750">
            <p class="text-gray-600 dark:text-gray-400 text-xs mb-3">
              您需要登录后才能回复
            </p>
            <el-button type="primary" @click="navigateToLogin" size="small"
              class="!bg-linear-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 border-0 !text-xs">
              登录 / 注册
            </el-button>
          </div>
        </div>

        <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 text-center">
          <i class="fas fa-lock text-gray-400 text-sm mb-2"></i>
          <p class="text-gray-600 dark:text-gray-400 text-xs">
            该主题已被锁定，无法回复
          </p>
        </div>
      </div>
    </div>
  </div>
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

// 检查用户是否有权限管理该主题（管理员或版主）
const canModerate = computed(() => {
  if (!user.value) return false;
  return user.value.role === "ADMIN" || user.value.role === "MODERATOR";
});

const replyContent = ref("");
const submitting = ref(false);
const replyingTo = ref(null); // 添加一个变量来跟踪回复的父评论ID
const mdEditorRef = ref(null); // 更改编辑器引用名称

// Computed property to safely parse the topic content
const parsedContent = computed(() => {
  if (!topic.value?.content) return "";
  return sanitizeHtml(marked.parse(topic.value.content));
});

function formatDate(dateString) {
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
        parentId: replyingTo.value, // 添加parentId参数
      },
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });

    if (response.success) {
      ElMessage.success(response.message || "回复成功");
      replyContent.value = "";
      replyingTo.value = null; // 重置回复的父评论ID

      // 如果回复状态是approved，则直接添加到页面，否则不添加
      if (response.data && response.data.status === "approved") {
        refresh(); // 刷新数据以显示新回复
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
  // 添加滚动到编辑器的功能
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

// 浏览量暂时不记录，等待后端API实现
onMounted(async () => {
  // 调用浏览量记录API
  try {
    await $fetch(`/api/forum/topics/${slug}/view`, {
      method: "GET",
      // 添加一个随机数作为查询参数，避免缓存
      query: {
        _t: Date.now(),
      },
    });
  } catch (error) {
    // 如果记录浏览量失败，不影响用户体验，只是在控制台记录错误
    console.error("增加浏览量失败:", error);
  }
});
</script>

<style>
@import "tailwindcss" reference;

/* 添加自定义黑暗模式颜色 */
.dark\:bg-gray-750 {
  @apply dark:bg-gray-700/70;
}

/* 文章内容样式 */
.markdown-body {
  @apply text-gray-800 dark:text-gray-200;
  font-size: 14px;
}

.markdown-body img {
  @apply rounded-lg;
  max-width: 100%;
  height: auto;
}

.markdown-body pre {
  @apply rounded-md bg-gray-100 dark:bg-gray-800 p-3 overflow-x-auto;
}

.markdown-body code {
  @apply bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded;
}

.markdown-body blockquote {
  @apply border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic;
}

.markdown-body a {
  @apply text-blue-600 dark:text-blue-400 hover:underline;
}
</style>
