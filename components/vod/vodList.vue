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
        episodes.push({number: episodeNumber, link: episodeLink});
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
  <div class="dark:border-gray-600 p-3">
    <div class="flex flex-col sm:flex-row gap-3 items-center pb-3">
      <h1 class="text-xs sm:text-sm font-bold text-center">
        正在播放：{{ currentVod.name }}
      </h1>
      <p class="text-xs sm:text-sm  text-red-500 text-center font-bold">
        须知：请勿相信视频里面的广告内容！！！
      </p>
    </div>
    <div
        class="mx-3 sm:mx-auto sm:w-full shadow rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600">
      <div class="aspect-video w-full">
        <iframe width="100%" height="100%" :src="currentVod.url" frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen="allowfullscreen"
                mozallowfullscreen="mozallowfullscreen" msallowfullscreen="msallowfullscreen"
                oallowfullscreen="oallowfullscreen" webkitallowfullscreen="webkitallowfullscreen">
        </iframe>
      </div>
    </div>
    <div class="mx-3 sm:mx-auto" v-if="vodData && vodData.length > 0">
      <ul class="flex flex-row items-center flex-wrap gap-2 mt-6">
        <li class="p-3 text-xs sm:text-sm font-bold text-center
        border border-gray-300
        rounded-xl cursor-pointer
        hover:bg-gray-950 hover:text-[#fff]"
            v-for="(vod,index) in vodData" :key="index"
            :class="vodTab === index ? 'bg-gray-950 text-[#fff] dark:bg-gray-950': ''"
            @click="vodTab = index"
        >
          {{ vod.vod_name }} {{ `(源${index + 1})` }}
        </li>
      </ul>
      <ul class="grid grid-cols-6 gap-2 mt-[20px] bg-slate-100 dark:bg-gray-700 rounded-xl p-2">
        <li class="min-w-20 p-[10px] cursor-pointer text-center
         border border-gray-300 text-xs rounded-xl hover:bg-gray-950 hover:text-[#fff]"
            v-for="(item,index) in formatVodPlayUrl(vodData[vodTab])" :key="index"
            @click="changeVodUrl(vodData[vodTab],item,index)"
            :class="currentVod.url === `${vodData[vodTab].playUrl}${item.link}` ? 'bg-gray-950  dark:bg-gray-950 text-[#fff]': ''"
        >
          {{ item.number }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>

</style>