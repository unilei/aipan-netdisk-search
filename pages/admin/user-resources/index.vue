<template>
  <div class="admin-page-bg">
    <div class="mx-auto space-y-6">
      <!-- 头部区域 -->
      <div class="admin-card-bg rounded-lg p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">用户资源管理</h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">管理用户上传的资源内容</p>
          </div>
          <div class="flex items-center space-x-4">
            <el-button
              type="warning"
              plain
              @click="autoReviewDialogVisible = true"
            >
              自动审核
            </el-button>
            <el-button
              type="success"
              plain
              :loading="autoReviewQueueLoading"
              @click="handleEnqueueAutoReview"
            >
              历史投稿入队
            </el-button>
            <el-button
              type="primary"
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

      <!-- 搜索和筛选区域 -->
      <div class="admin-card-bg rounded-lg p-6 shadow-sm">
        <div class="flex items-center space-x-4">
          <el-input
            v-model="searchQuery"
            placeholder="搜索资源名称或描述"
            class="w-64"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon>
                <Search />
              </el-icon>
            </template>
          </el-input>
          <el-select
            v-model="statusFilter"
            placeholder="状态筛选"
            class="w-32"
            clearable
            @change="handleSearch"
          >
            <el-option label="待审核" value="pending" />
            <el-option label="已发布" value="published" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </div>
      </div>

      <!-- 资源列表 -->
      <div v-loading="loading" class="bg-white rounded-lg shadow-sm">
        <el-table :data="resources" style="width: 100%">
          <el-table-column label="资源名称" prop="name" min-width="200" />
          <el-table-column label="资源类型" prop="type.name" width="120" />
          <el-table-column label="上传者" width="120">
            <template #default="{ row }">
              {{ row.creator.username }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="上传时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="flex items-center space-x-2">
                <el-button
                  v-if="row.status === 'pending'"
                  type="success"
                  size="small"
                  @click="handleUpdateStatus(row.id, 'published')"
                >
                  通过
                </el-button>
                <el-button
                  v-if="row.status === 'pending'"
                  type="danger"
                  size="small"
                  @click="handleUpdateStatus(row.id, 'rejected')"
                >
                  拒绝
                </el-button>
                <el-button
                  v-if="row.status !== 'pending'"
                  type="warning"
                  size="small"
                  @click="handleUpdateStatus(row.id, 'pending')"
                >
                  重置状态
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  @click="handleViewResource(row)"
                >
                  查看
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="flex justify-end p-4">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>

    <!-- 资源详情对话框 -->
    <el-dialog v-model="dialogVisible" title="资源详情" width="600px">
      <div v-if="selectedResource" class="space-y-4">
        <div>
          <label class="text-gray-500">资源名称</label>
          <p class="text-gray-900 mt-1">{{ selectedResource.name }}</p>
        </div>
        <div>
          <label class="text-gray-500">资源类型</label>
          <p class="text-gray-900 mt-1">{{ selectedResource.type.name }}</p>
        </div>
        <div>
          <label class="text-gray-500">资源链接</label>
          <p class="text-gray-900 mt-1">
            <el-link
              type="primary"
              :href="selectedResource.links"
              target="_blank"
            >
              {{ selectedResource.links }}
            </el-link>
          </p>
        </div>
        <div>
          <label class="text-gray-500">资源描述</label>
          <p class="text-gray-900 mt-1">{{ selectedResource.description }}</p>
        </div>
        <div>
          <label class="text-gray-500">上传者</label>
          <p class="text-gray-900 mt-1">
            {{ selectedResource.creator.username }}
          </p>
        </div>
        <div>
          <label class="text-gray-500">上传时间</label>
          <p class="text-gray-900 mt-1">
            {{ formatDate(selectedResource.createdAt) }}
          </p>
        </div>
        <div>
          <label class="text-gray-500">状态</label>
          <p class="text-gray-900 mt-1">
            <el-tag :type="getStatusType(selectedResource.status)">
              {{ getStatusText(selectedResource.status) }}
            </el-tag>
          </p>
        </div>
      </div>
    </el-dialog>

    <!-- 自动审核对话框 -->
    <el-dialog v-model="autoReviewDialogVisible" title="自动审核用户资源" width="860px">
      <div class="space-y-4">
        <el-alert
          type="warning"
          show-icon
          :closable="false"
          title="自动审核只处理待审核资源"
          description="新提交或编辑的资源会自动加入后台队列；此处适合预检查或手动批量处理历史待审核资源。"
        />

        <el-form label-width="150px">
          <el-form-item label="单次处理数量">
            <el-input-number
              v-model="autoReviewForm.limit"
              :min="1"
              :max="100"
              :step="5"
            />
          </el-form-item>
          <el-form-item label="检查链接是否存在">
            <el-switch v-model="autoReviewForm.requireReachable" />
            <span class="ml-3 text-sm text-gray-500">
              网盘拒绝自动访问或超时时会进入人工复核，不会自动通过。
            </span>
          </el-form-item>
          <el-form-item label="拒绝不合格资源">
            <el-switch v-model="autoReviewForm.rejectInvalid" />
            <span class="ml-3 text-sm text-gray-500">
              关闭时只自动通过合格资源，不合格资源保持待审核。
            </span>
          </el-form-item>
        </el-form>

        <div class="flex justify-end gap-3">
          <el-button :loading="autoReviewLoading" @click="handleAutoReview(true)">
            仅预检查
          </el-button>
          <el-button
            type="primary"
            :loading="autoReviewLoading"
            @click="handleAutoReview(false)"
          >
            执行自动审核
          </el-button>
        </div>

        <div v-if="autoReviewResult" class="rounded border border-gray-200 p-4">
          <div class="mb-3 flex flex-wrap gap-4 text-sm text-gray-700">
            <span>检查：{{ autoReviewResult.checked }}</span>
            <span>通过：{{ autoReviewResult.approved }}</span>
            <span>拒绝：{{ autoReviewResult.rejected }}</span>
            <span>跳过：{{ autoReviewResult.skipped }}</span>
            <span>失败：{{ autoReviewResult.failed }}</span>
          </div>

          <el-table
            :data="autoReviewResult.results || []"
            max-height="360"
            style="width: 100%"
          >
            <el-table-column label="资源ID" prop="resourceId" width="90" />
            <el-table-column label="资源名称" prop="name" min-width="220" show-overflow-tooltip />
            <el-table-column label="动作" width="120">
              <template #default="{ row }">
                <el-tag :type="getAutoReviewActionType(row.action)">
                  {{ getAutoReviewActionText(row.action) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="原因" min-width="320" show-overflow-tooltip>
              <template #default="{ row }">
                {{ getAutoReviewIssueText(row) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ArrowLeft, Search } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
});

const route = useRoute();

// 状态
const loading = ref(false);
const resources = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const searchQuery = ref("");
const statusFilter = ref("");
const dialogVisible = ref(false);
const selectedResource = ref(null);
const autoReviewDialogVisible = ref(false);
const autoReviewLoading = ref(false);
const autoReviewQueueLoading = ref(false);
const autoReviewResult = ref(null);
const autoReviewForm = reactive({
  limit: 20,
  requireReachable: true,
  rejectInvalid: false,
});
const statusQueryValues = new Set(["pending", "published", "rejected"]);

const applyRouteStatusFilter = () => {
  const status = Array.isArray(route.query.status)
    ? route.query.status[0]
    : route.query.status;

  statusFilter.value = statusQueryValues.has(status) ? status : "";
  currentPage.value = 1;
};

// 获取资源列表
const fetchResources = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString(),
    });

    if (searchQuery.value) {
      params.append("search", searchQuery.value);
    }

    if (statusFilter.value) {
      params.append("status", statusFilter.value);
    }

    const response = await $fetch(
      `/api/admin/user-resources/get?${params.toString()}`,
      {
        method: "GET",
        headers: {
          authorization: "Bearer " + useCookie("token").value,
        },
      }
    );

    resources.value = response.data;
    total.value = response.pagination.total;
  } catch (error) {
    console.error("Failed to fetch resources:", error);
    ElMessage.error("获取资源列表失败");
  } finally {
    loading.value = false;
  }
};

