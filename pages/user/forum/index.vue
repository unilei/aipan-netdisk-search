<template>
    <div class="min-h-[calc(100vh-60px)] bg-gray-50 dark:bg-gray-900">
        <div class="max-w-[1240px] mx-auto p-6">
            <!-- 头部区域 -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
                <div class="relative h-24 bg-gradient-to-r from-blue-500 to-purple-500">
                    <div class="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white/10 backdrop-blur-sm">
                        <div class="flex items-center space-x-2 text-sm text-white">
                            <nuxt-link to="/user/dashboard"
                                class="hover:text-white/80 flex items-center transition-colors duration-200">
                                <el-icon class="mr-1">
                                    <House />
                                </el-icon>
                                用户中心
                            </nuxt-link>
                            <span>/</span>
                            <span>我的论坛</span>
                        </div>
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-2">我的论坛内容</h1>
                            <p class="text-gray-500 dark:text-gray-400">管理您发布的主题和回复</p>
                        </div>
                        <el-button @click="() => navigateTo('/user/dashboard')"
                            class="flex items-center hover:scale-105 transition-transform duration-200">
                            <el-icon class="mr-1">
                                <ArrowLeft />
                            </el-icon>
                            返回用户中心
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- 标签页切换 -->
            <el-tabs v-model="activeTab" class="mb-6">
                <el-tab-pane label="我的主题" name="topics">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
                        <!-- 主题筛选器 -->
                        <div class="flex flex-wrap gap-3 mb-4">
                            <el-select v-model="topicsFilter.status" placeholder="状态" class="w-32">
                                <el-option label="全部状态" value="" />
                                <el-option label="待审核" value="pending" />
                                <el-option label="已通过" value="approved" />
                                <el-option label="已拒绝" value="rejected" />
                            </el-select>
                            <el-input v-model="topicsFilter.keyword" placeholder="搜索主题"
                                class="w-60 hover:shadow-sm transition-shadow duration-200" clearable />
                            <el-button type="primary" @click="fetchTopics"
                                class="hover:scale-105 transition-transform duration-200">搜索</el-button>
                            <el-button @click="resetTopicsFilter"
                                class="hover:scale-105 transition-transform duration-200">重置</el-button>
                        </div>

                        <!-- 主题列表 -->
                        <div v-if="loading.topics" class="py-10 text-center">
                            <el-skeleton :rows="5" animated />
                        </div>
                        <div v-else-if="topics.length === 0" class="py-10 text-center">
                            <i class="fas fa-inbox text-gray-300 dark:text-gray-600 text-5xl mb-4"></i>
                            <p class="text-gray-500 dark:text-gray-400">您还没有发布过主题</p>
                        </div>
                        <div v-else>
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead class="bg-gray-50 dark:bg-gray-750">
                                        <tr>
                                            <th
                                                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">
                                                主题</th>
                                            <th
                                                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">
                                                状态</th>
                                            <th
                                                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">
                                                创建时间</th>
                                            <th
                                                class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">
                                                操作</th>
                                        </tr>
                                    </thead>
                                    <tbody
                                        class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        <tr v-for="topic in topics" :key="topic.id"
                                            class="hover:bg-gray-50 dark:hover:bg-gray-750">
                                            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                                                <div class="flex items-start">
                                                    <div>
                                                        <nuxt-link
                                                            :to="topic.status === 'approved' ? `/forum/topic/${topic.slug}` : '#'"
                                                            class="font-medium hover:text-blue-600 dark:hover:text-blue-400"
                                                            :class="{ 'text-gray-400 dark:text-gray-500 pointer-events-none': topic.status !== 'approved' }">
                                                            {{ truncate(topic.title, 50) }}
                                                        </nuxt-link>
                                                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            <span>{{ topic.category?.name || '未分类' }}</span>
                                                            <span class="mx-1">·</span>
                                                            <span>{{ topic._count?.posts || 0 }}个回复</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="px-4 py-3 text-sm">
                                                <el-tag :type="getStatusType(topic.status)" size="small"
                                                    class="rounded-md">
                                                    {{ getStatusText(topic.status) }}
                                                </el-tag>
                                            </td>
                                            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                {{ formatDate(topic.createdAt) }}
                                            </td>
                                            <td class="px-4 py-3 text-sm text-right">
                                                <el-button v-if="topic.status === 'approved'" size="small" link
                                                    @click="viewTopic(topic)"
                                                    class="hover:scale-105 transition-transform duration-200">
                                                    <i class="fas fa-eye"></i>
                                                </el-button>
                                                <el-button size="small" link @click="editTopic(topic)"
                                                    class="hover:scale-105 transition-transform duration-200">
                                                    <i class="fas fa-edit"></i>
                                                </el-button>
                                                <el-button size="small" link
                                                    class="text-red-500 hover:scale-105 transition-transform duration-200"
                                                    @click="confirmDeleteTopic(topic)">
                                                    <i class="fas fa-trash"></i>
                                                </el-button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <!-- 分页 -->
                            <div class="mt-4 flex justify-end">
                                <el-pagination v-model:currentPage="topicsPagination.page"
                                    :page-size="topicsPagination.pageSize" :total="topicsPagination.total"
                                    layout="prev, pager, next" @current-change="onTopicsPageChange" />
                            </div>
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane label="我的回复" name="replies">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
                        <!-- 回复筛选器 -->
                        <div class="flex flex-wrap gap-3 mb-4">
                            <el-select v-model="repliesFilter.status" placeholder="状态" class="w-32">
                                <el-option label="全部状态" value="" />
                                <el-option label="待审核" value="pending" />
                                <el-option label="已通过" value="approved" />
                                <el-option label="已拒绝" value="rejected" />
                            </el-select>
                            <el-input v-model="repliesFilter.keyword" placeholder="搜索内容"
                                class="w-60 hover:shadow-sm transition-shadow duration-200" clearable />
                            <el-button type="primary" @click="fetchReplies"
                                class="hover:scale-105 transition-transform duration-200">搜索</el-button>
                            <el-button @click="resetRepliesFilter"
                                class="hover:scale-105 transition-transform duration-200">重置</el-button>
                        </div>

                        <!-- 回复列表 -->
                        <div v-if="loading.replies" class="py-10 text-center">
                            <el-skeleton :rows="5" animated />
                        </div>
                        <div v-else-if="replies.length === 0" class="py-10 text-center">
                            <i class="fas fa-comment-slash text-gray-300 dark:text-gray-600 text-5xl mb-4"></i>
                            <p class="text-gray-500 dark:text-gray-400">您还没有发表过回复</p>
                        </div>
                        <div v-else>
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead class="bg-gray-50 dark:bg-gray-750">
                                        <tr>
                                            <th
                                                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">
                                                内容</th>
                                            <th
                                                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">
                                                所属主题</th>
                                            <th
                                                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">
                                                状态</th>
                                            <th
                                                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">
                                                创建时间</th>
                                            <th
                                                class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">
                                                操作</th>
                                        </tr>
                                    </thead>
                                    <tbody
                                        class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        <tr v-for="reply in replies" :key="reply.id"
                                            class="hover:bg-gray-50 dark:hover:bg-gray-750">
                                            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                                                <div class="line-clamp-2">{{ truncate(stripHtml(reply.content), 50) }}
                                                </div>
                                            </td>
                                            <td class="px-4 py-3 text-sm">
                                                <nuxt-link
                                                    :to="reply.topic?.slug ? `/forum/topic/${reply.topic.slug}` : '#'"
                                                    class="hover:text-blue-600 dark:hover:text-blue-400"
                                                    :class="{ 'text-gray-400 dark:text-gray-500 pointer-events-none': !reply.topic?.slug }">
                                                    {{ truncate(reply.topic?.title || '未知主题', 20) }}
                                                </nuxt-link>
                                            </td>
                                            <td class="px-4 py-3 text-sm">
                                                <el-tag :type="getStatusType(reply.status)" size="small"
                                                    class="rounded-md">
                                                    {{ getStatusText(reply.status) }}
                                                </el-tag>
                                            </td>
                                            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                {{ formatDate(reply.createdAt) }}
                                            </td>
                                            <td class="px-4 py-3 text-sm text-right">
                                                <el-button v-if="reply.topic?.slug" size="small" link
                                                    @click="viewReplyInTopic(reply)"
                                                    class="hover:scale-105 transition-transform duration-200">
                                                    <i class="fas fa-eye"></i>
                                                </el-button>
                                                <el-button size="small" link @click="editReply(reply)"
                                                    class="hover:scale-105 transition-transform duration-200">
                                                    <i class="fas fa-edit"></i>
                                                </el-button>
                                                <el-button size="small" link
                                                    class="text-red-500 hover:scale-105 transition-transform duration-200"
                                                    @click="confirmDeleteReply(reply)">
                                                    <i class="fas fa-trash"></i>
                                                </el-button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <!-- 分页 -->
                            <div class="mt-4 flex justify-end">
                                <el-pagination v-model:currentPage="repliesPagination.page"
                                    :page-size="repliesPagination.pageSize" :total="repliesPagination.total"
                                    layout="prev, pager, next" @current-change="onRepliesPageChange" />
                            </div>
                        </div>
                    </div>
                </el-tab-pane>
            </el-tabs>

            <!-- 编辑主题对话框 -->
            <el-dialog v-model="dialogs.editTopic.visible" :title="dialogs.editTopic.title" width="60%"
                :before-close="closeEditTopicDialog" class="topic-dialog">
                <div v-if="dialogs.editTopic.visible">
                    <el-form :model="dialogs.editTopic.form" label-position="top" class="space-y-6">
                        <el-form-item label="标题">
                            <el-input v-model="dialogs.editTopic.form.title" placeholder="请输入主题标题"
                                class="hover:shadow-sm transition-shadow duration-200" />
                        </el-form-item>
                        <el-form-item label="分类">
                            <el-select v-model="dialogs.editTopic.form.categoryId" placeholder="请选择分类"
                                class="w-full hover:shadow-sm transition-shadow duration-200">
                                <el-option v-for="category in categories" :key="category.id" :label="category.name"
                                    :value="category.id" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="内容">
                            <client-only>
                                <MdEditor v-model="dialogs.editTopic.form.content" language="zh-CN" />
                            </client-only>
                        </el-form-item>
                    </el-form>
                    <div class="flex justify-end gap-3 mt-4">
                        <el-button @click="closeEditTopicDialog"
                            class="hover:scale-105 transition-transform duration-200">取消</el-button>
                        <el-button type="primary" @click="updateTopic" :loading="loading.updateTopic"
                            class="hover:scale-105 transition-transform duration-200">保存</el-button>
                    </div>
                </div>
            </el-dialog>

            <!-- 编辑回复对话框 -->
            <el-dialog v-model="dialogs.editReply.visible" :title="dialogs.editReply.title" width="60%"
                :before-close="closeEditReplyDialog" class="reply-dialog">
                <div v-if="dialogs.editReply.visible">
                    <el-form :model="dialogs.editReply.form" label-position="top" class="space-y-6">
                        <el-form-item label="内容">
                            <client-only>
                                <MdEditor v-model="dialogs.editReply.form.content" language="zh-CN" />
                            </client-only>
                        </el-form-item>
                    </el-form>
                    <div class="flex justify-end gap-3 mt-4">
                        <el-button @click="closeEditReplyDialog"
                            class="hover:scale-105 transition-transform duration-200">取消</el-button>
                        <el-button type="primary" @click="updateReply" :loading="loading.updateReply"
                            class="hover:scale-105 transition-transform duration-200">保存</el-button>
                    </div>
                </div>
            </el-dialog>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useUserStore } from '~/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { ArrowLeft, House } from '@element-plus/icons-vue'

