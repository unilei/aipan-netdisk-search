<script setup>
import { useRadioStore } from '~/stores/radio';

const { data } = await useFetch('/api/radio/stations');
const stations = ref(data.value.data.map(station => ({
  ...station,
  isPlaying: false
})));

const radio = useRadioStore();
const showVolumeControl = ref(false);
const volumeControlTimeout = ref(null);
const isVolumeChanging = ref(false);
const showKeyboardHints = ref(true);

onMounted(() => {
  radio.initAudio();
  // 键盘快捷键
  window.addEventListener('keydown', handleKeyPress);
});

// 计算属性
const currentStation = computed(() => radio.currentStation);
const isPlaying = computed(() => radio.isPlaying);
const volume = computed({
  get: () => radio.volume,
  set: (value) => radio.updateVolume(value)
});
const isMuted = computed(() => radio.isMuted);
const isLoading = computed(() => radio.isLoading);
const isBuffering = computed(() => radio.isBuffering);
const errorMessage = computed(() => radio.errorMessage);



const handleKeyPress = (event) => {
  if (event.target.tagName === 'INPUT') return; // 如果焦点在输入框，不处理快捷键

  switch(event.code) {
    case 'Space':
      event.preventDefault();
      if (currentStation.value) {
        if (isPlaying.value) {
          stopStation();
        } else {
          playStation(currentStation.value);
        }
      }
      break;
    case 'ArrowUp':
      event.preventDefault();
      updateVolume(Math.min(1, volume.value + 0.1));
      break;
    case 'ArrowDown':
      event.preventDefault();
      updateVolume(Math.max(0, volume.value - 0.1));
      break;
    case 'KeyM':
      event.preventDefault();
      toggleMute();
      break;
  }
};

const playStation = (station) => {
  radio.playStation(station);
};

const stopStation = () => {
  radio.stopStation();
};

const toggleMute = () => {
  radio.toggleMute();
};

const updateVolume = (newVolume) => {
  radio.updateVolume(newVolume);
};

// 处理音量控制面板的显示和隐藏
const handleVolumeControlShow = () => {
  if (volumeControlTimeout.value) {
    clearTimeout(volumeControlTimeout.value);
  }
  showVolumeControl.value = true;
};

const handleVolumeControlHide = () => {
  if (!isVolumeChanging.value) {
    volumeControlTimeout.value = setTimeout(() => {
      showVolumeControl.value = false;
    }, 800);
  }
};

// 组件卸载时清理事件监听
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress);
});

