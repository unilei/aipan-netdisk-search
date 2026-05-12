<template>
  <main class="flex h-[100dvh] flex-col bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
    <header class="shrink-0 border-b border-slate-200 bg-white/95 px-3 py-3 shadow-sm shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/95 dark:shadow-none sm:px-4">
      <div class="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <NuxtLink
            to="/forum"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white"
            aria-label="返回论坛"
          >
            <i class="fas fa-arrow-left text-sm"></i>
          </NuxtLink>
          <div class="min-w-0">
            <h1 class="m-0 truncate text-lg font-semibold tracking-normal text-slate-950 dark:text-white">消息中心</h1>
            <p class="m-0 truncate text-xs text-slate-500 dark:text-slate-400">私信、群聊和公开聊天室统一处理</p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <NuxtLink
            to="/forum"
            class="hidden h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/5 sm:inline-flex"
          >
            <i class="fas fa-comments mr-2 text-xs text-slate-400"></i>
            论坛
          </NuxtLink>
          <button
            class="inline-flex h-9 items-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            @click="showCreateGroupDialog = true"
          >
            <i class="fas fa-plus mr-2 text-xs"></i>
            新建群聊
          </button>
        </div>
      </div>
    </header>

    <section class="mx-auto grid min-h-0 w-full max-w-[1440px] flex-1 grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_280px]">
      <aside
        :class="[
          'min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/60 dark:border-white/10 dark:bg-slate-900 dark:shadow-none',
          selectedRoomId ? 'hidden lg:flex' : 'flex',
        ]"
      >
        <div class="shrink-0 border-b border-slate-200 p-4 dark:border-white/10">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-sm font-semibold text-slate-950 dark:text-white">收件箱</div>
              <p class="m-0 mt-1 text-xs text-slate-500 dark:text-slate-400">
                {{ activeTabMeta.description }}
              </p>
            </div>
            <div class="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
              {{ filteredRooms.length }} 个
            </div>
          </div>

          <div class="mt-4 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-950">
            <button
              v-for="tab in roomTabs"
              :key="tab.key"
              type="button"
              :class="[
                'flex min-w-0 items-center justify-center gap-1.5 rounded-md px-2 py-2 font-semibold transition',
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-300'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
              ]"
              @click="switchTab(tab.key)"
            >
              <i :class="[tab.icon, 'text-xs']"></i>
              <span class="truncate">{{ tab.label }}</span>
            </button>
          </div>

          <label class="relative mt-3 block">
            <span class="sr-only">搜索会话</span>
            <input
              v-model="searchQuery"
              class="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-500/20"
              type="search"
              placeholder="搜索会话、成员或最近消息"
            />
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
          </label>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <div v-if="loading" class="space-y-3 p-4">
            <div v-for="index in 5" :key="index" class="flex gap-3">
              <div class="h-11 w-11 rounded-lg bg-slate-100 dark:bg-white/10"></div>
              <div class="min-w-0 flex-1 space-y-2 pt-1">
                <div class="h-3.5 w-2/3 rounded bg-slate-100 dark:bg-white/10"></div>
                <div class="h-3 w-5/6 rounded bg-slate-100 dark:bg-white/10"></div>
              </div>
            </div>
          </div>

          <div v-else-if="filteredRooms.length === 0" class="flex min-h-full items-center justify-center px-6 py-12 text-center">
            <div class="max-w-[260px]">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-white/10">
                <i :class="[activeTabMeta.icon, 'text-lg']"></i>
              </div>
              <p class="m-0 mt-4 text-sm font-medium text-slate-700 dark:text-slate-200">{{ emptyText }}</p>
              <p class="m-0 mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{{ emptyHint }}</p>
              <NuxtLink
                v-if="activeTab === 'private'"
                to="/forum"
                class="mt-4 inline-flex h-9 items-center rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                去论坛找用户
              </NuxtLink>
              <button
                v-else
                class="mt-4 inline-flex h-9 items-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                type="button"
                @click="showCreateGroupDialog = true"
              >
                新建群聊
              </button>
            </div>
          </div>

          <div v-else class="p-2">
            <button
              v-for="room in filteredRooms"
              :key="room.id"
              type="button"
              :class="[
                'group mb-1 flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition',
                Number(selectedRoomId) === Number(room.id)
                  ? 'bg-blue-50 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:ring-blue-500/20'
                  : 'hover:bg-slate-50 dark:hover:bg-white/5',
              ]"
              @click="selectRoom(room.id)"
            >
              <div
                :class="[
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
                  room.type === 'private'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                    : room.isPublic
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
                ]"
              >
                {{ getInitial(room.displayName || room.name) }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 items-center justify-between gap-2">
                  <div class="min-w-0">
                    <div class="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {{ room.displayName || room.name }}
                    </div>
                    <div class="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                      <i :class="[roomIcon(room), 'text-[10px]']"></i>
                      <span>{{ roomTypeLabel(room) }}</span>
                    </div>
                  </div>
                  <span class="shrink-0 text-xs text-slate-400">{{ formatTime(room.lastMessageAt || room.updatedAt) }}</span>
                </div>
                <div class="mt-2 flex items-center gap-2">
                  <p class="m-0 min-w-0 flex-1 truncate text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {{ lastMessageText(room) }}
                  </p>
                  <span
                    v-if="room.unreadCount"
                    class="inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white"
                  >
                    {{ room.unreadCount > 99 ? "99+" : room.unreadCount }}
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </aside>

      <section
        :class="[
          'min-h-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/60 dark:border-white/10 dark:bg-slate-900 dark:shadow-none',
          selectedRoomId ? 'flex' : 'hidden lg:flex',
        ]"
      >
        <div v-if="!selectedRoomId" class="flex flex-1 items-center justify-center p-8 text-center">
          <div class="max-w-[360px]">
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
              <i class="fas fa-message text-xl"></i>
            </div>
            <h2 class="m-0 mt-5 text-lg font-semibold text-slate-900 dark:text-white">选择一个会话</h2>
            <p class="m-0 mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">左侧会话列表会同步私信、群聊和公开聊天室。私信可从论坛作者或回复者入口发起。</p>
            <div class="mt-5 flex justify-center gap-2">
              <NuxtLink
                to="/forum"
                class="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/5"
              >
                浏览论坛
              </NuxtLink>
              <button
                class="inline-flex h-9 items-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                type="button"
                @click="showCreateGroupDialog = true"
              >
                新建群聊
              </button>
            </div>
          </div>
        </div>

        <ChatRoom
          v-else
          class="flex-1"
          :roomId="selectedRoomId"
          :currentUserId="userStore.user?.id"
          @leave="closeRoom"
          @delete-room="handleDeleteRoom"
          @message-sent="fetchRooms"
        />
      </section>

      <aside class="hidden min-h-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/60 dark:border-white/10 dark:bg-slate-900 dark:shadow-none xl:flex xl:flex-col">
        <div class="border-b border-slate-200 p-4 dark:border-white/10">
          <div class="text-sm font-semibold text-slate-950 dark:text-white">会话详情</div>
          <p class="m-0 mt-1 text-xs text-slate-500 dark:text-slate-400">当前会话状态和常用操作</p>
        </div>

        <div v-if="selectedRoomId" class="min-h-0 flex-1 overflow-y-auto p-4">
          <div class="text-center">
            <div
              :class="[
                'mx-auto flex h-16 w-16 items-center justify-center rounded-lg text-xl font-bold',
                selectedRoom?.type === 'private'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                  : selectedRoom?.isPublic
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
              ]"
            >
              {{ getInitial(selectedRoomName) }}
            </div>
            <h2 class="m-0 mt-3 truncate text-base font-semibold text-slate-950 dark:text-white">{{ selectedRoomName }}</h2>
            <p class="m-0 mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{{ selectedRoomSummary }}</p>
          </div>

          <div class="mt-5 space-y-3">
            <div class="rounded-lg border border-slate-200 p-3 dark:border-white/10">
              <div class="flex items-center justify-between gap-3 text-xs">
                <span class="text-slate-500 dark:text-slate-400">类型</span>
                <span class="font-semibold text-slate-800 dark:text-slate-100">{{ selectedRoomTypeLabel }}</span>
              </div>
              <div class="mt-3 flex items-center justify-between gap-3 text-xs">
                <span class="text-slate-500 dark:text-slate-400">最后活跃</span>
                <span class="font-semibold text-slate-800 dark:text-slate-100">{{ formatTime(selectedRoom?.lastMessageAt || selectedRoom?.updatedAt) || "暂无" }}</span>
              </div>
              <div class="mt-3 flex items-center justify-between gap-3 text-xs">
                <span class="text-slate-500 dark:text-slate-400">未读</span>
                <span class="font-semibold text-slate-800 dark:text-slate-100">{{ selectedRoom?.unreadCount || 0 }}</span>
              </div>
            </div>

            <div class="rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-900 dark:bg-blue-500/10 dark:text-blue-100">
              <div class="mb-1 font-semibold">私信规则</div>
              发起新私信需要当前积分达到 10000，资格达标即可发起，不扣除积分；回复已有私信不受限制。
            </div>

            <button
              class="flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/5"
              type="button"
              @click="closeRoom"
            >
              <i class="fas fa-list-ul mr-2 text-xs text-slate-400"></i>
              返回会话列表
            </button>
          </div>
        </div>

        <div v-else class="flex flex-1 items-center justify-center p-5 text-center">
          <div>
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-white/10">
              <i class="fas fa-circle-info text-lg"></i>
            </div>
            <p class="m-0 mt-4 text-sm font-medium text-slate-700 dark:text-slate-200">还未选择会话</p>
            <p class="m-0 mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">选择左侧任一会话后，这里会显示会话信息。</p>
          </div>
        </div>
      </aside>
    </section>

    <ClientOnly>
      <el-dialog v-model="showCreateGroupDialog" title="新建群聊" width="520px">
        <el-form label-width="90px" @submit.prevent="createGroupRoom">
          <el-form-item label="群聊名称" required>
            <el-input v-model="newGroup.name" placeholder="输入群聊名称" maxlength="80" />
          </el-form-item>
          <el-form-item label="群聊说明">
            <el-input v-model="newGroup.description" type="textarea" :rows="3" maxlength="200" show-word-limit />
          </el-form-item>
          <el-form-item label="公开">
            <el-switch v-model="newGroup.isPublic" active-text="公开聊天室" inactive-text="仅成员可见" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showCreateGroupDialog = false">取消</el-button>
          <el-button type="primary" :loading="creating" :disabled="!newGroup.name.trim()" @click="createGroupRoom">
            创建
          </el-button>
        </template>
      </el-dialog>
    </ClientOnly>
  </main>
