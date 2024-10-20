<script setup>
definePageMeta({
    middleware: ['auth']
})
const router = useRouter()
const postsData = ref([])
const page = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)
const getPosts = async () => {
    const res = await $fetch('/api/admin/blog/posts/get', {
        method: 'GET',
        query: {
            page: page.value,
            pageSize: pageSize.value
        },
        headers: {
            "authorization": "Bearer " + useCookie('token').value
        }
    })
    // console.log(res)
    postsData.value = res.posts;
    totalCount.value = res.totalCount;
}
const handleCurrentChange = (val) => {
    page.value = val
    getPosts()
}
const handleSizeChange = (val) => {
    pageSize.value = val
    getPosts()
}
const handleEditPostsById = (row) => {
    router.push(`/admin/blog/${row.id}`)
}

const handleDeletePostsById = (row) => {
    // console.log(row)
    $fetch(`/api/admin/blog/posts/${row.id}`, {
        method: 'DELETE',
        headers: {
            "authorization": "Bearer " + useCookie('token').value
        }
    })
    getPosts()
}
const handleAddPost = () => {
    router.push('/admin/blog/new')
}
onMounted(() => {
    getPosts()
})
</script>
<template>
    <div class="p-10 max-w-[1240px] mx-auto ">
        <h1 class="text-xl text-bold space-x-2">
            <nuxt-link to="/admin/dashboard">后台管理面板</nuxt-link>
            <span>/</span>
            <nuxt-link to="/admin/blog">博客管理</nuxt-link>
        </h1>
        <div class="h-[1px] bg-slate-300 mt-6"></div>
        <div class="mt-6 grid grid-cols-4 gap-4">
            <el-button type="primary" @click="handleAddPost()">添加文章</el-button>
        </div>
        <div class="mt-6" v-if="postsData && postsData.length">
            <el-table :data="postsData">
                <el-table-column prop="title" label="标题"></el-table-column>
                <el-table-column label="操作" width="200">
                    <template #default="scope">
                        <el-button type="primary" @click="handleEditPostsById(scope.row, scope.$index)">编辑</el-button>
                        <el-button type="danger" @click="handleDeletePostsById(scope.row, scope.$index)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="mt-6 flex items-center justify-center">
                <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
                    :page-sizes="[100, 200, 300, 400]" background layout="total, sizes, prev, pager, next, jumper"
                    :total="totalCount" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
        </div>
    </div>
</template>