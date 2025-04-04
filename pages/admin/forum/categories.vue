<template>
    <div class="min-h-[calc(100vh-60px)] bg-gray-50 p-6">
        <div class="max-w-[1240px] mx-auto space-y-6">
            <!-- 头部区域 -->
            <div class="bg-white rounded-lg p-6 shadow-sm">
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
                            <span class="text-gray-900">论坛管理</span>
                        </div>
                        <h1 class="text-2xl font-bold text-gray-900">论坛分类管理</h1>
                        <p class="text-gray-500 mt-1">管理论坛分类和设置</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <el-button type="primary" @click="showCreateDialog" class="flex items-center">
                            <el-icon class="mr-1">
                                <Plus />
                            </el-icon>
                            添加分类
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

            <!-- 表格区域 -->
            <div class="bg-white rounded-lg p-6 shadow-sm">
                <div v-if="loading" class="py-10">
                    <el-skeleton :rows="5" animated />
                </div>

                <div v-else-if="!categories || categories.length === 0" class="text-center py-10">
                    <el-empty description="暂无论坛分类" />
                    <p class="mt-4 text-gray-500">点击"添加分类"按钮创建第一个论坛分类</p>
                </div>

                <div v-else>
                    <el-table :data="categories" style="width: 100%" border stripe>
                        <el-table-column type="index" label="序号" width="80" align="center" />
                        <el-table-column prop="name" label="分类名称" />
                        <el-table-column prop="slug" label="Slug" />
                        <el-table-column prop="description" label="描述" show-overflow-tooltip />
                        <el-table-column prop="order" label="排序" width="100" align="center" />
                        <el-table-column prop="_count.topics" label="主题数" width="100" align="center">
                            <template #default="scope">
                                <el-tag type="info">{{ scope.row._count?.topics || 0 }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="200" fixed="right">
                            <template #default="scope">
                                <el-button-group>
                                    <el-button size="small" type="primary" @click="handleEdit(scope.row)">
                                        <el-icon>
                                            <Edit />
                                        </el-icon>
                                        编辑
                                    </el-button>
                                    <el-button size="small" type="danger" @click="handleDelete(scope.row)">
                                        <el-icon>
                                            <Delete />
                                        </el-icon>
                                        删除
                                    </el-button>
                                </el-button-group>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
        </div>

        <!-- 创建/编辑分类对话框 -->
        <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '添加分类'" width="500px">
            <el-form :model="form" label-width="80px" @submit.prevent="submitForm">
                <el-form-item label="名称" required>
                    <el-input v-model="form.name" placeholder="请输入分类名称" />
                </el-form-item>
                <el-form-item label="描述" required>
                    <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入分类描述" />
                </el-form-item>
                <el-form-item label="图标">
                    <el-input v-model="form.icon" placeholder="请输入图标类名，例如: fa fa-comments" />
                </el-form-item>
                <el-form-item label="排序">
                    <el-input-number v-model="form.order" :min="0" :max="100" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :disabled="!form.name || !form.description || submitting" @click="submitForm">
                    {{ submitting ? '提交中...' : '确认' }}
                </el-button>
            </template>
        </el-dialog>

        <!-- 删除确认对话框 -->
        <el-dialog v-model="deleteDialogVisible" title="确认删除" width="400px">
            <p>确定要删除分类 "{{ selectedCategory?.name }}" 吗？</p>
            <p class="text-red-500 mt-2">注意: 删除分类将会同时删除该分类下的所有主题和回复！</p>
            <template #footer>
                <el-button @click="deleteDialogVisible = false">取消</el-button>
                <el-button type="danger" :disabled="deleting" @click="confirmDelete">
                    {{ deleting ? '删除中...' : '确认删除' }}
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { House, Plus, ArrowLeft, Edit, Delete } from '@element-plus/icons-vue'

definePageMeta({
    middleware: ['admin']
})

const { data: categoriesData, pending: loading, refresh } = await useFetch('/api/forum/categories')

const categories = computed(() => {
    if (!categoriesData.value || !categoriesData.value.success) return []
    return categoriesData.value.data
})

// 对话框相关
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const selectedCategory = ref(null)

// 表单数据
const form = reactive({
    id: null,
    name: '',
    description: '',
    icon: '',
    order: 0
})

// 重置表单
function resetForm() {
    form.id = null
    form.name = ''
    form.description = ''
    form.icon = ''
    form.order = 0
    isEdit.value = false
}

// 显示创建对话框
function showCreateDialog() {
    resetForm()
    dialogVisible.value = true
}

// 处理编辑
function handleEdit(category) {
    resetForm()
    isEdit.value = true
    form.id = category.id
    form.name = category.name
    form.description = category.description
    form.icon = category.icon || ''
    form.order = category.order
    dialogVisible.value = true
}

// 处理删除
function handleDelete(category) {
    selectedCategory.value = category
    deleteDialogVisible.value = true
}

// 提交表单
async function submitForm() {
    if (!form.name || !form.description || submitting.value) return

    submitting.value = true

    try {
        const endpoint = isEdit.value
            ? `/api/admin/forum/categories/${form.id}`
            : '/api/admin/forum/categories'

        const method = isEdit.value ? 'PUT' : 'POST'

        const token = useCookie('token').value
        const response = await $fetch(endpoint, {
            method,
            body: {
                name: form.name,
                description: form.description,
                icon: form.icon,
                order: form.order
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (response.success) {
            ElMessage.success(isEdit.value ? '分类更新成功' : '分类创建成功')
            dialogVisible.value = false
            refresh()
        } else {
            ElMessage.error(response.message || '操作失败')
        }
    } catch (error) {
        console.error('提交分类失败:', error)
        ElMessage.error('操作失败，请重试')
    } finally {
        submitting.value = false
    }
}

// 确认删除
async function confirmDelete() {
    if (!selectedCategory.value || deleting.value) return

    deleting.value = true

    try {
        const token = useCookie('token').value
        const response = await $fetch(`/api/admin/forum/categories/${selectedCategory.value.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        if (response.success) {
            ElMessage.success('分类删除成功')
            deleteDialogVisible.value = false
            refresh()
        } else {
            ElMessage.error(response.message || '删除失败')
        }
    } catch (error) {
        console.error('删除分类失败:', error)
        ElMessage.error('删除失败，请重试')
    } finally {
        deleting.value = false
    }
}
</script>