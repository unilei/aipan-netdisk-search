<script setup>
import { marked } from 'marked';
const route = useRoute();

const { data: blog } = useAsyncData('blog', async () => {

    const res = await $fetch(`/api/blog/posts/${route.params.slug}`, {
        method: 'GET'
    })

    return res.data;
}, {

})
</script>
<template>
    <div class="bg-white dark:bg-gray-800 min-h-screen">
        <div class="border-b border-slate-200 py-4">
            <div class="max-w-[1240px] mx-auto relative sm:min-h-11 flex items-center sm:justify-center">
                <NuxtLink class="text-slate-500 text-sm ml-4 sm:ml-0 sm:absolute sm:left-10 dark:text-white" to="/blog">
                    返回博客
                </NuxtLink>
                <h1 class="ml-4 sm:ml-0 font-bold text-sm text-center dark:text-white">{{ blog?.title }}</h1>
            </div>
        </div>
        <div class=" bg-slate-50 dark:bg-gray-800 p-4 overflow-scroll">
            <pre>
                <div class="max-w-[1140px] mx-auto text-xs" v-html="marked.parse(blog?.content)"></div>
            </pre>
        </div>
    </div>
</template>
<style scoped></style>