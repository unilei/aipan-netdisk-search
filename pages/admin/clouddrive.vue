<script setup>
import { 
    Document, 
    Upload, 
    Delete, 
    Edit, 
    Plus, 
    Refresh,
    ArrowLeft,
    House
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref, reactive, onMounted } from 'vue'

definePageMeta({
    middleware: ['auth']
})
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

// 页面状态管理
const pageState = reactive({
    loading: false,
    submitting: false,
    loadingResourceTypes: false,
    addingResourceType: false,
    multiUploading: false
})

// 分页配置
const pagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0,
    pageSizes: [10, 20, 50, 100]
})

// 对话框控制
const dialogs = reactive({
    resource: false,
    type: false,
    multiUpload: false
})

// 表单数据
const form = reactive({
    id: null,
    name: '',
    typeId: 0,
    links: [
        {
            key: Date.now(),
            value: ''
        }
    ],
})

// 类型表单数据
const typeForm = reactive({
    name: '',
    description: ''
})

// 重置表单
const resetForm = () => {
    form.id = null
    form.name = ''
    form.typeId = 0
    form.links = [{
        key: Date.now(),
        value: ''
    }]
}

const resetTypeForm = () => {
    typeForm.name = ''
    typeForm.description = ''
}

// 数据相关
const resourcesData = ref([])
const resourceTypes = ref([])
const multipleSelection = ref([])
const multiProgress = ref(0)
const uploadData = ref([])

// 表格行选择控制
const selectable = (row, index) => {
    return true // 默认允许所有行可选，如需添加条件可在此处修改
}

// 表格选择相关
const handleSelectionChange = (val) => {
    multipleSelection.value = val
}

// 刷新资源类型
const handleRefreshResourceTypes = async () => {
    await api.getResourceTypes()
}

// 打开添加资源类型对话框
const handleAddResourceType = () => {
    resetTypeForm()
    dialogs.type = true
}

// 选择资源类型
const handleSelectResourceType = (resourceType) => {
    form.typeId = resourceType.id
}

// 打开批量上传对话框
const handleMultiUpload = () => {
    dialogs.multiUpload = true
}

// 资源链接管理
const removeLink = (index) => {
    if (form.links.length > 1) {
        form.links.splice(index, 1)
    }
}

const addLink = () => {
    form.links.push({
        key: Date.now(),
        value: ''
    })
}

// 表单引用
const formRef = ref()
const typeFormRef = ref()
const multipleTableRef = ref()

// API调用封装
const api = {
    async getResources() {
        try {
            pageState.loading = true
            const res = await $fetch('/api/admin/resources/get', {
                method: 'GET',
                query: {
                    page: pagination.page,
                    pageSize: pagination.pageSize
                },
                headers: {
                    "authorization": "Bearer " + useCookie('token').value
                }
            })
            resourcesData.value = res.resources
            pagination.total = res.totalCount
        } catch (error) {
            ElMessage.error('获取资源列表失败：' + (error.message || '未知错误'))
        } finally {
            pageState.loading = false
        }
    },

    async getResourceTypes() {
        try {
            pageState.loadingResourceTypes = true
            const res = await $fetch('/api/admin/resourcesType/get', {
                method: 'GET',
                headers: {
                    "authorization": "Bearer " + useCookie('token').value
                }
            })
            resourceTypes.value = res.data
        } catch (error) {
            ElMessage.error('获取资源类型失败：' + (error.message || '未知错误'))
        } finally {
            pageState.loadingResourceTypes = false
        }
    },

    async addResource(data) {
        return await $fetch('/api/admin/resources/post', {
            method: 'POST',
            body: data,
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })
    },

    async updateResource(id, data) {
        return await $fetch(`/api/admin/resources/${id}`, {
            method: 'PUT',
            body: data,
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })
    },

    async deleteResource(id) {
        return await $fetch(`/api/admin/resources/${id}`, {
            method: 'DELETE',
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })
    },

    async addResourceType(data) {
        return await $fetch("/api/admin/resourcesType/post", {
            method: "POST",
            body: data,
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })
    },

    async deleteResourceType(id) {
        return await $fetch(`/api/admin/resourcesType/${id}`, {
            method: 'DELETE',
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })
    }
}

