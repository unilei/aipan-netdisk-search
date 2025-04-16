<template>
  <client-only>
    <template #fallback>
      <div
        class="border border-gray-200 dark:border-gray-700 rounded p-4 h-[250px] flex items-center justify-center bg-gray-50 dark:bg-gray-800"
      >
        <p class="text-gray-400 text-xs">编辑器加载中...</p>
      </div>
    </template>
    <md-editor
      :modelValue="modelValue"
      @update:modelValue="updateValue"
      :placeholder="placeholder"
      :theme="isDarkMode ? 'dark' : 'light'"
      :toolbars="toolbars"
      :autoHeight="autoHeight"
      :minHeight="minHeight"
      :previewTheme="previewTheme"
      :style="{ width: '100%' }"
      @onUploadImg="handleImageUpload"
      @onSave="handleEditorSave"
      v-bind="$attrs"
    />
  </client-only>
</template>

<script setup>
import { ref, shallowRef, computed, watch, onMounted } from "vue";
import { MdEditor } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import { ElMessage } from "element-plus";

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "在这里输入内容，支持Markdown格式...",
  },
  autoHeight: {
    type: Boolean,
    default: true,
  },
  minHeight: {
    type: String,
    default: "150px",
  },
  previewTheme: {
    type: String,
    default: "github",
  },
  customToolbars: {
    type: Array,
    default: () => [],
  },
  onSave: {
    type: Function,
    default: null,
  },
});

// Emits
const emit = defineEmits(["update:modelValue", "save"]);

// 检测暗黑模式
const isDarkMode = ref(false);

function updateDarkMode() {
  if (typeof window !== "undefined") {
    isDarkMode.value =
      document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
}

// 默认工具栏设置
const defaultToolbars = [
  "bold",
  "italic",
  "strikethrough",
  "-",
  "title",
  "sub",
  "sup",
  "quote",
  "unorderedList",
  "orderedList",
  "-",
  "codeRow",
  "code",
  "link",
  "image",
  "table",
  "-",
  "emoji",
  "preview",
  "fullscreen",
];

// 合并自定义工具栏和默认工具栏
const toolbars = computed(() => {
  return props.customToolbars.length > 0
    ? props.customToolbars
    : defaultToolbars;
});

// 处理值更新
function updateValue(value) {
  emit("update:modelValue", value);
}

// 处理编辑器中的图片上传
async function handleImageUpload(files, callback) {
  try {
    const formData = new FormData();

    // 添加所有文件到formData
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await $fetch("/api/upload/image", {
      method: "POST",
      body: formData,
      headers: {
        authorization: "Bearer " + useCookie("token").value,
      },
    });

    if (response.success && response.data && response.data.urls) {
      // 返回图片URL数组给编辑器
      callback(response.data.urls);
      ElMessage.success("图片上传成功");
    } else {
      ElMessage.error(response.message || "图片上传失败");
      callback([]);
    }
  } catch (error) {
    console.error("图片上传失败:", error);
    ElMessage.error("图片上传失败，请稍后重试");
    callback([]);
  }
}

// 处理编辑器的保存快捷键 (Ctrl+S)
function handleEditorSave(value) {
  // 阻止浏览器默认保存行为
  event?.preventDefault();

  // 发出保存事件
  emit("save", value);

  // 如果提供了onSave回调函数，则调用它
  if (props.onSave && typeof props.onSave === "function") {
    props.onSave(value);
  }
}

// 生命周期钩子
onMounted(() => {
  // 检测当前主题模式
  updateDarkMode();

  // 监听主题变化
  if (typeof window !== "undefined") {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", updateDarkMode);
  }
});
</script>

<style>
/* 缩小编辑器字体大小 */
:deep(.md-editor-content) {
  font-size: 0.875rem;
}

:deep(.md-editor-toolbar) {
  font-size: 0.875rem;
}
</style>
