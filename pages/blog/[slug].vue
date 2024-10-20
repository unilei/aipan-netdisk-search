<script setup>
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
                <h1 class="ml-4 sm:ml-0 font-bold text-xl text-center dark:text-white">{{ blog?.title }}</h1>
            </div>
        </div>
        <div class="sm:py-5 max-w-[1240px] mx-auto" v-if="blog && blog.content">
            <client-only>
                <mavon-editor v-model="blog.content" class="w-full h-full sm:mt-4" :boxShadow="false" :subfield="false"
                    previewBackground="transparent" :toolbarsFlag="false" :editable="false"
                    defaultOpen="preview"></mavon-editor>
            </client-only>
        </div>
    </div>
</template>
<style scoped></style>