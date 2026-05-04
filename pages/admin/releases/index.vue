<template>
  <div class="admin-page-bg">
    <div class="mx-auto space-y-6">
      <div class="admin-card-bg rounded-lg p-6 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div class="mb-2 flex items-center space-x-2 text-sm text-gray-500">
              <nuxt-link to="/admin/dashboard" class="hover:text-primary flex items-center">
                <el-icon class="mr-1"><House /></el-icon>
                后台管理面板
              </nuxt-link>
              <span>/</span>
              <span class="text-gray-900 dark:text-white">发布日志管理</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">发布日志管理</h1>
            <p class="mt-1 text-gray-500 dark:text-gray-400">
              维护网站更新记录，前台只展示已发布的日志。
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <el-button @click="loadReleases" :loading="loading">
              <el-icon class="mr-1"><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button type="primary" @click="openCreateDialog">
              <el-icon class="mr-1"><Plus /></el-icon>
              新增发布日志
            </el-button>
          </div>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-4">
        <div class="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">全部日志</p>
          <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{{ stats.total }}</p>
        </div>
        <div class="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">已发布</p>
          <p class="mt-2 text-3xl font-bold text-green-600">{{ stats.published }}</p>
        </div>
        <div class="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">草稿</p>
          <p class="mt-2 text-3xl font-bold text-orange-500">{{ stats.draft }}</p>
        </div>
        <div class="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">最新版本</p>
          <p class="mt-2 truncate text-2xl font-bold text-gray-900 dark:text-white">
            {{ releases[0]?.version || '-' }}
          </p>
        </div>
      </div>

      <el-alert
        v-if="source === 'static'"
        title="当前使用内置发布日志"
        description="保存任意一条发布日志后，前台将优先使用后台配置。"
        type="info"
        show-icon
        :closable="false"
      />

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <div v-if="loading" class="py-10">
          <el-skeleton :rows="6" animated />
        </div>

        <el-table v-else :data="releases" style="width: 100%" border stripe>
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="version" label="版本" width="130" />
          <el-table-column label="标题" min-width="220">
            <template #default="{ row }">
              <div class="font-semibold text-gray-900 dark:text-white">{{ row.title }}</div>
              <div class="mt-1 line-clamp-1 text-xs text-gray-500">{{ row.summary }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" width="120" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'published' ? 'success' : 'warning'">
                {{ row.status === 'published' ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="标记" width="140" align="center">
            <template #default="{ row }">
              <div class="flex justify-center gap-1">
                <el-tag v-if="row.isImportant" type="danger" size="small">重要</el-tag>
                <el-tag v-if="row.isPinned" type="primary" size="small">置顶</el-tag>
                <span v-if="!row.isImportant && !row.isPinned" class="text-gray-400">-</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button size="small" @click="openEditDialog(row)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button size="small" :type="row.status === 'published' ? 'warning' : 'success'" @click="toggleStatus(row)">
                  {{ row.status === 'published' ? '转草稿' : '发布' }}
                </el-button>
                <el-button size="small" type="danger" @click="deleteRelease(row)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-dialog v-model="dialogVisible" :title="editingVersion ? '编辑发布日志' : '新增发布日志'" width="680px">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
          <div class="grid gap-3 md:grid-cols-2">
            <el-form-item label="版本号" prop="version">
              <el-input v-model="form.version" placeholder="如 2026.05.03" />
            </el-form-item>
            <el-form-item label="发布日期" prop="date">
              <el-date-picker
                v-model="form.date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                class="w-full"
              />
            </el-form-item>
          </div>
          <el-form-item label="标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入更新标题" />
          </el-form-item>
          <el-form-item label="分类">
            <el-input v-model="form.category" placeholder="如 体验优化、用户中心、资源搜索" />
          </el-form-item>
          <el-form-item label="摘要" prop="summary">
            <el-input v-model="form.summary" type="textarea" :rows="3" placeholder="用一句话说明这次更新" />
          </el-form-item>
          <el-form-item label="更新亮点">
            <el-input
              v-model="form.highlightsText"
              type="textarea"
              :rows="6"
              placeholder="每行一条，前台会以清单展示"
            />
          </el-form-item>
          <div class="grid gap-3 md:grid-cols-3">
            <el-form-item label="状态">
              <el-select v-model="form.status" class="w-full">
                <el-option label="已发布" value="published" />
                <el-option label="草稿" value="draft" />
              </el-select>
            </el-form-item>
            <el-form-item label="重要更新">
              <el-switch v-model="form.isImportant" />
            </el-form-item>
            <el-form-item label="置顶">
              <el-switch v-model="form.isPinned" />
            </el-form-item>
          </div>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveRelease">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, Edit, House, Plus, Refresh } from "@element-plus/icons-vue";

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
});

const releases = ref([]);
const source = ref("static");
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingVersion = ref("");
const formRef = ref();

const form = reactive({
  version: "",
  date: new Date().toISOString().slice(0, 10),
  title: "",
  category: "网站更新",
  summary: "",
  highlightsText: "",
  status: "published",
  isImportant: false,
  isPinned: false,
});

const rules = {
  version: [{ required: true, message: "请输入版本号", trigger: "blur" }],
  date: [{ required: true, message: "请选择发布日期", trigger: "change" }],
  title: [{ required: true, message: "请输入标题", trigger: "blur" }],
  summary: [{ required: true, message: "请输入摘要", trigger: "blur" }],
};

const stats = computed(() => ({
  total: releases.value.length,
  published: releases.value.filter((note) => note.status === "published").length,
  draft: releases.value.filter((note) => note.status !== "published").length,
}));

const authHeaders = () => ({
  Authorization: `Bearer ${useCookie("token").value}`,
});

const resetForm = () => {
  Object.assign(form, {
    version: "",
    date: new Date().toISOString().slice(0, 10),
    title: "",
    category: "网站更新",
    summary: "",
    highlightsText: "",
    status: "published",
    isImportant: false,
    isPinned: false,
  });
  editingVersion.value = "";
};

const toPayload = (extra = {}) => ({
  version: form.version.trim(),
  date: form.date,
  title: form.title.trim(),
  category: form.category.trim() || "网站更新",
  summary: form.summary.trim(),
  highlights: form.highlightsText
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean),
  status: form.status,
  isImportant: form.isImportant,
  isPinned: form.isPinned,
  ...extra,
});

