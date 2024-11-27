<template>
  <div
    class="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white"
  >
    <!-- Main Content -->
    <div class="relative h-screen pb-24">
      <!-- 24 is the height of player bar -->
      <!-- Header -->
      <div class="p-8">
        <el-button
          type="primary"
          class="px-6 py-3 text-base rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center"
          @click="selectFolder"
        >
          <i class="fa-solid fa-folder-open mr-2"></i>
          选择音乐文件夹
        </el-button>
        <input
          ref="folderInput"
          type="file"
          webkitdirectory
          directory
          class="hidden"
          @click="handleMouseMove"
          @change="handleFolderSelect"
        />
      </div>
      <!-- 在适当的位置添加主题切换按钮组 -->
      <div class="absolute top-4 right-4 flex gap-2">
        <button
          v-for="theme in themes"
          :key="theme.id"
          @click="switchTheme(theme.id)"
          :class="[
            'px-3 py-1 rounded text-sm transition-all',
            currentTheme === theme.id
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
          ]"
        >
          {{ theme.name }}
        </button>
      </div>
      <!-- Waveform Visualization -->
      <div
        class="flex flex-col items-center justify-center p-8"
        v-if="musicList.length > 0"
      >
        <div
          class="w-full max-w-3xl aspect-video bg-gray-800 rounded-lg p-4 relative overflow-hidden"
        >
          <canvas ref="waveformCanvas" class="w-full h-full"></canvas>
          <div
            class="absolute inset-0 flex items-center justify-center"
            v-if="!currentPlaying"
          >
            <i class="fa-solid fa-headphones text-4xl text-gray-400"></i>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="flex-1 flex flex-col items-center justify-center text-gray-400"
      >
        <i class="fa-solid fa-headphones text-7xl mb-5"></i>
        <p class="text-lg">选择音乐文件夹开始播放</p>
      </div>
    </div>

    <!-- Fixed Player Bar -->
    <div
      class="fixed bottom-0 left-0 right-0 h-24 bg-gray-900 border-t border-gray-800 px-4 flex items-center justify-between backdrop-blur-lg bg-opacity-90"
    >
      <!-- Currently Playing -->
      <div class="flex items-center w-1/4">
        <div
          class="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center mr-4 overflow-hidden"
        >
          <template v-if="currentPlaying">
            <div
              class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center"
            >
              <i class="fa-solid fa-headphones text-2xl text-white"></i>
            </div>
          </template>
          <template v-else>
            <i class="fa-solid fa-headphones text-2xl text-gray-600"></i>
          </template>
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-medium truncate">{{
            currentPlaying?.name || "未选择歌曲"
          }}</span>
          <span class="text-xs text-gray-400 mt-1 flex items-center">
            <i class="fa-solid fa-music mr-1"></i>
            本地音乐
          </span>
        </div>
      </div>

      <!-- Player Controls -->
      <div class="flex flex-col items-center w-2/4">
        <div class="flex items-center gap-6 mb-2">
          <button
            class="text-gray-400 hover:text-white transition-colors"
            @click="previousTrack"
            :disabled="!hasPrevious"
            :class="{ 'opacity-50 cursor-not-allowed': !hasPrevious }"
          >
            <i class="fa-solid fa-backward text-2xl"></i>
          </button>
          <button
            class="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
            @click="togglePlay"
          >
            <i
              :class="[
                'fa-solid',
                isPlaying ? 'fa-pause' : 'fa-play',
                'text-2xl',
                isPlaying ? '' : 'ml-1',
              ]"
            ></i>
          </button>
          <button
            class="text-gray-400 hover:text-white transition-colors"
            @click="nextTrack"
            :disabled="!hasNext"
            :class="{ 'opacity-50 cursor-not-allowed': !hasNext }"
          >
            <i class="fa-solid fa-forward text-2xl"></i>
          </button>
        </div>
        <div class="w-full flex items-center gap-2 text-xs text-gray-400">
          <span class="w-10 text-right">{{ formatTime(currentTime) }}</span>
          <el-slider
            v-model="currentTime"
            :max="duration"
            @change="handleSeek"
            class="flex-1"
          ></el-slider>
          <span class="w-10">{{ formatTime(duration) }}</span>
        </div>
      </div>

      <!-- Volume and Playlist -->
      <div class="flex items-center justify-end w-1/4 gap-4">
        <div class="flex items-center gap-2 group relative">
          <button class="text-gray-400 hover:text-white transition-colors p-2">
            <i
              :class="[
                'fa-solid',
                volume === 0
                  ? 'fa-volume-xmark'
                  : volume < 30
                  ? 'fa-volume-off'
                  : volume < 70
                  ? 'fa-volume-low'
                  : 'fa-volume-high',
                'text-xl',
              ]"
            ></i>
          </button>
          <div class="w-24">
            <el-slider
              v-model="volume"
              :max="100"
              @change="handleVolumeChange"
            ></el-slider>
          </div>
        </div>
        <button
          class="text-gray-400 hover:text-white transition-colors relative p-2"
          @click="togglePlaylist"
        >
          <i class="fa-solid fa-list text-xl"></i>
          <span
            v-if="musicList.length > 0"
            class="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-xs flex items-center justify-center"
          >
            {{ musicList.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- Playlist Drawer -->
    <el-drawer
      v-model="showPlaylist"
      title="播放列表"
      direction="rtl"
      size="400px"
      :with-header="false"
      class="music-playlist"
    >
      <div class="h-full flex flex-col bg-gray-900">
        <!-- Header -->
        <div
          class="p-4 border-b border-gray-700 flex items-center justify-between"
        >
          <div class="flex items-center">
            <i class="fa-solid fa-list text-xl mr-2 text-blue-500"></i>
            <span class="text-lg font-medium text-white">播放列表</span>
          </div>
          <div class="flex items-center space-x-2">
            <button
              class="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-500 hover:bg-gray-800 transition-all"
              @click="toggleShuffle"
              :class="{ 'text-blue-500': isShuffleMode }"
            >
              <i class="fa-solid fa-shuffle"></i>
            </button>
            <button
              class="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-500 hover:bg-gray-800 transition-all"
              @click="toggleRepeatMode"
              :class="{ 'text-blue-500': repeatMode !== 'none' }"
            >
              <i
                class="fa-solid"
                :class="repeatMode === 'one' ? 'fa-repeat-1' : 'fa-repeat'"
              ></i>
            </button>
            <button
              class="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
              @click="showPlaylist = false"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="px-4 py-3">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索歌曲..."
              class="w-full bg-gray-800 text-white px-4 py-2 rounded-lg pl-10 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700"
            />
            <i
              class="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            ></i>
          </div>
        </div>

        <!-- Music List -->
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <div
            v-if="filteredMusicList.length === 0"
            class="flex flex-col items-center justify-center h-full text-gray-400"
          >
            <i class="fa-solid fa-music text-4xl mb-4"></i>
            <p>{{ searchQuery ? "未找到匹配的歌曲" : "播放列表为空" }}</p>
          </div>

          <div
            v-for="(music, index) in filteredMusicList"
            :key="music.path"
            class="group px-4 py-3 flex items-center hover:bg-gray-800 cursor-pointer transition-all"
            :class="{
              'bg-gray-800 bg-opacity-50': currentPlaying?.path === music.path,
            }"
            @click="playMusic(music)"
          >
            <!-- Index/Playing Status -->
            <div class="w-8 flex-shrink-0 flex items-center justify-center">
              <template v-if="currentPlaying?.path === music.path">
                <i
                  class="fa-solid fa-volume-high text-blue-500"
                  v-if="isPlaying"
                ></i>
                <i class="fa-solid fa-pause text-gray-400" v-else></i>
              </template>
              <span v-else class="text-gray-400">{{ index + 1 }}</span>
            </div>

            <!-- Song Info -->
            <div class="flex-1 min-w-0 ml-3">
              <div
                class="font-medium truncate text-white"
                :class="{
                  'text-blue-500': currentPlaying?.path === music.path,
                }"
              >
                {{ music.name }}
              </div>
              <div class="text-xs text-gray-400 mt-1">
                <span class="mr-2">{{ formatTime(music.duration || 0) }}</span>
                <span class="px-1.5 py-0.5 rounded bg-gray-700">{{
                  music.format.toUpperCase()
                }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                class="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-700 transition-all"
                @click.stop="removeFromPlaylist(index)"
              >
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <audio
      ref="audioPlayer"
      @timeupdate="handleTimeUpdate"
      @ended="handleEnded"
      @loadedmetadata="handleLoadedMetadata"
      @play="handlePlay"
      @pause="handlePause"
      class="hidden"
    ></audio>

    <canvas
      ref="circularCanvas"
      class="fixed top-0 left-0 w-full h-full pointer-events-none"
    ></canvas>
  </div>
</template>

<script setup>
import {
  drawDefaultTheme,
  drawSpectrumTheme,
  drawParticlesTheme,
  drawMinimalTheme,
  drawCircularVisualizer,
} from "~/utils/musicPlayer";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
definePageMeta({
  layout: "custom",
});
// 状态定义
const folderInput = ref(null);
const audioPlayer = ref(null);
const waveformCanvas = ref(null);
const circularCanvas = ref(null);
const musicList = ref([]);
const currentPlaying = ref(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(100);
const showPlaylist = ref(false);
const mouseX = ref(50);
const mouseY = ref(50);
const backgroundColor = ref("rgba(17, 24, 39, 0.8)");
const accentColor = ref("rgba(59, 130, 246, 0.2)");
const currentTheme = ref("default");
const themes = [
  { id: "default", name: "默认主题" },
  { id: "spectrum", name: "频谱主题" },
  { id: "particles", name: "粒子主题" },
  { id: "minimal", name: "简约主题" },
];

const switchTheme = (themeId) => {
  currentTheme.value = themeId;
};
// Web Audio API 相关
let audioContext = null;
let analyser = null;
let dataArray = null;
let animationFrameId = null;

// 计算属性
const currentIndex = computed(() =>
  musicList.value.findIndex(
    (music) => music.path === currentPlaying.value?.path
  )
);

const hasPrevious = computed(() => currentIndex.value > 0);
const hasNext = computed(() => currentIndex.value < musicList.value.length - 1);

// 鼠标移动处理
const handleMouseMove = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  mouseX.value = ((e.clientX - rect.left) / rect.width) * 100;
  mouseY.value = ((e.clientY - rect.top) / rect.height) * 100;
};

// 粒子样式生成
const getParticleStyle = (i) => {
  const angle = (i / 20) * Math.PI * 2;
  const radius = 30 + Math.random() * 20;
  const x = 50 + Math.cos(angle) * radius;
  const y = 50 + Math.sin(angle) * radius;
  const size = 2 + Math.random() * 3;
  const animationDuration = 3 + Math.random() * 2;

  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    animation: `float ${animationDuration}s infinite ease-in-out`,
  };
};

