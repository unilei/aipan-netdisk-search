<template>
  <div class="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 聊天页面头部 -->
    <div class="border-b dark:border-gray-700 bg-white dark:bg-gray-800 py-4 px-6 shadow-sm">
      <div class="container mx-auto flex items-center justify-between">
        <div class="flex items-center">
          <NuxtLink to="/"
            class="mr-4 text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors duration-200">
            <i class="fas fa-arrow-left text-xl"></i>
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <i class="i-carbon-chat text-indigo-500 mr-2"></i>
            爱盼聊天
          </h1>
        </div>
        <button @click="showCreateRoomModal = true"
          class="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full transition-colors duration-200">
          <i class="i-carbon-add mr-1"></i> 新建聊天
        </button>
      </div>
    </div>

    <!-- 主聊天区域 -->
    <div class="flex-1 container mx-auto flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
      <!-- 左侧聊天室列表面板 -->
      <div class="md:w-80 w-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden shrink-0">
        <!-- 搜索框 -->
        <div class="p-4 border-b dark:border-gray-700">
          <div class="relative">
            <input v-model="searchQuery" type="text" placeholder="搜索聊天室..."
              class="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200" />
            <i
              class="i-carbon-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"></i>
          </div>
        </div>

        <!-- 聊天室类型切换 -->
        <div class="flex p-3 gap-1 bg-gray-50 dark:bg-gray-850">
          <button @click="activeTab = 'my'" :class="[
            'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200',
            activeTab === 'my'
              ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-750',
          ]">
            <div class="flex items-center justify-center">
              <i class="i-carbon-chat mr-1.5"></i>
              我的聊天
            </div>
          </button>
          <button @click="activeTab = 'public'" :class="[
            'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200',
            activeTab === 'public'
              ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-750',
          ]">
            <div class="flex items-center justify-center">
              <i class="i-carbon-globe mr-1.5"></i>
              公开聊天
            </div>
          </button>
        </div>

        <!-- 聊天室列表 -->
        <div class="flex-1 overflow-y-auto" style="scrollbar-width: thin">
          <div v-if="loading" class="flex flex-col items-center justify-center h-40 text-gray-500">
            <i class="i-carbon-circle-dash animate-spin text-3xl mb-2 text-indigo-500"></i>
            <p>加载中...</p>
          </div>

          <div v-else-if="filteredRooms.length === 0"
            class="flex flex-col items-center justify-center h-40 text-gray-500">
            <i class="i-carbon-search-no-results text-4xl mb-2"></i>
            <p>没有找到聊天室</p>
            <button @click="showCreateRoomModal = true"
              class="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              创建新的聊天室
            </button>
          </div>

          <div v-else>
            <div v-for="room in filteredRooms" :key="room.id" @click="selectRoom(room.id)" :class="[
              'p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200',
              selectedRoomId === room.id
                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500'
                : 'border-l-4 border-l-transparent',
            ]">
              <div class="flex justify-between">
                <h3 class="font-medium text-gray-900 dark:text-white flex items-center">
                  <span class="mr-2">{{ room.displayName || room.name }}</span>
                  <span v-if="room.isPublic"
                    class="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">公开</span>
                </h3>
                <span class="text-xs text-gray-500">{{
                  formatTime(room.updatedAt)
                  }}</span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                {{ room.description || `${room.memberCount} 位成员` }}
              </p>
              <div class="flex justify-between text-xs text-gray-500 mt-2">
                <span class="flex items-center">
                  <i :class="[
                    room.type === 'private'
                      ? 'i-carbon-user-follow'
                      : 'i-carbon-group',
                    'mr-1',
                  ]"></i>
                  {{ room.type === "private" ? "私聊" : "群聊" }}
                </span>
                <span class="flex items-center">
                  <i class="i-carbon-chat-bot mr-1"></i>
                  {{ room.messageCount }} 条消息
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧聊天内容区域 -->
      <div class="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden flex flex-col">
        <div v-if="!selectedRoomId" class="flex-1 flex flex-col items-center justify-center text-gray-500 p-6">
          <div class="bg-gray-50 dark:bg-gray-750 p-8 rounded-xl text-center max-w-md">
            <i class="i-carbon-messaging text-6xl mb-4 text-indigo-500 opacity-70"></i>
            <h2 class="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">
              开始聊天吧
            </h2>
            <p class="text-gray-500 dark:text-gray-400 mb-6">
              选择左侧的聊天室或创建一个新的聊天
            </p>
            <button @click="showCreateRoomModal = true"
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 flex items-center mx-auto">
              <i class="i-carbon-add mr-2"></i> 创建新聊天室
            </button>
          </div>
        </div>

        <ChatRoom v-else :roomId="selectedRoomId" :currentUserId="userStore.user?.id" @leave="selectedRoomId = null"
          @delete-room="handleDeleteRoom" />
      </div>
    </div>

    <!-- 创建聊天室模态框 -->
    <ClientOnly>
      <el-dialog v-model="showCreateRoomModal" title="创建新聊天室" width="500px" class="chat-room-dialog">
        <div class="p-4">
          <form @submit.prevent="createRoom" class="space-y-5">
            <div class="mb-1">
              <div class="flex justify-center gap-4 mb-5">
                <button type="button" @click="newRoom.type = 'group'" :class="[
                  'flex flex-col items-center justify-center w-32 h-28 rounded-xl p-3 transition-all duration-200 border-2',
                  newRoom.type === 'group'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-200 hover:bg-gray-50',
                ]">
                  <i class="i-carbon-group text-3xl mb-2"></i>
                  <span class="font-medium">群聊</span>
                </button>
                <button type="button" @click="newRoom.type = 'private'" :class="[
                  'flex flex-col items-center justify-center w-32 h-28 rounded-xl p-3 transition-all duration-200 border-2',
                  newRoom.type === 'private'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-200 hover:bg-gray-50',
                ]">
                  <i class="i-carbon-user-follow text-3xl mb-2"></i>
                  <span class="font-medium">私聊</span>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">聊天室名称</label>
              <input v-model="newRoom.name" type="text" required placeholder="输入一个友好的聊天室名称"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">聊天室描述</label>
              <textarea v-model="newRoom.description" placeholder="简短描述一下这个聊天室的主题或用途"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                rows="3"></textarea>
            </div>

            <div v-if="newRoom.type === 'group'">
              <label class="flex items-center">
                <input type="checkbox" v-model="newRoom.isPublic" class="form-checkbox h-5 w-5 text-indigo-600" />
                <span class="ml-2 text-gray-700 dark:text-gray-300">公开聊天室（所有用户可见）</span>
              </label>
            </div>

            <div v-if="newRoom.type === 'private'">
              <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">选择用户</label>
              <select v-model="newRoom.userIds"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                required>
                <option disabled value="">请选择用户</option>
                <option v-for="user in users" :key="user.id" :value="[user.id]">
                  {{ user.username }}
                </option>
              </select>
            </div>

            <div class="flex justify-end gap-3 pt-3">
              <button type="button" @click="showCreateRoomModal = false"
                class="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                取消
              </button>
              <button type="submit"
                class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors duration-200 flex items-center"
                :disabled="creating">
                <i class="i-carbon-send mr-1.5" v-if="!creating"></i>
                <i class="i-carbon-circle-dash animate-spin mr-1.5" v-else></i>
                {{ creating ? "创建中..." : "创建聊天室" }}
              </button>
            </div>
          </form>
        </div>
      </el-dialog>
    </ClientOnly>
  </div>
