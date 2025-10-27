<template>
  <div
    class="w-full sticky top-0 z-10 transition-all duration-300 border-b border-gray-100/50 dark:border-gray-700/50">
    <div class="max-w-[1240px] mx-auto px-4 py-3">
      <div class="flex flex-col sm:flex-row items-center gap-4">
        <!-- Category Selection with Enhanced UI -->
        <div
          class="w-full sm:w-auto flex gap-2 overflow-x-auto hide-scrollbar snap-x px-2 py-2 transition-all duration-300 rounded-xl bg-white/30 dark:bg-gray-800/30 ring-1 ring-gray-200/50 dark:ring-gray-700/50">
          <el-button v-for="(item, index) in categories" :key="index"
            class="snap-start min-w-fit transition-all duration-300 rounded-xl group relative" :class="[
              currentCategory === item.value
                ? 'shadow-lg !text-white scale-105 !bg-linear-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                : 'bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-600/80',
              index === 0 && 'ml-0.5',
              index === categories.length - 1 && 'mr-0.5',
            ]" :title="item.description" @click="$emit('switch-category', item.value)" type="primary"
            :plain="currentCategory !== item.value">
            <!-- Background hover effect -->
            <span v-if="currentCategory !== item.value"
              class="absolute inset-0 rounded-xl bg-linear-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>

            <!-- Icon and text with better alignment -->
            <div class="flex items-center gap-2">
              <i :class="item.icon" class="text-lg"></i>
              <span>{{ item.label }}</span>
            </div>

            <!-- Active indicator with enhanced animation -->
            <span v-if="currentCategory === item.value" class="absolute -top-1 -right-1 flex">
              <span class="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-purple-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>

            <!-- Bottom border animation for active tab -->
            <span v-if="currentCategory === item.value"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-linear-to-r from-purple-400 to-blue-400"></span>
          </el-button>

          <!-- Settings button with tooltip -->
          <el-popover v-if="showSettingsButton" placement="bottom-end" trigger="hover" :width="320"
            popper-class="backdrop-blur-md bg-white/90 dark:bg-gray-800/90 border border-gray-100/50 dark:border-gray-700/50 rounded-xl shadow-xl">
            <template #reference>
              <el-button
                class="snap-start min-w-fit rounded-xl bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-600/80 group">
                <div class="flex items-center gap-2">
                  <i class="fas fa-cog text-lg group-hover:rotate-45 transition-transform duration-500"></i>
                  <span>配置</span>
                </div>
              </el-button>
            </template>
            <div class="p-3">
              <div class="flex items-start gap-3">
                <div class="text-blue-500 mt-1">
                  <i class="fas fa-info-circle text-xl"></i>
                </div>
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    登录以保存VOD配置
                  </h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    登录后可以将您的视频源配置保存到云端，在任何设备上使用相同的视频源。
                  </p>
                  <div class="flex gap-2">
                    <el-button type="primary" @click="navigateTo('/login')" size="small" class="!rounded-lg">
                      <i class="fas fa-sign-in-alt mr-1"></i> 登录
                    </el-button>
                    <el-button @click="navigateTo('/user/vod-settings')" size="small" class="!rounded-lg">
                      <i class="fas fa-cog mr-1"></i> 管理配置
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-popover>
        </div>

        <!-- Search Progress Component -->
        <SearchProgress 
          v-if="currentCategory === 'clouddrive' && loadingProgress.isLoading"
          :loading-progress="loadingProgress"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import SearchProgress from './SearchProgress.vue'

defineProps({
  categories: {
    type: Array,
    required: true
  },
  currentCategory: {
    type: String,
    required: true
  },
  showSettingsButton: {
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
  }
})

defineEmits(['switch-category'])
</script>

<style scoped>
/* Hide scrollbar */
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
