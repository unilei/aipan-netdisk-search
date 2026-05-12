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
              统一规划签到、转存验证和自定义活动任务，用户完成后可在积分中心领取奖励。
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <el-button @click="loadPageData" :loading="loading || transferLoading || privateMessageLoading">
              <el-icon class="mr-1"><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button type="primary" @click="openCreateDialog">
              <el-icon class="mr-1"><Plus /></el-icon>
              新增自定义任务
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
        <div class="mb-4">
          <h2 class="m-0 text-lg font-semibold text-gray-900 dark:text-white">积分任务规划</h2>
          <p class="m-0 mt-1 text-sm text-gray-500 dark:text-gray-400">
            按任务来源拆分管理入口，避免积分规则散落在系统配置里。
          </p>
        </div>
        <div class="grid gap-4 lg:grid-cols-4">
          <div
            v-for="item in taskPlanItems"
            :key="item.key"
            :class="getPlanCardClass(item.tone)"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="m-0 text-sm font-semibold text-gray-900 dark:text-white">{{ item.title }}</p>
                <p class="m-0 mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{{ item.description }}</p>
              </div>
              <el-tag size="small" :type="item.tagType">{{ item.status }}</el-tag>
            </div>
            <div class="mt-4 text-sm text-gray-700 dark:text-gray-200">{{ item.reward }}</div>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ item.rule }}</div>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 class="m-0 text-lg font-semibold text-gray-900 dark:text-white">转存验证任务</h2>
            <p class="m-0 mt-1 text-sm text-gray-500 dark:text-gray-400">
              配置积分中心的“转存验证”任务；奖励为限时积分，同一个转存结果只奖励一次。
            </p>
          </div>
          <el-tag :type="transferTaskConfigured ? 'success' : 'info'">
            {{ transferTaskConfigured ? '已配置' : '未完整配置' }}
          </el-tag>
        </div>

        <div v-if="transferLoading" class="py-6">
          <el-skeleton :rows="4" animated />
        </div>

        <el-form
          v-else
          ref="transferFormRef"
          :model="transferForm"
          :rules="transferRules"
          label-width="110px"
        >
          <el-form-item label="任务状态">
            <el-switch
              v-model="transferForm.transferRewardEnabled"
              active-text="启用任务"
              inactive-text="关闭任务"
            />
          </el-form-item>

          <el-form-item label="任务链接" prop="transferRewardShareLink">
            <el-input
              v-model="transferForm.transferRewardShareLink"
              placeholder="请输入用户需要转存的夸克分享链接"
              :disabled="!transferForm.transferRewardEnabled"
            />
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              这个链接会展示在用户积分中心的“转存验证”任务中，独立于访问验证链接。
            </div>
          </el-form-item>

          <div class="grid gap-4 md:grid-cols-2">
            <el-form-item label="奖励积分" prop="transferRewardPoints">
              <el-input-number
                v-model="transferForm.transferRewardPoints"
                :min="1"
                :max="100000000"
                :step="100"
                :disabled="!transferForm.transferRewardEnabled"
                class="w-full"
              />
            </el-form-item>
            <el-form-item label="有效期(分钟)" prop="transferRewardDurationMinutes">
              <el-input-number
                v-model="transferForm.transferRewardDurationMinutes"
                :min="1"
                :max="525600"
                :step="60"
                :disabled="!transferForm.transferRewardEnabled"
                class="w-full"
              />
            </el-form-item>
          </div>

          <el-form-item>
            <el-button
              type="primary"
              :loading="transferSaving"
              @click="saveTransferConfig"
            >
              保存转存任务
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 class="m-0 text-lg font-semibold text-gray-900 dark:text-white">私信发起门槛</h2>
            <p class="m-0 mt-1 text-sm text-gray-500 dark:text-gray-400">
              用户当前有效积分达到门槛后可以主动发起新私信；不会扣除积分，已有私信回复不受限制。
            </p>
          </div>
          <el-tag type="success">
            当前 {{ privateMessageForm.privateMessageMinimumPoints }} 积分
          </el-tag>
        </div>

        <div v-if="privateMessageLoading" class="py-6">
          <el-skeleton :rows="3" animated />
        </div>

        <el-form
          v-else
          ref="privateMessageFormRef"
          :model="privateMessageForm"
          :rules="privateMessageRules"
          label-width="120px"
        >
          <el-form-item label="发起门槛" prop="privateMessageMinimumPoints">
            <el-input-number
              v-model="privateMessageForm.privateMessageMinimumPoints"
              :min="0"
              :max="100000000"
              :step="1000"
              class="w-full"
            />
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              这是资格门槛，不是消费扣费；用户达到后发起新私信不会减少积分。
            </div>
          </el-form-item>

          <el-form-item label="管理员绕过">
            <el-switch
              v-model="privateMessageForm.adminBypass"
              active-text="允许"
              inactive-text="不允许"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="privateMessageSaving"
              @click="savePrivateMessageConfig"
            >
              保存私信门槛
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <div class="mb-5">
          <h2 class="m-0 text-lg font-semibold text-gray-900 dark:text-white">自定义任务</h2>
          <p class="m-0 mt-1 text-sm text-gray-500 dark:text-gray-400">
            管理推广文章和活动任务，用户打开任务后可回到积分中心领取奖励。
          </p>
        </div>
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
const transferLoading = ref(false);
const transferSaving = ref(false);
const privateMessageLoading = ref(false);
const privateMessageSaving = ref(false);
const dialogVisible = ref(false);
const editingTaskId = ref(null);
const formRef = ref();
const transferFormRef = ref();
const privateMessageFormRef = ref();

