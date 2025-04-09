<template>
  <div class="flex flex-col h-full">
    <!-- 聊天室头部 -->
    <div class="p-4 border-b flex justify-between items-center">
      <div v-if="loading">
        <div
          class="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        ></div>
      </div>
      <div v-else class="flex items-center">
        <h2 class="text-lg font-semibold">
          {{ roomInfo?.displayName || roomInfo?.name }}
        </h2>
        <span
          v-if="roomInfo?.type === 'group'"
          class="ml-2 text-sm text-gray-500"
        >
          ({{ roomInfo?.members?.length || 0 }}人)
        </span>
      </div>

      <div class="flex gap-2">
        <button
          @click="showMembersDrawer = true"
          class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          v-if="roomInfo?.type === 'group'"
        >
          <i class="i-carbon-user-multiple text-xl"></i>
        </button>
        <button
          @click="$emit('leave')"
          class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <i class="i-carbon-close text-xl"></i>
        </button>
      </div>
    </div>

    <!-- 聊天消息区域 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="messagesContainer">
      <div v-if="messagesLoading" class="flex justify-center py-4">
        <i class="i-carbon-circle-dash animate-spin text-2xl"></i>
      </div>

      <div
        v-else-if="messages.length === 0"
        class="flex flex-col items-center justify-center h-full text-gray-500"
      >
        <i class="i-carbon-chat-launch text-4xl mb-2"></i>
        <p>还没有消息，发送第一条消息开始聊天吧！</p>
      </div>

      <template v-else>
        <button
          v-if="hasMoreMessages"
          @click="loadMoreMessages"
          class="mx-auto block text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          :disabled="loadingMore"
        >
          {{ loadingMore ? "加载中..." : "加载更多消息" }}
        </button>

        <ChatMessage
          v-for="message in messages"
          :key="message.id"
          :message="message"
          :currentUserId="currentUserId"
          @reply="replyToMessage"
        />
      </template>
    </div>

    <!-- 回复信息提示 -->
    <div
      v-if="replyTo"
      class="px-4 py-2 bg-gray-100 dark:bg-gray-700 flex justify-between items-center"
    >
      <div class="flex items-center text-sm">
        <span class="text-gray-500 mr-2">回复</span>
        <span class="font-medium">{{ replyTo.user.username }}:</span>
        <span class="ml-2 text-gray-600 dark:text-gray-400 truncate max-w-md">{{
          replyTo.content
        }}</span>
      </div>
      <button @click="replyTo = null" class="text-gray-500 hover:text-gray-700">
        <i class="i-carbon-close"></i>
      </button>
    </div>

    <!-- 正在输入提示 -->
    <div v-if="someoneTyping" class="px-4 py-1 text-xs text-gray-500 italic">
      {{ typingUser }} 正在输入...
    </div>

    <!-- 消息输入区域 -->
    <div class="p-4 border-t">
      <div class="flex items-end gap-2">
        <textarea
          v-model="newMessage"
          ref="inputElement"
          class="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 resize-none"
          placeholder="输入消息..."
          rows="2"
          @keydown.enter.exact.prevent="sendMessage"
          @input="handleTyping"
        ></textarea>

        <button
          @click="sendMessage"
          class="px-4 py-2 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
          :disabled="sending || !newMessage.trim()"
        >
          <i v-if="sending" class="i-carbon-circle-dash animate-spin"></i>
          <i v-else class="i-carbon-send"></i>
        </button>
      </div>
    </div>

    <!-- 成员列表抽屉 -->
    <ClientOnly>
      <el-drawer
        v-model="showMembersDrawer"
        direction="rtl"
        size="300px"
        title="聊天室成员"
      >
        <div class="p-4 h-full">
          <div v-if="!roomInfo" class="py-4 text-center text-gray-500">
            加载中...
          </div>

          <div
            v-else-if="!roomInfo.members?.length"
            class="py-4 text-center text-gray-500"
          >
            没有成员
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="member in roomInfo.members"
              :key="member.id"
              class="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div
                class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3"
              >
                <span class="text-sm">{{ member.username.charAt(0) }}</span>
              </div>
              <div>
                <p class="font-medium">{{ member.username }}</p>
                <p class="text-xs text-gray-500">
                  {{ member.chatRole === "admin" ? "管理员" : "成员" }}
                  {{ member.id === roomInfo.creator.id ? "(创建者)" : "" }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </el-drawer>
    </ClientOnly>
  </div>
</template>

<script setup>
import { ElMessage } from "element-plus";
import { useSocketIo } from "~/composables/useSocketIo";
import { useUserStore } from "~/stores/user";

// 获取用户信息
const userStore = useUserStore();

const props = defineProps({
  roomId: {
    type: [Number, String],
    required: true,
  },
});

const emit = defineEmits(["leave"]);

const {
  initSocket,
  joinRoom,
  leaveRoom,
  sendMessage: socketSendMessage,
  sendTypingStatus,
} = useSocketIo();

// 聊天室状态
const loading = ref(true);
const roomInfo = ref(null);
const messagesLoading = ref(true);
const messages = ref([]);
const hasMoreMessages = ref(true);
const loadingMore = ref(false);
const sending = ref(false);
const newMessage = ref("");
const replyTo = ref(null);
const messagesContainer = ref(null);
const inputElement = ref(null);
const currentUserId = computed(() => userStore.user?.id);
const socket = ref(null);

// WebSocket状态
const someoneTyping = ref(false);
const typingUser = ref("");
const typingTimeout = ref(null);
const userTypingStatus = ref(false);
const typingThrottleTimeout = ref(null);

// 成员列表抽屉
const showMembersDrawer = ref(false);

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

// 初始化
onMounted(() => {
  // 初始化WebSocket
  socket.value = initSocket();
  if (socket.value) {
    // 监听WebSocket事件
    setupSocketListeners();
  }
});

// 在组件卸载时清理
onBeforeUnmount(() => {
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
  const socketInstance = socket.value;
  if (!socketInstance) return;

  // 接收消息
  socketInstance.on("receive_message", (message) => {
    // 如果是自己发的消息，已经在发送时处理了
    if (message.userId === currentUserId.value) {
      sending.value = false;
    }

    // 避免重复添加消息
    const exists = messages.value.some((m) => m.id === message.id);
    if (!exists) {
      messages.value.push(message);

      // 如果不是自己发的消息，并且已经滚动到底部，则保持滚动到底部
      if (message.userId !== currentUserId.value && isScrolledToBottom()) {
        nextTick(() => {
          scrollToBottom();
        });
      }
    }
  });

  // 用户加入聊天室
  socketInstance.on("user_joined", (user) => {
    if (user.userId !== currentUserId.value) {
      ElMessage.info(`${user.username} 加入了聊天室`);
    }
  });

  // 用户离开聊天室
  socketInstance.on("user_left", (user) => {
    if (user.userId !== currentUserId.value) {
      ElMessage.info(`${user.username} 离开了聊天室`);
    }
  });

  // 用户正在输入
  socketInstance.on("user_typing", (data) => {
    if (data.userId === currentUserId.value) return;

    if (data.isTyping) {
      someoneTyping.value = true;
      typingUser.value = data.username;
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

    roomInfo.value = data.value;

    // 如果是私聊，设置显示名称为对方的用户名
    if (data.value.type === "private") {
      const otherUser = data.value.members.find(
        (member) => member.id !== currentUserId.value
      );
      if (otherUser) {
        roomInfo.value.displayName = otherUser.username;
      }
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

    const messageData = {
      roomId: props.roomId,
      content: newMessage.value,
      ...(replyTo.value && { replyToId: replyTo.value.id }),
    };

    // 使用Socket发送
    await socketSendMessage(props.roomId, newMessage.value, replyTo.value?.id);

    // 清空输入和回复状态
    newMessage.value = "";
    replyTo.value = null;

    // 发送停止输入信号
    sendTypingIndicator(false);

    // 滚动到底部
    nextTick(() => {
      scrollToBottom();
    });
  } catch (error) {
    console.error("发送消息失败:", error);
    ElMessage.error("发送消息失败");
  } finally {
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
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// 检查是否滚动到底部
function isScrolledToBottom() {
  if (!messagesContainer.value) return false;

  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  // 考虑一点误差范围
  return scrollHeight - scrollTop - clientHeight < 10;
}
</script>
