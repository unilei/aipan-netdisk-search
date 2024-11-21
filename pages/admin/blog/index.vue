<script setup>
import { House, Document, Edit, Delete, Plus, ArrowLeft } from '@element-plus/icons-vue'

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
    <div class="min-h-[calc(100vh-60px)] bg-gray-50 p-6">
        <div class="max-w-[1240px] mx-auto space-y-6">
            <!-- 头部区域 -->
            <div class="bg-white rounded-lg p-6 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                            <nuxt-link to="/admin/dashboard" class="hover:text-primary flex items-center">
                                <el-icon class="mr-1"><House /></el-icon>
                                后台管理面板
                            </nuxt-link>
                            <span>/</span>
                            <span class="text-gray-900">博客管理</span>
                        </div>
                        <h1 class="text-2xl font-bold text-gray-900">博客文章管理</h1>
                        <p class="text-gray-500 mt-1">管理和维护博客文章内容</p>
                    </div>
                    <el-button @click="() => navigateTo('/admin/dashboard')" class="flex items-center">
                        <el-icon class="mr-1"><ArrowLeft /></el-icon>
                        返回面板
                    </el-button>
                </div>
            </div>

            <!-- 操作按钮区域 -->
            <div class="bg-white rounded-lg p-6 shadow-sm">
                <div class="flex items-center space-x-4">
                    <el-button type="primary" @click="handleAddPost()" class="flex items-center">
                        <el-icon class="mr-1"><Plus /></el-icon>
                        新建文章
                    </el-button>
                </div>
            </div>

            <!-- 表格区域 -->
            <div class="bg-white rounded-lg p-6 shadow-sm">
                <template v-if="postsData && postsData.length">
                    <el-table 
                        :data="postsData" 
                        style="width: 100%"
                        :border="true"
                        class="mt-4"
                    >
                        <el-table-column type="index" label="序号" width="80" align="center" />
                        <el-table-column prop="title" label="文章标题" min-width="200">
                            <template #default="{ row }">
                                <div class="flex items-center">
                                    <el-icon class="mr-2 text-blue-500"><Document /></el-icon>
                                    <span>{{ row.title }}</span>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="createdAt" label="创建时间" width="180" align="center">
                            <template #default="{ row }">
                                {{ new Date(row.createdAt).toLocaleString() }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="status" label="状态" width="100" align="center">
                            <template #default="{ row }">
                                <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
                                    {{ row.status === 'published' ? '已发布' : '草稿' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="200" fixed="right">
                            <template #default="scope">
                                <el-button-group>
                                    <el-button 
                                        type="primary" 
                                        size="small"
                                        @click="handleEditPostsById(scope.row)"
                                    >
                                        <el-icon><Edit /></el-icon>
                                        编辑
                                    </el-button>
                                    <el-popconfirm
                                        title="确定要删除这篇文章吗？"
                                        @confirm="handleDeletePostsById(scope.row)"
                                    >
                                        <template #reference>
                                            <el-button 
                                                type="danger"
                                                size="small"
                                            >
                                                <el-icon><Delete /></el-icon>
                                                删除
                                            </el-button>
                                        </template>
                                    </el-popconfirm>
                                </el-button-group>
                            </template>
                        </el-table-column>
                    </el-table>

                    <!-- 分页器 -->
                    <div class="mt-6 flex justify-center">
                        <el-pagination
                            v-model:current-page="page"
                            v-model:page-size="pageSize"
                            :page-sizes="[10, 20, 50, 100]"
                            background
                            layout="total, sizes, prev, pager, next, jumper"
                            :total="totalCount"
                            @size-change="handleSizeChange"
                            @current-change="handleCurrentChange"
                        />
                    </div>
                </template>
                <template v-else>
                    <el-empty description="暂无文章" />
                </template>
            </div>
        </div>
    </div>
</template>