<script setup>
const colorMode = useColorMode()

const router = useRouter()
const goHome = () => {
  router.push('/')
}
</script>
<template>
  <el-affix z-index="3000">
    <div class="shadow px-[20px] py-[10px] backdrop-blur bg-white/70 dark:bg-gray-800">
      <div class="max-w-[1240px] mx-auto h-[40px]  flex flex-row items-center justify-between">
        <div class="flex flex-row items-center justify-center gap-1">
          <img class="w-[40px] h-[40px] cursor-pointer" src="@/assets/my-logo.png" alt="logo" @click="goHome()">
          <h1 class="text-xl font-semibold cursor-pointer dark:text-white" @click="goHome()">爱盼-网盘资源搜索</h1>
        </div>
        <client-only>
          <div class="flex flex-row items-center gap-2">
            <el-button v-if="colorMode.preference === 'dark'" link @click="colorMode.preference = 'light'">
              <img class="w-[20px] h-[20px]" src="@/assets/theme/entypo--light-up.svg" alt="">
            </el-button>
            <el-button v-if="colorMode.preference === 'light'" link @click="colorMode.preference = 'dark'">
              <img class="w-[20px] h-[20px]" src="@/assets/theme/icon-park-solid--dark-mode.svg" alt="">
            </el-button>

            <nuxt-link class="text-sm text-slate-600 font-bold dark:text-white" href="/music" title="音乐搜索小助手">
              <img v-if="colorMode.preference === 'light'" class="w-[20px] h-[20px]" src="@/assets/theme/music-dark.svg"
                alt="">
              <img v-if="colorMode.preference === 'dark'" class="w-[20px] h-[20px]" src="@/assets/theme/music-light.svg"
                alt="">
            </nuxt-link>
          </div>
        </client-only>
      </div>
    </div>
  </el-affix>
</template>
<style scoped></style>