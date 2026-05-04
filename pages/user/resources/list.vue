<template>
  <div class="min-h-[calc(100vh-60px)] bg-gray-50 dark:bg-gray-900">
    <div class="max-w-[1240px] mx-auto p-6">
      <!-- 头部区域 -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6"
      >
        <div class="relative h-24 bg-linear-to-r from-blue-500 to-purple-500">
          <div
            class="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white/10 backdrop-blur-sm"
          >
            <div class="flex items-center space-x-2 text-sm text-white">
              <nuxt-link
                to="/user/dashboard"
                class="hover:text-white/80 flex items-center transition-colors duration-200"
              >
                <el-icon class="mr-1">
                  <House />
                </el-icon>
                用户中心
              </nuxt-link>
              <span>/</span>
              <span>我的资源</span>
            </div>
          </div>
        </div>
        <div class="p-6">
          <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1
                class="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-2"
              >
                我的资源
              </h1>
              <p class="text-gray-500 dark:text-gray-400">管理您投稿的资源</p>
            </div>
            <el-button
              @click="() => navigateTo('/user/dashboard')"
              class="flex items-center"
            >
              <el-icon class="mr-1">
                <ArrowLeft />
              </el-icon>
              返回用户中心
            </el-button>
          </div>
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all"
        >
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-200">
              投稿资源
            </h2>
            <el-icon class="text-2xl text-blue-500">
              <Plus />
            </el-icon>
          </div>
          <p class="text-gray-500 dark:text-gray-400 mb-4">添加新的资源</p>
          <el-button
            type="primary"
            @click="handleAddClouddrive()"
            class="w-full"
          >
            投稿资源
          </el-button>
        </div>
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all"
        >
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-200">
              批量投稿
            </h2>
            <el-icon class="text-2xl text-green-500">
              <Upload />
            </el-icon>
          </div>
          <p class="text-gray-500 dark:text-gray-400 mb-4">批量上传资源</p>
          <el-button type="success" @click="handleMultiUpload()" class="w-full">
            批量投稿
          </el-button>
        </div>
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all"
        >
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-200">
              批量删除
            </h2>
            <el-icon class="text-2xl text-red-500">
              <Delete />
            </el-icon>
          </div>
          <p class="text-gray-500 dark:text-gray-400 mb-4">批量删除资源</p>
          <el-button
            type="danger"
            @click="handleMultiDelete()"
            :disabled="!multipleSelection.length"
            class="w-full"
          >
            批量删除
            <span v-if="multipleSelection.length" class="ml-1"
              >({{ multipleSelection.length }})</span
            >
          </el-button>
        </div>
      </div>

      <!-- 表格区域 -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
      >
        <client-only>
          <el-table
            ref="multipleTableRef"
            :data="resourcesData"
            @selection-change="handleSelectionChange"
            style="width: 100%"
            :border="true"
            :selectable="selectable"
            class="p-6"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="name" label="资源名称" min-width="200">
              <template #default="{ row }">
                <div class="flex items-center group">
                  <el-icon class="mr-2 text-blue-500">
                    <Document />
                  </el-icon>
                  <span class="dark:text-gray-200">{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="type.name" label="资源类型" width="150">
              <template #default="{ row }">
                <el-tag size="small" type="info">{{ row.type.name }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  :type="
                    row.status === 'pending'
                      ? 'warning'
                      : row.status === 'published'
                      ? 'success'
                      : 'danger'
                  "
                >
                  {{
                    row.status === "pending"
                      ? "待审核"
                      : row.status === "published"
                      ? "已发布"
                      : "已拒绝"
                  }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="投稿时间" width="180">
              <template #default="{ row }">
                <span class="text-gray-500 dark:text-gray-400">{{
                  new Date(row.createdAt).toLocaleString()
                }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button-group>
                  <el-button
                    type="primary"
                    :icon="Edit"
                    :disabled="scope.row.status === 'published'"
                    @click="handleEditClouddrive(scope.row)"
                    >编辑</el-button
                  >
                  <el-button
                    type="danger"
                    :icon="Delete"
                    :disabled="scope.row.status === 'published'"
                    @click="handleDeleteClouddrive(scope.row)"
                    >删除</el-button
                  >
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>
          <div class="p-6 flex items-center justify-center">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :page-sizes="pagination.pageSizes"
              background
              layout="total, sizes, prev, pager, next, jumper"
              :total="pagination.total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </client-only>
      </div>
    </div>

    <!-- 添加/编辑资源对话框 -->
    <el-dialog
      v-model="dialogs.resource"
      :title="form.id ? '编辑资源' : '投稿资源'"
      width="700px"
      class="resource-dialog"
    >
      <el-form
        ref="formRef"
        :model="form"
        label-width="100px"
        :rules="rules"
        class="space-y-6"
      >
        <!-- 资源名称 -->
        <el-form-item label="资源名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入资源名称"
            class="hover:shadow-sm transition-shadow duration-200"
          >
            <template #prefix>
              <el-icon><Document /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 资源类型 -->
        <el-form-item label="资源类型" prop="typeId">
          <div class="space-y-4">
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <div
                v-for="resourceType in resourceTypes"
                :key="resourceType.id"
                class="relative group cursor-pointer transform hover:scale-105 transition-all duration-200"
                @click="handleSelectResourceType(resourceType)"
              >
                <div
                  class="px-4 py-3 rounded-lg border shadow-sm hover:shadow-md transition-all duration-200"
                  :class="[
                    form.typeId === resourceType.id
                      ? 'bg-primary-50 border-primary text-primary shadow-primary/20'
                      : 'border-gray-200 hover:border-primary hover:text-primary',
                  ]"
                >
                  <div class="text-center">{{ resourceType.name }}</div>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <el-button
                type="primary"
                @click="handleAddResourceType()"
                class="flex items-center hover:scale-105 transition-transform duration-200"
              >
                <el-icon class="mr-1">
                  <Plus />
                </el-icon>
                添加类型
              </el-button>
              <el-button
                @click="handleRefreshResourceTypes"
                class="flex items-center hover:scale-105 transition-transform duration-200"
                :loading="pageState.loadingResourceTypes"
              >
                <el-icon class="mr-1">
                  <Refresh />
                </el-icon>
                刷新
              </el-button>
            </div>
            <div class="text-red-500 text-sm" v-if="!form.typeId">
              请选择资源类型
            </div>
          </div>
        </el-form-item>

        <!-- 资源链接 -->
        <el-form-item
          v-for="(link, index) in form.links"
          :key="link.key"
          :label="'资源链接 ' + (index + 1)"
          :prop="'links.' + index + '.value'"
          :rules="{ required: true, message: '链接不能为空', trigger: 'blur' }"
        >
          <div class="flex items-start gap-2">
            <div class="flex-grow space-y-2">
              <el-input
                v-model="link.value"
                type="textarea"
                :rows="2"
                placeholder="请输入资源链接（支持网盘链接）"
                class="hover:shadow-sm transition-shadow duration-200"
              >
                <template #prefix>
                  <el-icon><Link /></el-icon>
                </template>
              </el-input>
              <el-input
                v-model="link.password"
                placeholder="提取密码（如果有）"
                class="hover:shadow-sm transition-shadow duration-200"
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </div>
            <el-button
              type="danger"
              :icon="Delete"
              @click.prevent="removeLink(index)"
              v-if="form.links.length > 1"
              class="hover:scale-105 transition-transform duration-200"
            ></el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            @click="addLink"
            class="flex items-center hover:scale-105 transition-transform duration-200"
            :disabled="form.links.length >= 5"
          >
            <el-icon class="mr-1"><Plus /></el-icon>
            添加链接
          </el-button>
          <span class="text-gray-400 text-sm ml-2">最多添加5个链接</span>
        </el-form-item>

        <!-- 资源描述 -->
        <el-form-item label="资源描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="6"
            placeholder="请详细描述资源的内容、用途等信息"
            :maxlength="2000"
            show-word-limit
            class="hover:shadow-sm transition-shadow duration-200"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button
            @click="dialogs.resource = false"
            class="hover:scale-105 transition-transform duration-200"
            >取消</el-button
          >
          <el-button
            type="primary"
            @click="handleSubmitAddClouddrive"
            :loading="pageState.submitting"
            class="hover:scale-105 transition-transform duration-200"
          >
            {{ form.id ? "保存修改" : "提交资源" }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加资源类型对话框 -->
    <el-dialog
      v-model="dialogs.type"
      title="添加资源类型"
      width="500px"
      class="type-dialog"
    >
      <el-form
        ref="typeFormRef"
        :model="typeForm"
        label-width="100px"
        class="space-y-6"
      >
        <el-form-item
          label="类型名称"
          prop="name"
          :rules="{
            required: true,
            message: '类型名称不能为空',
            trigger: 'blur',
          }"
        >
          <el-input
            v-model="typeForm.name"
            placeholder="请输入类型名称"
            class="hover:shadow-sm transition-shadow duration-200"
          ></el-input>
        </el-form-item>
        <el-form-item label="类型描述" prop="description">
          <el-input
            v-model="typeForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入类型描述（选填）"
            class="hover:shadow-sm transition-shadow duration-200"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button
            @click="dialogs.type = false"
            class="hover:scale-105 transition-transform duration-200"
            >取消</el-button
          >
          <el-button
            type="primary"
            @click="handleSubmitAddResourceType"
            :loading="pageState.addingResourceType"
            class="hover:scale-105 transition-transform duration-200"
            >确认</el-button
          >
        </div>
      </template>
    </el-dialog>

    <!-- 批量上传对话框 -->
    <el-dialog
      v-model="dialogs.multiUpload"
      title="批量投稿"
      width="600px"
      class="upload-dialog"
    >
      <div class="space-y-6">
        <div
          class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
        >
          <h3 class="font-medium text-gray-900 dark:text-gray-200 mb-4">
            支持的文件格式
          </h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <el-tag
                size="small"
                class="hover:scale-105 transition-transform duration-200"
                >CSV</el-tag
              >
              <el-tag
                size="small"
                type="success"
                class="hover:scale-105 transition-transform duration-200"
                >XLSX</el-tag
              >
              <el-tag
                size="small"
                type="warning"
                class="hover:scale-105 transition-transform duration-200"
                >XLS</el-tag
              >
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              文件需包含以下字段：name（资源名称）、category（资源类型）、link（资源链接）、password（可选，提取密码）、description（可选，资源描述）
            </p>
          </div>
        </div>

        <div
          class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-primary transition-colors duration-200"
        >
          <input
            class="w-full cursor-pointer"
            accept=".csv,.xlsx,.xls"
            type="file"
            @change="handleFileUpload"
          />
        </div>

        <div v-if="multiProgress > 0" class="space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">上传进度</span>
            <span class="font-medium text-gray-900 dark:text-gray-200"
              >{{ multiProgress }}%</span
            >
          </div>
          <el-progress :percentage="multiProgress" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button
            @click="dialogs.multiUpload = false"
            class="hover:scale-105 transition-transform duration-200"
            >取消</el-button
          >
          <el-button
            type="primary"
            @click="handleSubmitMultiUpload"
            :loading="pageState.multiUploading"
            class="hover:scale-105 transition-transform duration-200"
            >开始上传</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import {
  Document,
  Upload,
  Delete,
  Edit,
  Plus,
  Refresh,
  ArrowLeft,
  House,
  Link,
  Lock,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import Papa from "papaparse";

definePageMeta({
  middleware: ["auth"],
});

const { $message } = useNuxtApp();
const token = useCookie("token");

// 页面状态管理
const pageState = reactive({
  loading: false,
  submitting: false,
  loadingResourceTypes: false,
  addingResourceType: false,
  multiUploading: false,
});

// 分页配置
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  pageSizes: [10, 20, 50, 100],
});

// 对话框控制
const dialogs = reactive({
  resource: false,
  type: false,
  multiUpload: false,
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: "资源名称不能为空", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" },
  ],
  typeId: [{ required: true, message: "请选择资源类型", trigger: "change" }],
  description: [
    { required: true, message: "资源描述不能为空", trigger: "blur" },
    {
      min: 10,
      max: 2000,
      message: "长度在 10 到 2000 个字符",
      trigger: "blur",
    },
  ],
};

// 表单数据
const form = reactive({
  id: null,
  name: "",
  typeId: "",
  description: "",
  links: [
    {
      key: Date.now(),
      value: "",
      password: "",
    },
  ],
});

// 类型表单数据
const typeForm = reactive({
  name: "",
  description: "",
});

// 重置表单
const resetForm = () => {
  form.id = null;
  form.name = "";
  form.typeId = "";
  form.description = "";
  form.links = [
    {
      key: Date.now(),
      value: "",
      password: "",
    },
  ];
};

const resetTypeForm = () => {
  typeForm.name = "";
  typeForm.description = "";
};

// 数据相关
const resourcesData = ref([]);
const resourceTypes = ref([]);
const multipleSelection = ref([]);
const multiProgress = ref(0);
const uploadData = ref([]);

// 表单引用
const formRef = ref();
const typeFormRef = ref();
const multipleTableRef = ref();

// 表格行选择控制
const selectable = (row, index) => {
  return true; // 默认允许所有行可选，如需添加条件可在此处修改
};

// 表格选择相关
const handleSelectionChange = (val) => {
  multipleSelection.value = val;
};

// API调用封装
const api = {
  async getResources() {
    try {
      pageState.loading = true;
      const res = await $fetch("/api/user/resources/list", {
        method: "GET",
        query: {
          page: pagination.page,
          pageSize: pagination.pageSize,
        },
        headers: {
          authorization: "Bearer " + token.value,
        },
      });
      resourcesData.value = res.data.resources;
      pagination.total = res.data.pagination.total;
    } catch (error) {
      ElMessage.error("获取资源列表失败：" + (error.message || "未知错误"));
    } finally {
      pageState.loading = false;
    }
  },

  async getResourceTypes() {
    try {
      pageState.loadingResourceTypes = true;
      const res = await $fetch("/api/user/resources/types", {
        method: "GET",
        headers: {
          authorization: "Bearer " + token.value,
        },
      });
      resourceTypes.value = res.data;
    } catch (error) {
      ElMessage.error("获取资源类型失败：" + (error.message || "未知错误"));
    } finally {
      pageState.loadingResourceTypes = false;
    }
  },

  async addResource(data) {
    return await $fetch("/api/user/resources/post", {
      method: "POST",
      body: data,
      headers: {
        authorization: "Bearer " + token.value,
      },
    });
  },

  async updateResource(id, data) {
    return await $fetch(`/api/user/resources/${id}`, {
      method: "PUT",
      body: data,
      headers: {
        authorization: "Bearer " + token.value,
      },
    });
  },

  async deleteResource(id) {
    return await $fetch(`/api/user/resources/${id}`, {
      method: "DELETE",
      headers: {
        authorization: "Bearer " + token.value,
      },
    });
  },

  async addResourceType(data) {
    return await $fetch("/api/user/resources/types", {
      method: "POST",
      body: data,
      headers: {
        authorization: "Bearer " + token.value,
      },
    });
  },

  async deleteResourceType(id) {
    return await $fetch(`/api/user/resources/types/${id}`, {
      method: "DELETE",
      headers: {
        authorization: "Bearer " + token.value,
      },
    });
  },
};

// 资源链接管理
const removeLink = (index) => {
  if (form.links.length > 1) {
    form.links.splice(index, 1);
  }
};

const addLink = () => {
  if (form.links.length >= 5) return;
  form.links.push({
    key: Date.now(),
    value: "",
    password: "",
  });
};

// 刷新资源类型
const handleRefreshResourceTypes = async () => {
  await api.getResourceTypes();
};

// 打开添加资源类型对话框
const handleAddResourceType = () => {
  resetTypeForm();
  dialogs.type = true;
};

// 选择资源类型
const handleSelectResourceType = (resourceType) => {
  form.typeId = resourceType.id;
};

// 打开批量上传对话框
const handleMultiUpload = () => {
  dialogs.multiUpload = true;
};

// 事件处理
const handleAddClouddrive = () => {
  resetForm();
  dialogs.resource = true;
  api.getResourceTypes();
};

const handleEditClouddrive = (row) => {
  form.id = row.id;
  form.name = row.name;
  form.typeId = row.typeId;
  form.links = JSON.parse(row.links);
  form.description = row.description;
  dialogs.resource = true;
  api.getResourceTypes();
};

const handleSubmitAddClouddrive = async () => {
  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    pageState.submitting = true;
    if (form.id) {
      await api.updateResource(form.id, {
        name: form.name.trim(),
        typeId: form.typeId,
        links: JSON.stringify(
          form.links.map((link) => ({
            value: link.value.trim(),
            password: link.password?.trim() || "",
          }))
        ),
        description: form.description.trim(),
      });
      ElMessage.success("资源更新成功，系统将自动重新审核并通知你结果");
    } else {
      await api.addResource({
        name: form.name.trim(),
        typeId: form.typeId,
        links: JSON.stringify(
          form.links.map((link) => ({
            value: link.value.trim(),
            password: link.password?.trim() || "",
          }))
        ),
        description: form.description.trim(),
      });
      ElMessage.success("资源提交成功，系统将自动审核并通知你结果");
    }
    dialogs.resource = false;
    resetForm();
    api.getResources();
  } catch (error) {
    ElMessage.error("操作失败：" + (error.message || "未知错误"));
  } finally {
    pageState.submitting = false;
  }
};

const handleDeleteClouddrive = async (row) => {
  try {
    await ElMessageBox.confirm("确定要删除该资源吗？删除后无法恢复。", "警告", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    await api.deleteResource(row.id);
    ElMessage.success("删除成功");
    await api.getResources();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败：" + (error.message || "未知错误"));
    }
  }
};

const handleSubmitAddResourceType = async () => {
  try {
    const valid = await typeFormRef.value.validate();
    if (!valid) return;

    pageState.addingResourceType = true;
    await api.addResourceType({
      name: typeForm.name,
      description: typeForm.description,
    });

    ElMessage.success("资源类型添加成功");
    dialogs.type = false;
    resetTypeForm();
    await api.getResourceTypes();
  } catch (error) {
    ElMessage.error("添加资源类型失败：" + (error.message || "未知错误"));
  } finally {
    pageState.addingResourceType = false;
  }
};

const handleDeleteResourceType = async (resourceType) => {
  try {
    // 先检查是否有关联的资源
    const associatedResources = resourcesData.value.filter(
      (resource) => resource.typeId === resourceType.id
    );
    if (associatedResources.length > 0) {
      ElMessageBox.alert(
        `无法删除资源类型 "${resourceType.name}"，因为还有 ${
          associatedResources.length
        } 个资源正在使用此类型。\n\n请先删除或修改以下资源的类型：\n${associatedResources
          .map((r) => `• ${r.name}`)
          .join("\n")}`,
        "删除失败",
        {
          type: "warning",
          confirmButtonText: "知道了",
        }
      );
      return;
    }

    await ElMessageBox.confirm(
      "确定要删除该资源类型吗？删除后无法恢复。",
      "警告",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    await api.deleteResourceType(resourceType.id);
    ElMessage.success("资源类型删除成功");
    await api.getResourceTypes();
  } catch (error) {
    if (error?.response?.status === 400) {
      ElMessage.warning("该资源类型下还有关联的资源，请先删除或修改相关资源");
    } else if (!error || error.toString().includes("cancel")) {
      // 用户取消操作，不显示错误
      return;
    } else {
      ElMessage.error("删除资源类型失败：" + (error.message || "未知错误"));
    }
  }
};

// 文件上传相关
const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fileType = file.name.split(".").pop().toLowerCase();
  if (fileType === "csv") {
    readCSV(file);
  } else if (["xlsx", "xls"].includes(fileType)) {
    readExcel(file);
  } else {
    ElMessage.error("不支持的文件类型");
  }
};

const readExcel = async (file) => {
  const XLSX = await import("xlsx");
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      uploadData.value = jsonData;
    } catch (error) {
      ElMessage.error("Excel文件解析失败：" + (error.message || "未知错误"));
    }
  };
  reader.onerror = () => {
    ElMessage.error("文件读取失败");
  };
  reader.readAsArrayBuffer(file);
};

