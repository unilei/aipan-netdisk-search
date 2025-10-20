<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
    <!-- 回复头部 -->
    <div
      class="bg-gray-50 dark:bg-gray-750 px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center"
    >
      <div class="flex items-center">
        <div
          class="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 mr-2 overflow-hidden text-[11px]"
        >
          <span>{{ post.author.username.charAt(0).toUpperCase() }}</span>
        </div>
        <div>
          <div class="text-xs font-medium text-gray-900 dark:text-white">
            {{ post.author.username }}
          </div>
          <div class="text-[10px] text-gray-500 dark:text-gray-400">
            <client-only>{{ formatDate(post.createdAt) }}</client-only>
          </div>
        </div>
      </div>
      <div class="text-xs text-gray-500 dark:text-gray-400">
        #{{ index }}
      </div>
    </div>
    
    <!-- 回复内容 -->
    <div class="px-6 py-4">
      <div
        class="markdown-body prose prose-sm dark:prose-invert max-w-none"
        v-html="parsedContent"
      ></div>
    </div>
    
    <!-- 回复操作 -->
    <div
      class="px-6 py-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center"
    >
      <CommonReportButton 
        content-type="topic"
        :content-id="post.id"
        :content-title="`${post.author.username}的回复`"
      />
      
      <el-button
        v-if="user && canReply"
        size="small"
        link
        @click="$emit('reply', post.id)"
        class="!text-xs !text-gray-500 hover:!text-blue-600 dark:!text-gray-400 dark:hover:!text-blue-400"
      >
        <i class="fas fa-reply mr-1 text-xs"></i>回复
      </el-button>
    </div>
    
    <!-- 子回复 -->
    <div v-if="post.children && post.children.length > 0" class="pl-6 pr-4 pb-4">
      <div class="space-y-3">
        <div 
          v-for="(child, childIndex) in post.children" 
          :key="child.id"
          class="border-l-2 border-gray-200 dark:border-gray-700 pl-4 mt-3"
        >
          <!-- 递归使用组件自身来显示子回复 -->
          <ForumPostItem
            :post="child"
            :index="`${index}.${childIndex + 1}`"
            :topic="topic"
            :user="user"
            :can-reply="canReply"
            @reply="$emit('reply', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { computed } from "vue";
import { marked } from "marked";

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  index: {
    type: [Number, String],
    required: true
  },
  topic: {
    type: Object,
    required: true
  },
  user: {
    type: Object,
    default: null
  },
  canReply: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['reply']);

// 解析Markdown内容
const parsedContent = computed(() => {
  if (!props.post.content) return "";
  return marked.parse(props.post.content);
});

// 格式化日期
function formatDate(dateString) {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: zhCN,
    });
  } catch (error) {
    return "未知时间";
  }
}
</script>

<style scoped>
/* 子回复样式 */
.child-replies {
  margin-left: 1.5rem;
  border-left: 2px solid #e5e7eb;
  padding-left: 1rem;
}

/* 深色模式下的边框颜色 */
:deep(.dark) .child-replies {
  border-left-color: #374151;
}
</style>
