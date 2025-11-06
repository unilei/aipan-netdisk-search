<template>
  <div class="mx-auto overflow-y-auto px-4 scroll-smooth">
    <div class="max-w-[1240px] mx-auto">
      <!-- Cloud Drive Content -->
      <transition name="fade" mode="out-in">
        <div class="p-4" v-if="category === 'clouddrive'">
          <div class="transition-all duration-300 space-y-2">
            <disk-info-list :sources="sources" :skeleton-loading="skeletonLoading">
            </disk-info-list>
          </div>
        </div>
      </transition>

      <!-- VOD Content -->
      <transition name="fade" mode="out-in">
        <div v-if="category === 'onlineVod'" class="p-2">
          <div class="space-y-4">
            <!-- VOD Player (播放界面) -->
            <template v-if="selectedVodForPlay">
              <div class="space-y-4">
                <!-- 返回按钮 -->
                <button 
                  @click="backToList"
                  class="flex items-center gap-2 px-4 py-2.5 
                         text-sm font-medium 
                         text-gray-700 dark:text-gray-300 
                         hover:text-purple-600 dark:hover:text-purple-400 
                         bg-white dark:bg-gray-800/80
                         hover:bg-purple-50 dark:hover:bg-gray-700/80
                         border border-gray-200 dark:border-gray-700
                         hover:border-purple-300 dark:hover:border-purple-600
                         rounded-lg
                         shadow-sm dark:shadow-gray-900/30
                         transition-all duration-200
                         backdrop-blur-sm
                         active:scale-95">
                  <i class="fas fa-arrow-left text-base"></i>
                  <span>返回列表</span>
                </button>
                
                <!-- 播放器 -->
                <vod-list :vod-data="[selectedVodForPlay]"></vod-list>
              </div>
            </template>

            <!-- Loading Skeletons -->
            <VodSkeleton v-else-if="
              vodData.length === 0 &&
              Array.from(loadingStatus.values()).some((status) => status)
            " />

            <!-- VOD Card Grid -->
            <VodDetailCard 
              v-else-if="vodData.length > 0"
              :vod-data="vodData" 
              @play-vod="handlePlayVod"
            />
          </div>
        </div>
      </transition>
    </div>

    <!-- Loading State (只在网盘搜索时显示) -->
    <LoadingState v-if="
      category === 'clouddrive' && loadingProgress.isLoading
    " />

    <!-- Empty State -->
    <EmptyState v-if="
      searchPerformed &&
      !skeletonLoading &&
      !loadingProgress.isLoading &&
      !Array.from(loadingStatus.values()).some((status) => status) &&
      ((category === 'clouddrive' && sources.length === 0) ||
        (category === 'onlineVod' && vodData.length === 0))
    " />

    <!-- Enhanced Backtop -->
    <el-backtop :right="24" :bottom="24"
      class="bg-linear-to-r! from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 !w-12 !h-12 transition-all duration-300 !rounded-xl group hover:scale-110 !shadow-lg hover:!shadow-xl backdrop-blur-sm flex items-center justify-center">
      <i class="fas fa-arrow-up text-white group-hover:animate-bounce"></i>
    </el-backtop>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import DiskInfoList from "~/components/diskInfoList.vue";
import VodSkeleton from './VodSkeleton.vue'
import LoadingState from './LoadingState.vue'
import EmptyState from './EmptyState.vue'
import VodDetailCard from '~/components/vod/VodDetailCard.vue'

const props = defineProps({
  category: {
    type: String,
    required: true
  },
  sources: {
    type: Array,
    default: () => []
  },
  skeletonLoading: {
    type: Boolean,
    default: false
  },
  vodData: {
    type: Array,
    default: () => []
  },
  loadingStatus: {
    type: Map,
    default: () => new Map()
  },
  loadingProgress: {
    type: Object,
    default: () => ({
      total: 0,
      completed: 0,
      isLoading: false
    })
  },
  searchPerformed: {
    type: Boolean,
    default: false
  }
})

// 当前播放的VOD
const selectedVodForPlay = ref(null)

// 处理播放VOD
const handlePlayVod = (vod) => {
  // 查找相同名称的所有播放源
  const relatedVods = props.vodData.filter(item => 
    item.vod_name === vod.vod_name || 
    (item.vod_id && vod.vod_id && item.vod_id === vod.vod_id)
  )
  
  // 如果找到多个播放源，使用它们；否则只使用当前的
  const vodDataArray = relatedVods.length > 0 ? relatedVods : [vod]
  
  // 生成唯一的存储 key
  const storageKey = `vodData_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // 将数据存储到 sessionStorage
  sessionStorage.setItem(storageKey, JSON.stringify(vodDataArray))
  
  // 构建播放页面 URL（只传递 key）
  const playUrl = `/play?key=${storageKey}`
  
  // 在新标签页打开
  window.open(playUrl, '_blank')
}

// 返回列表
const backToList = () => {
  selectedVodForPlay.value = null
}

// 监听分类变化，重置播放状态
watch(() => props.category, () => {
  selectedVodForPlay.value = null
})

// 监听vodData变化，当开始新搜索时重置播放状态
watch(() => props.vodData, (newVal, oldVal) => {
  if (newVal.length === 0 || (oldVal && oldVal.length > 0 && newVal.length > oldVal.length)) {
    // 新搜索开始，重置播放状态
    selectedVodForPlay.value = null
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
