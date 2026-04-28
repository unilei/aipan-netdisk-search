<template>
    <div class="admin-page-bg">
        <div class="mx-auto space-y-6">
            <!-- 头部区域 -->
            <div class="admin-card-bg rounded-lg p-6 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                            <nuxt-link to="/admin/dashboard" class="hover:text-primary flex items-center">
                                <el-icon class="mr-1">
                                    <House />
                                </el-icon>
                                后台管理面板
                            </nuxt-link>
                            <span>/</span>
                            <span class="text-gray-900 dark:text-white">论坛管理</span>
                        </div>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">论坛主题管理</h1>
                        <p class="text-gray-500 dark:text-gray-400 mt-1">审核和管理论坛主题帖</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <el-button type="primary" @click="handleCreateTopic" class="flex items-center">
                            <el-icon class="mr-1">
                                <Plus />
                            </el-icon>
                            发布主题
                        </el-button>
                        <el-button @click="() => navigateTo('/admin/forum/categories')" class="flex items-center">
                            <el-icon class="mr-1">
                                <Menu />
                            </el-icon>
                            分类管理
                        </el-button>
                        <el-button @click="() => navigateTo('/admin/forum/posts')" class="flex items-center">
                            <el-icon class="mr-1">
                                <ChatDotRound />
                            </el-icon>
                            回复管理
                        </el-button>
                        <el-button @click="() => navigateTo('/admin/dashboard')" class="flex items-center">
                            <el-icon class="mr-1">
                                <ArrowLeft />
                            </el-icon>
                            返回面板
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- 过滤器区域 -->
            <div class="admin-card-bg rounded-lg p-6 shadow-sm">
                <div class="flex flex-wrap items-center gap-4">
                    <div class="w-64">
                        <el-select v-model="filters.status" placeholder="审核状态" clearable class="w-full">
                            <el-option label="全部" value="" />
                            <el-option label="待审核" value="pending" />
                            <el-option label="已批准" value="approved" />
                            <el-option label="已拒绝" value="rejected" />
                        </el-select>
                    </div>
                    <div class="w-64">
                        <el-select v-model="filters.categoryId" placeholder="选择分类" clearable class="w-full">
                            <el-option label="全部分类" value="" />
                            <el-option v-for="category in categories" :key="category.id" :label="category.name"
                                :value="category.id" />
                        </el-select>
                    </div>
                    <div class="flex-1">
                        <el-input v-model="filters.keyword" placeholder="搜索标题或内容" clearable class="w-full"
                            @keyup.enter="loadTopics" />
                    </div>
                    <el-button type="primary" @click="loadTopics" class="flex items-center">
                        <el-icon class="mr-1">
                            <Search />
                        </el-icon>
                        搜索
                    </el-button>
                    <el-button @click="resetFilters" class="flex items-center">
                        <el-icon class="mr-1">
                            <Refresh />
                        </el-icon>
                        重置
                    </el-button>
                </div>
            </div>

            <!-- 表格区域 -->
            <div class="admin-card-bg rounded-lg p-6 shadow-sm">
                <div v-if="loading" class="py-10">
                    <el-skeleton :rows="5" animated />
                </div>

                <div v-else-if="!topics.length" class="text-center py-10">
                    <el-empty description="暂无主题" />
                    <p class="mt-4 text-gray-500">当前筛选条件下没有找到主题</p>
                </div>

                <div v-else>
                    <el-table :data="topics" style="width: 100%" border>
                        <el-table-column type="expand">
                            <template #default="props">
                                <div class="p-4 bg-gray-50">
                                    <div class="mb-4">
                                        <h3 class="font-medium text-gray-700 mb-2">主题内容预览：</h3>
                                        <div class="bg-white p-3 rounded border border-gray-200 text-sm text-gray-700 prose-sm max-w-none"
                                            v-html="formatContent(props.row.content)"></div>
                                    </div>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="id" label="ID" width="80" align="center" />
                        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip>
                            <template #default="scope">
                                <div class="flex items-center">
                                    <span v-if="scope.row.isSticky" class="mr-1 text-yellow-500">
                                        <el-tooltip content="置顶" placement="top">
                                            <i class="fas fa-thumbtack"></i>
                                        </el-tooltip>
                                    </span>
                                    <span v-if="scope.row.isLocked" class="mr-1 text-gray-500">
                                        <el-tooltip content="已锁定" placement="top">
                                            <i class="fas fa-lock"></i>
                                        </el-tooltip>
                                    </span>
                                    <a @click="previewTopic(scope.row)"
                                        class="cursor-pointer text-blue-500 hover:text-blue-700">
                                        {{ scope.row.title }}
                                    </a>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="category.name" label="分类" width="150" />
                        <el-table-column prop="author.username" label="作者" width="120" />
                        <el-table-column prop="createdAt" label="发布时间" width="180">
                            <template #default="scope">
                                {{ formatDate(scope.row.createdAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="status" label="状态" width="100" align="center">
                            <template #default="scope">
                                <el-tag v-if="scope.row.status === 'pending'" type="warning">待审核</el-tag>
                                <el-tag v-else-if="scope.row.status === 'approved'" type="success">已批准</el-tag>
                                <el-tag v-else-if="scope.row.status === 'rejected'" type="danger">已拒绝</el-tag>
                                <el-tag v-else type="info">未知</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="280" fixed="right">
                            <template #default="scope">
                                <div class="flex space-x-2">
                                    <el-button v-if="scope.row.status === 'pending'" size="small" type="success"
                                        @click="approveTopic(scope.row)">
                                        <el-icon class="mr-1">
                                            <Check />
                                        </el-icon>
                                        批准
                                    </el-button>
                                    <el-button v-if="scope.row.status === 'pending'" size="small" type="danger"
                                        @click="rejectTopic(scope.row)">
                                        <el-icon class="mr-1">
                                            <Close />
                                        </el-icon>
                                        拒绝
                                    </el-button>
                                    <el-button size="small" type="primary" @click="editTopic(scope.row)">
                                        <el-icon class="mr-1">
                                            <Edit />
                                        </el-icon>
                                        编辑
                                    </el-button>
                                    <el-dropdown trigger="click">
                                        <el-button size="small">
                                            <el-icon class="mr-1">
                                                <MoreFilled />
                                            </el-icon>
                                            更多
                                        </el-button>
                                        <template #dropdown>
                                            <el-dropdown-menu>
                                                <el-dropdown-item @click="toggleSticky(scope.row)">
                                                    <i class="fas fa-thumbtack mr-1"></i>
                                                    {{ scope.row.isSticky ? '取消置顶' : '置顶' }}
                                                </el-dropdown-item>
                                                <el-dropdown-item @click="toggleLock(scope.row)">
                                                    <i class="fas fa-lock mr-1"></i>
                                                    {{ scope.row.isLocked ? '解锁主题' : '锁定主题' }}
                                                </el-dropdown-item>
                                                <el-dropdown-item divided @click="confirmDelete(scope.row)">
                                                    <span class="text-red-500">
                                                        <i class="fas fa-trash-alt mr-1"></i>
                                                        删除
                                                    </span>
                                                </el-dropdown-item>
                                            </el-dropdown-menu>
                                        </template>
                                    </el-dropdown>
                                </div>
                            </template>
                        </el-table-column>
                    </el-table>

                    <!-- 分页 -->
                    <div class="flex justify-end mt-5">
                        <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.pageSize"
                            :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
                            :total="pagination.total" @size-change="handleSizeChange"
                            @current-change="handleCurrentChange" />
                    </div>
                </div>
            </div>
        </div>

        <!-- 主题预览对话框 -->
        <el-dialog v-model="previewDialogVisible" title="主题详情" width="800px">
            <div v-if="selectedTopic" class="space-y-4">
                <div class="border-b pb-4">
                    <h2 class="text-xl font-bold">{{ selectedTopic.title }}</h2>
                    <div class="flex items-center text-sm text-gray-500 mt-2">
                        <span class="mr-4">作者: {{ selectedTopic.author?.username }}</span>
                        <span class="mr-4">分类: {{ selectedTopic.category?.name }}</span>
                        <span>发布于: {{ formatDate(selectedTopic.createdAt) }}</span>
                    </div>
                </div>
                <div class="prose max-w-none" v-html="formatContent(selectedTopic.content)"></div>
            </div>
            <template #footer>
                <div class="flex justify-between">
                    <div>
                        <el-button v-if="selectedTopic?.status === 'pending'" type="success"
                            @click="approveTopic(selectedTopic)">
                            批准主题
                        </el-button>
                        <el-button v-if="selectedTopic?.status === 'pending'" type="danger"
                            @click="rejectTopic(selectedTopic)">
                            拒绝主题
                        </el-button>
                    </div>
                    <el-button @click="previewDialogVisible = false">关闭</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 编辑主题对话框 -->
        <el-dialog v-model="editDialogVisible" :title="isEdit ? '编辑主题' : '发布主题'" width="800px" destroy-on-close>
            <el-form v-if="form" :model="form" label-width="80px" :rules="rules" ref="formRef">
                <el-form-item label="标题" prop="title">
                    <el-input v-model="form.title" placeholder="请输入主题标题" />
                </el-form-item>
                <el-form-item label="分类" prop="categoryId">
                    <el-select v-model="form.categoryId" placeholder="选择分类" class="w-full">
                        <el-option v-for="category in categories" :key="category.id" :label="category.name"
                            :value="category.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="内容" prop="content">
                    <client-only>
                        <div id="editor-container" class="w-full h-96 border border-gray-300 rounded"></div>
                    </client-only>
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-select v-model="form.status" placeholder="选择状态" class="w-full">
                        <el-option label="待审核" value="pending" />
                        <el-option label="已批准" value="approved" />
                        <el-option label="已拒绝" value="rejected" />
                    </el-select>
                </el-form-item>
                <el-form-item label="选项">
                    <div class="flex items-center space-x-4">
                        <el-checkbox v-model="form.isSticky">置顶主题</el-checkbox>
                        <el-checkbox v-model="form.isLocked">锁定主题</el-checkbox>
                    </div>
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="flex justify-end space-x-3">
                    <el-button @click="editDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 删除确认对话框 -->
        <el-dialog v-model="deleteDialogVisible" title="确认删除" width="400px">
            <p>确定要删除主题 "{{ selectedTopic?.title }}" 吗？</p>
            <p class="text-red-500 mt-2">注意: 删除主题将会同时删除该主题下的所有回复！</p>
            <template #footer>
                <el-button @click="deleteDialogVisible = false">取消</el-button>
                <el-button type="danger" :disabled="deleting" @click="deleteTopic">
                    {{ deleting ? '删除中...' : '确认删除' }}
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
    House, Search, Refresh, ArrowLeft, Menu, ChatDotRound, Edit, Delete,
    Check, Close, MoreFilled, Plus
} from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { format } from 'date-fns'
import { marked } from 'marked'
import { sanitizeHtml } from '~/utils/sanitize'

definePageMeta({
    layout: 'admin',
    middleware: ['admin']
})

// 初始化数据
const loading = ref(false)
const topics = ref([])
const categories = ref([])
const filters = reactive({
    status: '',
    categoryId: '',
    keyword: ''
})
const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 0
})

