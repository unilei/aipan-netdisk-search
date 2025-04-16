<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  House, 
  Document, 
  Edit, 
  Delete, 
  Plus, 
  ArrowLeft,
  Check,
  Close,
  Filter
} from '@element-plus/icons-vue';

definePageMeta({
  middleware: ["auth"],
});
const router = useRouter();
const postsData = ref([]);
const page = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const filterStatus = ref('all');

// 拒绝对话框
const rejectDialog = reactive({
  visible: false,
  postId: null,
  loading: false,
  form: {
    reason: ''
  }
});

const getPosts = async () => {
  const res = await $fetch("/api/admin/blog/posts/get", {
    method: "GET",
    query: {
      page: page.value,
      pageSize: pageSize.value,
      status: filterStatus.value
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

const handleFilterChange = () => {
  page.value = 1; // 重置到第一页
  getPosts();
};

const handleEditPostsById = (row) => {
  // 如果是管理员文章（ID 以 "admin_" 开头）
  if (typeof row.id === 'string' && row.id.startsWith('admin_')) {
    const actualId = row.id.replace('admin_', '');
    router.push(`/admin/blog/${actualId}`);
  } else {
    router.push(`/admin/blog/${row.id}`);
  }
};

const handleDeletePostsById = async (row) => {
  try {
    // 如果是管理员文章（ID 以 "admin_" 开头）
    if (typeof row.id === 'string' && row.id.startsWith('admin_')) {
      const actualId = row.id.replace('admin_', '');
      await $fetch(`/api/admin/blog/posts/${actualId}`, {
        method: "DELETE",
        headers: {
          authorization: "Bearer " + useCookie("token").value,
        },
      });
    } else {
      // 用户提交的博客文章
      await $fetch(`/api/admin/blog/posts/${row.id}`, {
        method: "DELETE",
        headers: {
          authorization: "Bearer " + useCookie("token").value,
        },
      });
    }
    
    ElMessage.success('文章删除成功');
    getPosts(); // 刷新列表
  } catch (error) {
    ElMessage.error('删除失败: ' + (error.message || '未知错误'));
  }
};

const handleAddPost = () => {
  router.push("/admin/blog/new");
};

// 处理审核通过
const handleApprovePost = async (post) => {
  try {
    await ElMessageBox.confirm(
      `确定要审核通过文章 "${post.title}" 吗？通过后将发布到博客页面。`, 
      '确认审核', 
      {
        confirmButtonText: '通过',
        cancelButtonText: '取消',
        type: 'success'
      }
    );
    
    const res = await $fetch(`/api/admin/blog/posts/approve/${post.id}`, {
      method: 'POST',
      headers: {
        authorization: "Bearer " + useCookie('token').value
      }
    });
    
    if (res.code === 200) {
      ElMessage.success('文章审核通过');
      getPosts(); // 刷新列表
    } else {
      ElMessage.error(res.msg || '操作失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败: ' + error);
    }
  }
};

// 处理拒绝文章
const handleRejectPost = (post) => {
  rejectDialog.postId = post.id;
  rejectDialog.form.reason = '';
  rejectDialog.visible = true;
};

// 确认拒绝
const confirmReject = async () => {
  if (!rejectDialog.form.reason.trim()) {
    ElMessage.warning('请输入拒绝原因');
    return;
  }
  
  rejectDialog.loading = true;
  try {
    const res = await $fetch(`/api/admin/blog/posts/reject/${rejectDialog.postId}`, {
      method: 'POST',
      body: {
        reason: rejectDialog.form.reason
      },
      headers: {
        authorization: "Bearer " + useCookie('token').value
      }
    });
    
    if (res.code === 200) {
      ElMessage.success('已拒绝文章');
      rejectDialog.visible = false;
      getPosts(); // 刷新列表
    } else {
      ElMessage.error(res.msg || '操作失败');
    }
  } catch (error) {
    ElMessage.error('操作失败: ' + error);
  } finally {
    rejectDialog.loading = false;
  }
};

onMounted(() => {
  getPosts();
});
</script>
<template>
  <div>
    <div class="min-h-[calc(100vh-60px)] bg-gray-50 p-6">
      <div class="max-w-[1240px] mx-auto space-y-6">
        <!-- 头部区域 -->
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <nuxt-link
                  to="/admin/dashboard"
                  class="hover:text-primary flex items-center"
                >
                  <el-icon class="mr-1">
                    <House />
                  </el-icon>
                  后台管理面板
                </nuxt-link>
                <span>/</span>
                <span class="text-gray-900">博客管理</span>
              </div>
              <h1 class="text-2xl font-bold text-gray-900">博客文章管理</h1>
              <p class="text-gray-500 mt-1">管理和维护博客文章内容</p>
            </div>
            <el-button
              @click="() => navigateTo('/admin/dashboard')"
              class="flex items-center"
            >
              <el-icon class="mr-1">
                <ArrowLeft />
              </el-icon>
              返回面板
            </el-button>
          </div>
        </div>

        <!-- 操作按钮区域 -->
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <div class="flex items-center justify-between space-x-4">
            <el-button
              type="primary"
              @click="handleAddPost()"
              class="flex items-center"
            >
              <el-icon class="mr-1">
                <Plus />
              </el-icon>
              新建文章
            </el-button>

            <!-- 添加筛选器 -->
            <div class="flex items-center space-x-4">
              <span class="text-gray-600">状态筛选:</span>
              <el-radio-group v-model="filterStatus" @change="handleFilterChange">
                <el-radio-button :value="'all'">全部</el-radio-button>
                <el-radio-button :value="'pending'">待审核</el-radio-button>
                <el-radio-button :value="'published'">已发布</el-radio-button>
                <el-radio-button :value="'rejected'">已拒绝</el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </div>

        <!-- 表格区域 -->
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <template v-if="postsData && postsData.length">
            <el-table
              :data="postsData"
              style="width: 100%"
              :border="true"
              class="mt-4"
            >
              <el-table-column type="index" label="序号" width="80" />
              <el-table-column prop="title" label="文章标题" min-width="200">
                <template #default="{ row }">
                  <div class="flex items-center">
                    <el-icon class="mr-2 text-blue-500">
                      <Document />
                    </el-icon>
                    <span>{{ row.title }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="创建时间" width="180">
                <template #default="{ row }">
                  {{ new Date(row.createdAt).toLocaleString() }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="120">
                <template #default="{ row }">
                  <el-tag
                    :type="
                      row.status === 'published'
                        ? 'success'
                        : row.status === 'pending'
                        ? 'warning'
                        : row.status === 'admin_post'
                        ? 'success'
                        : 'danger'
                    "
                    size="small"
                  >
                    {{
                      row.status === "published"
                        ? "已发布"
                        : row.status === "pending"
                        ? "待审核"
                        : row.status === "admin_post"
                        ? "已发布"
                        : "已拒绝"
                    }}
                  </el-tag>
                  <el-tag v-if="row.status === 'admin_post'" size="small" type="info" class="ml-1">管理员</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="260" fixed="right">
                <template #default="scope">
                  <!-- 审核操作按钮 - 只对待审核的用户文章显示 -->
                  <el-button-group v-if="scope.row.status === 'pending'" class="mr-2">
                    <el-button 
                      type="success" 
                      size="small" 
                      @click="handleApprovePost(scope.row)"
                    >
                      <el-icon><Check /></el-icon>
                      通过
                    </el-button>
                    <el-button 
                      type="danger" 
                      size="small" 
                      @click="handleRejectPost(scope.row)"
                    >
                      <el-icon><Close /></el-icon>
                      拒绝
                    </el-button>
                  </el-button-group>
                  
                  <!-- 常规操作按钮 -->
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
            <div class="mt-6 flex justify-center">
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
            <div>
              <el-empty description="暂无文章" />
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 拒绝原因对话框 -->
    <el-dialog v-model="rejectDialog.visible" title="拒绝文章" width="500px">
      <el-form :model="rejectDialog.form">
        <el-form-item label="拒绝原因" required>
          <el-input 
            type="textarea" 
            v-model="rejectDialog.form.reason" 
            rows="4" 
            placeholder="请输入拒绝原因，将通知给作者"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmReject" :loading="rejectDialog.loading">
          确认拒绝
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
