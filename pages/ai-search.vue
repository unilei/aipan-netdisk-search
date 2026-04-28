<template>
  <div>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex">
      <!-- 左侧聊天列表 -->
      <div
        class="w-0 md:w-72 border-r border-gray-200 dark:border-gray-700 h-screen overflow-y-auto flex-shrink-0 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm transition-all duration-300 transform"
        :class="[
          showSidebar
            ? 'w-3/4 translate-x-0 absolute md:relative z-50'
            : '-translate-x-full md:translate-x-0 md:relative',
        ]">
        <!-- 新建聊天按钮 -->
        <div class="p-4">
          <button @click="createNewChat"
            class="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow-md">
            <i class="fas fa-plus text-sm"></i>
            <span class="text-sm font-medium">新建聊天</span>
          </button>
        </div>

        <!-- 聊天历史列表 -->
        <div class="px-3 space-y-4">
          <!-- 今天 -->
          <div v-if="todayChats.length > 0" class="space-y-1">
            <div class="px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              今天
            </div>
            <button v-for="chat in todayChats" :key="chat.id" @click="selectChat(chat)"
              class="w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 group"
              :class="[
                currentChatId === chat.id
                  ? 'bg-gray-100 dark:bg-gray-700/50'
                  : '',
              ]">
              <div class="flex items-center space-x-3">
                <i class="fas fa-message text-gray-400 dark:text-gray-500 text-sm"></i>
                <div
                  class="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  {{ chat.title }}
                </div>
              </div>
            </button>
          </div>

          <!-- 昨天 -->
          <div v-if="yesterdayChats.length > 0" class="space-y-1">
            <div class="px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              昨天
            </div>
            <button v-for="chat in yesterdayChats" :key="chat.id" @click="selectChat(chat)"
              class="w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 group"
              :class="[
                currentChatId === chat.id
                  ? 'bg-gray-100 dark:bg-gray-700/50'
                  : '',
              ]">
              <div class="flex items-center space-x-3">
                <i class="fas fa-message text-gray-400 dark:text-gray-500 text-sm"></i>
                <div
                  class="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  {{ chat.title }}
                </div>
              </div>
            </button>
          </div>

          <!-- 更早 -->
          <div v-if="olderChats.length > 0" class="space-y-1">
            <div class="px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              更早
            </div>
            <button v-for="chat in olderChats" :key="chat.id" @click="selectChat(chat)"
              class="w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 group"
              :class="[
                currentChatId === chat.id
                  ? 'bg-gray-100 dark:bg-gray-700/50'
                  : '',
              ]">
              <div class="flex items-center space-x-3">
                <i class="fas fa-message text-gray-400 dark:text-gray-500 text-sm"></i>
                <div
                  class="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  {{ chat.title }}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- 遮罩层 -->
      <div v-if="showSidebar" class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" @click="showSidebar = false">
      </div>

      <!-- 主聊天区域 -->
      <div class="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div class="flex-1 overflow-hidden">
          <div class="h-full flex flex-col">
            <!-- 顶部导航 -->
            <div
              class="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm">
              <div class="flex items-center space-x-4">
                <!-- 移动端菜单按钮 -->
                <button class="md:hidden p-2" @click="showSidebar = true">
                  <i class="fas fa-bars text-gray-600 dark:text-gray-300"></i>
                </button>
                <a class="flex items-center space-x-2" href="/">
                  <img src="/logo.png" alt="Logo" class="w-6 h-6 md:w-8 md:h-8" />
                  <span
                    class="text-base md:text-lg font-semibold bg-linear-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">AI
                    爱盼网盘小助手</span>
                </a>
              </div>
              <div class="flex items-center space-x-4">
                <!-- 群二维码 -->
                <GroupQrCode v-if="shouldShowInHeader" variant="header" />
                
                <button
                  class="p-2 md:p-2.5 rounded-lg transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-300 dark:hover:bg-gray-700/80"
                  @click="
                    colorMode.preference =
                    colorMode.preference === 'dark' ? 'light' : 'dark'
                    ">
                  <i v-if="colorMode.preference === 'dark'"
                    class="fa-solid fa-sun transition-transform duration-300 hover:rotate-90"></i>
                  <i v-else class="fa-solid fa-moon transition-transform duration-300 hover:rotate-90"></i>
                </button>
              </div>
            </div>

            <!-- 聊天历史区域 -->
            <div class="flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6" id="chat-container">
              <!-- 群二维码显示（在第一条AI消息前） -->
              <GroupQrCode v-if="shouldShowInSearchResults && messages.length > 1" 
                           variant="search-result" />
              
              <template v-for="(msg, index) in messages" :key="index">
                <!-- AI 消息 -->
                <div v-if="msg.type === 'ai'" class="flex items-start space-x-2 md:space-x-4 w-full md:max-w-4xl">
                  <div
                    class="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
                    <i class="fas fa-robot text-white text-xs md:text-sm"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div
                      class="bg-white dark:bg-gray-800 rounded-2xl p-3 md:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                      <p v-if="msg.loading"
                        class="text-gray-700 dark:text-gray-300 flex items-center text-xs md:text-sm leading-relaxed break-words">
                        <i class="fas fa-spinner fa-spin mr-2"></i>
                        {{ msg.content }}
                      </p>
                      <p v-else class="text-gray-700 dark:text-gray-300 text-xs md:text-sm leading-relaxed break-words">
                        {{ msg.content }}
                      </p>

                      <!-- 搜索结果列表 -->
                      <div v-if="msg.content === '以下是搜索到的资源：'" class="mt-3 md:mt-4">
                        <disk-info-list :redirectStatus="false" :sources="msg.sources"
                          :skeleton-loading="skeletonLoading" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 用户消息 -->
                <div v-else class="flex items-start space-x-2 md:space-x-4 justify-end w-full md:max-w-4xl ml-auto">
                  <div class="flex-1 min-w-0">
                    <div
                      class="bg-linear-to-r from-blue-500 to-blue-600 rounded-2xl p-3 md:p-4 shadow-sm ml-12 md:ml-0">
                      <p class="text-white text-xs md:text-sm leading-relaxed break-words">
                        {{ msg.content }}
                      </p>
                    </div>
                  </div>
                  <div
                    class="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow-sm flex-shrink-0">
                    <i class="fas fa-user text-gray-600 dark:text-gray-300 text-xs md:text-sm"></i>
                  </div>
                </div>
              </template>
            </div>

            <!-- 输入区域 -->
            <div
              class="p-3 md:p-6 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
              <div class="max-w-5xl mx-auto">
                <div class="relative">
                  <el-input v-model="message" type="textarea" :rows="2" placeholder="输入你的问题..." resize="none"
                    class="chat-input" @keydown.enter.prevent="handleSend" />
                  <div class="absolute bottom-2 md:bottom-3 right-2 md:right-3 flex items-center space-x-2">
                    <el-button type="primary" :icon="Search" @click="handleSend" class="search-btn"
                      :disabled="!message.trim()">
                      发送
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速滚动按钮 -->
    <div class="fixed right-4 md:right-8 bottom-32 flex flex-col gap-3 z-50">
      <button @click="scrollToTop"
        class="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110 active:scale-95 border border-gray-200 dark:border-gray-700">
        <i class="fas fa-arrow-up group-hover:animate-bounce"></i>
      </button>
      <button @click="scrollToBottom"
        class="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110 active:scale-95 border border-gray-200 dark:border-gray-700">
        <i class="fas fa-arrow-down group-hover:animate-bounce"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "custom"
});
import { ref, onMounted, computed } from "vue";
import { Search } from "@element-plus/icons-vue";
import DiskInfoList from "~/components/diskInfoList.vue";
import GroupQrCode from "~/components/GroupQrCode.vue";
import sourcesApiEndpoints from "~/assets/vod/clouddrive.json";
import { badWords } from "~/utils/sensitiveWords";
import { useGroupQrConfig } from "~/composables/useGroupQrConfig";

