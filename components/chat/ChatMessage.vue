<template>
  <div 
    :class="['flex', isCurrentUser ? 'justify-end' : 'justify-start']"
    :id="`message-${message.id}`"
  >
    <div 
      :class="[
        'max-w-[70%] rounded-lg p-3',
        isCurrentUser 
          ? 'bg-primary-100 dark:bg-primary-900 rounded-tr-none' 
          : 'bg-gray-100 dark:bg-gray-700 rounded-tl-none'
      ]"
    >
      <!-- 消息头部信息 -->
      <div class="flex items-center mb-1">
        <div v-if="!isCurrentUser" class="font-medium text-sm mr-2">{{ message.user.username }}</div>
        <div class="text-xs text-gray-500">{{ formatTime(message.createdAt) }}</div>
      </div>
      
      <!-- 回复信息 -->
      <div 
        v-if="message.replyTo" 
        class="text-xs mb-2 p-2 rounded bg-gray-200 dark:bg-gray-600"
        @click="scrollToMessage(message.replyTo.id)"
      >
        <div class="flex items-center mb-1">
          <span class="text-gray-500 mr-1">回复</span>
          <span class="font-medium">{{ message.replyTo.user.username }}:</span>
        </div>
        <div class="text-gray-600 dark:text-gray-300 truncate">{{ message.replyTo.content }}</div>
      </div>
      
      <!-- 消息内容 -->
      <div class="whitespace-pre-wrap break-words">
        {{ message.content }}
      </div>
      
      <!-- 图片或文件消息 -->
      <img 
        v-if="message.type === 'image' && message.fileUrl" 
        :src="message.fileUrl" 
        alt="Image"
        class="max-w-full mt-2 rounded"
        @click="openImage(message.fileUrl)"
      />
      
      <a 
        v-if="message.type === 'file' && message.fileUrl" 
        :href="message.fileUrl"
        target="_blank"
        class="block mt-2 text-sm text-primary-600 hover:underline"
      >
        <i class="i-carbon-document mr-1"></i>
        下载文件
      </a>
      
      <!-- 消息操作 -->
      <div 
        :class="[
          'flex gap-2 mt-1 text-xs text-gray-500',
          isCurrentUser ? 'justify-end' : 'justify-start'
        ]"
      >
        <button 
          @click="$emit('reply', message)"
          class="hover:text-gray-700 dark:hover:text-gray-300"
        >
          回复
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  currentUserId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['reply'])

// 判断是否是当前用户的消息
const isCurrentUser = computed(() => {
  return props.message.userId === Number(props.currentUserId)
})

// 格式化时间
function formatTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  // 一分钟内
  if (diff < 60 * 1000) {
    return '刚刚'
  }
  
  // 一小时内
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes}分钟前`
  }
  
  // 今天内
  if (date.getDate() === now.getDate() && 
      date.getMonth() === now.getMonth() && 
      date.getFullYear() === now.getFullYear()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.getDate() === yesterday.getDate() && 
      date.getMonth() === yesterday.getMonth() && 
      date.getFullYear() === yesterday.getFullYear()) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }
  
  // 一周内
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ['日', '一', '二', '三', '四', '五', '六']
    return `周${days[date.getDay()]} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }
  
  // 更早
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// 滚动到特定消息
function scrollToMessage(messageId) {
  const element = document.getElementById(`message-${messageId}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    
    // 高亮效果
    element.classList.add('bg-yellow-100', 'dark:bg-yellow-800')
    setTimeout(() => {
      element.classList.remove('bg-yellow-100', 'dark:bg-yellow-800')
    }, 3000)
  }
}

// 打开图片
function openImage(url) {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank')
  }
}
</script>