const readCSV = (file) => {
  Papa.parse(file, {
    header: true,
    complete: (results) => {
      if (results.errors.length) {
        ElMessage.error("CSV文件解析失败：" + results.errors[0].message);
        return;
      }
      uploadData.value = results.data;
    },
    error: (error) => {
      ElMessage.error("CSV文件解析失败：" + error.message);
    },
  });
};

const multiRequests = async (data) => {
  try {
    // 验证数据格式
    const invalidItems = data.filter(
      (item) => !item.name || !item.category || !item.link
    );
    if (invalidItems.length > 0) {
      ElMessage.error(
        `发现 ${invalidItems.length} 条数据格式不正确，请确保每条数据都包含 name、category 和 link 字段`
      );
      return;
    }

    pageState.multiUploading = true;
    multiProgress.value = 0;

    // 第一步：处理所有的资源类型
    const uniqueCategories = [...new Set(data.map((item) => item.category))];
    const categoryToTypeId = {};
    const failedCategories = [];

    for (const category of uniqueCategories) {
      try {
        const typeId = await getOrCreateResourceType(category);
        categoryToTypeId[category] = typeId;
      } catch (error) {
        failedCategories.push(category);
        console.error(`创建资源类型失败: ${category}`, error);
      }
    }

    // 刷新资源类型列表
    await api.getResourceTypes();

    if (failedCategories.length > 0) {
      ElMessage.warning(`以下分类创建失败: ${failedCategories.join(", ")}`);
    }

    // 第二步：处理资源
    const total = data.length;
    let completed = 0;
    let failed = 0;
    const failedItems = [];

    // 分批处理，每批10个
    const batchSize = 10;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (item) => {
          try {
            const typeId = categoryToTypeId[item.category];
            if (!typeId) {
              throw new Error(`找不到分类 "${item.category}" 对应的类型ID`);
            }

            await api.addResource({
              name: item.name,
              typeId: typeId,
              links: JSON.stringify([
                {
                  key: Date.now(),
                  value: item.link,
                  password: item.password || "",
                },
              ]),
              description:
                item.description || `${item.name} - ${item.category}`,
            });
            completed++;
            multiProgress.value = Math.floor((completed / total) * 100);
          } catch (error) {
            failed++;
            failedItems.push({
              name: item.name,
              category: item.category,
              error: error.message,
            });
            console.error("添加资源失败：", item.name, error);
          }
        })
      );
    }

    // 显示最终结果
    if (failed > 0) {
      ElMessage.warning(
        `批量上传完成，成功: ${completed}，失败: ${failed}；成功项将自动审核并通知结果`
      );
      console.error("失败项目：", failedItems);
    } else {
      ElMessage.success(
        `批量上传完成，共上传 ${completed} 个资源，系统将自动审核并通知结果`
      );
    }

    dialogs.multiUpload = false;
    api.getResources();
  } catch (error) {
    ElMessage.error("批量上传过程中发生错误：" + (error.message || "未知错误"));
  } finally {
    pageState.multiUploading = false;
    multiProgress.value = 0;
  }
};