// 计算属性：过滤后的音乐列表
const filteredMusicList = computed(() => {
  if (!searchQuery.value) return musicList.value;
  const query = searchQuery.value.toLowerCase();
  return musicList.value.filter((music) =>
    music.name.toLowerCase().includes(query)
  );
});

// 方法
const togglePlaylist = () => {
  showPlaylist.value = !showPlaylist.value;
};

const handleVolumeChange = (value) => {
  if (audioPlayer.value) {
    audioPlayer.value.volume = value / 100;
  }
};

const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
  }
};

const setupAudioVisualization = () => {
  if (!audioPlayer.value || !waveformCanvas.value) return;

  const source = audioContext.createMediaElementSource(audioPlayer.value);
  source.connect(analyser);
  analyser.connect(audioContext.destination);
};

const drawWaveform = () => {
  if (!waveformCanvas.value || !analyser || !dataArray) return;

  const canvas = waveformCanvas.value;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  analyser.getByteFrequencyData(dataArray);

  const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
  const hue = (average + 180) % 360;

  switch (currentTheme.value) {
    case "spectrum":
      drawSpectrumTheme(ctx, width, height, dataArray, hue);
      break;
    case "particles":
      drawParticlesTheme(ctx, width, height, dataArray, hue);
      break;
    case "minimal":
      drawMinimalTheme(ctx, width, height, dataArray);
      break;
    default:
      drawDefaultTheme(ctx, width, height, dataArray, hue);
  }

  if (circularCanvas.value) {
    drawCircularVisualizer(circularCanvas.value, dataArray, hue);
  }

  animationFrameId = requestAnimationFrame(drawWaveform);
};
const selectFolder = () => {
  folderInput.value.click();
};

