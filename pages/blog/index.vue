<script setup>
import moment from 'moment';

const formatDate = (date) => {
    return moment(date).format('YYYY-MM-DD HH:mm:ss')
}
// const postsData = ref([])
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
    return res.posts;
    // postsData.value = res.posts
}
const handleCurrentChange = (val) => {
    page.value = val
}
const handleSizeChange = (val) => {
    pageSize.value = val
}
const handleSelectCategory = (val) => {
    categoryId.value = val
}

const { data: categoriesData } = await useAsyncData('categories', async () => {
    return await getCategories()
})
const { data: postsData } = await useAsyncData('posts', async () => {
    return await getPosts()
}, {
    watch: [page, pageSize, categoryId]
})
</script>
<template>
    <div class="bg-white dark:bg-gray-800">
        <div class="bg-slate-100 dark:bg-gray-700 p-3 text-gray-600 text-center text-sm">
            这里是精彩的博客天地，时常发布一些妙趣横生的内容。欢迎各位朋友拨冗光临，一同感受这里的独特魅力。
        </div>
        <div class="grid grid-cols-5 max-w-[1240px] mx-auto">
            <div class="col-span-3 border-r border-slate-100 py-5 pr-5">
                <div class="space-y-3">
                    <div class="p-3 space-y-3  border-b border-slate-200 " v-for="(item, index) in postsData"
                        :key="index">
                        <nuxt-link class="text-sm font-bold hover:text-blue-500 " :to="'/blog/' + item.slug">{{
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
                <div class="mt-[100px] flex items-center justify-center">
                    <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
                        :page-sizes="[100, 200, 300, 400]" background layout="total, sizes, prev, pager, next, jumper"
                        :total="totalCount" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
                </div>
            </div>
            <div class="col-span-2 p-4">
                <div class="p-3   bg-slate-100 rounded-md flex flex-row flex-wrap gap-2">
                    <div class="py-2 px-6 border border-slate-300 rounded-sm text-sm cursor-pointer hover:bg-slate-300"
                        @click="handleSelectCategory(undefined)">
                        全部分类</div>
                    <div class="py-2 px-6 border border-slate-300 rounded-sm text-sm cursor-pointer hover:bg-slate-300"
                        v-for="(item, index) in categoriesData" :key="index" @click="handleSelectCategory(item.id)">
                        {{ item.name }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped></style>