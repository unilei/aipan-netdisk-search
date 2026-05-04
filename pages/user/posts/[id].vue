<template>
  <div class="min-h-[calc(100vh-60px)] bg-gray-50/50 p-4 md:p-6">
    <div class="max-w-[1240px] mx-auto space-y-4 md:space-y-6">
      <!-- 加载状态 -->
      <el-skeleton :loading="loading" animated>
        <template #template>
          <div
            class="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 space-y-4"
          >
            <div class="flex items-center space-x-4">
              <el-skeleton-item variant="text" style="width: 30%" />
              <el-skeleton-item variant="text" style="width: 20%" />
            </div>
            <el-skeleton-item variant="h3" style="width: 50%" />
            <el-skeleton-item variant="text" style="width: 40%" />
          </div>
        </template>
        <template #default>
          <!-- 头部区域 -->
          <div
            class="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100"
          >
            <div
              class="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div
                  class="flex items-center space-x-2 text-sm text-gray-500 mb-2"
                >
                  <nuxt-link
                    to="/user/dashboard"
                    class="transition-colors flex items-center"
                  >
                    <el-icon class="mr-1">
                      <House />
                    </el-icon>
                    用户中心
                  </nuxt-link>
                  <span>/</span>
                  <nuxt-link
                    to="/user/posts/list"
                    class="transition-colors flex items-center"
                  >
                    我的博客
                  </nuxt-link>
                  <span>/</span>
                  <span class="text-gray-900">{{
                    isEdit ? "编辑文章" : "新建文章"
                  }}</span>
                </div>
                <h1 class="text-xl md:text-2xl font-bold text-gray-900">
                  {{ isEdit ? "编辑文章" : "新建文章" }}
                </h1>
                <p class="text-gray-500 mt-1 text-sm">
                  {{ isEdit ? "修改现有文章内容" : "创建一篇新的博客文章" }}
                </p>
              </div>
              <div class="flex items-center space-x-3">
                <el-button
                  @click="() => router.push('/user/posts/list')"
                  class="!flex items-center"
                >
                  <el-icon class="mr-1">
                    <ArrowLeft />
                  </el-icon>
                  返回列表
                </el-button>
                <el-button
                  type="primary"
                  @click="submit"
                  class="!flex items-center"
                  :loading="submitting"
                >
                  <el-icon class="mr-1">
                    <Document />
                  </el-icon>
                  {{ submitting ? "保存中..." : "保存文章" }}
                </el-button>
              </div>
            </div>
          </div>
        </template>
      </el-skeleton>

      <!-- 表单区域 -->
      <el-skeleton :loading="loading" animated>
        <template #template>
          <div
            class="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 space-y-6"
          >
            <div v-for="i in 3" :key="i" class="space-y-2">
              <el-skeleton-item variant="text" style="width: 15%" />
              <el-skeleton-item variant="text" style="width: 100%" />
            </div>
          </div>
        </template>
        <template #default>
          <div
            class="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100"
          >
            <el-form
              ref="formRef"
              :model="form"
              label-width="80px"
              class="space-y-6"
            >
              <el-form-item
                label="标题"
                prop="title"
                :rules="[
                  {
                    required: true,
                    message: '请输入文章标题',
                    trigger: 'blur',
                  },
                ]"
              >
                <el-input
                  v-model="form.title"
                  placeholder="请输入文章标题"
                  class="w-full !rounded-lg"
                />
              </el-form-item>

              <el-form-item
                label="分类"
                prop="categoryIds"
                :rules="[
                  {
                    type: 'array',
                    required: true,
                    message: '请至少选择一个分类',
                    trigger: 'change',
                  },
                ]"
              >
                <div class="space-y-4">
                  <!-- 分类标签区域 -->
                  <div class="flex flex-wrap gap-3">
                    <el-empty
                      v-if="!categoriesLoading && !categoriesData.length"
                      description="暂无分类"
                    />
                    <el-skeleton
                      v-else-if="categoriesLoading"
                      :count="3"
                      animated
                    >
                      <template #template>
                        <div class="flex gap-3">
                          <el-skeleton-item
                            variant="text"
                            style="width: 80px"
                            class="!h-8"
                          />
                          <el-skeleton-item
                            variant="text"
                            style="width: 80px"
                            class="!h-8"
                          />
                          <el-skeleton-item
                            variant="text"
                            style="width: 80px"
                            class="!h-8"
                          />
                        </div>
                      </template>
                    </el-skeleton>
                    <template v-else>
                      <div
                        v-for="category in categoriesData"
                        :key="category.id"
                        class="group relative"
                      >
                        <div
                          class="px-4 py-2 rounded-full cursor-pointer transition-all duration-200"
                          :class="[
                            form.categoryIds.includes(category.id)
                              ? 'bg-gray-500 text-white shadow-sm'
                              : 'bg-gray-50 hover:bg-gray-100',
                          ]"
                          @click="handleSelectCategory(category)"
                        >
                          {{ category.name }}
                        </div>
                        <el-button
                          class="!absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          type="danger"
                          size="small"
                          circle
                          @click="handleDeleteCategory(category)"
                        >
                          <el-icon>
                            <Delete />
                          </el-icon>
                        </el-button>
                      </div>
                    </template>
                  </div>

                  <!-- 分类操作按钮 -->
                  <div class="flex items-center space-x-3">
                    <el-button
                      type="primary"
                      @click="handleAddCategory"
                      class="!flex items-center"
                      :loading="loading"
                    >
                      <el-icon class="mr-1">
                        <Plus />
                      </el-icon>
                      添加分类
                    </el-button>
                    <el-button
                      @click="getCategories"
                      class="!flex items-center"
                      :loading="categoriesLoading"
                    >
                      <el-icon class="mr-1">
                        <Refresh />
                      </el-icon>
                      刷新列表
                    </el-button>
                  </div>
                </div>
              </el-form-item>

              <el-form-item
                label="标签"
                prop="tags"
                :rules="[
                  {
                    type: 'array',
                    required: true,
                    message: '请至少添加一个标签',
                    trigger: 'change',
                  },
                ]"
              >
                <div
                  class="flex flex-wrap gap-2 border rounded-lg p-3 bg-gray-50/50"
                >
                  <el-tag
                    v-for="tag in form.tags"
                    :key="tag"
                    closable
                    :disable-transitions="false"
                    @close="handleTagClose(tag)"
                    class="!rounded-full"
                  >
                    {{ tag }}
                  </el-tag>
                  <el-input
                    v-if="inputTagVisible"
                    ref="InputRef"
                    v-model="inputTagValue"
                    class="w-[100px]"
                    size="small"
                    @keyup.enter="handleTagInputConfirm"
                    @blur="handleTagInputConfirm"
                  />
                  <el-button
                    v-else
                    size="small"
                    @click="showTagInput"
                    class="!rounded-full"
                  >
                    + 新标签
                  </el-button>
                </div>
              </el-form-item>

              <el-form-item
                label="内容"
                prop="content"
                :rules="[
                  {
                    required: true,
                    message: '请输入文章内容',
                    trigger: 'blur',
                  },
                ]"
              >
                <client-only>
                  <template #fallback>
                    <div
                      class="border border-gray-200 dark:border-gray-700 h-[400px] flex items-center justify-center bg-gray-50 dark:bg-gray-800"
                    >
                      <p class="text-gray-400">编辑器加载中...</p>
                    </div>
                  </template>
                  <MarkdownEditor
                    v-model="form.content"
                    theme="github"
                    placeholder="在这里输入您的主题内容，支持Markdown格式..."
                    minHeight="250px"
                    :onSave="submit"
                  />
                </client-only>
              </el-form-item>
            </el-form>
          </div>
        </template>
      </el-skeleton>

      <!-- 添加分类对话框 -->
      <el-dialog
        v-model="categoryDialogShow"
        title="添加文章分类"
        width="500px"
        destroy-on-close
        class="rounded-xl"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
      >
        <el-form ref="categoryFormRef" :model="categoryForm" label-width="80px">
          <el-form-item
            label="分类名称"
            prop="name"
            :rules="[
              { required: true, message: '请输入分类名称', trigger: 'blur' },
            ]"
          >
            <el-input
              v-model="categoryForm.name"
              placeholder="请输入分类名称"
              class="!rounded-lg"
              :disabled="loading"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="flex justify-end space-x-3">
            <el-button @click="categoryDialogShow = false" :disabled="loading">
              取消
            </el-button>
            <el-button
              type="primary"
              @click="handleSubmitAddCategory"
              :loading="loading"
            >
              确认
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>
<script setup>
const route = useRoute();
const router = useRouter();
const isEdit = ref(false);

