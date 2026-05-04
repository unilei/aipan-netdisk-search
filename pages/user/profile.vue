<template>
  <div class="min-h-[calc(100vh-60px)] bg-gray-50 dark:bg-gray-900">
    <div class="max-w-[1240px] mx-auto p-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div class="relative h-32 bg-linear-to-r from-blue-500 to-purple-500">
          <div class="absolute -bottom-12 left-6">
            <div class="w-24 h-24 rounded-full bg-white dark:bg-gray-700 p-1 cursor-pointer group relative"
              @click="showAvatarDialog = true">
              <img :src="getAvatarUrl(form.username || 'default', form.avatarStyle)" alt="avatar"
                class="w-full h-full rounded-full object-cover" />
              <div
                class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <el-icon class="text-white text-xl">
                  <Edit />
                </el-icon>
              </div>
            </div>
          </div>
        </div>
        <div class="pt-14 px-6 pb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-6">
            编辑个人资料
          </h1>

          <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" placeholder="请输入用户名" />
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>

            <div class="flex justify-end space-x-4 mt-6">
              <el-button @click="() => navigateTo('/user/dashboard')">取消</el-button>
              <el-button type="primary" @click="handleSubmit" :loading="loading">
                保存修改
              </el-button>
            </div>
          </el-form>
        </div>
      </div>
    </div>
    <!-- 头像选择对话框 -->
    <el-dialog v-model="showAvatarDialog" title="选择头像风格" width="600px">
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <div v-for="style in avatarStyles" :key="style.value"
          class="cursor-pointer rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          :class="{ 'bg-blue-50 dark:bg-blue-900': form.avatarStyle === style.value }"
          @click="selectAvatarStyle(style.value)">
          <div class="aspect-square rounded-lg overflow-hidden mb-2">
            <img :src="getAvatarUrl(form.username || 'default', style.value)" :alt="style.label"
              class="w-full h-full object-cover" />
          </div>
          <div class="text-center text-sm text-gray-600 dark:text-gray-300">{{ style.label }}</div>
        </div>
      </div>
    </el-dialog>
  </div>


</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Edit } from '@element-plus/icons-vue'
import { useUserStore } from '~/stores/user'

definePageMeta({
  middleware: ['auth']
})

const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)
const showAvatarDialog = ref(false)

const avatarStyles = [
  { label: '卡通形象', value: 'avataaars' },
  { label: '像素风格', value: 'pixel-art' },
  { label: '机器人', value: 'bottts' },
  { label: '方块脸', value: 'big-ears' },
  { label: '简约风格', value: 'initials' },
  { label: '可爱风格', value: 'adventurer' },
  { label: '迷你头像', value: 'miniavs' },
  { label: '复古风格', value: 'personas' }
]

const form = ref({
  username: '',
  email: '',
  avatarStyle: 'avataaars' // 默认头像风格
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 获取头像 URL
const getAvatarUrl = (seed, style) => {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`
}

// 选择头像风格
const selectAvatarStyle = (style) => {
  form.value.avatarStyle = style
  showAvatarDialog.value = false
}

// 获取用户信息
const fetchUserInfo = () => {
  if (userStore.user) {
    form.value = {
      username: userStore.user.username || '',
      email: userStore.user.email || '',
      avatarStyle: userStore.user.avatarStyle || 'avataaars'
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    const res = await $fetch('/api/user/profile/update', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      },
      body: form.value
    })

    if (res.code === 200) {
      // 更新用户信息到store
      userStore.user = res.data
      ElMessage.success('更新成功')
      navigateTo('/user/dashboard')
    }
  } catch (error) {
    console.error('更新用户信息失败:', error)
    ElMessage.error(error?.data?.message || '更新失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUserInfo()
})
</script>