// SEO配置
useHead({
  title: 'AI 搜索 - 爱盼迷',
  meta: [
    { name: 'description', content: '爱盼迷 AI 智能搜索助手，通过 AI 对话式搜索网盘资源，智能理解你的需求并返回精准结果。' },
  ]
})

const colorMode = useColorMode()
const { shouldShowInHeader, shouldShowInSearchResults, getConfig } = useGroupQrConfig()

const message = ref("");
const messages = ref([
  {
    type: "ai",
    content:
      "Hi, 我是 AI 助手。我可以帮助你搜索网盘资源，请输入你想搜索的内容。",
  },
]);

// 聊天历史管理
const currentChatId = ref(null);
const chats = ref([]);

// 按时间分组的聊天列表
const todayChats = computed(() => {
  const today = new Date().setHours(0, 0, 0, 0);
  return chats.value.filter(
    (chat) => new Date(chat.createdAt).setHours(0, 0, 0, 0) === today
  );
});

const yesterdayChats = computed(() => {
  const today = new Date().setHours(0, 0, 0, 0);
  const yesterday = today - 24 * 60 * 60 * 1000;
  return chats.value.filter(
    (chat) => new Date(chat.createdAt).setHours(0, 0, 0, 0) === yesterday
  );
});

const olderChats = computed(() => {
  const yesterday = new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000;
  return chats.value.filter(
    (chat) => new Date(chat.createdAt).setHours(0, 0, 0, 0) < yesterday
  );
});

