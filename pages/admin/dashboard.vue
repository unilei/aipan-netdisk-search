<template>
  <div class="space-y-6">
    <!-- 欢迎卡片 -->
    <div
      class="bg-linear-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-lg p-6 text-white shadow-lg"
    >
      <h2 class="text-2xl font-bold mb-2">欢迎回来！</h2>
      <p class="opacity-90">使用侧边栏导航选择要管理的功能模块</p>
    </div>

    <!-- 统计信息区域 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="admin-card-bg p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <div class="flex items-center space-x-2">
          <el-icon :size="20" class="text-blue-500">
            <Folder />
          </el-icon>
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">云盘文件数</h3>
        </div>
        <div class="mt-2 flex items-baseline">
          <el-skeleton-item
            v-if="stats.cloudFiles.loading"
            variant="text"
            class="w-16 h-8"
          />
          <template v-else>
            <span class="text-2xl font-semibold text-gray-900 dark:text-white">{{
              stats.cloudFiles.count
            }}</span>
            <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">个文件</span>
          </template>
        </div>
      </div>

      <div class="admin-card-bg p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <div class="flex items-center space-x-2">
          <el-icon :size="20" class="text-green-500">
            <Document />
          </el-icon>
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">博客文章数</h3>
        </div>
        <div class="mt-2 flex items-baseline">
          <el-skeleton-item
            v-if="stats.blogPosts.loading"
            variant="text"
            class="w-16 h-8"
          />
          <template v-else>
            <span class="text-2xl font-semibold text-gray-900 dark:text-white">{{
              stats.blogPosts.count
            }}</span>
            <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">篇文章</span>
          </template>
        </div>
      </div>

      <div class="admin-card-bg p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <div class="flex items-center space-x-2">
          <el-icon :size="20" class="text-red-500">
            <User />
          </el-icon>
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">用户数量</h3>
        </div>
        <div class="mt-2 flex items-baseline">
          <el-skeleton-item
            v-if="stats.users.loading"
            variant="text"
            class="w-16 h-8"
          />
          <template v-else>
            <span class="text-2xl font-semibold text-gray-900 dark:text-white">{{
              stats.users.count
            }}</span>
            <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">位用户</span>
          </template>
        </div>
      </div>

      <div class="admin-card-bg p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <div class="flex items-center space-x-2">
          <el-icon :size="20" class="text-purple-500">
            <Monitor />
          </el-icon>
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">存储源数量</h3>
        </div>
        <div class="mt-2 flex items-baseline">
          <el-skeleton-item
            v-if="stats.alistSources.loading"
            variant="text"
            class="w-16 h-8"
          />
          <template v-else>
            <span class="text-2xl font-semibold text-gray-900 dark:text-white">{{
              stats.alistSources.count
            }}</span>
            <span class="ml-2 text-sm text-blue-600 flex items-center">
              <el-icon :size="16" class="mr-0.5">
                <CircleCheck />
              </el-icon>
              活跃
            </span>
          </template>
        </div>
      </div>

      <div class="admin-card-bg p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <div class="flex items-center space-x-2">
          <el-icon :size="20" class="text-orange-500">
            <ChatLineRound />
          </el-icon>
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">评论数量</h3>
        </div>
        <div class="mt-2 flex items-baseline">
          <el-skeleton-item
            v-if="stats.comments.loading"
            variant="text"
            class="w-16 h-8"
          />
          <template v-else>
            <span class="text-2xl font-semibold text-gray-900 dark:text-white">{{
              stats.comments.count
            }}</span>
            <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">条评论</span>
          </template>
        </div>
      </div>

      <div class="admin-card-bg p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <div class="flex items-center space-x-2">
          <el-icon :size="20" class="text-cyan-500">
            <ChatLineRound />
          </el-icon>
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">论坛主题数</h3>
        </div>
        <div class="mt-2 flex items-baseline">
          <el-skeleton-item
            v-if="stats.forumTopics.loading"
            variant="text"
            class="w-16 h-8"
          />
          <template v-else>
            <span class="text-2xl font-semibold text-gray-900 dark:text-white">{{
              stats.forumTopics.count
            }}</span>
            <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">个主题</span>
          </template>
        </div>
      </div>

      <div class="admin-card-bg p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <div class="flex items-center space-x-2">
          <el-icon :size="20" class="text-indigo-500">
            <ChatRound />
          </el-icon>
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">聊天室数量</h3>
        </div>
        <div class="mt-2 flex items-baseline">
          <el-skeleton-item
            v-if="stats.chatRooms.loading"
            variant="text"
            class="w-16 h-8"
          />
          <template v-else>
            <span class="text-2xl font-semibold text-gray-900 dark:text-white">{{
              stats.chatRooms.count
            }}</span>
            <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">个聊天室</span>
          </template>
        </div>
      </div>

      <div class="admin-card-bg p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <div class="flex items-center space-x-2">
          <el-icon :size="20" class="text-red-500">
            <Warning />
          </el-icon>
          <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">待处理举报</h3>
        </div>
        <div class="mt-2 flex items-baseline">
          <el-skeleton-item
            v-if="stats.reports.loading"
            variant="text"
            class="w-16 h-8"
          />
          <template v-else>
            <span class="text-2xl font-semibold text-gray-900 dark:text-white">{{
              stats.reports.pending
            }}</span>
            <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">条待处理</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Folder,
  Document,
  Monitor,
  CircleCheck,
  ChatLineRound,
  ChatRound,
  User,
  Warning,
} from "@element-plus/icons-vue";
const { logout } = useAuth();

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
});

