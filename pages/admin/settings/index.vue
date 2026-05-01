<template>
  <div class="admin-page-bg">
    <div class="mx-auto space-y-6">
      <!-- 头部 -->
      <div class="admin-card-bg rounded-lg p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              系统配置
            </h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">
              管理系统相关配置信息
            </p>
          </div>
        </div>
      </div>

      <!-- 邮箱服务配置 -->
      <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-semibold dark:text-gray-200">
              邮箱服务配置
            </h2>
            <el-tag v-if="emailForm.enabled" type="success" size="small">
              已启用
            </el-tag>
            <el-tag v-else type="info" size="small">已禁用</el-tag>
          </div>
          <div class="flex items-center gap-4">
            <el-switch
              v-model="emailForm.enabled"
              active-text="启用验证"
              inactive-text="关闭验证"
              class="ml-2"
            />
          </div>
        </div>

        <el-form
          ref="emailFormRef"
          :model="emailForm"
          :rules="emailRules"
          label-width="140px"
        >
          <el-form-item label="邮件服务商">
            <el-input value="Resend" disabled />
          </el-form-item>

          <el-form-item label="Resend API Key" prop="apiKey">
            <el-input
              v-model="emailForm.apiKey"
              type="password"
              show-password
              :placeholder="
                emailConfigMeta.hasApiKey
                  ? `已配置：${emailConfigMeta.apiKeyMasked}`
                  : '请输入 Resend API Key'
              "
            />
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              留空表示继续使用当前已保存的 API Key
            </div>
          </el-form-item>

          <el-form-item label="发件邮箱" prop="fromEmail">
            <el-input
              v-model="emailForm.fromEmail"
              placeholder="noreply@yourdomain.com"
            />
          </el-form-item>

          <el-form-item label="发件人名称">
            <el-input
              v-model="emailForm.fromName"
              placeholder="爱盼"
            />
          </el-form-item>

          <el-form-item label="Reply-To" prop="replyTo">
            <el-input
              v-model="emailForm.replyTo"
              placeholder="support@yourdomain.com"
            />
          </el-form-item>

          <el-form-item label="站点地址" prop="siteUrl">
            <el-input
              v-model="emailForm.siteUrl"
              placeholder="https://www.aipan.me"
            />
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              邮件中的激活链接将指向该地址下的 /email-verify 页面
            </div>
          </el-form-item>

          <el-form-item label="激活有效期(分钟)" prop="verificationExpireMinutes">
            <el-input-number
              v-model="emailForm.verificationExpireMinutes"
              :min="5"
              :max="1440"
              :step="5"
              class="w-full"
            />
          </el-form-item>

          <el-form-item label="新用户验证">
            <el-switch
              v-model="emailForm.requireVerificationForNewUsers"
              active-text="注册必须激活"
              inactive-text="注册后直接可用"
            />
          </el-form-item>

          <el-form-item label="测试邮箱">
            <div class="w-full space-y-3">
              <el-input
                v-model="emailForm.testEmail"
                placeholder="输入一个测试邮箱，发送测试邮件"
              />
              <el-button
                type="warning"
                :loading="emailTesting"
                @click="handleEmailTest"
              >
                发送测试邮件
              </el-button>
            </div>
          </el-form-item>

          <el-form-item>
            <div class="flex items-center gap-4">
              <el-button
                type="primary"
                @click="handleEmailSubmit"
                :loading="emailLoading"
              >
                保存配置
              </el-button>
              <el-button @click="resetEmailForm">重置表单</el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 群二维码配置 -->
      <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-semibold dark:text-gray-200">
              群二维码配置
            </h2>
            <el-tag v-if="groupQrForm.enabled" type="success" size="small"
              >已启用</el-tag
            >
            <el-tag v-else type="info" size="small">已禁用</el-tag>
          </div>
          <div class="flex items-center gap-4">
            <el-switch
              v-model="groupQrForm.enabled"
              active-text="启用显示"
              inactive-text="关闭显示"
              class="ml-2"
              @change="handleGroupQrEnabledChange"
            />
          </div>
        </div>

        <el-form
          ref="groupQrFormRef"
          :model="groupQrForm"
          :rules="groupQrRules"
          label-width="120px"
        >
          <el-form-item label="标题" prop="title">
            <el-input
              v-model="groupQrForm.title"
              placeholder="请输入显示标题"
              :disabled="!groupQrForm.enabled"
            />
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              在搜索结果和页面头部显示的标题文字
            </div>
          </el-form-item>

          <el-form-item label="描述" prop="description">
            <el-input
              v-model="groupQrForm.description"
              type="textarea"
              :rows="2"
              placeholder="请输入描述信息"
              :disabled="!groupQrForm.enabled"
            />
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              显示在二维码下方的描述文字
            </div>
          </el-form-item>

          <el-form-item label="二维码图片" prop="qrCodeUrl">
            <el-input
              v-model="groupQrForm.qrCodeUrl"
              placeholder="请输入二维码图片链接"
              :disabled="!groupQrForm.enabled"
            >
              <template #prepend>
                <span>URL</span>
              </template>
            </el-input>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              请输入二维码图片的完整URL地址，支持 https:// 或 http:// 链接
            </div>
          </el-form-item>

          <el-form-item label="显示位置">
            <div class="space-y-2">
              <el-checkbox
                v-model="groupQrForm.showInHeader"
                :disabled="!groupQrForm.enabled"
              >
                页面头部（右上角）
              </el-checkbox>
              <br />
              <el-checkbox
                v-model="groupQrForm.showInSearchResults"
                :disabled="!groupQrForm.enabled"
              >
                搜索结果首条
              </el-checkbox>
            </div>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              选择二维码显示的位置
            </div>
          </el-form-item>

          <el-form-item>
            <div class="flex items-center gap-4">
              <el-button
                type="primary"
                @click="handleGroupQrSubmit"
                :loading="groupQrLoading"
                :disabled="!groupQrForm.enabled"
              >
                保存配置
              </el-button>
              <el-button
                @click="resetGroupQrForm"
                :disabled="!groupQrForm.enabled"
              >
                重置表单
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 音乐验证码配置 -->
      <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-semibold dark:text-gray-200">
              音乐验证码配置
            </h2>
            <el-tag v-if="musicForm.enabled" type="success" size="small"
              >已启用</el-tag
            >
            <el-tag v-else type="info" size="small">已禁用</el-tag>
          </div>
          <div class="flex items-center gap-4">
            <el-switch
              v-model="musicForm.enabled"
              active-text="启用验证"
              inactive-text="关闭验证"
              class="ml-2"
              @change="handleMusicEnabledChange"
            />
          </div>
        </div>

        <el-form
          ref="musicFormRef"
          :model="musicForm"
          :rules="musicRules"
          label-width="120px"
          :disabled="!musicForm.enabled"
        >
          <el-form-item label="访问密码" prop="password">
            <el-input
              v-model="musicForm.password"
              placeholder="请输入音乐页面访问密码"
              :disabled="!musicForm.enabled"
              show-password
            >
              <template #append>
                <el-button @click="resetMusicPassword"> 重置 </el-button>
              </template>
            </el-input>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              默认密码：aipan.me2026
            </div>
          </el-form-item>

          <el-form-item>
            <div class="flex items-center gap-4">
              <el-button
                type="primary"
                @click="handleMusicSubmit"
                :loading="musicLoading"
                :disabled="!musicForm.enabled"
              >
                保存配置
              </el-button>
              <el-button @click="resetMusicForm" :disabled="!musicForm.enabled">
                重置表单
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 访问限制配置 -->
      <div class="bg-white rounded-lg p-6 shadow-sm mb-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-semibold dark:text-gray-200">
              访问限制配置
            </h2>
            <el-tag v-if="accessControlForm.enabled" type="success" size="small">
              已启用
            </el-tag>
            <el-tag v-else type="info" size="small">已禁用</el-tag>
          </div>
          <el-switch
            v-model="accessControlForm.enabled"
            active-text="启用限制"
            inactive-text="关闭限制"
          />
        </div>

        <el-alert
          title="仅校验用户是否达到积分门槛，不会扣除积分。服务端会同步保护核心接口。"
          type="info"
          :closable="false"
          class="mb-4"
        />

        <el-form
          ref="accessControlFormRef"
          :model="accessControlForm"
          :rules="accessControlRules"
          label-width="120px"
        >
          <el-form-item label="限制模式">
            <el-input value="登录状态 + 最低积分门槛" disabled />
          </el-form-item>

          <el-form-item label="必须登录">
            <el-switch
              v-model="accessControlForm.requireLogin"
              active-text="需要登录"
              inactive-text="不强制登录"
              :disabled="!accessControlForm.enabled"
            />
          </el-form-item>

          <el-form-item label="最低积分" prop="minPoints">
            <el-input-number
              v-model="accessControlForm.minPoints"
              :min="0"
              :max="100000000"
              :step="100"
              :disabled="!accessControlForm.enabled"
              class="w-full"
            />
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              默认 10000；设置为 0 表示只要求登录。
            </div>
          </el-form-item>

          <el-form-item label="受限功能">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              <el-checkbox
                v-for="feature in accessControlFeatureOptions"
                :key="feature.key"
                v-model="accessControlForm.protectedFeatures[feature.key]"
                :disabled="!accessControlForm.enabled"
              >
                <div>
                  <div class="text-sm font-medium">{{ feature.label }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ feature.description }}
                  </div>
                </div>
              </el-checkbox>
            </div>
          </el-form-item>

          <el-form-item>
            <div class="flex items-center gap-4">
              <el-button
                type="primary"
                @click="handleAccessControlSubmit"
                :loading="accessControlLoading"
              >
                保存配置
              </el-button>
              <el-button @click="resetAccessControlForm">
                恢复默认
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 夸克网盘配置 -->
      <div class="admin-card-bg rounded-lg p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-semibold">夸克网盘配置</h2>
            <el-tag v-if="form.enabled" type="success" size="small"
              >已启用</el-tag
            >
            <el-tag v-else type="info" size="small">已禁用</el-tag>
          </div>
          <div class="flex items-center gap-4">
            <el-switch
              v-model="form.enabled"
              active-text="启用转存"
              inactive-text="关闭转存"
              class="ml-2"
              @change="handleEnabledChange"
            />
          </div>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
          <el-form-item label="API URL" prop="apiUrl">
            <el-input
              v-model="form.apiUrl"
              placeholder="请输入 API URL"
              :disabled="!form.enabled"
            >
              <template #append>
                <el-button @click="resetApiUrl"> 重置 </el-button>
              </template>
            </el-input>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              默认值：http://127.0.0.1:5000/api/quark/sharepage/save
            </div>
          </el-form-item>

          <el-form-item label="Quark Cookie" prop="quarkCookie">
            <el-input
              v-model="form.quarkCookie"
              type="textarea"
              :rows="3"
              placeholder="请输入夸克网盘 Cookie"
              :disabled="!form.enabled"
            />
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              请从夸克网盘页面获取 Cookie，确保包含必要的认证信息
            </div>
          </el-form-item>

          <el-form-item label="资源类型" prop="typeId">
            <el-select
              v-model="form.typeId"
              placeholder="请选择资源类型"
              class="w-full"
              :disabled="!form.enabled"
            >
              <el-option
                v-for="type in resourceTypes"
                :key="type.id"
                :label="type.name"
                :value="type.id"
              />
            </el-select>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              选择转存资源的默认分类
            </div>
          </el-form-item>

          <el-divider></el-divider>

          <div class="mb-4">
            <h3 class="text-base font-medium text-gray-900">访问验证配置</h3>
            <p class="text-xs text-gray-500 mt-1">
              配置用户访问站点前需要提交的夸克转存信息
            </p>
          </div>

          <el-form-item label="开启验证">
            <el-switch
              v-model="form.verificationEnabled"
              active-text="启用验证"
              inactive-text="关闭验证"
            />
          </el-form-item>

          <el-form-item label="访问验证链接" prop="accessVerificationShareLink">
            <el-input
              v-model="form.accessVerificationShareLink"
              placeholder="请输入访问验证需要用户转存的夸克分享链接"
              :disabled="!form.verificationEnabled"
            />
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              用户点击网盘资源前提交的转存链接将与此链接内容比对，仅支持无提取码的公开链接
            </div>
          </el-form-item>

          <el-form-item label="访问时长(分钟)" prop="accessDurationMinutes">
            <el-input-number
              v-model="form.accessDurationMinutes"
              :min="5"
              :max="1440"
              :step="5"
              :disabled="!form.verificationEnabled"
              class="w-full"
            />
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              验证通过后允许访问的时长，最终到期不会超过当日24点；默认
              {{ DEFAULT_ACCESS_DURATION }} 分钟
            </div>
          </el-form-item>

          <el-divider></el-divider>

          <div class="mb-4">
            <h3 class="text-base font-medium text-gray-900">转存积分奖励</h3>
            <p class="text-xs text-gray-500 mt-1">
              积分中心的独立转存任务；登录用户完成后获得限时积分，同一个分享链接只奖励一次。
            </p>
          </div>

          <el-form-item label="奖励状态">
            <el-switch
              v-model="form.transferRewardEnabled"
              active-text="启用奖励"
              inactive-text="关闭奖励"
            />
          </el-form-item>

          <el-form-item label="积分任务链接" prop="transferRewardShareLink">
            <el-input
              v-model="form.transferRewardShareLink"
              placeholder="请输入积分任务需要用户转存的夸克分享链接"
              :disabled="!form.transferRewardEnabled"
            />
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              签到页“转存获取积分”会展示这个链接，独立于访问验证链接。
            </div>
          </el-form-item>

          <el-form-item label="奖励积分" prop="transferRewardPoints">
            <el-input-number
              v-model="form.transferRewardPoints"
              :min="1"
              :max="100000000"
              :step="100"
              :disabled="!form.transferRewardEnabled"
              class="w-full"
            />
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              默认 {{ DEFAULT_TRANSFER_REWARD_POINTS }} 分，计入有效积分但不写入永久余额。
            </div>
          </el-form-item>

          <el-form-item label="有效期(分钟)" prop="transferRewardDurationMinutes">
            <el-input-number
              v-model="form.transferRewardDurationMinutes"
              :min="1"
              :max="525600"
              :step="60"
              :disabled="!form.transferRewardEnabled"
              class="w-full"
            />
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              默认 {{ DEFAULT_TRANSFER_REWARD_DURATION }} 分钟，也就是 24 小时。
            </div>
          </el-form-item>

          <el-form-item>
            <div class="flex items-center gap-4">
              <el-button
                type="primary"
                @click="handleSubmit"
                :loading="loading"
              >
                保存配置
              </el-button>
              <el-button @click="resetForm"> 重置表单 </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "admin",
  middleware: ["admin"],
});

