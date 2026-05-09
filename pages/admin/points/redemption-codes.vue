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
              <span class="text-gray-900 dark:text-white">兑换码</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">兑换码</h1>
            <p class="mt-1 text-gray-500 dark:text-gray-400">
              配置可兑换积分的活动，批量生成兑换码，并追踪用户兑换记录。
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <el-button @click="loadPageData" :loading="loading">
              <el-icon class="mr-1"><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button type="primary" @click="openCreateCampaignDialog">
              <el-icon class="mr-1"><Plus /></el-icon>
              新增活动
            </el-button>
          </div>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-4">
        <div class="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">全部活动</p>
          <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{{ stats.totalCampaigns }}</p>
        </div>
        <div class="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">启用中</p>
          <p class="mt-2 text-3xl font-bold text-green-600">{{ stats.enabledCampaigns }}</p>
        </div>
        <div class="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">已生成码</p>
          <p class="mt-2 text-3xl font-bold text-blue-600">{{ stats.totalCodes }}</p>
        </div>
        <div class="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">已兑换</p>
          <p class="mt-2 text-3xl font-bold text-amber-600">{{ stats.totalRedemptions }}</p>
        </div>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 class="m-0 text-lg font-semibold text-gray-900 dark:text-white">兑换活动</h2>
            <p class="m-0 mt-1 text-sm text-gray-500 dark:text-gray-400">
              每个活动定义奖励积分、有效期和每人可兑换次数。活动已有兑换记录后，奖励规则会锁定。
            </p>
          </div>
          <el-button type="primary" plain @click="openCreateCampaignDialog">
            <el-icon class="mr-1"><Plus /></el-icon>
            创建活动
          </el-button>
        </div>

        <el-table v-loading="campaignsLoading" :data="campaigns" style="width: 100%" border stripe>
          <el-table-column label="活动" min-width="260">
            <template #default="{ row }">
              <div class="font-semibold text-gray-900 dark:text-white">{{ row.name }}</div>
              <div class="mt-1 line-clamp-1 text-xs text-gray-500">{{ row.description || '无说明' }}</div>
              <div class="mt-1 text-xs text-gray-400">ID: {{ row.id }}</div>
            </template>
          </el-table-column>
          <el-table-column label="奖励" min-width="150">
            <template #default="{ row }">
              <div class="font-semibold text-emerald-600 dark:text-emerald-300">+{{ formatNumber(row.points) }} 积分</div>
              <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ row.pointsExpiresInMinutes ? `限时 ${formatDuration(row.pointsExpiresInMinutes)}` : '永久积分' }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="兑换规则" min-width="150">
            <template #default="{ row }">
              <div>每人 {{ row.maxRedemptionsPerUser }} 次</div>
              <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ getCampaignWindowText(row) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="兑换码" width="110" align="center">
            <template #default="{ row }">{{ row.codeCount || 0 }}</template>
          </el-table-column>
          <el-table-column label="已兑换" width="110" align="center">
            <template #default="{ row }">{{ row.redemptionCount || 0 }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'">
                {{ row.enabled ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button size="small" @click="openEditCampaignDialog(row)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button size="small" type="primary" plain @click="openGenerateDialog(row)">
                  生成码
                </el-button>
                <el-button size="small" :type="row.enabled ? 'warning' : 'success'" @click="toggleCampaign(row)">
                  {{ row.enabled ? '禁用' : '启用' }}
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 class="m-0 text-lg font-semibold text-gray-900 dark:text-white">兑换码列表</h2>
              <p class="m-0 mt-1 text-sm text-gray-500 dark:text-gray-400">
                为了安全，系统只展示脱敏后的兑换码。明文只在生成完成时出现一次。
              </p>
            </div>
            <el-select
              v-model="selectedCampaignId"
              placeholder="按活动筛选"
              clearable
              class="w-full lg:w-64"
            >
              <el-option
                v-for="campaign in campaigns"
                :key="campaign.id"
                :label="campaign.name"
                :value="campaign.id"
              />
            </el-select>
          </div>

          <el-table v-loading="codesLoading" :data="codes" style="width: 100%" border stripe>
            <el-table-column label="兑换码" min-width="160">
              <template #default="{ row }">
                <div class="font-mono text-sm text-gray-900 dark:text-white">{{ row.maskedCode || '-' }}</div>
                <div v-if="row.batchName" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ row.batchName }}</div>
              </template>
            </el-table-column>
            <el-table-column label="活动" min-width="180">
              <template #default="{ row }">{{ row.campaignName }}</template>
            </el-table-column>
            <el-table-column label="使用" width="120" align="center">
              <template #default="{ row }">{{ row.usedCount || 0 }} / {{ row.maxRedemptions || '不限' }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
                  {{ row.enabled ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="生成时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </div>

        <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <div class="mb-5">
            <h2 class="m-0 text-lg font-semibold text-gray-900 dark:text-white">最近兑换</h2>
            <p class="m-0 mt-1 text-sm text-gray-500 dark:text-gray-400">展示最近 200 条兑换记录。</p>
          </div>

          <div v-loading="redemptionsLoading" class="max-h-[620px] space-y-3 overflow-y-auto pr-1">
            <el-empty v-if="!redemptionsLoading && redemptions.length === 0" description="暂无兑换记录" />
            <div
              v-for="redemption in redemptions"
              :key="redemption.id"
              class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {{ redemption.user?.username || redemption.user?.email || '未知用户' }}
                  </div>
                  <div class="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                    {{ redemption.campaignName }}
                  </div>
                </div>
                <span class="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                  +{{ formatNumber(redemption.points) }}
                </span>
              </div>
              <div class="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span class="rounded-md bg-gray-100 px-2 py-1 dark:bg-gray-700">{{ redemption.maskedCode || '-' }}</span>
                <span>{{ formatDateTime(redemption.createdAt) }}</span>
                <span v-if="redemption.isTemporary">有效至 {{ formatDateTime(redemption.expiresAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-dialog
        v-model="campaignDialogVisible"
        :title="editingCampaignId ? '编辑兑换活动' : '新增兑换活动'"
        width="760px"
        destroy-on-close
      >
        <el-alert
          v-if="campaignRewardLocked"
          title="该活动已有兑换记录，奖励积分、积分类型、开始时间和每人次数已锁定。"
          type="warning"
          show-icon
          class="mb-4"
        />
        <el-form ref="campaignFormRef" :model="campaignForm" :rules="campaignRules" label-width="110px">
          <el-form-item label="活动名称" prop="name">
            <el-input v-model="campaignForm.name" maxlength="80" show-word-limit placeholder="如：春节会员福利" />
          </el-form-item>
          <el-form-item label="活动说明">
            <el-input
              v-model="campaignForm.description"
              type="textarea"
              :rows="3"
              maxlength="300"
              show-word-limit
              placeholder="仅在管理端展示，用于说明发放渠道或活动背景"
            />
          </el-form-item>

          <div class="grid gap-3 md:grid-cols-2">
            <el-form-item label="奖励积分" prop="points">
              <el-input-number
                v-model="campaignForm.points"
                :min="1"
                :max="100000000"
                class="w-full"
                :disabled="campaignRewardLocked"
              />
            </el-form-item>
            <el-form-item label="每人次数" prop="maxRedemptionsPerUser">
              <el-input-number
                v-model="campaignForm.maxRedemptionsPerUser"
                :min="1"
                :max="10"
                class="w-full"
                :disabled="campaignRewardLocked"
              />
            </el-form-item>
          </div>

          <el-form-item label="积分类型">
            <el-radio-group v-model="campaignForm.rewardMode" :disabled="campaignRewardLocked">
              <el-radio-button label="permanent">永久积分</el-radio-button>
              <el-radio-button label="temporary">限时积分</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item
            v-if="campaignForm.rewardMode === 'temporary'"
            label="有效期(分钟)"
            prop="pointsExpiresInMinutes"
          >
            <el-input-number
              v-model="campaignForm.pointsExpiresInMinutes"
              :min="1"
              :max="525600"
              :step="60"
              class="w-full"
              :disabled="campaignRewardLocked"
            />
          </el-form-item>

          <div class="grid gap-3 md:grid-cols-2">
            <el-form-item label="开始时间">
              <el-date-picker
                v-model="campaignForm.startsAt"
                type="datetime"
                placeholder="立即开始"
                class="w-full"
                :disabled="campaignRewardLocked"
              />
            </el-form-item>
            <el-form-item label="结束时间">
              <el-date-picker
                v-model="campaignForm.endsAt"
                type="datetime"
                placeholder="不限结束"
                class="w-full"
              />
            </el-form-item>
          </div>

          <el-form-item label="启用状态">
            <el-switch v-model="campaignForm.enabled" active-text="启用" inactive-text="禁用" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="campaignDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="savingCampaign" @click="saveCampaign">保存</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="generateDialogVisible"
        title="生成兑换码"
        width="760px"
        destroy-on-close
      >
        <div v-if="selectedCampaignForGeneration" class="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
          <div class="text-sm font-semibold text-blue-950 dark:text-blue-100">
            {{ selectedCampaignForGeneration.name }}
          </div>
          <div class="mt-1 text-sm text-blue-700 dark:text-blue-200">
            +{{ formatNumber(selectedCampaignForGeneration.points) }} 积分，
            {{ selectedCampaignForGeneration.pointsExpiresInMinutes ? `限时 ${formatDuration(selectedCampaignForGeneration.pointsExpiresInMinutes)}` : '永久积分' }}
          </div>
        </div>

        <el-form ref="generateFormRef" :model="generateForm" :rules="generateRules" label-width="120px">
          <div class="grid gap-3 md:grid-cols-2">
            <el-form-item label="生成数量" prop="quantity">
              <el-input-number v-model="generateForm.quantity" :min="1" :max="1000" class="w-full" />
            </el-form-item>
            <el-form-item label="码前缀" prop="prefix">
              <el-input v-model="generateForm.prefix" maxlength="8" placeholder="AIPAN" />
            </el-form-item>
          </div>
          <div class="grid gap-3 md:grid-cols-2">
            <el-form-item label="批次名称">
              <el-input v-model="generateForm.batchName" maxlength="80" placeholder="如：社群发放 2026-05" />
            </el-form-item>
            <el-form-item label="单码可兑换">
              <el-input-number v-model="generateForm.maxRedemptions" :min="1" :max="100000000" class="w-full" />
            </el-form-item>
          </div>
          <el-form-item label="启用状态">
            <el-switch v-model="generateForm.enabled" active-text="生成后启用" inactive-text="生成后禁用" />
          </el-form-item>
        </el-form>

        <el-alert
          v-if="generatedCodes.length"
          title="明文兑换码只会在这里出现一次，请在关闭窗口前保存。"
          type="warning"
          show-icon
          class="mb-3"
        />
        <el-input
          v-if="generatedCodes.length"
          :model-value="generatedCodesText"
          type="textarea"
          :rows="8"
          readonly
        />

        <template #footer>
          <el-button @click="generateDialogVisible = false">关闭</el-button>
          <el-button type="primary" :loading="generatingCodes" @click="generateCodes">
            生成兑换码
          </el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { Edit, House, Plus, Refresh } from "@element-plus/icons-vue";

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
});

const campaigns = ref([]);
const codes = ref([]);
const redemptions = ref([]);
const campaignsLoading = ref(false);
const codesLoading = ref(false);
const redemptionsLoading = ref(false);
const savingCampaign = ref(false);
const generatingCodes = ref(false);
const campaignDialogVisible = ref(false);
const generateDialogVisible = ref(false);
const editingCampaignId = ref(null);
const editingCampaignSnapshot = ref(null);
const selectedCampaignId = ref(null);
const generationCampaignId = ref(null);
const campaignFormRef = ref();
const generateFormRef = ref();
const generatedCodes = ref([]);

const campaignForm = reactive({
  name: "",
  description: "",
  points: 100,
  rewardMode: "permanent",
  pointsExpiresInMinutes: 1440,
  enabled: true,
  startsAt: null,
  endsAt: null,
  maxRedemptionsPerUser: 1,
});

const generateForm = reactive({
  quantity: 10,
  prefix: "AIPAN",
  batchName: "",
  maxRedemptions: 1,
  enabled: true,
});

const stats = computed(() => ({
  totalCampaigns: campaigns.value.length,
  enabledCampaigns: campaigns.value.filter((campaign) => campaign.enabled).length,
  totalCodes: campaigns.value.reduce((sum, campaign) => sum + Number(campaign.codeCount || 0), 0),
  totalRedemptions: campaigns.value.reduce((sum, campaign) => sum + Number(campaign.redemptionCount || 0), 0),
}));

const loading = computed(() => campaignsLoading.value || codesLoading.value || redemptionsLoading.value);
const campaignRewardLocked = computed(() => Number(editingCampaignSnapshot.value?.redemptionCount || 0) > 0);
const selectedCampaignForGeneration = computed(() =>
  campaigns.value.find((campaign) => campaign.id === generationCampaignId.value) || null,
);
const generatedCodesText = computed(() =>
  generatedCodes.value.map((item) => item.code).join("\n"),
);

const authHeaders = () => ({
  Authorization: `Bearer ${useCookie("token").value}`,
});

const campaignRules = {
  name: [{ required: true, message: "请输入活动名称", trigger: "blur" }],
  points: [{ required: true, message: "请输入奖励积分", trigger: "change" }],
  maxRedemptionsPerUser: [{ required: true, message: "请输入每人次数", trigger: "change" }],
  pointsExpiresInMinutes: [{ required: true, message: "请输入限时积分有效期", trigger: "change" }],
};

const generateRules = {
  quantity: [{ required: true, message: "请输入生成数量", trigger: "change" }],
  prefix: [{ required: true, message: "请输入兑换码前缀", trigger: "blur" }],
};

const toDateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatNumber = (value) => new Intl.NumberFormat("zh-CN").format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatDuration = (minutes) => {
  const value = Number(minutes || 0);
  if (value >= 1440) {
    const days = Math.floor(value / 1440);
    const hours = Math.floor((value % 1440) / 60);
    return hours ? `${days} 天 ${hours} 小时` : `${days} 天`;
  }
  if (value >= 60) {
    const hours = Math.floor(value / 60);
    const remainingMinutes = value % 60;
    return remainingMinutes ? `${hours} 小时 ${remainingMinutes} 分钟` : `${hours} 小时`;
  }
  return `${value} 分钟`;
};

const getCampaignWindowText = (campaign) => {
  if (!campaign.startsAt && !campaign.endsAt) return "长期有效";
  if (campaign.startsAt && campaign.endsAt) {
    return `${formatDateTime(campaign.startsAt)} 至 ${formatDateTime(campaign.endsAt)}`;
  }
  if (campaign.startsAt) return `${formatDateTime(campaign.startsAt)} 后可用`;
  return `${formatDateTime(campaign.endsAt)} 前可用`;
};

const resetCampaignForm = () => {
  Object.assign(campaignForm, {
    name: "",
    description: "",
    points: 100,
    rewardMode: "permanent",
    pointsExpiresInMinutes: 1440,
    enabled: true,
    startsAt: null,
    endsAt: null,
    maxRedemptionsPerUser: 1,
  });
  editingCampaignId.value = null;
  editingCampaignSnapshot.value = null;
};

const resetGenerateForm = () => {
  Object.assign(generateForm, {
    quantity: 10,
    prefix: "AIPAN",
    batchName: "",
    maxRedemptions: 1,
    enabled: true,
  });
  generatedCodes.value = [];
};

const toCampaignPayload = () => ({
  name: campaignForm.name.trim(),
  description: campaignForm.description.trim(),
  points: campaignForm.points,
  rewardMode: campaignForm.rewardMode,
  pointsExpiresInMinutes:
    campaignForm.rewardMode === "temporary"
      ? campaignForm.pointsExpiresInMinutes
      : null,
  enabled: campaignForm.enabled,
  startsAt: campaignForm.startsAt,
  endsAt: campaignForm.endsAt,
  maxRedemptionsPerUser: campaignForm.maxRedemptionsPerUser,
});

const loadCampaigns = async () => {
  try {
    campaignsLoading.value = true;
    const res = await $fetch("/api/admin/points/redemption-codes/campaigns", {
      headers: authHeaders(),
    });
    if (res.code === 200) {
      campaigns.value = res.data || [];
      return;
    }
    ElMessage.error(res.msg || "加载兑换活动失败");
  } catch (error) {
    ElMessage.error(error?.data?.message || "加载兑换活动失败");
  } finally {
    campaignsLoading.value = false;
  }
};

const loadCodes = async () => {
  try {
    codesLoading.value = true;
    const query = selectedCampaignId.value ? { campaignId: selectedCampaignId.value } : {};
    const res = await $fetch("/api/admin/points/redemption-codes/codes", {
      query,
      headers: authHeaders(),
    });
    if (res.code === 200) {
      codes.value = res.data || [];
      return;
    }
    ElMessage.error(res.msg || "加载兑换码失败");
  } catch (error) {
    ElMessage.error(error?.data?.message || "加载兑换码失败");
  } finally {
    codesLoading.value = false;
  }
};

const loadRedemptions = async () => {
  try {
    redemptionsLoading.value = true;
    const res = await $fetch("/api/admin/points/redemption-codes/redemptions", {
      headers: authHeaders(),
    });
    if (res.code === 200) {
      redemptions.value = res.data || [];
      return;
    }
    ElMessage.error(res.msg || "加载兑换记录失败");
  } catch (error) {
    ElMessage.error(error?.data?.message || "加载兑换记录失败");
  } finally {
    redemptionsLoading.value = false;
  }
};

const loadPageData = async () => {
  await Promise.all([loadCampaigns(), loadCodes(), loadRedemptions()]);
};

const openCreateCampaignDialog = () => {
  resetCampaignForm();
  campaignDialogVisible.value = true;
};

const openEditCampaignDialog = (campaign) => {
  Object.assign(campaignForm, {
    name: campaign.name,
    description: campaign.description || "",
    points: campaign.points,
    rewardMode: campaign.pointsExpiresInMinutes ? "temporary" : "permanent",
    pointsExpiresInMinutes: campaign.pointsExpiresInMinutes || 1440,
    enabled: campaign.enabled,
    startsAt: toDateValue(campaign.startsAt),
    endsAt: toDateValue(campaign.endsAt),
    maxRedemptionsPerUser: campaign.maxRedemptionsPerUser || 1,
  });
  editingCampaignId.value = campaign.id;
  editingCampaignSnapshot.value = campaign;
  campaignDialogVisible.value = true;
};

const saveCampaign = async () => {
  try {
    await campaignFormRef.value.validate();
    savingCampaign.value = true;
    const isEditing = Boolean(editingCampaignId.value);
    const endpoint = isEditing
      ? `/api/admin/points/redemption-codes/campaigns/${editingCampaignId.value}`
      : "/api/admin/points/redemption-codes/campaigns";
    const res = await $fetch(endpoint, {
      method: isEditing ? "PUT" : "POST",
      body: toCampaignPayload(),
      headers: authHeaders(),
    });

    if (res.code === 200) {
      ElMessage.success(res.msg || "保存成功");
      campaignDialogVisible.value = false;
      await loadCampaigns();
      await loadCodes();
      return;
    }
    ElMessage.error(res.msg || "保存失败");
  } catch (error) {
    ElMessage.error(error?.data?.message || error?.message || "保存失败");
  } finally {
    savingCampaign.value = false;
  }
};

const toggleCampaign = async (campaign) => {
  try {
    const res = await $fetch(`/api/admin/points/redemption-codes/campaigns/${campaign.id}`, {
      method: "PUT",
      body: {
        ...campaign,
        rewardMode: campaign.pointsExpiresInMinutes ? "temporary" : "permanent",
        enabled: !campaign.enabled,
      },
      headers: authHeaders(),
    });
    if (res.code === 200) {
      ElMessage.success(campaign.enabled ? "活动已禁用" : "活动已启用");
      await loadCampaigns();
      return;
    }
    ElMessage.error(res.msg || "更新失败");
  } catch (error) {
    ElMessage.error(error?.data?.message || "更新失败");
  }
};

const openGenerateDialog = (campaign) => {
  generationCampaignId.value = campaign.id;
  resetGenerateForm();
  generateDialogVisible.value = true;
};

const generateCodes = async () => {
  if (!generationCampaignId.value) return;

  try {
    await generateFormRef.value.validate();
    generatingCodes.value = true;
    const res = await $fetch(`/api/admin/points/redemption-codes/campaigns/${generationCampaignId.value}/codes`, {
      method: "POST",
      body: {
        quantity: generateForm.quantity,
        prefix: generateForm.prefix,
        batchName: generateForm.batchName,
        maxRedemptions: generateForm.maxRedemptions,
        enabled: generateForm.enabled,
      },
      headers: authHeaders(),
    });

    if (res.code === 200) {
      generatedCodes.value = res.data?.codes || [];
      ElMessage.success(res.msg || "兑换码已生成");
      selectedCampaignId.value = generationCampaignId.value;
      await loadCampaigns();
      await loadCodes();
      return;
    }
    ElMessage.error(res.msg || "生成失败");
  } catch (error) {
    ElMessage.error(error?.data?.message || error?.message || "生成失败");
  } finally {
    generatingCodes.value = false;
  }
};

watch(selectedCampaignId, () => {
  loadCodes();
});

onMounted(() => {
  loadPageData();
});
</script>