// 对话框状态
const previewDialogVisible = ref(false)
const editDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const selectedTopic = ref(null)
const isEdit = ref(false)
const submitting = ref(false)
const deleting = ref(false)

// 表单数据和验证规则
const formRef = ref(null)
const form = reactive({
    id: null,
    title: '',
    content: '',
    categoryId: null,
    status: 'pending',
    isSticky: false,
    isLocked: false
})
const rules = {
    title: [{ required: true, message: '请输入主题标题', trigger: 'blur' }],
    content: [{ required: true, message: '请输入主题内容', trigger: 'blur' }],
    categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 加载分类
async function loadCategories() {
    try {
        const { data } = await useFetch('/api/forum/categories')
        if (data.value?.success) {
            categories.value = data.value.data
        }
    } catch (error) {
        console.error('加载分类失败:', error)
        ElMessage.error('加载分类失败')
    }
}

// 加载主题列表
async function loadTopics() {
    loading.value = true
    try {
        const query = {
            page: pagination.current,
            pageSize: pagination.pageSize
        }

        if (filters.status) query.status = filters.status
        if (filters.categoryId) query.categoryId = filters.categoryId
        if (filters.keyword) query.keyword = filters.keyword

        const token = useCookie('token').value
        const response = await $fetch('/api/admin/forum/topics', {
            method: 'GET',
            params: query,
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (response.success) {
            topics.value = response.data.topics
            pagination.total = response.data.pagination.total
        } else {
            ElMessage.error(response.message || '加载主题失败')
        }
    } catch (error) {
        console.error('加载主题失败:', error)
        ElMessage.error('加载主题失败')
    } finally {
        loading.value = false
    }
}

// 重置筛选条件
function resetFilters() {
    filters.status = ''
    filters.categoryId = ''
    filters.keyword = ''
    pagination.current = 1
    loadTopics()
}

// 分页事件处理
function handleSizeChange(size) {
    pagination.pageSize = size
    loadTopics()
}

function handleCurrentChange(page) {
    pagination.current = page
    loadTopics()
}

// 预览主题
function previewTopic(topic) {
    selectedTopic.value = topic
    previewDialogVisible.value = true
}

// 编辑主题
function editTopic(topic) {
    isEdit.value = true
    resetForm()

    form.id = topic.id
    form.title = topic.title
    form.content = topic.content
    form.categoryId = topic.categoryId
    form.status = topic.status || 'pending'
    form.isSticky = !!topic.isSticky
    form.isLocked = !!topic.isLocked

    // 打开编辑对话框，使用nextTick确保DOM已更新
    editDialogVisible.value = true
    nextTick(() => {
        initEditor(topic.content)
    })
}

// 创建新主题
function handleCreateTopic() {
    isEdit.value = false
    resetForm()
    editDialogVisible.value = true
    nextTick(() => {
        initEditor('')
    })
}

// 初始化编辑器
let editor = null
function initEditor(content) {
    // 使用markdown编辑器或富文本编辑器
    // 这里简化为textarea，实际应该使用一个完整的编辑器
    setTimeout(() => {
        const container = document.getElementById('editor-container')
        if (container) {
            container.innerHTML = `<textarea id="content-editor" class="w-full h-full p-2">${content}</textarea>`
            form.content = content

            const textarea = document.getElementById('content-editor')
            textarea.addEventListener('input', (e) => {
                form.content = e.target.value
            })
        }
    }, 100)
}

// 重置表单
function resetForm() {
    form.id = null
    form.title = ''
    form.content = ''
    form.categoryId = null
    form.status = 'pending'
    form.isSticky = false
    form.isLocked = false
}

// 提交表单
async function submitForm() {
    if (submitting.value) return

    if (!formRef.value) {
        ElMessage.error('表单验证失败')
        return
    }

    await formRef.value.validate(async (valid) => {
        if (!valid) return

        submitting.value = true
        try {
            const endpoint = isEdit.value
                ? `/api/admin/forum/topics/${form.id}`
                : '/api/admin/forum/topics'

            const method = isEdit.value ? 'PUT' : 'POST'
            const token = useCookie('token').value

            const response = await $fetch(endpoint, {
                method,
                body: {
                    title: form.title,
                    content: form.content,
                    categoryId: form.categoryId,
                    status: form.status,
                    isSticky: form.isSticky,
                    isLocked: form.isLocked
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (response.success) {
                ElMessage.success(isEdit.value ? '主题更新成功' : '主题创建成功')
                editDialogVisible.value = false
                loadTopics()
            } else {
                ElMessage.error(response.message || (isEdit.value ? '更新失败' : '创建失败'))
            }
        } catch (error) {
            console.error(isEdit.value ? '更新主题失败:' : '创建主题失败:', error)
            ElMessage.error(isEdit.value ? '更新主题失败' : '创建主题失败')
        } finally {
            submitting.value = false
        }
    })
}

// 批准主题
async function approveTopic(topic) {
    try {
        const token = useCookie('token').value
        const response = await $fetch(`/api/admin/forum/topics/${topic.id}/approve`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (response.success) {
            ElMessage.success('主题已批准')
            // 关闭预览对话框如果打开了
            if (previewDialogVisible.value) {
                previewDialogVisible.value = false
            }
            loadTopics()
        } else {
            ElMessage.error(response.message || '批准失败')
        }
    } catch (error) {
        console.error('批准主题失败:', error)
        ElMessage.error('批准主题失败')
    }
}

// 拒绝主题
async function rejectTopic(topic) {
    try {
        const token = useCookie('token').value
        const response = await $fetch(`/api/admin/forum/topics/${topic.id}/reject`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (response.success) {
            ElMessage.success('主题已拒绝')
            // 关闭预览对话框如果打开了
            if (previewDialogVisible.value) {
                previewDialogVisible.value = false
            }
            loadTopics()
        } else {
            ElMessage.error(response.message || '拒绝失败')
        }
    } catch (error) {
        console.error('拒绝主题失败:', error)
        ElMessage.error('拒绝主题失败')
    }
}

// 置顶/取消置顶
async function toggleSticky(topic) {
    try {
        const token = useCookie('token').value
        const response = await $fetch(`/api/admin/forum/topics/${topic.id}/toggle-sticky`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (response.success) {
            ElMessage.success(topic.isSticky ? '已取消置顶' : '已设为置顶')
            loadTopics()
        } else {
            ElMessage.error(response.message || '操作失败')
        }
    } catch (error) {
        console.error('切换置顶状态失败:', error)
        ElMessage.error('操作失败')
    }
}

// 锁定/解锁
async function toggleLock(topic) {
    try {
        const token = useCookie('token').value
        const response = await $fetch(`/api/admin/forum/topics/${topic.id}/toggle-lock`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (response.success) {
            ElMessage.success(topic.isLocked ? '主题已解锁' : '主题已锁定')
            loadTopics()
        } else {
            ElMessage.error(response.message || '操作失败')
        }
    } catch (error) {
        console.error('切换锁定状态失败:', error)
        ElMessage.error('操作失败')
    }
}

// 删除前确认
function confirmDelete(topic) {
    selectedTopic.value = topic
    deleteDialogVisible.value = true
}

// 删除主题
async function deleteTopic(topicId) {
    if (!selectedTopic.value || deleting.value) return

    deleting.value = true

    try {

        const token = useCookie('token').value
        const response = await $fetch(`/api/admin/forum/topics/${selectedTopic.value.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (response.success) {
            ElMessage.success('主题已删除')
            deleteDialogVisible.value = false
            loadTopics()
        } else {
            ElMessage.error(response.message || '删除失败')
        }
    } catch (error) {
        console.error('删除主题失败:', error)
        ElMessage.error('删除主题失败')
    } finally {
        deleting.value = false
    }
}

// 格式化日期
function formatDate(date) {
    if (!date) return '未知'
    try {
        return format(new Date(date), 'yyyy-MM-dd HH:mm:ss')
    } catch (e) {
        return '日期格式错误'
    }
}

// 格式化内容（将Markdown转为HTML）
function formatContent(content) {
    if (!content) return ''
    try {
        return sanitizeHtml(marked(content))
    } catch (e) {
        return content
    }
}

// 初始化页面
onMounted(async () => {
    await loadCategories()
    await loadTopics()
})
</script>

<style>
@import "tailwindcss" reference;

.prose {
    @apply text-gray-900 leading-normal break-words;
}

.prose p {
    @apply my-4;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4 {
    @apply font-bold my-6 text-gray-900;
}

.prose h1 {
    @apply text-2xl;
}

.prose h2 {
    @apply text-xl;
}

.prose h3 {
    @apply text-lg;
}

.prose ul,
.prose ol {
    @apply pl-8 my-4;
}

.prose ul {
    @apply list-disc;
}

.prose ol {
    @apply list-decimal;
}

.prose pre {
    @apply bg-gray-100 p-4 rounded;
}

.prose code {
    @apply bg-gray-100 px-1 py-0.5 rounded text-sm;
}

.prose blockquote {
    @apply border-l-4 border-gray-300 pl-4 py-2 my-4 text-gray-600 italic;
}

.prose a {
    @apply text-blue-600 hover:text-blue-800 hover:underline;
}
</style>