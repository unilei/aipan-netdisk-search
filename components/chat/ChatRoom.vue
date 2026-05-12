<template>
  <div class="flex h-full min-h-0 flex-col bg-white dark:bg-slate-900">
    <div class="shrink-0 border-b border-slate-200 bg-white px-3 py-3 dark:border-white/10 dark:bg-slate-900 sm:px-4">
      <div class="flex items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <button
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white lg:hidden"
            type="button"
            aria-label="返回会话列表"
            @click="$emit('leave')"
          >
            <i class="fas fa-arrow-left text-sm"></i>
          </button>

          <div
            v-if="loading"
            class="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-slate-100 dark:bg-white/10"
          ></div>
          <div
            v-else
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
          >
            {{ roomInitial }}
          </div>

          <div v-if="loading" class="min-w-0 flex-1 space-y-2">
            <div class="h-4 w-36 animate-pulse rounded bg-slate-100 dark:bg-white/10"></div>
            <div class="h-3 w-48 animate-pulse rounded bg-slate-100 dark:bg-white/10"></div>
          </div>
          <div v-else class="min-w-0">
            <div class="flex min-w-0 items-center gap-2">
              <h2 class="m-0 truncate text-base font-semibold text-slate-950 dark:text-white">
                {{ roomTitle }}
              </h2>
              <span class="hidden shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300 sm:inline-flex">
                {{ roomTypeLabel }}
              </span>
            </div>
            <p class="m-0 mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {{ roomSubtitle }}
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1">
          <button
            v-if="
              roomInfo &&
              !roomInfo.isPublic &&
              isRoomCreator &&
              roomInfo.type === 'group'
            "
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-blue-300"
            type="button"
            title="邀请用户"
            @click="showInviteDrawer = true"
          >
            <i class="fas fa-user-plus text-sm"></i>
          </button>
          <button
            v-if="roomInfo?.type === 'group'"
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-blue-300"
            type="button"
            title="查看成员"
            @click="showMembersDrawer = true"
          >
            <i class="fas fa-users text-sm"></i>
          </button>
          <button
            v-if="
              roomInfo &&
              isRoomCreator
            "
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
            type="button"
            title="删除聊天室"
            @click="confirmDeleteRoom"
          >
            <i class="fas fa-trash-alt text-sm"></i>
          </button>
          <button
            class="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white lg:inline-flex"
            type="button"
            title="关闭聊天"
            @click="$emit('leave')"
          >
            <i class="fas fa-times text-sm"></i>
          </button>
        </div>
      </div>
    </div>

    <div ref="messagesContainer" class="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-3 py-4 dark:bg-slate-950/40 sm:px-5">
      <div v-if="messagesLoading" class="flex h-full items-center justify-center">
        <div class="inline-flex items-center rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-500 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-white/10">
          <i class="fas fa-circle-notch fa-spin mr-2 text-blue-500"></i>
          加载消息
        </div>
      </div>

      <div
        v-else-if="messages.length === 0"
        class="flex h-full items-center justify-center text-center"
      >
        <div class="max-w-[300px]">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10">
            <i class="fas fa-comment-alt text-xl"></i>
          </div>
          <p class="m-0 mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">还没有消息</p>
          <p class="m-0 mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">发送第一条消息后，历史记录会保存在这里。</p>
        </div>
      </div>

      <div v-else class="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <button
          v-if="hasMoreMessages"
          class="mx-auto inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
          type="button"
          :disabled="loadingMore"
          @click="loadMoreMessages"
        >
          <i v-if="loadingMore" class="fas fa-circle-notch fa-spin mr-2"></i>
          {{ loadingMore ? "加载中" : "加载更多消息" }}
        </button>

        <ChatMessage
          v-for="message in messages"
          :key="message.id"
          :message="message"
          :currentUserId="currentUserId"
          @reply="replyToMessage"
        />
      </div>
    </div>

    <div class="shrink-0 border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900 sm:p-4">
      <div class="mx-auto w-full max-w-3xl">
        <div
          v-if="replyTo"
          class="mb-2 flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm dark:border-blue-500/20 dark:bg-blue-500/10"
        >
          <div class="min-w-0">
            <div class="text-xs font-semibold text-blue-700 dark:text-blue-300">
              回复 {{ replyTo.user?.username || "用户" }}
            </div>
            <div class="mt-0.5 truncate text-xs text-blue-900/80 dark:text-blue-100/80">
              {{ replyTo.content }}
            </div>
          </div>
          <button
            class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-blue-700 transition hover:bg-blue-100 dark:text-blue-200 dark:hover:bg-blue-500/20"
            type="button"
            aria-label="取消回复"
            @click="resetReply"
          >
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>

        <div v-if="someoneTyping" class="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          {{ typingUser }} 正在输入...
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-2 shadow-sm shadow-slate-200/60 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:border-white/10 dark:bg-slate-950 dark:shadow-none dark:focus-within:ring-blue-500/20">
          <textarea
            ref="inputElement"
            v-model="newMessage"
            class="block max-h-32 min-h-11 w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            placeholder="输入消息..."
            rows="2"
            @keydown.enter.exact.prevent="sendMessage"
            @input="handleTyping"
          ></textarea>

          <div class="mt-1 flex items-center justify-end">
            <button
              class="inline-flex h-9 items-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
              type="button"
              :disabled="sending || !newMessage.trim()"
              @click="sendMessage"
            >
              <i v-if="sending" class="fas fa-circle-notch fa-spin mr-2 text-xs"></i>
              <i v-else class="fas fa-paper-plane mr-2 text-xs"></i>
              发送
            </button>
          </div>
        </div>
      </div>
    </div>

    <ClientOnly>
      <el-drawer
        v-model="showMembersDrawer"
        direction="rtl"
        size="320px"
        title="聊天室成员"
      >
        <div class="h-full p-4">
          <div v-if="!roomInfo" class="py-4 text-center text-sm text-slate-500">
            加载中...
          </div>

          <div
            v-else-if="!roomInfo.members?.length"
            class="py-4 text-center text-sm text-slate-500"
          >
            没有成员
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="member in roomInfo.members"
              :key="member.id"
              class="flex items-center rounded-lg border border-slate-200 p-3 dark:border-white/10"
            >
              <div
                class="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200"
              >
                {{ member.username.charAt(0).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <p class="m-0 truncate text-sm font-semibold text-slate-900 dark:text-white">{{ member.username }}</p>
                <p class="m-0 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {{ member.chatRole === "admin" ? "管理员" : "成员" }}
                  {{ Number(member.id) === Number(roomInfo.creator.id) ? "(创建者)" : "" }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </el-drawer>
    </ClientOnly>

    <ClientOnly>
      <el-drawer
        v-model="showInviteDrawer"
        direction="rtl"
        size="340px"
        title="邀请用户加入"
      >
        <div class="flex h-full flex-col p-4">
          <div v-if="loadingInviteUsers" class="flex justify-center py-8">
            <i class="fas fa-circle-notch fa-spin text-2xl text-blue-500"></i>
          </div>
          <div
            v-else-if="availableUsers.length === 0"
            class="py-8 text-center text-sm text-slate-500"
          >
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-white/10">
              <i class="fas fa-user-search text-lg"></i>
            </div>
            <p class="m-0">没有可邀请的用户</p>
          </div>
          <div v-else class="min-h-0 flex-1 overflow-y-auto">
            <div class="mb-4">
              <input
                v-model="inviteSearchQuery"
                type="text"
                placeholder="搜索用户..."
                class="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-500/20"
              />
            </div>
            <div class="space-y-2">
              <div
                v-for="user in filteredAvailableUsers"
                :key="user.id"
                class="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-white/10"
              >
                <div class="flex min-w-0 items-center">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                  >
                    {{ user.username.charAt(0).toUpperCase() }}
                  </div>
                  <div class="ml-3 min-w-0">
                    <p class="m-0 truncate text-sm font-semibold text-slate-900 dark:text-white">{{ user.username }}</p>
                  </div>
                </div>
                <button
                  class="inline-flex h-8 shrink-0 items-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  :disabled="invitingUser === user.id"
                  @click="inviteUser(user.id)"
                >
                  <i v-if="invitingUser === user.id" class="fas fa-circle-notch fa-spin mr-1.5 text-xs"></i>
                  邀请
                </button>
              </div>
              <div v-if="hasMoreUsers" class="py-3 text-center">
                <button
                  class="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/5"
                  type="button"
                  :disabled="loadingMoreUsers"
                  @click="loadMoreUsers"
                >
                  <i v-if="loadingMoreUsers" class="fas fa-circle-notch fa-spin mr-2 text-xs"></i>
                  {{ loadingMoreUsers ? "加载中" : "加载更多" }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </el-drawer>
    </ClientOnly>
  </div>
</template>

<script setup>
import { ElMessage, ElMessageBox } from "element-plus";
import { useSocketIo } from "~/composables/useSocketIo";
import { useUserStore } from "~/stores/user";

// 获取用户信息
const userStore = useUserStore();

const props = defineProps({
  roomId: {
    type: [String, Number],
    required: true,
  },
  currentUserId: {
    type: [String, Number],
    required: true,
  },
});

const emit = defineEmits(["leave", "delete-room", "message-sent"]);

// 聊天室信息
const roomInfo = ref(null);
const loading = ref(true);
const members = ref([]);

const roomTitle = computed(() => {
  return roomInfo.value?.displayName || roomInfo.value?.name || "聊天会话";
});

const roomInitial = computed(() => {
  return String(roomTitle.value || "?").charAt(0).toUpperCase();
});

const roomTypeLabel = computed(() => {
  if (roomInfo.value?.type === "private") return "私信";
  if (roomInfo.value?.isPublic) return "公开聊天室";
  return "群聊";
});

const roomSubtitle = computed(() => {
  if (!roomInfo.value) return "正在加载会话信息";
  if (roomInfo.value.type === "private") return "一对一私信会话";
  const memberCount = roomInfo.value.members?.length || members.value.length || 0;
  return roomInfo.value.isPublic
    ? `${memberCount} 位成员 · 公开可加入`
    : `${memberCount} 位成员 · 仅成员可见`;
});

const isRoomCreator = computed(() => {
  return Number(roomInfo.value?.creator?.id) === Number(props.currentUserId);
});

// 消息相关
const messages = ref([]);
const messagesContainer = ref(null);
const messagesLoading = ref(false);
const loadingMore = ref(false);
const hasMoreMessages = ref(true);

// 输入相关
const newMessage = ref("");
const sending = ref(false);
const inputElement = ref(null);
const replyTo = ref(null);

// Socket.io
const {
  joinRoom,
  sendMessage: socketSendMessage,
  sendTypingStatus,
  leaveRoom,
} = useSocketIo();

// 输入状态
const someoneTyping = ref(false);
const typingUser = ref("");
const typingTimeout = ref(null);
const userTypingStatus = ref(false);
const typingThrottleTimeout = ref(null);

// 成员列表抽屉
const showMembersDrawer = ref(false);

// 邀请用户相关
const showInviteDrawer = ref(false);
const availableUsers = ref([]);
const loadingInviteUsers = ref(false);
const inviteSearchQuery = ref("");
const invitingUser = ref(null);
const currentPage = ref(1);
const pageSize = ref(10);
const hasMoreUsers = ref(true);
const loadingMoreUsers = ref(false);

// 计算过滤后的可邀请用户
const filteredAvailableUsers = computed(() => {
  return availableUsers.value;
});

// 监听搜索框输入，延时搜索
let searchTimeout = null;
watch(inviteSearchQuery, (newValue) => {
  if (searchTimeout) clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    currentPage.value = 1; // 重置页码
    availableUsers.value = []; // 清空用户列表
    fetchAvailableUsers(); // 重新获取
  }, 300);
});

// 监听roomId变化，切换聊天室
watch(
  () => props.roomId,
  async (newId, oldId) => {
    if (newId === oldId) return;

    // 重置状态
    messages.value = [];
    replyTo.value = null;
    hasMoreMessages.value = true;
    messagesLoading.value = true;

    // 如果有Socket连接，离开之前的房间
    if (oldId) {
      leaveRoom(oldId.toString());
    }

    // 加载新聊天室信息
    await Promise.all([fetchRoomInfo(), fetchMessages()]);

    // 加入新的聊天室
    joinRoom(newId.toString());

    // 聚焦输入框
    nextTick(() => {
      if (inputElement.value) {
        inputElement.value.focus();
      }
    });
  },
  { immediate: true }
);

// 监听抽屉显示状态变化
watch(showInviteDrawer, (isVisible) => {
  if (isVisible) {
    // 重置状态并加载用户
    currentPage.value = 1;
    availableUsers.value = [];
    hasMoreUsers.value = true;
    inviteSearchQuery.value = "";
    fetchAvailableUsers();
  }
});

// 初始化
onMounted(() => {
  // 初始化WebSocket
  const socketIo = useSocketIo();
  socketIo.initSocket();

  // 监听WebSocket事件
  setupSocketListeners();
});

// 组件销毁时清理
onUnmounted(() => {
  if (props.roomId) {
    leaveRoom(props.roomId.toString());
  }

  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value);
  }

  if (typingThrottleTimeout.value) {
    clearTimeout(typingThrottleTimeout.value);
  }
});