const loadReleases = async () => {
  try {
    loading.value = true;
    const res = await $fetch("/api/admin/releases", {
      headers: authHeaders(),
    });
    if (res.code === 200) {
      releases.value = res.data.notes || [];
      source.value = res.data.source || "settings";
      return;
    }
    ElMessage.error(res.msg || "加载发布日志失败");
  } catch (error) {
    ElMessage.error(error.data?.message || "加载发布日志失败");
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  resetForm();
  dialogVisible.value = true;
};

const openEditDialog = (row) => {
  Object.assign(form, {
    version: row.version,
    date: row.date,
    title: row.title,
    category: row.category,
    summary: row.summary,
    highlightsText: (row.highlights || []).join("\n"),
    status: row.status,
    isImportant: row.isImportant,
    isPinned: row.isPinned,
  });
  editingVersion.value = row.version;
  dialogVisible.value = true;
};

const saveRelease = async () => {
  try {
    await formRef.value.validate();
    saving.value = true;
    const isEditing = Boolean(editingVersion.value);
    const endpoint = isEditing
      ? `/api/admin/releases/${encodeURIComponent(editingVersion.value)}`
      : "/api/admin/releases";
    const res = await $fetch(endpoint, {
      method: isEditing ? "PUT" : "POST",
      body: toPayload(),
      headers: authHeaders(),
    });

    if (res.code === 200) {
      ElMessage.success(res.msg || "保存成功");
      dialogVisible.value = false;
      resetForm();
      await loadReleases();
      return;
    }
    ElMessage.error(res.msg || "保存失败");
  } catch (error) {
    ElMessage.error(error.data?.message || error.message || "保存失败");
  } finally {
    saving.value = false;
  }
};

const toggleStatus = async (row) => {
  try {
    const res = await $fetch(`/api/admin/releases/${encodeURIComponent(row.version)}`, {
      method: "PUT",
      body: {
        ...row,
        status: row.status === "published" ? "draft" : "published",
      },
      headers: authHeaders(),
    });
    if (res.code === 200) {
      ElMessage.success("状态已更新");
      await loadReleases();
      return;
    }
    ElMessage.error(res.msg || "更新失败");
  } catch (error) {
    ElMessage.error(error.data?.message || "更新失败");
  }
};

const deleteRelease = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除「${row.title}」吗？`, "删除发布日志", {
      type: "warning",
    });
    const res = await $fetch(`/api/admin/releases/${encodeURIComponent(row.version)}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.code === 200) {
      ElMessage.success("删除成功");
      await loadReleases();
      return;
    }
    ElMessage.error(res.msg || "删除失败");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error(error.data?.message || "删除失败");
    }
  }
};

onMounted(loadReleases);
</script>
