<script setup>
import { useDoubanStore } from "~/stores/douban";
import { badWords } from "~/utils/sensitiveWords";
import doubanDefaultData from "~/assets/vod/douban-default.json"

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

const doubanData = ref(doubanDefaultData || [])

watch(doubanData, (newValue, oldValue) => {
  doubanData.value = newValue
})

const colorMode = useColorMode()

const goDouban = (movie) => {
  // window.open(movie.url, '_blank')
  router.push({ path: '/search', query: { keyword: encodeURIComponent(movie.title) } })
}

onMounted(async () => {
  if (doubanCache.value === 'aipan.me') {
    doubanData.value = doubanStore.doubanData
  } else {
    await doubanStore.getDoubanData()
    doubanData.value = doubanStore.doubanData
    doubanCache.value = 'aipan.me'
  }
})
</script>

<template>
  <div class="bg-[#f5f6f9] custom-bg dark:bg-gray-800  min-h-screen py-[60px]">
    <!-- <div class=" bg-slate-100 p-2 fixed top-14 left-0 right-0 z-[999] dark:bg-gray-800">
      <p class="text-xs sm:text-sm   text-center dark:text-white "> 🥳 新功能：支持Alist聚合播放
        <nuxt-link class="text-blue-600 underline" href="/tv">点击进入</nuxt-link>
      </p>
    </div> -->
    <div class="flex flex-row items-center justify-center gap-3 mt-[80px]">
      <img class="w-20 h-20" src="@/assets/my-logo.png" alt="logo">
      <div>
        <h1 class="text-3xl text-gray-800 font-semibold dark:text-white ">AIPAN.ME</h1>
        <p class="text-center text-gray-600 text-sm dark:text-white">爱盼 - 资源随心，娱乐无限</p>
      </div>
    </div>
    <div class="max-w-[1240px] mx-auto mt-[20px]">
      <div class="w-[80%] md:w-[700px] mx-auto flex flex-row items-center gap-2 relative">
        <input class="w-full pl-6 border-none custom-shadow pr-[60px] py-3 border border-gray-300 rounded-full text-sm"
          v-model="searchKeyword" placeholder="请输入关键词搜索" @keydown.enter="search(searchKeyword)" />
        <button type="button"
          class="absolute right-6 flex items-center transition-transform duration-200 hover:scale-110"
          @click="search(searchKeyword)">
          <el-icon size="20px">
            <Search></Search>
          </el-icon>
        </button>
      </div>
    </div>
    <div class="h-20"></div>
    <div class="mx-5 xl:max-w-[1200px] xl:mx-auto my-10" v-for="(item, i) in doubanData" :key="i">
      <h1 class="flex flex-row items-center text-[12px] sm:text-sm text-slate-600 font-bold dark:text-white mt-[20px]">
        <span class="w-1 h-4 bg-blue-400"></span>
        <span class="w-1 h-4 bg-green-400"></span>
        <span class="w-1 h-4 bg-red-400"></span>
        <span class="ml-1">{{ item.name }}</span>
      </h1>
      <div
        class="grid grid-cols-2 bg-white dark:bg-gray-700 p-4 shadow-md rounded-xl xs:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-8  gap-3  mt-[10px]">
        <div
          class="mx-1 cursor-pointer truncate text-xs font-bold dark:bg-slate-700 dark:text-slate-100 rounded-[5px] overflow-hidden"
          v-for="(movie, index) in item.data" :key="index" type="info" @click="goDouban(movie)">
          <img
            class="w-full h-[180px] lg:h-[220px] xl:h-44 rounded-[5px] object-cover transition-transform duration-300 hover:scale-105"
            :src="'https://images.weserv.nl/?url=' + movie.cover" alt="" referrerpolicy="never">
          <p class="mt-1  text-center truncate font-normal">
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

.custom-shadow {
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
}

.custom-bg {
  background-image: url('@/assets/hero-bg-1.png');
  background-size: 100% auto;
  background-position: top;
  background-repeat: no-repeat;
}
</style>