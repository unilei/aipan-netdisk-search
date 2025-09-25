<script setup>
const router = useRouter();
const goHome = () => {
  router.push("/");
};

const props = defineProps({
  keyword: {
    type: String,
    default: () => "",
  },
});
const searchKeyword = ref(props.keyword);
const emit = defineEmits(["search"]);
const search = () => {
  emit("search", searchKeyword.value);
};

const colorMode = useColorMode();

console.log(colorMode.preference);
</script>

<template>
  <el-affix>
    <div
      class="bg-white dark:bg-gray-800 shadow-md px-3 md:px-[20px] transition-colors duration-300"
    >
      <div
        class="max-w-[1240px] mx-auto h-16 flex flex-row items-center justify-between gap-3 md:gap-8 relative"
      >
        <div class="flex flex-row items-center gap-3 md:gap-8">
          <div
            class="flex cursor-pointer items-center justify-center gap-2 md:gap-2 hover:scale-105 transition-transform duration-300"
            @click="goHome()"
          >
            <img
              class="w-6 h-6 md:w-12 md:h-12 dark:opacity-90"
              src="@/assets/my-logo.png"
              alt="logo"
            />
            <div class="text-left hidden md:block">
              <h1
                class="text-xs md:text-sm text-gray-800 font-bold dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"
              >
                爱看网盘资源
              </h1>
              <p
                class="text-gray-600 text-[10px] md:text-xs dark:text-gray-400"
              >
                网盘资源搜索
              </p>
            </div>
          </div>
          <div class="w-[240px] md:w-[420px]">
            <client-only>
              <el-input
                class="search-input"
                v-model="searchKeyword"
                placeholder="请输入关键词搜索"
                @keydown.enter="search()"
                prefix-icon="Search"
                size="large"
                clearable
              >
              </el-input>
            </client-only>
          </div>
        </div>

        <div>
          <!-- 主题切换按钮 -->
          <button
            class="p-2 rounded-lg transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-300 dark:hover:bg-gray-800/80"
            @click="
              colorMode.preference =
                colorMode.preference === 'dark' ? 'light' : 'dark'
            "
          >
            <i
              v-if="colorMode.preference === 'dark'"
              class="fa-solid fa-sun transition-transform duration-300 hover:rotate-90"
            ></i>
            <i
              v-else
              class="fa-solid fa-moon transition-transform duration-300 hover:rotate-90"
            ></i>
          </button>
        </div>
      </div>
    </div>
  </el-affix>
</template>

<style scoped>
:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border-radius: 9999px;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(102, 72, 255, 0.3);
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #6648ff !important;
}

:deep(.el-button.theme-btn),
:deep(.el-button.github-btn) {
  border: none;
  padding: 0;
}

:deep(.dark .el-input__wrapper) {
  background-color: #2d3748;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
}

:deep(.dark .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(102, 72, 255, 0.3);
}

:deep(.dark .el-input__inner) {
  color: #fff;
}

:deep(.dark .el-input__prefix-icon) {
  color: #718096;
}
</style>
