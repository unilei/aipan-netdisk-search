<script setup>
import SearchHeader from "~/components/search/SearchHeader.vue";
import DiskInfoList from "~/components/diskInfoList.vue";
import sourcesApiEndpoints from "~/assets/vod/clouddrive.json";
import { badWords } from "~/utils/sensitiveWords";

definePageMeta({
  layout: 'custom',
})

const route = useRoute()
const keyword = ref(decodeURIComponent(route.query.keyword))
const sources = ref([])
const skeletonLoading = ref(true)

const handleSearch = async () => {
  skeletonLoading.value = true; // 开始加载状态

  for (const item of sourcesApiEndpoints) {
    try {
      const res = await $fetch(item.api, {
        method: "POST",
        body: {
          "name": keyword.value
        }
      });

      if (res.list && res.list.length) {
        sources.value = sources.value.concat(res.list);
      }

      // 设置间隔时间，例如 1000 毫秒（1秒）
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.log(err);
    }
  }

  skeletonLoading.value = false; // 结束加载状态
}

const search = (e) => {
  if (badWords.includes(e)) {
    return alert('请勿输入敏感词')
  }
  keyword.value = e
  skeletonLoading.value = true
  sources.value = []
  handleSearch()
}

const colorMode = useColorMode()
const category = ref('clouddrive')

import vodApiEndpoints from "~/assets/vod/list"

const vodData = ref([])
const searchByVod = async () => {

  vodApiEndpoints.forEach(vodApi => {
    $fetch('/api/vod/search', {
      method: 'get',
      query: {
        type: vodApi.type,
        api: vodApi.api,
        ac: 'detail',
        wd: keyword.value
      }
    }).then(res => {
      if (res.code === 500) return;
      // if (res.pagecount > 1) return;
      if (!res.list || !res.list.length) return;
      res.list.forEach(item => {
        vodData.value.push(Object.assign({ playUrl: vodApi.playUrl }, item))
      })
      // console.log(vodData.value)
    }).catch(err => {
      console.log(err)
    })

  })
}
const switchCategory = (e) => {
  category.value = e
  if (e === 'clouddrive') {
    sources.value = []
    handleSearch()
  } else if (e === 'onlineVod') {
    vodData.value = []
    searchByVod()
  }
}

onMounted(() => {
  handleSearch()
})

</script>

<template>
  <div class="dark:bg-gray-400 min-h-screen ">
    <search-header :keyword="keyword" @search="search"></search-header>
    <div class="max-w-[1240px] mx-auto grid grid-cols-1 pb-8">
      <div class="w-full p-3">
        <el-button type="primary" :plain="category !== 'clouddrive'" color="#6648ff"
          @click="switchCategory('clouddrive')">网盘资源
        </el-button>
        <el-button type="primary" :plain="category !== 'onlineVod'" color="#6648ff"
          @click="switchCategory('onlineVod')">
          在线观影
        </el-button>
      </div>
      <div v-if="category === 'clouddrive'" class="w-full space-y-3 p-3 ">
        <div class="text-purple-500 text-xs" v-if="skeletonLoading">资源正在加载中...</div>
        <disk-info-list :sources="[sources]" :skeleton-loading="skeletonLoading">
        </disk-info-list>
      </div>
      <vod-list v-if="category === 'onlineVod'" :vod-data="vodData"></vod-list>
    </div>
    <el-backtop></el-backtop>
  </div>
</template>

<style scoped></style>