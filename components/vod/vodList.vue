<script setup>
defineProps(['vodData'])

const currentVod = ref({
  url: '',
  name: ''
})
const checkIsM3u8 = (url) => {
  // 使用正则表达式检查URL是否以.m3u8结尾
  const isM3U8 = /\.m3u8$/.test(url);
  return isM3U8;
}

const formatVodPlayUrl = (vod) => {
  let inputString = vod.vod_play_url
  if (!inputString) {
    return ''
  }
  const matches = inputString.match(/#/g);
  let fragments = []

  if (matches && matches.length > 0) {
    console.log(`字符串中包含 ${matches.length} 个 # 作为分隔符`);
    fragments = inputString.split('#');
  } else {
    console.log("字符串中不包含 # 作为分隔符");
    fragments = inputString.split('$$$');
  }
  // 初始化一个数组来存储提取的信息
  const episodes = [];
  // 循环遍历每个片段
  for (let i = 0; i < fragments.length; i += 1) {
    const episodeInfo = fragments[i].split('$'); // 将每个片段按$分割成两部分
    if (episodeInfo.length === 2) {
      const episodeNumber = episodeInfo[0].trim();
      const episodeLink = episodeInfo[1].trim();
      if (episodeLink.length > 20) {
        episodes.push({ number: episodeNumber, link: episodeLink });
      }

    }
  }
  if (!currentVod.value.url && episodes.length > 0) {
    if (checkIsM3u8(episodes[0].link)) {
      currentVod.value = {
        url: `${vod.playUrl}${episodes[0].link}`,
        name: vod.vod_name
      }
    } else {
      currentVod.value = {
        url: episodes[0].link,
        name: vod.vod_name
      }
    }
  }
  return episodes
}

const currentIndex = ref(0)
const changeVodUrl = (vod, item, index) => {
  // console.log(item)
  currentIndex.value = index
  if (checkIsM3u8(item.link)) {
    currentVod.value.url = `${vod.playUrl}${item.link}`
  } else {
    currentVod.value.url = item.link;
  }
}

const vodTab = ref(0)

</script>

<template>
  <div class="dark:border-gray-600">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row justify-between items-center gap-2 mb-4 px-2">
      <h1 class="text-sm sm:text-base font-medium flex items-center gap-2">
        <i class="fas fa-play-circle text-purple-500"></i>
        <span class="text-gray-700 dark:text-gray-300">{{ currentVod.name }}</span>
      </h1>
      <div class="flex items-center gap-2 text-xs sm:text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full">
        <i class="fas fa-exclamation-circle animate-pulse"></i>
        <p class="font-medium">请勿相信视频里面的广告内容！</p>
      </div>
    </div>

    <!-- Video Player -->
    <div class="relative rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 backdrop-blur-sm">
      <div class="aspect-video w-full">
        <div v-if="!currentVod.url" class="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5">
          <div class="text-center">
            <i class="fas fa-film text-4xl text-gray-400 dark:text-gray-600 mb-2"></i>
            <p class="text-sm text-gray-500 dark:text-gray-400">请选择播放源和剧集</p>
          </div>
        </div>
        <iframe 
          v-else
          width="100%" 
          height="100%" 
          :src="currentVod.url" 
          class="transition-opacity duration-300"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen="allowfullscreen" 
          mozallowfullscreen="mozallowfullscreen"
          msallowfullscreen="msallowfullscreen" 
          oallowfullscreen="oallowfullscreen"
          webkitallowfullscreen="webkitallowfullscreen">
        </iframe>
      </div>
    </div>

    <!-- Source Selection -->
    <div class="mt-6" v-if="vodData && vodData.length > 0">
      <div class="flex flex-wrap gap-2">
        <button 
          v-for="(vod, index) in vodData" 
          :key="index"
          class="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200
                 ring-1 ring-gray-200 dark:ring-gray-700
                 hover:ring-purple-500 dark:hover:ring-purple-500
                 focus:outline-none focus:ring-2 focus:ring-purple-500"
          :class="[
            vodTab === index 
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white ring-0' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          ]"
          @click="vodTab = index"
        >
          <div class="flex items-center gap-2">
            <span>{{ vod.vod_name }}</span>
            <span class="px-1.5 py-0.5 text-xs rounded-md" 
                  :class="vodTab === index ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'">
              源{{ index + 1 }}
            </span>
          </div>
        </button>
      </div>

      <!-- Episode List -->
      <div class="mt-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 
                  ring-1 ring-black/5 dark:ring-white/5">
        <div class="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          <button
            v-for="(item, index) in formatVodPlayUrl(vodData[vodTab])"
            :key="index"
            class="relative group px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200
                   ring-1 ring-gray-200 dark:ring-gray-700 
                   hover:ring-purple-500 dark:hover:ring-purple-500
                   focus:outline-none focus:ring-2 focus:ring-purple-500"
            :class="[
              currentIndex === index
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white ring-0'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            ]"
            @click="changeVodUrl(vodData[vodTab], item, index)"
          >
            <span class="line-clamp-1">{{ item.number }}</span>
            <div v-if="currentIndex === index" 
                 class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-ping">
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Smooth transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Focus styles */
.focus\:outline-none:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

/* Button hover effects */
button:hover {
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}
</style>