</template>

<script setup>
import { ElMessage } from "element-plus";
import { useUserStore } from "~/stores/user";

definePageMeta({
  layout: "custom",
});

useHead({
  title: "消息中心 - 爱盼",
  meta: [
    { name: "description", content: "爱盼消息中心，支持私信、群聊和公开聊天室。" },
  ],
});

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const activeTab = ref("private");
const searchQuery = ref("");
const loading = ref(false);
const rooms = ref([]);
const selectedRoomId = ref(route.query.roomId ? Number(route.query.roomId) : null);
const showCreateGroupDialog = ref(false);
const creating = ref(false);

const newGroup = reactive({
  name: "",
  description: "",
  isPublic: false,
});

const roomTabs = [
  { key: "private", label: "私信", icon: "fas fa-user", description: "来自论坛作者和回复者的一对一消息" },
  { key: "group", label: "群聊", icon: "fas fa-users", description: "仅成员可见的多人会话" },
  { key: "public", label: "公开", icon: "fas fa-globe", description: "所有用户可见的公开聊天室" },
];

const activeTabMeta = computed(() => {
  return roomTabs.find((tab) => tab.key === activeTab.value) || roomTabs[0];
});

const emptyText = computed(() => {
  if (activeTab.value === "private") return "暂无私信会话";
  if (activeTab.value === "public") return "暂无公开聊天室";
  return "暂无群聊";
});

