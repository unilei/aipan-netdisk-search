<script setup>
definePageMeta({
    middleware: ['auth']
})
</script>
<template>
    <div class="p-10 max-w-[1240px] mx-auto ">
        <h1 class="text-xl text-bold">后台管理面板</h1>
        <div class="h-[1px] bg-slate-300 mt-6"></div>
        <div class="mt-6 grid grid-cols-4 gap-4">
            <NuxtLink class="bg-slate-500 p-3 text-white rounded-lg hover:bg-black" to="/admin/clouddrive">
                网盘管理
            </NuxtLink>
            <NuxtLink class="bg-slate-500 p-3 text-white rounded-lg hover:bg-black" to="/admin/blog">
                博客管理
            </NuxtLink>
            <NuxtLink class="bg-slate-500 p-3 text-white rounded-lg hover:bg-black" to="/admin/alist">
                Alist源管理
            </NuxtLink>
        </div>
    </div>
</template>