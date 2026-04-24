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
              type="success"
              plain
              @click="handleOpenSearchIndexDialog"
            >
              ES索引内容
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
      <div class="bg-white rounded-lg shadow-sm">
        <el-table :data="resources" v-loading="loading" style="width: 100%">
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

    <!-- ES索引内容对话框 -->
    <el-dialog
      v-model="searchIndexDialogVisible"
      title="用户资源 ES 索引内容"
      width="90%"
      destroy-on-close
      @open="fetchSearchIndexResources"
    >
      <div class="space-y-4">
        <el-alert
          type="info"
          show-icon
          :closable="false"
          title="这里展示的是 Elasticsearch 中已发布用户投稿的索引文档"
          description="ES 只索引 UserResource 且 status=published 的投稿；网盘管理中的 Resource 不在这里展示。"
        />

        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <el-input
              v-model="searchIndexQuery"
              placeholder="搜索ES文档名称、描述或类型"
              class="w-80"
              clearable
              @clear="handleSearchIndexSearch"
              @keyup.enter="handleSearchIndexSearch"
            >
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="handleSearchIndexSearch">
              搜索
            </el-button>
            <el-button @click="fetchSearchIndexResources">刷新</el-button>
          </div>
          <el-button
            type="warning"
            :loading="reindexing"
            @click="handleReindexSearchIndex"
          >
            reset=true 重建索引
          </el-button>
        </div>

        <el-table
          :data="searchIndexResources"
          v-loading="searchIndexLoading"
          max-height="520"
          style="width: 100%"
        >
          <el-table-column label="ES文档ID" prop="documentId" width="180" />
          <el-table-column label="资源ID" prop="resourceId" width="90" />
          <el-table-column
            label="资源名称"
            prop="name"
            min-width="260"
            show-overflow-tooltip
          />
          <el-table-column label="类型" prop="typeName" width="120" />
          <el-table-column label="投稿人" prop="creatorUsername" width="120" />
          <el-table-column label="链接数" width="80">
            <template #default="{ row }">
              {{ Array.isArray(row.links) ? row.links.length : 0 }}
            </template>
          </el-table-column>
          <el-table-column label="更新时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.updatedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="handleViewSearchIndexResource(row)"
              >
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="flex justify-end">
          <el-pagination
            v-model:current-page="searchIndexCurrentPage"
            v-model:page-size="searchIndexPageSize"
            :total="searchIndexTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSearchIndexSizeChange"
            @current-change="handleSearchIndexCurrentChange"
          />
        </div>
      </div>
    </el-dialog>

    <!-- ES文档详情对话框 -->
    <el-dialog
      v-model="searchIndexDetailVisible"
      title="ES文档详情"
      width="680px"
    >
      <div v-if="selectedSearchIndexResource" class="space-y-4">
        <div>
          <label class="text-gray-500">ES文档ID</label>
          <p class="text-gray-900 mt-1">
            {{ selectedSearchIndexResource.documentId }}
          </p>
        </div>
        <div>
          <label class="text-gray-500">资源名称</label>
          <p class="text-gray-900 mt-1">
            {{ selectedSearchIndexResource.name }}
          </p>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-gray-500">资源ID</label>
            <p class="text-gray-900 mt-1">
              {{ selectedSearchIndexResource.resourceId }}
            </p>
          </div>
          <div>
            <label class="text-gray-500">类型</label>
            <p class="text-gray-900 mt-1">
              {{ selectedSearchIndexResource.typeName || "-" }}
            </p>
          </div>
          <div>
            <label class="text-gray-500">投稿人</label>
            <p class="text-gray-900 mt-1">
              {{ selectedSearchIndexResource.creatorUsername || "-" }}
            </p>
          </div>
          <div>
            <label class="text-gray-500">更新时间</label>
            <p class="text-gray-900 mt-1">
              {{ formatDate(selectedSearchIndexResource.updatedAt) }}
            </p>
          </div>
        </div>
        <div>
          <label class="text-gray-500">资源描述</label>
          <p class="text-gray-900 mt-1 whitespace-pre-wrap">
            {{ selectedSearchIndexResource.description || "-" }}
          </p>
        </div>
        <div>
          <label class="text-gray-500">索引链接</label>
          <div class="mt-2 space-y-2">
            <div
              v-for="(link, index) in selectedSearchIndexResource.links || []"
              :key="`${link.service || 'UNKNOWN'}-${link.link}-${index}`"
              class="rounded border border-gray-200 p-3"
            >
              <div class="text-sm text-gray-500">
                {{ link.service || "UNKNOWN" }}
              </div>
              <el-link type="primary" :href="link.link" target="_blank">
                {{ link.link }}
              </el-link>
              <div v-if="link.pwd" class="text-sm text-gray-500 mt-1">
                提取码：{{ link.pwd }}
              </div>
            </div>
            <el-empty
              v-if="!selectedSearchIndexResource.links?.length"
              description="暂无链接"
            />
          </div>
        </div>
        <div>
          <label class="text-gray-500">原始ES文档</label>
          <pre
            class="mt-2 max-h-64 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-700"
          >{{ JSON.stringify(selectedSearchIndexResource, null, 2) }}</pre>
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
const searchIndexDialogVisible = ref(false);
const searchIndexDetailVisible = ref(false);
const searchIndexLoading = ref(false);
const reindexing = ref(false);
const searchIndexResources = ref([]);
const searchIndexCurrentPage = ref(1);
const searchIndexPageSize = ref(20);
const searchIndexTotal = ref(0);
const searchIndexQuery = ref("");
const selectedSearchIndexResource = ref(null);

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

