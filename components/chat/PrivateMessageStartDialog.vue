<template>
  <ClientOnly>
    <el-dialog
      :model-value="modelValue"
      width="520px"
      class="private-message-start-dialog"
      :title="dialogTitle"
      @update:model-value="emit('update:modelValue', $event)"
      @closed="reset"
    >
      <div class="space-y-4">
        <div class="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <div class="font-medium text-slate-900 dark:text-white">
            发起新私信需要当前积分达到 {{ privateMessageMinimumPoints }}。
          </div>
          <div class="mt-1">
            这是资格门槛，不会扣除积分；已有私信回复不受限制。
          </div>
        </div>

        <div class="flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-white/10">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-blue-600 dark:bg-white/10">
            {{ getInitial(recipient?.username) }}
          </div>
          <div class="min-w-0">
            <div class="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {{ recipient?.username || "用户" }}
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400">私信对象</div>
          </div>
        </div>

        <el-input
          v-model="content"
          type="textarea"
          :rows="4"
          maxlength="500"
          show-word-limit
          placeholder="输入第一条私信内容"
        />

        <div v-if="errorMessage" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
          {{ errorMessage }}
        </div>
      </div>

      <template #footer>
        <el-button @click="emit('update:modelValue', false)">取消</el-button>
        <el-button type="primary" :loading="submitting" :disabled="!canSubmit" @click="submit">
          发起私信
        </el-button>
      </template>
    </el-dialog>
  </ClientOnly>
</template>

<script setup>
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";

const privateMessageMinimumPoints = 10000;

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  recipient: {
    type: Object,
    default: null,
  },
  sourceForumTopicId: {
    type: [Number, String],
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "started"]);

const content = ref("");
const submitting = ref(false);
const errorMessage = ref("");

const dialogTitle = computed(() =>
  props.recipient?.username ? `私信 ${props.recipient.username}` : "发起私信",
);

const canSubmit = computed(
  () => Boolean(props.recipient?.id) && content.value.trim().length > 0,
);

const authHeaders = () => ({
  Authorization: `Bearer ${useCookie("token").value}`,
});

const reset = () => {
  content.value = "";
  errorMessage.value = "";
  submitting.value = false;
};

const getInitial = (name) => String(name || "?").charAt(0).toUpperCase();

const submit = async () => {
  if (!canSubmit.value || submitting.value) return;

  try {
    submitting.value = true;
    errorMessage.value = "";
    const response = await $fetch("/api/chat/private/start", {
      method: "POST",
      headers: authHeaders(),
      body: {
        recipientId: props.recipient.id,
        content: content.value.trim(),
        sourceForumTopicId: props.sourceForumTopicId || undefined,
      },
    });

    const roomId = response?.data?.room?.id;
    if (!roomId) {
      throw new Error("私信创建失败");
    }

    ElMessage.success(response?.data?.created ? "私信已发起" : "已进入私信会话");
    emit("started", response.data);
    emit("update:modelValue", false);
    await navigateTo({ path: "/chat", query: { roomId } });
  } catch (error) {
    const message =
      error?.data?.data?.message ||
      error?.data?.message ||
      error?.message ||
      "发起私信失败";
    errorMessage.value = message;
    ElMessage.error(message);
  } finally {
    submitting.value = false;
  }
};
</script>