// 加载状态
const loading = ref(false);
const submitting = ref(false);
const categoriesLoading = ref(false);

const categoriesData = ref([]);
const categoryDialogShow = ref(false);
const categoryForm = reactive({
  name: "",
});
const categoryFormRef = ref();
const handleSelectCategory = (category) => {
  if (form.categoryIds.includes(category.id)) {
    form.categoryIds.splice(form.categoryIds.indexOf(category.id), 1);
  } else {
    form.categoryIds.push(category.id);
  }
};
const handleAddCategory = () => {
  categoryDialogShow.value = true;
};
const getCategories = async () => {
  try {
    categoriesLoading.value = true;
    const res = await $fetch("/api/user/blog/category/get", {
      method: "GET",
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });
    if (res.code === 200) {
      categoriesData.value = res.data;
      return true;
    }
    ElMessage.error(res.message || "获取分类列表失败");
    return false;
  } catch (error) {
    console.error("获取分类失败:", error);
    ElMessage.error("获取分类列表失败");
    return false;
  } finally {
    categoriesLoading.value = false;
  }
};
const handleSubmitAddCategory = async () => {
  try {
    await categoryFormRef.value.validate();
    loading.value = true;
    const res = await $fetch("/api/user/blog/category/post", {
      method: "POST",
      body: {
        name: categoryForm.name,
      },
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });

    if (res.code === 200) {
      ElMessage.success("添加分类成功");
      categoryDialogShow.value = false;
      categoryForm.name = "";
      await getCategories();
    } else {
      ElMessage.error(res.message || "添加分类失败");
    }
  } catch (error) {
    console.error("添加分类失败:", error);
    ElMessage.error("添加分类失败");
  } finally {
    loading.value = false;
  }
};