// 创建新聊天
const createNewChat = () => {
  const newChat = {
    id: Date.now().toString(),
    title: "新对话",
    createdAt: new Date().toISOString(),
    messages: [],
  };
  chats.value.unshift(newChat);
  selectChat(newChat);
  saveChatsToStorage();
};

// 选择聊天
const selectChat = (chat) => {
  currentChatId.value = chat.id;
  messages.value =
    chat.messages.length > 0
      ? chat.messages
      : [
        {
          type: "ai",
          content:
            "Hi, 我是 AI 助手。我可以帮助你搜索网盘资源，请输入你想搜索的内容。",
        },
      ];
};

// 保存聊天记录到本地存储
const saveChatsToStorage = () => {
  localStorage.setItem("aiChats", JSON.stringify(chats.value));
};

// 从本地存储加载聊天记录
const loadChatsFromStorage = () => {
  const savedChats = localStorage.getItem("aiChats");
  if (savedChats) {
    chats.value = JSON.parse(savedChats);
    if (chats.value.length > 0) {
      selectChat(chats.value[0]);
    }
  }
};

// 在组件挂载时加载聊天记录
onMounted(() => {
  loadChatsFromStorage();
  // 初始化群二维码配置
  getConfig();
});

// 搜索相关状态
const sources = ref([]);
const skeletonLoading = ref(false);
const loadingProgress = ref({
  total: 0,
  completed: 0,
  isLoading: false,
});

// 处理单个API的搜索
const handleSingleSearch = async (item, messageValue) => {
  try {
    const res = await $fetch(item.api, {
      method: "POST",
      body: {
        name: messageValue,
      },
    });

    if (res.list && res.list.length) {
      // 更新搜索结果消息
      const currentMessage = messages.value[messages.value.length - 1];
      if (!currentMessage.sources) {
        currentMessage.sources = [];
      }
      currentMessage.sources.push(...res.list);
      currentMessage.content = "以下是搜索到的资源：";
      currentMessage.loading = false;
    }
  } catch (err) {
    console.error(`Error fetching from ${item.api}:`, err);
  } finally {
    loadingProgress.value.completed++;
    // 如果所有API都请求完成，并且没有找到任何资源，显示未找到的消息
    if (loadingProgress.value.completed >= loadingProgress.value.total) {
      loadingProgress.value.isLoading = false;
      const currentMessage = messages.value[messages.value.length - 1];
      if (!currentMessage.sources || currentMessage.sources.length === 0) {
        currentMessage.content = "抱歉，未找到相关资源。";
        currentMessage.loading = false;
      }

      // 更新当前聊天的消息
      const currentChat = chats.value.find(
        (chat) => chat.id === currentChatId.value
      );
      if (currentChat) {
        currentChat.messages = messages.value;
        currentChat.title = messageValue;
        saveChatsToStorage();
      }
    }
  }
};