const handleAutoReview = async (dryRun) => {
  try {
    if (!dryRun) {
      await ElMessageBox.confirm(
        autoReviewForm.rejectInvalid
          ? "确定要执行自动审核吗？合格资源会通过，不合格资源会被拒绝。"
          : "确定要执行自动审核吗？合格资源会通过，其它资源保持待审核。",
        "确认自动审核",
        {
          confirmButtonText: "确定执行",
          cancelButtonText: "取消",
          type: "warning",
        }
      );
    }

    autoReviewLoading.value = true;
    const response = await $fetch("/api/admin/user-resources/auto-review", {
      method: "POST",
      body: {
        dryRun,
        approveValid: true,
        rejectInvalid: autoReviewForm.rejectInvalid,
        requireReachable: autoReviewForm.requireReachable,
        limit: autoReviewForm.limit,
      },
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });

    autoReviewResult.value = response.data;
    ElMessage.success(response.msg || (dryRun ? "预检查完成" : "自动审核完成"));

    if (!dryRun) {
      await fetchResources();
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("Failed to auto review user resources:", error);
      ElMessage.error(error?.data?.message || "自动审核失败");
    }
  } finally {
    autoReviewLoading.value = false;
  }
};

const handleEnqueueAutoReview = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要把当前历史待审核资源加入自动审核队列吗？系统会按队列并发上限后台处理；每条结果都会发站内通知，邮件按用户邮箱限流发送。",
      "确认历史投稿入队",
      {
        confirmButtonText: "加入队列",
        cancelButtonText: "取消",
        type: "success",
      }
    );

    autoReviewQueueLoading.value = true;
    const response = await $fetch("/api/admin/user-resources/auto-review/enqueue", {
      method: "POST",
      body: {
        limit: 5000,
        notifyUser: true,
        emailEnabled: true,
        approveValid: true,
        rejectInvalid: autoReviewForm.rejectInvalid,
        requireReachable: autoReviewForm.requireReachable,
      },
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });

    const data = response.data || {};
    ElMessage.success(
      `已入队 ${data.queued || 0} 条，重复跳过 ${data.duplicate || 0} 条，失败 ${data.failed || 0} 条`
    );
    await fetchResources();
  } catch (error) {
    if (error !== "cancel") {
      console.error("Failed to enqueue historical user resources:", error);
      ElMessage.error(error?.data?.message || "历史投稿入队失败");
    }
  } finally {
    autoReviewQueueLoading.value = false;
  }
};