definePageMeta({
    middleware: ['auth']
})

const userStore = useUserStore()
const activeTab = ref('topics')

// 状态和筛选器
const loading = reactive({
    topics: false,
    replies: false,
    updateTopic: false,
    updateReply: false
})

const topicsFilter = reactive({
    status: '',
    keyword: ''
})

const repliesFilter = reactive({
    status: '',
    keyword: ''
})

// 数据存储
const topics = ref([])
const replies = ref([])
const categories = ref([])
const topicsPagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0
})

const repliesPagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0
})

// 对话框状态
const dialogs = reactive({
    editTopic: {
        visible: false,
        title: '编辑主题',
        topicId: null,
        form: {
            title: '',
            content: '',
            categoryId: null
        }
    },
    editReply: {
        visible: false,
        title: '编辑回复',
        replyId: null,
        form: {
            content: ''
        }
    }
})

// 获取主题列表
const fetchTopics = async () => {
    loading.topics = true
    try {

        const response = await $fetch('/api/user/forum/topics', {
            params: {
                page: topicsPagination.page,
                pageSize: topicsPagination.pageSize,
                status: topicsFilter.status,
                keyword: topicsFilter.keyword
            },
            headers: {
                'Authorization': `Bearer ${userStore.token}`
            }
        })

        if (response.success) {
            topics.value = response.data.topics
            topicsPagination.total = response.data.pagination.total
        } else {
            ElMessage.error(response.message || '获取主题列表失败')
        }
    } catch (error) {
        console.error('获取主题列表失败:', error)
        ElMessage.error('获取主题列表失败')
    } finally {
        loading.topics = false
    }
}