// 处理搜索
const handleSearch = async () => {
  if (badWords.includes(message.value.trim())) {
    ElMessage.error("请勿输入敏感词");
    return;
  }
  const messageValue = message.value.trim();
  message.value = "";
  loadingProgress.value = {
    total: sourcesApiEndpoints.length,
    completed: 0,
    isLoading: true,
  };

  // 添加用户消息
  const userMessage = {
    type: "user",
    content: messageValue,
  };
  messages.value.push(userMessage);

  // 添加AI思考消息
  const loadingMessage = {
    type: "ai",
    content: "正在搜索中，请稍候...",
    loading: true,
    sources: []
  };
  messages.value.push(loadingMessage);

  await nextTick();
  scrollToBottom();

  try {
    // 并行发起所有API请求，但结果会立即显示
    await Promise.all(
      sourcesApiEndpoints.map((item) => handleSingleSearch(item, messageValue))
    );
  } catch (error) {
    console.error("搜索过程中出现错误:", error);
    messages.value[messages.value.length - 1] = {
      type: "ai",
      content: "搜索过程中出现错误，请稍后重试。",
      loading: false,
    };
  }
};

const handleSend = () => {
  if (!message.value.trim()) return;
  handleSearch();
};

// 滚动功能
const scrollToTop = () => {
  const chatContainer = document.getElementById("chat-container");
  if (chatContainer) {
    chatContainer.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
};

const scrollToBottom = () => {
  const chatContainer = document.getElementById("chat-container");
  if (chatContainer) {
    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: "smooth",
    });
  }
};

// 添加侧边栏状态控制
const showSidebar = ref(false);
</script>

<style scoped>
@import "tailwindcss" reference;

.chat-input :deep(.el-textarea__inner) {
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1rem;
  padding-right: 6rem;
  resize: none;
  font-size: 0.875rem;
  line-height: 1.5;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.dark .chat-input :deep(.el-textarea__inner) {
  background-color: #1a1a1a;
  border-color: #374151;
  color: #e5e7eb;
}

.chat-input :deep(.el-textarea__inner:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.search-btn {
  @apply bg-linear-to-r from-blue-500 to-blue-600 border-none rounded-lg px-6 py-2.5 hover:from-blue-600 hover:to-blue-700 text-sm font-medium;
}

.search-btn:disabled {
  @apply opacity-50 cursor-not-allowed from-gray-400 to-gray-500;
}

/* 移动端样式调整 */
@media (max-width: 768px) {
  .chat-input :deep(.el-textarea__inner) {
    font-size: 0.875rem;
    padding: 0.75rem;
    padding-right: 4.5rem;
    min-height: 80px !important;
    height: 80px !important;
  }

  .search-btn {
    @apply px-3 py-1.5 text-xs;
    height: auto !important;
    min-height: 32px;
  }

  .search-btn :deep(.el-icon) {
    font-size: 14px;
  }

  /* 修复移动端输入框底部间距 */
  .el-textarea {
    margin-bottom: 0 !important;
  }

  /* 优化移动端的滚动体验 */
  #chat-container {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
  }
}

/* 处理 iPhone 底部安全区域 */
@supports (padding: max(0px)) {
  .p-3.md\:p-6.bg-white\/80 {
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
  }
}
</style>
