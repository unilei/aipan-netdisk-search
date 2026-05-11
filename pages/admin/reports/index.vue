<script setup>
import { ref, onMounted } from 'vue';

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
});

const route = useRoute();

const reports = ref([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const selectedStatus = ref('all');

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'reviewing' },
  { label: '已解决', value: 'resolved' },
  { label: '已驳回', value: 'rejected' }
];

const reasonLabels = {
  spam: '垃圾广告',
  illegal: '违法违规',
  pornography: '色情低俗',
  violence: '暴力血腥',
  harassment: '骚扰辱骂',
  copyright: '侵犯版权',
  privacy: '侵犯隐私',
  false: '虚假信息',
  other: '其他问题'
};

const contentTypeLabels = {
  post: '博客文章',
  comment: '评论',
  topic: '论坛主题',
  message: '聊天消息',
  resource: '资源'
};

const statusColors = {
  pending: 'warning',
  reviewing: 'primary',
  resolved: 'success',
  rejected: 'info'
};
const statusQueryValues = new Set(statusOptions.map((item) => item.value));

const applyRouteStatusFilter = () => {
  const status = Array.isArray(route.query.status)
    ? route.query.status[0]
    : route.query.status;

  selectedStatus.value = statusQueryValues.has(status) ? status : 'all';
  currentPage.value = 1;
};

// 加载举报列表
const loadReports = async () => {
  try {
    loading.value = true;
    const res = await $fetch('/api/admin/reports/list', {
      method: 'GET',
      headers: {
        "authorization": "Bearer " + useCookie('token').value
      },
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        status: selectedStatus.value
      }
    });

    if (res.code === 200) {
      reports.value = res.data.reports;
      total.value = res.data.total;
    } else {
      ElMessage.error(res.msg || '加载失败');
    }
  } catch (error) {
    console.error('Load reports error:', error);
    ElMessage.error('加载举报列表失败');
  } finally {
    loading.value = false;
  }
};

// 处理举报
const handleReport = async (reportId, action, adminNote = '') => {
  try {
    const res = await $fetch('/api/admin/reports/handle', {
      method: 'POST',
      headers: {
        "authorization": "Bearer " + useCookie('token').value
      },
      body: {
        reportId,
        action,
        adminNote
      }
    });

    if (res.code === 200) {
      ElMessage.success('处理成功');
      loadReports();
    } else {
      ElMessage.error(res.msg || '处理失败');
    }
  } catch (error) {
    console.error('Handle report error:', error);
    ElMessage.error('操作失败');
  }
};

// 查看内容详情
const viewContent = (report) => {
  const routes = {
    post: `/blog/${report.contentId}`,
    comment: `/blog/${report.contentId}`,
    topic: `/forum/topic/${report.contentId}`,
    resource: `/admin/user-resources`
  };
  
  const route = routes[report.contentType];
  if (route) {
    window.open(route, '_blank');
  } else {
    ElMessage.info('该内容类型暂不支持预览');
  }
};

// 格式化时间
const formatTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

// 处理对话框
const dialogVisible = ref(false);
const currentReport = ref(null);
const handleForm = ref({
  action: '',
  adminNote: ''
});

const openHandleDialog = (report, action) => {
  currentReport.value = report;
  handleForm.value.action = action;
  handleForm.value.adminNote = '';
  dialogVisible.value = true;
};

const submitHandle = async () => {
  if (!handleForm.value.adminNote && handleForm.value.action === 'reject') {
    ElMessage.warning('请填写驳回原因');
    return;
  }

  await handleReport(
    currentReport.value.id,
    handleForm.value.action,
    handleForm.value.adminNote
  );
  
  dialogVisible.value = false;
};

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page;
  loadReports();
};

// 状态筛选
const handleStatusChange = () => {
  currentPage.value = 1;
  loadReports();
};

onMounted(() => {
  applyRouteStatusFilter();
  loadReports();
});

watch(
  () => route.query.status,
  () => {
    applyRouteStatusFilter();
    loadReports();
  }
);
</script>

<template>
  <div class="space-y-6">
    <!-- 筛选栏 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">状态筛选：</span>
        <el-select v-model="selectedStatus" @change="handleStatusChange" class="w-40">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <div class="flex-1"></div>
        <el-button @click="loadReports" :loading="loading">
          <i class="fas fa-sync-alt mr-2"></i>刷新
        </el-button>
      </div>
    </div>

    <!-- 举报列表 -->
    <div v-loading="loading" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <el-table :data="reports" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column label="内容类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ contentTypeLabels[row.contentType] || row.contentType }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="举报原因" width="120">
          <template #default="{ row }">
            <span class="text-sm">{{ reasonLabels[row.reason] || row.reason }}</span>
          </template>
        </el-table-column>

        <el-table-column label="内容标题" min-width="200">
          <template #default="{ row }">
            <div class="line-clamp-2 text-sm">
              {{ row.contentTitle || `${contentTypeLabels[row.contentType]} #${row.contentId}` }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="详细描述" min-width="200">
          <template #default="{ row }">
            <div class="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
              {{ row.description }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusColors[row.status]" size="small">
              {{ statusOptions.find(s => s.value === row.status)?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="举报时间" width="160">
          <template #default="{ row }">
            <span class="text-xs text-gray-600 dark:text-gray-400">
              {{ formatTime(row.createdAt) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="flex gap-2">
              <el-button size="small" @click="viewContent(row)">
                <i class="fas fa-eye mr-1"></i>查看
              </el-button>
              
              <template v-if="row.status === 'pending'">
                <el-button size="small" type="primary" @click="openHandleDialog(row, 'resolve')">
                  <i class="fas fa-check mr-1"></i>解决
                </el-button>
                <el-button size="small" type="info" @click="openHandleDialog(row, 'reject')">
                  <i class="fas fa-times mr-1"></i>驳回
                </el-button>
              </template>
              
              <el-button v-else size="small" disabled>
                已处理
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

        <!-- 分页 -->
        <div class="p-4 border-t dark:border-gray-700">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
      </div>

    <!-- 处理对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="handleForm.action === 'resolve' ? '解决举报' : '驳回举报'"
      width="500px"
    >
      <div class="space-y-4">
        <div v-if="currentReport">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">举报内容：</p>
          <div class="bg-gray-50 dark:bg-gray-700 rounded p-3">
            <p class="text-sm">{{ currentReport.description }}</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">
            {{ handleForm.action === 'resolve' ? '处理备注（可选）' : '驳回原因（必填）' }}
          </label>
          <el-input
            v-model="handleForm.adminNote"
            type="textarea"
            :rows="4"
            :placeholder="handleForm.action === 'resolve' ? '记录处理措施...' : '说明驳回原因...'"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="submitHandle"
        >
          确认{{ handleForm.action === 'resolve' ? '解决' : '驳回' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