// 设置WebSocket事件监听
function setupSocketListeners() {
  // 获取socket实例
  const socketIo = useSocketIo();
  const socketInstance = socketIo.getSocket();
  if (!socketInstance) return;

  // 接收消息
  socketInstance.on("receive_message", (message) => {
    // 如果是自己发的消息，已经在发送时处理了
    if (message.userId === props.currentUserId) {
      sending.value = false;

      // 查找并替换临时消息 - 使用更可靠的方式识别临时消息
      // 1. 检查是否有pending状态的临时消息
      // 2. 确认用户ID匹配
      // 3. 内容匹配
      // 4. 如果有replyToId也要匹配
      const tempIndex = messages.value.findIndex(
        (m) =>
          m.pending &&
          m.userId === props.currentUserId &&
          m.content === message.content &&
          ((!m.replyTo && !message.replyToId) ||
            m.replyTo?.id === message.replyToId)
      );

      if (tempIndex !== -1) {
        // 替换临时消息
        messages.value.splice(tempIndex, 1, message);
      } else {
        // 检查是否已存在相同消息（通过ID或内容匹配）
        const exists = messages.value.some(
          (m) =>
            m.id === message.id ||
            (!m.pending &&
              m.userId === message.userId &&
              m.content === message.content)
        );

        if (!exists) {
          messages.value.push(message);
        }
      }
    } else {
      // 避免重复添加消息 - 增强重复检测
      const exists = messages.value.some(
        (m) =>
          m.id === message.id ||
          (!m.pending &&
            m.userId === message.userId &&
            m.content === message.content)
      );

      if (!exists) {
        messages.value.push(message);

        // 如果不是自己发的消息，并且已经滚动到底部，则保持滚动到底部
        if (isScrolledToBottom()) {
          scrollToBottom();
        }
      }
    }
  });

  // 有人正在输入
  socketInstance.on("user_typing", ({ roomId, username, isTyping }) => {
    // 确保是当前聊天室的输入状态和参数有效
    if (!roomId || !props.roomId) return;

    const currentRoomId = String(props.roomId);
    const receivedRoomId = String(roomId);
    if (receivedRoomId !== currentRoomId) return;

    // 确保不是自己的输入状态
    if (username === userStore.user?.username) return;

    if (isTyping) {
      typingUser.value = username;
      someoneTyping.value = true;
    } else {
      someoneTyping.value = false;
    }
  });
}