// 获取回复列表
const fetchReplies = async () => {
    loading.replies = true
    try {
        const response = await $fetch('/api/user/forum/replies', {
            params: {
                page: repliesPagination.page,
                pageSize: repliesPagination.pageSize,
                status: repliesFilter.status,
                keyword: repliesFilter.keyword
            },
            headers: {
                'Authorization': `Bearer ${userStore.token}`
            }
        })

        if (response.success) {
            replies.value = response.data.replies
            repliesPagination.total = response.data.pagination.total
        } else {
            ElMessage.error(response.message || '获取回复列表失败')
        }
    } catch (error) {
        console.error('获取回复列表失败:', error)
        ElMessage.error('获取回复列表失败')
    } finally {
        loading.replies = false
    }
}

// 获取分类列表
const fetchCategories = async () => {
    try {
        const response = await $fetch('/api/forum/categories', {
            headers: {
                'Authorization': `Bearer ${userStore.token}`
            }
        })
        if (response.success) {
            categories.value = response.data
        }
    } catch (error) {
        console.error('获取分类列表失败:', error)
    }
}

// 重置筛选器
const resetTopicsFilter = () => {
    topicsFilter.status = ''
    topicsFilter.keyword = ''
    topicsPagination.page = 1
    fetchTopics()
}

