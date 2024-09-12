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
            <div class="max-w-[1240px] mx-auto relative min-h-11 flex items-center justify-center">
                <NuxtLink class="text-slate-500 text-sm absolute left-10 " to="/blog">返回博客</NuxtLink>
                <h1 class="font-bold text-xl text-center">{{ blog?.title }}</h1>
            </div>
        </div>

        <div class="py-5 max-w-[1240px] mx-auto">
            <client-only>
                <mavon-editor v-model="blog.content" class="w-full h-full mt-4" :boxShadow="false" :subfield="false"
                    previewBackground="transparent" :toolbarsFlag="false" :editable="false"
                    defaultOpen="preview"></mavon-editor>
            </client-only>
        </div>
    </div>
</template>
<style scoped></style>