<template>
  <div class="relative">
    <button @click="toggleDropdown" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <div class="relative">
        <i class="fa-solid fa-bell text-gray-600 dark:text-gray-300"></i>
        <span v-if="unreadCount > 0"
          class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {{ unreadCount }}
        </span>
      </div>
    </button>

    <!-- 通知下拉菜单 -->
    <div v-if="isOpen"
      class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-center">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            通知
          </h3>
          <button @click="markAllAsRead"
            class="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
            全部已读
          </button>
        </div>
      </div>

      <div class="max-h-96 overflow-y-auto">
        <div v-if="notifications.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400">
          暂无通知
        </div>
        <div v-else>
          <div v-for="notification in notifications" :key="notification.id"
            class="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            :class="{ 'bg-gray-50 dark:bg-gray-700': !notification.isRead }"
            @click="handleNotificationClick(notification)">
            <div class="flex items-start">
              <div class="flex-1">
                <div class="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {{ notification.title }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ notification.content }}
                </div>
                <div class="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {{ formatTime(notification.createdAt) }}
                </div>
              </div>
              <div v-if="!notification.isRead" class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-gray-200 dark:border-gray-700">
        <NuxtLink to="/notifications"
          class="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
          查看全部通知
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

const isOpen = ref(false);
const notifications = ref([]);
const unreadCount = ref(0);

// 获取通知列表
const fetchNotifications = async () => {
  try {
    const response = await fetch("/api/notifications?page=1&pageSize=5", {
      method: "GET",
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });
    const data = await response.json();
    if (data.success) {
      // 通知去重处理
      const notificationMap = new Map();
      data.data.notifications.forEach(notification => {
        const key = `${notification.type}-${notification.relatedId}`;
        // 如果已经有相同key的通知，只保留创建时间最新的一条
        if (!notificationMap.has(key) || new Date(notificationMap.get(key).createdAt) < new Date(notification.createdAt)) {
          notificationMap.set(key, notification);
        }
      });
      notifications.value = Array.from(notificationMap.values());
    }
  } catch (error) {
    console.error("获取通知失败:", error);
  }
};

// 获取未读通知数量
const fetchUnreadCount = async () => {
  try {
    const response = await fetch("/api/notifications/unread-count", {
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });
    const data = await response.json();
    if (data.success) {
      unreadCount.value = data.data.count;
    }
  } catch (error) {
    console.error("获取未读通知数量失败:", error);
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
    await fetchUnreadCount();
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
    await fetchUnreadCount();
  }

};

// 格式化时间
const formatTime = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN });
};

// 切换下拉菜单
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    fetchNotifications();
  }
};

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  if (isOpen.value && !event.target.closest(".relative")) {
    isOpen.value = false;
  }
};

onMounted(() => {
  fetchUnreadCount();
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
