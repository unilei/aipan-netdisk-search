<template>
  <div class="space-y-6">
    <div class="admin-card-bg rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <i class="fas fa-filter text-orange-500"></i>
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
              敏感词
            </h1>
            <el-tag v-if="moderationForm.enabled" type="success" size="small">
              已启用
            </el-tag>
            <el-tag v-else type="info" size="small">已禁用</el-tag>
          </div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            管理内容审核策略、敏感词库、搜索白名单和场景命中测试。
          </p>
        </div>
        <el-switch
          v-model="moderationForm.enabled"
          active-text="启用审核"
          inactive-text="关闭审核"
        />
      </div>
    </div>

    <div class="admin-card-bg rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div class="mb-5">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          策略配置
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          搜索只拦截高风险词；中低风险词允许搜索但不计入排行榜。论坛和投稿会按风险进入人工审核或拒绝。
        </p>
      </div>

      <el-form label-width="120px">
        <el-form-item label="搜索白名单">
          <el-input
            v-model="moderationForm.customAllowedWordsText"
            type="textarea"
            :rows="5"
            placeholder="每行一个词。命中白名单时跳过默认敏感词命中。"
            :disabled="!moderationForm.enabled"
          />
        </el-form-item>

        <el-form-item label="强拦截词">
          <el-input
            v-model="moderationForm.customBlockedWordsText"
            type="textarea"
            :rows="5"
            placeholder="每行一个词。命中后按高风险处理。"
            :disabled="!moderationForm.enabled"
          />
        </el-form-item>
      </el-form>
    </div>

    <div class="admin-card-bg rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            敏感词库
          </h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            自定义词条支持分类、风险等级和启用状态。中风险在搜索中允许但不计入榜单，在论坛和投稿中进入人工审核；高风险会直接拦截。
          </p>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div class="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
            <div class="text-xs text-gray-500 dark:text-gray-400">内置词库</div>
            <div class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {{ moderationForm.defaultLibrarySummary.total || 0 }}
            </div>
          </div>
          <div class="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
            <div class="text-xs text-gray-500 dark:text-gray-400">自定义词条</div>
            <div class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {{ moderationForm.customRules.length }}
            </div>
          </div>
          <div class="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
            <div class="text-xs text-gray-500 dark:text-gray-400">已启用</div>
            <div class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {{ enabledCustomRuleCount }}
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="defaultCategorySummaryItems.length"
        class="mb-5 flex flex-wrap items-center gap-2 text-xs"
      >
        <span class="text-gray-500 dark:text-gray-400">内置分类</span>
        <el-tag
          v-for="item in defaultCategorySummaryItems"
          :key="item.category"
          size="small"
          type="info"
        >
          {{ item.label }} {{ item.count }}
        </el-tag>
      </div>

      <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <div class="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_140px_auto_auto]">
          <el-input
            v-model="customRuleForm.word"
            placeholder="输入敏感词或短语"
            :disabled="!moderationForm.enabled"
            @keyup.enter="addCustomRule"
          />
          <el-select
            v-model="customRuleForm.category"
            placeholder="分类"
            :disabled="!moderationForm.enabled"
          >
            <el-option
              v-for="category in moderationCategoryOptions"
              :key="category.value"
              :label="category.label"
              :value="category.value"
            />
          </el-select>
          <el-select
            v-model="customRuleForm.risk"
            placeholder="风险"
            :disabled="!moderationForm.enabled"
          >
            <el-option
              v-for="risk in moderationRiskOptions"
              :key="risk.value"
              :label="risk.label"
              :value="risk.value"
            />
          </el-select>
          <el-switch
            v-model="customRuleForm.enabled"
            active-text="启用"
            inactive-text="停用"
            :disabled="!moderationForm.enabled"
          />
          <el-button
            type="primary"
            plain
            :disabled="!moderationForm.enabled"
            @click="addCustomRule"
          >
            添加
          </el-button>
        </div>
      </div>

      <el-table
        v-if="moderationForm.customRules.length"
        :data="moderationForm.customRules"
        class="mt-4"
        border
      >
        <el-table-column label="词条" min-width="180">
          <template #default="{ row }">
            <el-input
              v-model="row.word"
              placeholder="敏感词"
              :disabled="!moderationForm.enabled"
            />
          </template>
        </el-table-column>
        <el-table-column label="分类" width="180">
          <template #default="{ row }">
            <el-select
              v-model="row.category"
              class="w-full"
              :disabled="!moderationForm.enabled"
            >
              <el-option
                v-for="category in moderationCategoryOptions"
                :key="category.value"
                :label="category.label"
                :value="category.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="风险" width="140">
          <template #default="{ row }">
            <el-select
              v-model="row.risk"
              class="w-full"
              :disabled="!moderationForm.enabled"
            >
              <el-option
                v-for="risk in moderationRiskOptions"
                :key="risk.value"
                :label="risk.label"
                :value="risk.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              :disabled="!moderationForm.enabled"
            />
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="180">
          <template #default="{ row }">
            <div class="flex flex-wrap items-center gap-2">
              <el-tag :type="getRiskTagType(row.risk)" size="small">
                {{ getRiskLabel(row.risk) }}
              </el-tag>
              <el-tag size="small" type="info">
                {{ getCategoryLabel(row.category) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ $index }">
            <el-button
              size="small"
              type="danger"
              plain
              @click="removeCustomRule($index)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-else
        class="mt-4"
        description="暂无自定义敏感词"
      />

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <el-button
          type="primary"
          :loading="moderationLoading"
          @click="handleModerationSubmit"
        >
          保存词库
        </el-button>
      </div>
    </div>

    <div class="admin-card-bg rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div class="mb-5">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          命中测试
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          使用当前已保存的审核配置测试不同场景下的处理结果。
        </p>
      </div>

      <el-form label-width="120px">
        <el-form-item label="命中测试">
          <div class="w-full space-y-3">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr_auto]">
              <el-select
                v-model="moderationForm.testContext"
                class="w-full"
                placeholder="选择场景"
              >
                <el-option
                  v-for="context in moderationContextOptions"
                  :key="context.value"
                  :label="context.label"
                  :value="context.value"
                />
              </el-select>
              <el-input
                v-model="moderationForm.testText"
                placeholder="输入要测试的内容"
                @keyup.enter="handleModerationTest"
              />
              <el-button
                type="warning"
                :loading="moderationTesting"
                @click="handleModerationTest"
              >
                测试
              </el-button>
            </div>

            <div
              v-if="moderationTestResult"
              class="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700"
            >
              <div class="flex flex-wrap items-center gap-2">
                <el-tag>{{ moderationTestResult.action }}</el-tag>
                <el-tag :type="moderationTestResult.allowed ? 'success' : 'danger'">
                  {{ moderationTestResult.allowed ? "允许" : "拦截" }}
                </el-tag>
                <el-tag type="warning">
                  风险：{{ moderationTestResult.risk }}
                </el-tag>
                <el-tag :type="moderationTestResult.shouldRecord ? 'success' : 'info'">
                  {{ moderationTestResult.shouldRecord ? "计入榜单" : "不计入榜单" }}
                </el-tag>
              </div>
              <div
                v-if="moderationTestResult.matches?.length"
                class="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-400"
              >
                <div
                  v-for="match in moderationTestResult.matches"
                  :key="`${match.word}-${match.category}-${match.risk}`"
                >
                  {{ match.word }} / {{ match.category }} / {{ match.risk }}
                </div>
              </div>
              <div
                v-else
                class="mt-3 text-xs text-gray-500 dark:text-gray-400"
              >
                未命中敏感词。
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <div class="flex flex-wrap items-center gap-3">
            <el-button
              type="primary"
              :loading="moderationLoading"
              @click="handleModerationSubmit"
            >
              保存配置
            </el-button>
            <el-button @click="resetModerationForm">
              恢复默认
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "admin",
  middleware: ["admin"],
});

