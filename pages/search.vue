<script setup>
import SearchHeader from "~/components/search/SearchHeader.vue";
import DiskInfoList from "~/components/diskInfoList.vue";
import aliImg from '@/assets/netdisk/aliyun.png'
import quarkImg from '@/assets/netdisk/quark.png'
import xunleiImg from '@/assets/netdisk/xunlei.png'
import bdyImg from '@/assets/netdisk/baidu.png'

definePageMeta({
  layout: 'custom',
})

const router = useRouter()
const handleOpenSourceLink = (link) => {
  window.open(link, '_blank')
}
const handleOpenLatestSourceLink = async (item) => {

  if (currentEngine.value !== 8) {
    let res = await $fetch('/api/sources/hh/doc', {
      method: "POST",
      body: {
        engine: currentEngine.value,
        doc_id: item.doc_id
      }
    })
    if (res.code === 200) {
      window.open(res.data.link, '_blank')
    }
  } else {
    window.open(item.link, '_blank')
  }
}

const tabsOptions = [
  {
    label: '所有',
    value: ''
  },
  {
    label: '阿里',
    value: 'ALY',
    img: aliImg
  },
  {
    label: '百度',
    value: 'BDY',
    img: bdyImg
  },
  {
    label: '夸克',
    value: 'QUARK',
    img: quarkImg
  },
  {
    label: '迅雷',
    value: 'XUNLEI',
    img: xunleiImg
  }
]

const route = useRoute()
const keyword = ref(decodeURIComponent(route.query.keyword))
const currentTabValue = ref('')
const page = ref(1)
const exact = ref(false)

const sources = ref({})
const skeletonLoading = ref(true)
const handleSearchByHunhe = async () => {

  let res = await $fetch('/api/sources/hh/search', {
    method: 'POST',
    body: {
      'engine': currentEngine.value,
      "q": keyword.value,
      "page": page.value,
      "size": 10,
      "time": "",
      "type": currentTabValue.value,
      "exact": exact.value
    }
  })
  if (res.code === 200) {
    skeletonLoading.value = false
    sources.value = res.data
  } else {
    ElMessage.error(res.msg)
    skeletonLoading.value = false
  }
}

const search = (e) => {
  sources.value = {}
  keyword.value = e
  skeletonLoading.value = true
  handleSearchByHunhe()
}

const handleChangeTab = (e) => {
  sources.value = {}
  currentTabValue.value = e
  skeletonLoading.value = true
  handleSearchByHunhe()
}

const handleCurrentPageChange = (e) => {
  page.value = e
  skeletonLoading.value = true
  window.scroll(0, 0)
  handleSearchByHunhe()
}

const handleChangeExact = (e) => {
  exact.value = !e
  skeletonLoading.value = true
  sources.value = {}
  handleSearchByHunhe()
}
const handleEngineChange = (e) => {
  currentEngine.value = e
  skeletonLoading.value = true
  latestSkeletonLoading.value = true
  sources.value = {}
  latestSourcesData.value = []

  handleSearchByHunhe()
  getLatestSourcesData(1, 10)
}
const latestSourcesData = ref([])
const latestSkeletonLoading = ref(true)
const getLatestSourcesData = async (page, size) => {
  let res = await $fetch('/api/sources/hh/latest-sources', {
    method: 'get',
    query: {
      engine: currentEngine.value,
      page: page,
      size: size
    }
  })
  if (res.code === 200) {
    latestSkeletonLoading.value = false
    latestSourcesData.value = res.data
  } else {
    ElMessage.error(res.msg)
    latestSkeletonLoading.value = false
  }
}
const handleGoToLatestSources = () => {
  router.push({path: '/latest-sources'})
}

const currentEngine = ref(8)
const apiEndpointsData = ref([])
const getApiEndpoints = async () => {
  apiEndpointsData.value = await $fetch('/api/sources/api-endpoints')
}
const colorMode = useColorMode()

onMounted(() => {
  getApiEndpoints()
  handleSearchByHunhe()
  getLatestSourcesData(1, 10)
})

</script>

