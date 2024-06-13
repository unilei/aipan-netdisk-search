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
  <div class="bg-white dark:bg-gray-600 shadow p-[14px] rounded-[6px]
              hover:bg-[#f5f5f5] dark:hover:bg-gray-700 hover:shadow-lg transition duration-300 ease-in-out"
       v-for="(item, i) in sources.flat(Infinity)" :key="i"
  >
    <div class="flex flex-row gap-2 items-center">
      <p class="text-[14px] font-inter font-[600] truncate dark:text-white" v-html="item.name"></p>
    </div>
    <div class="text-[12px] text-slate-600 mt-1 flex flex-row gap-3">
      <div v-for="(link,i) in item.links" :key="i">
        <nuxt-link class="flex flex-row items-center p-1 border border-slate-500 rounded gap-2" :to="link.link" target="_blank">
          <img class="w-[20px]" v-if="link.service === 'ALIYUN'" src="@/assets/netdisk/aliyun.png" alt="aliyun">
          <img class="w-[20px]" v-if="link.service === 'QUARK'" src="@/assets/netdisk/quark.png" alt="quark">
          <img class="w-[20px]" v-if="link.service === 'BAIDU'" src="@/assets/netdisk/baidu.png" alt="baidu">
          <img class="w-[20px]" v-if="link.service === 'XUNLEI'" src="@/assets/netdisk/xunlei.png" alt="xunlei">
          <img class="w-[20px]" v-if="link.service === 'OTHER'" src="@/assets/netdisk/xunlei.png" alt="xunlei">
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