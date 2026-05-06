<template>
  <div class="overflow-hidden rounded-lg bg-white dark:bg-white/10">
    <div class="grid md:grid-cols-[150px_minmax(0,1fr)]">
      <aside class="border-b border-slate-100 bg-slate-50/80 px-3 py-3 dark:border-white/10 dark:bg-white/5 md:border-b-0 md:border-r">
        <div class="flex items-center gap-3 md:block md:text-center">
          <div class="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-blue-50 text-sm font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-300 md:h-14 md:w-14">
            {{ getInitial(post.author?.username) }}
          </div>
          <div class="min-w-0 md:mt-2">
            <div class="truncate text-xs font-semibold text-slate-900 dark:text-white">
              {{ post.author.username }}
            </div>
            <div class="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              普通会员
            </div>
          </div>
        </div>
      </aside>

      <article class="min-w-0">
        <header class="flex items-center justify-between border-b border-slate-100 bg-white px-3 py-2 text-xs text-slate-500 dark:border-white/10 dark:bg-transparent dark:text-slate-400">
          <span><client-only>{{ formatDate(post.createdAt) }}</client-only></span>
          <span>#{{ index }}</span>
        </header>

        <div class="px-4 py-4">
          <div class="forum-markdown markdown-body" v-html="parsedContent"></div>
        </div>

        <footer class="flex items-center justify-between border-t border-slate-100 px-3 py-2 dark:border-white/10">
          <CommonReportButton
            content-type="topic"
            :content-id="post.id"
            :content-title="`${post.author.username}的回复`"
          />

          <button
            v-if="user && canReply"
            class="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300"
            @click="$emit('reply', post.id)"
          >
            <i class="fas fa-reply mr-1"></i>
            回复
          </button>
        </footer>
      </article>
    </div>

    <div v-if="post.children && post.children.length > 0" class="space-y-3 border-t border-slate-100 bg-slate-50/80 p-3 pl-6 dark:border-white/10 dark:bg-white/5">
      <ForumPostItem
        v-for="(child, childIndex) in post.children"
        :key="child.id"
        :post="child"
        :index="`${index}.${childIndex + 1}`"
        :topic="topic"
        :user="user"
        :can-reply="canReply"
        @reply="$emit('reply', $event)"
      />
    </div>
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

defineEmits(["reply"]);

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
:deep(.forum-markdown) {
  color: #334155;
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
  color: rgb(37 99 235);
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
