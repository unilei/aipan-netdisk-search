<script setup>
definePageMeta({
  middleware: ["auth"],
});
const router = useRouter();
const colorMode = useColorMode();
const postsData = ref([]);
const page = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const getPosts = async () => {
  const res = await $fetch("/api/user/blog/posts/get", {
    method: "GET",
    query: {
      page: page.value,
      pageSize: pageSize.value,
    },
    headers: {
      authorization: "Bearer " + useCookie("token").value,
    },
  });
  // console.log(res)
  postsData.value = res.posts;
  totalCount.value = res.totalCount;
};
const handleCurrentChange = (val) => {
  page.value = val;
  getPosts();
};
const handleSizeChange = (val) => {
  pageSize.value = val;
  getPosts();
};
const handleEditPostsById = (row) => {
  router.push(`/user/posts/${row.id}`);
};

const handleDeletePostsById = (row) => {
  // console.log(row)
  $fetch(`/api/user/blog/posts/${row.id}`, {
    method: "DELETE",
    headers: {
      authorization: "Bearer " + useCookie("token").value,
    },
  });
  getPosts();
};
const handleAddPost = () => {
  router.push("/user/posts/new");
};
onMounted(() => {
  // 强制使用浅色模式
  if (colorMode.preference !== "light") {
    colorMode.preference = "light";
  }
  getPosts();
});

// 监听组件激活，确保始终是浅色模式
onActivated(() => {
  if (colorMode.preference !== "light") {
    colorMode.preference = "light";
  }
});
</script>
<template>
  <div class="min-h-[calc(100vh-60px)] bg-gray-50 dark:bg-gray-900">
    <div class="max-w-[1240px] mx-auto p-6">
      <!-- 头部区域 -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6"
      >
        <div class="relative h-24 bg-gradient-to-r from-blue-500 to-purple-500">
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
              <span>我的博客</span>
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
                我的博客
              </h1>
              <p class="text-gray-500 dark:text-gray-400">管理您的博客文章</p>
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
              新建文章
            </h2>
            <el-icon class="text-2xl text-blue-500">
              <Plus />
            </el-icon>
          </div>
          <p class="text-gray-500 dark:text-gray-400 mb-4">创建新的博客文章</p>
          <el-button type="primary" @click="handleAddPost()" class="w-full">
            新建文章
          </el-button>
        </div>
      </div>

      <!-- 表格区域 -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
      >
        <template v-if="postsData && postsData.length">
          <el-table
            :data="postsData"
            style="width: 100%"
            :border="true"
            class="p-6"
          >
            <el-table-column type="index" label="序号" width="80" />
            <el-table-column prop="title" label="文章标题" min-width="200">
              <template #default="{ row }">
                <div class="flex items-center group">
                  <el-icon class="mr-2 text-blue-500">
                    <Document />
                  </el-icon>
                  <span class="dark:text-gray-200">{{ row.title }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="categories" label="分类" min-width="150">
              <template #default="{ row }">
                <div class="flex flex-wrap gap-1">
                  <el-tag
                    v-for="category in row.categories"
                    :key="category.categoryId"
                    size="small"
                    type="info"
                  >
                    {{ category.category.name }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="tags" label="标签" min-width="150">
              <template #default="{ row }">
                <div class="flex flex-wrap gap-1">
                  <el-tag
                    v-for="tag in row.tags"
                    :key="tag"
                    size="small"
                    type="success"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">
                <span class="text-gray-500 dark:text-gray-400">{{
                  new Date(row.createdAt).toLocaleString()
                }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === 'published' ? 'success' : 'info'"
                  size="small"
                >
                  {{ row.status === "published" ? "已发布" : "草稿" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button-group>
                  <el-button
                    type="primary"
                    size="small"
                    @click="handleEditPostsById(scope.row)"
                  >
                    <el-icon>
                      <Edit />
                    </el-icon>
                    编辑
                  </el-button>
                  <el-popconfirm
                    title="确定要删除这篇文章吗？"
                    @confirm="handleDeletePostsById(scope.row)"
                  >
                    <template #reference>
                      <el-button type="danger" size="small">
                        <el-icon>
                          <Delete />
                        </el-icon>
                        删除
                      </el-button>
                    </template>
                  </el-popconfirm>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页器 -->
          <div class="p-6 flex items-center justify-center">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              background
              layout="total, sizes, prev, pager, next, jumper"
              :total="totalCount"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </template>
        <template v-else>
          <el-empty description="暂无文章" />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 其他样式 */
</style>
