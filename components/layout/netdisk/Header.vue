<script setup>
const colorMode = useColorMode()

</script>
<template>
    <div
        class="bg-white/70 backdrop-blur dark:bg-gray-800 py-4 fixed top-0 left-0 w-full border-b border-slate-150 z-50">
        <div class="max-w-[1240px] mx-auto flex flex-row items-center justify-between px-[20px]">
            <div>
                <!-- <nuxt-link to="/blog" class="text-sm text-slate-600 font-bold dark:text-white">我的博客</nuxt-link> -->
            </div>
            <div class="flex flex-row items-center gap-2">
                <el-button v-if="colorMode.preference === 'dark'" link @click="colorMode.preference = 'light'">
                    <img class="w-[20px] h-[20px]" src="@/assets/theme/entypo--light-up.svg" alt="">
                </el-button>
                <el-button v-if="colorMode.preference === 'light'" link @click="colorMode.preference = 'dark'">
                    <img class="w-[20px] h-[20px]" src="@/assets/theme/icon-park-solid--dark-mode.svg" alt="">
                </el-button>

                <nuxt-link class="text-sm text-slate-600 font-bold dark:text-white" href="/music" title="音乐搜索小助手">
                    <img v-if="colorMode.preference === 'light'" class="w-[20px] h-[20px]"
                        src="@/assets/theme/music-dark.svg" alt="">
                    <img v-if="colorMode.preference === 'dark'" class="w-[20px] h-[20px]"
                        src="@/assets/theme/music-light.svg" alt="">
                </nuxt-link>
            </div>
        </div>
    </div>
</template>
<style scoped></style>