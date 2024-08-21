<script setup>
definePageMeta({
    middleware: ['auth']
})
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
        </div>

        <div class="mt-6">
            <el-table :data="resourcesData">
                <el-table-column prop="name" label="资源名字"></el-table-column>
                <el-table-column prop="type.name" label="资源类型"></el-table-column>
                <el-table-column label="操作" width="200">
                    <template #default="scope">
                        <el-button type="primary" @click="handleEditClouddrive(scope.row, scope.$index)">编辑</el-button>
                        <el-button type="danger" @click="handleDeleteClouddrive(scope.row, scope.$index)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="mt-6 flex items-center justify-center">
                <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
                    :page-sizes="[100, 200, 300, 400]" background layout="total, sizes, prev, pager, next, jumper"
                    :total="totalCount" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
        </div>
    </div>
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
                    :prop="'links.' + index + '.value'" :rules="{ required: true, message: '链接不能为空', trigger: 'blur' }">
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
</template>