<script setup>
import SearchHeader from "~/components/search/SearchHeader.vue";
import DiskInfoList from "~/components/diskInfoList.vue";

definePageMeta({
  layout: 'custom',
})

const router = useRouter()

const route = useRoute()
const keyword = ref(decodeURIComponent(route.query.keyword))

const sources = ref([])
const skeletonLoading = ref(true)
const handleSearch = async () => {

  let token = 'i69'
  let res = await $fetch('/api/sources', {
    method: 'POST',
    body: {
      "name": keyword.value,
      "token": token
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

  let token = 'i69'
  let res = await $fetch('/api/sources/indexA', {
    method: 'POST',
    body: {
      "name": keyword.value,
      "token": token
    }
  })
  if (res.list && res.list.length) {
    skeletonLoading.value = false
    sourcesA.value = res.list
  } else {
    skeletonLoading.value = false
  }
}

const search = (e) => {
  sources.value = []
  keyword.value = e
  skeletonLoading.value = true
  handleSearch()
  handleSearchA()
}

const colorMode = useColorMode()

onMounted(() => {
  handleSearch()
  handleSearchA()
})

</script>

<template>
  <div class="dark:bg-gray-400">
    <search-header :keyword="keyword" @search="search"></search-header>

    <div class="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_400px] gap-8 pb-8">
      <div class="flex flex-col gap-3 sm:mt-3 sm:pb-[60px] p-[20px] md:p-0">
        
        <disk-info-list :sources="sources"
                        :skeleton-loading="skeletonLoading"
        >
        </disk-info-list>
        <disk-info-list :sources="sourcesA"
                        :skeleton-loading="skeletonLoading"
        >
        </disk-info-list>
      </div>
       
    </div>
    <el-backtop></el-backtop>
  </div>
</template>

<style scoped>

</style>