// SEO配置
useHead({
  title: 'FM电台 - AIPAN.ME',
  meta: [
    { name: 'description', content: '在线收听各类精选电台频道，包括古典音乐、爵士、流行音乐等多种类型。' },
    { name: 'keywords', content: 'FM电台,在线电台,音乐电台,网络电台,古典音乐,爵士音乐,流行音乐' },
  ]
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
    <!-- 错误提示 -->
    <div v-if="errorMessage" 
         class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md"
         role="alert">
      <i class="fas fa-exclamation-circle"></i>
      <span class="text-sm flex-1">{{ errorMessage }}</span>
      <button @click="errorMessage = ''" class="text-red-600 dark:text-red-300 hover:text-red-800 dark:hover:text-red-100">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- 页面头部 -->
    <div class="max-w-4xl mx-auto mb-6">
      <div class="flex items-center gap-3 mb-2">
        <i class="fas fa-broadcast-tower text-purple-600 dark:text-purple-400 text-lg"></i>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          FM 电台
        </h1>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        共 {{ stations.length }} 个在线电台
      </p>
    </div>
    
    <!-- 电台列表 -->
    <div class="max-w-4xl mx-auto">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div v-for="(station, index) in stations" :key="station.name" 
               class="group hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
            <div class="flex items-center gap-3 p-3 sm:p-4">
              <!-- 序号 -->
              <div class="w-6 text-center shrink-0">
                <span class="text-xs font-medium text-gray-400 dark:text-gray-500">
                  {{ index + 1 }}
                </span>
              </div>

              <!-- 封面 -->
              <div class="relative shrink-0">
                <img :src="station.cover" :alt="station.name" 
                     class="w-12 h-12 sm:w-14 sm:h-14 rounded object-cover border border-gray-200 dark:border-gray-700">
                
                <!-- 播放状态指示 -->
                <div v-if="station.isPlaying" class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  <i class="fas fa-play text-white text-[6px]"></i>
                </div>
              </div>

              <!-- 电台信息 -->
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white truncate mb-0.5">
                  {{ station.name }}
                </h3>
                <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>在线电台</span>
                  <span v-if="station.isPlaying" class="flex items-center gap-1">
                    <span class="w-1 h-1 rounded-full bg-green-500"></span>
                    <span class="text-green-600 dark:text-green-400">
                      {{ isBuffering ? '缓冲中' : '播放中' }}
                    </span>
                  </span>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="shrink-0">
                <button @click="station.isPlaying ? stopStation() : playStation(station)"
                        class="px-3 py-1.5 text-xs font-medium rounded border transition-colors"
                        :class="station.isPlaying 
                          ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750' 
                          : 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'"
                        :disabled="isLoading">
                  <i class="fas mr-1" :class="{
                    'fa-play': !station.isPlaying && !isLoading,
                    'fa-stop': station.isPlaying && !isLoading,
                    'fa-spinner fa-spin': isLoading && currentStation?.name === station.name
                  }"></i>
                  <span class="hidden sm:inline">{{ station.isPlaying ? '停止' : '播放' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 播放控制栏 -->
    <div v-if="currentStation" 
         class="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between gap-4">
          <!-- 左侧：当前播放 -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <!-- 封面 -->
            <img :src="currentStation.cover" alt="Current station" 
                 class="w-12 h-12 rounded object-cover border border-gray-200 dark:border-gray-700 shrink-0">
            
            <!-- 信息 -->
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-sm text-gray-900 dark:text-white truncate">
                {{ currentStation.name }}
              </h4>
              <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span class="w-1 h-1 rounded-full bg-green-500"></span>
                <span>{{ isBuffering ? '缓冲中...' : '正在播放' }}</span>
              </div>
            </div>
          </div>

          <!-- 右侧：控制按钮 -->
          <div class="flex items-center gap-2">
            <!-- 音量控制 -->
            <div class="relative volume-control-wrapper"
                 @mouseenter="handleVolumeControlShow"
                 @mouseleave="handleVolumeControlHide">
              <button @click="toggleMute" 
                      class="w-9 h-9 rounded flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <i class="fas text-sm" :class="isMuted || volume === 0 ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'"></i>
              </button>
              
              <!-- 音量面板 -->
              <div v-show="showVolumeControl" 
                   class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-48 border border-gray-200 dark:border-gray-700 volume-control-transition"
                   @mouseenter="handleVolumeControlShow"
                   @mouseleave="handleVolumeControlHide">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs font-medium text-gray-700 dark:text-gray-300">音量</span>
                  <span class="text-xs font-medium text-gray-900 dark:text-white">
                    {{ Math.round(volume * 100) }}%
                  </span>
                </div>
                <input type="range" 
                       min="0" 
                       max="1" 
                       step="0.01" 
                       v-model="volume"
                       @input="updateVolume($event.target.value)"
                       class="w-full volume-slider">
              </div>
            </div>

            <!-- 停止按钮 -->
            <button @click="stopStation" 
                    class="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors flex items-center gap-2">
              <i class="fas fa-stop text-xs"></i>
              <span class="hidden sm:inline">停止</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 键盘快捷键提示 -->
    <div v-if="showKeyboardHints" class="fixed bottom-20 right-4 z-30">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 relative w-48">
        <!-- 关闭按钮 -->
        <button @click="showKeyboardHints = false" 
                class="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 dark:bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-800 dark:hover:bg-gray-600">
          <i class="fas fa-times text-xs"></i>
        </button>
        
        <!-- 标题 -->
        <div class="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <i class="fas fa-keyboard text-purple-600 dark:text-purple-400"></i>
          <span class="font-semibold text-sm text-gray-900 dark:text-white">快捷键</span>
        </div>
        
        <!-- 快捷键列表 -->
        <div class="space-y-2 text-xs">
          <div class="flex items-center justify-between">
            <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">空格</kbd>
            <span class="text-gray-600 dark:text-gray-400">播放/停止</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex gap-1">
              <kbd class="px-1.5 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">↑</kbd>
              <kbd class="px-1.5 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">↓</kbd>
            </div>
            <span class="text-gray-600 dark:text-gray-400">音量</span>
          </div>
          <div class="flex items-center justify-between">
            <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">M</kbd>
            <span class="text-gray-600 dark:text-gray-400">静音</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 音量滑块样式 */
.volume-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  outline: none;
  background: #e5e7eb;
  cursor: pointer;
}

.dark .volume-slider {
  background: #374151;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #9333ea;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.dark .volume-slider::-webkit-slider-thumb {
  background: #a855f7;
}

/* 音量控制面板动画 */
.volume-control-transition {
  transition: opacity 0.2s ease;
}

.volume-control-wrapper:hover .volume-control-transition {
  opacity: 1 !important;
  pointer-events: auto;
}

.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 2s linear infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

/* 音量控制样式优化 */
.volume-control-wrapper {
  position: relative;
  z-index: 50;
}

.volume-control-wrapper:hover .volume-control-transition {
  opacity: 1;
  transform: translate(-50%, 0);
  pointer-events: auto;
}

.volume-control-transition {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  pointer-events: none;
}

/* 音量滑块样式优化 */
.volume-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  outline: none;
  padding: 0;
  margin: 10px 0;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4b5563;
  border: 2px solid white;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.volume-slider::-webkit-slider-thumb:active {
  transform: scale(1.1);
}

.dark .volume-slider::-webkit-slider-thumb {
  background: #9ca3af;
  border-color: #374151;
}

.volume-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 6px;
  cursor: pointer;
  background: linear-gradient(to right, #4b5563 var(--volume-percent, 50%), #e5e7eb var(--volume-percent, 50%));
  border-radius: 3px;
}

.dark .volume-slider::-webkit-slider-runnable-track {
  background: linear-gradient(to right, #9ca3af var(--volume-percent, 50%), #4b5563 var(--volume-percent, 50%));
}

/* 音量控制面板动画 */
.volume-control-enter-active,
.volume-control-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.volume-control-enter-from,
.volume-control-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}
</style>