const SUPPORTED_AUDIO_FORMATS = {
  // 常见格式
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/wav": ".wav",
  "audio/wave": ".wav",
  "audio/x-wav": ".wav",
  "audio/aac": ".aac",
  "audio/m4a": ".m4a",
  "audio/x-m4a": ".m4a",
  // 无损格式
  "audio/flac": ".flac",
  "audio/x-flac": ".flac",
  "audio/ogg": ".ogg",
  "audio/webm": ".webm",
  // 其他格式
  "audio/mp4": ".m4a",
  "audio/x-aiff": ".aiff",
  "audio/x-aac": ".aac",
};

const SUPPORTED_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".m4a",
  ".aac",
  ".flac",
  ".ogg",
  ".webm",
  ".aiff",
].map((ext) => ext.toLowerCase());

const isAudioFile = (file) => {
  // 检查 MIME 类型
  if (file.type && file.type.startsWith("audio/")) {
    return true;
  }

  // 检查文件扩展名
  const extension = file.name
    .substring(file.name.lastIndexOf("."))
    .toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(extension);
};

const handleFolderSelect = async (event) => {
  const files = Array.from(event.target.files || []);
  const audioFiles = files.filter(isAudioFile);

  if (audioFiles.length === 0) {
    ElMessage.warning("未找到支持的音频文件");
    return;
  }

  // 先释放之前的 URL
  musicList.value.forEach((music) => {
    if (music.url) {
      URL.revokeObjectURL(music.url);
    }
  });

  // 清空当前列表
  musicList.value = [];

  // 添加新的音频文件
  for (const file of audioFiles) {
    // 跳过以 ._ 开头的文件（macOS 的临时文件）
    if (file.name.startsWith("._")) {
      continue;
    }

    let url = null;
    try {
      url = URL.createObjectURL(file);

      // 创建一个临时的 audio 元素来验证文件是否可以播放
      const audio = new Audio();
      audio.src = url;

      // 等待加载元数据或失败
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          audio.removeEventListener("loadedmetadata", handleLoad);
          audio.removeEventListener("error", handleError);
          reject(new Error("加载超时"));
        }, 5000);

        const handleLoad = () => {
          clearTimeout(timeoutId);
          audio.removeEventListener("error", handleError);
          resolve();
        };

        const handleError = () => {
          clearTimeout(timeoutId);
          audio.removeEventListener("loadedmetadata", handleLoad);
          reject(new Error("无法加载音频文件"));
        };

        audio.addEventListener("loadedmetadata", handleLoad);
        audio.addEventListener("error", handleError);
      });

      musicList.value.push({
        name: file.name.replace(/\.[^/.]+$/, ""), // 移除扩展名
        path: file.path || file.webkitRelativePath || file.name,
        url,
        format: file.name.substring(file.name.lastIndexOf(".")).toLowerCase(),
        duration: audio.duration,
      });
    } catch (error) {
      console.warn(`跳过文件 ${file.name}:`, error);
      if (url) {
        URL.revokeObjectURL(url);
      }
    }
  }

  // 显示支持的格式统计
  const formatCounts = musicList.value.reduce((acc, music) => {
    acc[music.format] = (acc[music.format] || 0) + 1;
    return acc;
  }, {});

  const formatStats = Object.entries(formatCounts)
    .map(([format, count]) => `${format.toUpperCase()}: ${count}`)
    .join(", ");

  if (musicList.value.length > 0) {
    ElMessage.success(
      `已加载 ${musicList.value.length} 个音频文件（${formatStats}）`
    );
  } else {
    ElMessage.error("没有可播放的音频文件");
  }

  // 重置文件输入框，这样可以重新选择相同的文件
  event.target.value = "";
};