const formRef = ref(null);
const emailFormRef = ref(null);
const loading = ref(false);
const emailLoading = ref(false);
const emailTesting = ref(false);
const musicLoading = ref(false);
const groupQrLoading = ref(false);
const accessControlLoading = ref(false);
const resourceTypes = ref([]);

const musicForm = reactive({
  enabled: true,
  password: "aipan.me2026",
});

const groupQrForm = reactive({
  enabled: true,
  title: "为防止网站和谐，请扫码获取最新网址",
  description: "长按识别二维码或扫码进群",
  qrCodeUrl: "",
  showInHeader: true,
  showInSearchResults: true,
});

const emailConfigMeta = reactive({
  hasApiKey: false,
  apiKeyMasked: "",
});

const emailForm = reactive({
  enabled: false,
  provider: "resend",
  apiKey: "",
  fromEmail: "",
  fromName: "爱盼",
  replyTo: "",
  siteUrl: "",
  verificationExpireMinutes: 60,
  requireVerificationForNewUsers: true,
  testEmail: "",
});

const DEFAULT_ACCESS_CONTROL_FEATURES = {
  netdiskSearch: true,
  aiSearch: true,
  tvLive: true,
  tvbox: true,
  dailyMovieResources: true,
  music: true,
};

const DEFAULT_ACCESS_CONTROL_CONFIG = {
  enabled: true,
  requireLogin: true,
  minPoints: 10000,
  protectedFeatures: { ...DEFAULT_ACCESS_CONTROL_FEATURES },
};

