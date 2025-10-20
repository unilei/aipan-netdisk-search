<script setup>
import { ref } from 'vue';

const props = defineProps({
  contentType: {
    type: String,
    required: true,
    validator: (value) => ['post', 'comment', 'topic', 'message', 'resource'].includes(value)
  },
  contentId: {
    type: [Number, String],
    required: true
  },
  contentTitle: {
    type: String,
    default: ''
  }
});

const dialogVisible = ref(false);
const reportForm = ref({
  reason: '',
  description: '',
  email: ''
});
const submitting = ref(false);
const errorMessage = ref('');

const reportReasons = [
  { value: 'spam', label: '垃圾广告' },
  { value: 'illegal', label: '违法违规内容' },
  { value: 'pornography', label: '色情低俗' },
  { value: 'violence', label: '暴力血腥' },
  { value: 'harassment', label: '骚扰辱骂' },
  { value: 'copyright', label: '侵犯版权' },
  { value: 'privacy', label: '侵犯隐私' },
  { value: 'false', label: '虚假信息' },
  { value: 'other', label: '其他问题' }
];

const openDialog = () => {
  dialogVisible.value = true;
  document.body.style.overflow = 'hidden';
};

const closeDialog = () => {
  dialogVisible.value = false;
  document.body.style.overflow = '';
  resetForm();
};

const resetForm = () => {
  reportForm.value = {
    reason: '',
    description: '',
    email: ''
  };
  errorMessage.value = '';
};

const showToast = (message, type = 'success') => {
  // 简单的提示实现
  const toast = document.createElement('div');
  toast.className = `fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-[10000] transition-all ${
    type === 'success' ? 'bg-green-500 text-white' : 
    type === 'error' ? 'bg-red-500 text-white' : 
    'bg-yellow-500 text-white'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

const submitReport = async () => {
  errorMessage.value = '';
  
  if (!reportForm.value.reason) {
    errorMessage.value = '请选择举报原因';
    showToast('请选择举报原因', 'warning');
    return;
  }

  if (!reportForm.value.description || reportForm.value.description.length < 10) {
    errorMessage.value = '请详细描述举报原因（至少10个字）';
    showToast('请详细描述举报原因（至少10个字）', 'warning');
    return;
  }

  try {
    submitting.value = true;

    const res = await $fetch('/api/report/submit', {
      method: 'POST',
      body: {
        contentType: props.contentType,
        contentId: props.contentId,
        reason: reportForm.value.reason,
        description: reportForm.value.description,
        email: reportForm.value.email,
        contentTitle: props.contentTitle
      }
    });

    if (res.code === 200) {
      showToast('举报已提交，我们会尽快处理', 'success');
      closeDialog();
    } else {
      showToast(res.msg || '举报提交失败', 'error');
    }
  } catch (error) {
    console.error('Report submission error:', error);
    showToast('提交失败，请稍后重试', 'error');
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="report-button-wrapper">
    <!-- 举报按钮 -->
    <button @click="openDialog" 
            class="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors flex items-center gap-1">
      <i class="fas fa-flag"></i>
      <span>举报</span>
    </button>

    <!-- 自定义对话框 -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div v-if="dialogVisible" 
             class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
             @click.self="closeDialog">
          <!-- 遮罩层 -->
          <div class="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"></div>
          
          <!-- 对话框内容 -->
          <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <!-- 对话框头部 -->
            <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">举报内容</h3>
              <button @click="closeDialog" 
                      class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <!-- 对话框主体 -->
            <div class="flex-1 overflow-y-auto px-6 py-6">
              <div class="space-y-4">
        <!-- 提示信息 -->
        <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p class="text-sm text-yellow-800 dark:text-yellow-200">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            请如实填写举报信息，我们会在收到后尽快处理。恶意举报将被记录。
          </p>
        </div>

        <!-- 举报内容信息 -->
        <div v-if="contentTitle" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">举报内容：</p>
          <p class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{{ contentTitle }}</p>
        </div>

                <!-- 举报原因选择 -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    举报原因 <span class="text-red-500">*</span>
                  </label>
                  <select v-model="reportForm.reason" 
                          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all">
                    <option value="">请选择举报原因</option>
                    <option v-for="item in reportReasons" 
                            :key="item.value" 
                            :value="item.value">
                      {{ item.label }}
                    </option>
                  </select>
                </div>

                <!-- 详细描述 -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    详细描述 <span class="text-red-500">*</span>
                  </label>
                  <textarea v-model="reportForm.description" 
                            rows="4" 
                            maxlength="500"
                            placeholder="请详细描述问题，至少10个字"
                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all resize-none"></textarea>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">{{ reportForm.description.length }}/500</p>
                </div>

                <!-- 联系邮箱（可选） -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    联系邮箱（可选）
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i class="fas fa-envelope text-gray-400"></i>
                    </div>
                    <input v-model="reportForm.email" 
                           type="email" 
                           placeholder="如需回复可留下邮箱"
                           class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all" />
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    提供邮箱后我们会将处理结果通知您
                  </p>
                </div>

                <!-- 隐私说明 -->
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p class="text-xs text-gray-600 dark:text-gray-300">
                    <i class="fas fa-shield-alt mr-2 text-blue-500"></i>
                    您的举报信息将被严格保密，仅用于内容审核。详见
                    <nuxt-link to="/privacy-policy" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">
                      隐私政策
                    </nuxt-link>。
                  </p>
                </div>

                <!-- 错误提示 -->
                <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p class="text-sm text-red-600 dark:text-red-400">
                    <i class="fas fa-exclamation-circle mr-2"></i>{{ errorMessage }}
                  </p>
                </div>
              </div>
            </div>
            
            <!-- 对话框底部 -->
            <div class="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
              <button @click="closeDialog" 
                      :disabled="submitting"
                      class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                取消
              </button>
              <button @click="submitReport" 
                      :disabled="submitting"
                      class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-paper-plane"></i>
                {{ submitting ? '提交中...' : '提交举报' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: all 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-from .relative,
.dialog-fade-leave-to .relative {
  transform: scale(0.9) translateY(-20px);
}
</style>
