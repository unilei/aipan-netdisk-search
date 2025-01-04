<template>
    <div class="min-h-[calc(100vh-60px)] bg-gray-50 p-6">
        <div class="max-w-[1240px] mx-auto space-y-6">
            <!-- 头部区域 -->
            <div class="bg-white rounded-lg p-6 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">用户文章管理</h1>
                        <p class="text-gray-500 mt-1">管理用户投稿的文章内容</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <el-button type="primary" @click="() => navigateTo('/admin/dashboard')" class="flex items-center">
                            <el-icon class="mr-1">
                                <ArrowLeft />
                            </el-icon>
                            返回面板
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- 搜索和筛选区域 -->
            <div class="bg-white rounded-lg p-6 shadow-sm">
                <div class="flex items-center space-x-4">
                    <el-input
                        v-model="searchQuery"
                        placeholder="搜索文章标题或内容"
                        class="w-64"
                        clearable
                        @clear="handleSearch"
                        @keyup.enter="handleSearch"
                    >
                        <template #prefix>
                            <el-icon>
                                <Search />
                            </el-icon>
                        </template>
                    </el-input>
                    <el-select v-model="statusFilter" placeholder="状态筛选" class="w-32" clearable @change="handleSearch">
                        <el-option label="待审核" value="pending" />
                        <el-option label="已发布" value="published" />
                        <el-option label="已拒绝" value="rejected" />
                    </el-select>
                </div>
            </div>

            <!-- 文章列表 -->
            <div class="bg-white rounded-lg shadow-sm">
                <el-table :data="posts" v-loading="loading" style="width: 100%">
                    <el-table-column label="文章标题" prop="title" min-width="200" />
                    <el-table-column label="作者" width="120">
                        <template #default="{ row }">
                            {{ row.author.username }}
                        </template>
                    </el-table-column>
                    <el-table-column label="分类" width="120">
                        <template #default="{ row }">
                            <el-tag v-for="category in row.categories" :key="category.categoryId" class="mr-1">
                                {{ category.category.name }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="状态" width="100">
                        <template #default="{ row }">
                            <el-tag :type="getStatusType(row.status)">
                                {{ getStatusText(row.status) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="发布时间" width="180">
                        <template #default="{ row }">
                            {{ formatDate(row.createdAt) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="200" fixed="right">
                        <template #default="{ row }">
                            <div class="flex items-center space-x-2">
                                <el-button
                                    v-if="row.status === 'pending'"
                                    type="success"
                                    size="small"
                                    @click="handleUpdateStatus(row.id, 'published')"
                                >
                                    通过
                                </el-button>
                                <el-button
                                    v-if="row.status === 'pending'"
                                    type="danger"
                                    size="small"
                                    @click="handleUpdateStatus(row.id, 'rejected')"
                                >
                                    拒绝
                                </el-button>
                                <el-button
                                    v-if="row.status !== 'pending'"
                                    type="warning"
                                    size="small"
                                    @click="handleUpdateStatus(row.id, 'pending')"
                                >
                                    重置状态
                                </el-button>
                                <el-button type="primary" size="small" @click="handleViewPost(row)">
                                    查看
                                </el-button>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>

                <!-- 分页 -->
                <div class="flex justify-end p-4">
                    <el-pagination
                        v-model:current-page="currentPage"
                        v-model:page-size="pageSize"
                        :total="total"
                        :page-sizes="[10, 20, 50, 100]"
                        layout="total, sizes, prev, pager, next"
                        @size-change="handleSizeChange"
                        @current-change="handleCurrentChange"
                    />
                </div>
            </div>
        </div>

        <!-- 文章详情对话框 -->
        <el-dialog v-model="dialogVisible" title="文章详情" width="800px">
            <div v-if="selectedPost" class="space-y-4">
                <div>
                    <label class="text-gray-500">文章标题</label>
                    <p class="text-gray-900 mt-1">{{ selectedPost.title }}</p>
                </div>
                <div>
                    <label class="text-gray-500">作者</label>
                    <p class="text-gray-900 mt-1">{{ selectedPost.author.username }}</p>
                </div>
                <div>
                    <label class="text-gray-500">分类</label>
                    <p class="text-gray-900 mt-1">
                        <el-tag v-for="category in selectedPost.categories" :key="category.categoryId" class="mr-1">
                            {{ category.category.name }}
                        </el-tag>
                    </p>
                </div>
                <div>
                    <label class="text-gray-500">标签</label>
                    <p class="text-gray-900 mt-1">
                        <el-tag v-for="tag in selectedPost.tags" :key="tag" class="mr-1" type="info">
                            {{ tag }}
                        </el-tag>
                    </p>
                </div>
                <div>
                    <label class="text-gray-500">发布时间</label>
                    <p class="text-gray-900 mt-1">{{ formatDate(selectedPost.createdAt) }}</p>
                </div>
                <div>
                    <label class="text-gray-500">状态</label>
                    <p class="text-gray-900 mt-1">
                        <el-tag :type="getStatusType(selectedPost.status)">
                            {{ getStatusText(selectedPost.status) }}
                        </el-tag>
                    </p>
                </div>
                <div>
                    <label class="text-gray-500">文章内容</label>
                    <div class="mt-2 p-4 bg-gray-50 rounded-lg">
                        <div v-html="selectedPost.content" class="prose max-w-none"></div>
                    </div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup  >
import { ArrowLeft, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

definePageMeta({
    middleware: ['admin']
})

// 状态
const loading = ref(false)
const posts = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchQuery = ref('')
const statusFilter = ref('')
const dialogVisible = ref(false)
const selectedPost = ref(null)

// 获取文章列表
const fetchPosts = async () => {
    loading.value = true
    try {
        const params = new URLSearchParams({
            page: currentPage.value.toString(),
            pageSize: pageSize.value.toString()
        })

        if (searchQuery.value) {
            params.append('search', searchQuery.value)
        }

        if (statusFilter.value) {
            params.append('status', statusFilter.value)
        }

        const response = await $fetch(`/api/admin/user-posts/get?${params.toString()}`, {
            method: 'GET',
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })

        posts.value = response.data
        total.value = response.pagination.total
    } catch (error) {
        console.error('Failed to fetch posts:', error)
        ElMessage.error('获取文章列表失败')
    } finally {
        loading.value = false
    }
}

// 更新文章状态
const handleUpdateStatus = async (id, status) => {
    try {
        await ElMessageBox.confirm(
            `确定要${status === 'published' ? '通过' : status === 'rejected' ? '拒绝' : '重置'}这篇文章吗？`,
            '确认操作',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: status === 'published' ? 'success' : status === 'rejected' ? 'warning' : 'info'
            }
        )

        await $fetch(`/api/admin/user-posts/${id}/status`, {
            method: 'PUT',
            body: { status },
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })

        ElMessage.success('状态更新成功')
        fetchPosts()
    } catch (error) {
        if (error !== 'cancel') {
            console.error('Failed to update post status:', error)
            ElMessage.error('状态更新失败')
        }
    }
}

// 查看文章详情
const handleViewPost = (post) => {
    selectedPost.value = post
    dialogVisible.value = true
}

// 搜索和筛选
const handleSearch = () => {
    currentPage.value = 1
    fetchPosts()
}

// 分页
const handleSizeChange = (val) => {
    pageSize.value = val
    fetchPosts()
}

const handleCurrentChange = (val) => {
    currentPage.value = val
    fetchPosts()
}

// 工具函数
const getStatusType = (status) => {
    switch (status) {
        case 'published':
            return 'success'
        case 'rejected':
            return 'danger'
        default:
            return 'warning'
    }
}

const getStatusText = (status) => {
    switch (status) {
        case 'published':
            return '已发布'
        case 'rejected':
            return '已拒绝'
        default:
            return '待审核'
    }
}

const formatDate = (date) => {
    return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// 初始加载
onMounted(() => {
    fetchPosts()
})
</script>

<style>
.prose {
    max-width: 65ch;
    color: #374151;
}

.prose p {
    margin-top: 1.25em;
    margin-bottom: 1.25em;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4 {
    color: #111827;
    font-weight: 600;
    line-height: 1.25;
    margin-top: 2em;
    margin-bottom: 1em;
}

.prose img {
    margin-top: 2em;
    margin-bottom: 2em;
    border-radius: 0.375rem;
}

.prose a {
    color: #2563eb;
    text-decoration: underline;
}

.prose ul,
.prose ol {
    margin-top: 1.25em;
    margin-bottom: 1.25em;
    padding-left: 1.625em;
}

.prose li {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
}

.prose blockquote {
    font-style: italic;
    color: #6b7280;
    border-left-width: 0.25rem;
    border-left-color: #e5e7eb;
    margin-top: 1.6em;
    margin-bottom: 1.6em;
    padding-left: 1em;
}

.prose code {
    color: #111827;
    font-weight: 600;
    font-size: 0.875em;
}

.prose pre {
    color: #e5e7eb;
    background-color: #1f2937;
    overflow-x: auto;
    font-size: 0.875em;
    line-height: 1.7142857;
    margin-top: 1.7142857em;
    margin-bottom: 1.7142857em;
    border-radius: 0.375rem;
    padding: 0.8571429em 1.1428571em;
}
</style> 