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
                <el-icon class="mr-1">
                  <House />
                </el-icon>
                后台管理面板
              </nuxt-link>
              <span>/</span>
              <span class="text-gray-900">论坛管理</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">论坛回复管理</h1>
            <p class="text-gray-500 mt-1">审核和管理论坛回复内容</p>
          </div>
          <div class="flex items-center space-x-4">
            <el-button
              @click="() => navigateTo('/admin/forum/topics')"
              class="flex items-center"
            >
              <el-icon class="mr-1">
                <Document />
              </el-icon>
              主题管理
            </el-button>
            <el-button
              @click="() => navigateTo('/admin/forum/categories')"
              class="flex items-center"
            >
              <el-icon class="mr-1">
                <Menu />
              </el-icon>
              分类管理
            </el-button>
            <el-button
              @click="() => navigateTo('/admin/dashboard')"
              class="flex items-center"
            >
              <el-icon class="mr-1">
                <ArrowLeft />
              </el-icon>
              返回面板
            </el-button>
          </div>
        </div>
      </div>

      <!-- 过滤器区域 -->
      <div class="bg-white rounded-lg p-6 shadow-sm">
        <div class="flex flex-wrap items-center gap-4">
          <div class="w-64">
            <el-select
              v-model="filters.status"
              placeholder="审核状态"
              clearable
              class="w-full"
            >
              <el-option label="全部" value="" />
              <el-option label="待审核" value="pending" />
              <el-option label="已批准" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
          </div>
          <div class="w-64">
            <el-select
              v-model="filters.topicId"
              placeholder="选择主题"
              clearable
              class="w-full"
            >
              <el-option label="全部主题" value="" />
              <el-option
                v-for="topic in topics"
                :key="topic.id"
                :label="topic.title"
                :value="topic.id"
              />
            </el-select>
          </div>
          <div class="flex-1">
            <el-input
              v-model="filters.keyword"
              placeholder="搜索回复内容"
              clearable
              class="w-full"
              @keyup.enter="loadPosts"
            />
          </div>
          <el-button
            type="primary"
            @click="loadPosts"
            class="flex items-center"
          >
            <el-icon class="mr-1">
              <Search />
            </el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilters" class="flex items-center">
            <el-icon class="mr-1">
              <Refresh />
            </el-icon>
            重置
          </el-button>
        </div>
      </div>

      <!-- 表格区域 -->
      <div class="bg-white rounded-lg p-6 shadow-sm">
        <div v-if="loading" class="py-10">
          <el-skeleton :rows="5" animated />
        </div>

        <div v-else-if="!posts.length" class="text-center py-10">
          <el-empty description="暂无回复" />
          <p class="mt-4 text-gray-500">当前筛选条件下没有找到回复</p>
        </div>

        <div v-else>
          <el-table :data="posts" style="width: 100%" border>
            <el-table-column type="expand">
              <template #default="props">
                <div class="p-4 bg-gray-50">
                  <div class="mb-4">
                    <h3 class="font-medium text-gray-700 mb-2">回复内容：</h3>
                    <div
                      class="bg-white p-3 rounded border border-gray-200 text-sm text-gray-700 prose-sm max-w-none"
                      v-html="formatContent(props.row.content)"
                    ></div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="id" label="ID" width="80" align="center" />
            <el-table-column
              prop="topic.title"
              label="所属主题"
              min-width="200"
              show-overflow-tooltip
            >
              <template #default="scope">
                <a
                  @click="navigateToTopic(scope.row.topicId)"
                  class="cursor-pointer text-blue-500 hover:text-blue-700"
                >
                  {{ scope.row.topic?.title || `主题 #${scope.row.topicId}` }}
                </a>
              </template>
            </el-table-column>
            <el-table-column
              prop="content"
              label="回复内容"
              min-width="200"
              show-overflow-tooltip
            >
              <template #default="scope">
                {{ truncateContent(scope.row.content, 50) }}
              </template>
            </el-table-column>
            <el-table-column prop="author.username" label="作者" width="120" />
            <el-table-column prop="createdAt" label="发布时间" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="status"
              label="状态"
              width="100"
              align="center"
            >
              <template #default="scope">
                <el-tag v-if="scope.row.status === 'pending'" type="warning"
                  >待审核</el-tag
                >
                <el-tag
                  v-else-if="scope.row.status === 'approved'"
                  type="success"
                  >已批准</el-tag
                >
                <el-tag
                  v-else-if="scope.row.status === 'rejected'"
                  type="danger"
                  >已拒绝</el-tag
                >
                <el-tag v-else type="info">未知</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="250" fixed="right">
              <template #default="scope">
                <div class="flex space-x-2">
                  <el-button
                    v-if="scope.row.status === 'pending'"
                    size="small"
                    type="success"
                    @click="approvePost(scope.row)"
                  >
                    <el-icon class="mr-1">
                      <Check />
                    </el-icon>
                    批准
                  </el-button>
                  <el-button
                    v-if="scope.row.status === 'pending'"
                    size="small"
                    type="danger"
                    @click="rejectPost(scope.row)"
                  >
                    <el-icon class="mr-1">
                      <Close />
                    </el-icon>
                    拒绝
                  </el-button>
                  <el-button
                    size="small"
                    type="primary"
                    @click="editPost(scope.row)"
                  >
                    <el-icon class="mr-1">
                      <Edit />
                    </el-icon>
                    编辑
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="confirmDelete(scope.row)"
                  >
                    <el-icon class="mr-1">
                      <Delete />
                    </el-icon>
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="flex justify-end mt-5">
            <el-pagination
              v-model:current-page="pagination.current"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="pagination.total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑回复对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑回复"
      width="700px"
      destroy-on-close
    >
      <el-form
        v-if="form"
        :model="form"
        label-width="80px"
        :rules="rules"
        ref="formRef"
      >
        <el-form-item label="主题" prop="topicId">
          <el-select
            v-model="form.topicId"
            placeholder="选择主题"
            class="w-full"
            disabled
          >
            <el-option
              v-for="topic in topics"
              :key="topic.id"
              :label="topic.title"
              :value="topic.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请输入回复内容"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="form.status"
            placeholder="选择状态"
            class="w-full"
          >
            <el-option label="待审核" value="pending" />
            <el-option label="已批准" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end space-x-3">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting"
            >保存</el-button
          >
        </div>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="400px">
      <p>确定要删除这条回复吗？</p>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" :disabled="deleting" @click="deletePost">
          {{ deleting ? "删除中..." : "确认删除" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import {
  House,
  Search,
  Refresh,
  ArrowLeft,
  Menu,
  Document,
  Edit,
  Delete,
  Check,
  Close,
} from "@element-plus/icons-vue";
import { ElMessageBox, ElMessage } from "element-plus";
import { format } from "date-fns";
import { marked } from "marked";

definePageMeta({
  layout: 'admin',
  middleware: ["admin"],
});

// 初始化数据
const loading = ref(false);
const posts = ref([]);
const topics = ref([]);
const filters = reactive({
  status: "",
  topicId: "",
  keyword: "",
});
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});

