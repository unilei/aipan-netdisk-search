<template>
  <div
    :id="`message-${message.id}`"
    :class="['group flex w-full gap-2', isCurrentUser ? 'justify-end' : 'justify-start']"
  >
    <div
      v-if="!isCurrentUser"
      class="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-white/10"
    >
      {{ userInitial }}
    </div>

    <div :class="['min-w-0 max-w-[78%] sm:max-w-[680px]', isCurrentUser ? 'items-end' : 'items-start']">
      <div
        :class="[
          'rounded-lg px-3.5 py-2.5 text-sm leading-6 shadow-sm ring-1',
          isCurrentUser
            ? 'rounded-br-sm bg-blue-600 text-white ring-blue-600'
            : 'rounded-bl-sm bg-white text-slate-900 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-white/10',
        ]"
      >
        <div class="mb-1 flex items-center gap-2">
          <div v-if="!isCurrentUser" class="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
            {{ message.user?.username || "用户" }}
          </div>
          <div :class="['text-[11px]', isCurrentUser ? 'text-blue-100' : 'text-slate-400']">
            {{ formatTime(message.createdAt) }}
          </div>
        </div>

        <button
          v-if="message.replyTo"
          class="mb-2 block w-full rounded-md border border-black/5 bg-black/5 p-2 text-left text-xs transition hover:bg-black/10 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
          type="button"
          @click="scrollToMessage(message.replyTo.id)"
        >
          <div :class="['mb-1 font-semibold', isCurrentUser ? 'text-blue-50' : 'text-slate-600 dark:text-slate-300']">
            回复 {{ message.replyTo?.user?.username || "未知用户" }}
          </div>
          <div :class="['truncate', isCurrentUser ? 'text-blue-50/85' : 'text-slate-500 dark:text-slate-400']">
            {{ message.replyTo.content }}
          </div>
        </button>

        <div class="whitespace-pre-wrap break-words">
          {{ message.content }}
        </div>

        <img
          v-if="message.type === 'image' && message.fileUrl"
          :src="message.fileUrl"
          alt="Image"
          class="mt-2 max-w-full rounded-lg"
          @click="openImage(message.fileUrl)"
        />

        <a
          v-if="message.type === 'file' && message.fileUrl"
          :href="message.fileUrl"
          target="_blank"
          class="mt-2 inline-flex items-center text-sm font-semibold underline-offset-2 hover:underline"
          :class="isCurrentUser ? 'text-white' : 'text-blue-600 dark:text-blue-300'"
        >
          <i class="fas fa-file mr-1.5 text-xs"></i>
          下载文件
        </a>
      </div>

      <div :class="['mt-1 flex text-xs', isCurrentUser ? 'justify-end' : 'justify-start']">
        <button
          class="rounded-md px-2 py-1 font-medium text-slate-400 transition hover:bg-white hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
          type="button"
          @click="$emit('reply', message)"
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
    required: true,
  },
  currentUserId: {
    type: [Number, String],
    required: true,
  },
});

defineEmits(["reply"]);

const isCurrentUser = computed(() => {
  return props.message.userId === Number(props.currentUserId);
});

const userInitial = computed(() => {
  return String(props.message.user?.username || "?").charAt(0).toUpperCase();
});

function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60 * 1000) {
    return "刚刚";
  }

  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}分钟前`;
  }

  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return `昨天 ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  }

  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ["日", "一", "二", "三", "四", "五", "六"];
    return `周${days[date.getDay()]} ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  }

  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scrollToMessage(messageId) {
  const element = document.getElementById(`message-${messageId}`);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    element.classList.add("bg-yellow-100", "dark:bg-yellow-800");
    setTimeout(() => {
      element.classList.remove("bg-yellow-100", "dark:bg-yellow-800");
    }, 3000);
  }
}

function openImage(url) {
  if (typeof window !== "undefined") {
    window.open(url, "_blank");
  }
}
</script>
