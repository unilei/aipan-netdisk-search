<template>
  <div class="bg-gray-50">
    <div class="mx-auto space-y-6">
      <!-- 头部区域 -->
      <div class="bg-white rounded-lg p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
              <nuxt-link
                to="/admin/dashboard"
                class="hover:text-primary flex items-center"
              >
                <i class="fas fa-home mr-1"></i>
                后台管理面板
              </nuxt-link>
              <span>/</span>
              <span class="text-gray-900">聊天管理</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">聊天管理</h1>
            <p class="text-gray-500 mt-1">管理所有用户聊天室和聊天记录</p>
          </div>
          <el-button
            @click="navigateTo('/admin/dashboard')"
            class="flex items-center"
          >
            <i class="fas fa-arrow-left mr-1"></i>
            返回面板
          </el-button>
        </div>
      </div>

      <!-- 搜索区域 -->
      <div class="bg-white rounded-lg p-6 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-center gap-4">
          <div class="flex-1 flex items-center space-x-4">
            <el-input
              v-model="filters.search"
              placeholder="搜索聊天室名称或描述..."
              class="!w-80"
              clearable
              @input="debouncedSearch"
              @keyup.enter="getChats"
            >
              <template #prefix>
                <i class="fas fa-search"></i>
              </template>
            </el-input>
            <el-select
              v-model="filters.type"
              placeholder="聊天类型"
              clearable
              class="!w-32"
              @change="getChats"
            >
              <el-option value="group" label="群聊" />
              <el-option value="private" label="私聊" />
            </el-select>
            <el-select
              v-model="filters.isPublic"
              placeholder="可见性"
              clearable
              class="!w-32"
              @change="getChats"
            >
              <el-option :value="true" label="公开" />
              <el-option :value="false" label="私有" />
            </el-select>
            <el-button type="primary" @click="getChats">
              <i class="fas fa-search mr-1"></i>
              搜索
            </el-button>
            <el-button @click="resetFilters"> 重置 </el-button>
          </div>
        </div>
      </div>

      <!-- 聊天室列表 -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <el-table
          v-loading="loading"
          :data="chatRooms"
          style="width: 100%"
          row-key="id"
          header-row-class-name="bg-gray-50"
          :border="true"
          class="mt-4"
        >
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="name" label="聊天室名称" min-width="150">
            <template #default="{ row }">
              <div class="flex items-center">
                <span>{{ row.name }}</span>
                <el-tag
                  v-if="row.isPublic"
                  size="small"
                  type="success"
                  class="ml-2"
                  >公开</el-tag
                >
                <el-tag v-else size="small" type="info" class="ml-2"
                  >私有</el-tag
                >
                <el-tag
                  :type="row.type === 'group' ? 'primary' : 'warning'"
                  size="small"
                  class="ml-2"
                >
                  {{ row.type === "group" ? "群聊" : "私聊" }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200">
            <template #default="{ row }">
              <span>{{ row.description || "无描述" }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="memberCount"
            label="成员数"
            width="100"
            align="center"
          />
          <el-table-column
            prop="messageCount"
            label="消息数"
            width="100"
            align="center"
          />
          <el-table-column
            prop="createdAt"
            label="创建时间"
            width="180"
            align="center"
          >
            <template #default="{ row }">
              {{ formatTime(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="创建者" width="150">
            <template #default="{ row }">
              <div class="flex items-center">
                <el-avatar :size="24" v-if="row.creator?.avatar">
                  <img :src="row.creator.avatar" alt="avatar" />
                </el-avatar>
                <el-avatar :size="24" v-else>
                  <i class="fas fa-user"></i>
                </el-avatar>
                <span class="ml-2">{{ row.creator?.username || "未知" }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            width="220"
            fixed="right"
            align="center"
          >
            <template #default="{ row }">
              <div class="flex space-x-2">
                <el-button
                  size="small"
                  type="primary"
                  @click="viewChatMessages(row)"
                >
                  <i class="fas fa-eye mr-1"></i>
                  查看消息
                </el-button>
                <el-popconfirm
                  title="确定要删除这个聊天室吗？这将同时删除所有消息。"
                  @confirm="deleteChat(row.id)"
                >
                  <template #reference>
                    <el-button size="small" type="danger">
                      <i class="fas fa-trash-alt mr-1"></i>
                      删除
                    </el-button>
                  </template>
                </el-popconfirm>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页器 -->
        <div
          class="mt-6 flex justify-center"
          v-if="!loading && chatRooms.length > 0"
        >
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>

        <!-- 空状态 -->
        <el-empty
          v-if="!loading && chatRooms.length === 0"
          description="暂无聊天室"
        />
      </div>
    </div>

    <!-- 聊天消息对话框 -->
    <el-dialog
      v-model="messagesDialog.visible"
      :title="`${messagesDialog.roomName} - 聊天记录`"
      width="800px"
    >
      <div
        v-loading="messagesDialog.loading"
        class="min-h-[400px] max-h-[600px] overflow-y-auto p-4 bg-gray-50 rounded-lg"
      >
        <template v-if="messagesDialog.messages.length">
          <div
            v-for="message in messagesDialog.messages"
            :key="message.id"
            class="mb-4"
          >
            <div class="flex items-start">
              <el-avatar :size="32" v-if="message.sender?.avatar">
                <img :src="message.sender.avatar" alt="avatar" />
              </el-avatar>
              <el-avatar :size="32" v-else>
                <i class="fas fa-user"></i>
              </el-avatar>
              <div class="ml-3 flex-1">
                <div class="flex items-center">
                  <span class="font-semibold text-gray-900">{{
                    message.sender?.username || "未知用户"
                  }}</span>
                  <span class="ml-2 text-xs text-gray-500">{{
                    formatTime(message.createdAt)
                  }}</span>
                </div>
                <div class="mt-1 p-3 bg-white rounded-lg shadow-sm">
                  <div
                    v-if="message.replyToId"
                    class="mb-2 p-2 bg-gray-100 text-gray-600 text-sm rounded border-l-4 border-gray-300"
                  >
                    <div class="text-xs text-gray-500 mb-1">
                      回复
                      {{ message.replyTo?.sender?.username || "未知用户" }}:
                    </div>
                    {{ message.replyTo?.content || "原消息已删除" }}
                  </div>
                  <div>{{ message.content }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div
          v-else
          class="flex flex-col items-center justify-center h-64 text-gray-500"
        >
          <i class="fas fa-comments text-4xl"></i>
          <p class="mt-4">没有聊天记录</p>
        </div>
      </div>
      <div class="mt-4">
        <el-pagination
          v-model:current-page="messagesDialog.currentPage"
          :page-size="messagesDialog.pageSize"
          :total="messagesDialog.total"
          layout="prev, pager, next"
          @current-change="handleMessagePageChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import { debounce } from "lodash-es";

definePageMeta({
  layout: 'admin',
  middleware: ["admin"],
});

// 聊天室列表数据
const chatRooms = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const filters = reactive({
  search: "",
  type: "",
  isPublic: "",
});

// 聊天记录对话框
const messagesDialog = reactive({
  visible: false,
  roomId: null,
  roomName: "",
  loading: false,
  messages: [],
  currentPage: 1,
  pageSize: 20,
  total: 0,
});

// 创建防抖搜索函数
const debouncedSearch = debounce(() => {
  currentPage.value = 1; // 重置到第一页
  getChats();
}, 300);

// 重置过滤条件
function resetFilters() {
  filters.search = "";
  filters.type = "";
  filters.isPublic = "";
  currentPage.value = 1;
  getChats();
}

// 获取聊天室列表
async function getChats() {
  try {
    loading.value = true;

    // 构建查询参数
    const params = new URLSearchParams();
    params.append("page", currentPage.value);
    params.append("pageSize", pageSize.value);

    if (filters.search) {
      params.append("search", filters.search);
    }

    if (filters.type) {
      params.append("type", filters.type);
    }

    if (filters.isPublic !== "") {
      params.append("isPublic", filters.isPublic);
    }

    const response = await $fetch(
      `/api/admin/chat/rooms?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + useCookie("token").value,
        },
      }
    );

    chatRooms.value = response.data;
    total.value = response.total;
  } catch (error) {
    console.error("获取聊天室列表失败:", error);
    ElMessage.error("获取聊天室列表失败");
  } finally {
    loading.value = false;
  }
}

// 分页处理
function handleSizeChange(val) {
  pageSize.value = val;
  getChats();
}

function handleCurrentChange(val) {
  currentPage.value = val;
  getChats();
}

// 查看聊天记录
async function viewChatMessages(room) {
  messagesDialog.roomId = room.id;
  messagesDialog.roomName = room.name;
  messagesDialog.visible = true;
  messagesDialog.currentPage = 1;
  messagesDialog.messages = [];

  getChatMessages();
}

// 获取聊天消息
async function getChatMessages() {
  try {
    messagesDialog.loading = true;

    const params = new URLSearchParams();
    params.append("page", messagesDialog.currentPage);
    params.append("pageSize", messagesDialog.pageSize);

    const response = await $fetch(
      `/api/admin/chat/rooms/${
        messagesDialog.roomId
      }/messages?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + useCookie("token").value,
        },
      }
    );

    messagesDialog.messages = response.data;
    messagesDialog.total = response.total;
  } catch (error) {
    console.error("获取聊天记录失败:", error);
    ElMessage.error("获取聊天记录失败");
  } finally {
    messagesDialog.loading = false;
  }
}

// 消息分页变化
function handleMessagePageChange(val) {
  messagesDialog.currentPage = val;
  getChatMessages();
}

// 删除聊天室
async function deleteChat(roomId) {
  try {
    await $fetch(`/api/admin/chat/rooms/${roomId}/delete`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + useCookie("token").value,
      },
    });

    ElMessage.success("聊天室删除成功");
    getChats(); // 刷新列表
  } catch (error) {
    console.error("删除聊天室失败:", error);
    ElMessage.error("删除聊天室失败");
  }
}

// 格式化时间
function formatTime(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// 页面加载时获取数据
if (process.client) {
  // 确保在客户端环境下执行
  setTimeout(() => {
    getChats();
  }, 0);
}
</script>

<style scoped>
:deep(.el-table) {
  --el-table-border-color: var(--el-border-color-lighter);
  --el-table-header-bg-color: var(--el-fill-color-light);
}

:deep(.el-table th) {
  font-weight: 600;
  background-color: var(--el-fill-color-light);
}

:deep(.el-button--danger) {
  --el-button-hover-bg-color: var(--el-color-danger-light-3);
  --el-button-hover-border-color: var(--el-color-danger-light-3);
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-border-color) !important;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-border-color-hover) !important;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) !important;
}
</style>
