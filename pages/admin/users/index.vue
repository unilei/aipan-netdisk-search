<template>
    <div class="min-h-[calc(100vh-60px)] bg-gray-50 p-6">
        <div class="max-w-[1240px] mx-auto space-y-6">
            <!-- 头部区域 -->
            <div class="bg-white rounded-lg p-6 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">用户管理</h1>
                        <p class="text-gray-500 mt-1">管理网站用户、角色和权限</p>
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
            <div class="bg-white rounded-lg p-6 shadow-sm">
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
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <el-table v-loading="loading" :data="users" style="width: 100%" border stripe>
                    <el-table-column prop="avatar" label="" width="70">
                        <template #default="scope">
                            <el-avatar :alt="scope.row.username">
                                {{ scope.row.username?.charAt(0).toUpperCase() }}
                            </el-avatar>
                        </template>
                    </el-table-column>
                    <el-table-column prop="username" label="用户名" min-width="120" />
                    <el-table-column prop="email" label="邮箱" min-width="180" />
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
                    <el-table-column prop="createdAt" label="注册时间" min-width="180">
                        <template #default="scope">
                            {{ formatDate(scope.row.createdAt) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" fixed="right" width="200">
                        <template #default="scope">
                            <div class="flex space-x-2">
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
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Back, Search } from '@element-plus/icons-vue'

definePageMeta({
    middleware: ['admin']
});

// 用户列表数据
const users = ref([])
const loading = ref(true)
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
const isEdit = ref(false)
const selectedUser = ref(null)

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

                    ElMessage.success('用户创建成功')
                }

                dialogVisible.value = false
            } catch (error) {
                console.error('Failed to save user:', error)
                ElMessage.error(error.message || '操作失败')
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

// 页面加载时获取用户列表
onMounted(() => {
    fetchUsers()
})
</script>