const accessControlFeatureOptions = [
  {
    key: "netdiskSearch",
    label: "网盘搜索",
    description: "搜索页和多源网盘资源接口",
  },
  {
    key: "aiSearch",
    label: "AI 网盘搜索",
    description: "AI 对话式资源搜索入口",
  },
  {
    key: "tvLive",
    label: "TV 直播",
    description: "直播频道源和播放入口",
  },
  {
    key: "tvbox",
    label: "TVBox",
    description: "TVBox 数据源和缓存接口",
  },
  {
    key: "dailyMovieResources",
    label: "每日电影资源列表",
    description: "每日电影页默认加载的网盘资源",
  },
  {
    key: "music",
    label: "音乐",
    description: "音乐搜索、榜单、试听和下载接口",
  },
];

const accessControlForm = reactive({
  enabled: DEFAULT_ACCESS_CONTROL_CONFIG.enabled,
  requireLogin: DEFAULT_ACCESS_CONTROL_CONFIG.requireLogin,
  minPoints: DEFAULT_ACCESS_CONTROL_CONFIG.minPoints,
  protectedFeatures: { ...DEFAULT_ACCESS_CONTROL_FEATURES },
});

const { setAccessControlConfig } = useAccessControlConfig();

const DEFAULT_API_URL = "http://127.0.0.1:5000/api/quark/sharepage/save";
const DEFAULT_ACCESS_DURATION = 1440;
const DEFAULT_TRANSFER_REWARD_POINTS = 1000;
const DEFAULT_TRANSFER_REWARD_DURATION = 1440;

