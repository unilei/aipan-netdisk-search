# 评论管理页面
<script setup>
import { Delete, Search } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { marked } from "marked";
import { format } from "date-fns";
import { sanitizeHtml } from "~/utils/sanitize";

definePageMeta({
  layout: "admin",
  middleware: ["auth"],
  ssr: false,
});

const comments = ref([]);
const loading = ref(true);
const page = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);

// 搜索条件
const searchForm = reactive({
  keyword: "",
  searchType: "content",
});

// 搜索类型选项
const searchTypeOptions = [
  { label: "评论内容", value: "content" },
  { label: "评论作者", value: "author" },
  { label: "作者邮箱", value: "email" },
];

// 格式化日期
const formatDate = (date) => {
  return format(new Date(date), "yyyy-MM-dd HH:mm:ss");
};

// 解析评论内容
const parseContent = (content) => {
  try {
    return sanitizeHtml(marked.parse(content || ''));
  } catch (e) {
    return content || '';
  }
};

// 获取评论列表
const fetchComments = async () => {
  try {
    loading.value = true;
    const response = await $fetch(`/api/blog/comments`, {
      method: "GET",
      query: {
        page: page.value,
        pageSize: pageSize.value,
        keyword: searchForm.keyword,
        searchType: searchForm.searchType,
      },
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });
    if (response.code === 200) {
      comments.value = response.data.comments || [];
      totalCount.value = response.data.total || 0;
    } else {
      ElMessage.error(response.message || "加载评论失败");
      comments.value = [];
      totalCount.value = 0;
    }
  } catch (error) {
    console.error("Error fetching comments:", error);
    ElMessage.error("加载评论失败，请刷新重试");
    comments.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
};

// 删除评论
const handleDeleteComment = async (row) => {
  try {
    const response = await $fetch(`/api/blog/comments/${row.id}`, {
      method: "DELETE",
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });

    if (response.code === 200) {
      ElMessage.success("评论删除成功");
      await fetchComments();
    } else {
      ElMessage.error(response.message || "删除失败");
    }
  } catch (error) {
    console.error("Error deleting comment:", error);
    ElMessage.error("删除失败，请稍后重试");
  }
};

// 页面切换
const handleCurrentChange = (val) => {
  page.value = val;
  fetchComments();
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchComments();
};

// 搜索评论
const handleSearch = () => {
  page.value = 1; // 重置页码
  fetchComments();
};

// 重置搜索
const handleReset = () => {
  searchForm.keyword = "";
  searchForm.searchType = "content";
  page.value = 1;
  fetchComments();
};

onMounted(() => {
  fetchComments();
});
</script>

<template>
  <div class="space-y-6">
    <!-- 搜索区域 -->
    <div class="bg-white rounded-lg p-6 shadow-sm">
      <div class="flex items-center space-x-4">
        <el-select
          v-model="searchForm.searchType"
          placeholder="搜索类型"
          class="!w-32"
        >
          <el-option
            v-for="option in searchTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-input
          v-model="searchForm.keyword"
          placeholder="请输入搜索关键词"
          class="!w-80"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch" :icon="Search">
          搜索
        </el-button>
        <el-button @click="handleReset"> 重置 </el-button>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="bg-white rounded-lg p-6 shadow-sm">
      <el-table
        v-loading="loading"
        :data="comments"
        style="width: 100%"
        :border="true"
        class="mt-4"
      >
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column label="评论者" width="200">
          <template #default="{ row }">
            <div class="flex items-center">
              <img
                :src="row.avatar"
                :alt="row.author"
                class="w-8 h-8 rounded-full mr-2"
              />
              <div>
                <div class="font-medium">{{ row.author }}</div>
                <div class="text-xs text-gray-500">{{ row.email }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="评论内容" min-width="300">
          <template #default="{ row }">
            <div
              class="prose prose-sm max-w-none dark:prose-invert"
              v-html="parseContent(row.content)"
            />
            <div v-if="row.parentId" class="mt-2 text-xs text-gray-500 italic">
              回复评论 #{{ row.parentId }}
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          label="评论时间"
          width="180"
          align="center"
        >
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-popconfirm
              title="确定要删除这条评论吗？这将同时删除所有回复。"
              @confirm="handleDeleteComment(row)"
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
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页器 -->
      <div
        class="mt-6 flex justify-center"
        v-if="!loading && comments.length > 0"
      >
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

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && comments.length === 0"
        description="暂无评论"
      />
    </div>
  </div>
</template>

<style scoped>
.prose {
  font-size: 0.875rem;
}

:deep(.el-table) {
  --el-table-border-color: var(--el-border-color-lighter);
  --el-table-header-bg-color: var(--el-fill-color-light);
}

:deep(.el-table th) {
  font-weight: 600;
  background-color: var(--el-fill-color-light);
}

:deep(.el-button--danger) {
  --el-button-hover-bg-color: var(--el-color-danger-light-3);
  --el-button-hover-border-color: var(--el-color-danger-light-3);
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-border-color) !important;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-border-color-hover) !important;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) !important;
}
</style>