// 统计数据
const stats = reactive({
  cloudFiles: {
    count: 0,
    loading: true,
  },
  blogPosts: {
    count: 0,
    loading: true,
  },
  alistSources: {
    count: 0,
    loading: true,
  },
  comments: {
    count: 0,
    loading: true,
  },
  users: {
    count: 0,
    loading: true,
  },
  forumTopics: {
    count: 0,
    loading: true,
  },
  chatRooms: {
    count: 0,
    loading: true,
  },
  reports: {
    pending: 0,
    loading: true,
  },
});

// 获取云盘文件数量
const getCloudFilesCount = async () => {
  try {
    const res = await $fetch("/api/admin/clouddrive/stats", {
      method: "GET",
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });
    stats.cloudFiles.count = res.count;
  } catch (error) {
    console.error("Failed to fetch cloud files count:", error);
  } finally {
    stats.cloudFiles.loading = false;
  }
};

// 获取博客文章数量
const getBlogPostsCount = async () => {
  try {
    const res = await $fetch("/api/admin/blog/posts/stats", {
      method: "GET",
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });
    stats.blogPosts.count = res.count;
  } catch (error) {
    console.error("Failed to fetch blog posts count:", error);
  } finally {
    stats.blogPosts.loading = false;
  }
};

// 获取Alist源数量
const getAlistSourcesCount = async () => {
  try {
    const res = await $fetch("/api/admin/alist/stats", {
      method: "GET",
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });
    stats.alistSources.count = res.count;
  } catch (error) {
    console.error("Failed to fetch alist sources count:", error);
  } finally {
    stats.alistSources.loading = false;
  }
};

// 获取评论数量
const getCommentsCount = async () => {
  try {
    const res = await $fetch("/api/blog/comments?page=1&pageSize=1", {
      method: "GET",
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });
    stats.comments.count = res.data.total;
  } catch (error) {
    console.error("Failed to fetch comments count:", error);
  } finally {
    stats.comments.loading = false;
  }
};

// 获取用户数量
const getUsersCount = async () => {
  try {
    const res = await $fetch("/api/admin/user-center/stats", {
      method: "GET",
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });
    stats.users.count = res.count;
  } catch (error) {
    console.error("Failed to fetch users count:", error);
  } finally {
    stats.users.loading = false;
  }
};

// 获取论坛主题数量
const getForumTopicsCount = async () => {
  try {
    const res = await $fetch("/api/admin/forum/topics/stats", {
      method: "GET",
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });
    stats.forumTopics.count = res.count;
  } catch (error) {
    console.error("Failed to fetch forum topics count:", error);
  } finally {
    stats.forumTopics.loading = false;
  }
};

// 获取聊天室数量
const getChatRoomsCount = async () => {
  try {
    const res = await $fetch("/api/admin/chat/stats", {
      method: "GET",
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });
    stats.chatRooms.count = res.count;
  } catch (error) {
    console.error("Failed to fetch chat rooms count:", error);
  } finally {
    stats.chatRooms.loading = false;
  }
};

// 获取待处理举报数量
const getReportsCount = async () => {
  try {
    const res = await $fetch(
      "/api/admin/reports/list?status=pending&pageSize=1",
      {
        method: "GET",
        headers: {
          authorization: "Bearer " + useCookie("token").value,
        },
      }
    );
    stats.reports.pending = res.data?.total || 0;
  } catch (error) {
    console.error("Failed to fetch reports count:", error);
  } finally {
    stats.reports.loading = false;
  }
};

// 页面加载时获取统计数据
onMounted(() => {
  getCloudFilesCount();
  getBlogPostsCount();
  getAlistSourcesCount();
  getCommentsCount();
  getUsersCount();
  getForumTopicsCount();
  getChatRoomsCount();
  getReportsCount();
});

const handleLogout = () => {
  logout();
};
</script>

<style scoped>
.group:hover .group-hover\:text-primary {
  color: rgb(var(--el-color-primary));
}
</style>
