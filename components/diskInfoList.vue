<script setup lang="ts">
defineProps({
  sources: {
    type: Object,
    default: () => {}
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
const emit = defineEmits(['openLink'])

const handleOpenSourceLink = (item:any) => {
  emit('openLink', item)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
const formatAnswer = (inputString)=>{
  const regex = /https?:\/\/[^\s]+/g;
  const links = inputString.match(regex);
  let data = []
  if (links) {
    links.forEach((link, index) => {
      let service = '';

      if (link.includes('pan.baidu.com')) {
        service = '百度网盘';
      } else if (link.includes('pan.xunlei.com')) {
        service = '迅雷网盘';
      } else if (link.includes('pan.quark.cn')) {
        service = '夸克网盘';
      } else {
        service = '未知网盘';
      }

      data.push({
        service: service,
        link: link
      })

    });
  } else {
    console.log('没有找到链接');
  }
  return data
}
</script>

<template>
  <el-skeleton :loading="skeletonLoading" animated :count="20">
    <template #template>
      <div
          class="bg-white dark:bg-gray-600 shadow p-[14px] rounded-[6px] cursor-pointer mb-3
                  hover:bg-[#f5f5f5] hover:shadow-lg transition duration-300 ease-in-out"
      >
        <div class="flex flex-row gap-2 items-center">
          <el-skeleton-item variant="image" style="width: 20px; height: 20px" />
          <el-skeleton-item variant="text" style="width: 100px;" />
        </div>
        <div>
          <el-skeleton-item variant="text" style="width: 100%;" />
        </div>
        <div>
          <el-skeleton-item variant="text" style="width: 100%;" />
        </div>
      </div>
    </template>
    <template #default>
      <div
          class="bg-white dark:bg-gray-600 shadow p-[14px] rounded-[6px]
              hover:bg-[#f5f5f5] dark:hover:bg-gray-700 hover:shadow-lg transition duration-300 ease-in-out"
          v-for="(item,i) in sources" :key="i"
      >
        <div class="flex flex-row gap-2 items-center">
          <p class="text-[14px] font-inter font-[600] truncate dark:text-white" v-html="item.question"></p>
        </div>
        <div class="text-[12px] text-slate-600 mt-1">
          <div v-for="(item,i) in formatAnswer(item.answer)" :key="i">
            <nuxt-link :to="item.link" target="_blank"><span class="text-blue-700">{{item.service}}: </span>{{item.link}}</nuxt-link>
          </div>
        </div>
      </div>
    </template>

  </el-skeleton>

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