// 获取聊天室信息
async function fetchRoomInfo() {
  try {
    loading.value = true;
    const { data } = await useFetch(`/api/chat/rooms/${props.roomId}`, {
      headers: {
        Authorization: "Bearer " + userStore.token,
      },
    });

    if (data.value) {
      roomInfo.value = data.value;
      members.value = data.value.members || [];
    }
  } catch (error) {
    console.error("获取聊天室信息失败:", error);
    ElMessage.error("获取聊天室信息失败");
  } finally {
    loading.value = false;
  }
}

// 加载历史消息
async function fetchMessages() {
  try {
    messagesLoading.value = true;

    const { data } = await useFetch(
      `/api/chat/rooms/${props.roomId}/messages`,
      {
        params: {
          limit: 20,
          skip: 0,
        },
        headers: {
          Authorization: "Bearer " + userStore.token,
        },
      }
    );

    if (data.value) {
      messages.value = data.value.reverse(); // 反转消息顺序，最新消息在底部
      hasMoreMessages.value = data.value.length >= 20;

      // 滚动到底部
      nextTick(() => {
        scrollToBottom();
      });
    }
  } catch (error) {
    console.error("加载历史消息失败:", error);
    ElMessage.error("加载历史消息失败");
  } finally {
    messagesLoading.value = false;
  }
}

