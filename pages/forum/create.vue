<template>
  <main class="min-h-screen bg-[#f8fafc] py-4 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
    <section class="mx-auto grid max-w-[1100px] gap-4 px-3 md:grid-cols-[minmax(0,1fr)_270px]">
      <div class="min-w-0 space-y-3">
        <div class="v2-box v2-crumb">
          <NuxtLink to="/forum" class="hover:text-[#4d5256]">论坛首页</NuxtLink>
          <span>›</span>
          <span>发布主题</span>
        </div>

        <div v-if="!user" class="v2-box px-4 py-12 text-center text-sm text-[#666] dark:text-slate-300">
          <i class="fas fa-lock text-3xl text-[#bbb]"></i>
          <h1 class="mt-4 text-base font-semibold text-[#333] dark:text-white">需要登录</h1>
          <p class="mt-2">请登录后发布主题，登录后会回到当前发帖页面。</p>
          <button class="mt-5 v2-primary-button" type="button" @click="navigateToLogin">
            登录 / 注册
          </button>
        </div>

        <section v-else class="v2-box">
          <div class="v2-side-header">发布新主题</div>
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
            class="forum-post-form"
            @submit.prevent="handleSubmit"
          >
            <div class="v2-form-row">
              <label class="v2-form-label">板块</label>
              <div class="min-w-0">
                <el-form-item prop="categoryId" class="!mb-0">
                  <el-select v-model="form.categoryId" placeholder="请选择板块" class="w-full" filterable>
                    <el-option
                      v-for="category in categories"
                      :key="category.id"
                      :label="category.name"
                      :value="category.id"
                    >
                      <div class="flex items-center justify-between gap-3">
                        <span>{{ category.name }}</span>
                        <span class="text-xs text-[#999]">{{ category._count?.topics || 0 }} 主题</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>
                <p v-if="selectedCategory" class="mt-2 text-xs leading-5 text-[#999]">
                  {{ selectedCategory.description || "该板块暂无简介" }}
                </p>
              </div>
            </div>

            <div class="v2-form-row">
              <label class="v2-form-label">标题</label>
              <div class="min-w-0">
                <el-form-item prop="title" class="!mb-0">
                  <el-input
                    v-model="form.title"
                    placeholder="一句话说明要讨论的问题或资源线索"
                    maxlength="100"
                    show-word-limit
                  />
                </el-form-item>
                <p class="mt-2 text-xs text-[#999]">建议包含关键词，方便其他用户搜索和判断是否要进入。</p>
              </div>
            </div>

            <div class="v2-form-row">
              <label class="v2-form-label">正文</label>
              <div class="min-w-0">
                <el-form-item prop="content" class="!mb-0 min-w-0">
                  <client-only>
                    <template #fallback>
                      <div class="flex h-[300px] items-center justify-center bg-[#f5f5f5] dark:bg-white/5">
                        <p class="text-xs text-[#999]">编辑器加载中...</p>
                      </div>
                    </template>
                    <MarkdownEditor
                      v-model="form.content"
                      placeholder="写清背景、问题和希望大家帮你确认的内容。支持 Markdown。"
                      minHeight="300px"
                      :onSave="handleSubmit"
                    />
                  </client-only>
                </el-form-item>
                <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#999]">
                  <span>支持链接、图片、代码块和列表。</span>
                  <span>{{ contentLength }} 字</span>
                </div>
              </div>
            </div>

            <div class="v2-form-footer">
              <p class="text-xs text-[#999]">如果进入审核，主题通过后才会公开显示。</p>
              <div class="flex items-center gap-2">
                <button type="button" class="v2-primary-button" :disabled="submitting" @click="handleSubmit">
                  {{ submitting ? "发布中..." : "发布主题" }}
                </button>
                <button type="button" class="v2-muted-button" @click="router.push('/forum')">
                  取消
                </button>
              </div>
            </div>
          </el-form>
        </section>
      </div>

      <aside class="space-y-3">
        <section class="v2-box">
          <div class="v2-side-header">发布检查</div>
          <div class="space-y-3 px-4 py-3 text-xs leading-6 text-[#666] dark:text-slate-300">
            <p>标题能让别人一眼看懂主题。</p>
            <p>正文包含背景、问题或资源有效性说明。</p>
            <p>板块和主题内容匹配。</p>
          </div>
        </section>

        <section class="v2-box">
          <div class="v2-side-header">审核说明</div>
          <div class="px-4 py-3 text-xs leading-6 text-[#666] dark:text-slate-300">
            <p>包含敏感词或需要人工确认的主题会进入审核。你可以在用户中心查看审核状态。</p>
            <NuxtLink to="/user/forum" class="mt-3 inline-flex text-[#778087] hover:text-[#4d5256]">
              查看我的帖子和回复
            </NuxtLink>
          </div>
        </section>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { ElMessage } from "element-plus";
import { ref, reactive, computed, onMounted } from "vue";

useHead({
  title: "发布新主题 - 社区论坛 - 爱盼",
  meta: [
    {
      name: "description",
      content: "在爱盼社区论坛发布新主题，分享你的想法和见解，与社区成员互动交流。",
    },
  ],
});

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const user = computed(() => userStore.user);

const formRef = ref(null);

const { data: categoriesData } = await useFetch("/api/forum/categories");
const categories = computed(() => {
  if (!categoriesData.value?.success) return [];
  return categoriesData.value.data;
});

const form = reactive({
  categoryId: route.query.categoryId ? parseInt(route.query.categoryId) : "",
  title: "",
  content: "",
});

const selectedCategory = computed(() => {
  return categories.value.find((category) => category.id === form.categoryId) || null;
});