const handleTimeUpdate = () => {
  if (audioPlayer.value) {
    currentTime.value = audioPlayer.value.currentTime || 0;
  }
};

const handleLoadedMetadata = () => {
  if (audioPlayer.value) {
    duration.value = audioPlayer.value.duration || 0;
  }
};

const handleEnded = () => {
  if (repeatMode.value === "one") {
    audioPlayer.value.currentTime = 0;
    audioPlayer.value.play();
  } else if (repeatMode.value === "all") {
    if (hasNext.value) {
      nextTrack();
    } else {
      // 播放第一首
      playMusic(musicList.value[0]);
    }
  } else if (hasNext.value) {
    nextTrack();
  }
};

const handleSeek = (value) => {
  if (audioPlayer.value) {
    audioPlayer.value.currentTime = value;
  }
};

const formatTime = (seconds) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const previousTrack = () => {
  if (hasPrevious.value) {
    playMusic(musicList.value[currentIndex.value - 1]);
  }
};

const nextTrack = () => {
  if (!musicList.value.length) return;

  if (isShuffleMode.value) {
    const currentIndex = musicList.value.findIndex(
      (m) => m.path === currentPlaying.value?.path
    );
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * musicList.value.length);
    } while (nextIndex === currentIndex && musicList.value.length > 1);

    playMusic(musicList.value[nextIndex]);
  } else if (hasNext.value) {
    playMusic(musicList.value[currentIndex.value + 1]);
  }
};