// 根据分类名称获取或创建资源类型
const getOrCreateResourceType = async (categoryName) => {
    // 先查找是否已存在该分类
    const existingType = resourceTypes.value.find(type => type.name === categoryName)
    if (existingType) {
        return existingType.id
    }

    // 不存在则创建新分类
    try {
        const response = await api.addResourceType({
            name: categoryName,
            description: `Auto created for category: ${categoryName}`
        })
        return response.data.id
    } catch (error) {
        console.error('创建资源类型失败：', categoryName, error)
        throw new Error(`创建资源类型失败：${categoryName}`)
    }
}

// 事件处理
const handleAddClouddrive = () => {
    resetForm()
    dialogs.resource = true
    api.getResourceTypes()
}

const handleEditClouddrive = (row) => {
    form.id = row.id
    form.name = row.name
    form.typeId = row.typeId
    form.links = JSON.parse(row.links)
    dialogs.resource = true
    api.getResourceTypes()
}

const handleSubmitAddClouddrive = async () => {
    try {
        const valid = await formRef.value.validate()
        if (!valid) return
        
        if (form.typeId === 0) {
            ElMessage.warning('请选择资源类型')
            return
        }

        pageState.submitting = true
        if (form.id) {
            await api.updateResource(form.id, {
                name: form.name,
                typeId: form.typeId,
                links: JSON.stringify(form.links)
            })
            ElMessage.success('资源更新成功')
        } else {
            await api.addResource({
                name: form.name,
                typeId: form.typeId,
                links: JSON.stringify(form.links)
            })
            ElMessage.success('资源添加成功')
        }
        dialogs.resource = false
        resetForm()
        api.getResources()
    } catch (error) {
        ElMessage.error('操作失败：' + (error.message || '未知错误'))
    } finally {
        pageState.submitting = false
    }
}

const handleDeleteClouddrive = async (row) => {
    try {
        await ElMessageBox.confirm(
            '确定要删除该资源吗？删除后无法恢复。',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        
        await api.deleteResource(row.id)
        ElMessage.success('删除成功')
        await api.getResources()
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败：' + (error.message || '未知错误'))
        }
    }
}

const handleSubmitAddResourceType = async () => {
    try {
        const valid = await typeFormRef.value.validate()
        if (!valid) return

        pageState.addingResourceType = true
        await api.addResourceType({
            name: typeForm.name,
            description: typeForm.description
        })
        
        ElMessage.success('资源类型添加成功')
        dialogs.type = false
        resetTypeForm()
        await api.getResourceTypes()
    } catch (error) {
        ElMessage.error('添加资源类型失败：' + (error.message || '未知错误'))
    } finally {
        pageState.addingResourceType = false
    }
}

const handleDeleteResourceType = async (resourceType) => {
    try {
        // 先检查是否有关联的资源
        const associatedResources = resourcesData.value.filter(resource => resource.typeId === resourceType.id)
        if (associatedResources.length > 0) {
            ElMessageBox.alert(
                `无法删除资源类型 "${resourceType.name}"，因为还有 ${associatedResources.length} 个资源正在使用此类型。\n\n请先删除或修改以下资源的类型：\n${associatedResources.map(r => `• ${r.name}`).join('\n')}`,
                '删除失败',
                {
                    type: 'warning',
                    confirmButtonText: '知道了'
                }
            )
            return
        }

        await ElMessageBox.confirm(
            '确定要删除该资源类型吗？删除后无法恢复。',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        await api.deleteResourceType(resourceType.id)
        ElMessage.success('资源类型删除成功')
        await api.getResourceTypes()
    } catch (error) {
        if (error?.response?.status === 400) {
            ElMessage.warning('该资源类型下还有关联的资源，请先删除或修改相关资源')
        } else if (!error || error.toString().includes('cancel')) {
            // 用户取消操作，不显示错误
            return
        } else {
            ElMessage.error('删除资源类型失败：' + (error.message || '未知错误'))
        }
    }
}

// 文件上传相关
const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const fileType = file.name.split('.').pop().toLowerCase()
    if (fileType === 'csv') {
        readCSV(file)
    } else if (['xlsx', 'xls'].includes(fileType)) {
        readExcel(file)
    } else {
        ElMessage.error('不支持的文件类型')
    }
}

const readExcel = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result)
            const workbook = XLSX.read(data, { type: 'array' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet)
            uploadData.value = jsonData
        } catch (error) {
            ElMessage.error('Excel文件解析失败：' + (error.message || '未知错误'))
        }
    }
    reader.onerror = () => {
        ElMessage.error('文件读取失败')
    }
    reader.readAsArrayBuffer(file)
}

