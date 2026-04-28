<template>
  <div class="admin-page-bg">
    <div class="mx-auto space-y-6">
      <div class="admin-card-bg rounded-lg p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              ES索引内容
            </h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">
              查看 Elasticsearch 中已发布用户资源投稿的索引文档
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <el-button
              type="warning"
              :loading="reindexing"
              @click="handleReindexSearchIndex"
            >
              reset=true 重建索引
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

      <div class="admin-card-bg rounded-lg p-6 shadow-sm space-y-4">
        <el-alert
          type="info"
          show-icon
          :closable="false"
          title="ES 只索引 UserResource 且 status=published 的投稿"
          description="网盘管理中的 Resource 不在这里展示；这里用于排查前台 /api/sources/local 的用户投稿搜索结果。"
        />

        <div class="flex flex-wrap items-center gap-3">
          <el-input
            v-model="searchQuery"
            placeholder="搜索ES文档名称、描述或类型"
            class="w-80"
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
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="fetchSearchIndexResources">刷新</el-button>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm">
        <el-table
          :data="resources"
          v-loading="loading"
          style="width: 100%"
        >
          <el-table-column label="ES文档ID" prop="documentId" width="180" />
          <el-table-column label="资源ID" prop="resourceId" width="90" />
          <el-table-column
            label="资源名称"
            prop="name"
            min-width="280"
            show-overflow-tooltip
          />
          <el-table-column label="类型" prop="typeName" width="130" />
          <el-table-column label="投稿人" prop="creatorUsername" width="130" />
          <el-table-column label="链接数" width="90">
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
                @click="handleViewResource(row)"
              >
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

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

    <el-dialog v-model="detailVisible" title="ES文档详情" width="680px">
      <div v-if="selectedResource" class="space-y-4">
        <div>
          <label class="text-gray-500">ES文档ID</label>
          <p class="text-gray-900 mt-1">{{ selectedResource.documentId }}</p>
        </div>
        <div>
          <label class="text-gray-500">资源名称</label>
          <p class="text-gray-900 mt-1">{{ selectedResource.name }}</p>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-gray-500">资源ID</label>
            <p class="text-gray-900 mt-1">{{ selectedResource.resourceId }}</p>
          </div>
          <div>
            <label class="text-gray-500">类型</label>
            <p class="text-gray-900 mt-1">
              {{ selectedResource.typeName || "-" }}
            </p>
          </div>
          <div>
            <label class="text-gray-500">投稿人</label>
            <p class="text-gray-900 mt-1">
              {{ selectedResource.creatorUsername || "-" }}
            </p>
          </div>
          <div>
            <label class="text-gray-500">更新时间</label>
            <p class="text-gray-900 mt-1">
              {{ formatDate(selectedResource.updatedAt) }}
            </p>
          </div>
        </div>
        <div>
          <label class="text-gray-500">资源描述</label>
          <p class="text-gray-900 mt-1 whitespace-pre-wrap">
            {{ selectedResource.description || "-" }}
          </p>
        </div>
        <div>
          <label class="text-gray-500">索引链接</label>
          <div class="mt-2 space-y-2">
            <div
              v-for="(link, index) in selectedResource.links || []"
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
              v-if="!selectedResource.links?.length"
              description="暂无链接"
            />
          </div>
        </div>
        <div>
          <label class="text-gray-500">原始ES文档</label>
          <pre
            class="mt-2 max-h-64 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-700"
          >{{ JSON.stringify(selectedResource, null, 2) }}</pre>
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

const loading = ref(false);
const reindexing = ref(false);
const resources = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const searchQuery = ref("");
const detailVisible = ref(false);
const selectedResource = ref(null);

const fetchSearchIndexResources = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString(),
    });

    if (searchQuery.value) {
      params.append("search", searchQuery.value);
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

    resources.value = response.data || [];
    total.value = response.pagination?.total || 0;
  } catch (error) {
    console.error("Failed to fetch search index resources:", error);
    ElMessage.error(error?.data?.message || "获取ES索引内容失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchSearchIndexResources();
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchSearchIndexResources();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchSearchIndexResources();
};

const handleViewResource = (resource) => {
  selectedResource.value = resource;
  detailVisible.value = true;
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

const formatDate = (date) => {
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

onMounted(() => {
  fetchSearchIndexResources();
});
</script>
