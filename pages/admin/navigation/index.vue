<template>
  <div>
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
                <span class="text-gray-900">导航管理</span>
              </div>
              <h1 class="text-2xl font-bold text-gray-900">导航分类管理</h1>
              <p class="text-gray-500 mt-1">管理网站导航分类和导航项</p>
            </div>
            <div class="flex items-center space-x-4">
              <el-button type="primary" @click="showCategoryDialog = true" class="flex items-center">
                <el-icon class="mr-1">
                  <Plus />
                </el-icon>
                添加分类
              </el-button>
              <el-button @click="initializeData" :loading="initializing" class="flex items-center">
                <el-icon class="mr-1">
                  <Refresh />
                </el-icon>
                初始化数据
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

        <!-- 分类管理 -->
        <div class="bg-white rounded-lg p-6 shadow-sm" v-if="!selectedCategory">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">导航分类</h2>
            <div class="text-sm text-gray-500">
              共 {{ categories.length }} 个分类
            </div>
          </div>

          <div v-if="loading" class="py-10">
            <el-skeleton :rows="5" animated />
          </div>

          <div v-else-if="!categories || categories.length === 0" class="text-center py-10">
            <el-empty description="暂无导航分类" />
            <p class="mt-4 text-gray-500">点击"添加分类"按钮创建第一个导航分类</p>
          </div>

          <div v-else>
            <el-table :data="categories" style="width: 100%" border stripe>
              <el-table-column type="index" label="序号" width="80" align="center" />
              <el-table-column prop="name" label="分类名称" min-width="120" />
              <el-table-column prop="slug" label="标识符" min-width="120" />
              <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
              <el-table-column prop="isActive" label="状态" width="80" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.isActive ? 'success' : 'danger'">
                    {{ row.isActive ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="导航项数量" width="100" align="center">
                <template #default="{ row }">
                  <el-tag type="info">{{ row.items?.length || 0 }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="280" fixed="right">
                <template #default="{ row }">
                  <el-button-group>
                    <el-button size="small" @click="editCategory(row)">
                      <el-icon>
                        <Edit />
                      </el-icon>
                      编辑
                    </el-button>
                    <el-button size="small" type="primary" @click="manageItems(row)">
                      <el-icon>
                        <Menu />
                      </el-icon>
                      管理导航项
                    </el-button>
                    <el-button size="small" type="danger" @click="deleteCategory(row)">
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

        <!-- 导航项管理 -->
        <div class="bg-white rounded-lg p-6 shadow-sm" v-if="selectedCategory">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">
                {{ selectedCategory.name }} - 导航项管理
              </h2>
              <p class="text-sm text-gray-500 mt-1">
                管理 "{{ selectedCategory.name }}" 分类下的导航项
              </p>
            </div>
            <div class="flex items-center space-x-4">
              <el-button type="primary" @click="showItemDialog = true" class="flex items-center">
                <el-icon class="mr-1">
                  <Plus />
                </el-icon>
                添加导航项
              </el-button>
              <el-button @click="selectedCategory = null" class="flex items-center">
                <el-icon class="mr-1">
                  <ArrowLeft />
                </el-icon>
                返回分类列表
              </el-button>
            </div>
          </div>

          <div v-if="loading" class="py-10">
            <el-skeleton :rows="5" animated />
          </div>

          <div v-else-if="!currentItems || currentItems.length === 0" class="text-center py-10">
            <el-empty description="暂无导航项" />
            <p class="mt-4 text-gray-500">点击"添加导航项"按钮创建第一个导航项</p>
          </div>

          <div v-else>
            <el-table :data="currentItems" style="width: 100%" border stripe>
              <el-table-column type="index" label="序号" width="80" align="center" />
              <el-table-column prop="title" label="标题" min-width="120" />
              <el-table-column prop="path" label="路径" min-width="150" />
              <el-table-column prop="icon" label="图标" width="80" align="center">
                <template #default="{ row }">
                  <i :class="['fa-solid', row.icon]" class="text-lg"></i>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
              <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
              <el-table-column prop="target" label="打开方式" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.target === '_blank' ? 'warning' : 'info'" size="small">
                    {{ row.target === '_blank' ? '新窗口' : '当前窗口' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="isActive" label="状态" width="80" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.isActive ? 'success' : 'danger'">
                    {{ row.isActive ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                  <el-button-group>
                    <el-button size="small" @click="editItem(row)">
                      <el-icon>
                        <Edit />
                      </el-icon>
                      编辑
                    </el-button>
                    <el-button size="small" type="danger" @click="deleteItem(row)">
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
    </div>

    <!-- 分类对话框 -->
    <el-dialog v-model="showCategoryDialog" :title="editingCategory ? '编辑分类' : '添加分类'" width="500px">
      <el-form :model="categoryForm" :rules="categoryRules" ref="categoryFormRef" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="标识符" prop="slug">
          <el-input v-model="categoryForm.slug" placeholder="请输入标识符（英文）" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="categoryForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCategoryDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">确定</el-button>
      </template>
    </el-dialog>

    <!-- 导航项对话框 -->
    <el-dialog v-model="showItemDialog" :title="editingItem ? '编辑导航项' : '添加导航项'" width="600px">
      <el-form :model="itemForm" :rules="itemRules" ref="itemFormRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="itemForm.title" placeholder="请输入导航项标题" />
        </el-form-item>
        <el-form-item label="路径" prop="path">
          <el-input v-model="itemForm.path" placeholder="请输入路径，如：/search" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="itemForm.icon" placeholder="请输入FontAwesome图标类名，如：fa-search">
            <template #prepend>
              <i :class="['fa-solid', itemForm.icon]" v-if="itemForm.icon"></i>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="itemForm.description" placeholder="请输入描述（可选）" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="itemForm.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="打开方式">
          <el-select v-model="itemForm.target">
            <el-option label="当前窗口" value="_self" />
            <el-option label="新窗口" value="_blank" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="itemForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showItemDialog = false">取消</el-button>
        <el-button type="primary" @click="saveItem">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  House,
  Plus,
  Refresh,
  ArrowLeft,
  Edit,
  Delete,
  Menu
} from '@element-plus/icons-vue'

definePageMeta({
  middleware: ['admin']
})

// 页面数据
const categories = ref([])
const items = ref([])
const selectedCategory = ref(null)
const loading = ref(false)
const initializing = ref(false)

// 对话框状态
const showCategoryDialog = ref(false)
const showItemDialog = ref(false)
const editingCategory = ref(null)
const editingItem = ref(null)

// 表单引用
const categoryFormRef = ref()
const itemFormRef = ref()

// 分类表单
const categoryForm = reactive({
  name: '',
  slug: '',
  sortOrder: 0,
  isActive: true
})

// 导航项表单
const itemForm = reactive({
  title: '',
  path: '',
  icon: '',
  description: '',
  sortOrder: 0,
  target: '_self',
  isActive: true
})

// 表单验证规则
const categoryRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  slug: [{ required: true, message: '请输入标识符', trigger: 'blur' }]
}

const itemRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路径', trigger: 'blur' }],
  icon: [{ required: true, message: '请输入图标', trigger: 'blur' }]
}

// 计算属性
const currentItems = computed(() => {
  if (!selectedCategory.value) return []
  return items.value.filter(item => item.categoryId === selectedCategory.value.id)
})

// 页面加载
onMounted(() => {
  loadCategories()
  loadItems()
})

// 加载分类
const loadCategories = async () => {
  try {
    loading.value = true
    const res = await $fetch('/api/admin/navigation/categories', {
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    })
    if (res.code === 200) {
      categories.value = res.data
    } else {
      ElMessage.error(res.msg || '加载分类失败')
    }
  } catch (error) {
    ElMessage.error('加载分类失败')
  } finally {
    loading.value = false
  }
}

// 初始化数据
const initializeData = async () => {
  try {
    initializing.value = true
    const res = await $fetch('/api/admin/navigation/init', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    })
    if (res.code === 200) {
      ElMessage.success(res.msg || '数据初始化成功')
      await loadCategories()
      await loadItems()
    } else {
      ElMessage.error(res.msg || '初始化失败')
    }
  } catch (error) {
    ElMessage.error('初始化失败')
  } finally {
    initializing.value = false
  }
}

// 加载导航项
const loadItems = async () => {
  try {
    const res = await $fetch('/api/admin/navigation/items', {
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    })
    if (res.code === 200) {
      items.value = res.data
    } else {
      ElMessage.error(res.msg || '加载导航项失败')
    }
  } catch (error) {
    ElMessage.error('加载导航项失败')
  }
}

// 分类管理
const editCategory = (category) => {
  editingCategory.value = category
  Object.assign(categoryForm, category)
  showCategoryDialog.value = true
}

const saveCategory = async () => {
  try {
    await categoryFormRef.value.validate()

    console.log('保存分类数据:', categoryForm)
    console.log('编辑状态:', editingCategory.value)

    let res
    if (editingCategory.value) {
      console.log('更新分类 ID:', editingCategory.value.id)
      res = await $fetch(`/api/admin/navigation/categories/${editingCategory.value.id}`, {
        method: 'PUT',
        body: categoryForm,
        headers: {
          Authorization: `Bearer ${useCookie('token').value}`
        }
      })
    } else {
      console.log('创建新分类')
      res = await $fetch('/api/admin/navigation/categories', {
        method: 'POST',
        body: categoryForm,
        headers: {
          Authorization: `Bearer ${useCookie('token').value}`
        }
      })
    }

    console.log('API响应:', res)

    if (res.code === 200) {
      ElMessage.success(res.msg || (editingCategory.value ? '分类更新成功' : '分类创建成功'))
      showCategoryDialog.value = false
      resetCategoryForm()
      loadCategories()
    } else {
      ElMessage.error(res.msg || '操作失败')
    }
  } catch (error) {
    console.error('保存分类失败:', error)
    ElMessage.error(error.data?.message || error.message || '操作失败')
  }
}

const deleteCategory = async (category) => {
  try {
    await ElMessageBox.confirm('确定要删除这个分类吗？', '确认删除', {
      type: 'warning'
    })

    const res = await $fetch(`/api/admin/navigation/categories/${category.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    })

    if (res.code === 200) {
      ElMessage.success(res.msg || '分类删除成功')
      loadCategories()

      if (selectedCategory.value?.id === category.id) {
        selectedCategory.value = null
      }
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 导航项管理
const manageItems = (category) => {
  selectedCategory.value = category
}

const editItem = (item) => {
  editingItem.value = item
  Object.assign(itemForm, item)
  showItemDialog.value = true
}

const saveItem = async () => {
  try {
    await itemFormRef.value.validate()

    const data = {
      ...itemForm,
      categoryId: selectedCategory.value.id
    }

    let res
    if (editingItem.value) {
      res = await $fetch(`/api/admin/navigation/items/${editingItem.value.id}`, {
        method: 'PUT',
        body: data,
        headers: {
          Authorization: `Bearer ${useCookie('token').value}`
        }
      })
    } else {
      res = await $fetch('/api/admin/navigation/items', {
        method: 'POST',
        body: data,
        headers: {
          Authorization: `Bearer ${useCookie('token').value}`
        }
      })
    }

    if (res.code === 200) {
      ElMessage.success(res.msg || (editingItem.value ? '导航项更新成功' : '导航项创建成功'))
      showItemDialog.value = false
      resetItemForm()
      loadItems()
    } else {
      ElMessage.error(res.msg || '操作失败')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const deleteItem = async (item) => {
  try {
    await ElMessageBox.confirm('确定要删除这个导航项吗？', '确认删除', {
      type: 'warning'
    })

    const res = await $fetch(`/api/admin/navigation/items/${item.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${useCookie('token').value}`
      }
    })

    if (res.code === 200) {
      ElMessage.success(res.msg || '导航项删除成功')
      loadItems()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 重置表单
const resetCategoryForm = () => {
  Object.assign(categoryForm, {
    name: '',
    slug: '',
    sortOrder: 0,
    isActive: true
  })
  editingCategory.value = null
}

const resetItemForm = () => {
  Object.assign(itemForm, {
    title: '',
    path: '',
    icon: '',
    description: '',
    sortOrder: 0,
    target: '_self',
    isActive: true
  })
  editingItem.value = null
}

// 监听对话框关闭
watch(showCategoryDialog, (val) => {
  if (!val) resetCategoryForm()
})

watch(showItemDialog, (val) => {
  if (!val) resetItemForm()
})
</script>
