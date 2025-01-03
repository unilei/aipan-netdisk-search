<template>
  <div class="min-h-[calc(100vh-60px)] bg-gray-50 dark:bg-gray-900 p-6">
    <div class="max-w-[1000px] mx-auto">
      <!-- 头部区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-200">资源投稿</h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">分享你的资源</p>
          </div>
          <div class="flex items-center space-x-4">
            <el-button @click="() => navigateTo('/user/dashboard')">
              返回
            </el-button>
            <el-button type="primary" @click="handleSubmit" :loading="submitting">
              提交资源
            </el-button>
          </div>
        </div>
      </div>

      <!-- 编辑区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-6">
        <el-form ref="formRef" :model="form" label-width="100px">
          <el-form-item label="资源名称" prop="name" :rules="{
            required: true,
            message: '资源名称不能为空',
            trigger: 'blur'
          }">
            <el-input v-model="form.name" placeholder="请输入资源名称"></el-input>
          </el-form-item>

          <!-- 资源链接 -->
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
              @click="addLink"
              class="flex items-center"
            >
              <el-icon class="mr-1"><Plus /></el-icon>
              添加链接
            </el-button>
          </el-form-item>

          <!-- 描述输入 -->
          <el-form-item label="资源描述" prop="description" :rules="{
            required: true,
            message: '资源描述不能为空',
            trigger: 'blur'
          }">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="4"
              placeholder="请输入资源描述"
              :maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Plus, Delete } from '@element-plus/icons-vue'

definePageMeta({
  middleware: ['auth']
})

const { $message } = useNuxtApp()
const token = useCookie('token')
const formRef = ref()

// 表单数据
const form = reactive({
  name: '',
  links: [
    {
      key: Date.now(),
      value: ''
    }
  ],
  description: ''
})

// 状态
const submitting = ref(false)

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

// 提交资源
const handleSubmit = async () => {
  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    if (!token.value) {
      $message.error('请先登录')
      return navigateTo('/login')
    }

    submitting.value = true
    const res = await $fetch('/api/user/resources/submit', {
      method: 'POST',
      body: {
        name: form.name,
        links: JSON.stringify(form.links),
        description: form.description
      },
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    if (res.code === 200) {
      $message.success('资源提交成功')
      // 跳转到投稿列表
      navigateTo('/user/resources')
    } else {
      throw new Error(res.msg || '提交失败')
    }
  } catch (error) {
    console.error('提交资源失败:', error)
    if (error.statusCode === 401) {
      $message.error('请先登录')
      return navigateTo('/login')
    }
    $message.error(error.message || '提交失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script> 