const moderationLoading = ref(false);
const moderationTesting = ref(false);
const moderationTestResult = ref(null);

const moderationForm = reactive({
  enabled: true,
  customAllowedWordsText: "",
  customBlockedWordsText: "",
  customRules: [],
  defaultLibrarySummary: {
    total: 0,
    categories: {},
    risks: {},
  },
  testContext: "netdisk_search",
  testText: "",
});

const customRuleForm = reactive({
  word: "",
  category: "custom",
  risk: "medium",
  enabled: true,
});

const moderationContextOptions = [
  { label: "网盘搜索", value: "netdisk_search" },
  { label: "AI 搜索", value: "ai_search" },
  { label: "用户文章", value: "blog_post" },
  { label: "博客评论", value: "blog_comment" },
  { label: "论坛主题", value: "forum_topic" },
  { label: "论坛回复", value: "forum_reply" },
  { label: "用户投稿", value: "user_resource" },
];

const moderationCategoryOptions = [
  { label: "自定义", value: "custom" },
  { label: "赌博博彩", value: "gambling" },
  { label: "色情低俗", value: "porn" },
  { label: "诈骗黑产", value: "fraud" },
  { label: "非法金融", value: "illegal_finance" },
  { label: "传销拉人头", value: "pyramid_scheme" },
  { label: "邪教极端", value: "cult" },
  { label: "暴力危险", value: "violence" },
  { label: "政治人物", value: "political_person" },
  { label: "广告/上下文风险", value: "spam_or_contextual" },
];

const moderationRiskOptions = [
  { label: "中风险", value: "medium" },
  { label: "高风险", value: "high" },
  { label: "低风险", value: "low" },
];

const categoryLabelMap = Object.fromEntries(
  moderationCategoryOptions.map((category) => [category.value, category.label])
);

const riskLabelMap = Object.fromEntries(
  moderationRiskOptions.map((risk) => [risk.value, risk.label])
);

const enabledCustomRuleCount = computed(() =>
  moderationForm.customRules.filter((rule) => rule.enabled !== false).length
);

const getCategoryLabel = (category) => categoryLabelMap[category] || category || "自定义";

