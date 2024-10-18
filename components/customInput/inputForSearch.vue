<script setup>
const searchSiteData = ref([
  {
    id: 1,
    name: '谷歌',
    url: 'https://www.google.com/search',
    s_key: 'q'
  },
  {
    id: 2,
    name: '必应[国际]',
    url: 'https://www.bing.com/search',
    s_key: 'q'
  },
  {
    id: 3,
    name: '必应[国内]',
    url: 'https://cn.bing.com/',
    s_key: 'q'
  },
  {
    id: 4,
    name: '百度',
    url: 'https://www.baidu.com/s',
    s_key: 'q'
  }

])
const searchSite = ref({
  id: 4,
  name: '百度',
  url: 'https://www.baidu.com/s',
  s_key: 'wd'
})
const searchKeyword = ref('')
const search = () => {
  let str = searchSite.value.url + '?' + searchSite.value.s_key + '=' + searchKeyword.value
  window.open(str, '_blank')
}
</script>

<template>
  <div class="w-[100%] md:w-[800px] border border-slate-300 overflow-hidden rounded-[50px]">
    <client-only>
      <el-input class="h-[50px]" v-model="searchKeyword" placeholder="请输入关键词" @keydown.enter="search()">
        <template #prepend>
          <el-select class="w-[40px] md:w-[100px] h-[50px]" placeholder="搜索引擎" value-key="id" v-model="searchSite">
            <el-option class="h-[50px]" v-for="(item, i) in searchSiteData" :key="i" :label="item.name"
              :value="item"></el-option>
          </el-select>
        </template>
        <template #append>
          <el-button icon="search" @click="search()"></el-button>
        </template>
      </el-input>
    </client-only>

  </div>
</template>

<style scoped>
:deep(.el-input__inner) {
  height: 48px;
}

:deep(.el-input__wrapper) {
  box-shadow: none;
}

:deep(.el-input-group__prepend) {
  box-shadow: none;
}

:deep(.el-input) {
  --el-input-focus-border: transparent;
  --el-input-border-color: transparent;
  --el-input-focus-border-color: transparent;
  --el-input-hover-border-color: transparent;
}

:deep(.el-input-group--prepend .el-input-group__prepend .el-select .el-input.is-focus .el-input__wrapper) {
  box-shadow: none !important;
}

:deep(.el-input-group--prepend .el-input-group__prepend .el-select .el-input .el-input__inner) {
  text-align: center;
}

:deep(.el-select .el-input__wrapper.is-focus) {
  box-shadow: none !important;
}
</style>