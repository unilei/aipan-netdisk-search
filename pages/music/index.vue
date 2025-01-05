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


// Add transition classes
const searchInputClass = computed(() => {
  return `w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all duration-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:focus:ring-gray-400 dark:focus:border-gray-500 ${searchLoading.value ? 'opacity-50' : ''}`;
});

const searchButtonClass = computed(() => {
  return `bg-gray-900 text-white p-3 rounded-lg hover:bg-gray-800 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-600 dark:hover:bg-gray-500`;
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
    return res.url;
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
  let downloadUrl = await kwGetUrl(song.id);
  if (downloadUrl) {
    window.open(downloadUrl, "_blank");
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
const handleCopySongUrl = async (song) => {
  try {
    if (isDownloading.value) return;
    isDownloading.value = true;
    downloadProgress.value = 0;

    // 获取文件扩展名
    const extension = quality.value === 'standard' || quality.value === 'exhigh' ? 'mp3' : 'flac';
    const fileName = `${song.name} - ${song.artist}.${extension}`;

    // 使用新的下载接口
    const downloadUrl = `/api/music/kw-download?id=${song.id}&quality=${quality.value}&filename=${encodeURIComponent(fileName)}`;

    // 使用fetch获取文件
    const response = await fetch(downloadUrl);
    const reader = response.body.getReader();
    const contentLength = +response.headers.get('Content-Length');

    // 读取数据流
    let receivedLength = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      // 更新进度
      downloadProgress.value = (receivedLength / contentLength) * 100;
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

// 添加一个新的函数用于复制下载链接
const handleCopyUrl = async (song) => {
  let downloadUrl = await kwGetUrl(song.id);
  if (!downloadUrl) return;

  try {
    await navigator.clipboard.writeText(downloadUrl);
    copyTipsMsg("success");
    setTimeout(() => {
      copyTipsMsg("reset");
    }, 3000);
  } catch (error) {
    copyTipsMsg("fail");
    setTimeout(() => {
      copyTipsMsg("reset");
    }, 3000);
  }
};

// 添加下载进度状态
const downloadProgress = ref(0);
const isDownloading = ref(false);

</script>
<template>
  <div class="bg-gray-50 dark:bg-gray-900">
    <div class="max-w-2xl min-h-screen mx-auto p-[20px] ">
    <!-- Header -->
    <div class="flex flex-row items-center justify-center gap-3 mb-8">
      <a href="/" class="transition-transform duration-200 hover:scale-110">
        <img class="w-[40px] h-[40px] sm:w-[40px] sm:h-[40px]" src="@/assets/my-logo.png" alt="logo" />
      </a>
      <h1 class="text-[18px] sm:text-[22px] font-serif font-bold dark:text-white">
        爱盼-音乐搜索下载
      </h1>
    </div>

    <!-- Search Section -->
    <div class="flex flex-col sm:flex-row items-center justify-center gap-2 mb-8">
      <div class="relative w-full">
        <input :class="searchInputClass" type="text" v-model="keyword" placeholder="搜索你喜欢的音乐..."
          @keydown.enter="handleSearch()" :disabled="searchLoading" />
        <button :class="searchButtonClass" @click="handleSearch()" :disabled="searchLoading || !keyword.trim()"
          class="absolute right-2 top-1/2 -translate-y-1/2">
          <span v-if="!searchLoading">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <span v-else>
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
          </span>
        </button>
      </div>
    </div>

    <!-- Results Section -->
    <div class="space-y-2" v-if="kwData && kwData.length > 0">
      <div class="flex flex-row gap-2 items-center justify-between p-2 border-b border-gray-300 dark:border-gray-700">
        <h2 class="text-xl font-bold dark:text-white">搜索结果</h2>
        <div class="space-x-2">
          <button
            class="text-gray-900 text-sm hover:text-gray-600 transition-colors duration-200 disabled:opacity-50 dark:text-gray-200 dark:hover:text-gray-400 dark:disabled:text-gray-600"
            @click="handlePrevPage()" :disabled="page === 1">
            上一页
          </button>
          <span class="text-sm text-gray-600 dark:text-gray-400">第 {{ page }} 页</span>
          <button class="text-gray-900 text-sm hover:text-gray-600 transition-colors duration-200 dark:text-gray-200 dark:hover:text-gray-400"
            @click="handleNextPage()">
            下一页
          </button>
        </div>
      </div>

      <div v-if="searchLoading" class="flex items-center justify-center p-8">
        <div class="text-purple-500 dark:text-purple-400 flex items-center gap-2">
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          爱盼，正在努力搜索中...
        </div>
      </div>

      <ul class="space-y-2" v-else>
        <li v-for="(item, index) in kwData" :key="index"
          class="flex flex-row justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 dark:border dark:border-gray-700">
          <div class="flex-1 min-w-0">
            <p class="text-md font-bold truncate dark:text-white" v-html="item.name"></p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ item.album }} - {{ item.artist }}
            </p>
          </div>
          <button
            class="ml-4 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm dark:bg-gray-600 dark:hover:bg-gray-500"
            @click="handleDownloadVisible(item)">
            下载
          </button>
        </li>
      </ul>
    </div>

    <p class="mt-4 text-xs text-red-500 dark:text-red-400 text-center">
      仅供个人学习使用，禁止商业用途，否则后果自负
    </p>

    <!-- Download Modal -->
    <Transition name="modal">
      <div v-if="downloadVisible"
        class="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        @click="downloadVisible = false">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full space-y-4 relative dark:border dark:border-gray-700" @click.stop>
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
                class="p-3 rounded-lg border transition-all duration-200 text-left" :class="quality === key
                  ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-500 dark:bg-gray-600'
                  : 'border-gray-200 hover:border-gray-400 dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500'"
                @click="quality = key">
                <span class="block font-medium">{{ key === 'lossless' ? '无损音质' : key === 'exhigh' ? '高品质' : key ===
                  'standard' ? '标准音质' : 'Hi-Res' }}</span>
                <span class="text-xs opacity-80">{{ opt.size }}</span>
              </button>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              class="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm dark:bg-gray-600 dark:hover:bg-gray-500"
              @click="handleCopySongName(currentDownloadSong)">
              复制歌曲名字
            </button>
            <button
              class="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm dark:bg-gray-600 dark:hover:bg-gray-500"
              :disabled="isDownloading" @click="handleCopySongUrl(currentDownloadSong)">
              <span v-if="!isDownloading">下载歌曲</span>
              <span v-else>下载中 {{ Math.round(downloadProgress) }}%</span>
            </button>
          </div>

          <!-- 复制下载链接按钮 -->
          <button
            class="w-full bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            @click="handleCopyUrl(currentDownloadSong)">
            复制下载链接
          </button>

          <!-- 下载进度条 -->
          <div v-if="isDownloading" class="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
            <div class="bg-gray-900 h-1.5 rounded-full dark:bg-gray-300 transition-all duration-300"
              :style="{ width: downloadProgress + '%' }">
            </div>
          </div>

          <Transition name="fade">
            <p v-if="tips" class="text-sm text-center" :class="tips.includes('成功') ? 'text-green-500' : 'text-red-500'">
              {{ tips }}
            </p>
          </Transition>
        </div>
      </div>
    </Transition>
  </div>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