// 加载更多消息
async function loadMoreMessages() {
  if (loadingMore.value || !hasMoreMessages.value) return;

  try {
    loadingMore.value = true;

    const { data } = await useFetch(
      `/api/chat/rooms/${props.roomId}/messages`,
      {
        params: {
          limit: 20,
          skip: messages.value.length,
        },
        headers: {
          Authorization: "Bearer " + userStore.token,
        },
      }
    );

    if (data.value) {
      // 如果没有足够的消息，认为已经到达历史记录顶部
      if (data.value.length < 20) {
        hasMoreMessages.value = false;
      }

      // 保存当前滚动位置
      const messagesContainer = messagesContainer.value;
      let scrollHeight = messagesContainer.scrollHeight;
      let scrollTop = messagesContainer.scrollTop;

      // 添加新消息到顶部
      messages.value = [...data.value.reverse(), ...messages.value];

      // 恢复滚动位置
      nextTick(() => {
        if (messagesContainer) {
          const newScrollHeight = messagesContainer.scrollHeight;
          const heightDiff = newScrollHeight - scrollHeight;
          messagesContainer.scrollTop = scrollTop + heightDiff;
        }
      });
    }
  } catch (error) {
    console.error("加载更多消息失败:", error);
    ElMessage.error("加载更多消息失败");
  } finally {
    loadingMore.value = false;
  }
}

