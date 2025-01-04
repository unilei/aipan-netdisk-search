<script setup>
import { House, Document, Edit, Delete, Plus, ArrowLeft, Refresh } from '@element-plus/icons-vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { uploadImages } from '~/utils/uploadImage'

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
    const res = await $fetch('/api/user/blog/category/get', {
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
        $fetch("/api/user/blog/category/post", {
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
    $fetch(`/api/user/blog/category/${category.id}`, {
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
    tags: [],
    status: 'pending'
})
const formRef = ref()

// 上传状态
const uploadingCount = ref(0)

// Markdown 编辑器配置
const editorConfig = {
    toolbars: [
        'bold', 'underline', 'italic', 'strikethrough', 'sub', 'sup', 'quote', 'unordered-list', 'ordered-list', 
        'task-list', '-', 'code', 'code-block', 'link', 'image', 'table', 'mermaid', 'katex', '-', 
        'preview', 'fullscreen'
    ],
    uploadImages: true,
    autoFocus: true,
    showCodeRowNumber: true
}

// 处理图片上传
const onUploadImg = async (files, callback) => {
    const config = useRuntimeConfig()
    try {
        uploadingCount.value += files.length
        const result = await uploadImages(files, {
            owner: config.public.GITHUB_OWNER,
            repo: config.public.GITHUB_REPO,
            token: config.public.GITHUB_TOKEN,
            branch: config.public.GITHUB_BRANCH
        })

        // 显示错误信息
        result.errors.forEach(error => {
            ElMessage.error(error)
        })

        // 如果有成功上传的图片，显示成功消息
        if (result.urls.length > 0) {
            ElMessage.success(`成功上传 ${result.urls.length} 张图片`)
        }

        callback(result.urls)
    } finally {
        uploadingCount.value = Math.max(0, uploadingCount.value - files.length)
    }
}

const submit = () => {
    formRef.value.validate((valid) => {
        if (!valid) {
            return
        }

        try {
            if (isEdit.value) {
                $fetch(`/api/user/blog/posts/${form.id}`, {
                    method: 'PUT',
                    body: form,
                    headers: {
                        "authorization": "Bearer " + useCookie('token').value
                    }
                }).then((res) => {
                    console.log(res)
                    router.push('/user/posts/list')
                }).catch((err) => {
                    console.error(err)
                })
            } else {
                $fetch('/api/user/blog/posts/post', {
                    method: 'POST',
                    body: form,
                    headers: {
                        "authorization": "Bearer " + useCookie('token').value
                    }
                }).then((res) => {
                    console.log(res)
                    router.push('/user/posts/list')
                }).catch((err) => {
                    console.error(err)
                })
            }

        } catch (error) {
            console.error(error)
        }
    })
}

// 标签输入相关
const inputTagValue = ref('')
const inputTagVisible = ref(false)
const InputRef = ref()

const showTagInput = () => {
    inputTagVisible.value = true
    nextTick(() => {
        InputRef.value.input.focus()
    })
}

const handleTagClose = (tag) => {
    form.tags.splice(form.tags.indexOf(tag), 1)
}

const handleTagInputConfirm = () => {
    if (inputTagValue.value) {
        if (!form.tags.includes(inputTagValue.value)) {
            form.tags.push(inputTagValue.value)
        }
    }
    inputTagValue.value = ''
    inputTagVisible.value = false
}

onMounted(async () => {
    await getCategories()
    // console.log(route.params.id)
    if (route.params.id && route.params.id !== 'new') {
        isEdit.value = true
        const res = await $fetch(`/api/user/blog/posts/${route.params.id}`, {
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
    <div class="min-h-[calc(100vh-60px)] bg-gray-50/50 p-4 md:p-6">
        <div class="max-w-[1240px] mx-auto space-y-4 md:space-y-6">
            <!-- 头部区域 -->
            <div class="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                            <nuxt-link to="/user/dashboard" class="hover:text-primary transition-colors flex items-center">
                                <el-icon class="mr-1"><House /></el-icon>
                                用户中心
                            </nuxt-link>
                            <span>/</span>
                            <nuxt-link to="/user/posts/list" class="hover:text-primary transition-colors flex items-center">
                                我的博客
                            </nuxt-link>
                            <span>/</span>
                            <span class="text-gray-900">{{ isEdit ? '编辑文章' : '新建文章' }}</span>
                        </div>
                        <h1 class="text-xl md:text-2xl font-bold text-gray-900">{{ isEdit ? '编辑文章' : '新建文章' }}</h1>
                        <p class="text-gray-500 mt-1 text-sm">{{ isEdit ? '修改现有文章内容' : '创建一篇新的博客文章' }}</p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <el-button @click="() => router.push('/user/posts/list')" class="!flex items-center">
                            <el-icon class="mr-1"><ArrowLeft /></el-icon>
                            返回列表
                        </el-button>
                        <el-button type="primary" @click="submit" class="!flex items-center">
                            <el-icon class="mr-1"><Document /></el-icon>
                            保存文章
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- 表单区域 -->
            <div class="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
                <el-form ref="formRef" :model="form" label-width="80px" class="space-y-6">
                    <el-form-item 
                        label="标题" 
                        prop="title"
                        :rules="[
                            { required: true, message: '请输入文章标题', trigger: 'blur' },
                        ]"
                    >
                        <el-input 
                            v-model="form.title" 
                            placeholder="请输入文章标题" 
                            class="w-full !rounded-lg"
                        />
                    </el-form-item>

                    <el-form-item 
                        label="分类" 
                        prop="categoryIds"
                        :rules="[
                            { type: 'array', required: true, message: '请至少选择一个分类', trigger: 'change' }
                        ]"
                    >
                        <div class="space-y-4">
                            <!-- 分类标签区域 -->
                            <div class="flex flex-wrap gap-3">
                                <template v-if="categoriesData.length">
                                    <div v-for="category in categoriesData" 
                                        :key="category.id"
                                        class="group relative"
                                    >
                                        <div 
                                            class="px-4 py-2 rounded-full cursor-pointer transition-all duration-200"
                                            :class="[
                                                form.categoryIds.includes(category.id) 
                                                    ? 'bg-primary text-white shadow-sm' 
                                                    : 'bg-gray-50 hover:bg-gray-100'
                                            ]"
                                            @click="handleSelectCategory(category)"
                                        >
                                            {{ category.name }}
                                        </div>
                                        <el-button
                                            class="!absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            type="danger"
                                            size="small"
                                            circle
                                            @click="handleDeleteCategory(category)"
                                        >
                                            <el-icon><Delete /></el-icon>
                                        </el-button>
                                    </div>
                                </template>
                                <el-empty v-else description="暂无分类" />
                            </div>

                            <!-- 分类操作按钮 -->
                            <div class="flex items-center space-x-3">
                                <el-button 
                                    type="primary" 
                                    @click="handleAddCategory"
                                    class="!flex items-center"
                                >
                                    <el-icon class="mr-1"><Plus /></el-icon>
                                    添加分类
                                </el-button>
                                <el-button 
                                    @click="getCategories"
                                    class="!flex items-center"
                                >
                                    <el-icon class="mr-1"><Refresh /></el-icon>
                                    刷新列表
                                </el-button>
                            </div>
                        </div>
                    </el-form-item>

                    <el-form-item 
                        label="标签" 
                        prop="tags"
                        :rules="[
                            { type: 'array', required: true, message: '请至少添加一个标签', trigger: 'change' }
                        ]"
                    >
                        <div class="flex flex-wrap gap-2 border rounded-lg p-3 bg-gray-50/50">
                            <el-tag
                                v-for="tag in form.tags"
                                :key="tag"
                                closable
                                :disable-transitions="false"
                                @close="handleTagClose(tag)"
                                class="!rounded-full"
                            >
                                {{ tag }}
                            </el-tag>
                            <el-input
                                v-if="inputTagVisible"
                                ref="InputRef"
                                v-model="inputTagValue"
                                class="w-[100px]"
                                size="small"
                                @keyup.enter="handleTagInputConfirm"
                                @blur="handleTagInputConfirm"
                            />
                            <el-button v-else size="small" @click="showTagInput" class="!rounded-full">
                                + 新标签
                            </el-button>
                        </div>
                    </el-form-item>

                    <el-form-item 
                        label="内容" 
                        prop="content"
                        :rules="[
                            { required: true, message: '请输入文章内容', trigger: 'blur' }
                        ]"
                    >
                        <MdEditor 
                            v-model="form.content" 
                            :editorConfig="editorConfig" 
                            @onUploadImg="onUploadImg"
                            class="w-full"
                        />
                    </el-form-item>
                </el-form>
            </div>

            <!-- 添加分类对话框 -->
            <el-dialog 
                v-model="categoryDialogShow" 
                title="添加文章分类"
                width="500px"
                destroy-on-close
                class="rounded-xl"
            >
                <el-form 
                    ref="categoryFormRef" 
                    :model="categoryForm" 
                    label-width="80px"
                >
                    <el-form-item 
                        label="分类名称" 
                        prop="name" 
                        :rules="[
                            { required: true, message: '请输入分类名称', trigger: 'blur' }
                        ]"
                    >
                        <el-input v-model="categoryForm.name" placeholder="请输入分类名称" class="!rounded-lg" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <div class="flex justify-end space-x-3">
                        <el-button @click="categoryDialogShow = false">取消</el-button>
                        <el-button type="primary" @click="handleSubmitAddCategory">确认</el-button>
                    </div>
                </template>
            </el-dialog>
        </div>
    </div>
</template>

<style scoped>
.el-form-item :deep(.el-form-item__label) {
    font-weight: 500;
}

:deep(.md-editor) {
    border: 1px solid var(--el-border-color);
    border-radius: 0.75rem;
    overflow: hidden;
}

:deep(.md-editor-dark) {
    --md-bk-color: #1e1e1e;
}

/* 调整编辑器高度 */
:deep(.md-editor-content) {
    min-height: 500px;
}

/* 预览区域样式优化 */
:deep(.md-editor-preview) {
    padding: 16px 24px;
}

/* 工具栏样式优化 */
:deep(.md-editor-toolbar) {
    border-bottom: 1px solid var(--el-border-color);
    background-color: rgb(249 250 251);
}

/* 代码块样式优化 */
:deep(.md-editor-preview pre) {
    background: #f6f8fa;
    border-radius: 0.75rem;
    padding: 16px;
}

:deep(.el-textarea__inner) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    line-height: 1.6;
}

/* 按钮样式优化 */
:deep(.el-button) {
    border-radius: 0.5rem;
}

/* 输入框样式优化 */
:deep(.el-input__wrapper) {
    border-radius: 0.5rem;
}

/* 对话框样式优化 */
:deep(.el-dialog) {
    border-radius: 0.75rem;
}
</style>