<script setup>
import { useDoubanStore } from "~/stores/douban";
import { badWords } from "~/utils/sensitiveWords";

definePageMeta({
  layout: 'netdisk',
})
const doubanStore = useDoubanStore()
const searchKeyword = ref('')
const router = useRouter()
const doubanCache = useCookie('doubanCache', {
  maxAge: 60 * 60 * 24
})

const search = (keyword) => {
  if (!keyword) return
  if (badWords.includes(keyword)) {
    return alert('请勿输入敏感词')
  }
  router.push({ path: '/search', query: { keyword: encodeURIComponent(keyword) } })
}

const doubanData = ref([])

watch(doubanData, (newValue, oldValue) => {
  doubanData.value = newValue
})

const colorMode = useColorMode()

const goDouban = (movie) => {
  // window.open(movie.url, '_blank')
  router.push({ path: '/search', query: { keyword: encodeURIComponent(movie.title) } })
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
    <div class="flex flex-row items-center justify-center gap-3 mt-[80px]">
      <img class="w-[40px] h-[40px] sm:w-[60px] sm:h-[60px]" src="@/assets/my-logo.png" alt="logo">
      <h1 class="text-[18px] sm:text-[22px] font-bold dark:text-white ">爱盼-网盘资源搜索</h1>
    </div>
    <div class="max-w-[1240px] mx-auto mt-[20px]">
      <div class="w-[80%] md:w-[700px] mx-auto flex flex-row items-center gap-2 relative">
        <input class="w-full pl-6 pr-[60px] py-3 border border-gray-300 rounded-full text-sm" v-model="searchKeyword"
          placeholder="请输入关键词搜索" @keydown.enter="search(searchKeyword)" />
        <button type="button"
          class="absolute right-6 flex items-center transition-transform duration-200 hover:scale-110"
          @click="search(searchKeyword)">
          <el-icon size="20px">
            <Search></Search>
          </el-icon>
        </button>
      </div>
    </div>
    <div class="mx-5 xl:max-w-[1200px] xl:mx-auto mt-12 mb-[100px]" v-if="doubanData.length > 0">
      <h1 class="text-[12px] sm:text-sm text-slate-600 font-bold dark:text-white mt-[20px]">豆瓣热门影视榜单</h1>
      <div class="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-8  gap-3  mt-[10px]">
        <div
          class="mx-1 cursor-pointer truncate text-xs font-bold dark:bg-slate-700 dark:text-slate-100 rounded-[5px] p-2 overflow-hidden"
          v-for="(movie, index) in doubanData" :key="index" type="info" @click="goDouban(movie)">
          <img
            class="w-full h-[180px] lg:h-[220px] xl:h-[161px] rounded-[5px] object-cover transition-transform duration-300 hover:scale-105"
            :src="'https://images.weserv.nl/?url=' + movie.cover" alt="" referrerpolicy="never">
          <p class="mt-1  text-center truncate">
            {{ movie.title }}
            {{ movie.rate }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-input__wrapper.is-focus) {
  --el-input-focus-border-color: #6648ff;
}
</style>