const form = reactive({
  apiUrl: "",
  quarkCookie: "",
  typeId: "",
  enabled: false,
  verificationEnabled: false,
  shareLink: "",
  accessVerificationShareLink: "",
  accessDurationMinutes: DEFAULT_ACCESS_DURATION,
  transferRewardEnabled: true,
  transferRewardShareLink: "",
  transferRewardPoints: DEFAULT_TRANSFER_REWARD_POINTS,
  transferRewardDurationMinutes: DEFAULT_TRANSFER_REWARD_DURATION,
});

const musicRules = {
  password: [
    { required: true, message: "请输入访问密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于6位", trigger: "blur" },
  ],
};

const validateEmailAddress = (_rule, value, callback) => {
  if (!value) {
    callback();
    return;
  }

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (!isValid) {
    callback(new Error("请输入有效的邮箱地址"));
    return;
  }

  callback();
};

const validateEmailApiKey = (_rule, value, callback) => {
  if (!emailForm.enabled) {
    callback();
    return;
  }

  if (!value && !emailConfigMeta.hasApiKey) {
    callback(new Error("启用邮箱验证时必须配置 API Key"));
    return;
  }

  callback();
};

const validateEmailRequired = (message) => {
  return (_rule, value, callback) => {
    if (!emailForm.enabled) {
      callback();
      return;
    }

    if (!value || !String(value).trim()) {
      callback(new Error(message));
      return;
    }

    callback();
  };
};