// 更新资源状态
const handleUpdateStatus = async (id, status) => {
  try {
    await ElMessageBox.confirm(
      `确定要${
        status === "published"
          ? "通过"
          : status === "rejected"
          ? "拒绝"
          : "重置"
      }这个资源吗？`,
      "确认操作",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type:
          status === "published"
            ? "success"
            : status === "rejected"
            ? "warning"
            : "info",
      }
    );

    await $fetch(`/api/admin/user-resources/${id}/status`, {
      method: "PUT",
      body: { status },
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });

    ElMessage.success("状态更新成功");
    fetchResources();
  } catch (error) {
    if (error !== "cancel") {
      console.error("Failed to update resource status:", error);
      ElMessage.error("状态更新失败");
    }
  }
};

// 查看资源详情
const handleViewResource = (resource) => {
  selectedResource.value = resource;
  dialogVisible.value = true;
};

// 搜索和筛选
const handleSearch = () => {
  currentPage.value = 1;
  fetchResources();
};

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchResources();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchResources();
};

// 工具函数
const getStatusType = (status) => {
  switch (status) {
    case "published":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "warning";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "published":
      return "已发布";
    case "rejected":
      return "已拒绝";
    default:
      return "待审核";
  }
};

const getAutoReviewActionType = (action) => {
  switch (action) {
    case "approved":
    case "would_approve":
      return "success";
    case "rejected":
    case "would_reject":
      return "danger";
    case "failed":
      return "danger";
    default:
      return "warning";
  }
};

const getAutoReviewActionText = (action) => {
  switch (action) {
    case "approved":
      return "已通过";
    case "rejected":
      return "已拒绝";
    case "would_approve":
      return "将通过";
    case "would_reject":
      return "将拒绝";
    case "failed":
      return "失败";
    case "would_skip":
      return "将跳过";
    default:
      return "已跳过";
  }
};

const getAutoReviewIssueText = (row) => {
  if (row.error) {
    return row.error;
  }

  const failedChecks = (row.checks || []).filter((check) => !check.passed);
  if (!failedChecks.length) {
    return row.canAutoApprove ? "符合自动通过条件" : "无异常";
  }

  return failedChecks.map((check) => check.message).join("；");
};

const formatDate = (date) => {
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 初始加载
onMounted(() => {
  applyRouteStatusFilter();
  fetchResources();
});

watch(
  () => route.query.status,
  () => {
    applyRouteStatusFilter();
    fetchResources();
  }
);
</script>
