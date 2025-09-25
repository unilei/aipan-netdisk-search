<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-3xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">通知中心</h1>
        <button
          @click="markAllAsRead"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          全部已读
        </button>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div v-if="loading" class="p-4 text-center">
          <i class="fa-solid fa-spinner fa-spin w-6 h-6"></i>
        </div>
        <div
          v-else-if="notifications.length === 0"
          class="p-4 text-center text-gray-500"
        >
          暂无通知
        </div>
        <div v-else>
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            :class="{ 'bg-gray-50 dark:bg-gray-700': !notification.isRead }"
            @click="handleNotificationClick(notification)"
          >
            <div class="flex items-start">
              <div class="flex-1">
                <div class="text-sm font-medium">{{ notification.title }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ notification.content }}
                </div>
                <div class="text-xs text-gray-400 mt-2">
                  {{ formatTime(notification.createdAt) }}
                </div>
              </div>
              <div
                v-if="!notification.isRead"
                class="w-2 h-2 bg-blue-500 rounded-full"
              ></div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div
          v-if="totalPages > 1"
          class="p-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div class="flex justify-center space-x-2">
            <button
              @click="prevPage"
              :disabled="currentPage === 1"
              class="px-3 py-1 rounded border disabled:opacity-50"
            >
              上一页
            </button>
            <span class="px-3 py-1">
              {{ currentPage }} / {{ totalPages }}
            </span>
            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="px-3 py-1 rounded border disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

const notifications = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const totalPages = ref(1);
const pageSize = 20;

// 获取通知列表
const fetchNotifications = async () => {
  try {
    loading.value = true;
    const response = await fetch(
      `/api/notifications?page=${currentPage.value}&pageSize=${pageSize}`,
      {
        method: "GET",
        headers: {
          authorization: "Bearer " + useCookie("token").value,
        },
      }
    );
    const data = await response.json();
    if (data.success) {
      notifications.value = data.data.notifications;
      totalPages.value = data.data.pagination.totalPages;
    }
  } catch (error) {
    console.error("获取通知失败:", error);
  } finally {
    loading.value = false;
  }
};

// 标记所有通知为已读
const markAllAsRead = async () => {
  try {
    const unreadNotifications = notifications.value.filter((n) => !n.isRead);
    await Promise.all(
      unreadNotifications.map((n) =>
        fetch(`/api/notifications/${n.id}/read`, {
          method: "POST",
          headers: {
            authorization: "Bearer " + useCookie("token").value,
          },
        })
      )
    );
    await fetchNotifications();
  } catch (error) {
    console.error("标记通知为已读失败:", error);
  }
};

// 处理通知点击
const handleNotificationClick = async (notification) => {
  if (!notification.isRead) {
    await fetch(`/api/notifications/${notification.id}/read`, {
      method: "POST",
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });
    await fetchNotifications();
  }
 
};

// 格式化时间
const formatTime = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN });
};

// 分页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchNotifications();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchNotifications();
  }
};

onMounted(() => {
  fetchNotifications();
});
</script>
