<script setup>
import {useDoubanStore} from "~/stores/douban";

definePageMeta({
  layout: 'custom',
})
const doubanStore = useDoubanStore()
const searchKeyword = ref('')
const router = useRouter()
const doubanCache = useCookie('doubanCache', {
  maxAge: 60 * 60 * 24
})

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
  <div class="bg-[#ffffff] dark:bg-gray-800  min-h-screen py-[60px]">

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
      <h1 class="text-[18px] sm:text-[22px] font-serif font-bold dark:text-white ">爱盼-网盘资源搜索</h1>
    </div>

    <div class="max-w-[1240px] mx-auto mt-[20px]">
      <div
          class="w-[80%] md:w-[700px] mx-auto">
        <client-only>
          <el-input
              v-model="searchKeyword"
              placeholder="请输入关键词搜索"
              @keydown.enter="search(searchKeyword)"
              prefix-icon="Search"
              size="large"
              input-style=" height: 48px;"
              clearable
          >
          </el-input>
        </client-only>
      </div>
    </div>

    <div class="mx-5 xl:max-w-[1200px] xl:mx-auto mt-[50px]" v-if="doubanData.length > 0">
      <h1 class="text-[12px] sm:text-sm text-slate-600 font-bold dark:text-white mt-[20px]">豆瓣热门影视榜单</h1>
      <div class="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-8  gap-3  mt-[10px]">
        <div
            class="mx-1 cursor-pointer truncate text-xs font-bold dark:bg-slate-700 dark:text-slate-100 rounded-[5px] p-2"
            v-for="(movie,index) in doubanData"
            :key="index"
            type="info"
            @click="goDouban(movie)"
        >
          <img class="w-full h-[180px] lg:h-[220px] xl:h-[161px] rounded-[5px] object-cover"
               :src="'https://images.weserv.nl/?url='+ movie.cover"
               alt="" referrerpolicy="never">
          <p class="mt-1  text-center truncate">
            {{ movie.title }}
            {{ movie.rate }}
          </p>
        </div>
      </div>
    </div>

    <div class="p-4">
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
 :deep(.el-input__wrapper.is-focus) {
   --el-input-focus-border-color: #6648ff;
 }
</style>