// 发送消息
async function sendMessage() {
  if (!newMessage.value.trim() || sending.value) return;

  try {
    sending.value = true;

    // 保存当前消息内容和回复ID
    const messageContent = newMessage.value;
    const replyToId = replyTo.value?.id;

    // 立即清空输入框和回复状态，提高响应性
    newMessage.value = "";
    replyTo.value = null;

    // 创建一个临时消息对象显示在UI上
    const tempMessage = {
      id: "temp-" + Date.now(),
      content: messageContent,
      userId: props.currentUserId,
      user: userStore.user,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    // 如果是回复消息，添加完整的回复信息
    if (replyToId) {
      // 在消息列表中查找被回复的消息
      const originalMessage = messages.value.find((m) => m.id === replyToId);
      if (originalMessage) {
        // 复制完整的回复信息，包括user对象
        tempMessage.replyTo = {
          id: originalMessage.id,
          content: originalMessage.content,
          user: originalMessage.user,
        };
      } else {
        // 如果找不到原始消息，至少提供ID防止报错
        tempMessage.replyTo = { id: replyToId };
      }
    }

    // 立即添加到消息列表
    messages.value.push(tempMessage);

    // 立即滚动到底部
    scrollToBottom();

    // 发送停止输入信号
    sendTypingIndicator(false);

    // 使用Socket发送 (异步)
    socketSendMessage(props.roomId, messageContent, replyToId)
      .then(() => {
        // 消息发送成功后的处理
        const index = messages.value.findIndex((m) => m.id === tempMessage.id);
        if (index !== -1) {
          // 移除临时消息的pending状态
          messages.value[index].pending = false;
        }
        emit("message-sent");
      })
      .catch((error) => {
        console.error("发送消息失败:", error);
        ElMessage.error("发送消息失败");

        // 标记临时消息发送失败
        const index = messages.value.findIndex((m) => m.id === tempMessage.id);
        if (index !== -1) {
          messages.value[index].error = true;
        }
      })
      .finally(() => {
        sending.value = false;
      });
  } catch (error) {
    console.error("发送消息处理失败:", error);
    ElMessage.error("发送消息失败");
    sending.value = false;
  }
}

// 回复消息
function replyToMessage(message) {
  replyTo.value = message;

  // 聚焦输入框
  nextTick(() => {
    if (inputElement.value) {
      inputElement.value.focus();
    }
  });
}

// 取消回复
function resetReply() {
  replyTo.value = null;
}

// 处理输入状态
function handleTyping() {
  // 如果用户之前不是正在输入状态
  if (!userTypingStatus.value) {
    // 设置为正在输入
    userTypingStatus.value = true;
    sendTypingIndicator(true);
  }

  // 清除之前的超时
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value);
  }

  // 设置新的超时，2秒后如果没有新的输入则认为停止输入
  typingTimeout.value = setTimeout(() => {
    userTypingStatus.value = false;
    sendTypingIndicator(false);
  }, 2000);
}