const resetRepliesFilter = () => {
    repliesFilter.status = ''
    repliesFilter.keyword = ''
    repliesPagination.page = 1
    fetchReplies()
}

// 分页变化
const onTopicsPageChange = (page) => {
    topicsPagination.page = page
    fetchTopics()
}

const onRepliesPageChange = (page) => {
    repliesPagination.page = page
    fetchReplies()
}

// 查看主题
const viewTopic = (topic) => {
    navigateTo(`/forum/topic/${topic.slug}`)
}

// 查看回复所在的主题
const viewReplyInTopic = (reply) => {
    if (reply.topic?.slug) {
        navigateTo(`/forum/topic/${reply.topic.slug}`)
    }
}

// 编辑主题
const editTopic = (topic) => {
    dialogs.editTopic.topicId = topic.id
    dialogs.editTopic.form.title = topic.title
    dialogs.editTopic.form.content = topic.content
    dialogs.editTopic.form.categoryId = topic.categoryId
    dialogs.editTopic.visible = true
}

// 关闭编辑主题对话框
const closeEditTopicDialog = () => {
    dialogs.editTopic.visible = false
    dialogs.editTopic.topicId = null
    dialogs.editTopic.form.title = ''
    dialogs.editTopic.form.content = ''
    dialogs.editTopic.form.categoryId = null
}

// 更新主题
const updateTopic = async () => {
    if (!dialogs.editTopic.form.title.trim()) {
        ElMessage.warning('标题不能为空')
        return
    }

    if (!dialogs.editTopic.form.content.trim()) {
        ElMessage.warning('内容不能为空')
        return
    }

    if (!dialogs.editTopic.form.categoryId) {
        ElMessage.warning('请选择分类')
        return
    }

    loading.updateTopic = true
    try {
        const response = await $fetch(`/api/user/forum/topics/${dialogs.editTopic.topicId}`, {
            method: 'PUT',
            body: {
                title: dialogs.editTopic.form.title,
                content: dialogs.editTopic.form.content,
                categoryId: dialogs.editTopic.form.categoryId
            },
            headers: {
                'Authorization': `Bearer ${userStore.token}`
            }
        })

        if (response.success) {
            ElMessage.success('主题更新成功')
            closeEditTopicDialog()
            fetchTopics()
        } else {
            ElMessage.error(response.message || '更新主题失败')
        }
    } catch (error) {
        console.error('更新主题失败:', error)
        ElMessage.error('更新主题失败')
    } finally {
        loading.updateTopic = false
    }
}

