<script setup>
definePageMeta({
    middleware: ['auth']
})

const alistDialogShow = ref(false)
const handleAddAlist = () => {
    alistDialogShow.value = true

}
const form = reactive({
    name: '',
    link: '',
})
const formRef = ref()

const handleSubmitAdd = () => {
    formRef.value.validate((valid) => {
        if (!valid) {
            return
        }

        if (form.id) {
            $fetch(`/api/admin/alist/${form.id}`, {
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
        } else {
            $fetch('/api/admin/alist/post', {
                method: 'POST',
                body: {
                    name: form.name,
                    link: form.link
                },
                headers: {
                    "authorization": "Bearer " + useCookie('token').value
                }
            })
        }
        setTimeout(() => {
            getAlists()
        }, 3000);

        alistDialogShow.value = false
    })
}
const alistsData = ref([])
const page = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)
const getAlists = async () => {
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
    // console.log(res)
    alistsData.value = res.alists;
    totalCount.value = res.totalCount;
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
    // console.log(row)

    form.id = row.id
    form.name = row.name
    form.link = row.link
    alistDialogShow.value = true
}

const handleDeleteAlist = (row) => {
    // console.log(row)
    $fetch(`/api/admin/alist/${row.id}`, {
        method: 'DELETE',
        headers: {
            "authorization": "Bearer " + useCookie('token').value
        }
    })
    getAlists()
}

onMounted(() => {
    getAlists()
})
</script>
<template>
    <div>
        <div class="p-10 max-w-[1240px] mx-auto ">
            <h1 class="text-xl text-bold space-x-2">
                <nuxt-link to="/admin/dashboard">后台管理面板</nuxt-link>
                <span>/</span>
                <nuxt-link to="/admin/alist">Alist源管理</nuxt-link>
            </h1>
            <div class="h-[1px] bg-slate-300 mt-6"></div>
            <div class="mt-6 grid grid-cols-4 gap-4">
                <el-button type="primary" @click="handleAddAlist()">添加数据</el-button>
            </div>
            <client-only>
                <div class="mt-6">
                    <el-table ref="multipleTableRef" :data="alistsData">
                        <el-table-column prop="name" label="名字"></el-table-column>
                        <el-table-column prop="link" label="源链接"></el-table-column>
                        <el-table-column label="操作" width="200">
                            <template #default="scope">
                                <el-button type="primary"
                                    @click="handleEditClouddrive(scope.row, scope.$index)">编辑</el-button>
                                <el-button type="danger"
                                    @click="handleDeleteAlist(scope.row, scope.$index)">删除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    <div class="mt-6 flex items-center justify-center">
                        <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
                            :page-sizes="[100, 200, 300, 400]" background
                            layout="total, sizes, prev, pager, next, jumper" :total="totalCount"
                            @size-change="handleSizeChange" @current-change="handleCurrentChange" />
                    </div>
                </div>
            </client-only>
        </div>
        <el-dialog v-model="alistDialogShow" :title="form.id ? '编辑资源' : '添加资源'">
            <main>
                <el-form ref="formRef" :model="form" label-width="auto">
                    <el-form-item label="名字" prop="name" :rules="{
                        required: true,
                        message: '名字不能为空',
                        trigger: 'blur'
                    }">
                        <el-input v-model="form.name" type="textarea"></el-input>
                    </el-form-item>

                    <el-form-item label="源链接" prop="link"
                        :rules="{ required: true, message: '链接不能为空', trigger: 'blur' }">
                        <el-input v-model="form.link" type="textarea"></el-input>
                    </el-form-item>
                </el-form>
            </main>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="alistDialogShow = false">取消</el-button>
                    <el-button type="primary" @click="handleSubmitAdd()"> 确认 </el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>