const DEFAULT_TRANSFER_REWARD_POINTS = 1000;
const DEFAULT_TRANSFER_REWARD_DURATION = 1440;
const DEFAULT_PRIVATE_MESSAGE_MINIMUM_POINTS = 10000;

const form = reactive({
  title: "",
  description: "",
  url: "",
  points: 100,
  enabled: true,
  sortOrder: 0,
  claimLimit: 1,
});

const transferForm = reactive({
  transferRewardEnabled: true,
  transferRewardShareLink: "",
  transferRewardPoints: DEFAULT_TRANSFER_REWARD_POINTS,
  transferRewardDurationMinutes: DEFAULT_TRANSFER_REWARD_DURATION,
});

const privateMessageForm = reactive({
  privateMessageMinimumPoints: DEFAULT_PRIVATE_MESSAGE_MINIMUM_POINTS,
  adminBypass: true,
});

const stats = computed(() => ({
  total: tasks.value.length,
  enabled: tasks.value.filter((task) => task.enabled).length,
  disabled: tasks.value.filter((task) => !task.enabled).length,
  completions: tasks.value.reduce((sum, task) => sum + Number(task.completionCount || 0), 0),
}));

const transferTaskConfigured = computed(() =>
  Boolean(
    transferForm.transferRewardEnabled &&
      String(transferForm.transferRewardShareLink || "").trim(),
  ),
);

const formatDurationText = (minutes) => {
  const normalizedMinutes = Number(minutes || 0);
  if (normalizedMinutes >= 1440 && normalizedMinutes % 1440 === 0) {
    return `${normalizedMinutes / 1440} 天`;
  }
  if (normalizedMinutes >= 60 && normalizedMinutes % 60 === 0) {
    return `${normalizedMinutes / 60} 小时`;
  }
  return `${normalizedMinutes} 分钟`;
};