</template>

<script setup>
import { ElMessage } from "element-plus";
import { useUserStore } from "~/stores/user";
definePageMeta({
  layout: "custom",
});

// SEO配置
useHead({
  title: '在线聊天 - 爱盼迷',
  meta: [
    { name: 'description', content: '爱盼迷在线聊天室，支持创建群聊和私聊，与社区用户实时交流。' },
  ]
})
// 获取用户信息
const userStore = useUserStore();

// 聊天室相关状态
const activeTab = ref("my");
const searchQuery = ref("");
const loading = ref(false);
const rooms = ref([]);
const users = ref([]);
const selectedRoomId = ref(null);

// 创建聊天室相关状态
const showCreateRoomModal = ref(false);
const creating = ref(false);
const newRoom = ref({
  name: "",
  description: "",
  type: "group",
  isPublic: false,
  userIds: [],
});

// 监听标签变化，获取对应的聊天室列表
watch(activeTab, fetchRooms);

// 计算过滤后的聊天室列表
const filteredRooms = computed(() => {
  if (!searchQuery.value) return rooms.value;

  const query = searchQuery.value.toLowerCase();
  return rooms.value.filter((room) => {
    const displayName = room.displayName || room.name;
    return (
      displayName.toLowerCase().includes(query) ||
      (room.description && room.description.toLowerCase().includes(query))
    );
  });
});

