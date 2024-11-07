<script setup>
useHead({
    title: 'TVbox系列数据源接口地址',
    meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'keywords', content: 'aipan.me,TVbox,数据源,接口地址,猫影视TV,电视盒子接口,数据源接口,免费数据源' },
        { hid: 'description', name: 'description', content: 'aipan.me是全网最全免费数据源,TVbox系列数据源接口地址,TVbox影视仓电视盒子接口,猫影视TV数据源接口' },
        { name: 'format-detection', content: 'telephone=no' }
    ]
})
const getData = async () => {
    const res = await $fetch('/api/tvbox')
    tvbox.value = res.list || [];
}
onMounted(() => {
    getData()
})
const { data: tvbox } = await useAsyncData('tvbox', async () => {
    const res = await $fetch('/api/tvbox')
    return res.list || [];
})
const copyTipsMsg = (type) => {
    ElMessage({
        message: type === 'success' ? '复制成功' : '复制失败',
        type: type
    })
}
const copy = (text) => {
    // if copy in mobile browser
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.readOnly = true
        textarea.style.position = 'absolute'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        const selection = document.getSelection()
        const selected = selection.rangeCount > 0 ? selection.getRangeAt(0) : false
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        if (selected) {
            selection.removeAllRanges()
            selection.addRange(selected)
        }
        copyTipsMsg('success')
        return
    }

    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            copyTipsMsg('success')
        }, () => {
            copyTipsMsg('fail')
        })
    } else {
        copyTipsMsg('fail')
    }

}

</script>
<template>
    <div class="mx-4 max-w-[1240px] lg:mx-auto py-10">
        <h1 class="text-sm text-bold">TVbox系列数据源接口地址 </h1>
        <p class="text-xs mt-2 text-gray-400">更新时间:{{ new Date().toLocaleString() }}</p>
        <ul class="mt-6  gap-4 grid grid-cols-1 sm:grid-cols-2  lg:grid-cols-3">
            <li class="flex flex-col items-center gap-2 bg-slate-100 p-2 rounded-md" v-for="(item, index) in tvbox"
                :key="index">
                <span class="text-sm">{{ item.name }}</span>
                <div class="flex flex-row items-center gap-2">
                    <input class="border border-gray-300 px-4 py-2 rounded-md text-xs" type="text" v-model="item.link">
                    <button type="button" class="bg-gray-500 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                        @click="copy(item.link)">复制</button>
                </div>

            </li>
        </ul>
    </div>
</template>