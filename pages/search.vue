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
}

const colorMode = useColorMode()

onMounted(() => {
  handleSearch()
  handleSearchA()
  handleSearchB()
  handleSearchC()
  handleSearchD()
  handleSearchE()
})

</script>

<template>
  <div class="dark:bg-gray-400">
    <search-header :keyword="keyword" @search="search"></search-header>
    <div class="max-w-[1240px] mx-auto grid grid-cols-1 pb-8">
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-[20px]">
        <disk-info-list :sources="[sources, sourcesA, sourcesB, sourcesC, sourcesD, sourcesE]"
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