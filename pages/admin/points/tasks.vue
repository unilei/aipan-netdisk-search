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
              <span class="text-gray-900 dark:text-white">积分任务</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">积分任务</h1>
            <p class="mt-1 text-gray-500 dark:text-gray-400">
              配置推广文章和活动任务，用户完成后可在积分中心领取奖励。
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <el-button @click="loadTasks" :loading="loading">
              <el-icon class="mr-1"><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button type="primary" @click="openCreateDialog">
              <el-icon class="mr-1"><Plus /></el-icon>
              新增任务
            </el-button>
          </div>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-4">
        <div class="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">全部任务</p>
          <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{{ stats.total }}</p>
        </div>
        <div class="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">启用中</p>
          <p class="mt-2 text-3xl font-bold text-green-600">{{ stats.enabled }}</p>
        </div>
        <div class="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">已禁用</p>
          <p class="mt-2 text-3xl font-bold text-orange-500">{{ stats.disabled }}</p>
        </div>
        <div class="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">累计领取</p>
          <p class="mt-2 text-3xl font-bold text-blue-600">{{ stats.completions }}</p>
        </div>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <div v-if="loading" class="py-10">
          <el-skeleton :rows="6" animated />
        </div>

        <el-table v-else :data="tasks" style="width: 100%" border stripe>
          <el-table-column label="任务" min-width="260">
            <template #default="{ row }">
              <div class="font-semibold text-gray-900 dark:text-white">{{ row.title }}</div>
              <div class="mt-1 line-clamp-1 text-xs text-gray-500">{{ row.description || row.url }}</div>
              <div class="mt-1 text-xs text-gray-400">{{ row.key }}</div>
            </template>
          </el-table-column>
          <el-table-column label="奖励" width="110" align="right">
            <template #default="{ row }">+{{ row.points }}</template>
          </el-table-column>
          <el-table-column label="每人次数" width="100" align="center">
            <template #default="{ row }">{{ row.claimLimit }}</template>
          </el-table-column>
          <el-table-column label="已领取" width="100" align="center">
            <template #default="{ row }">{{ row.completionCount || 0 }}</template>
          </el-table-column>
          <el-table-column label="排序" width="90" align="center">
            <template #default="{ row }">{{ row.sortOrder }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'">
                {{ row.enabled ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button size="small" @click="openEditDialog(row)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button size="small" :type="row.enabled ? 'warning' : 'success'" @click="toggleEnabled(row)">
                  {{ row.enabled ? '禁用' : '启用' }}
                </el-button>
                <el-button size="small" type="danger" @click="deleteTask(row)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-dialog v-model="dialogVisible" :title="editingTaskId ? '编辑积分任务' : '新增积分任务'" width="720px">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
          <el-form-item label="任务标题" prop="title">
            <el-input v-model="form.title" placeholder="如：阅读网易爆米花推广文章" maxlength="80" show-word-limit />
          </el-form-item>
          <el-form-item label="任务说明">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              maxlength="300"
              show-word-limit
              placeholder="展示给用户的任务说明"
            />
          </el-form-item>
          <el-form-item label="文章链接" prop="url">
            <el-input v-model="form.url" placeholder="https://www.aipan.me/blog/..." />
          </el-form-item>
          <div class="grid gap-3 md:grid-cols-3">
            <el-form-item label="奖励积分" prop="points">
              <el-input-number v-model="form.points" :min="1" :max="100000000" class="w-full" />
            </el-form-item>
            <el-form-item label="每人次数" prop="claimLimit">
              <el-input-number v-model="form.claimLimit" :min="1" :max="10" class="w-full" />
            </el-form-item>
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number v-model="form.sortOrder" :min="-1000000" :max="1000000" class="w-full" />
            </el-form-item>
          </div>
          <el-form-item label="启用状态">
            <el-switch v-model="form.enabled" active-text="启用" inactive-text="禁用" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveTask">保存</el-button>
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

const tasks = ref([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingTaskId = ref(null);
const formRef = ref();

const form = reactive({
  title: "",
  description: "",
  url: "",
  points: 100,
  enabled: true,
  sortOrder: 0,
  claimLimit: 1,
});

const stats = computed(() => ({
  total: tasks.value.length,
  enabled: tasks.value.filter((task) => task.enabled).length,
  disabled: tasks.value.filter((task) => !task.enabled).length,
  completions: tasks.value.reduce((sum, task) => sum + Number(task.completionCount || 0), 0),
}));

const authHeaders = () => ({
  Authorization: `Bearer ${useCookie("token").value}`,
});

const validateUrl = (_rule, value, callback) => {
  try {
    const parsed = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(parsed.protocol)) {
      callback(new Error("链接只支持 http 或 https"));
      return;
    }
    callback();
  } catch {
    callback(new Error("请输入正确的文章链接"));
  }
};

const rules = {
  title: [{ required: true, message: "请输入任务标题", trigger: "blur" }],
  url: [{ required: true, validator: validateUrl, trigger: "blur" }],
  points: [{ required: true, message: "请输入奖励积分", trigger: "change" }],
  claimLimit: [{ required: true, message: "请输入每人领取次数", trigger: "change" }],
};

const resetForm = () => {
  Object.assign(form, {
    title: "",
    description: "",
    url: "",
    points: 100,
    enabled: true,
    sortOrder: 0,
    claimLimit: 1,
  });
  editingTaskId.value = null;
};

const toPayload = (extra = {}) => ({
  title: form.title.trim(),
  description: form.description.trim(),
  url: form.url.trim(),
  points: form.points,
  enabled: form.enabled,
  sortOrder: form.sortOrder,
  claimLimit: form.claimLimit,
  ...extra,
});

const loadTasks = async () => {
  try {
    loading.value = true;
    const res = await $fetch("/api/admin/points/tasks", {
      headers: authHeaders(),
    });
    if (res.code === 200) {
      tasks.value = res.data || [];
      return;
    }
    ElMessage.error(res.msg || "加载积分任务失败");
  } catch (error) {
    ElMessage.error(error.data?.message || "加载积分任务失败");
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
    title: row.title,
    description: row.description || "",
    url: row.url,
    points: row.points,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    claimLimit: row.claimLimit,
  });
  editingTaskId.value = row.id;
  dialogVisible.value = true;
};

const saveTask = async () => {
  try {
    await formRef.value.validate();
    saving.value = true;
    const isEditing = Boolean(editingTaskId.value);
    const endpoint = isEditing
      ? `/api/admin/points/tasks/${editingTaskId.value}`
      : "/api/admin/points/tasks";
    const res = await $fetch(endpoint, {
      method: isEditing ? "PUT" : "POST",
      body: toPayload(),
      headers: authHeaders(),
    });

    if (res.code === 200) {
      ElMessage.success(res.msg || "保存成功");
      dialogVisible.value = false;
      resetForm();
      await loadTasks();
      return;
    }
    ElMessage.error(res.msg || "保存失败");
  } catch (error) {
    ElMessage.error(error.data?.message || error.message || "保存失败");
  } finally {
    saving.value = false;
  }
};

const toggleEnabled = async (row) => {
  try {
    const res = await $fetch(`/api/admin/points/tasks/${row.id}`, {
      method: "PUT",
      body: {
        ...row,
        enabled: !row.enabled,
      },
      headers: authHeaders(),
    });
    if (res.code === 200) {
      ElMessage.success(row.enabled ? "任务已禁用" : "任务已启用");
      await loadTasks();
      return;
    }
    ElMessage.error(res.msg || "更新失败");
  } catch (error) {
    ElMessage.error(error.data?.message || "更新失败");
  }
};

const deleteTask = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除「${row.title}」吗？已有领取记录的任务不能删除。`, "删除积分任务", {
      type: "warning",
    });
    const res = await $fetch(`/api/admin/points/tasks/${row.id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.code === 200) {
      ElMessage.success("删除成功");
      await loadTasks();
      return;
    }
    ElMessage.error(res.msg || "删除失败");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error(error.data?.message || "删除失败");
    }
  }
};

onMounted(loadTasks);
</script>