<template>
  <div class="dark:bg-gray-400">
    <search-header :keyword="keyword" @search="search"></search-header>

    <div class="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_400px] gap-8">
      <div class="flex flex-col gap-3 sm:mt-3 sm:pb-[60px] p-[20px] md:p-0">
        <div class="py-3">
          <ul class="flex flex-row gap-3 flex-wrap">
            <li v-for="(item,i) in tabsOptions" :key="i">
              <el-check-tag
                  :checked="item.value === currentTabValue"
                  :effect="colorMode.preference === 'dark' ? 'dark' : 'light'"
                  @click="handleChangeTab(item.value)"
                  type="success">
                <div class="flex flex-row items-center ">
                  <span class="text-[10px] md:text-[14px]">{{ item.label }}</span>
                </div>
              </el-check-tag>
            </li>
            <li>
              <el-check-tag
                  :checked="exact"
                  :effect="colorMode.preference === 'dark' ? 'dark' : 'light'"
                  @click="handleChangeExact(exact)"
                  type="success">
                <span class="text-[10px] md:text-[14px]">精确搜索</span>
              </el-check-tag>
            </li>
            <li>
              <el-select
                  v-model="currentEngine"
                  placeholder="Select"
                  style="width: 140px"
                  :effect="colorMode.preference === 'dark' ? 'dark' : 'light'"
                  value-key="engine"
                  @change="handleEngineChange"
              >
                <el-option v-for="item in apiEndpointsData" :key="item.engine" :label="item.engine_name"
                           :value="item.engine">

                </el-option>
              </el-select>
            </li>
          </ul>
        </div>

        <disk-info-list :sources="sources"
                        :skeleton-loading="skeletonLoading"
                        @open-link="handleOpenSourceLink"
        >
        </disk-info-list>

        <div class="py-[40px] flex justify-center">
          <client-only>
            <el-pagination
                background
                :current-page="page"
                :page-size="10"
                layout="prev, pager, next"
                @current-change="handleCurrentPageChange"
                :total="sources?.total"
            />
          </client-only>

        </div>
      </div>
      <div class="p-[20px] sm:py-[20px]">
        <div class="bg-white dark:bg-transparent dark:shadow-gray-500 shadow p-[14px] rounded-[6px]">
          <div class="flex flex-row justify-between items-center">
            <span class="text-[14px] font-bold">最近更新</span>
            <div>
              <el-button link icon="refresh" @click="getLatestSourcesData(1, 10)"></el-button>
              <el-button link icon="more" @click="handleGoToLatestSources()"></el-button>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-3 mt-3 min-h-[500px]" id="latest-sources">
            <el-skeleton animated :loading="latestSkeletonLoading" :count="10">
              <template #template>
                <div
                    class="bg-white dark:bg-gray-600 shadow p-[14px] rounded-[6px] cursor-pointer mb-3
                hover:bg-[#f5f5f5] hover:shadow-lg transition duration-300 ease-in-out"
                >
                  <div class="flex flex-row gap-2 items-center">
                    <el-skeleton-item variant="image" style="width: 20px; height: 20px"/>
                    <el-skeleton-item variant="text" style="width: 100px;"/>
                  </div>
                </div>
              </template>
              <template #default>
                <div
                    class="bg-white dark:bg-gray-600 shadow p-[14px] rounded-[6px] cursor-pointer
                hover:bg-[#f5f5f5] dark:hover:bg-gray-700 hover:shadow-lg transition duration-300 ease-in-out"
                    v-for="(item,i) in latestSourcesData?.list ? latestSourcesData?.list : latestSourcesData" :key="i"
                    @click="handleOpenLatestSourceLink(item)"
                >
                  <div class="flex flex-row gap-2 items-center">
                    <img class="w-[20px]" v-if="item.disk_type === 'ALY'" src="@/assets/netdisk/aliyun.png"
                         alt="aliyun">
                    <img class="w-[20px]" v-if="item.disk_type === 'QUARK'" src="@/assets/netdisk/quark.png"
                         alt="quark">
                    <img class="w-[20px]" v-if="item.disk_type === 'BDY'" src="@/assets/netdisk/baidu.png" alt="baidu">
                    <img class="w-[20px]" v-if="item.disk_type === 'XUNLEI'" src="@/assets/netdisk/xunlei.png"
                         alt="xunlei">
                    <span class="text-[14px] font-inter break-words truncate dark:text-slate-200">{{
                        item.disk_name
                      }}</span>
                  </div>
                </div>
              </template>
            </el-skeleton>

          </div>
        </div>

      </div>
    </div>
    <el-backtop></el-backtop>
  </div>
</template>

<style scoped>

</style>