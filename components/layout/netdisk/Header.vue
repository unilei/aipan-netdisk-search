<script setup>
import { ref } from 'vue'
import { useColorMode } from '#imports'
const colorMode = useColorMode()
const isMenuOpen = ref(false)

const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value
}
</script>
<template>
    <div class="backdrop-blur py-4 fixed top-0 left-0 w-full z-50">
        <div class="max-w-[1240px] mx-auto flex flex-row items-center justify-between px-[20px]">
            <!-- Mobile Menu Button -->
            <button class="md:hidden text-slate-600 dark:text-white" @click="toggleMenu">
                <i v-if="!isMenuOpen" class="fa-solid fa-bars text-base"></i>
                <i v-else class="fa-solid fa-xmark text-base"></i>
            </button>

            <!-- Desktop Navigation -->
            <div class="hidden md:flex flex-row items-center gap-4">
                <nuxt-link to="/" class="text-sm text-slate-600 dark:text-white">
                    <i class="fa-solid fa-house"></i> 首页
                </nuxt-link>
                <nuxt-link to="/blog" class="text-sm text-slate-600 dark:text-white">
                    <i class="fa-solid fa-book"></i> 我的博客
                </nuxt-link>
                <nuxt-link to="/tv" class="text-sm text-slate-600 dark:text-white">
                    <i class="fa-solid fa-tv"></i> 电视TV
                </nuxt-link>
                <nuxt-link to="/tvbox" class="text-sm text-slate-600 dark:text-white">
                    <i class="fa-solid fa-tv"></i> TVbox接口
                </nuxt-link>
                <nuxt-link to="/about" class="text-sm text-slate-600 dark:text-white">
                    <i class="fa-solid fa-circle-info"></i> 关于网站
                </nuxt-link>
                <nuxt-link to="/disclaimer" class="text-sm text-slate-600 dark:text-white">
                    <i class="fa-solid fa-shield"></i> 免责声明
                </nuxt-link>
                <nuxt-link to="/copyright" class="text-sm text-slate-600 dark:text-white">
                    <i class="fa-solid fa-copyright"></i> 侵权投诉
                </nuxt-link>
            </div>

            <!-- Mobile Navigation -->
            <div v-show="isMenuOpen" class="md:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-800 shadow-lg">
                <div class="flex flex-col py-2">
                    <nuxt-link to="/" class="px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" @click="isMenuOpen = false">
                        <i class="fa-solid fa-house"></i> 首页
                    </nuxt-link>
                    <nuxt-link to="/blog" class="px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" @click="isMenuOpen = false">
                        <i class="fa-solid fa-book"></i> 我的博客
                    </nuxt-link>
                    <nuxt-link to="/tv" class="px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" @click="isMenuOpen = false">
                        <i class="fa-solid fa-tv"></i> 电视TV
                    </nuxt-link>
                    <nuxt-link to="/tvbox" class="px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" @click="isMenuOpen = false">
                        <i class="fa-solid fa-tv"></i> TVbox接口
                    </nuxt-link>
                    <nuxt-link to="/about" class="px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" @click="isMenuOpen = false">
                        <i class="fa-solid fa-circle-info"></i> 关于网站
                    </nuxt-link>
                    <nuxt-link to="/disclaimer" class="px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" @click="isMenuOpen = false">
                        <i class="fa-solid fa-shield"></i> 免责声明
                    </nuxt-link>
                    <nuxt-link to="/copyright" class="px-4 py-2 text-sm text-slate-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" @click="isMenuOpen = false">
                        <i class="fa-solid fa-copyright"></i> 侵权投诉
                    </nuxt-link>
                </div>
            </div>

            <div class="flex flex-row items-center gap-4">
                <client-only>
                    <el-button v-if="colorMode.preference === 'dark'" link @click="colorMode.preference = 'light'">
                        <i class="fa-solid fa-sun text-base"></i>
                    </el-button>
                    <el-button v-if="colorMode.preference === 'light'" link @click="colorMode.preference = 'dark'">
                        <i class="fa-solid fa-moon text-base"></i>
                    </el-button>

                    <nuxt-link class="text-sm text-slate-600 font-bold dark:text-white" href="/music" title="音乐搜索小助手">
                        <i class="fa-solid fa-music text-base"></i>
                    </nuxt-link>
                </client-only>
            </div>
        </div>
    </div>
</template>
<style scoped>
.router-link-active {
    @apply text-red-600 dark:text-red-400;
}
</style>