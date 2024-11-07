<script setup>

const route = useRoute();
const router = useRouter();
const isEdit = ref(false)

const categoriesData = ref([])
const categoryDialogShow = ref(false)
const categoryForm = reactive({
    name: ''
})
const categoryFormRef = ref()
const handleSelectCategory = (category) => {
    if (form.categoryIds.includes(category.id)) {
        form.categoryIds.splice(form.categoryIds.indexOf(category.id), 1)
    } else {
        form.categoryIds.push(category.id)
    }
}
const handleAddCategory = () => {
    categoryDialogShow.value = true
}
const getCategories = async () => {
    const res = await $fetch('/api/admin/blog/category/get', {
        method: 'GET',
        headers: {
            "authorization": "Bearer " + useCookie('token').value
        }
    })
    categoriesData.value = res.data;
}
const handleSubmitAddCategory = () => {
    categoryFormRef.value.validate((valid) => {
        if (!valid) {
            return
        }
        $fetch("/api/admin/blog/category/post", {
            method: "POST",
            body: {
                name: categoryForm.name
            },
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })
        categoryDialogShow.value = false
        setTimeout(() => {
            getCategories()
        }, 3000);

    })
}


const handleDeleteCategory = (category, index) => {
    $fetch(`/api/admin/blog/category/${category.id}`, {
        method: 'DELETE',
        headers: {
            "authorization": "Bearer " + useCookie('token').value
        }
    })
    getCategories()
}

const form = reactive({
    title: '',
    content: '',
    categoryIds: [],
})
const formRef = ref()

const submit = () => {
    formRef.value.validate((valid) => {
        if (!valid) {
            return
        }

        try {
            if (isEdit.value) {
                $fetch(`/api/admin/blog/posts/${form.id}`, {
                    method: 'PUT',
                    body: form,
                    headers: {
                        "authorization": "Bearer " + useCookie('token').value
                    }
                }).then((res) => {
                    console.log(res)
                    router.push('/admin/blog')
                }).catch((err) => {
                    console.error(err)
                })
            } else {
                $fetch('/api/admin/blog/posts/post', {
                    method: 'POST',
                    body: form,
                    headers: {
                        "authorization": "Bearer " + useCookie('token').value
                    }
                }).then((res) => {
                    console.log(res)
                    router.push('/admin/blog')
                }).catch((err) => {
                    console.error(err)
                })
            }

        } catch (error) {
            console.error(error)
        }
    })
}

onMounted(async () => {
    await getCategories()
    // console.log(route.params.id)
    if (route.params.id && route.params.id !== 'new') {
        isEdit.value = true
        const res = await $fetch(`/api/admin/blog/posts/${route.params.id}`, {
            method: 'GET',
            headers: {
                "authorization": "Bearer " + useCookie('token').value
            }
        })
        console.log(res)
        if (res.code === 200) {
            Object.assign(form, res.data)
            form.categoryIds = res.data.categories.map(item => item.categoryId)
        }
    } else {
        isEdit.value = false
    }
})
</script>
<template>

    <div class="max-w-[1240px] mx-auto ">
        <div class="mt-6 flex flex-row justify-between items-center">
            <div class="text-xl text-bold space-x-2">
                <nuxt-link to="/admin/dashboard">后台管理面板</nuxt-link>
                <span>/</span>
                <nuxt-link to="/admin/blog">博客管理</nuxt-link>
                <span>/</span>
                <nuxt-link to="/admin/blog/new" v-if="!isEdit">添加博客</nuxt-link>
                <nuxt-link :to="'/admin/blog/' + route.params.id" v-else>编辑博客</nuxt-link>
            </div>
            <div>
                <el-button type="primary" @click="submit">提交</el-button>
            </div>
        </div>
        <div class="mt-6">
            <el-form ref="formRef" :model="form" label-width="auto">
                <el-form-item label="标题" prop="title">
                    <el-input v-model="form.title" placeholder="请输入标题" class="w-[300px] mt-2" />
                </el-form-item>
                <el-form-item label="分类" prop="categoryIds">
                    <div>
                        <div class="gap-4 flex flex-row items-center">
                            <div class="flex flex-col justify-center items-center"
                                v-for="(category, index) in categoriesData" :key="index">
                                <div class="px-2 py-1 border border-slate-300 rounded-md cursor-pointer hover:bg-slate-300"
                                    :class="form.categoryIds.includes(category.id) ? 'bg-slate-300' : ''"
                                    @click="handleSelectCategory(category)">
                                    {{ category.name }}
                                </div>
                                <div>
                                    <el-button link type="danger"
                                        @click="handleDeleteCategory(category, index)">删除</el-button>
                                </div>
                            </div>
                        </div>
                        <div class="mt-2">
                            <el-button type="primary" @click="handleAddCategory()">添加类型</el-button>
                            <el-button type="primary" @click="getCategories()">刷新</el-button>
                        </div>
                        <div class="text-red-500 text-sm ">
                            请选择文章类型, 先刷新文章类型列表
                        </div>
                    </div>
                </el-form-item>
                <el-form-item label="内容" prop="content">

                    <el-input v-model="form.content" :rows="35" type="textarea" placeholder="请输入" />
                </el-form-item>
                <div>
                    <el-button type="primary" @click="submit">提交</el-button>
                </div>
            </el-form>
        </div>

        <el-dialog v-model="categoryDialogShow" title="添加文章类型">
            <main>
                <el-form ref="categoryFormRef" :model="categoryForm" label-width="auto">
                    <el-form-item label="类型名字" prop="name" :rules="{
                        required: true,
                        message: '类型名字不能为空',
                        trigger: 'blur'
                    }">
                        <el-input v-model="categoryForm.name" type="textarea"></el-input>
                    </el-form-item>
                </el-form>
            </main>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="categoryDialogShow = false">取消</el-button>
                    <el-button type="primary" @click="handleSubmitAddCategory()"> 确认 </el-button>
                </span>
            </template>
        </el-dialog>
    </div>

</template>

<style scoped>
#editor {
    margin: auto;
    width: 80%;
    height: 580px;
}
</style>