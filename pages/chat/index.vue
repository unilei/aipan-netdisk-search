<template>
  <div class="container mx-auto py-6">
    <h1 class="text-2xl font-bold mb-6">聊天</h1>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <!-- 聊天室列表 -->
      <div
        class="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">聊天室</h2>
          <button
            @click="showCreateRoomModal = true"
            class="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-1"
          >
            <i class="i-carbon-add text-lg"></i>
          </button>
        </div>

        <!-- 聊天室搜索 -->
        <div class="mb-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索聊天室..."
            class="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
          />
        </div>

        <!-- 聊天室类型切换 -->
        <div class="flex mb-4 gap-2">
          <button
            @click="activeTab = 'my'"
            :class="[
              'flex-1 py-2 px-4 rounded-md',
              activeTab === 'my'
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                : 'text-gray-500',
            ]"
          >
            我的聊天
          </button>
          <button
            @click="activeTab = 'public'"
            :class="[
              'flex-1 py-2 px-4 rounded-md',
              activeTab === 'public'
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                : 'text-gray-500',
            ]"
          >
            公开聊天
          </button>
        </div>

        <!-- 聊天室列表 -->
        <div v-if="loading" class="py-4 text-center text-gray-500">
          <i class="i-carbon-circle-dash animate-spin text-2xl"></i>
          <p>加载中...</p>
        </div>

        <div
          v-else-if="filteredRooms.length === 0"
          class="py-4 text-center text-gray-500"
        >
          没有找到聊天室
        </div>

        <div v-else class="space-y-2 max-h-[60vh] overflow-y-auto">
          <div
            v-for="room in filteredRooms"
            :key="room.id"
            @click="selectRoom(room.id)"
            :class="[
              'p-3 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
              selectedRoomId === room.id
                ? 'bg-primary-50 dark:bg-primary-900'
                : '',
            ]"
          >
            <div class="flex justify-between">
              <h3 class="font-medium">{{ room.displayName || room.name }}</h3>
              <span class="text-xs text-gray-500">{{
                formatTime(room.updatedAt)
              }}</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
              {{ room.description || `${room.memberCount} 位成员` }}
            </p>
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>{{ room.type === "private" ? "私聊" : "群聊" }}</span>
              <span>{{ room.messageCount }} 条消息</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 聊天区域 -->
      <div
        class="md:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col h-[80vh]"
      >
        <div
          v-if="!selectedRoomId"
          class="flex-1 flex flex-col items-center justify-center text-gray-500"
        >
          <i class="i-carbon-chat text-6xl mb-4"></i>
          <p class="text-xl">选择一个聊天室开始聊天</p>
          <p class="mt-2">
            或者
            <button
              @click="showCreateRoomModal = true"
              class="text-primary-600 hover:underline"
            >
              创建一个新的聊天室
            </button>
          </p>
        </div>

        <ChatRoom
          v-else
          :roomId="selectedRoomId"
          :currentUserId="userStore.user?.id"
          @leave="selectedRoomId = null"
        />
      </div>
    </div>

    <!-- 创建聊天室模态框 -->
    <ClientOnly>
      <el-dialog
        v-model="showCreateRoomModal"
        title="创建新聊天室"
        width="500px"
      >
        <div class="p-4">
          <h2 class="text-xl font-bold mb-4">创建新聊天室</h2>

          <form @submit.prevent="createRoom">
            <div class="mb-4">
              <label class="block text-sm font-medium mb-1">聊天室类型</label>
              <div class="flex gap-4">
                <label class="inline-flex items-center">
                  <input
                    type="radio"
                    v-model="newRoom.type"
                    value="group"
                    class="mr-2"
                  />
                  <span>群聊</span>
                </label>
                <label class="inline-flex items-center">
                  <input
                    type="radio"
                    v-model="newRoom.type"
                    value="private"
                    class="mr-2"
                  />
                  <span>私聊</span>
                </label>
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium mb-1">聊天室名称</label>
              <input
                v-model="newRoom.name"
                type="text"
                required
                placeholder="输入聊天室名称"
                class="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium mb-1">聊天室描述</label>
              <textarea
                v-model="newRoom.description"
                placeholder="输入聊天室描述"
                class="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
                rows="3"
              ></textarea>
            </div>

            <div class="mb-4" v-if="newRoom.type === 'group'">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="newRoom.isPublic"
                  class="mr-2"
                />
                <span>公开聊天室（所有用户可见）</span>
              </label>
            </div>

            <div class="mb-4" v-if="newRoom.type === 'private'">
              <label class="block text-sm font-medium mb-1">选择用户</label>
              <select
                v-model="newRoom.userIds"
                class="w-full px-3 py-2 border rounded-md dark:bg-gray-700"
                required
              >
                <option disabled value="">请选择用户</option>
                <option v-for="user in users" :key="user.id" :value="[user.id]">
                  {{ user.username }}
                </option>
              </select>
            </div>

            <div class="flex justify-end gap-2">
              <button
                type="button"
                @click="showCreateRoomModal = false"
                class="px-4 py-2 border rounded-md"
              >
                取消
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
                :disabled="creating"
              >
                {{ creating ? "创建中..." : "创建" }}
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
