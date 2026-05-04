<template>
  <div class="mx-auto overflow-y-auto px-4 scroll-smooth">
    <div class="max-w-[1240px] mx-auto">
      <transition name="fade" mode="out-in">
        <div class="p-4">
          <div class="transition-all duration-300 space-y-2">
            <disk-info-list :sources="sources" :skeleton-loading="skeletonLoading" :is-searching="loadingProgress.isLoading">
            </disk-info-list>
          </div>
        </div>
      </transition>
    </div>

    <!-- Empty State -->
    <EmptyState v-if="
      searchPerformed &&
      !skeletonLoading &&
      !loadingProgress.isLoading &&
      sources.length === 0
    " />

    <!-- Enhanced Backtop -->
    <el-backtop :right="24" :bottom="24"
      class="bg-linear-to-r! from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 !w-12 !h-12 transition-all duration-300 !rounded-xl group hover:scale-110 !shadow-lg hover:!shadow-xl backdrop-blur-sm flex items-center justify-center">
      <i class="fas fa-arrow-up text-white group-hover:animate-bounce"></i>
    </el-backtop>
  </div>
</template>

<script setup>
import DiskInfoList from "~/components/diskInfoList.vue";
import EmptyState from './EmptyState.vue'

defineProps({
  sources: {
    type: Array,
    default: () => []
  },
  skeletonLoading: {
    type: Boolean,
    default: false
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
