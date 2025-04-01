<script setup>
definePageMeta({
  layout: "custom",
  middleware: ["music-auth"]
});
const keyword = ref("周杰伦");
const page = ref(1);
const quality = ref("lossless");
const kwData = ref([]);
const isInitialLoad = ref(true);

// Player state
const currentPlayingSong = ref(null);
const audioUrl = ref('');
const isPlaying = ref(false);
const audioElement = ref(null);
const showPlayer = ref(false);
const showPlaylist = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const playlist = ref([]);

// 歌单功能
const playlists = ref([]);
const showPlaylistManager = ref(false);
const newPlaylistName = ref('');
const currentPlaylistIndex = ref(0);
const showAddToPlaylistModal = ref(false);
const songToAddToPlaylist = ref(null);

// 从localStorage加载歌单
const loadPlaylists = () => {
  const savedPlaylists = localStorage.getItem('aipan-playlists');
  if (savedPlaylists) {
    try {
      playlists.value = JSON.parse(savedPlaylists);
    } catch (error) {
      console.error('Failed to parse playlists:', error);
      playlists.value = [{ name: '我喜欢的音乐', songs: [] }];
    }
  } else {
    // 初始化一个默认歌单
    playlists.value = [{ name: '我喜欢的音乐', songs: [] }];
  }
};

// 保存歌单到localStorage
const savePlaylists = () => {
  localStorage.setItem('aipan-playlists', JSON.stringify(playlists.value));
};

// 创建新歌单
const createPlaylist = () => {
  if (!newPlaylistName.value.trim()) return;

  playlists.value.push({
    name: newPlaylistName.value,
    songs: []
  });

  savePlaylists();
  newPlaylistName.value = '';
};

// 删除歌单
const deletePlaylist = (index) => {
  if (confirm(`确定要删除歌单"${playlists.value[index].name}"吗?`)) {
    playlists.value.splice(index, 1);
    savePlaylists();

    // 如果没有歌单了，创建一个默认的
    if (playlists.value.length === 0) {
      playlists.value = [{ name: '我喜欢的音乐', songs: [] }];
      savePlaylists();
    }

    // 如果删除的是当前选中的歌单，重置索引
    if (currentPlaylistIndex.value >= playlists.value.length) {
      currentPlaylistIndex.value = playlists.value.length - 1;
    }
  }
};

// 打开添加到歌单模态框
const openAddToPlaylistModal = (song) => {
  songToAddToPlaylist.value = song;
  showAddToPlaylistModal.value = true;
};

// 添加歌曲到歌单
const addSongToPlaylist = (playlistIndex) => {
  const song = songToAddToPlaylist.value;
  if (!song) return;

  // 检查歌曲是否已经在歌单中
  const alreadyExists = playlists.value[playlistIndex].songs.some(s => s.id === song.id);

  if (!alreadyExists) {
    playlists.value[playlistIndex].songs.push(song);
    savePlaylists();
    tips.value = `已添加到歌单: ${playlists.value[playlistIndex].name}`;
  } else {
    tips.value = "歌曲已在歌单中";
  }

  setTimeout(() => {
    copyTipsMsg("reset");
  }, 1500);

  showAddToPlaylistModal.value = false;
};

// 从歌单中移除歌曲
const removeSongFromPlaylist = (playlistIndex, songIndex) => {
  playlists.value[playlistIndex].songs.splice(songIndex, 1);
  savePlaylists();
};

// 播放歌单中的所有歌曲
const playEntirePlaylist = (playlistIndex) => {
  const songs = playlists.value[playlistIndex].songs;
  if (songs.length === 0) return;

  // 清空当前播放列表
  playlist.value = [...songs];

  // 播放第一首歌
  handlePlay(songs[0]);
};

// Add transition classes
const searchInputClass = computed(() => {
  return `w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:focus:ring-indigo-400 dark:focus:border-indigo-500 ${searchLoading.value ? 'opacity-50' : ''}`;
});

const searchButtonClass = computed(() => {
  return `bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-700 dark:hover:bg-indigo-600`;
});

