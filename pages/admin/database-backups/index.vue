<template>
  <div class="admin-page-bg">
    <div class="mx-auto space-y-6">
      <div class="admin-card-bg rounded-lg p-6 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">数据库备份</h1>
            <p class="mt-1 text-gray-500 dark:text-gray-400">
              管理 PostgreSQL 备份文件
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <el-button :icon="Refresh" :loading="loading" @click="fetchBackups">
              刷新
            </el-button>
            <el-button
              type="primary"
              :icon="Upload"
              :loading="backupLoading"
              @click="handleManualBackup"
            >
              立即备份
            </el-button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div class="admin-card-bg rounded-lg p-6 shadow-sm">
          <h3 class="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">备份数量</h3>
          <div class="text-3xl font-bold text-blue-600">{{ backups.length }}</div>
        </div>
        <div class="admin-card-bg rounded-lg p-6 shadow-sm">
          <h3 class="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">保留份数</h3>
          <div class="text-3xl font-bold text-green-600">{{ backupConfig.retention || 10 }}</div>
        </div>
        <div class="admin-card-bg rounded-lg p-6 shadow-sm">
          <h3 class="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">R2 Prefix</h3>
          <div class="break-all text-base font-semibold text-gray-900 dark:text-white">
            {{ backupConfig.prefix || "-" }}
          </div>
        </div>
      </div>

      <div class="admin-card-bg rounded-lg p-6 shadow-sm">
        <div class="mb-5 flex flex-col gap-2">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">备份记录</h2>
          <div class="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Bucket: {{ backupConfig.bucket || "-" }}</span>
            <span v-if="backupConfig.database">Database: {{ backupConfig.database }}</span>
          </div>
        </div>

        <el-table
          v-loading="loading"
          :data="backups"
          stripe
          :empty-text="loading ? '数据加载中...' : '暂无备份记录'"
        >
          <el-table-column prop="fileName" label="文件名" min-width="240">
            <template #default="{ row }">
              <div class="font-medium text-gray-900 dark:text-gray-100">
                {{ row.fileName }}
              </div>
              <div class="mt-1 break-all text-xs text-gray-500">
                {{ row.key }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="lastModified" label="备份时间" width="190">
            <template #default="{ row }">
              {{ formatDate(row.lastModified) }}
            </template>
          </el-table-column>
          <el-table-column prop="size" label="大小" width="120" align="right">
            <template #default="{ row }">
              {{ formatBytes(row.size) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                :icon="Download"
                :loading="downloadingKey === row.key"
                @click="handleDownload(row)"
              >
                下载
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Download, Refresh, Upload } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
});

const backups = ref([]);
const backupConfig = reactive({
  bucket: "",
  prefix: "",
  retention: 10,
  database: "",
});
const loading = ref(false);
const backupLoading = ref(false);
const downloadingKey = ref("");

const authHeaders = () => ({
  Authorization: "Bearer " + useCookie("token").value,
});

const formatDate = (value) => {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
};

const formatBytes = (value) => {
  const bytes = Number(value || 0);
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const assignConfig = (config = {}) => {
  backupConfig.bucket = config.bucket || "";
  backupConfig.prefix = config.prefix || "";
  backupConfig.retention = config.retention || 10;
  backupConfig.database = config.database || "";
};

const fetchBackups = async () => {
  loading.value = true;
  try {
    const response = await $fetch("/api/admin/database-backups", {
      method: "GET",
      headers: authHeaders(),
      timeout: 30000,
    });

    if (response.code === 200) {
      backups.value = response.data?.backups || [];
      assignConfig(response.data?.config || {});
      return;
    }

    ElMessage.error(response.msg || "获取备份记录失败");
  } catch (error) {
    console.error("Fetch database backups failed:", error);
    ElMessage.error("获取备份记录失败");
  } finally {
    loading.value = false;
  }
};

const handleManualBackup = async () => {
  try {
    await ElMessageBox.confirm(
      "确认立即创建一份 PostgreSQL 数据库备份？",
      "手动备份",
      {
        type: "warning",
        confirmButtonText: "开始备份",
        cancelButtonText: "取消",
      },
    );
  } catch {
    return;
  }

  backupLoading.value = true;
  try {
    const response = await $fetch("/api/admin/database-backups", {
      method: "POST",
      headers: authHeaders(),
      timeout: 0,
    });

    if (response.code === 200) {
      ElMessage.success("数据库备份已完成");
      await fetchBackups();
      return;
    }

    ElMessage.error(response.msg || "手动备份失败");
  } catch (error) {
    console.error("Manual database backup failed:", error);
    ElMessage.error("手动备份失败");
  } finally {
    backupLoading.value = false;
  }
};

const handleDownload = async (row) => {
  downloadingKey.value = row.key;
  try {
    const response = await $fetch("/api/admin/database-backups/download", {
      method: "POST",
      headers: authHeaders(),
      body: {
        key: row.key,
      },
      timeout: 30000,
    });

    if (response.code !== 200 || !response.data?.url) {
      ElMessage.error(response.msg || "生成下载链接失败");
      return;
    }

    const link = document.createElement("a");
    link.href = response.data.url;
    link.download = row.fileName;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Download database backup failed:", error);
    ElMessage.error("生成下载链接失败");
  } finally {
    downloadingKey.value = "";
  }
};

onMounted(() => {
  fetchBackups();
});
</script>