// 获取ES索引内容
const fetchSearchIndexResources = async () => {
  if (!searchIndexDialogVisible.value) {
    return;
  }

  searchIndexLoading.value = true;
  try {
    const params = new URLSearchParams({
      page: searchIndexCurrentPage.value.toString(),
      pageSize: searchIndexPageSize.value.toString(),
    });

    if (searchIndexQuery.value) {
      params.append("search", searchIndexQuery.value);
    }

    const response = await $fetch(
      `/api/admin/user-resources/search?${params.toString()}`,
      {
        method: "GET",
        headers: {
          authorization: "Bearer " + useCookie("token").value,
        },
      }
    );

    searchIndexResources.value = response.data || [];
    searchIndexTotal.value = response.pagination?.total || 0;
  } catch (error) {
    console.error("Failed to fetch search index resources:", error);
    ElMessage.error(error?.data?.message || "获取ES索引内容失败");
  } finally {
    searchIndexLoading.value = false;
  }
};

const handleOpenSearchIndexDialog = () => {
  searchIndexDialogVisible.value = true;
};

const handleSearchIndexSearch = () => {
  searchIndexCurrentPage.value = 1;
  fetchSearchIndexResources();
};

const handleSearchIndexSizeChange = (val) => {
  searchIndexPageSize.value = val;
  fetchSearchIndexResources();
};

const handleSearchIndexCurrentChange = (val) => {
  searchIndexCurrentPage.value = val;
  fetchSearchIndexResources();
};

const handleViewSearchIndexResource = (resource) => {
  selectedSearchIndexResource.value = resource;
  searchIndexDetailVisible.value = true;
};

const handleReindexSearchIndex = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要删除并重建用户资源ES索引吗？该操作只处理已发布的用户投稿。",
      "确认重建ES索引",
      {
        confirmButtonText: "确定重建",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    reindexing.value = true;
    const response = await $fetch("/api/admin/user-resources/search/reindex", {
      method: "POST",
      body: { reset: true },
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });

    const result = response.data || {};
    ElMessage.success(
      `重建完成：indexed=${result.indexed || 0}, failed=${result.failed || 0}, total=${result.total || 0}`
    );
    await fetchSearchIndexResources();
  } catch (error) {
    if (error !== "cancel") {
      console.error("Failed to reindex search index:", error);
      ElMessage.error(error?.data?.message || "重建ES索引失败");
    }
  } finally {
    reindexing.value = false;
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
  fetchResources();
});
</script>
