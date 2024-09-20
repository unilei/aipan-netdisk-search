<script setup>
import moment from 'moment';

const formatDate = (date) => {
    return moment(date).format('YYYY-MM-DD HH:mm:ss')
}
const postsData = ref([])
// const categoriesData = ref([])
const page = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)
const categoryId = ref(undefined)
const getCategories = async () => {
    const res = await $fetch('/api/blog/category/get', {
        method: 'GET',
        headers: {
            "authorization": "Bearer " + useCookie('token').value
        }
    })
    return res.data;
}
const getPosts = async () => {
    let queryJson = {
        page: page.value,
        pageSize: pageSize.value
    }
    if (categoryId.value) {
        queryJson.categoryId = categoryId.value
    }
    const res = await $fetch('/api/blog/posts/get', {
        method: 'GET',
        query: queryJson,
    })
    totalCount.value = res.totalCount;
    // return res.posts;
    postsData.value = res.posts
}
const handleCurrentChange = async (val) => {
    page.value = val
    await getPosts()
}
const handleSizeChange = async (val) => {
    pageSize.value = val
    await getPosts()
}
const handleSelectCategory = (val) => {
    categoryId.value = val
    getPosts()
}

const { data: categoriesData } = await useAsyncData('categories', async () => {
    return await getCategories()
})
// const { data: posts } = await useAsyncData('posts', async () => {
//     return await getPosts()
// }, {
//     watch: [page, pageSize, categoryId]
// })
onMounted(async () => {
    await getPosts()
})
</script>
<template>
    <div class="bg-white dark:bg-gray-800">
        <div class=" text-xs bg-slate-100 dark:bg-gray-700 p-3 text-gray-600 text-center sm:text-sm dark:text-white">
            这里是精彩的博客天地，时常发布一些妙趣横生的内容。欢迎各位朋友拨冗光临，一同感受这里的独特魅力。
        </div>
        <div class="grid grid-cols-5 max-w-[1240px] mx-auto">
            <div class="col-span-3 border-r border-slate-100 py-5 pr-5 min-h-screen">
                <div class="space-y-3 ">
                    <div class="p-3 space-y-3  border-b border-slate-200 " v-for="(item, index) in postsData"
                        :key="index">
                        <nuxt-link class="text-sm font-bold hover:text-blue-500 dark:text-white "
                            :to="'/blog/' + item.slug">{{
                                item.title
                            }}</nuxt-link>
                        <div class="flex flex-row justify-between">
                            <div class="flex flex-row items-center gap-2">
                                <div class="text-xs text-slate-400" v-for="(category, index) in item.categories"
                                    :key="index">{{
                                        category.category.name
                                    }}
                                </div>
                            </div>
                            <div>
                                <div class="text-xs text-slate-400">{{ formatDate(item.createdAt) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <client-only>
                    <div v-if="totalCount" class="mt-[100px]  items-center justify-center hidden sm:flex ">
                        <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
                            :page-sizes="[100, 200, 300, 400]" background
                            layout="total, sizes, prev, pager, next, jumper" :total="totalCount"
                            @size-change="handleSizeChange" @current-change="handleCurrentChange" />
                    </div>
                    <div v-if="totalCount" class="mt-10  items-center justify-center flex sm:hidden ">
                        <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
                            :page-sizes="[100, 200, 300, 400]" background layout="prev, next" :total="totalCount"
                            @size-change="handleSizeChange" @current-change="handleCurrentChange" />
                    </div>
                </client-only>
            </div>
            <div class="col-span-2 py-4 px-6">
                <div class="flex flex-row flex-wrap gap-2">
                    <div class="py-2 px-6 border border-slate-300 rounded-sm text-sm cursor-pointer hover:bg-slate-300 dark:text-white"
                        @click="handleSelectCategory(undefined)">
                        全部分类</div>
                    <div class="py-2 px-6 border border-slate-300 rounded-sm text-sm cursor-pointer hover:bg-slate-300 dark:text-white"
                        v-for="(item, index) in categoriesData" :key="index" @click="handleSelectCategory(item.id)">
                        {{ item.name }}
                    </div>
                </div>
                <div class="mt-5 border-t border-slate-100 py-4 flex flex-row flex-wrap gap-2">
                    <nuxt-link class="flex flex-col items-center justify-center gap-1"
                        to="https://github.com/unilei/aipan-netdisk-search">
                        <img class="w-8 h-8" src="@/assets/skill-icons--github-dark.svg" alt="github">
                        <span class="text-xs text-slate-500">GitHub</span>
                    </nuxt-link>
                    <nuxt-link class="flex flex-col items-center justify-center gap-1" to="/donate">
                        <img class="w-8 h-8" src="@/assets/donation/dashang.svg" alt="打赏">
                        <span class="text-xs text-slate-500">打赏</span>
                    </nuxt-link>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped></style>