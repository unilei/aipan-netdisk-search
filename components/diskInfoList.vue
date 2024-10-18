<script setup>

defineProps({
  sources: {
    type: Array,
    default: () => []
  },
  skeletonLoading: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: ''
  }
})

</script>

<template>
  <div class="bg-white dark:bg-gray-600 shadow p-3 rounded-[6px]
              flex flex-col sm:flex-row justify-between items-center
              hover:bg-[#f5f5f5] dark:hover:bg-gray-700 hover:shadow-lg transition duration-300 ease-in-out"
    v-for="(item, i) in sources.flat(Infinity)" :key="i">
    <p class="text-sm text-slate-600 font-semibold truncate text-wrap dark:text-white" v-html="item.name"></p>
    <div class="text-[12px] text-slate-600 mt-1 flex flex-row gap-3">
      <div v-for="(link, i) in item.links" :key="i">
        <nuxt-link
          class="flex flex-row items-center p-1 bg-slate-200 rounded gap-2 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          :to="link.link" target="_blank">
          <img class="w-[20px]" v-if="link.service === 'ALIYUN'" src="@/assets/netdisk/aliyun.png" alt="aliyun">
          <img class="w-[20px]" v-else-if="link.service === 'QUARK'" src="@/assets/netdisk/quark.png" alt="quark">
          <img class="w-[20px]" v-else-if="link.service === 'BAIDU'" src="@/assets/netdisk/baidu.png" alt="baidu">
          <img class="w-[20px]" v-else-if="link.service === 'XUNLEI'" src="@/assets/netdisk/xunlei.png" alt="xunlei">
          <img class="w-[20px]" v-else-if="link.service === 'OTHER'" src="@/assets/netdisk/xunlei.png" alt="xunlei">
          <a class="truncate-3-lines" v-else>AIPAN</a>
          <span class="dark:text-white" v-if="link.pwd">提取码：{{ link.pwd }}</span>
        </nuxt-link>
      </div>
    </div>
  </div>
</template>
<style>
em {
  color: blue;
  margin: 0 2px;
}

.dark em {
  color: deepskyblue;
}
</style>
<style scoped>
.truncate-3-lines {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>