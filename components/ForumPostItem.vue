<template>
  <article class="v2-reply-cell">
    <div class="v2-reply-avatar" :title="post.author?.username">
      {{ getInitial(post.author?.username) }}
    </div>

    <div class="min-w-0 flex-1">
      <header class="flex flex-wrap items-center justify-between gap-2 text-xs text-[#999] dark:text-slate-400">
        <div class="min-w-0">
          <span class="font-semibold text-[#555] dark:text-slate-200">{{ post.author.username }}</span>
          <span class="mx-1">·</span>
          <span><client-only>{{ formatDate(post.createdAt) }}</client-only></span>
        </div>
        <span class="shrink-0 text-[#ccc] dark:text-slate-500">#{{ index }}</span>
      </header>

      <div class="mt-3 forum-markdown markdown-body" v-html="parsedContent"></div>

      <footer class="mt-3 flex items-center justify-end gap-3">
        <CommonReportButton
          content-type="post"
          :content-id="post.id"
          :content-title="`${post.author.username}的回复`"
        />

        <button
          v-if="canPrivateMessage"
          class="text-xs font-medium text-[#778087] hover:text-[#4d5256] dark:text-slate-400 dark:hover:text-white"
          @click="$emit('private-message', post.author)"
        >
          <i class="fas fa-envelope mr-1"></i>
          私信
        </button>

        <button
          v-if="user && canReply"
          class="text-xs font-medium text-[#778087] hover:text-[#4d5256] dark:text-slate-400 dark:hover:text-white"
          @click="$emit('reply', post.id)"
        >
          <i class="fas fa-reply mr-1"></i>
          回复
        </button>
      </footer>
    </div>
  </article>

  <div v-if="post.children && post.children.length > 0" class="v2-reply-children">
      <ForumPostItem
        v-for="(child, childIndex) in post.children"
        :key="child.id"
        :post="child"
        :index="`${index}.${childIndex + 1}`"
        :topic="topic"
        :user="user"
        :can-reply="canReply"
        @reply="$emit('reply', $event)"
        @private-message="$emit('private-message', $event)"
      />
  </div>
</template>

<script setup>
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { computed } from "vue";
import { marked } from "marked";
import { sanitizeHtml } from "~/utils/sanitize";

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
  index: {
    type: [Number, String],
    required: true,
  },
  topic: {
    type: Object,
    required: true,
  },
  user: {
    type: Object,
    default: null,
  },
  canReply: {
    type: Boolean,
    default: true,
  },
});

defineEmits(["reply", "private-message"]);

const canPrivateMessage = computed(() => {
  return Boolean(
    props.user &&
      props.post?.author?.id &&
      Number(props.user.id) !== Number(props.post.author.id),
  );
});

const parsedContent = computed(() => {
  if (!props.post.content) return "";
  return sanitizeHtml(marked.parse(props.post.content));
});

function getInitial(name) {
  return String(name || "?").charAt(0).toUpperCase();
}

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
.v2-reply-cell {
  align-items: flex-start;
  background: white;
  border-bottom: 1px solid #e2e2e2;
  display: flex;
  gap: 12px;
  padding: 12px;
}

.dark .v2-reply-cell {
  background: rgb(15 23 42 / 0.92);
  border-bottom-color: rgb(255 255 255 / 0.1);
}

.v2-reply-cell:hover {
  background: #fafafa;
}

.dark .v2-reply-cell:hover {
  background: rgb(30 41 59 / 0.8);
}

.v2-reply-avatar {
  align-items: center;
  background: linear-gradient(135deg, #f5f5f5, #d8d8d8);
  border-radius: 4px;
  color: #666;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 16px;
  font-weight: 700;
  height: 48px;
  justify-content: center;
  line-height: 1;
  overflow: hidden;
  text-transform: uppercase;
  width: 48px;
}

.dark .v2-reply-avatar {
  background: linear-gradient(135deg, rgb(51 65 85), rgb(15 23 42));
  color: rgb(226 232 240);
}

.v2-reply-children {
  background: #f9f9f9;
  border-bottom: 1px solid #e2e2e2;
  padding-left: 44px;
}

.dark .v2-reply-children {
  background: rgb(15 23 42 / 0.7);
  border-bottom-color: rgb(255 255 255 / 0.1);
}

.v2-reply-cell {
  background: #fff;
  border-bottom-color: rgb(226 232 240);
  gap: 12px;
  padding: 14px;
}

.dark .v2-reply-cell {
  background: transparent;
}

.v2-reply-cell:hover {
  background: rgb(248 250 252);
}

.dark .v2-reply-cell:hover {
  background: rgb(255 255 255 / 0.06);
}

.v2-reply-avatar {
  border-radius: 8px;
  background: rgb(241 245 249);
  color: rgb(37 99 235);
}

.dark .v2-reply-avatar {
  background: rgb(255 255 255 / 0.1);
  color: rgb(191 219 254);
}

.v2-reply-children {
  background: rgb(248 250 252);
  border-bottom-color: rgb(226 232 240);
}

.dark .v2-reply-children {
  background: rgb(255 255 255 / 0.04);
}

:deep(.forum-markdown) {
  color: rgb(51 65 85);
  font-size: 13px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

:deep(.dark .forum-markdown) {
  color: #cbd5e1;
}

:deep(.forum-markdown p),
:deep(.forum-markdown ul),
:deep(.forum-markdown ol) {
  margin-bottom: 12px;
}

:deep(.forum-markdown a) {
  color: #778087;
}

:deep(.forum-markdown pre) {
  background: #0f172a;
  color: #e2e8f0;
  margin: 12px 0;
  overflow-x: auto;
  padding: 12px;
}

:deep(.forum-markdown code) {
  background: rgba(15, 23, 42, 0.06);
  padding: 0.15em 0.35em;
}

:deep(.forum-markdown pre code) {
  background: transparent;
  padding: 0;
}

:deep(.forum-markdown img) {
  max-width: 100%;
}
</style>