const validateEmailSiteUrl = (_rule, value, callback) => {
  if (!emailForm.enabled) {
    callback();
    return;
  }

  if (!value || !String(value).trim()) {
    callback(new Error("请输入站点地址"));
    return;
  }

  try {
    new URL(value);
    callback();
  } catch (error) {
    callback(new Error("请输入有效的站点地址"));
  }
};

const validateExpireMinutes = (_rule, value, callback) => {
  if (!emailForm.enabled) {
    callback();
    return;
  }

  if (typeof value !== "number" || value < 5 || value > 1440) {
    callback(new Error("激活有效期需要在 5 到 1440 分钟之间"));
    return;
  }

  callback();
};

const emailRules = {
  apiKey: [{ validator: validateEmailApiKey, trigger: "blur" }],
  fromEmail: [
    { validator: validateEmailRequired("请输入发件邮箱"), trigger: "blur" },
    { validator: validateEmailAddress, trigger: "blur" },
  ],
  replyTo: [{ validator: validateEmailAddress, trigger: "blur" }],
  siteUrl: [{ validator: validateEmailSiteUrl, trigger: "blur" }],
  verificationExpireMinutes: [
    { validator: validateExpireMinutes, trigger: ["change", "blur"] },
  ],
};

const accessControlRules = {
  minPoints: [
    {
      validator: (_rule, value, callback) => {
        if (!accessControlForm.enabled) {
          callback();
          return;
        }

        if (typeof value !== "number" || value < 0 || value > 100000000) {
          callback(new Error("最低积分需要在 0 到 100000000 之间"));
          return;
        }

        callback();
      },
      trigger: ["blur", "change"],
    },
  ],
};

const groupQrRules = {
  title: [
    { required: true, message: "请输入标题", trigger: "blur" },
    {
      min: 1,
      max: 100,
      message: "标题长度在 1 到 100 个字符",
      trigger: "blur",
    },
  ],
  description: [
    { max: 200, message: "描述长度不能超过 200 个字符", trigger: "blur" },
  ],
  qrCodeUrl: [
    {
      validator: (rule, value, callback) => {
        if (!groupQrForm.enabled) {
          callback();
          return;
        }
        if (!value || value.trim() === "") {
          callback(new Error("启用显示时二维码图片链接不能为空"));
          return;
        }
        try {
          new URL(value);
          callback();
        } catch (error) {
          callback(new Error("请输入有效的URL地址"));
        }
      },
      trigger: "blur",
    },
  ],
};

const validateUrl = (_rule, value, callback) => {
  if (!form.enabled) {
    callback();
    return;
  }

  if (!value) {
    callback(new Error("请输入 API URL"));
    return;
  }

  try {
    new URL(value);
    callback();
  } catch (error) {
    callback(new Error("请输入有效的 URL"));
  }
};

const requiredWhenEnabled = (message) => {
  return (_rule, value, callback) => {
    if (!form.enabled) {
      callback();
      return;
    }
    if (value === undefined || value === null || value === "") {
      callback(new Error(message));
      return;
    }
    callback();
  };
};

const validateShareLink = (_rule, value, callback) => {
  if (!form.verificationEnabled) {
    callback();
    return;
  }

  if (!value) {
    callback(new Error("请输入夸克分享链接"));
    return;
  }

  const pattern = /https?:\/\/pan\.quark\.cn\/s\/[A-Za-z0-9]+/;
  if (!pattern.test(value)) {
    callback(new Error("请输入有效的夸克分享链接"));
    return;
  }

  callback();
};