const readCSV = (file) => {
    Papa.parse(file, {
        header: true,
        complete: (results) => {
            if (results.errors.length) {
                ElMessage.error('CSV文件解析失败：' + results.errors[0].message)
                return
            }
            uploadData.value = results.data
        },
        error: (error) => {
            ElMessage.error('CSV文件解析失败：' + error.message)
        }
    })
}

const multiRequests = async (data) => {
    try {
        // 验证数据格式
        const invalidItems = data.filter(item => !item.name || !item.category || !item.link)
        if (invalidItems.length > 0) {
            ElMessage.error(`发现 ${invalidItems.length} 条数据格式不正确，请确保每条数据都包含 name、category 和 link 字段`)
            return
        }

        pageState.multiUploading = true
        multiProgress.value = 0

        // 第一步：处理所有的资源类型
        const uniqueCategories = [...new Set(data.map(item => item.category))]
        const categoryToTypeId = {}
        const failedCategories = []

        for (const category of uniqueCategories) {
            try {
                const typeId = await getOrCreateResourceType(category)
                categoryToTypeId[category] = typeId
            } catch (error) {
                failedCategories.push(category)
                console.error(`创建资源类型失败: ${category}`, error)
            }
        }

        // 刷新资源类型列表
        await api.getResourceTypes()

        if (failedCategories.length > 0) {
            ElMessage.warning(`以下分类创建失败: ${failedCategories.join(', ')}`)
        }

        // 第二步：处理资源
        const total = data.length
        let completed = 0
        let failed = 0
        const failedItems = []

        // 分批处理，每批10个
        const batchSize = 10
        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize)
            const results = await Promise.allSettled(batch.map(async (item) => {
                try {
                    const typeId = categoryToTypeId[item.category]
                    if (!typeId) {
                        throw new Error(`找不到分类 "${item.category}" 对应的类型ID`)
                    }

                    await api.addResource({
                        name: item.name,
                        typeId: typeId,
                        links: JSON.stringify([{
                            key: Date.now(),
                            value: item.link
                        }])
                    })
                    completed++
                    multiProgress.value = Math.floor((completed / total) * 100)
                } catch (error) {
                    failed++
                    failedItems.push({
                        name: item.name,
                        category: item.category,
                        error: error.message
                    })
                    console.error('添加资源失败：', item.name, error)
                }
            }))
        }

        // 显示最终结果
        if (failed > 0) {
            ElMessage.warning(`批量上传完成，成功: ${completed}，失败: ${failed}`)
            console.error('失败项目：', failedItems)
        } else {
            ElMessage.success(`批量上传完成，共上传 ${completed} 个资源`)
        }

        dialogs.multiUpload = false
        api.getResources()
    } catch (error) {
        ElMessage.error('批量上传过程中发生错误：' + (error.message || '未知错误'))
    } finally {
        pageState.multiUploading = false
        multiProgress.value = 0
    }
}

const handleSubmitMultiUpload = async () => {
    if (!uploadData.value || uploadData.value.length === 0) {
        ElMessage.warning('请先选择要上传的文件')
        return
    }

    pageState.multiUploading = true
    try {
        await multiRequests(uploadData.value)
        ElMessage.success('批量上传成功')
        dialogs.multiUpload = false
        uploadData.value = []
        multiProgress.value = 0
        api.getResources()
    } catch (error) {
        ElMessage.error('批量上传失败：' + error.message)
    } finally {
        pageState.multiUploading = false
    }
}

// 表格选择相关
const handleMultiDelete = async () => {
    if (!multipleSelection.value.length) {
        ElMessage.warning('请先选择要删除的项目')
        return
    }

    try {
        await ElMessageBox.confirm(
            `确定要删除选中的 ${multipleSelection.value.length} 项吗？删除后无法恢复。`,
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        
        const total = multipleSelection.value.length
        let completed = 0
        
        // 分批删除
        const batchSize = 5
        for (let i = 0; i < multipleSelection.value.length; i += batchSize) {
            const batch = multipleSelection.value.slice(i, i + batchSize)
            await Promise.all(batch.map(async (item) => {
                try {
                    await api.deleteResource(item.id)
                    completed++
                    multiProgress.value = Math.floor((completed / total) * 100)
                } catch (error) {
                    console.error('批量删除单项失败:', error)
                }
            }))
        }

        ElMessage.success('批量删除完成')
        multipleSelection.value = []
        await api.getResources()
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('批量删除失败：' + (error.message || '未知错误'))
        }
    } finally {
        multiProgress.value = 0
    }
}

// 分页处理
const handleCurrentChange = (val) => {
    pagination.page = val
    api.getResources()
}

