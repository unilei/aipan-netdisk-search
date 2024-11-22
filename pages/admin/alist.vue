<script setup>
import { House, Document, Edit, Delete, Plus, ArrowLeft, Refresh } from '@element-plus/icons-vue'

definePageMeta({
    middleware: ['auth']
})

const alistDialogShow = ref(false)
const loading = ref(false)
const tableLoading = ref(false)

const form = reactive({
    id: null,
    name: '',
    link: '',
})

const formRef = ref()
const rules = {
    name: [
        { required: true, message: '请输入名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    link: [
        { required: true, message: '请输入源链接', trigger: 'blur' },
        { type: 'url', message: '请输入正确的URL地址', trigger: 'blur' }
    ]
}

const handleAddAlist = () => {
    form.id = null
    form.name = ''
    form.link = ''
    alistDialogShow.value = true
}

const handleSubmitAdd = async () => {
    await formRef.value.validate(async (valid) => {
        if (!valid) return

        loading.value = true
        try {
            if (form.id) {
                await $fetch(`/api/admin/alist/${form.id}`, {
                    method: 'PUT',
                    body: {
                        id: form.id,
                        name: form.name,
                        link: form.link
                    },
                    headers: {
                        "authorization": "Bearer " + useCookie('token').value
                    }
                })
                ElMessage.success('更新成功')
            } else {
                await $fetch('/api/admin/alist/post', {
                    method: 'POST',
                    body: {
                        name: form.name,
                        link: form.link
                    },
                    headers: {
                        "authorization": "Bearer " + useCookie('token').value
                    }
                })
                ElMessage.success('添加成功')
            }
            alistDialogShow.value = false
            await getAlists()
        } catch (error) {
            ElMessage.error('操作失败')
        } finally {
            loading.value = false
        }
    })
}

const alistsData = ref([])
const page = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

const getAlists = async () => {
    tableLoading.value = true
    try {
        const res = await $fetch('/api/admin/alist/get', {
            method: 'GET',
            query: {
                page: page.value,
                pageSize: pageSize.value
            },
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })
        alistsData.value = res.alists
        totalCount.value = res.totalCount
    } catch (error) {
        ElMessage.error('获取数据失败')
    } finally {
        tableLoading.value = false
    }
}

const handleCurrentChange = (val) => {
    page.value = val
    getAlists()
}

const handleSizeChange = (val) => {
    pageSize.value = val
    getAlists()
}

const handleEditClouddrive = (row) => {
    form.id = row.id
    form.name = row.name
    form.link = row.link
    alistDialogShow.value = true
}

const handleDeleteAlist = async (row) => {
    try {
        await ElMessageBox.confirm('确定要删除该数据源吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        })
        
        await $fetch(`/api/admin/alist/${row.id}`, {
            method: 'DELETE',
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })
        ElMessage.success('删除成功')
        await getAlists()
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败')
        }
    }
}

onMounted(() => {
    getAlists()
})
</script>

<template>
    <div class="min-h-[calc(100vh-60px)] bg-gray-50 dark:bg-gray-900">
        <div class="max-w-[1240px] mx-auto p-6 space-y-6">
            <!-- 头部区域 -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                            <nuxt-link to="/admin/dashboard" class="hover:text-primary flex items-center">
                                <el-icon class="mr-1"><House /></el-icon>
                                后台管理面板
                            </nuxt-link>
                            <span>/</span>
                            <span class="text-gray-900 dark:text-gray-200">Alist源管理</span>
                        </div>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-200">Alist数据源管理</h1>
                        <p class="text-gray-500 dark:text-gray-400 mt-1">管理和维护Alist数据源配置</p>
                    </div>
                    <el-button @click="() => navigateTo('/admin/dashboard')" class="flex items-center">
                        <el-icon class="mr-1"><ArrowLeft /></el-icon>
                        返回面板
                    </el-button>
                </div>
            </div>

            <!-- 操作按钮区域 -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div class="flex items-center space-x-4">
                    <el-button type="primary" @click="handleAddAlist" class="flex items-center">
                        <el-icon class="mr-1"><Plus /></el-icon>
                        添加数据源
                    </el-button>
                    <el-button @click="getAlists" class="flex items-center">
                        <el-icon class="mr-1"><Refresh /></el-icon>
                        刷新列表
                    </el-button>
                </div>
            </div>

            <!-- 表格区域 -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <el-table 
                    ref="multipleTableRef" 
                    :data="alistsData"
                    v-loading="tableLoading"
                    border
                    class="w-full">
                    <el-table-column type="index" label="序号" width="80" align="center" />
                    <el-table-column prop="name" label="名称" min-width="200">
                        <template #default="{ row }">
                            <div class="flex items-center">
                                <el-icon class="mr-2 text-blue-500"><Document /></el-icon>
                                <span class="text-gray-800 dark:text-gray-200">{{ row.name }}</span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="link" label="源链接" min-width="300" show-overflow-tooltip>
                        <template #default="{ row }">
                            <span class="text-gray-600 dark:text-gray-400">{{ row.link }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="200" fixed="right">
                        <template #default="{ row }">
                            <el-button-group>
                                <el-button 
                                    type="primary" 
                                    size="small"
                                    @click="handleEditClouddrive(row)">
                                    <el-icon><Edit /></el-icon>
                                    编辑
                                </el-button>
                                <el-popconfirm
                                    title="确定要删除这个数据源吗？"
                                    @confirm="handleDeleteAlist(row)">
                                    <template #reference>
                                        <el-button 
                                            type="danger"
                                            size="small">
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
            </div>
        </div>

        <!-- 添加/编辑对话框 -->
        <el-dialog 
            v-model="alistDialogShow" 
            :title="form.id ? '编辑数据源' : '添加数据源'"
            width="500px"
            destroy-on-close>
            <el-form 
                ref="formRef" 
                :model="form" 
                :rules="rules"
                label-width="80px" 
                class="space-y-4"
                :disabled="loading">
                <el-form-item label="名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入数据源名称" />
                </el-form-item>

                <el-form-item label="源链接" prop="link">
                    <el-input v-model="form.link" placeholder="请输入源链接地址" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="flex justify-end space-x-2">
                    <el-button @click="alistDialogShow = false">取消</el-button>
                    <el-button 
                        type="primary" 
                        @click="handleSubmitAdd"
                        :loading="loading">
                        确认
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<style scoped>
.el-form-item :deep(.el-form-item__label) {
    @apply font-medium text-gray-700 dark:text-gray-300;
}

:deep(.el-table) {
    --el-table-border-color: var(--el-border-color-lighter);
    --el-table-header-bg-color: #f8fafc;
    @apply dark:bg-gray-800 dark:text-gray-200;
}

:deep(.el-table th) {
    @apply bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium;
}

:deep(.el-table td) {
    @apply dark:border-gray-700;
}

:deep(.el-table--border) {
    @apply dark:border-gray-700;
}

:deep(.el-dialog) {
    @apply dark:bg-gray-800;
}

:deep(.el-dialog__title) {
    @apply dark:text-gray-200;
}

:deep(.el-dialog__body) {
    @apply dark:text-gray-300;
    padding-top: 20px;
}

:deep(.el-input__wrapper) {
    @apply dark:bg-gray-700 dark:border-gray-600;
}

:deep(.el-input__inner) {
    @apply dark:text-gray-200 dark:placeholder-gray-400;
}
</style>