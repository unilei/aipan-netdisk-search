<script setup>
import SearchHeader from "~/components/search/SearchHeader.vue";
import DiskInfoList from "~/components/diskInfoList.vue";

definePageMeta({
  layout: 'custom',
})

const route = useRoute()
const keyword = ref(decodeURIComponent(route.query.keyword))

const sources = ref([])
const skeletonLoading = ref(true)
const handleSearch = async () => {

  let res = await $fetch('/api/sources', {
    method: 'POST',
    body: {
      "name": keyword.value
    }
  })
  if (res.list && res.list.length) {
    skeletonLoading.value = false
    sources.value = res.list
  } else {
    skeletonLoading.value = false
  }
}

const sourcesA = ref([])
const handleSearchA = async () => {
  let res = await $fetch('/api/sources/indexA', {
    method: 'POST',
    body: {
      "name": keyword.value
    }
  })
  if (res.list && res.list.length) {
    skeletonLoading.value = false
    sourcesA.value = res.list
  } else {
    skeletonLoading.value = false
  }
}

const sourcesB = ref([])
const handleSearchB = async () => {
  let res = await $fetch('/api/sources/indexB', {
    method: 'POST',
    body: {
      "name": keyword.value
    }
  })
  if (res.list && res.list.length) {
    skeletonLoading.value = false
    sourcesB.value = res.list
  } else {
    skeletonLoading.value = false
  }
}
const sourcesC = ref([])
const handleSearchC = async () => {
  let res = await $fetch('/api/sources/indexC', {
    method: 'POST',
    body: {
      "name": keyword.value
    }
  })
  if (res.list && res.list.length) {
    skeletonLoading.value = false
    sourcesC.value = res.list
  } else {
    skeletonLoading.value = false
  }
}
const sourcesD = ref([])
const handleSearchD = async () => {
  let res = await $fetch('/api/sources/indexD', {
    method: 'POST',
    body: {
      "name": keyword.value
    }
  })
  if (res.list && res.list.length) {
    skeletonLoading.value = false
    sourcesD.value = res.list
  } else {
    skeletonLoading.value = false
  }
}
const sourcesE = ref([])
const handleSearchE = async () => {
  let res = await $fetch('/api/sources/indexE', {
    method: 'POST',
    body: {
      "name": keyword.value
    }
  })
  if (res.list && res.list.length) {
    skeletonLoading.value = false
    sourcesE.value = res.list
  } else {
    skeletonLoading.value = false
  }
}

const sourcesF = ref([])
const handleSearchF = async () => {
  let res = await $fetch('/api/sources/indexF', {
    method: 'POST',
    body: {
      "name": keyword.value
    }
  })
  if (res.list && res.list.length) {
    skeletonLoading.value = false
    sourcesF.value = res.list
  } else {
    skeletonLoading.value = false
  }
}

const search = (e) => {
  keyword.value = e
  skeletonLoading.value = true
  sources.value = []
  sourcesA.value = []
  sourcesB.value = []
  sourcesC.value = []
  sourcesD.value = []
  handleSearch()
  handleSearchA()
  handleSearchB()
  handleSearchC()
  handleSearchD()
  handleSearchE()
  handleSearchF()
}

const colorMode = useColorMode()
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

const currentVodUrl = ref('')
const checkIsM3u8 = (url) => {

// 使用正则表达式检查URL是否以.m3u8结尾
  const isM3U8 = /\.m3u8$/.test(url);

  return isM3U8;
}
const formatVodPlayUrl = (vod) => {

  let inputString = vod.vod_play_url
  if (!inputString) {
    return ''
  }
  const matches = inputString.match(/#/g);
  let fragments = []

  if (matches && matches.length > 0) {
    console.log(`字符串中包含 ${matches.length} 个 # 作为分隔符`);
    fragments = inputString.split('#');
  } else {
    console.log("字符串中不包含 # 作为分隔符");
    fragments = inputString.split('$$$');
  }

// 初始化一个数组来存储提取的信息
  const episodes = [];

// 循环遍历每个片段
  for (let i = 0; i < fragments.length; i += 1) {
    const episodeInfo = fragments[i].split('$'); // 将每个片段按$分割成两部分
    if (episodeInfo.length === 2) {
      const episodeNumber = episodeInfo[0].trim();
      const episodeLink = episodeInfo[1].trim();
      if (episodeLink.length > 20) {
        episodes.push({number: episodeNumber, link: episodeLink});
      }

    }
  }
  if (!currentVodUrl.value && episodes.length > 0) {
    if (checkIsM3u8(episodes[0].link)) {
      currentVodUrl.value = `${vod.playUrl}${episodes[0].link}`
    } else {
      currentVodUrl.value = episodes[0].link;
    }
  }

  return episodes
}

const currentIndex = ref(0)
const changeVodUrl = (vod, item, index) => {
  console.log(item)
  currentIndex.value = index
  if (checkIsM3u8(item.link)) {
    currentVodUrl.value = `${vod.playUrl}${item.link}`
  } else {
    currentVodUrl.value = item.link;
  }
}

onMounted(() => {
  handleSearch()
  handleSearchA()
  handleSearchB()
  handleSearchC()
  handleSearchD()
  handleSearchE()
  handleSearchF()
  searchByVod()
})

</script>

<template>
  <div class="dark:bg-gray-400">
    <search-header :keyword="keyword" @search="search"></search-header>
    <div class="max-w-[1240px] mx-auto grid grid-cols-1 pb-8">
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-[20px]">
        <disk-info-list :sources="[sourcesF, sources,  sourcesA, sourcesB, sourcesC, sourcesD, sourcesE]"
                        :skeleton-loading="skeletonLoading"
        >
        </disk-info-list>
      </div>
      <div class="w-full mx-auto bg-slate-200 p-10 rounded-xl">
        <div class="aspect-video w-full">
          <iframe width="100%" height="100%" :src="currentVodUrl" frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen="allowfullscreen"
                  mozallowfullscreen="mozallowfullscreen" msallowfullscreen="msallowfullscreen"
                  oallowfullscreen="oallowfullscreen" webkitallowfullscreen="webkitallowfullscreen">
          </iframe>
        </div>

        <div class="flex flex-row gap-3">
          <ul class="flex flex-row flex-wrap gap-2 mt-[20px]" v-for="(vod,index) in vodData" :key="index">
            <li class=" p-[10px] cursor-pointer text-[#000] border-[1px] border-[#ef720b] text-[14px] rounded-[4px] hover:bg-[#ef720b] hover:text-[#fff]"
                v-for="(item,index) in formatVodPlayUrl(vod)" :key="index"
                @click="changeVodUrl(vod,item,index)"
            >
              {{ item.number }}
            </li>
          </ul>
        </div>

      </div>
    </div>
    <el-backtop></el-backtop>
  </div>
</template>

<style scoped>

</style>