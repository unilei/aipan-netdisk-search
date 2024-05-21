<script setup>
import Tags from "~/components/sources/tags.vue";
import SearchHeader from "~/components/search/SearchHeader.vue";
import DiskInfoList from "~/components/diskInfoList.vue";

definePageMeta({
  layout: 'custom',
})

const tagsVisible = ref(false)

const tagsData = ref([])
const getTabsData = async () => {
  let res = await $fetch('/api/sources/hh/tabs')
  if (res.code === 200) {
    tagsData.value = res.data
    await getSourcesDataByTag(res.data[0].id)
  }
}

const sourcesData = ref([])
const getSourcesDataByTag = async (id) => {
  let res = await $fetch('/api/sources/hh/tabs-id', {
    method: 'get',
    query: {
      id: id,
      page: 1,
      size: 20
    }
  })
  sourcesData.value = res.data
}

const latestSourcesData = ref([])
const latestPage = ref(1)
const latestSize = ref(5)
const getLatestSourcesData = async (page, size) => {

  let res = await $fetch('/api/sources/hh/multi-latest-sources', {
    method: 'POST',
    body: {
      page: page,
      size: size
    }
  })

  if (res.code === 200) {
    latestSourcesData.value = res.data
  }
}

const handleLatestPageChange = (page) => {
  latestPage.value = page
  window.scroll(0, 0)
  getLatestSourcesData(latestPage.value, latestSize.value)
}

const handleOpenSourceLink =async (item) => {
  if(item.link){
    window.open(item.link, '_blank')
  }else{
    let res = await $fetch('/api/sources/hh/doc', {
      method: "POST",
      body: {
        engine: item.engine,
        doc_id: item.doc_id
      }
    })
    if (res.code === 200) {
      window.open(res.data.link, '_blank')
    }
  }

}
// BDY, ALY, QUARK, XUNLEI

const keyword = ref('')
const router = useRouter()
const search = (keyword) => {
  router.push({path: '/search', query: {keyword: encodeURIComponent(keyword)}})
}
onMounted(() => {
  getTabsData()
  getLatestSourcesData(latestPage.value, latestSize.value)
})

</script>

<template>
  <div class="min-h-screen">
    <search-header :keyword="keyword" @search="search"></search-header>

    <div class="max-w-[1240px] mx-auto p-[20px] sm:py-[20px]">

      <tags v-if="tagsVisible" :tags-data="tagsData" @change="getSourcesDataByTag"></tags>

      <div class="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_400px] gap-8">

        <div class="min-h-[calc(100vh-90px)]" id="latest-sources-all">
          <div class="text-xl font-bold">最新资源</div>
          <div class="grid grid-cols-1 gap-3 mt-3">
            <disk-info-list
                :sources="latestSourcesData"
                type="latest"
                @open-link="handleOpenSourceLink">
            </disk-info-list>

          </div>
          <div class="mt-[20px] flex justify-center">
            <client-only>
              <el-pagination
                  layout="prev, pager, next"
                  @current-change="handleLatestPageChange"
                  :total="latestSourcesData?.total"
              ></el-pagination>
            </client-only>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>