const playMusic = async (music) => {
  if (!audioPlayer.value) return;

  try {
    if (currentPlaying.value?.path === music.path) {
      togglePlay();
      return;
    }

    // 停止当前播放
    if (isPlaying.value) {
      audioPlayer.value.pause();
      isPlaying.value = false;
    }

    // 设置新的音乐
    currentPlaying.value = music;
    audioPlayer.value.src = music.url;

    // 设置音量
    audioPlayer.value.volume = volume.value / 100;

    try {
      await audioPlayer.value.play();
      isPlaying.value = true;
      if (music.source === "alist") {
        return;
      }
      // 初始化音频可视化
      if (!analyser) {
        initAudioContext();
        setupAudioVisualization();
      }
      startVisualization();
    } catch (error) {
      console.error("播放失败:", error);
      isPlaying.value = false;

      if (error.name === "NotAllowedError") {
        ElMessage.warning("需要用户交互才能播放音频");
      } else if (error.name === "NotSupportedError") {
        ElMessage.error("不支持的音频格式");
        // 从播放列表中移除不支持的文件
        const index = musicList.value.findIndex((m) => m.path === music.path);
        if (index !== -1) {
          removeFromPlaylist(index);
        }
      } else {
        ElMessage.error("播放失败，请重试");
      }
    }
  } catch (error) {
    console.error("播放失败:", error);
    ElMessage.error("播放失败，请重试");
  }
};

const togglePlay = async () => {
  if (!audioPlayer.value || !currentPlaying.value) return;

  try {
    if (isPlaying.value) {
      await audioPlayer.value.pause();
      isPlaying.value = false;
      stopVisualization();
    } else {
      try {
        await audioPlayer.value.play();
        isPlaying.value = true;
        startVisualization();
      } catch (error) {
        console.error("播放失败:", error);
        isPlaying.value = false;
        if (error.name !== "NotAllowedError") {
          ElMessage.error("播放失败，请重试");
        }
      }
    }
  } catch (error) {
    console.error("切换播放状态出错:", error);
    isPlaying.value = false;
    ElMessage.error("操作失败，请重试");
  }
};

const startVisualization = () => {
  if (audioContext?.state === "suspended") {
    audioContext.resume();
  }
  drawWaveform();
};

const stopVisualization = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
};

const toggleShuffle = () => {
  isShuffleMode.value = !isShuffleMode.value;
  ElMessage.success(`${isShuffleMode.value ? "已开启" : "已关闭"}随机播放`);
};

const toggleRepeatMode = () => {
  const modes = ["none", "all", "one"];
  const currentIndex = modes.indexOf(repeatMode.value);
  repeatMode.value = modes[(currentIndex + 1) % modes.length];

  const messages = {
    none: "关闭循环",
    all: "列表循环",
    one: "单曲循环",
  };
  ElMessage.success(messages[repeatMode.value]);
};