const contentLength = computed(() => form.content.trim().length);

const rules = {
  categoryId: [{ required: true, message: "请选择板块", trigger: "change" }],
  title: [
    { required: true, message: "请输入标题", trigger: "blur" },
    {
      min: 3,
      max: 100,
      message: "标题长度应在3到100个字符之间",
      trigger: "blur",
    },
  ],
  content: [
    { required: true, message: "请输入内容", trigger: "blur" },
    {
      min: 5,
      message: "内容至少需要5个字符",
      trigger: "blur",
    },
  ],
};

const submitting = ref(false);

const handleSubmit = async () => {
  if (submitting.value) return;

  if (!form.categoryId) {
    ElMessage.error("请选择板块");
    return;
  }

  if (!form.title.trim()) {
    ElMessage.error("请输入标题");
    return;
  }

  if (form.title.trim().length < 3) {
    ElMessage.error("标题至少需要3个字符");
    return;
  }

  if (!form.content.trim()) {
    ElMessage.error("请输入内容");
    return;
  }

  if (form.content.trim().length < 5) {
    ElMessage.error("内容至少需要5个字符");
    return;
  }

  try {
    submitting.value = true;
    const response = await $fetch("/api/forum/topics", {
      method: "POST",
      body: {
        title: form.title.trim(),
        content: form.content.trim(),
        categoryId: form.categoryId,
      },
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });

    if (response.success) {
      if (response.data && response.data.status === "approved") {
        ElMessage.success("发布成功");
        router.push(`/forum/topic/${response.data.slug}`);
      } else {
        ElMessage.success("主题已提交，等待审核");
        router.push("/user/forum");
      }
    } else {
      ElMessage.error(response.message || "发布失败");
    }
  } catch (error) {
    console.error("主题发布失败:", error);
    ElMessage.error("发布失败");
  } finally {
    submitting.value = false;
  }
};

function navigateToLogin() {
  router.push(`/login?redirect=${encodeURIComponent(route.fullPath || "/forum/create")}`);
}

onMounted(() => {
  if (!user.value) {
    ElMessage.warning("请登录后发布主题");
  }
});
</script>

<style>
.v2-box {
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  box-shadow: 0 1px 0 rgb(0 0 0 / 0.04);
  overflow: hidden;
}

.dark .v2-box {
  background: rgb(15 23 42 / 0.92);
  border-color: rgb(255 255 255 / 0.12);
}

.v2-crumb {
  align-items: center;
  color: #778087;
  display: flex;
  flex-wrap: wrap;
  font-size: 12px;
  gap: 8px;
  padding: 10px 12px;
}

.v2-side-header {
  background: #fff;
  border-bottom: 1px solid #eee;
  color: #999;
  font-size: 12px;
  line-height: 1;
  padding: 10px 12px;
}

.dark .v2-side-header {
  background: rgb(30 41 59 / 0.75);
  border-bottom-color: rgb(255 255 255 / 0.1);
  color: rgb(148 163 184);
}

.v2-form-row {
  border-bottom: 1px solid #eee;
  display: grid;
  gap: 12px;
  padding: 14px 16px;
}

@media (min-width: 768px) {
  .v2-form-row {
    grid-template-columns: 90px minmax(0, 1fr);
  }
}

.dark .v2-form-row {
  border-bottom-color: rgb(255 255 255 / 0.1);
}

.v2-form-label {
  color: #666;
  font-size: 12px;
  font-weight: 700;
  padding-top: 8px;
}

.dark .v2-form-label {
  color: rgb(203 213 225);
}

.v2-form-footer {
  align-items: center;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: space-between;
  padding: 14px 16px;
}

@media (min-width: 768px) {
  .v2-form-footer {
    flex-direction: row;
    padding-left: 118px;
  }
}

.dark .v2-form-footer {
  background: rgb(30 41 59 / 0.5);
}

.v2-primary-button,
.v2-muted-button {
  border-radius: 3px;
  display: inline-flex;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  padding: 8px 12px;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.v2-primary-button {
  background: #4d90fe;
  color: white;
}

.v2-primary-button:hover {
  background: #357ae8;
}

.v2-primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.v2-muted-button {
  background: #f5f5f5;
  border: 1px solid #ddd;
  color: #666;
}

.v2-muted-button:hover {
  background: #e8e8e8;
  color: #333;
}

.v2-box {
  border: 0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 2px rgb(15 23 42 / 6%);
}

.dark .v2-box {
  background: rgb(255 255 255 / 10%);
  box-shadow: none;
}

.v2-crumb,
.v2-side-header {
  border-color: rgb(226 232 240);
  background: #fff;
  color: rgb(100 116 139);
}

.dark .v2-crumb,
.dark .v2-side-header {
  border-color: rgb(255 255 255 / 10%);
  background: transparent;
}

.v2-form-row {
  border-color: rgb(226 232 240);
}

.v2-form-label {
  color: rgb(71 85 105);
}

.v2-form-footer {
  background: rgb(248 250 252);
}

.dark .v2-form-footer {
  background: transparent;
}

.v2-primary-button {
  border: 0;
  border-radius: 8px;
  background: rgb(37 99 235);
  color: #fff;
  font-size: 12px;
  padding: 8px 12px;
}

.v2-primary-button:hover {
  background: rgb(29 78 216);
}

.v2-muted-button {
  border: 0;
  border-radius: 8px;
  background: rgb(241 245 249);
  color: rgb(71 85 105);
}

.v2-muted-button:hover {
  background: rgb(226 232 240);
  color: rgb(37 99 235);
}

.forum-post-form .el-form-item__label {
  font-size: 12px;
}
</style>
