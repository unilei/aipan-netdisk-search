<template>
  <main class="min-h-screen bg-[#f8fafc] pb-10 text-slate-950 dark:bg-slate-950 dark:text-white">
    <section class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="mb-4 rounded-lg bg-white px-3 py-2 text-xs text-slate-500 dark:bg-white/10 dark:text-slate-400">
        <NuxtLink to="/forum" class="text-blue-600 hover:text-blue-700 dark:text-blue-300">
          <i class="fas fa-home mr-1"></i>
          论坛首页
        </NuxtLink>
        <i class="fas fa-chevron-right mx-2 text-[10px] text-slate-400"></i>
        <span>发表帖子</span>
      </div>

      <div
        v-if="!user"
        class="rounded-lg bg-white p-10 text-center dark:bg-white/10"
      >
        <i class="fas fa-lock text-3xl text-slate-300 dark:text-slate-600"></i>
        <h1 class="mt-4 text-base font-semibold text-slate-800 dark:text-white">需要登录</h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">请登录后发布主题。</p>
        <button
          class="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
          @click="navigateToLogin"
        >
          登录 / 注册
        </button>
      </div>

      <div v-else class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section class="overflow-hidden rounded-lg bg-white dark:bg-white/10">
          <div class="bg-slate-50/80 px-3 py-2 dark:bg-white/5">
            <h1 class="text-xs font-semibold text-slate-700 dark:text-slate-200">发表新主题</h1>
          </div>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
            class="forum-post-form"
            @submit.prevent="handleSubmit"
          >
            <div class="grid gap-3 border-t border-slate-100 px-3 py-3 dark:border-white/10 md:grid-cols-[96px_minmax(0,1fr)]">
              <label class="pt-2 text-xs font-medium text-slate-600 dark:text-slate-300">版块</label>
              <el-form-item prop="categoryId" class="!mb-0">
                <el-select v-model="form.categoryId" placeholder="请选择分类" class="w-full">
                  <el-option
                    v-for="category in categories"
                    :key="category.id"
                    :label="category.name"
                    :value="category.id"
                  />
                </el-select>
              </el-form-item>
            </div>

            <div class="grid gap-3 border-t border-slate-100 px-3 py-3 dark:border-white/10 md:grid-cols-[96px_minmax(0,1fr)]">
              <label class="pt-2 text-xs font-medium text-slate-600 dark:text-slate-300">标题</label>
              <el-form-item prop="title" class="!mb-0">
                <el-input
                  v-model="form.title"
                  placeholder="请输入标题"
                  maxlength="100"
                  show-word-limit
                />
              </el-form-item>
            </div>

            <div class="grid gap-3 border-t border-slate-100 px-3 py-3 dark:border-white/10 md:grid-cols-[96px_minmax(0,1fr)]">
              <label class="pt-2 text-xs font-medium text-slate-600 dark:text-slate-300">内容</label>
              <el-form-item prop="content" class="!mb-0 min-w-0">
                <client-only>
                  <template #fallback>
                    <div class="flex h-[300px] items-center justify-center rounded-lg bg-slate-50 dark:bg-white/5">
                      <p class="text-xs text-slate-400">编辑器加载中...</p>
                    </div>
                  </template>
                  <MarkdownEditor
                    v-model="form.content"
                    placeholder="在这里输入您的主题内容，支持 Markdown 格式..."
                    minHeight="280px"
                    :onSave="handleSubmit"
                  />
                </client-only>
              </el-form-item>
            </div>

            <div class="flex items-center gap-2 border-t border-slate-100 bg-slate-50/80 px-3 py-3 dark:border-white/10 dark:bg-white/5 md:pl-[111px]">
              <button
                type="button"
                class="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="submitting"
                @click="handleSubmit"
              >
                <i class="fas fa-paper-plane mr-1.5"></i>
                {{ submitting ? "发布中..." : "发布主题" }}
              </button>
              <button
                type="button"
                class="rounded-lg px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300"
                @click="router.push('/forum')"
              >
                取消
              </button>
            </div>
          </el-form>
        </section>

        <aside class="overflow-hidden rounded-lg bg-white dark:bg-white/10">
          <div class="bg-slate-50/80 px-3 py-2 dark:bg-white/5">
            <h2 class="text-xs font-semibold text-slate-700 dark:text-slate-200">发帖规则</h2>
          </div>
          <div class="space-y-3 px-3 py-3 text-xs leading-6 text-slate-600 dark:text-slate-400">
            <p><i class="fas fa-check mr-2 text-emerald-500"></i>请选择正确版块，方便其他用户检索。</p>
            <p><i class="fas fa-check mr-2 text-emerald-500"></i>标题简洁明确，避免无意义符号和重复内容。</p>
            <p><i class="fas fa-check mr-2 text-emerald-500"></i>内容尽量补充背景、步骤、截图或代码片段。</p>
            <p><i class="fas fa-triangle-exclamation mr-2 text-amber-500"></i>请勿发布广告、侵权、歧视或违反社区规则的内容。</p>
          </div>
        </aside>
      </div>
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

const rules = {
  categoryId: [{ required: true, message: "请选择分类", trigger: "change" }],
  title: [
    { required: true, message: "请输入标题", trigger: "blur" },
    {
      min: 3,
      max: 100,
      message: "标题长度应在3到100个字符之间",
      trigger: "blur",
    },
  ],
  content: [{ required: true, message: "请输入内容", trigger: "blur" }],
};

const submitting = ref(false);

const handleSubmit = async () => {
  if (submitting.value) return;

  if (!form.categoryId) {
    ElMessage.error("请选择分类");
    return;
  }

  if (!form.title.trim()) {
    ElMessage.error("请输入标题");
    return;
  }

  if (!form.content.trim()) {
    ElMessage.error("请输入内容");
    return;
  }

  try {
    submitting.value = true;
    const response = await $fetch("/api/forum/topics", {
      method: "POST",
      body: {
        title: form.title,
        content: form.content,
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
        router.push("/forum");
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
  router.push("/login?redirect=/forum/create");
}

onMounted(() => {
  if (!user.value) {
    ElMessage.warning("请登录后发布主题");
  }
});
</script>

<style>
.forum-post-form .el-form-item__label {
  font-size: 12px;
}
</style>