// 确认删除主题
const confirmDeleteTopic = (topic) => {
    ElMessageBox.confirm(
        '确定要删除这个主题吗？删除后无法恢复。',
        '删除确认',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(() => {
        deleteTopic(topic.id)
    }).catch(() => { })
}

// 删除主题
const deleteTopic = async (topicId) => {
    try {
        const response = await $fetch(`/api/user/forum/topics/${topicId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${userStore.token}`
            }
        })

        if (response.success) {
            ElMessage.success('主题已删除')
            fetchTopics()
        } else {
            ElMessage.error(response.message || '删除主题失败')
        }
    } catch (error) {
        console.error('删除主题失败:', error)
        ElMessage.error('删除主题失败')
    }
}

// 编辑回复
const editReply = (reply) => {
    dialogs.editReply.replyId = reply.id
    dialogs.editReply.form.content = reply.content
    dialogs.editReply.visible = true
}

// 关闭编辑回复对话框
const closeEditReplyDialog = () => {
    dialogs.editReply.visible = false
    dialogs.editReply.replyId = null
    dialogs.editReply.form.content = ''
}

// 更新回复
const updateReply = async () => {
    if (!dialogs.editReply.form.content.trim()) {
        ElMessage.warning('回复内容不能为空')
        return
    }

    loading.updateReply = true
    try {
        const response = await $fetch(`/api/user/forum/replies/${dialogs.editReply.replyId}`, {
            method: 'PUT',
            body: {
                content: dialogs.editReply.form.content
            },
            headers: {
                'Authorization': `Bearer ${userStore.token}`
            }
        })

        if (response.success) {
            ElMessage.success('回复更新成功')
            closeEditReplyDialog()
            fetchReplies()
        } else {
            ElMessage.error(response.message || '更新回复失败')
        }
    } catch (error) {
        console.error('更新回复失败:', error)
        ElMessage.error('更新回复失败')
    } finally {
        loading.updateReply = false
    }
}

// 确认删除回复
const confirmDeleteReply = (reply) => {
    ElMessageBox.confirm(
        '确定要删除这条回复吗？删除后无法恢复。',
        '删除确认',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(() => {
        deleteReply(reply.id)
    }).catch(() => { })
}

// 删除回复
const deleteReply = async (replyId) => {
    try {
        const response = await $fetch(`/api/user/forum/replies/${replyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${userStore.token}`
            }
        })

        if (response.success) {
            ElMessage.success('回复已删除')
            fetchReplies()
        } else {
            ElMessage.error(response.message || '删除回复失败')
        }
    } catch (error) {
        console.error('删除回复失败:', error)
        ElMessage.error('删除回复失败')
    }
}

// 辅助函数
const formatDate = (date) => {
    if (!date) return '未知时间'
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN })
}

const truncate = (text, length) => {
    if (!text) return ''
    return text.length > length ? text.substring(0, length) + '...' : text
}

const stripHtml = (html) => {
    return html?.replace(/<[^>]*>?/gm, '') || ''
}

const getStatusText = (status) => {
    const statusMap = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已拒绝'
    }
    return statusMap[status] || '未知'
}

const getStatusType = (status) => {
    const typeMap = {
        'pending': 'warning',
        'approved': 'success',
        'rejected': 'danger'
    }
    return typeMap[status] || 'info'
}

onMounted(() => {
    fetchTopics()
    fetchCategories()
})

// 标签页切换事件
watch(activeTab, (newVal) => {
    if (newVal === 'replies' && replies.value.length === 0) {
        fetchReplies()
    }
})
</script>

<style>
@import "tailwindcss" reference;

.dark\:bg-gray-750 {
    @apply dark:bg-gray-700/70;
}

/* 行截断 */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* 对话框样式 */
:deep(.el-dialog) {
    border-radius: 0.5rem;
    overflow: hidden;
}

:deep(.el-dialog__header) {
    margin-right: 0;
    padding: 1.5rem;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.el-dialog__body) {
    padding: 1.5rem;
}

:deep(.el-dialog__footer) {
    padding: 1.5rem;
    border-top: 1px solid var(--el-border-color-lighter);
}

:deep(.el-button) {
    border-radius: 0.375rem;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__wrapper) {
    border-radius: 0.375rem;
}

:deep(.el-tag) {
    border-radius: 0.375rem;
}

@media (max-width: 640px) {
    :deep(.el-dialog) {
        width: 90% !important;
        margin: 0 auto;
    }
}
</style>