const taskPlanItems = computed(() => [
  {
    key: "checkin",
    title: "每日签到",
    description: "固定任务，面向所有登录用户。",
    status: "固定启用",
    tagType: "success",
    tone: "green",
    reward: "+10 永久积分",
    rule: "连续 3/7/15/30 天会获得额外奖励。",
  },
  {
    key: "transfer",
    title: "转存验证",
    description: "由当前页面配置任务链接和限时积分。",
    status: transferTaskConfigured.value ? "启用中" : "待配置",
    tagType: transferTaskConfigured.value ? "success" : "info",
    tone: "blue",
    reward: `+${transferForm.transferRewardPoints} 限时积分`,
    rule: `有效期 ${formatDurationText(transferForm.transferRewardDurationMinutes)}，同一次转存只奖励一次。`,
  },
  {
    key: "custom",
    title: "自定义任务",
    description: "推广文章、活动页面和其他可领取任务。",
    status: `${stats.value.enabled} 个启用`,
    tagType: stats.value.enabled > 0 ? "success" : "info",
    tone: "purple",
    reward: "按任务配置发放永久积分",
    rule: `当前共 ${stats.value.total} 个任务，累计领取 ${stats.value.completions} 次。`,
  },
  {
    key: "private-message",
    title: "私信发起",
    description: "达到积分门槛后可主动发起新私信。",
    status: "资格门槛",
    tagType: "warning",
    tone: "amber",
    reward: "不扣除积分",
    rule: `当前门槛 ${privateMessageForm.privateMessageMinimumPoints} 有效积分，已有私信回复免费。`,
  },
]);

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

const validateTransferShareLink = (_rule, value, callback) => {
  if (!transferForm.transferRewardEnabled) {
    callback();
    return;
  }

  if (!value) {
    callback(new Error("请输入积分任务夸克分享链接"));
    return;
  }

  const pattern = /https?:\/\/pan\.quark\.cn\/s\/[A-Za-z0-9]+/;
  if (!pattern.test(value)) {
    callback(new Error("请输入有效的夸克分享链接"));
    return;
  }

  callback();
};

const validateTransferPositiveInteger = (message, max) => {
  return (_rule, value, callback) => {
    if (!transferForm.transferRewardEnabled) {
      callback();
      return;
    }

    if (typeof value !== "number" || value < 1 || value > max) {
      callback(new Error(message));
      return;
    }

    callback();
  };
};

const transferRules = {
  transferRewardShareLink: [
    { validator: validateTransferShareLink, trigger: "blur" },
  ],
  transferRewardPoints: [
    {
      validator: validateTransferPositiveInteger("奖励积分需要大于 0", 100000000),
      trigger: ["blur", "change"],
    },
  ],
  transferRewardDurationMinutes: [
    {
      validator: validateTransferPositiveInteger("有效期需要大于 0 分钟", 525600),
      trigger: ["blur", "change"],
    },
  ],
};

const validatePrivateMessageMinimumPoints = (_rule, value, callback) => {
  if (typeof value !== "number" || value < 0 || value > 100000000) {
    callback(new Error("私信发起门槛需要在 0 到 100000000 之间"));
    return;
  }

  callback();
};

const privateMessageRules = {
  privateMessageMinimumPoints: [
    {
      validator: validatePrivateMessageMinimumPoints,
      trigger: ["blur", "change"],
    },
  ],
};

