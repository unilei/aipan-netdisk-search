<script setup>
definePageMeta({
    middleware: ['auth']
})
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const resourceDialogShow = ref(false)
const handleAddClouddrive = () => {
    resourceDialogShow.value = true
    getResourceTypes()
}
const form = reactive({
    name: '',
    typeId: 0,
    links: [
        {
            key: Date.now(),
            value: ''
        }
    ],
})
const formRef = ref()
const removeLink = (link) => {
    const index = form.links.indexOf(link)
    if (index !== -1) {
        form.links.splice(index, 1)
    }
}
const addLink = () => {
    form.links.push({
        key: Date.now(),
        value: ''
    })
}
const handleSubmitAddClouddrive = () => {
    formRef.value.validate((valid) => {
        if (!valid) {
            return
        }
        if (form.typeId === 0) {
            return;
        }
        if (form.id) {
            $fetch(`/api/admin/resources/${form.id}`, {
                method: 'PUT',
                body: {
                    id: form.id,
                    name: form.name,
                    links: JSON.stringify(form.links),
                    typeId: form.typeId
                },
                headers: {
                    "authorization": "Bearer " + useCookie('token').value
                }
            })
        } else {
            $fetch('/api/admin/resources/post', {
                method: 'POST',
                body: {
                    name: form.name,
                    links: JSON.stringify(form.links),
                    typeId: form.typeId
                },
                headers: {
                    "authorization": "Bearer " + useCookie('token').value
                }
            })
        }
        setTimeout(() => {
            getResources()
        }, 3000);

        resourceDialogShow.value = false
    })
}
const resourcesData = ref([])
const page = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)
const getResources = async () => {
    const res = await $fetch('/api/admin/resources/get', {
        method: 'GET',
        query: {
            page: page.value,
            pageSize: pageSize.value
        },
        headers: {
            "authorization": "Bearer " + useCookie('token').value
        }
    })
    console.log(res)
    resourcesData.value = res.resources;
    totalCount.value = res.totalCount;
}
const handleCurrentChange = (val) => {
    page.value = val
    getResources()
}
const handleSizeChange = (val) => {
    pageSize.value = val
    getResources()
}
const handleEditClouddrive = (row) => {
    console.log(row)
    getResourceTypes()
    form.id = row.id
    form.name = row.name
    form.typeId = row.typeId
    form.links = JSON.parse(row.links)
    resourceDialogShow.value = true
}

const handleDeleteClouddrive = (row) => {
    // console.log(row)
    $fetch(`/api/admin/resources/${row.id}`, {
        method: 'DELETE',
        headers: {
            "authorization": "Bearer " + useCookie('token').value
        }
    })
    getResources()
}

const resourceTypes = ref([])
const typeDialogShow = ref(false)
const typeForm = reactive({
    name: ''
})
const typeFormRef = ref()
const handleSelectResourceType = (resourceType) => {
    form.typeId = resourceType.id
}
const handleAddResourceType = () => {
    typeDialogShow.value = true
}
const getResourceTypes = async () => {
    const res = await $fetch('/api/admin/resourcesType/get', {
        method: 'GET',
        headers: {
            "authorization": "Bearer " + useCookie('token').value
        }
    })
    resourceTypes.value = res.data;
}
const handleSubmitAddResourceType = () => {
    typeFormRef.value.validate((valid) => {
        if (!valid) {
            return
        }
        $fetch("/api/admin/resourcesType/post", {
            method: "POST",
            body: {
                name: typeForm.name
            },
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })
        typeDialogShow.value = false
        setTimeout(() => {
            getResourceTypes()
        }, 3000);

    })
}
const handleDeleteResourceType = (resourceType, index) => {
    $fetch(`/api/admin/resourcesType/${resourceType.id}`, {
        method: 'DELETE',
        headers: {
            "authorization": "Bearer " + useCookie('token').value
        }
    })
    getResourceTypes()
}

const multiUploadDialogShow = ref(false)
const multiUploading = ref(false)
const multiProgress = ref(0)

