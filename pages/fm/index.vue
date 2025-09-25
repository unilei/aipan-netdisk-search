<script setup>
import { useRadioStore } from '~/stores/radio';

const { data } = await useFetch('https://netdisk.aipan.me/api/radio/stations');
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
  title: 'FM电台 - ailookzy.com',
  meta: [
    { name: 'description', content: '在线收听各类精选电台频道，包括古典音乐、爵士、流行音乐等多种类型。' },
    { name: 'keywords', content: 'FM电台,在线电台,音乐电台,网络电台,古典音乐,爵士音乐,流行音乐' },
  ]
})
</script>

<template>
  <div class="px-4 py-8 dark:bg-gray-900">
    <!-- 错误提示 -->
    <div v-if="errorMessage" 
         class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 max-w-md animate-fade-in"
         role="alert">
      <i class="fas fa-exclamation-circle text-xl"></i>
      <span class="block">{{ errorMessage }}</span>
      <button @click="errorMessage = ''" class="ml-auto text-red-700 hover:text-red-900">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <h1 class="text-2xl font-bold mb-8 text-center dark:text-white">FM电台</h1>
    
    <!-- 电台列表 -->
    <div class="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="station in stations" :key="station.name" 
           class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
        <div class="relative group">
          <img :src="station.cover" :alt="station.name" class="w-full h-36 object-cover">
          <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button @click="station.isPlaying ? stopStation() : playStation(station)"
                    class="bg-white text-gray-900 px-6 py-2 rounded-full hover:bg-gray-100 transition-colors duration-300 flex items-center space-x-2 text-xs"
                    :disabled="isLoading">
              <i class="fas" :class="{
                'fa-play': !station.isPlaying && !isLoading,
                'fa-stop': station.isPlaying && !isLoading,
                'fa-spinner fa-spin': isLoading && currentStation?.name === station.name
              }"></i>
              <span>{{ station.isPlaying ? '停止' : '播放' }}</span>
            </button>
          </div>
        </div>
        <div class="p-4">
          <h3 class="text-sm font-semibold mb-2 dark:text-white">{{ station.name }}</h3>
          <div class="flex items-center">
            <span class="inline-block w-2 h-2 rounded-full mr-2"
                  :class="{
                    'bg-green-500 animate-pulse': station.isPlaying && !isBuffering,
                    'bg-yellow-500 animate-pulse': station.isPlaying && isBuffering,
                    'bg-gray-400': !station.isPlaying
                  }"></span>
            <span class="text-gray-600 dark:text-gray-300 text-xs">
              {{ station.isPlaying ? (isBuffering ? '缓冲中...' : '播放中') : '待播放' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 播放控制栏 -->
    <div v-if="currentStation" 
         class="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-lg border-t border-gray-200 dark:border-gray-700 p-4 transition-transform duration-300">
      <div class="mx-auto flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="relative w-12 h-12 rounded-xl overflow-hidden shadow-md">
            <img :src="currentStation.cover" alt="Current station" 
                 class="w-full h-full object-cover"
                 :class="{ 'animate-spin': isBuffering }">
            <div v-if="isBuffering" 
                 class="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <i class="fas fa-circle-notch fa-spin text-white text-xl"></i>
            </div>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white">{{ currentStation.name }}</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
              <span class="inline-block w-1.5 h-1.5 rounded-full" 
                    :class="{'bg-green-500 animate-pulse': !isBuffering, 'bg-yellow-500 animate-pulse': isBuffering}"></span>
              <span>{{ isBuffering ? '缓冲中...' : '正在播放' }}</span>
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-6">
          <!-- 音量控制 -->
          <div class="relative volume-control-wrapper"
               @mouseenter="handleVolumeControlShow"
               @mouseleave="handleVolumeControlHide">
            <button @click="toggleMute" 
                    class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 active:scale-95">
              <i class="fas text-lg" :class="isMuted || volume === 0 ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'"></i>
            </button>
            <div v-show="showVolumeControl" 
                 class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 w-48 border border-gray-200 dark:border-gray-700 volume-control-transition"
                 @mouseenter="handleVolumeControlShow"
                 @mouseleave="handleVolumeControlHide">
              <div class="flex items-center space-x-2 mb-3">
                <i class="fas" :class="isMuted || volume === 0 ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'"></i>
                <span class="text-sm font-medium dark:text-gray-300">音量控制</span>
              </div>
              <input type="range" 
                     min="0" 
                     max="1" 
                     step="0.01" 
                     v-model="volume"
                     @input="updateVolume($event.target.value)"
                     class="w-full mb-2 volume-slider">
              <div class="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                {{ Math.round(volume * 100) }}%
              </div>
              <div class="absolute w-3 h-3 bg-white dark:bg-gray-800 border-l border-b border-gray-200 dark:border-gray-700 transform rotate-45 -bottom-1.5 left-1/2 -translate-x-1/2"></div>
            </div>
          </div>
          <!-- 停止按钮 -->
          <button @click="stopStation" 
                  class="bg-gray-900 dark:bg-gray-700 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 transition-all duration-200 active:scale-95 flex items-center space-x-2 shadow-md">
            <i class="fas fa-stop text-sm"></i>
            <span class="font-medium">停止播放</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 键盘快捷键提示 -->
    <div v-if="showKeyboardHints" class="fixed bottom-24 right-4 text-sm">
      <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 relative">
        <button @click="showKeyboardHints = false" 
                class="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 dark:bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors duration-200 shadow-md">
          <i class="fas fa-times text-xs"></i>
        </button>
        <div class="font-medium text-gray-900 dark:text-white mb-3">键盘快捷键</div>
        <div class="space-y-2 text-gray-600 dark:text-gray-400">
          <div class="flex items-center space-x-2">
            <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">空格键</kbd>
            <span>播放/停止</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="flex space-x-1">
              <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">↑</kbd>
              <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">↓</kbd>
            </div>
            <span>音量调节</span>
          </div>
          <div class="flex items-center space-x-2">
            <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">M</kbd>
            <span>静音</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义音量滑块样式 */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #4b5563 0%, #4b5563 var(--value-percent, 50%), #e5e7eb var(--value-percent, 50%), #e5e7eb 100%);
  cursor: pointer;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4b5563;
  border: 2px solid white;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: all 0.2s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.dark input[type="range"] {
  background: linear-gradient(to right, #9ca3af 0%, #9ca3af var(--value-percent, 50%), #4b5563 var(--value-percent, 50%), #4b5563 100%);
}

.dark input[type="range"]::-webkit-slider-thumb {
  background: #9ca3af;
  border-color: #374151;
}

.volume-control-transition {
  transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* 键盘快捷键样式 */
kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  border: 1px solid rgba(0,0,0,0.1);
}

.dark kbd {
  border-color: rgba(255,255,255,0.1);
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