const kwSearch = async () => {
  searchLoading.value = true;
  const res = await $fetch("/api/music/kw-search", {
    method: "GET",
    query: {
      keyword: keyword.value,
      page: page.value,
    },
  });

  kwData.value = res.data;
  searchLoading.value = false;
};

const kwGetUrl = async (id) => {
  const res = await $fetch("/api/music/kw-url", {
    method: "GET",
    query: {
      id: id,
      quality: quality.value,
    },
  });
  if (res.msg === "success") {
    // 使用代理URL而不是直接使用HTTP链接
    // 这样可以通过我们的服务器代理这个请求，避免浏览器混合内容限制
    return `/api/music/proxy-stream?url=${encodeURIComponent(res.url)}`;
  } else {
    return alert("获取链接失败, 请重试");
  }
};
const searchLoading = ref(false);
const handleSearch = () => {
  page.value = 1;
  kwData.value = [];
  kwSearch();
};
const handleNextPage = () => {
  page.value++;
  kwSearch();
};
const handlePrevPage = () => {
  if (page.value > 1) {
    page.value--;
    kwSearch();
  }
};
const handleDownload = async (song) => {
  let proxyUrl = await kwGetUrl(song.id);
  if (proxyUrl) {
    window.open(proxyUrl, "_blank");
  }
};
const downloadVisible = ref(false);
const currentDownloadSong = ref({});
const handleDownloadVisible = (song) => {
  currentDownloadSong.value = {
    ...song
  };
  downloadVisible.value = !downloadVisible.value;
};

const tips = ref("");
const copyTipsMsg = (type) => {
  if (type === "success") {
    tips.value = "复制成功";
  }
  if (type === "fail") {
    tips.value = "复制失败";
  }
  if (type === "reset") {
    tips.value = "";
  }
};
const handleCopySongName = (song) => {
  navigator.clipboard.writeText(song.name + " - " + song.artist);
  copyTipsMsg("success");
  setTimeout(() => {
    copyTipsMsg("reset");
  }, 3000);
};
const handleCopyUrl = async (song) => {
  let originalUrl = await kwGetUrl(song.id);
  if (!originalUrl) return;

  try {
    // 由于我们现在使用代理，复制直接链接对用户更有用
    // 获取原始URL而不是代理URL
    const res = await $fetch("/api/music/kw-url", {
      method: "GET",
      query: {
        id: song.id,
        quality: quality.value,
      },
    });

    if (res.msg === "success") {
      await navigator.clipboard.writeText(res.url);
      copyTipsMsg("success");
      setTimeout(() => {
        copyTipsMsg("reset");
      }, 3000);
    } else {
      copyTipsMsg("fail");
      setTimeout(() => {
        copyTipsMsg("reset");
      }, 3000);
    }
  } catch (error) {
    copyTipsMsg("fail");
    setTimeout(() => {
      copyTipsMsg("reset");
    }, 3000);
  }
};

const handleCopySongUrl = async (song) => {
  try {
    if (isDownloading.value) return;
    isDownloading.value = true;
    downloadProgress.value = 0;

    // 获取文件扩展名
    const extension = quality.value === 'standard' || quality.value === 'exhigh' ? 'mp3' : 'flac';
    const fileName = `${song.name} - ${song.artist}.${extension}`;

    // 获取音乐URL (使用代理URL)
    const downloadUrl = await kwGetUrl(song.id);
    if (!downloadUrl) {
      isDownloading.value = false;
      return;
    }

    // 使用fetch获取文件
    const response = await fetch(downloadUrl);
    const reader = response.body.getReader();
    const contentLength = +response.headers.get('Content-Length') || 0;

    // 读取数据流
    let receivedLength = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      // 更新进度
      if (contentLength > 0) {
        downloadProgress.value = (receivedLength / contentLength) * 100;
      } else {
        // 如果没有contentLength，显示不确定进度
        downloadProgress.value = 50;
      }
    }

    // 合并数据块并下载
    const blob = new Blob(chunks);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    copyTipsMsg("success");
    setTimeout(() => {
      copyTipsMsg("reset");
    }, 3000);
  } catch (error) {
    console.error('Download error:', error);
    copyTipsMsg("fail");
    setTimeout(() => {
      copyTipsMsg("reset");
    }, 3000);
  } finally {
    isDownloading.value = false;
    downloadProgress.value = 0;
  }
};