// 对话框状态
const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const selectedPost = ref(null);
const submitting = ref(false);
const deleting = ref(false);

// 表单数据和验证规则
const formRef = ref(null);
const form = reactive({
  id: null,
  content: "",
  topicId: null,
  status: "pending",
});
const rules = {
  content: [{ required: true, message: "请输入回复内容", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
};

// 加载主题列表（用于筛选器）
async function loadTopics() {
  try {
    const token = useCookie("token").value;
    const { data } = await useFetch("/api/admin/forum/topics/list", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (data.value?.success) {
      topics.value = data.value.data;
    } else {
      console.error("加载主题列表失败");
    }
  } catch (error) {
    console.error("加载主题列表失败:", error);
  }
}

// 加载回复列表
async function loadPosts() {
  loading.value = true;
  try {
    const query = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };

    if (filters.status) query.status = filters.status;
    if (filters.topicId) query.topicId = filters.topicId;
    if (filters.keyword) query.keyword = filters.keyword;

    const token = useCookie("token").value;
    const response = await $fetch("/api/admin/forum/posts", {
      method: "GET",
      params: query,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.success) {
      posts.value = response.data.posts;
      pagination.total = response.data.pagination.total;
    } else {
      ElMessage.error(response.message || "加载回复失败");
    }
  } catch (error) {
    console.error("加载回复失败:", error);
    ElMessage.error("加载回复失败");
  } finally {
    loading.value = false;
  }
}

// 重置筛选条件
function resetFilters() {
  filters.status = "";
  filters.topicId = "";
  filters.keyword = "";
  pagination.current = 1;
  loadPosts();
}

// 分页事件处理
function handleSizeChange(size) {
  pagination.pageSize = size;
  loadPosts();
}

function handleCurrentChange(page) {
  pagination.current = page;
  loadPosts();
}

// 导航到主题
function navigateToTopic(topicId) {
  const topic = topics.value.find((t) => t.id === topicId);
  if (topic && topic.slug) {
    navigateTo(`/forum/topic/${topic.slug}`);
  } else {
    ElMessage.warning("无法找到主题链接");
  }
}

// 编辑回复
function editPost(post) {
  form.id = post.id;
  form.content = post.content;
  form.topicId = post.topicId;
  form.status = post.status || "pending";

  editDialogVisible.value = true;
}

// 提交表单
async function submitForm() {
  if (submitting.value) return;

  if (!formRef.value) {
    ElMessage.error("表单验证失败");
    return;
  }

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      const token = useCookie("token").value;
      const response = await $fetch(`/api/admin/forum/posts/${form.id}`, {
        method: "PUT",
        body: {
          content: form.content,
          status: form.status,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.success) {
        ElMessage.success("回复更新成功");
        editDialogVisible.value = false;
        loadPosts();
      } else {
        ElMessage.error(response.message || "更新失败");
      }
    } catch (error) {
      console.error("更新回复失败:", error);
      ElMessage.error("更新回复失败");
    } finally {
      submitting.value = false;
    }
  });
}

// 批准回复
async function approvePost(post) {
  try {
    const token = useCookie("token").value;
    const response = await $fetch(`/api/admin/forum/posts/${post.id}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.success) {
      ElMessage.success("回复已批准");
      loadPosts();
    } else {
      ElMessage.error(response.message || "批准失败");
    }
  } catch (error) {
    console.error("批准回复失败:", error);
    ElMessage.error("批准回复失败");
  }
}

// 拒绝回复
async function rejectPost(post) {
  try {
    const token = useCookie("token").value;
    const response = await $fetch(`/api/admin/forum/posts/${post.id}/reject`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.success) {
      ElMessage.success("回复已拒绝");
      loadPosts();
    } else {
      ElMessage.error(response.message || "拒绝失败");
    }
  } catch (error) {
    console.error("拒绝回复失败:", error);
    ElMessage.error("拒绝回复失败");
  }
}

// 删除前确认
function confirmDelete(post) {
  selectedPost.value = post;
  deleteDialogVisible.value = true;
}

// 删除回复
async function deletePost() {
  if (!selectedPost.value || deleting.value) return;

  deleting.value = true;
  try {
    const token = useCookie("token").value;
    const response = await $fetch(
      `/api/admin/forum/posts/${selectedPost.value.id}/delete`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.success) {
      ElMessage.success("回复已删除");
      deleteDialogVisible.value = false;
      loadPosts();
    } else {
      ElMessage.error(response.message || "删除失败");
    }
  } catch (error) {
    console.error("删除回复失败:", error);
    ElMessage.error("删除回复失败");
  } finally {
    deleting.value = false;
  }
}

// 格式化日期
function formatDate(date) {
  if (!date) return "未知";
  try {
    return format(new Date(date), "yyyy-MM-dd HH:mm:ss");
  } catch (e) {
    return "日期格式错误";
  }
}

// 截断内容
function truncateContent(content, maxLength) {
  if (!content) return "";
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "...";
}

// 格式化内容（将Markdown转为HTML）
function formatContent(content) {
  if (!content) return "";
  try {
    return marked(content);
  } catch (e) {
    return content;
  }
}

// 初始化页面
onMounted(async () => {
  await loadTopics();
  await loadPosts();
});
</script>

<style>
.prose {
  @apply text-gray-900 leading-normal break-words;
}

.prose p {
  @apply my-4;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4 {
  @apply font-bold my-6 text-gray-900;
}

.prose h1 {
  @apply text-2xl;
}

.prose h2 {
  @apply text-xl;
}

.prose h3 {
  @apply text-lg;
}

.prose ul,
.prose ol {
  @apply pl-8 my-4;
}

.prose ul {
  @apply list-disc;
}

.prose ol {
  @apply list-decimal;
}

.prose pre {
  @apply bg-gray-100 p-4 rounded;
}

.prose code {
  @apply bg-gray-100 px-1 py-0.5 rounded text-sm;
}

.prose blockquote {
  @apply border-l-4 border-gray-300 pl-4 py-2 my-4 text-gray-600 italic;
}

.prose a {
  @apply text-blue-600 hover:text-blue-800 hover:underline;
}
</style>