const emptyHint = computed(() => {
  if (activeTab.value === "private") return "你可以从论坛主题作者或回复者入口发起私信。";
  if (activeTab.value === "public") return "创建公开聊天室后，所有用户都可以发现并加入。";
  return "创建群聊后再邀请成员加入。";
});

const filteredRooms = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return rooms.value;
  return rooms.value.filter((room) => {
    return [
      room.displayName,
      room.name,
      room.description,
      room.lastMessage?.content,
      room.recipient?.username,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
});

const selectedRoom = computed(() => {
  if (!selectedRoomId.value) return null;
  return rooms.value.find((room) => Number(room.id) === Number(selectedRoomId.value)) || null;
});

const selectedRoomName = computed(() => {
  return selectedRoom.value?.displayName || selectedRoom.value?.name || "当前会话";
});

const selectedRoomSummary = computed(() => {
  const room = selectedRoom.value;
  if (!room) return "正在加载会话信息";
  if (room.type === "private") return "一对一私信会话";
  if (room.isPublic) return room.description || "公开聊天室";
  return room.description || `${room.memberCount || 0} 位成员`;
});

const selectedRoomTypeLabel = computed(() => {
  const room = selectedRoom.value;
  if (!room) return "未知";
  return roomTypeLabel(room);
});

const authHeaders = () => ({
  Authorization: `Bearer ${useCookie("token").value}`,
});

watch(activeTab, async () => {
  await fetchRooms();
});

watch(
  () => route.query.roomId,
  (roomId) => {
    if (roomId) {
      selectedRoomId.value = Number(roomId);
    }
  },
);

onMounted(async () => {
  if (!userStore.user || !useCookie("token").value) {
    await navigateTo("/login");
    return;
  }

  await fetchRooms();
});

async function fetchRooms() {
  try {
    loading.value = true;
    const endpoint =
      activeTab.value === "public"
        ? "/api/chat/rooms?public=true&type=group"
        : activeTab.value === "private"
          ? "/api/chat/rooms?type=private"
          : "/api/chat/rooms?type=group";
    const response = await $fetch(endpoint, {
      headers: authHeaders(),
    });
    rooms.value = Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("获取会话列表失败:", error);
    ElMessage.error("获取会话列表失败");
  } finally {
    loading.value = false;
  }
}

function switchTab(tabKey) {
  if (activeTab.value === tabKey) return;
  activeTab.value = tabKey;
  searchQuery.value = "";
  closeRoom({ refresh: false });
}

function selectRoom(roomId) {
  selectedRoomId.value = Number(roomId);
  router.replace({ query: { ...route.query, roomId } });
}

function closeRoom(options = {}) {
  selectedRoomId.value = null;
  const nextQuery = { ...route.query };
  delete nextQuery.roomId;
  router.replace({ query: nextQuery });
  if (options.refresh !== false) fetchRooms();
}

async function createGroupRoom() {
  if (!newGroup.name.trim() || creating.value) return;

  try {
    creating.value = true;
    const response = await $fetch("/api/chat/rooms", {
      method: "POST",
      body: {
        name: newGroup.name.trim(),
        description: newGroup.description.trim(),
        type: "group",
        isPublic: newGroup.isPublic,
      },
      headers: authHeaders(),
    });

    const wasPublic = newGroup.isPublic;
    ElMessage.success("群聊创建成功");
    showCreateGroupDialog.value = false;
    Object.assign(newGroup, {
      name: "",
      description: "",
      isPublic: false,
    });
    activeTab.value = wasPublic ? "public" : "group";
    await fetchRooms();
    if (response?.id) selectRoom(response.id);
  } catch (error) {
    console.error("创建群聊失败:", error);
    ElMessage.error(error?.data?.message || "创建群聊失败");
  } finally {
    creating.value = false;
  }
}

async function handleDeleteRoom(roomId) {
  try {
    await $fetch(`/api/chat/rooms/${roomId}/delete`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    await fetchRooms();
    closeRoom();
    ElMessage.success("聊天室删除成功");
  } catch (error) {
    console.error("删除聊天室失败:", error);
    ElMessage.error("删除聊天室失败");
  }
}

function lastMessageText(room) {
  if (room.lastMessage?.content) return room.lastMessage.content;
  if (room.type === "private") return "还没有消息";
  return room.description || `${room.memberCount || 0} 位成员`;
}

function getInitial(name) {
  return String(name || "?").charAt(0).toUpperCase();
}

function roomIcon(room) {
  if (room.type === "private") return "fas fa-user";
  if (room.isPublic) return "fas fa-globe";
  return "fas fa-users";
}

function roomTypeLabel(room) {
  if (room.type === "private") return "私信";
  if (room.isPublic) return "公开聊天室";
  return "群聊";
}

function formatTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60 * 1000) return "刚刚";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
    });
  }
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
</script>
