<script setup>
definePageMeta({
    layout: 'custom',
})
const keyword = ref('周杰伦')
const page = ref(1)
const quality = ref('lossless')
const kwData = ref([])
const kwSearch = async () => {
    searchLoading.value = true
    const res = await $fetch('/api/music/kw-search',
        {
            method: 'GET',
            query: {
                keyword: keyword.value,
                page: page.value
            }
        }
    )

    kwData.value = res.data
    searchLoading.value = false
}
const kwGetUrl = async (id) => {
    const res = await $fetch('/api/music/kw-url',
        {
            method: 'GET',
            query: {
                id: id,
                quality: quality.value
            }
        }
    )
    if (res.msg === 'success') {
        return res.url;
    } else {
        return alert('获取链接失败, 请重试')
    }

}
const searchLoading = ref(false)
const handleSearch = () => {
    page.value = 1
    kwData.value = []
    kwSearch()
}
const handleNextPage = () => {
    page.value++
    kwSearch()
}
const handlePrevPage = () => {
    if (page.value > 1) {
        page.value--
        kwSearch()
    }
}
const handleDownload = async (song) => {
    let downloadUrl = await kwGetUrl(song.id)
    if (downloadUrl) {
        window.open(downloadUrl, '_blank')
    }
}
const downloadVisible = ref(false)
const currentDownloadSong = ref({})
const handleDownloadVisible = (song) => {
    currentDownloadSong.value = song
    downloadVisible.value = !downloadVisible.value
}
const tips = ref('')
const copyTipsMsg = (type) => {
    if (type === 'success') {
        tips.value = '复制成功'
    }
    if (type === 'fail') {
        tips.value = '复制失败'
    }
    if (type === 'reset') {
        tips.value = ''
    }

}
const handleCopySongName = (song) => {
    navigator.clipboard.writeText(song.name + ' - ' + song.artist)
    copyTipsMsg('success')
    setTimeout(() => {
        copyTipsMsg('reset')
    }, 3000);
}
const handleCopySongUrl = async (song) => {
    let downloadUrl = await kwGetUrl(song.id)
    navigator.clipboard.writeText(downloadUrl)
    copyTipsMsg('success')
    setTimeout(() => {
        copyTipsMsg('reset')
    }, 3000);
}
</script>
<template>
    <div class="max-w-md min-h-screen mx-auto p-[20px]">
        <div class="flex flex-row items-center justify-center gap-3">
            <a href="/">
                <img class="w-[40px] h-[40px] sm:w-[40px] sm:h-[40px]" src="@/assets/my-logo.png" alt="logo">
            </a>
            <h1 class="text-[18px] sm:text-[22px] font-serif font-bold dark:text-white ">爱盼-音乐搜索下载</h1>
        </div>

        <div class="flex flex-row items-center justify-center gap-2 mt-5">
            <input class="border border-gray-300 px-4 py-2 rounded-md" type="text" v-model="keyword"
                placeholder="请输入关键词" @keydown.enter="handleSearch()">
            <button class="bg-gray-900 text-white px-4 py-2 rounded-md" @click="handleSearch()">搜索</button>
        </div>

        <div class="space-y-2 mt-5" v-if="kwData && kwData.length > 0">
            <div class="flex flex-row gap-2 items-center justify-between p-2 border-b border-gray-300">
                <h1 class="text-xl font-bold">搜索结果</h1>
                <div class="space-x-2">
                    <button class="text-gray-950 text-sm hover:underline" @click="handlePrevPage()">上一页</button>
                    <button class="text-gray-950 text-sm hover:underline" @click="handleNextPage()">下一页</button>
                </div>
            </div>
            <div class="text-purple-500" v-if="searchLoading">爱盼，正在努力搜索中...</div>
            <ul class="space-y-2">
                <li class="flex flex-row justify-between items-center text-sm p-2 bg-gray-100 "
                    v-for="(item, index) in kwData" :key="index">
                    <div>
                        <p class="text-md font-bold" v-html="item.name"></p>
                        <p class="text-xs text-gray-500">{{ item.album }} - {{ item.artist }}</p>
                    </div>
                    <div class="min-w-[60px] text-right">
                        <button class="bg-gray-900 text-white px-2 py-1 rounded-md text-xs hover:text-md  "
                            @click="handleDownloadVisible(item)">下载</button>
                    </div>
                </li>
            </ul>
        </div>
        <p class="mt-4 text-xs text-red-500 text-center">仅供个人学习使用，禁止商业用途，否则后果自负</p>

        <div v-if="downloadVisible"
            class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex items-center justify-center">
            <div class="bg-white p-5 rounded-md space-y-3">
                <h2 class="text-md font-bold" v-html="currentDownloadSong.name"></h2>
                <div class="space-y-2">
                    <h3 class="text-sm font-bold">选择歌曲质量 </h3>
                    <ul class="flex flex-row items-center flex-wrap gap-2">
                        <li v-for="(q, i) in currentDownloadSong.quality" :key="i"
                            class="text-xs p-2 rounded-sm cursor-pointer border border-gray-300"
                            :class="quality === i ? 'bg-gray-900 text-white' : ''" @click="quality = i">
                            <span v-if="i === 'lossless'">无损</span>
                            <span v-else-if="i === 'exhigh'">高质量</span>
                            <span v-else-if="i === 'standard'">标准</span>
                            <span v-else>未知</span>
                            <br> {{ q.size }}
                        </li>
                    </ul>
                </div>
                <div class="space-x-2 text-center">
                    <button class="bg-gray-900 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                        @click="handleCopySongName(currentDownloadSong)">复制歌曲名字</button>
                        <!-- 因为https协议不能直接下载http协议的歌曲，所以暂时不开放 -->
                    <!-- <button class="bg-gray-900 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                        @click="handleDownload(currentDownloadSong)">下载</button> -->
                    <button class="bg-gray-900 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                        @click="handleCopySongUrl(currentDownloadSong)">复制歌曲链接</button>
                    <button class="bg-gray-900 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                        @click="downloadVisible = false">关闭</button>
                </div>
                <p class="text-xs text-red-500">{{ tips }}</p>
            </div>

        </div>
    </div>
</template>
<style scoped></style>