<script setup>
import {useCookie} from "#app";

definePageMeta({
  layout: 'custom',
})
import {useDoubanStore} from "~/stores/douban";

const doubanCache = useCookie('doubanCache', {
  maxAge: 60 * 60 * 24
})
const doubanStore = useDoubanStore()
const searchKeyword = ref('')
const router = useRouter()

const search = (keyword) => {
  router.push({path: '/search', query: {keyword: encodeURIComponent(keyword)}})
}
const donate = () => {
  router.push({path: '/donate'})
}
const hotKeywords = ref(['庆余年', '歌手2024', '我的阿勒泰', '新生', '周处除三害', '热辣滚烫', '第二十条', '承欢记', '哈哈哈哈哈'])
const doubanData = ref([])

watch(doubanData, (newValue, oldValue) => {
  doubanData.value = newValue
})

const colorMode = useColorMode()

const goDouban = (movie) => {
  // window.open(movie.url, '_blank')
  router.push({path: '/search', query: {keyword: encodeURIComponent(movie.title)}})
}
onMounted(async () => {
  if (doubanCache.value === 'exist') {
    doubanData.value = doubanStore.doubanData
  } else {
    await doubanStore.getDoubanData()
    doubanData.value = doubanStore.doubanData
    doubanCache.value = 'exist'
  }
})
</script>

<template>
  <div class="bg-[#ffffff] dark:bg-gray-800 min-h-screen py-[60px]">

    <div class="max-w-[1240px] mx-auto text-right px-[20px]">
      <client-only>
        <el-button v-if="colorMode.preference === 'dark'" link @click="colorMode.preference = 'light'">
          <img class="w-[20px] h-[20px]" src="@/assets/theme/entypo--light-up.svg" alt="">
        </el-button>
        <el-button v-if="colorMode.preference === 'light'" link @click="colorMode.preference = 'dark'">
          <img class="w-[20px] h-[20px]" src="@/assets/theme/icon-park-solid--dark-mode.svg" alt="">
        </el-button>
      </client-only>

    </div>
    <div class="flex flex-row items-center justify-center gap-3 mt-[80px]">
      <img class="w-[40px] h-[40px] sm:w-[60px] sm:h-[60px]" src="@/assets/my-logo.png" alt="logo">
      <h1 class="text-[18px] sm:text-[24px] font-serif font-bold dark:text-white ">爱盼-网盘资源搜索</h1>
    </div>

    <div class="max-w-[1240px] mx-auto mt-[20px]">
      <div
          class="w-[80%] md:w-[700px] mx-auto h-[40px] sm:h-[50px] border border-slate-300 font-mono overflow-hidden rounded-[50px]">
        <client-only>
          <el-input
              v-model="searchKeyword"
              placeholder="请输入关键词搜索"
              @keydown.enter="search(searchKeyword)"
              prefix-icon="Search"
          >
          </el-input>
        </client-only>
      </div>
    </div>

    <div class="max-w-[80%] md:max-w-[1200px] mx-auto mt-[50px]">
      <h1 class="text-[12px] sm:text-sm text-slate-600 font-bold dark:text-white mt-[20px]">豆瓣热门影视榜单</h1>
      <div class="grid grid-cols-1 md:grid-cols-4  gap-3  mt-[10px]">
        <div
            class="mx-1 cursor-pointer truncate text-xs font-bold dark:bg-slate-700 dark:text-slate-100 rounded-[5px] p-2"
            v-for="(movie,index) in doubanData"
            :key="index"
            type="info"
            @click="goDouban(movie)"
        >
          {{ movie.title }}
        </div>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-3">
      <div class="flex flex-row items-center justify-center  gap-3 my-3">
        <a class="" href="https://github.com/unilei/aipan-netdisk-search">
          <img class="w-[30px] h-[30px]" src="@/assets/skill-icons--github-dark.svg" alt="github">
        </a>
        <el-button link color="#ffffff" @click="donate()">
          <img class="w-[30px] h-[30px]" src="@/assets/donation/dashang.svg" alt="打赏">
        </el-button>
      </div>
      <p class="text-center text-[8px] sm:text-[12px] text-slate-400">
        声明：本站不产生/存储任何数据，也从未参与录制、上传，所有资源均来自网络。
      </p>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-input__inner) {
  height: 48px;
}

@media screen and (max-width: 768px) {
  :deep(.el-input__inner) {
    height: 37px;
  }

}

:deep(.el-input__wrapper) {
  box-shadow: none;
}

:deep(.el-input-group__prepend) {
  box-shadow: none;
}

:deep(.el-input) {
  --el-input-focus-border: transparent;
  --el-input-border-color: transparent;
  --el-input-focus-border-color: transparent;
  --el-input-hover-border-color: transparent;
}

:deep(.el-input-group--prepend .el-input-group__prepend .el-select .el-input.is-focus .el-input__wrapper) {
  box-shadow: none !important;
}

:deep(.el-input-group--prepend .el-input-group__prepend .el-select .el-input .el-input__inner) {
  text-align: center;
}

:deep(.el-select .el-input__wrapper.is-focus) {
  box-shadow: none !important;
}
</style>