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
