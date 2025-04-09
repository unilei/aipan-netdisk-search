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

      <div class="flex gap-3">
        <button
          @click="showInviteDrawer = true"
          class="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition duration-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          v-if="
            roomInfo &&
            !roomInfo.isPublic &&
            roomInfo.creator &&
            roomInfo.creator.id === props.currentUserId &&
            roomInfo.type === 'group'
          "
          title="邀请用户"
        >
          <i class="fas fa-user-plus text-lg w-5 text-center"></i>
        </button>
        <button
          @click="showMembersDrawer = true"
          class="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition duration-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          v-if="roomInfo?.type === 'group'"
          title="查看成员"
        >
          <i class="fas fa-users text-lg w-5 text-center"></i>
        </button>
        <!-- 添加删除聊天室按钮 -->
        <button
          @click="confirmDeleteRoom"
          class="text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition duration-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          v-if="
            roomInfo &&
            roomInfo.creator &&
            roomInfo.creator.id === props.currentUserId
          "
          title="删除聊天室"
        >
          <i class="fas fa-trash-alt text-lg w-5 text-center"></i>
        </button>
        <button
          @click="$emit('leave')"
          class="text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition duration-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          title="关闭聊天"
        >
          <i class="fas fa-times text-lg w-5 text-center"></i>
        </button>
      </div>
    </div>

    <!-- 聊天消息区域 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="messagesContainer">
      <div v-if="messagesLoading" class="flex justify-center py-6">
        <i
          class="fas fa-circle-notch fa-spin text-2xl text-blue-500 opacity-80"
        ></i>
      </div>

      <div
        v-else-if="messages.length === 0"
        class="flex flex-col items-center justify-center h-full text-gray-500 py-12"
      >
        <i
          class="fas fa-comment-alt text-5xl mb-4 text-gray-300 dark:text-gray-600"
        ></i>
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
        <i class="fas fa-times"></i>
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
          class="px-4 py-2 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-200 flex items-center justify-center"
          :disabled="sending || !newMessage.trim()"
        >
          <i
            v-if="sending"
            class="fas fa-circle-notch fa-spin mr-1 text-base"
          ></i>
          <i v-else class="fas fa-paper-plane mr-1 text-base"></i>
          <span class="text-sm font-medium">发送</span>
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

    <!-- 邀请用户抽屉 -->
    <ClientOnly>
      <el-drawer
        v-model="showInviteDrawer"
        direction="rtl"
        size="300px"
        title="邀请用户加入"
      >
        <div class="p-4 h-full flex flex-col">
          <div v-if="loadingInviteUsers" class="flex justify-center py-8">
            <i
              class="fas fa-circle-notch fa-spin text-2xl text-blue-500 opacity-80"
            ></i>
          </div>
          <div
            v-else-if="availableUsers.length === 0"
            class="text-center py-8 text-gray-500"
          >
            <i
              class="fas fa-user-search text-5xl mb-4 text-gray-300 dark:text-gray-600"
            ></i>
            <p>没有可邀请的用户</p>
          </div>
          <div v-else class="flex-1 overflow-y-auto">
            <div class="mb-4">
              <input
                v-model="inviteSearchQuery"
                type="text"
                placeholder="搜索用户..."
                class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div class="space-y-2 flex-1">
              <div
                v-for="user in filteredAvailableUsers"
                :key="user.id"
                class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div class="flex items-center">
                  <div
                    class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium"
                  >
                    {{ user.username.charAt(0).toUpperCase() }}
                  </div>
                  <div class="ml-3">
                    <p class="font-medium">{{ user.username }}</p>
                  </div>
                </div>
                <button
                  @click="inviteUser(user.id)"
                  class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition duration-200 flex items-center"
                  :disabled="invitingUser === user.id"
                >
                  <i
                    v-if="invitingUser === user.id"
                    class="fas fa-circle-notch fa-spin mr-1.5 text-sm"
                  ></i>
                  <span>邀请</span>
                </button>
              </div>
              <!-- 加载更多按钮 -->
              <div v-if="hasMoreUsers" class="py-3 text-center">
                <button
                  @click="loadMoreUsers"
                  class="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-200"
                  :disabled="loadingMoreUsers"
                >
                  <i
                    v-if="loadingMoreUsers"
                    class="fas fa-circle-notch fa-spin mr-1.5 text-sm"
                  ></i>
                  <span>{{ loadingMoreUsers ? "加载中..." : "加载更多" }}</span>
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

const emit = defineEmits(["leave", "delete-room"]);

// 聊天室信息
const roomInfo = ref(null);
const loading = ref(true);
const members = ref([]);

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
