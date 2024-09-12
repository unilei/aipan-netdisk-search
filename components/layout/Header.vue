<template>
  <el-affix z-index="3000">
    <div class="shadow px-[20px] py-[10px] backdrop-blur">
      <div class="max-w-[1240px] mx-auto h-[40px]  flex flex-row items-center justify-between">
        <div class="flex flex-row items-center justify-center gap-1">
          <img class="w-[40px] h-[40px] cursor-pointer" src="@/assets/my-logo.png" alt="logo" @click="goHome()">
          <h1 class="text-[14px] font-serif font-bold cursor-pointer" @click="goHome()">爱盼-网盘资源搜索</h1>
        </div>
      </div>
    </div>
  </el-affix>
</template>
<script setup>
const router = useRouter()
const goHome = () => {
  router.push('/')
}
</script>

<style scoped></style>