// 播放功能
const handlePlay = async (song) => {
  // 如果是同一首歌，直接切换播放状态
  if (currentPlayingSong.value && currentPlayingSong.value.id === song.id) {
    togglePlay();
    return;
  }

  // 更新当前歌曲，重置播放时间
  currentPlayingSong.value = song;
  showPlayer.value = true;
  isPlaying.value = false;
  resetPlayTimeCounter();

  // 如果歌曲不在播放列表中，添加到播放列表
  if (!playlist.value.some(item => item.id === song.id)) {
    playlist.value.push(song);
  }

  // 获取歌曲URL
  const url = await kwGetUrl(song.id);
  if (!url) return;

  audioUrl.value = url;

  // 等待DOM更新后处理播放
  nextTick(() => {
    if (audioElement.value) {
      audioElement.value.load();
      audioElement.value.play().then(() => {
        isPlaying.value = true;
        startPlayTimeCounter();
      }).catch(err => {
        console.error('播放失败:', err);
      });
    }
  });
};

// 添加到播放列表而不播放
const addToPlaylist = (song) => {
  if (!playlist.value.some(item => item.id === song.id)) {
    playlist.value.push(song);
    // 如果播放列表为空，显示一个短暂提示
    if (playlist.value.length === 1) {
      copyTipsMsg("success");
      setTimeout(() => {
        copyTipsMsg("reset");
      }, 1500);
    }
  } else {
    // 如果歌曲已经在播放列表中，显示一个短暂提示
    tips.value = "歌曲已在播放列表中";
    setTimeout(() => {
      copyTipsMsg("reset");
    }, 1500);
  }
};

const togglePlay = () => {
  if (!audioElement.value) return;

  if (isPlaying.value) {
    audioElement.value.pause();
    stopPlayTimeCounter();
  } else {
    audioElement.value.play().then(() => {
      startPlayTimeCounter();
    }).catch(err => console.error('播放失败:', err));
  }

  isPlaying.value = !isPlaying.value;
};

const closePlayer = () => {
  if (audioElement.value) {
    audioElement.value.pause();
  }
  isPlaying.value = false;
  showPlayer.value = false;
  currentPlayingSong.value = null;
  resetPlayTimeCounter();
};

// 添加播放列表管理
const togglePlaylist = () => {
  showPlaylist.value = !showPlaylist.value;
};

const playNextSong = async () => {
  if (!currentPlayingSong.value || playlist.value.length <= 1) return;

  const currentIndex = playlist.value.findIndex(song => song.id === currentPlayingSong.value.id);
  if (currentIndex === -1) return;

  const nextIndex = (currentIndex + 1) % playlist.value.length;
  await handlePlay(playlist.value[nextIndex]);
};

const playPrevSong = async () => {
  if (!currentPlayingSong.value || playlist.value.length <= 1) return;

  const currentIndex = playlist.value.findIndex(song => song.id === currentPlayingSong.value.id);
  if (currentIndex === -1) return;

  const prevIndex = (currentIndex - 1 + playlist.value.length) % playlist.value.length;
  await handlePlay(playlist.value[prevIndex]);
};

const removeFromPlaylist = (index) => {
  // 如果移除的是当前播放的歌曲，先处理
  if (playlist.value[index].id === currentPlayingSong.value?.id) {
    if (playlist.value.length > 1) {
      const nextIndex = index < playlist.value.length - 1 ? index : 0;
      handlePlay(playlist.value[nextIndex === index ? 0 : nextIndex]);
    } else {
      closePlayer();
    }
  }

  playlist.value.splice(index, 1);

  // 如果播放列表为空，关闭播放器
  if (playlist.value.length === 0) {
    closePlayer();
    showPlaylist.value = false;
  }
};

const clearPlaylist = () => {
  playlist.value = [];
  closePlayer();
  showPlaylist.value = false;
};

// 进度条控制
const updateProgress = () => {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime;
    duration.value = audioElement.value.duration || 0;
  }
};