const handleSubmitMultiUpload = async () => {
  if (!uploadData.value || uploadData.value.length === 0) {
    ElMessage.warning("请先选择要上传的文件");
    return;
  }

  pageState.multiUploading = true;
  try {
    await multiRequests(uploadData.value);
    ElMessage.success("批量上传成功，系统将自动审核并通知结果");
    dialogs.multiUpload = false;
    uploadData.value = [];
    multiProgress.value = 0;
    api.getResources();
  } catch (error) {
    ElMessage.error("批量上传失败：" + error.message);
  } finally {
    pageState.multiUploading = false;
  }
};

// 表格选择相关
const handleMultiDelete = async () => {
  if (!multipleSelection.value.length) {
    ElMessage.warning("请先选择要删除的项目");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${multipleSelection.value.length} 项吗？删除后无法恢复。`,
      "警告",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    const total = multipleSelection.value.length;
    let completed = 0;

    // 分批删除
    const batchSize = 5;
    for (let i = 0; i < multipleSelection.value.length; i += batchSize) {
      const batch = multipleSelection.value.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (item) => {
          try {
            await api.deleteResource(item.id);
            completed++;
            multiProgress.value = Math.floor((completed / total) * 100);
          } catch (error) {
            console.error("批量删除单项失败:", error);
          }
        })
      );
    }

    ElMessage.success("批量删除完成");
    multipleSelection.value = [];
    await api.getResources();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("批量删除失败：" + (error.message || "未知错误"));
    }
  } finally {
    multiProgress.value = 0;
  }
};

// 分页处理
const handleCurrentChange = (val) => {
  pagination.page = val;
  api.getResources();
};

const handleSizeChange = (val) => {
  pagination.pageSize = val;
  pagination.page = 1;
  api.getResources();
};

// 根据分类名称获取或创建资源类型
const getOrCreateResourceType = async (categoryName) => {
  // 先查找是否已存在该分类
  const existingType = resourceTypes.value.find(
    (type) => type.name === categoryName
  );
  if (existingType) {
    return existingType.id;
  }

  // 不存在则创建新分类
  try {
    const response = await api.addResourceType({
      name: categoryName,
      description: `Auto created for category: ${categoryName}`,
    });
    return response.data.id;
  } catch (error) {
    console.error("创建资源类型失败：", categoryName, error);
    throw new Error(`创建资源类型失败：${categoryName}`);
  }
};

// 初始化
onMounted(() => {
  api.getResources();
  api.getResourceTypes();
});
</script>

<style scoped>
.el-form-item.is-required .el-form-item__label:before {
  content: "*";
  color: var(--el-color-danger);
  margin-right: 4px;
}

:deep(.el-textarea__inner) {
  font-family: var(--el-font-family);
}

:deep(.el-dialog) {
  border-radius: 0.5rem;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  margin-right: 0;
  padding: 1.5rem;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.el-dialog__body) {
  padding: 1.5rem;
}

:deep(.el-dialog__footer) {
  padding: 1.5rem;
  border-top: 1px solid var(--el-border-color-lighter);
}

:deep(.el-button) {
  border-radius: 0.375rem;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__wrapper) {
  border-radius: 0.375rem;
}

:deep(.el-tag) {
  border-radius: 0.375rem;
}

.text-primary {
  color: var(--el-color-primary);
}

.bg-primary-50 {
  background-color: var(--el-color-primary-light-9);
}

.border-primary {
  border-color: var(--el-color-primary);
}

:deep(.custom-table) {
  --el-table-border-color: var(--el-border-color-lighter);
  --el-table-border: 1px solid var(--el-table-border-color);
  --el-table-text-color: var(--el-text-color-regular);
  --el-table-header-text-color: var(--el-text-color-secondary);
  --el-table-header-bg-color: var(--el-fill-color-light);
  --el-table-row-hover-bg-color: var(--el-fill-color);
  border-radius: 0;
}

:deep(.custom-table th.el-table__cell) {
  background-color: var(--el-table-header-bg-color);
  color: var(--el-table-header-text-color);
  font-weight: 600;
  border-bottom: 1px solid var(--el-table-border-color);
}

:deep(.custom-table .el-table__row) {
  transition: background-color 0.3s ease;
}

:deep(.custom-table .el-table__row:hover) {
  background-color: var(--el-table-row-hover-bg-color);
}

@media (max-width: 640px) {
  :deep(.el-dialog) {
    width: 90% !important;
    margin: 0 auto;
  }
}
</style>