const getPlanCardClass = (tone) => {
  const base =
    "rounded-lg border p-4 transition-colors duration-200 dark:bg-gray-900/40";
  const tones = {
    green: "border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/60",
    blue: "border-blue-100 bg-blue-50/60 dark:border-blue-900/60",
    purple: "border-violet-100 bg-violet-50/60 dark:border-violet-900/60",
    amber: "border-amber-100 bg-amber-50/60 dark:border-amber-900/60",
  };

  return `${base} ${tones[tone] || tones.blue}`;
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

const loadTransferConfig = async () => {
  try {
    transferLoading.value = true;
    const res = await $fetch("/api/admin/points/transfer-reward", {
      headers: authHeaders(),
    });
    if (res.code === 200) {
      Object.assign(transferForm, {
        transferRewardEnabled: res.data?.transferRewardEnabled ?? true,
        transferRewardShareLink: res.data?.transferRewardShareLink || "",
        transferRewardPoints:
          res.data?.transferRewardPoints ?? DEFAULT_TRANSFER_REWARD_POINTS,
        transferRewardDurationMinutes:
          res.data?.transferRewardDurationMinutes ?? DEFAULT_TRANSFER_REWARD_DURATION,
      });
      return;
    }
    ElMessage.error(res.msg || "加载转存任务失败");
  } catch (error) {
    ElMessage.error(error.data?.message || "加载转存任务失败");
  } finally {
    transferLoading.value = false;
  }
};

const loadPageData = async () => {
  await Promise.all([loadTasks(), loadTransferConfig(), loadPrivateMessageConfig()]);
};

const saveTransferConfig = async () => {
  try {
    await transferFormRef.value.validate();
    transferSaving.value = true;
    const res = await $fetch("/api/admin/points/transfer-reward", {
      method: "POST",
      body: {
        transferRewardEnabled: transferForm.transferRewardEnabled,
        transferRewardShareLink: transferForm.transferRewardShareLink,
        transferRewardPoints: transferForm.transferRewardPoints,
        transferRewardDurationMinutes: transferForm.transferRewardDurationMinutes,
      },
      headers: authHeaders(),
    });

    if (res.code === 200) {
      Object.assign(transferForm, {
        transferRewardEnabled: res.data?.transferRewardEnabled ?? true,
        transferRewardShareLink: res.data?.transferRewardShareLink || "",
        transferRewardPoints:
          res.data?.transferRewardPoints ?? DEFAULT_TRANSFER_REWARD_POINTS,
        transferRewardDurationMinutes:
          res.data?.transferRewardDurationMinutes ?? DEFAULT_TRANSFER_REWARD_DURATION,
      });
      ElMessage.success(res.msg || "保存成功");
      return;
    }
    ElMessage.error(res.msg || "保存失败");
  } catch (error) {
    ElMessage.error(error.data?.message || error.message || "保存失败");
  } finally {
    transferSaving.value = false;
  }
};

const loadPrivateMessageConfig = async () => {
  try {
    privateMessageLoading.value = true;
    const res = await $fetch("/api/admin/points/private-message", {
      headers: authHeaders(),
    });
    if (res.code === 200) {
      Object.assign(privateMessageForm, {
        privateMessageMinimumPoints:
          res.data?.privateMessageMinimumPoints ?? DEFAULT_PRIVATE_MESSAGE_MINIMUM_POINTS,
        adminBypass: res.data?.adminBypass ?? true,
      });
      return;
    }
    ElMessage.error(res.msg || "加载私信门槛失败");
  } catch (error) {
    ElMessage.error(error.data?.message || "加载私信门槛失败");
  } finally {
    privateMessageLoading.value = false;
  }
};

const savePrivateMessageConfig = async () => {
  try {
    await privateMessageFormRef.value.validate();
    privateMessageSaving.value = true;
    const res = await $fetch("/api/admin/points/private-message", {
      method: "POST",
      body: {
        privateMessageMinimumPoints: privateMessageForm.privateMessageMinimumPoints,
        adminBypass: privateMessageForm.adminBypass,
      },
      headers: authHeaders(),
    });

    if (res.code === 200) {
      Object.assign(privateMessageForm, {
        privateMessageMinimumPoints:
          res.data?.privateMessageMinimumPoints ?? DEFAULT_PRIVATE_MESSAGE_MINIMUM_POINTS,
        adminBypass: res.data?.adminBypass ?? true,
      });
      ElMessage.success(res.msg || "保存成功");
      return;
    }
    ElMessage.error(res.msg || "保存失败");
  } catch (error) {
    ElMessage.error(error.data?.message || error.message || "保存失败");
  } finally {
    privateMessageSaving.value = false;
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

onMounted(loadPageData);
</script>
