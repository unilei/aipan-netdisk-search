<script setup>
import SearchHeader from "~/components/search/SearchHeader.vue";
import DiskInfoList from "~/components/diskInfoList.vue";
import sourcesApiEndpoints from "~/assets/vod/clouddrive.json";

definePageMeta({
  layout: 'custom',
})

const route = useRoute()
const keyword = ref(decodeURIComponent(route.query.keyword))
const sources = ref([])
const skeletonLoading = ref(true)

const handleSearch = async () => {
  sourcesApiEndpoints.forEach((item) => {
    $fetch(item.api, {
      method: "POST",
      body: {
        "name": keyword.value
      }
    }).then(res => {
      if (res.list && res.list.length) {
        sources.value = sources.value.concat(res.list)
      } else {
        skeletonLoading.value = false
      }
    }).catch(err => {
      console.log(err)
    })
  })
}

const search = (e) => {
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
      if (res.pagecount > 1) return;
      res.list.forEach(item => {
        vodData.value.push(Object.assign({playUrl: vodApi.playUrl}, item))
      })
      console.log(vodData.value)
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
      <div class="w-auto sm:w-full py-3 sm:mx-auto mx-3">
        <el-button
            type="primary"
            :plain="category !== 'clouddrive'"
            color="#6648ff"
            @click="switchCategory('clouddrive')"
        >网盘资源
        </el-button>
        <el-button
            type="primary"
            :plain="category !== 'onlineVod'"
            color="#6648ff"
            @click="switchCategory('onlineVod')"
        >
          在线观影
        </el-button>
      </div>
      <div v-if="category === 'clouddrive'"
           class="w-auto sm:w-full border-t border-gray-300 space-y-3 py-3 sm:mx-auto mx-3">
        <disk-info-list
            :sources="[sources]"
            :skeleton-loading="skeletonLoading"
        >
        </disk-info-list>
      </div>
      <vod-list v-if="category === 'onlineVod'" :vod-data="vodData"></vod-list>
    </div>
    <el-backtop></el-backtop>
  </div>
</template>

<style scoped>

</style>