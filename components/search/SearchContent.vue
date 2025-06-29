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
            <!-- Loading Skeletons -->
            <VodSkeleton v-if="
              vodData.length === 0 &&
              Array.from(loadingStatus.values()).some((status) => status)
            " />

            <!-- VOD List -->
            <template v-else>
              <vod-list :vod-data="vodData" class="transition-opacity duration-300" :class="{
                'opacity-0': Array.from(loadingStatus.values()).some(
                  (status) => status
                ),
              }"></vod-list>
            </template>
          </div>
        </div>
      </transition>
    </div>

    <!-- Loading State -->
    <LoadingState v-if="
      (category === 'clouddrive' && loadingProgress.isLoading) ||
      (category === 'onlineVod' &&
        Array.from(loadingStatus.values()).some((status) => status))
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
      class="!bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 !w-12 !h-12 transition-all duration-300 !rounded-xl group hover:scale-110 !shadow-lg hover:!shadow-xl backdrop-blur-sm flex items-center justify-center">
      <i class="fas fa-arrow-up text-white group-hover:animate-bounce"></i>
    </el-backtop>
  </div>
</template>

<script setup>
import DiskInfoList from "~/components/diskInfoList.vue";
import VodSkeleton from './VodSkeleton.vue'
import LoadingState from './LoadingState.vue'
import EmptyState from './EmptyState.vue'

defineProps({
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
