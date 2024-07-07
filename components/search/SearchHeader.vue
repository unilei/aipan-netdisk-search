<script setup lang="ts">
const router = useRouter()
const goHome = () => {
  router.push('/')
}

const props = defineProps({
  keyword: {
    type: String,
    default: () => ''
  }
})
const searchKeyword = ref(props.keyword)
const emit = defineEmits(['search'])
const search = () => {
  emit('search',searchKeyword.value)
}
const goGithub = () => {
  window.open('https://github.com/unilei/aipan-netdisk-search.git')
}
const colorMode = useColorMode()

console.log(colorMode.preference)

</script>

<template>
  <el-affix>
    <div class="bg-white dark:bg-gray-800 shadow px-[10px] md:px-[20px] py-[10px]">
      <div class="max-w-[1240px] mx-auto h-[40px]  flex flex-row items-center gap-2 md:gap-6 relative">

        <div class="flex flex-row items-center gap-1">
          <img class="w-[30px] h-[30px] md:w-[40px] md:h-[40px] cursor-pointer" src="@/assets/my-logo.png" alt="logo" @click="goHome()">
          <h1 class="hidden md:block text-[14px] font-serif font-bold cursor-pointer dark:text-white" @click="goHome()" >爱盼-网盘资源搜索</h1>
        </div>

        <div class="w-[220px] md:w-[400px]">
          <client-only>
            <el-input class="h-[30px]"
                      v-model="searchKeyword"
                      placeholder="请输入关键词搜索"
                      @keydown.enter="search()"
                      prefix-icon="Search"
                      size="small"
                      clearable
            >
            </el-input>
          </client-only>
        </div>

        <div class="absolute right-[10px] md:right-[20px]">
          <client-only>
            <el-button v-if="colorMode.preference === 'dark'" link @click="colorMode.preference = 'light'">
              <img class="w-[20px] h-[20px]" src="@/assets/theme/entypo--light-up.svg" alt="">
            </el-button>
            <el-button v-if="colorMode.preference === 'light'" link @click="colorMode.preference = 'dark'">
              <img class="w-[20px] h-[20px]" src="@/assets/theme/icon-park-solid--dark-mode.svg" alt="">
            </el-button>
          </client-only>
          <el-button link @click="goGithub()">
            <img class="w-[20px] h-[20px]" src="@/assets/skill-icons--github-dark.svg" alt="github">
          </el-button>
        </div>

      </div>
    </div>
  </el-affix>
</template>

<style scoped>
:deep(.el-input__wrapper.is-focus) {
  --el-input-focus-border-color: #6648ff;
}
</style>