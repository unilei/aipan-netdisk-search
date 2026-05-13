<template>
    <div class="admin-page-bg">
        <div class="mx-auto space-y-6">
            <!-- 头部区域 -->
            <div class="admin-card-bg rounded-lg p-6 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">用户管理</h1>
                        <p class="text-gray-500 dark:text-gray-400 mt-1">管理网站用户、角色、状态和积分</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <el-button type="primary" @click="handleAddUser" class="flex items-center">
                            <el-icon class="mr-1">
                                <Plus />
                            </el-icon>
                            添加用户
                        </el-button>
                        <el-button @click="() => navigateTo('/admin/dashboard')" class="flex items-center">
                            <el-icon class="mr-1">
                                <Back />
                            </el-icon>
                            返回面板
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- 搜索和筛选 -->
            <div class="admin-card-bg rounded-lg p-6 shadow-sm">
                <div class="flex flex-col md:flex-row md:items-center md:space-x-4">
                    <div class="flex-1 mb-4 md:mb-0">
                        <el-input v-model="searchQuery" placeholder="搜索用户名、邮箱或手机号" class="w-full"
                            @keyup.enter="handleSearch">
                            <template #suffix>
                                <el-icon>
                                    <Search />
                                </el-icon>
                            </template>
                        </el-input>
                    </div>
                    <div class="flex flex-wrap gap-4">
                        <el-select v-model="filterRole" placeholder="角色" class="w-32">
                            <el-option label="全部角色" value="" />
                            <el-option label="管理员" value="admin" />
                            <el-option label="普通用户" value="user" />
                            <el-option label="VIP用户" value="vip" />
                        </el-select>
                        <el-select v-model="filterStatus" placeholder="状态" class="w-32">
                            <el-option label="全部状态" value="" />
                            <el-option label="活跃" value="active" />
                            <el-option label="禁用" value="disabled" />
                        </el-select>
                        <el-button type="primary" @click="handleSearch">筛选</el-button>
                        <el-button @click="resetFilters">重置</el-button>
                    </div>
                </div>
            </div>

            <!-- 用户列表 -->
            <div v-loading="loading" class="bg-white rounded-lg shadow-sm overflow-hidden">
                <el-table :data="users" style="width: 100%" border stripe>
                    <el-table-column prop="avatar" label="" width="70">
                        <template #default="scope">
                            <el-avatar :alt="scope.row.username">
                                {{ scope.row.username?.charAt(0).toUpperCase() }}
                            </el-avatar>
                        </template>
                    </el-table-column>
                    <el-table-column prop="username" label="用户名" min-width="120" />
                    <el-table-column prop="email" label="邮箱" min-width="180" />
                    <el-table-column prop="isVerified" label="邮箱状态" width="140">
                        <template #default="scope">
                            <el-tag :type="scope.row.isVerified ? 'success' : 'warning'">
                                {{ scope.row.isVerified ? '已激活' : '未激活' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="role" label="角色" width="120">
                        <template #default="scope">
                            <el-tag
                                :type="scope.row.role === 'admin' ? 'danger' : scope.row.role === 'vip' ? 'warning' : 'info'">
                                {{
                                    scope.row.role === 'admin' ? '管理员' :
                                        scope.row.role === 'vip' ? 'VIP用户' : '普通用户'
                                }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="100">
                        <template #default="scope">
                            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
                                {{ scope.row.status === 'active' ? '活跃' : '禁用' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="effectivePoints" label="积分" min-width="170">
                        <template #default="scope">
                            <div class="flex flex-col leading-5">
                                <span class="font-semibold text-gray-900 dark:text-white">
                                    {{ formatPoints(scope.row.effectivePoints ?? scope.row.points) }}
                                </span>
                                <span class="text-xs text-gray-500 dark:text-gray-400">
                                    永久 {{ formatPoints(scope.row.permanentPoints) }} / 限时 {{ formatPoints(scope.row.temporaryPoints) }}
                                </span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="createdAt" label="注册时间" min-width="180">
                        <template #default="scope">
                            {{ formatDate(scope.row.createdAt) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" fixed="right" width="260">
                        <template #default="scope">
                            <div class="flex flex-wrap gap-2">
                                <el-button size="small" type="primary" plain @click="handleViewPoints(scope.row)">积分</el-button>
                                <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
                                <el-button size="small" :type="scope.row.status === 'active' ? 'danger' : 'success'"
                                    @click="handleToggleStatus(scope.row)">
                                    {{ scope.row.status === 'active' ? '禁用' : '启用' }}
                                </el-button>
                                <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>

                <!-- 分页 -->
                <div class="flex justify-end p-4">
                    <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                        :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next, jumper"
                        @size-change="handleSizeChange" @current-change="handleCurrentChange" />
                </div>
            </div>
        </div>

        <!-- 用户编辑对话框 -->
        <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '添加用户'" width="500px">
            <el-form ref="formRef" :model="userForm" :rules="rules" label-width="100px">
                <el-form-item label="用户名" prop="username">
                    <el-input v-model="userForm.username" placeholder="请输入用户名" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                    <el-input v-model="userForm.email" placeholder="请输入邮箱" />
                </el-form-item>
                <el-form-item label="密码" prop="password" v-if="!isEdit">
                    <el-input v-model="userForm.password" type="password" placeholder="请输入密码" />
                </el-form-item>
                <el-form-item label="角色" prop="role">
                    <el-select v-model="userForm.role" placeholder="请选择角色" class="w-full">
                        <el-option label="管理员" value="admin" />
                        <el-option label="普通用户" value="user" />
                        <el-option label="VIP用户" value="vip" />
                    </el-select>
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="userForm.status">
                        <el-radio label="active">活跃</el-radio>
                        <el-radio label="disabled">禁用</el-radio>
                    </el-radio-group>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitForm">确认</el-button>
            </template>
        </el-dialog>

        <!-- 删除确认对话框 -->
        <el-dialog v-model="deleteDialogVisible" title="删除用户" width="400px">
            <p>确定要删除用户 "{{ selectedUser?.username }}" 吗？此操作不可逆。</p>
            <template #footer>
                <el-button @click="deleteDialogVisible = false">取消</el-button>
                <el-button type="danger" @click="confirmDelete">确认删除</el-button>
            </template>
        </el-dialog>

        <!-- 积分详情对话框 -->
        <el-dialog
            v-model="pointsDialogVisible"
            title="用户积分详情"
            width="900px"
            destroy-on-close
        >
            <div v-loading="pointsLoading" class="space-y-4">
                <div v-if="pointsDetail.user" class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div class="text-base font-semibold text-gray-900 dark:text-white">
                                {{ pointsDetail.user.username }}
                            </div>
                            <div class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {{ pointsDetail.user.email }}
                            </div>
                        </div>
                        <el-tag :type="pointsDetail.user.status === 'active' ? 'success' : 'danger'">
                            {{ pointsDetail.user.status === 'active' ? '活跃' : '禁用' }}
                        </el-tag>
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                        <div class="text-xs text-gray-500 dark:text-gray-400">有效积分</div>
                        <div class="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                            {{ formatPoints(pointsDetail.effectivePoints) }}
                        </div>
                    </div>
                    <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                        <div class="text-xs text-gray-500 dark:text-gray-400">永久积分</div>
                        <div class="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                            {{ formatPoints(pointsDetail.permanentPoints) }}
                        </div>
                    </div>
                    <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                        <div class="text-xs text-gray-500 dark:text-gray-400">限时积分</div>
                        <div class="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                            {{ formatPoints(pointsDetail.temporaryPoints) }}
                        </div>
                    </div>
                    <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                        <div class="text-xs text-gray-500 dark:text-gray-400">最近过期</div>
                        <div class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                            {{ pointsDetail.nextExpiringAt ? formatDate(pointsDetail.nextExpiringAt) : '暂无' }}
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <div class="text-xs text-gray-500 dark:text-gray-400">累计获得</div>
                        <div class="mt-1 font-semibold text-emerald-600 dark:text-emerald-300">
                            +{{ formatPoints(pointsDetail.stats?.totalEarned) }}
                        </div>
                    </div>
                    <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <div class="text-xs text-gray-500 dark:text-gray-400">累计消费</div>
                        <div class="mt-1 font-semibold text-red-600 dark:text-red-300">
                            {{ pointsDetail.stats?.totalSpent ? '-' : '' }}{{ formatPoints(pointsDetail.stats?.totalSpent) }}
                        </div>
                    </div>
                    <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <div class="text-xs text-gray-500 dark:text-gray-400">积分记录</div>
                        <div class="mt-1 font-semibold text-gray-900 dark:text-white">
                            {{ formatPoints(pointsDetail.stats?.recordCount) }} 条
                        </div>
                    </div>
                </div>

                <el-table
                    :data="pointsDetail.history"
                    border
                    stripe
                    size="small"
                    empty-text="暂无积分记录"
                >
                    <el-table-column label="类型" width="130">
                        <template #default="{ row }">
                            <el-tag :type="getPointTypeTag(row.type)" size="small">
                                {{ row.typeName || getPointTypeName(row.type) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="说明" min-width="220">
                        <template #default="{ row }">
                            {{ row.description || '-' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="有效期" min-width="170">
                        <template #default="{ row }">
                            <span v-if="row.expiresAt">
                                {{ row.isExpired ? '已过期：' : '' }}{{ formatDate(row.expiresAt) }}
                            </span>
                            <span v-else>永久</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="时间" min-width="170">
                        <template #default="{ row }">
                            {{ formatDate(row.createdAt) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="积分" width="110" align="right">
                        <template #default="{ row }">
                            <span :class="row.points >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'">
                                {{ formatSignedPoints(row.points) }}
                            </span>
                        </template>
                    </el-table-column>
                </el-table>

                <div v-if="pointsDetail.pagination?.totalPages > 1" class="flex justify-end">
                    <el-pagination
                        v-model:current-page="pointsPage"
                        :page-size="pointsPageSize"
                        :total="pointsDetail.pagination.total"
                        layout="total, prev, pager, next"
                        @current-change="handlePointsPageChange"
                    />
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Back, Search } from '@element-plus/icons-vue'

definePageMeta({
    layout: 'admin',
    middleware: ['admin']
});

// 用户列表数据
const users = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索和筛选
const searchQuery = ref('')
const filterRole = ref('')
const filterStatus = ref('')

// 对话框控制
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const pointsDialogVisible = ref(false)
const pointsLoading = ref(false)
const isEdit = ref(false)
const selectedUser = ref(null)
const selectedPointsUser = ref(null)
const pointsPage = ref(1)
const pointsPageSize = 20
const pointsDetail = ref({
    user: null,
    currentPoints: 0,
    permanentPoints: 0,
    temporaryPoints: 0,
    effectivePoints: 0,
    nextExpiringAt: null,
    stats: {
        totalEarned: 0,
        totalSpent: 0,
        recordCount: 0
    },
    history: [],
    pagination: {
        page: 1,
        limit: pointsPageSize,
        total: 0,
        totalPages: 0
    }
})

// 表单数据
const formRef = ref(null)
const userForm = reactive({
    username: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active'
})

// 表单校验规则
const rules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
    ],
    email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少为 6 个字符', trigger: 'blur' }
    ],
    role: [
        { required: true, message: '请选择角色', trigger: 'change' }
    ]
}

// 获取用户列表
const fetchUsers = async () => {
    loading.value = true
    try {
        const params = new URLSearchParams();
        params.append('page', currentPage.value);
        params.append('pageSize', pageSize.value);

        if (searchQuery.value) {
            params.append('search', searchQuery.value);
        }
        if (filterRole.value) {
            params.append('role', filterRole.value);
        }
        if (filterStatus.value) {
            params.append('status', filterStatus.value);
        }

        const res = await $fetch(`/api/admin/user-center?${params.toString()}`, {
            method: 'GET',
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })

        users.value = res.data.users || []
        total.value = res.data.total || 0
    } catch (error) {
        console.error('Failed to fetch users:', error)
        ElMessage.error('获取用户列表失败')
    } finally {
        loading.value = false
    }
}

// 处理搜索
const handleSearch = () => {
    currentPage.value = 1
    fetchUsers()
}

// 重置筛选条件
const resetFilters = () => {
    searchQuery.value = ''
    filterRole.value = ''
    filterStatus.value = ''
    currentPage.value = 1
    fetchUsers()
}

// 添加用户
const handleAddUser = () => {
    isEdit.value = false
    userForm.username = ''
    userForm.email = ''
    userForm.password = ''
    userForm.role = 'user'
    userForm.status = 'active'
    dialogVisible.value = true
}

// 编辑用户
const handleEdit = (user) => {
    isEdit.value = true
    selectedUser.value = user
    userForm.username = user.username
    userForm.email = user.email
    userForm.role = user.role
    userForm.status = user.status
    userForm.password = '' // 编辑时不需要填写密码
    dialogVisible.value = true
}

// 切换用户状态
const handleToggleStatus = async (user) => {
    try {
        const newStatus = user.status === 'active' ? 'disabled' : 'active'
        await $fetch(`/api/admin/user-center/${user.id}/status`, {
            method: 'PATCH',
            body: { status: newStatus },
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })

        // 更新本地状态
        const index = users.value.findIndex(u => u.id === user.id)
        if (index !== -1) {
            users.value[index].status = newStatus
        }

        ElMessage.success(`用户 ${user.username} 已${newStatus === 'active' ? '启用' : '禁用'}`)
    } catch (error) {
        console.error('Failed to toggle user status:', error)
        ElMessage.error('操作失败')
    }
}

// 删除用户
const handleDelete = (user) => {
    selectedUser.value = user
    deleteDialogVisible.value = true
}

// 查看用户积分
const handleViewPoints = async (user) => {
    selectedPointsUser.value = user
    pointsPage.value = 1
    pointsDialogVisible.value = true
    await fetchUserPoints()
}

const fetchUserPoints = async () => {
    if (!selectedPointsUser.value?.id) return

    pointsLoading.value = true
    try {
        const response = await $fetch(`/api/admin/user-center/${selectedPointsUser.value.id}/points`, {
            method: 'GET',
            query: {
                page: pointsPage.value,
                limit: pointsPageSize
            },
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })

        if (response.code === 200) {
            pointsDetail.value = response.data

            const index = users.value.findIndex(u => u.id === selectedPointsUser.value.id)
            if (index !== -1) {
                users.value[index] = {
                    ...users.value[index],
                    points: response.data.effectivePoints,
                    permanentPoints: response.data.permanentPoints,
                    temporaryPoints: response.data.temporaryPoints,
                    effectivePoints: response.data.effectivePoints,
                    nextExpiringAt: response.data.nextExpiringAt,
                    pointsBreakdown: response.data.breakdown
                }
            }
        }
    } catch (error) {
        console.error('Failed to fetch user points:', error)
        ElMessage.error(error?.data?.message || '获取用户积分失败')
    } finally {
        pointsLoading.value = false
    }
}

const handlePointsPageChange = (page) => {
    pointsPage.value = page
    fetchUserPoints()
}

// 确认删除
const confirmDelete = async () => {
    try {
        await $fetch(`/api/admin/user-center/${selectedUser.value.id}`, {
            method: 'DELETE',
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })

        // 移除本地列表中的用户
        users.value = users.value.filter(u => u.id !== selectedUser.value.id)
        total.value--

        ElMessage.success(`用户 ${selectedUser.value.username} 已删除`)
        deleteDialogVisible.value = false
    } catch (error) {
        console.error('Failed to delete user:', error)
        ElMessage.error('删除失败')
    }
}

// 提交表单
const submitForm = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (valid) {
            try {
                if (isEdit.value) {
                    // 编辑用户
                    await $fetch(`/api/admin/user-center/${selectedUser.value.id}`, {
                        method: 'PUT',
                        body: {
                            username: userForm.username,
                            email: userForm.email,
                            role: userForm.role,
                            status: userForm.status
                        },
                        headers: {
                            "authorization": "Bearer " + useCookie('token').value
                        }
                    })

                    // 更新本地状态
                    const index = users.value.findIndex(u => u.id === selectedUser.value.id)
                    if (index !== -1) {
                        users.value[index] = {
                            ...users.value[index],
                            username: userForm.username,
                            email: userForm.email,
                            role: userForm.role,
                            status: userForm.status
                        }
                    }

                    ElMessage.success('用户更新成功')
                } else {
                    // 添加用户
                    const res = await $fetch('/api/admin/user-center', {
                        method: 'POST',
                        body: {
                            username: userForm.username,
                            email: userForm.email,
                            password: userForm.password,
                            role: userForm.role,
                            status: userForm.status
                        },
                        headers: {
                            "authorization": "Bearer " + useCookie('token').value
                        }
                    })

                    // 刷新列表
                    fetchUsers()

                    ElMessage.success(res.message || '用户创建成功')
                }

                dialogVisible.value = false
            } catch (error) {
                console.error('Failed to save user:', error)
                ElMessage.error(error?.data?.message || error?.message || '操作失败')
            }
        }
    })
}

// 分页处理
const handleSizeChange = (size) => {
    pageSize.value = size
    fetchUsers()
}

const handleCurrentChange = (page) => {
    currentPage.value = page
    fetchUsers()
}

// 格式化日期
const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date)
}

const formatPoints = (points) => {
    return new Intl.NumberFormat('zh-CN').format(Number(points || 0))
}

const formatSignedPoints = (points) => {
    const value = Number(points || 0)
    return `${value > 0 ? '+' : ''}${formatPoints(value)}`
}

const getPointTypeName = (type) => {
    const typeMap = {
        checkin: '每日签到',
        bonus: '连续签到奖励',
        consume: '积分消费',
        admin: '管理员调整',
        activity: '活动奖励',
        task: '任务奖励',
        transfer: '转存奖励',
        registration_gift: '注册礼包',
        redemption: '兑换码奖励'
    }
    return typeMap[type] || type || '-'
}

const getPointTypeTag = (type) => {
    const typeMap = {
        checkin: 'success',
        bonus: 'warning',
        consume: 'danger',
        admin: 'info',
        activity: 'primary',
        task: 'primary',
        transfer: 'primary',
        registration_gift: 'success',
        redemption: 'success'
    }
    return typeMap[type] || 'info'
}

// 页面加载时获取用户列表
onMounted(() => {
    fetchUsers()
})
</script>