// 发送输入状态到服务器（节流处理）
function sendTypingIndicator(isTyping) {
  // 节流处理，300ms内不重复发送
  if (typingThrottleTimeout.value) return;

  sendTypingStatus(props.roomId, isTyping);

  typingThrottleTimeout.value = setTimeout(() => {
    typingThrottleTimeout.value = null;
  }, 300);
}

// 滚动到底部
function scrollToBottom() {
  if (messagesContainer.value) {
    // 使用requestAnimationFrame确保在DOM更新后执行滚动
    requestAnimationFrame(() => {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    });
  }
}

// 检查是否滚动到底部
function isScrolledToBottom() {
  if (!messagesContainer.value) return false;

  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  // 考虑一点误差范围
  return scrollHeight - scrollTop - clientHeight < 10;
}

// 加载可邀请的用户（不在聊天室的用户）
async function fetchAvailableUsers() {
  try {
    loadingInviteUsers.value = true;
    const response = await $fetch(
      `/api/chat/rooms/${props.roomId}/available-users`,
      {
        headers: {
          Authorization: "Bearer " + userStore.token,
        },
        params: {
          page: currentPage.value,
          pageSize: pageSize.value,
          search: inviteSearchQuery.value,
        },
      }
    );

    if (response) {
      // 如果是第一页，直接赋值；否则追加
      if (currentPage.value === 1) {
        availableUsers.value = response.users;
      } else {
        availableUsers.value = [...availableUsers.value, ...response.users];
      }

      // 更新分页信息
      hasMoreUsers.value = response.pagination.hasMore;
    }
  } catch (error) {
    console.error("获取可邀请用户失败:", error);
    ElMessage.error("获取可邀请用户失败");
  } finally {
    loadingInviteUsers.value = false;
  }
}

// 加载更多用户
async function loadMoreUsers() {
  if (loadingMoreUsers.value || !hasMoreUsers.value) return;

  try {
    loadingMoreUsers.value = true;
    currentPage.value++;
    await fetchAvailableUsers();
  } finally {
    loadingMoreUsers.value = false;
  }
}

// 邀请用户加入聊天室
async function inviteUser(userId) {
  try {
    invitingUser.value = userId;

    const response = await $fetch(`/api/chat/rooms/${props.roomId}/invite`, {
      method: "POST",
      body: { userId },
      headers: {
        Authorization: "Bearer " + userStore.token,
      },
    });

    if (response) {
      ElMessage.success("邀请成功");

      // 更新可邀请用户列表
      availableUsers.value = availableUsers.value.filter(
        (user) => user.id !== userId
      );

      // 刷新聊天室信息
      await fetchRoomInfo();
    }
  } catch (error) {
    console.error("邀请用户失败:", error);
    ElMessage.error("邀请用户失败");
  } finally {
    invitingUser.value = null;
  }
}

// 确认删除聊天室
function confirmDeleteRoom() {
  ElMessageBox.confirm("确认删除聊天室？", "删除聊天室", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      deleteRoom();
    })
    .catch(() => {});
}

// 删除聊天室
function deleteRoom() {
  try {
    // 只发出事件，由父组件处理实际的删除操作
    emit("delete-room", props.roomId);
  } catch (error) {
    console.error("删除聊天室失败:", error);
    ElMessage.error("删除失败");
  }
}
</script>