const defaultCategorySummaryItems = computed(() =>
  Object.entries(moderationForm.defaultLibrarySummary.categories || {})
    .map(([category, count]) => ({
      category,
      label: getCategoryLabel(category),
      count: Number(count) || 0,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
);

const authHeaders = () => ({
  Authorization: `Bearer ${useCookie("token").value}`,
});

const formatModerationWordList = (words = []) => {
  return Array.isArray(words) ? words.join("\n") : "";
};

const parseModerationWordText = (text) => {
  return String(text || "")
    .split(/\r?\n|,/)
    .map((word) => word.trim())
    .filter(Boolean);
};

const normalizeCustomRules = (rules = []) => {
  const normalizedRules = [];
  const seen = new Set();

  for (const rule of Array.isArray(rules) ? rules : []) {
    const word = String(rule?.word || "").trim();
    if (!word) continue;

    const category = String(rule?.category || "custom").trim() || "custom";
    const risk = ["low", "medium", "high"].includes(rule?.risk)
      ? rule.risk
      : "medium";
    const key = `${word}:${category}`;

    if (seen.has(key)) continue;
    seen.add(key);
    normalizedRules.push({
      word,
      category,
      risk,
      enabled: rule?.enabled !== false,
    });
  }

  return normalizedRules;
};

const getRiskLabel = (risk) => riskLabelMap[risk] || "中风险";

const getRiskTagType = (risk) => {
  if (risk === "high") return "danger";
  if (risk === "low") return "info";
  return "warning";
};

const applyModerationConfig = (config = {}) => {
  moderationForm.enabled = config.enabled ?? true;
  moderationForm.customAllowedWordsText = formatModerationWordList(
    config.customAllowedWords
  );
  moderationForm.customBlockedWordsText = formatModerationWordList(
    config.customBlockedWords
  );
  moderationForm.customRules = normalizeCustomRules(config.customRules);
  moderationForm.defaultLibrarySummary = {
    total: config.defaultLibrarySummary?.total || 0,
    categories: config.defaultLibrarySummary?.categories || {},
    risks: config.defaultLibrarySummary?.risks || {},
  };
};

const addCustomRule = () => {
  const word = customRuleForm.word.trim();
  if (!word) {
    ElMessage.warning("请输入敏感词");
    return;
  }

  const duplicated = moderationForm.customRules.some(
    (rule) => rule.word === word && rule.category === customRuleForm.category
  );
  if (duplicated) {
    ElMessage.warning("词库中已存在相同词条");
    return;
  }

  moderationForm.customRules.push({
    word,
    category: customRuleForm.category,
    risk: customRuleForm.risk,
    enabled: customRuleForm.enabled,
  });
  customRuleForm.word = "";
  customRuleForm.category = "custom";
  customRuleForm.risk = "medium";
  customRuleForm.enabled = true;
};

const removeCustomRule = (index) => {
  moderationForm.customRules.splice(index, 1);
};

const getModerationConfig = async () => {
  try {
    const res = await $fetch("/api/admin/settings/moderation", {
      headers: authHeaders(),
    });

    if (res.code === 200) {
      applyModerationConfig(res.data);
    } else {
      ElMessage.error(res.msg || "获取敏感词配置失败");
    }
  } catch (error) {
    console.error("获取敏感词配置失败:", error);
    ElMessage.error("获取敏感词配置失败");
  }
};

const handleModerationSubmit = async () => {
  try {
    moderationLoading.value = true;

    const res = await $fetch("/api/admin/settings/moderation", {
      method: "POST",
      body: {
        enabled: moderationForm.enabled,
        customAllowedWords: parseModerationWordText(
          moderationForm.customAllowedWordsText
        ),
        customBlockedWords: parseModerationWordText(
          moderationForm.customBlockedWordsText
        ),
        customRules: normalizeCustomRules(moderationForm.customRules),
      },
      headers: authHeaders(),
    });

    if (res.code === 200) {
      ElMessage.success("敏感词配置保存成功");
      applyModerationConfig(res.data);
    } else {
      ElMessage.error(res.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存敏感词配置失败:", error);
    ElMessage.error("保存敏感词配置失败");
  } finally {
    moderationLoading.value = false;
  }
};

const handleModerationTest = async () => {
  if (!moderationForm.testText.trim()) {
    ElMessage.warning("请输入测试内容");
    return;
  }

  try {
    moderationTesting.value = true;
    const res = await $fetch("/api/admin/settings/moderation/check", {
      method: "POST",
      body: {
        text: moderationForm.testText,
        context: moderationForm.testContext,
      },
      headers: authHeaders(),
    });

    if (res.code === 200) {
      moderationTestResult.value = res.data;
    } else {
      ElMessage.error(res.msg || "测试失败");
    }
  } catch (error) {
    console.error("敏感词测试失败:", error);
    ElMessage.error("敏感词测试失败");
  } finally {
    moderationTesting.value = false;
  }
};

const resetModerationForm = () => {
  ElMessageBox.confirm("确定要恢复默认敏感词配置吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    moderationForm.enabled = true;
    moderationForm.customAllowedWordsText = "";
    moderationForm.customBlockedWordsText = "";
    moderationForm.customRules = [];
    moderationTestResult.value = null;
    handleModerationSubmit();
  });
};

onMounted(() => {
  getModerationConfig();
});
</script>