// 初始化
onMounted(async () => {
  // 检查用户登录状态
  if (!userStore.user || !useCookie("token").value) {
    await navigateTo("/login");
    return;
  }

  await fetchRooms();
  await fetchUsers();
});

// 获取聊天室列表
async function fetchRooms() {
  try {
    loading.value = true;
    const isPublic = activeTab.value === "public";
    const response = await $fetch(`/api/chat/rooms?public=${isPublic}`, {
      headers: {
        Authorization: "Bearer " + useCookie("token").value,
      },
    });
    if (response) {
      rooms.value = response;
    }
  } catch (error) {
    console.error("获取聊天室列表失败:", error);
    ElMessage.error("获取聊天室列表失败");
  } finally {
    loading.value = false;
  }
}

// 获取用户列表（用于私聊）
async function fetchUsers() {
  try {
    const response = await $fetch("/api/chat/users", {
      headers: {
        Authorization: "Bearer " + useCookie("token").value,
      },
    });
    if (response) {
      users.value = response;
    }
  } catch (error) {
    console.error("获取用户列表失败:", error);
  }
}

// 创建聊天室
async function createRoom() {
  try {
    creating.value = true;
    const response = await $fetch("/api/chat/rooms", {
      method: "POST",
      body: newRoom.value,
      headers: {
        Authorization: "Bearer " + useCookie("token").value,
      },
    });

    if (response) {
      // 重置表单
      newRoom.value = {
        name: "",
        description: "",
        type: "group",
        isPublic: false,
        userIds: [],
      };

      // 刷新聊天室列表
      await fetchRooms();

      // 选中新创建的聊天室
      selectedRoomId.value = response.id;

      // 关闭模态框
      showCreateRoomModal.value = false;

      ElMessage.success("聊天室创建成功");
    }
  } catch (error) {
    console.error("创建聊天室失败:", error);
    ElMessage.error("创建聊天室失败");
  } finally {
    creating.value = false;
  }
}

// 选择聊天室
function selectRoom(roomId) {
  selectedRoomId.value = roomId;
}

// 删除聊天室
async function handleDeleteRoom(roomId) {
  try {
    await $fetch(`/api/chat/rooms/${roomId}/delete`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + useCookie("token").value,
      },
    });
    await fetchRooms();
    selectedRoomId.value = null;
    ElMessage.success("聊天室删除成功");
  } catch (error) {
    console.error("删除聊天室失败:", error);
    ElMessage.error("删除聊天室失败");
  }
}

// 格式化时间
function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  // 一天内
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // 一周内
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ["日", "一", "二", "三", "四", "五", "六"];
    return `周${days[date.getDay()]}`;
  }

  // 一年内
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
    });
  }

  // 超过一年
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
</script>

<style>
.chat-room-dialog .el-dialog__header {
  padding: 16px;
  margin: 0;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.dark .chat-room-dialog .el-dialog__header {
  background-color: #1f2937;
  border-color: #374151;
}

.chat-room-dialog .el-dialog__title {
  font-weight: 600;
  font-size: 1.125rem;
}

.chat-room-dialog .el-dialog__body {
  padding: 0;
}

.chat-room-dialog .el-dialog__headerbtn {
  top: 15px;
}
</style>