const handleMultiUpload = () => {
    multiUploadDialogShow.value = true
}
const readExcel = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        multiRequests(jsonData)
    }
    reader.readAsArrayBuffer(file);
}
const readCSV = (file) => {
    Papa.parse(file, {
        header: true,
        complete: (results) => {
            console.log(results.data)
            multiRequests(results.data)
        },
        error: (error) => {
            console.error('读取 CSV 文件时出错:', error);
        }
    })
}
const multiRequests = (jsonData) => {
    multiUploading.value = true

    // 创建一个数组来存储所有的 Promise
    const promises = jsonData.map((item, index) => {
        const linksArray = Object.keys(item)
            .filter((key) => key.includes('link'))
            .map((key) => ({ key: Date.now(), value: item[key] }));
        const category = item.category;

        // 返回一个 Promise
        return $fetch("/api/admin/resourcesType/post", {
            method: "POST",
            body: {
                name: category
            },
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        }).then((res) => {
            // console.log(res);
            // 处理每个 JSON 对象
            return $fetch('/api/admin/resources/post', {
                method: 'POST',
                body: {
                    name: item.name,
                    links: JSON.stringify(linksArray),
                    typeId: res.data.id
                },
                headers: {
                    "authorization": "Bearer " + useCookie('token').value
                }
            }).then(() => {
                multiProgress.value = Math.round((index + 1) / jsonData.length * 100);
            })
        });
    });
    // 使用 Promise.all 等待所有请求完成
    Promise.allSettled(promises)
        .then((results) => {
            console.log('所有请求完成:', results);
            multiUploading.value = false;
            multiProgress.value = 100;
            getResources(); // 在所有请求完成后获取列表
            multiUploadDialogShow.value = false;
        })
        .catch((err) => {
            console.log('请求出错:', err);
            multiUploading.value = false;
            multiProgress.value = 0;
        });
}
const multiFile = ref(null)
const handleFileUpload = (e) => {
    const file = e.target.files[0]
    console.log(file)
    multiFile.value = file
}
const handleSubmitMultiUpload = () => {
    // console.log(multiFile.value)
    if (!multiFile.value) {
        ElMessage({
            message: '请选择文件',
            type: 'error'
        })
        return;
    }
    if (multiFile.value) {
        const fileType = multiFile.value.name.split('.').pop().toLowerCase()
        if (fileType === 'xlsx' || fileType === 'xls') {
            readExcel(multiFile.value)
        } else if (fileType === 'csv') {
            readCSV(multiFile.value)
        } else {
            alert('请上传正确的文件格式')
        }
    }
}

const multipleTableRef = ref()
const multipleSelection = ref([])
const selectable = (row) => ![].includes(row.id)
const toggleSelection = (rows, ignoreSelectable) => {
    if (rows) {
        rows.forEach((row) => {
            multipleTableRef.value.toggleRowSelection(
                row,
                undefined,
                ignoreSelectable
            )
        })
    } else {
        multipleTableRef.value.clearSelection()
    }
}
const handleSelectionChange = (val) => {
    multipleSelection.value = val

}
const handleMultiDelete = async () => {
    if (multipleSelection.value.length === 0) {
        ElMessage({
            message: '请选择要删除的数据',
            type: 'error'
        });
        return;
    }

    try {
        await ElMessageBox.confirm(
            '确定要删除这些数据吗？',
            '提示',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        );

        const idsToDelete = multipleSelection.value.map(item => item.id);
        const res = await $fetch('/api/admin/resources/batch-delete', {
            method: 'DELETE',
            body: { ids: idsToDelete },
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        });

        if (res.code === 200) {
            ElMessage({
                message: '删除成功',
                type: 'success'
            });
            // 清空选择
            toggleSelection([], true);
            await getResources(); // 刷新资源列表
        } else {
            throw new Error('删除失败');
        }
    } catch (error) {
        if (error.message === '已取消删除') {
            ElMessage({
                type: 'info',
                message: '已取消删除',
            });
        } else {
            ElMessage({
                type: 'error',
                message: '删除失败: ' + (error.response?.data?.message || '未知错误'),
            });
        }
    }
};


