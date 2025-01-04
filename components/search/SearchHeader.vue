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
        class="max-w-[1240px] mx-auto h-16 flex flex-row items-center gap-3 md:gap-8 relative"
      >
        <div
          class="flex cursor-pointer items-center justify-center gap-2 md:gap-2 hover:scale-105 transition-transform duration-300"
          @click="goHome()"
        >
          <img
            class="w-6 h-6 md:w-12 md:h-12 dark:opacity-90"
            src="@/assets/my-logo.png"
            alt="logo"
          />
          <div class="text-left">
            <h1
              class="text-xs md:text-sm text-gray-800 font-bold dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"
            >
              AIPAN.ME
            </h1>
            <p class="text-gray-600 text-[10px] md:text-xs dark:text-gray-400">
              爱盼 - 资源随心，娱乐无限
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

        <div
          class="absolute right-[10px] md:right-[20px] flex items-center gap-2"
        >
          <client-only>
            <el-button
              v-if="colorMode.preference === 'dark'"
              class="theme-btn !h-9 !w-9 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
              @click="colorMode.preference = 'light'"
            >
              <img
                class="w-[22px] h-[22px]"
                src="@/assets/theme/entypo--light-up.svg"
                alt=""
              />
            </el-button>
            <el-button
              v-if="colorMode.preference === 'light'"
              class="theme-btn !h-9 !w-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              @click="colorMode.preference = 'dark'"
            >
              <img
                class="w-[22px] h-[22px]"
                src="@/assets/theme/icon-park-solid--dark-mode.svg"
                alt=""
              />
            </el-button>
          </client-only>
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