const seekTo = (event) => {
  if (!audioElement.value || !duration.value) return;

  const progressBar = event.currentTarget;
  const rect = progressBar.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const percentage = offsetX / rect.width;

  audioElement.value.currentTime = percentage * duration.value;
  currentTime.value = audioElement.value.currentTime;
};

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

onMounted(() => {
  // 加载歌单
  loadPlaylists();

  if (audioElement.value) {
    audioElement.value.addEventListener('ended', () => {
      isPlaying.value = false;
      stopPlayTimeCounter();
      // 自动播放下一首
      playNextSong();
    });

    audioElement.value.addEventListener('timeupdate', updateProgress);
    audioElement.value.addEventListener('loadedmetadata', () => {
      // 当音频元数据加载完成后，更新持续时间
      duration.value = audioElement.value.duration;
    });
  }

  // 点击其他区域关闭播放质量选项
  const handleDocumentClick = (e) => {
    // 使用复杂选择器确保正确识别质量选择器元素
    const qualitySelector = document.querySelector('.quality-selector');
    if (showQualityOptions.value && qualitySelector && !qualitySelector.contains(e.target)) {
      showQualityOptions.value = false;
    }
  };

  document.addEventListener('click', handleDocumentClick);

  // 存储引用以便后续清理
  document.qualityClickHandler = handleDocumentClick;
});

onBeforeUnmount(() => {
  if (audioElement.value) {
    audioElement.value.removeEventListener('ended', () => {
      isPlaying.value = false;
    });

    audioElement.value.removeEventListener('timeupdate', updateProgress);
    audioElement.value.removeEventListener('loadedmetadata', () => { });
  }

  // 清理播放时间计时器
  stopPlayTimeCounter();

  // 移除文档点击事件
  if (document.qualityClickHandler) {
    document.removeEventListener('click', document.qualityClickHandler);
    delete document.qualityClickHandler;
  }
});

// 添加下载进度状态
const downloadProgress = ref(0);
const isDownloading = ref(false);

// 播放质量选择
const showQualityOptions = ref(false);
const changePlayQuality = async (newQuality) => {
  quality.value = newQuality;
  showQualityOptions.value = false;

  // 如果当前有歌曲在播放，需要重新获取URL并更新播放
  if (currentPlayingSong.value) {
    const currentTime = audioElement.value?.currentTime || 0;
    const wasPlaying = isPlaying.value;

    // 获取新质量的URL
    const url = await kwGetUrl(currentPlayingSong.value.id);
    if (!url) return;

    audioUrl.value = url;

    // 等待DOM更新
    nextTick(() => {
      if (audioElement.value) {
        audioElement.value.load();
        audioElement.value.currentTime = currentTime;

        if (wasPlaying) {
          audioElement.value.play().catch(err => {
            console.error('播放失败:', err);
          });
        }
      }
    });
  }
};

// 播放时间
const playTimeSeconds = ref(0);
const playStartTime = ref(null);
const playTimeInterval = ref(null);

const startPlayTimeCounter = () => {
  // 清除可能存在的旧计时器
  if (playTimeInterval.value) {
    clearInterval(playTimeInterval.value);
  }

  // 设置开始时间
  playStartTime.value = new Date();

  // 每秒更新播放时间
  playTimeInterval.value = setInterval(() => {
    if (isPlaying.value) {
      const currentTime = new Date();
      const elapsedTimeInSeconds = Math.floor((currentTime - playStartTime.value) / 1000);
      playTimeSeconds.value += 1;
    }
  }, 1000);
};

const stopPlayTimeCounter = () => {
  if (playTimeInterval.value) {
    clearInterval(playTimeInterval.value);
    playTimeInterval.value = null;
  }
};

const resetPlayTimeCounter = () => {
  stopPlayTimeCounter();
  playTimeSeconds.value = 0;
  playStartTime.value = null;
};

const formatPlayTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
</script>
<template>
  <div class="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
    <div class="max-w-3xl mx-auto p-[20px]">
      <!-- Header -->
      <div class="flex flex-col items-center justify-center gap-3 mb-10">
        <div class="flex items-center gap-3 mb-2">
          <a href="/" class="transition-transform duration-200 hover:scale-110">
            <img class="w-[50px] h-[50px]" src="@/assets/my-logo.png" alt="logo" />
          </a>
          <h1
            class="text-[24px] sm:text-[28px] font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            爱盼音乐
          </h1>
        </div>
        <p class="text-gray-500 dark:text-gray-400 text-sm max-w-lg text-center">
          高品质音乐搜索与播放平台，支持无损音质、歌单收藏和在线播放
        </p>
      </div>

      <!-- Control Bar -->
      <div class="flex flex-row items-center justify-between gap-3 mb-8">
        <!-- Search Section -->
        <div class="relative flex-1">
          <div class="flex items-center w-full">
            <div class="relative flex-1">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                class="w-full border border-gray-300 px-4 py-3 pl-12 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:focus:ring-indigo-400 dark:focus:border-indigo-500"
                :class="searchLoading ? 'opacity-50' : ''" type="text" v-model="keyword" placeholder="搜索你喜欢的音乐..."
                @keydown.enter="handleSearch()" :disabled="searchLoading" />
            </div>
            <button
              class="bg-indigo-600 text-white px-4 py-3 rounded-r-lg hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-700 dark:hover:bg-indigo-600"
              @click="handleSearch()" :disabled="searchLoading || !keyword.trim()">
              <span v-if="!searchLoading">
                搜索
              </span>
              <span v-else class="flex items-center">
                <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                搜索中
              </span>
            </button>
          </div>
        </div>

        <!-- 歌单按钮 -->
        <button @click="showPlaylistManager = true"
          class="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-3 rounded-lg hover:bg-indigo-200 transition-all text-sm dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-800/70 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          我的歌单
        </button>
      </div>

      <!-- Results Section -->
      <div class="space-y-4" v-if="kwData && kwData.length > 0">
        <div class="flex flex-row gap-2 items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            搜索结果
          </h2>
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button class="px-3 py-1.5 rounded-md text-sm transition-colors duration-200 disabled:opacity-50"
              :class="page === 1 ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'"
              @click="handlePrevPage()" :disabled="page === 1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span class="text-sm font-medium px-2 text-gray-700 dark:text-gray-300">{{ page }}</span>
            <button
              class="px-3 py-1.5 rounded-md text-sm text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-200"
              @click="handleNextPage()">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="searchLoading" class="flex items-center justify-center p-8">
          <div class="text-indigo-500 dark:text-indigo-400 flex items-center gap-2">
            <svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            <span class="text-lg font-medium">搜索中，请稍候...</span>
          </div>
        </div>

        <ul class="space-y-2" v-else>
          <li v-for="(item, index) in kwData" :key="index"
            class="flex flex-row justify-between items-center p-4 bg-white rounded-xl hover:shadow-md transition-all duration-200 dark:bg-gray-800/70 dark:hover:bg-gray-800 dark:border dark:border-gray-700">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {{ index + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-md font-bold truncate text-gray-800 dark:text-white" v-html="item.name"></p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ item.album }} - {{ item.artist }}
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <!-- 播放按钮 -->
              <button
                class="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-200 transition-all duration-200 text-sm dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-800/70"
                @click="handlePlay(item)">
                <span v-if="currentPlayingSong && currentPlayingSong.id === item.id && isPlaying">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span v-else>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </button>

              <!-- 添加到播放列表按钮 -->
              <button
                class="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-all duration-200 text-sm dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                @click="addToPlaylist(item)" :disabled="playlist.some(song => song.id === item.id)">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>

              <!-- 添加到歌单按钮 -->
              <button
                class="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-all duration-200 text-sm dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                @click="openAddToPlaylistModal(item)">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              <!-- 下载按钮 -->
              <button
                class="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm dark:bg-indigo-700 dark:hover:bg-indigo-600"
                @click="handleDownloadVisible(item)">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </li>
        </ul>
      </div>

      <div v-else-if="!searchLoading"
        class="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <p class="text-lg">搜索您喜欢的音乐开始体验</p>
        <p class="text-sm mt-2">支持音乐名称、歌手、专辑搜索</p>
      </div>

      <p class="my-8 text-xs text-red-500 dark:text-red-400 text-center">
        仅供个人学习使用，禁止商业用途，否则后果自负
      </p>

      <!-- Show playlist button when it's not empty and player is not visible -->
      <div v-if="playlist.length > 0 && !showPlayer" class="fixed bottom-4 right-4 z-30">
        <button @click="togglePlaylist"
          class="bg-indigo-600 text-white p-3 rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-all duration-200 dark:bg-indigo-700 dark:hover:bg-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          <span
            class="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center">
            {{ playlist.length }}
          </span>
        </button>
      </div>

      <!-- Player Component -->
      <Transition name="slide-up">
        <div v-if="showPlayer && currentPlayingSong"
          class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
          <div class="max-w-3xl mx-auto">
            <!-- Progress bar -->
            <div class="h-1 bg-gray-200 dark:bg-gray-700 relative">
              <div class="h-1 bg-indigo-600 dark:bg-indigo-500 transition-all duration-100"
                :style="{ width: duration ? (currentTime / duration * 100) + '%' : '0%' }"></div>
              <div class="absolute inset-0 cursor-pointer" @click="seekTo"></div>
            </div>

            <!-- Player controls -->
            <div class="flex items-center justify-between p-4">
              <div class="flex items-center gap-4 flex-1 min-w-0 mr-4">
                <div
                  class="h-12 w-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <p class="font-bold text-sm truncate dark:text-white" v-html="currentPlayingSong.name"></p>
                    <div class="flex items-center gap-2">
                      <!-- 播放时间 -->
                      <span
                        class="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded px-1.5 py-0.5">
                        已播放: {{ formatPlayTime(playTimeSeconds) }}
                      </span>

                      <!-- 播放质量选择 -->
                      <div class="relative quality-selector z-30">
                        <button @click="showQualityOptions = !showQualityOptions"
                          class="text-xs flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all">
                          <span>{{ quality === 'lossless' ? '无损' : quality === 'exhigh' ? '高品质' : quality === 'standard'
                            ? '标准' : 'Hi-Res' }}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <!-- 质量选择下拉菜单 -->
                        <div v-if="showQualityOptions"
                          class="absolute bottom-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700 min-w-[100px]">
                          <div class="py-1">
                            <button @click="changePlayQuality('standard')"
                              class="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                              :class="quality === 'standard' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'">
                              标准音质
                            </button>
                            <button @click="changePlayQuality('exhigh')"
                              class="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                              :class="quality === 'exhigh' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'">
                              高品质
                            </button>
                            <button @click="changePlayQuality('lossless')"
                              class="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                              :class="quality === 'lossless' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'">
                              无损音质
                            </button>
                            <button @click="changePlayQuality('hires')"
                              class="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                              :class="quality === 'hires' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'">
                              Hi-Res
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
                    <p class="truncate">{{ currentPlayingSong.artist }} - {{ currentPlayingSong.album }}</p>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-4">
                <!-- Prev button -->
                <button @click="playPrevSong"
                  class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  :disabled="playlist.length <= 1" :class="playlist.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>

                <!-- Play/Pause button -->
                <button @click="togglePlay"
                  class="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-all duration-200 shadow-md dark:bg-indigo-700 dark:hover:bg-indigo-600">
                  <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6" />
                  </svg>
                </button>

                <!-- Next button -->
                <button @click="playNextSong"
                  class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  :disabled="playlist.length <= 1" :class="playlist.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>

                <!-- Playlist button -->
                <button @click="togglePlaylist"
                  class="relative text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <span v-if="playlist.length > 0"
                    class="absolute -top-1 -right-1 text-xs bg-indigo-600 text-white dark:bg-indigo-500 rounded-full h-4 w-4 flex items-center justify-center">
                    {{ playlist.length }}
                  </span>
                </button>

                <!-- Close button -->
                <button @click="closePlayer"
                  class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <audio ref="audioElement" :src="audioUrl" class="hidden" preload="metadata"></audio>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Notification Toast -->
      <Transition name="fade">
        <div v-if="tips"
          class="fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-white z-50"
          :class="tips.includes('成功') ? 'bg-green-500' : 'bg-red-500'">
          {{ tips }}
        </div>
      </Transition>

      <!-- Playlist Modal -->
      <Transition name="modal">
        <div v-if="showPlaylist && playlist.length > 0"
          class="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          @click="showPlaylist = false">
          <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full space-y-4 relative dark:border dark:border-gray-700 max-h-[70vh] overflow-hidden"
            @click.stop>
            <div class="p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div class="flex justify-between items-center">
                <h2 class="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  播放列表 ({{ playlist.length }})
                </h2>
                <div class="flex gap-2">
                  <button @click="clearPlaylist"
                    class="text-sm px-3 py-1.5 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-indigo-700 dark:text-indigo-300">
                    清空
                  </button>
                  <button @click="showPlaylist = false"
                    class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="overflow-y-auto max-h-[calc(70vh-80px)] px-5 py-2">
              <ul class="space-y-1">
                <li v-for="(song, index) in playlist" :key="index"
                  class="flex items-center justify-between p-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                  :class="currentPlayingSong && song.id === currentPlayingSong.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500' : ''">
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <button @click="handlePlay(song)"
                      class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                      :class="currentPlayingSong && song.id === currentPlayingSong.id && isPlaying ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'">
                      <svg v-if="currentPlayingSong && song.id === currentPlayingSong.id && isPlaying"
                        xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                    </button>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-sm truncate dark:text-white" v-html="song.name"></p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ song.artist }}</p>
                    </div>
                  </div>
                  <button @click="removeFromPlaylist(index)"
                    class="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 ml-2 p-1.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              </ul>
            </div>

            <!-- Empty state -->
            <div v-if="playlist.length === 0" class="flex flex-col items-center justify-center py-12 px-5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-indigo-200 dark:text-indigo-900 mb-4"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <p class="text-gray-500 dark:text-gray-400 text-center">播放列表为空，请添加歌曲</p>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Download Modal -->
      <Transition name="modal">
        <div v-if="downloadVisible"
          class="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          @click="downloadVisible = false">
          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full space-y-4 relative dark:border dark:border-gray-700"
            @click.stop>
            <button
              class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              @click="downloadVisible = false">
              ✕
            </button>

            <h2 class="text-xl font-bold dark:text-white" v-html="currentDownloadSong.name"></h2>

            <div class="space-y-3">
              <h3 class="text-sm font-bold dark:text-white">选择音质</h3>
              <div class="grid grid-cols-2 gap-3">
                <button v-for="(opt, key) in currentDownloadSong?.quality" :key="key"
                  class="p-3 rounded-lg border transition-all duration-200 text-left"
                  :class="quality === key
                    ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-600'
                    : 'border-gray-200 hover:border-indigo-400 dark:border-gray-700 dark:text-gray-200 dark:hover:border-indigo-500'" @click="quality = key">
                  <span class="block font-medium">{{ key === 'lossless' ? '无损音质' : key === 'exhigh' ? '高品质' : key ===
                    'standard' ? '标准音质' : 'Hi-Res' }}</span>
                  <span class="text-xs opacity-80">{{ opt.size }}</span>
                </button>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm dark:bg-indigo-700 dark:hover:bg-indigo-600"
                @click="handleCopySongName(currentDownloadSong)">
                复制歌曲名字
              </button>
              <button
                class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm dark:bg-indigo-700 dark:hover:bg-indigo-600"
                :disabled="isDownloading" @click="handleCopySongUrl(currentDownloadSong)">
                <span v-if="!isDownloading">下载歌曲</span>
                <span v-else>下载中 {{ Math.round(downloadProgress) }}%</span>
              </button>
            </div>

            <!-- 复制下载链接按钮 -->
            <button
              class="w-full bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-all duration-200 text-sm dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
              @click="handleCopyUrl(currentDownloadSong)">
              复制下载链接
            </button>

            <!-- 下载进度条 -->
            <div v-if="isDownloading" class="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
              <div class="bg-indigo-600 h-1.5 rounded-full dark:bg-indigo-500 transition-all duration-300"
                :style="{ width: downloadProgress + '%' }">
              </div>
            </div>

            <Transition name="fade">
              <p v-if="tips" class="text-sm text-center"
                :class="tips.includes('成功') ? 'text-green-500' : 'text-red-500'">
                {{ tips }}
              </p>
            </Transition>
          </div>
        </div>
      </Transition>

      <!-- 歌单管理器 Modal -->
      <Transition name="modal">
        <div v-if="showPlaylistManager"
          class="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          @click="showPlaylistManager = false">
          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full space-y-4 relative dark:border dark:border-gray-700 max-h-[80vh] overflow-auto"
            @click.stop>
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-bold dark:text-white">我的歌单</h2>
              <button @click="showPlaylistManager = false"
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                ✕
              </button>
            </div>

            <!-- 创建新歌单 -->
            <div class="flex gap-2">
              <input type="text" v-model="newPlaylistName" placeholder="新歌单名称"
                class="flex-1 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:focus:ring-indigo-400"
                @keydown.enter="createPlaylist" />
              <button @click="createPlaylist"
                class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-sm dark:bg-indigo-700 dark:hover:bg-indigo-600">
                创建
              </button>
            </div>

            <!-- 歌单列表 -->
            <div class="space-y-4">
              <div v-for="(list, listIndex) in playlists" :key="listIndex" class="space-y-2">
                <div class="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                  <h3 class="font-bold text-indigo-800 dark:text-indigo-300">{{ list.name }} ({{ list.songs.length }})
                  </h3>
                  <div class="flex gap-2">
                    <button @click="playEntirePlaylist(listIndex)"
                      class="text-indigo-600 dark:text-indigo-400 p-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
                      :disabled="list.songs.length === 0">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button @click="deletePlaylist(listIndex)"
                      class="text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div v-if="list.songs.length > 0" class="pl-3">
                  <ul class="space-y-2 max-h-40 overflow-y-auto">
                    <li v-for="(song, songIndex) in list.songs" :key="songIndex"
                      class="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors">
                      <div class="flex items-center gap-3 flex-1 min-w-0">
                        <button @click="handlePlay(song)" class="text-indigo-600 dark:text-indigo-400">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <div class="flex-1 min-w-0">
                          <p class="font-medium text-sm truncate dark:text-white" v-html="song.name"></p>
                          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ song.artist }}</p>
                        </div>
                      </div>
                      <button @click="removeSongFromPlaylist(listIndex, songIndex)"
                        class="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  </ul>
                </div>
                <div v-else class="text-gray-500 dark:text-gray-400 text-sm pl-3">歌单为空</div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 添加到歌单 Modal -->
      <Transition name="modal">
        <div v-if="showAddToPlaylistModal && songToAddToPlaylist"
          class="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          @click="showAddToPlaylistModal = false">
          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full space-y-4 relative dark:border dark:border-gray-700"
            @click.stop>
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-bold dark:text-white">添加到歌单</h2>
              <button @click="showAddToPlaylistModal = false"
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                ✕
              </button>
            </div>

            <div class="text-sm dark:text-white mb-2">
              <span v-html="songToAddToPlaylist.name"></span> - {{ songToAddToPlaylist.artist }}
            </div>

            <ul class="space-y-2">
              <li v-for="(list, index) in playlists" :key="index"
                class="p-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                @click="addSongToPlaylist(index)">
                <div class="font-medium dark:text-white">{{ list.name }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ list.songs.length }} 首歌曲</div>
              </li>
            </ul>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* 确保质量选择弹出层在最上方 */
.quality-selector {
  position: relative;
}

.quality-selector>div {
  z-index: 100 !important;
}

/* Custom scrollbar for webkit browsers */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.dark ::-webkit-scrollbar-thumb {
  background: #4b5563;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* For Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
}

.dark * {
  scrollbar-color: #4b5563 transparent;
}

/* Disabled button styles */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Button hover effects */
button:not(:disabled) {
  transform: translateY(0);
  transition: transform 0.2s, opacity 0.2s, background-color 0.2s;
}

button:not(:disabled):hover {
  transform: translateY(-1px);
}

button:not(:disabled):active {
  transform: translateY(0);
}
</style>