const handleSizeChange = (val) => {
    pagination.pageSize = val
    pagination.page = 1
    api.getResources()
}

// 初始化
onMounted(() => {
    api.getResources()
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
                            <span class="text-gray-900">网盘管理</span>
                        </div>
                        <h1 class="text-2xl font-bold text-gray-900">网盘资源管理</h1>
                        <p class="text-gray-500 mt-1">管理和维护云盘文件系统的资源</p>
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
                    <el-button type="primary" @click="handleAddClouddrive()" class="flex items-center">
                        <el-icon class="mr-1"><Plus /></el-icon>
                        添加数据
                    </el-button>
                    <el-button type="success" @click="handleMultiUpload()" class="flex items-center">
                        <el-icon class="mr-1"><Upload /></el-icon>
                        批量添加
                    </el-button>
                    <el-button 
                        type="danger" 
                        @click="handleMultiDelete()" 
                        :disabled="!multipleSelection.length"
                        class="flex items-center"
                    >
                        <el-icon class="mr-1"><Delete /></el-icon>
                        批量删除 <span v-if="multipleSelection.length" class="ml-1">({{ multipleSelection.length }})</span>
                    </el-button>
                </div>
            </div>

            <!-- 表格区域 -->
            <div class="bg-white rounded-lg p-6 shadow-sm">
                <client-only>
                    <el-table 
                        ref="multipleTableRef" 
                        :data="resourcesData" 
                        @selection-change="handleSelectionChange"
                        style="width: 100%"
                        :border="true"
                        class="mt-4"
                        :selectable="selectable"
                    >
                        <el-table-column type="selection" width="55" />
                        <el-table-column prop="name" label="资源名称" min-width="200">
                            <template #default="{ row }">
                                <div class="flex items-center">
                                    <el-icon class="mr-2 text-blue-500"><Document /></el-icon>
                                    <span>{{ row.name }}</span>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="type.name" label="资源类型" width="150">
                            <template #default="{ row }">
                                <el-tag size="small" type="info">{{ row.type.name }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="200" fixed="right">
                            <template #default="scope">
                                <el-button-group>
                                    <el-button 
                                        type="primary" 
                                        :icon="Edit"
                                        @click="handleEditClouddrive(scope.row, scope.$index)"
                                    >编辑</el-button>
                                    <el-button 
                                        type="danger" 
                                        :icon="Delete"
                                        @click="handleDeleteClouddrive(scope.row, scope.$index)"
                                    >删除</el-button>
                                </el-button-group>
                            </template>
                        </el-table-column>
                    </el-table>
                    <div class="mt-6 flex items-center justify-center">
                        <el-pagination 
                            v-model:current-page="pagination.page" 
                            v-model:page-size="pagination.pageSize"
                            :page-sizes="pagination.pageSizes" 
                            background 
                            layout="total, sizes, prev, pager, next, jumper"
                            :total="pagination.total" 
                            @size-change="handleSizeChange" 
                            @current-change="handleCurrentChange" 
                        />
                    </div>
                </client-only>
            </div>
        </div>

        <!-- 添加/编辑资源对话框 -->
        <el-dialog 
            v-model="dialogs.resource" 
            :title="form.id ? '编辑资源' : '添加资源'"
            width="600px"
        >
            <el-form ref="formRef" :model="form" label-width="100px">
                <el-form-item label="资源名称" prop="name" :rules="{
                    required: true,
                    message: '资源名称不能为空',
                    trigger: 'blur'
                }">
                    <el-input v-model="form.name" placeholder="请输入资源名称"></el-input>
                </el-form-item>
                <el-form-item label="资源类型">
                    <div class="space-y-4">
                        <div class="flex flex-wrap gap-3">
                            <div 
                                v-for="(resourceType, index) in resourceTypes" 
                                :key="index"
                                class="flex flex-col items-center space-y-2"
                            >
                                <div 
                                    class="px-4 py-2 border rounded-md cursor-pointer transition-colors duration-200"
                                    :class="[
                                        form.typeId == resourceType.id 
                                            ? 'bg-slate-500 text-white border-primary' 
                                            : 'border-gray-300 hover:border-primary hover:text-primary'
                                    ]"
                                    @click="handleSelectResourceType(resourceType)"
                                >
                                    {{ resourceType.name }}
                                </div>
                                <el-button 
                                    link 
                                    type="danger" 
                                    size="small"
                                    @click="handleDeleteResourceType(resourceType, index)"
                                >删除</el-button>
                            </div>
                        </div>
                        <div class="flex items-center space-x-3">
                            <el-button 
                                type="primary" 
                                @click="handleAddResourceType()"
                                class="flex items-center"
                            >
                                <el-icon class="mr-1"><Plus /></el-icon>
                                添加类型
                            </el-button>
                            <el-button 
                                @click="handleRefreshResourceTypes"
                                class="flex items-center"
                                :loading="pageState.loadingResourceTypes"
                            >
                                <el-icon class="mr-1"><Refresh /></el-icon>
                                刷新
                            </el-button>
                        </div>
                        <div class="text-red-500 text-sm" v-if="form.typeId == 0">
                            请选择资源类型，如果没有显示请点击刷新按钮
                        </div>
                    </div>
                </el-form-item>
                <el-form-item 
                    v-for="(link, index) in form.links" 
                    :key="link.key" 
                    :label="'资源链接 ' + (index + 1)"
                    :prop="'links.' + index + '.value'"
                    :rules="{ required: true, message: '链接不能为空', trigger: 'blur' }"
                >
                    <div class="flex items-start space-x-2">
                        <el-input 
                            v-model="link.value" 
                            type="textarea" 
                            :rows="2"
                            placeholder="请输入资源链接"
                        ></el-input>
                        <el-button 
                            type="danger" 
                            :icon="Delete"
                            @click.prevent="removeLink(index)"
                        ></el-button>
                    </div>
                </el-form-item>
                <el-form-item>
                    <el-button 
                        type="primary" 
                        @click="addLink()"
                        class="flex items-center"
                    >
                        <el-icon class="mr-1"><Plus /></el-icon>
                        添加链接
                    </el-button>
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="flex justify-end space-x-3">
                    <el-button @click="dialogs.resource = false">取消</el-button>
                    <el-button type="primary" @click="handleSubmitAddClouddrive()">确认</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 添加资源类型对话框 -->
        <el-dialog 
            v-model="dialogs.type" 
            title="添加资源类型"
            width="500px"
        >
            <el-form ref="typeFormRef" :model="typeForm" label-width="100px">
                <el-form-item label="类型名称" prop="name" :rules="{
                    required: true,
                    message: '类型名称不能为空',
                    trigger: 'blur'
                }">
                    <el-input v-model="typeForm.name" placeholder="请输入类型名称"></el-input>
                </el-form-item>
                <el-form-item label="类型描述" prop="description">
                    <el-input 
                        v-model="typeForm.description" 
                        type="textarea" 
                        :rows="3"
                        placeholder="请输入类型描述（选填）"
                    ></el-input>
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="flex justify-end space-x-3">
                    <el-button @click="dialogs.type = false">取消</el-button>
                    <el-button 
                        type="primary" 
                        @click="handleSubmitAddResourceType"
                        :loading="pageState.addingResourceType"
                    >确认</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 批量上传对话框 -->
        <el-dialog 
            v-model="dialogs.multiUpload" 
            title="批量上传资源"
            width="500px"
        >
            <div class="space-y-4">
                <div class="p-4 bg-gray-50 rounded-lg">
                    <h3 class="font-medium text-gray-900">支持的文件类型</h3>
                    <div class="mt-2 flex items-center space-x-3">
                        <el-tag size="small">CSV</el-tag>
                        <el-tag size="small" type="success">XLSX</el-tag>
                        <el-tag size="small" type="warning">XLS</el-tag>
                    </div>
                </div>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <input 
                        class="w-full" 
                        accept=".csv,.xlsx,.xls" 
                        type="file" 
                        @change="handleFileUpload"
                    >
                </div>
                <div v-if="multiProgress > 0" class="space-y-2">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-500">上传进度</span>
                        <span class="font-medium">{{ multiProgress }}%</span>
                    </div>
                    <el-progress :percentage="multiProgress" />
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end space-x-3">
                    <el-button @click="dialogs.multiUpload = false">取消</el-button>
                    <el-button 
                        type="primary" 
                        @click="handleSubmitMultiUpload()" 
                        :loading="pageState.multiUploading"
                    >开始上传</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<style scoped>
.el-tag {
    margin-right: 0;
}
.group:hover .group-hover\:text-primary {
    color: rgb(var(--el-color-primary));
}
:deep(.el-dialog__body) {
    padding-top: 20px;
}

/* 调整确认对话框的层级，使其高于普通对话框 */
:global(.el-message-box__wrapper) {
    z-index: 2100 !important;
}
:global(.el-overlay) {
    z-index: 2000 !important;
}
</style>