const removeFromPlaylist = (index) => {
  const music = musicList.value[index];

  // 如果删除的是当前播放的歌曲，先切换到下一首
  if (currentPlaying.value?.path === music.path) {
    if (musicList.value.length > 1) {
      nextTrack();
    } else {
      currentPlaying.value = null;
      isPlaying.value = false;
      audioPlayer.value.pause();
    }
  }

  // 释放文件 URL
  if (music.url) {
    URL.revokeObjectURL(music.url);
  }

  musicList.value.splice(index, 1);
  ElMessage.success("已从播放列表中移除");
};

const searchQuery = ref("");
const isShuffleMode = ref(false);
const repeatMode = ref("none"); // 'none' | 'all' | 'one'
// Alist音乐相关
const isLoadingAlist = ref(false);

// 获取Alist音乐列表
const fetchAlistMusic = async () => {
  isLoadingAlist.value = true;

  try {
    // 获取Alist源列表
    const { data: alistData } = await $fetch(
      "https://alist.aipan.me/api/fs/list",
      {
        query: {
          page: 1,
          per_page: 0,
          path: "/tianyi/music/DJ（280 首无损）/无损音乐1",
        },
      }
    );
    console.log(alistData);
    if (alistData?.content && alistData?.content?.length > 0) {
      // 过滤出音乐文件
      const musicFiles = alistData.content.filter(
        (file) =>
          file.is_dir === false && /\.(mp3|wav|ogg|m4a|flac)$/i.test(file.name)
      );

      // 转换为播放器可用的格式
      const musicItems = musicFiles.map((file) => ({
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        path: file.name,
        url: `https://alist.aipan.me/d/tianyi/music/DJ（280 首无损）/无损音乐1/${file.name}?sign=${file.sign}`,
        format: file.name.substring(file.name.lastIndexOf(".")).toLowerCase(),
        duration: 0, // We can't get duration without loading the file
        source: "alist",
      }));

      // Add to playlist
      musicList.value.push(...musicItems);

      // Display format statistics
      const formatCounts = musicItems.reduce((acc, music) => {
        acc[music.format] = (acc[music.format] || 0) + 1;
        return acc;
      }, {});

      const formatStats = Object.entries(formatCounts)
        .map(([format, count]) => `${format.toUpperCase()}: ${count}`)
        .join(", ");

      ElMessage.success(
        `已加载 ${musicItems.length} 个音频文件（${formatStats}）`
      );
    }
  } catch (error) {
    console.error("获取Alist列表失败:", error);
    ElMessage.error("获取Alist音乐失败，请稍后重试");
  } finally {
    isLoadingAlist.value = false;
  }
};
// 在组件挂载时获取Alist音乐
onMounted(() => {
  fetchAlistMusic();
});
onMounted(() => {
  if (waveformCanvas.value) {
    const canvas = waveformCanvas.value;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;

    initAudioContext();

    window.addEventListener("resize", () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    });
  }

  if (circularCanvas.value) {
    const canvas = circularCanvas.value;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  }
});

// 播放状态变化处理
const handlePlay = () => {
  isPlaying.value = true;
  startVisualization();
};

const handlePause = () => {
  isPlaying.value = false;
  stopVisualization();
};

onUnmounted(() => {
  stopVisualization();
  if (audioContext) {
    audioContext.close();
  }
  musicList.value.forEach((music) => {
    if (music.url) {
      URL.revokeObjectURL(music.url);
    }
  });
});
</script>

<style lang="scss">
.music-playlist {
  .el-drawer__body {
    padding: 0;
    overflow: hidden;
  }

  .el-input__wrapper {
    background-color: #1f2937 !important;
    box-shadow: none !important;
    border: 1px solid #374151;
  }

  .el-input__inner {
    color: white !important;
  }

  .el-input__prefix-icon {
    color: #9ca3af !important;
  }
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #4b5563 transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #4b5563;
    border-radius: 3px;
  }
}
</style>