onMounted(() => {
    getResources()
})
</script>
<template>
    <div class="p-10 max-w-[1240px] mx-auto ">
        <h1 class="text-xl text-bold space-x-2">
            <nuxt-link to="/admin/dashboard">后台管理面板</nuxt-link>
            <span>/</span>
            <nuxt-link to="/admin/clouddrive">网盘管理</nuxt-link>
        </h1>
        <div class="h-[1px] bg-slate-300 mt-6"></div>
        <div class="mt-6 grid grid-cols-4 gap-4">
            <el-button type="primary" @click="handleAddClouddrive()">添加数据</el-button>
            <el-button type="primary" @click="handleMultiUpload()">批量添加数据</el-button>
            <el-button type="danger" @click="handleMultiDelete()">批量删除数据( {{ multipleSelection.length }} )</el-button>
        </div>
        <client-only>
            <div class="mt-6">
                <el-table ref="multipleTableRef" :data="resourcesData" @selection-change="handleSelectionChange">
                    <el-table-column type="selection" :selectable="selectable" width="55" />
                    <el-table-column prop="name" label="资源名字"></el-table-column>
                    <el-table-column prop="type.name" label="资源类型"></el-table-column>
                    <el-table-column label="操作" width="200">
                        <template #default="scope">
                            <el-button type="primary"
                                @click="handleEditClouddrive(scope.row, scope.$index)">编辑</el-button>
                            <el-button type="danger"
                                @click="handleDeleteClouddrive(scope.row, scope.$index)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
                <div class="mt-6 flex items-center justify-center">
                    <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
                        :page-sizes="[100, 200, 300, 400]" background layout="total, sizes, prev, pager, next, jumper"
                        :total="totalCount" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
                </div>
            </div>
        </client-only>

        <el-dialog v-model="resourceDialogShow" :title="form.id ? '编辑资源' : '添加资源'">
            <main>
                <el-form ref="formRef" :model="form" label-width="auto">
                    <el-form-item label="资源名字" prop="name" :rules="{
                        required: true,
                        message: '资源名字不能为空',
                        trigger: 'blur'
                    }">
                        <el-input v-model="form.name" type="textarea"></el-input>
                    </el-form-item>
                    <el-form-item label="资源类型">
                        <div>
                            <div class="gap-4 flex flex-row items-center">
                                <div class="flex flex-col justify-center items-center"
                                    v-for="(resourceType, index) in resourceTypes" :key="index">
                                    <div class="px-2 py-1 border border-slate-300 rounded-md cursor-pointer hover:bg-slate-300"
                                        :class="form.typeId == resourceType.id ? 'bg-slate-300' : ''"
                                        @click="handleSelectResourceType(resourceType)">
                                        {{ resourceType.name }}
                                    </div>
                                    <div>
                                        <el-button link type="danger"
                                            @click="handleDeleteResourceType(resourceType, index)">删除</el-button>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-2">
                                <el-button type="primary" @click="handleAddResourceType()">添加类型</el-button>
                                <el-button type="primary" @click="getResourceTypes()">刷新</el-button>
                            </div>
                            <div class="text-red-500 text-sm " v-if="form.typeId == 0">
                                请选择资源类型, 先刷新资源类型列表
                            </div>
                        </div>
                    </el-form-item>
                    <el-form-item v-for="(link, index) in form.links" :key="link.key" :label="'资源链接' + (index + 1)"
                        :prop="'links.' + index + '.value'"
                        :rules="{ required: true, message: '链接不能为空', trigger: 'blur' }">
                        <el-input v-model="link.value" type="textarea"></el-input>
                        <el-button class="mt-2" type="danger" @click.prevent="removeLink(link)">删除</el-button>
                    </el-form-item>
                </el-form>
                <div>
                    <el-button type="primary" @click="addLink()">添加链接</el-button>
                </div>
            </main>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="resourceDialogShow = false">取消</el-button>
                    <el-button type="primary" @click="handleSubmitAddClouddrive()"> 确认 </el-button>
                </span>
            </template>
        </el-dialog>
        <el-dialog v-model="typeDialogShow" title="添加资源类型">
            <main>
                <el-form ref="typeFormRef" :model="typeForm" label-width="auto">
                    <el-form-item label="类型名字" prop="name" :rules="{
                        required: true,
                        message: '类型名字不能为空',
                        trigger: 'blur'
                    }">
                        <el-input v-model="typeForm.name" type="textarea"></el-input>
                    </el-form-item>
                    <el-form-item label="类型描述" prop="description" :rules="{
                        required: false,
                        message: '类型描述不能为空',
                        trigger: 'blur'
                    }">
                        <el-input v-model="typeForm.description" type="textarea"></el-input>
                    </el-form-item>
                </el-form>
            </main>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="typeDialogShow = false">取消</el-button>
                    <el-button type="primary" @click="handleSubmitAddResourceType()"> 确认 </el-button>
                </span>
            </template>
        </el-dialog>
        <el-dialog v-model="multiUploadDialogShow" title="批量上传">
            <main>
                <p class="font-bold">支持类型(csv, xlsx, xls)</p>
                <input class="w-full mt-4" accept=".csv,.xlsx,.xls" type="file" @change="handleFileUpload">
                <div class="mt-4">
                    <p class="font-bold">进度: {{ multiProgress }}</p>
                </div>
            </main>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="multiUploadDialogShow = false">取消</el-button>
                    <el-button type="primary" @click="handleSubmitMultiUpload()" :loading="multiUploading">确认
                    </el-button>
                </span>
            </template>
        </el-dialog>
    </div>

</template>