const handleDeleteCategory = async (category, index) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这个分类吗？删除后不可恢复。",
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    loading.value = true;
    const res = await $fetch(`/api/user/blog/category/${category.id}`, {
      method: "DELETE",
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });

    if (res.code === 200) {
      ElMessage.success("删除分类成功");
      // 如果当前文章使用了这个分类，也要移除
      const index = form.categoryIds.indexOf(category.id);
      if (index > -1) {
        form.categoryIds.splice(index, 1);
      }
      await getCategories();
    } else {
      ElMessage.error(res.message || "删除分类失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除分类失败:", error);
      ElMessage.error("删除分类失败");
    }
  } finally {
    loading.value = false;
  }
};

const form = reactive({
  title: "",
  content: "",
  categoryIds: [],
  tags: [],
  status: "pending",
});
const formRef = ref();

const submit = async () => {
  try {
    await formRef.value.validate();
    submitting.value = true;

    const api = isEdit.value
      ? `/api/user/blog/posts/${form.id}`
      : "/api/user/blog/posts/post";
    const method = isEdit.value ? "PUT" : "POST";

    const res = await $fetch(api, {
      method,
      body: form,
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });

    if (res.code === 200) {
      ElMessage.success(isEdit.value ? "更新文章成功" : "发布文章成功");
      router.push("/user/posts/list");
    } else {
      ElMessage.error(
        res.message || (isEdit.value ? "更新文章失败" : "发布文章失败")
      );
    }
  } catch (error) {
    console.error(error);
    ElMessage.error(isEdit.value ? "更新文章失败" : "发布文章失败");
  } finally {
    submitting.value = false;
  }
};

// 标签输入相关
const inputTagValue = ref("");
const inputTagVisible = ref(false);
const InputRef = ref();

const showTagInput = () => {
  inputTagVisible.value = true;
  nextTick(() => {
    InputRef.value.input.focus();
  });
};

const handleTagClose = (tag) => {
  form.tags.splice(form.tags.indexOf(tag), 1);
};

const handleTagInputConfirm = () => {
  if (inputTagValue.value) {
    if (!form.tags.includes(inputTagValue.value)) {
      form.tags.push(inputTagValue.value);
    }
  }
  inputTagValue.value = "";
  inputTagVisible.value = false;
};

onMounted(async () => {
  try {
    loading.value = true;
    await getCategories();

    if (route.params.id && route.params.id !== "new") {
      isEdit.value = true;
      const res = await $fetch(`/api/user/blog/posts/${route.params.id}`, {
        method: "GET",
        headers: {
          authorization: "Bearer " + useCookie("token").value,
        },
      });

      if (res.code === 200) {
        Object.assign(form, res.data);
        form.categoryIds = res.data.categories.map((item) => item.categoryId);
      } else {
        ElMessage.error(res.message || "获取文章详情失败");
        router.push("/user/posts/list");
      }
    } else {
      isEdit.value = false;
    }
  } catch (error) {
    console.error("初始化失败:", error);
    ElMessage.error("页面初始化失败");
    router.push("/user/posts/list");
  } finally {
    loading.value = false;
  }
});
</script>
<style scoped></style>