const validateTransferRewardShareLink = (_rule, value, callback) => {
  if (!form.transferRewardEnabled) {
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

const validateAccessDuration = (_rule, value, callback) => {
  if (!form.verificationEnabled) {
    callback();
    return;
  }

  if (typeof value !== "number") {
    callback(new Error("请输入访问时长"));
    return;
  }

  if (value < 5) {
    callback(new Error("访问时长至少为5分钟"));
    return;
  }

  if (value > 1440) {
    callback(new Error("访问时长不能超过1440分钟"));
    return;
  }

  callback();
};

const validatePositiveInteger = (message, max) => {
  return (_rule, value, callback) => {
    if (!form.transferRewardEnabled) {
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

const rules = {
  apiUrl: [{ validator: validateUrl, trigger: "blur" }],
  quarkCookie: [
    {
      validator: requiredWhenEnabled("请输入夸克网盘 Cookie"),
      trigger: "blur",
    },
  ],
  typeId: [
    { validator: requiredWhenEnabled("请选择资源类型"), trigger: "change" },
  ],
  accessVerificationShareLink: [
    { validator: validateShareLink, trigger: "blur" },
  ],
  accessDurationMinutes: [
    { validator: validateAccessDuration, trigger: ["blur", "change"] },
  ],
  transferRewardShareLink: [
    { validator: validateTransferRewardShareLink, trigger: "blur" },
  ],
  transferRewardPoints: [
    {
      validator: validatePositiveInteger("奖励积分需要大于 0", 100000000),
      trigger: ["blur", "change"],
    },
  ],
  transferRewardDurationMinutes: [
    {
      validator: validatePositiveInteger("有效期需要大于 0 分钟", 525600),
      trigger: ["blur", "change"],
    },
  ],
};

// 处理启用状态变化
const handleEnabledChange = (value) => {
  if (!value) {
    ElMessageBox.confirm(
      "关闭转存功能将停止所有自动转存操作，是否继续？",
      "警告",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    )
      .then(() => {
        handleSubmit();
      })
      .catch(() => {
        form.enabled = true;
      });
  }
};

// 重置 API URL
const resetApiUrl = () => {
  form.apiUrl = DEFAULT_API_URL;
};

// 重置表单
const resetForm = () => {
  ElMessageBox.confirm("确定要重置所有配置吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    formRef.value?.resetFields();
    form.apiUrl = DEFAULT_API_URL;
    form.verificationEnabled = false;
    form.shareLink = "";
    form.accessVerificationShareLink = "";
    form.accessDurationMinutes = DEFAULT_ACCESS_DURATION;
    form.transferRewardEnabled = true;
    form.transferRewardShareLink = "";
    form.transferRewardPoints = DEFAULT_TRANSFER_REWARD_POINTS;
    form.transferRewardDurationMinutes = DEFAULT_TRANSFER_REWARD_DURATION;
  });
};

// 获取资源类型列表
const getResourceTypes = async () => {
  try {
    const res = await $fetch("/api/admin/resourcesType/get", {
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });
    if (res.code === 200) {
      resourceTypes.value = res.data;
    }
  } catch (error) {
    console.error("获取资源类型失败:", error);
    ElMessage.error("获取资源类型失败");
  }
};

const getEmailConfig = async () => {
  try {
    const res = await $fetch("/api/admin/settings/email", {
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });

    if (res.code === 200) {
      emailForm.enabled = res.data.enabled ?? false;
      emailForm.provider = res.data.provider || "resend";
      emailForm.apiKey = "";
      emailForm.fromEmail = res.data.fromEmail || "";
      emailForm.fromName = res.data.fromName || "爱盼";
      emailForm.replyTo = res.data.replyTo || "";
      emailForm.siteUrl = res.data.siteUrl || "";
      emailForm.verificationExpireMinutes =
        res.data.verificationExpireMinutes ?? 60;
      emailForm.requireVerificationForNewUsers =
        res.data.requireVerificationForNewUsers ?? true;
      emailConfigMeta.hasApiKey = res.data.hasApiKey ?? false;
      emailConfigMeta.apiKeyMasked = res.data.apiKeyMasked || "";
    }
  } catch (error) {
    console.error("获取邮箱配置失败:", error);
    ElMessage.error("获取邮箱配置失败");
  }
};

const applyAccessControlConfig = (config = DEFAULT_ACCESS_CONTROL_CONFIG) => {
  accessControlForm.enabled =
    config.enabled ?? DEFAULT_ACCESS_CONTROL_CONFIG.enabled;
  accessControlForm.requireLogin =
    config.requireLogin ?? DEFAULT_ACCESS_CONTROL_CONFIG.requireLogin;
  accessControlForm.minPoints =
    Number(config.minPoints ?? DEFAULT_ACCESS_CONTROL_CONFIG.minPoints);

  Object.keys(DEFAULT_ACCESS_CONTROL_FEATURES).forEach((key) => {
    accessControlForm.protectedFeatures[key] =
      config.protectedFeatures?.[key] ?? DEFAULT_ACCESS_CONTROL_FEATURES[key];
  });
};

const getAccessControlConfig = async () => {
  try {
    const res = await $fetch("/api/admin/settings/access-control", {
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });

    if (res.code === 200) {
      applyAccessControlConfig(res.data);
    }
  } catch (error) {
    console.error("获取访问限制配置失败:", error);
    ElMessage.error("获取访问限制配置失败");
  }
};

const handleAccessControlSubmit = async () => {
  if (!accessControlFormRef.value) return;

  try {
    const valid = await accessControlFormRef.value.validate();
    if (!valid) return;

    accessControlLoading.value = true;

    const res = await $fetch("/api/admin/settings/access-control", {
      method: "POST",
      body: {
        enabled: accessControlForm.enabled,
        requireLogin: accessControlForm.requireLogin,
        minPoints: accessControlForm.minPoints,
        protectedFeatures: { ...accessControlForm.protectedFeatures },
      },
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });

    if (res.code === 200) {
      ElMessage.success("访问限制配置保存成功");
      applyAccessControlConfig(res.data);
      setAccessControlConfig(res.data);
    } else {
      ElMessage.error(res.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存访问限制配置失败:", error);
    ElMessage.error("保存访问限制配置失败");
  } finally {
    accessControlLoading.value = false;
  }
};

const resetAccessControlForm = () => {
  ElMessageBox.confirm("确定要恢复默认访问限制配置吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    applyAccessControlConfig(DEFAULT_ACCESS_CONTROL_CONFIG);
    handleAccessControlSubmit();
  });
};

const handleEmailSubmit = async () => {
  if (!emailFormRef.value) return;

  try {
    const valid = await emailFormRef.value.validate();
    if (!valid) return;

    emailLoading.value = true;

    const res = await $fetch("/api/admin/settings/email", {
      method: "POST",
      body: {
        enabled: emailForm.enabled,
        provider: emailForm.provider,
        apiKey: emailForm.apiKey,
        fromEmail: emailForm.fromEmail,
        fromName: emailForm.fromName,
        replyTo: emailForm.replyTo,
        siteUrl: emailForm.siteUrl,
        verificationExpireMinutes: emailForm.verificationExpireMinutes,
        requireVerificationForNewUsers:
          emailForm.requireVerificationForNewUsers,
      },
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });

    if (res.code === 200) {
      ElMessage.success("邮箱配置保存成功");
      await getEmailConfig();
    } else {
      ElMessage.error(res.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存邮箱配置失败:", error);
    ElMessage.error(error?.data?.msg || "保存邮箱配置失败");
  } finally {
    emailLoading.value = false;
  }
};

const handleEmailTest = async () => {
  if (!emailForm.testEmail) {
    ElMessage.error("请输入测试邮箱");
    return;
  }

  emailTesting.value = true;

  try {
    const res = await $fetch("/api/admin/settings/email/test", {
      method: "POST",
      body: {
        toEmail: emailForm.testEmail,
      },
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });

    if (res.code === 200) {
      ElMessage.success(res.msg || "测试邮件发送成功");
    } else {
      ElMessage.error(res.msg || "测试邮件发送失败");
    }
  } catch (error) {
    console.error("发送测试邮件失败:", error);
    ElMessage.error(error?.data?.msg || "发送测试邮件失败");
  } finally {
    emailTesting.value = false;
  }
};

const resetEmailForm = () => {
  ElMessageBox.confirm("确定要重置邮箱配置表单吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    getEmailConfig();
  });
};

// 获取配置
const getConfig = async () => {
  try {
    const res = await $fetch("/api/admin/settings/quark", {
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });
    if (res.code === 200) {
      form.apiUrl = res.data.apiUrl || DEFAULT_API_URL;
      form.quarkCookie = res.data.quarkCookie || "";
      form.typeId = res.data.typeId || "";
      form.enabled = res.data.enabled ?? false;
      form.verificationEnabled = res.data.verificationEnabled ?? false;
      form.accessVerificationShareLink =
        res.data.accessVerificationShareLink || res.data.shareLink || "";
      form.shareLink = form.accessVerificationShareLink;
      form.accessDurationMinutes =
        res.data.accessDurationMinutes ?? DEFAULT_ACCESS_DURATION;
      form.transferRewardEnabled = res.data.transferRewardEnabled ?? true;
      form.transferRewardShareLink = res.data.transferRewardShareLink || "";
      form.transferRewardPoints =
        res.data.transferRewardPoints ?? DEFAULT_TRANSFER_REWARD_POINTS;
      form.transferRewardDurationMinutes =
        res.data.transferRewardDurationMinutes ?? DEFAULT_TRANSFER_REWARD_DURATION;
    }
  } catch (error) {
    console.error("获取配置失败:", error);
    ElMessage.error("获取配置失败");
  }
};

// 保存配置
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    loading.value = true;

    // 获取当前用户信息
    const userInfo = await $fetch("/api/user/info", {
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });

    if (userInfo.code !== 200) {
      throw new Error("Failed to get user info");
    }

    const res = await $fetch("/api/admin/settings/quark", {
      method: "POST",
      body: {
        apiUrl: form.apiUrl,
        quarkCookie: form.quarkCookie,
        typeId: form.typeId,
        userId: userInfo.data.id,
        enabled: form.enabled,
        verificationEnabled: form.verificationEnabled,
        shareLink: form.accessVerificationShareLink,
        accessVerificationShareLink: form.accessVerificationShareLink,
        accessDurationMinutes: form.accessDurationMinutes,
        transferRewardEnabled: form.transferRewardEnabled,
        transferRewardShareLink: form.transferRewardShareLink,
        transferRewardPoints: form.transferRewardPoints,
        transferRewardDurationMinutes: form.transferRewardDurationMinutes,
      },
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });

    if (res.code === 200) {
      ElMessage.success("配置保存成功");
    } else {
      ElMessage.error(res.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存配置失败:", error);
    ElMessage.error("保存配置失败");
  } finally {
    loading.value = false;
  }
};

// 音乐验证码相关方法
const musicFormRef = ref(null);
const groupQrFormRef = ref(null);
const accessControlFormRef = ref(null);

const handleMusicEnabledChange = (value) => {
  if (!value) {
    ElMessageBox.confirm(
      "关闭音乐验证将允许所有用户访问音乐页面，是否继续？",
      "警告",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    )
      .then(() => {
        handleMusicSubmit();
      })
      .catch(() => {
        musicForm.enabled = true;
      });
  } else {
    // 启用验证时也需要调用API更新字段
    handleMusicSubmit();
  }
};

const resetMusicPassword = () => {
  musicForm.password = "aipan.me2026";
  // 调用API保存到数据库
  handleMusicSubmit();
};

const resetMusicForm = () => {
  ElMessageBox.confirm("确定要重置音乐验证码配置吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    musicFormRef.value?.resetFields();
    musicForm.password = "aipan.me2026";
    // 调用API保存到数据库
    handleMusicSubmit();
  });
};

const handleMusicSubmit = async () => {
  if (!musicFormRef.value) return;

  try {
    if (musicForm.enabled) {
      const valid = await musicFormRef.value.validate();
      if (!valid) return;
    }

    musicLoading.value = true;

    const res = await $fetch("/api/admin/settings/music", {
      method: "POST",
      body: {
        enabled: musicForm.enabled,
        password: musicForm.password,
      },
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });

    if (res.code === 200) {
      ElMessage.success("音乐验证码配置保存成功");
    } else {
      ElMessage.error(res.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存音乐验证码配置失败:", error);
    ElMessage.error("保存配置失败");
  } finally {
    musicLoading.value = false;
  }
};

const getMusicConfig = async () => {
  try {
    const res = await $fetch("/api/admin/settings/music", {
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });
    if (res.code === 200) {
      musicForm.enabled = res.data.enabled ?? true;
      musicForm.password = res.data.password || "aipan.me2026";
    }
  } catch (error) {
    console.error("获取音乐验证码配置失败:", error);
    ElMessage.error("获取音乐验证码配置失败");
  }
};

// 群二维码相关方法
const handleGroupQrEnabledChange = (value) => {
  if (!value) {
    ElMessageBox.confirm(
      "关闭群二维码显示将隐藏所有相关内容，是否继续？",
      "警告",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    )
      .then(() => {
        handleGroupQrSubmit();
      })
      .catch(() => {
        groupQrForm.enabled = true;
      });
  } else {
    handleGroupQrSubmit();
  }
};

const resetGroupQrForm = () => {
  ElMessageBox.confirm("确定要重置群二维码配置吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    groupQrFormRef.value?.resetFields();
    groupQrForm.title = "为防止网站和谐，请扫码获取最新网址";
    groupQrForm.description = "长按识别二维码或扫码进群";
    groupQrForm.qrCodeUrl = "";
    groupQrForm.showInHeader = true;
    groupQrForm.showInSearchResults = true;
    handleGroupQrSubmit();
  });
};

const handleGroupQrSubmit = async () => {
  if (!groupQrFormRef.value) return;

  try {
    if (groupQrForm.enabled) {
      const valid = await groupQrFormRef.value.validate();
      if (!valid) return;
    }

    groupQrLoading.value = true;

    const res = await $fetch("/api/admin/settings/group-qr", {
      method: "POST",
      body: {
        enabled: groupQrForm.enabled,
        title: groupQrForm.title,
        description: groupQrForm.description,
        qrCodeUrl: groupQrForm.qrCodeUrl,
        showInHeader: groupQrForm.showInHeader,
        showInSearchResults: groupQrForm.showInSearchResults,
      },
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });

    if (res.code === 200) {
      ElMessage.success("群二维码配置保存成功");
    } else {
      ElMessage.error(res.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存群二维码配置失败:", error);
    ElMessage.error("保存配置失败");
  } finally {
    groupQrLoading.value = false;
  }
};

const getGroupQrConfig = async () => {
  try {
    const res = await $fetch("/api/admin/settings/group-qr", {
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });
    if (res.code === 200) {
      groupQrForm.enabled = res.data.enabled ?? true;
      groupQrForm.title =
        res.data.title || "为防止网站和谐，请扫码获取最新网址";
      groupQrForm.description =
        res.data.description || "长按识别二维码或扫码进群";
      groupQrForm.qrCodeUrl = res.data.qrCodeUrl || "";
      groupQrForm.showInHeader = res.data.showInHeader ?? true;
      groupQrForm.showInSearchResults = res.data.showInSearchResults ?? true;
    }
  } catch (error) {
    console.error("获取群二维码配置失败:", error);
    ElMessage.error("获取群二维码配置失败");
  }
};

onMounted(() => {
  getResourceTypes();
  getEmailConfig();
  getConfig();
  getMusicConfig();
  getGroupQrConfig();
  getAccessControlConfig();
});
</script>

<style scoped>
.el-form :deep(.el-form-item__label) {
  font-weight: 500;
}

.el-input :deep(.el-input__wrapper),
.el-select :deep(.el-input__wrapper) {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.el-input :deep(.el-input__wrapper.is-focus),
.el-select :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}
</style>
