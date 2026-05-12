<script setup>
import { Document, Edit, Delete, Plus, Refresh, Connection } from '@element-plus/icons-vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth']
})

const authOptions = [
  { label: '公开访问', value: 'public' },
  { label: '账号密码', value: 'password' },
  { label: '手动 Token', value: 'token' },
]

const getAuthHeaders = () => ({
  authorization: `Bearer ${useCookie('token').value}`
})

const getDefaultForm = () => ({
  id: null,
  name: '',
  link: '',
  authMode: 'public',
  username: '',
  secret: '',
  rootPath: '/',
  enabled: true,
})

const alistDialogShow = ref(false)
const loading = ref(false)
const tableLoading = ref(false)
const testLoading = ref(false)
const form = reactive(getDefaultForm())
const formRef = ref()

const rules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  link: [
    { required: true, message: '请输入源链接', trigger: 'blur' },
    { type: 'url', message: '请输入正确的 URL 地址', trigger: 'blur' }
  ],
  rootPath: [
    { required: true, message: '请输入根目录', trigger: 'blur' }
  ],
}

const alistsData = ref([])
const page = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

const resetForm = () => {
  Object.assign(form, getDefaultForm())
}

const getAlists = async () => {
  tableLoading.value = true
  try {
    const res = await $fetch('/api/admin/alist/get', {
      method: 'GET',
      query: {
        page: page.value,
        pageSize: pageSize.value
      },
      headers: getAuthHeaders()
    })
    alistsData.value = res.alists || []
    totalCount.value = res.totalCount || 0
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    tableLoading.value = false
  }
}

const handleAddAlist = () => {
  resetForm()
  alistDialogShow.value = true
}

const handleEditAlist = (row) => {
  Object.assign(form, {
    id: row.id,
    name: row.name,
    link: row.link,
    authMode: row.authMode || 'public',
    username: row.username || '',
    secret: '',
    rootPath: row.rootPath || '/',
    enabled: row.enabled !== false,
  })
  alistDialogShow.value = true
}

const buildPayload = () => ({
  name: form.name,
  link: form.link,
  authMode: form.authMode,
  username: form.username,
  secret: form.secret,
  rootPath: form.rootPath || '/',
  enabled: form.enabled,
})

const handleSubmitAdd = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      if (form.id) {
        await $fetch(`/api/admin/alist/${form.id}`, {
          method: 'PUT',
          body: buildPayload(),
          headers: getAuthHeaders()
        })
        ElMessage.success('更新成功')
      } else {
        await $fetch('/api/admin/alist/post', {
          method: 'POST',
          body: buildPayload(),
          headers: getAuthHeaders()
        })
        ElMessage.success('添加成功')
      }
      alistDialogShow.value = false
      await getAlists()
    } catch (error) {
      ElMessage.error(error?.statusMessage || '操作失败')
    } finally {
      loading.value = false
    }
  })
}

const handleTestAlist = async (row = null) => {
  testLoading.value = true
  try {
    const payload = row?.id ? { id: row.id } : { id: form.id, ...buildPayload() }
    const res = await $fetch('/api/admin/alist/test', {
      method: 'POST',
      body: payload,
      headers: getAuthHeaders()
    })
    if (res.code === 200) {
      ElMessage.success('连接正常')
    } else {
      ElMessage.warning(res.msg || '连接异常')
    }
    await getAlists()
  } catch (error) {
    ElMessage.error(error?.statusMessage || '连接测试失败')
  } finally {
    testLoading.value = false
  }
}

const handleDeleteAlist = async (row) => {
  try {
    await $fetch(`/api/admin/alist/${row.id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    ElMessage.success('删除成功')
    await getAlists()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const handleCurrentChange = (val) => {
  page.value = val
  getAlists()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  getAlists()
}

onMounted(getAlists)
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div class="flex flex-wrap items-center gap-3">
        <el-button type="primary" @click="handleAddAlist">
          <el-icon class="mr-1"><Plus /></el-icon>
          添加数据源
        </el-button>
        <el-button @click="getAlists">
          <el-icon class="mr-1"><Refresh /></el-icon>
          刷新列表
        </el-button>
      </div>
    </div>

    <div v-loading="tableLoading" class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <el-table
        :data="alistsData"
        border
        class="w-full">
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column prop="name" label="名称" min-width="180">
          <template #default="{ row }">
            <div class="flex items-center">
              <el-icon class="mr-2 text-blue-500"><Document /></el-icon>
              <span class="text-gray-800 dark:text-gray-200">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="link" label="源链接" min-width="260" show-overflow-tooltip />
        <el-table-column label="认证" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.authMode === 'public'" type="info">公开</el-tag>
            <el-tag v-else-if="row.authMode === 'password'" type="warning">账号密码</el-tag>
            <el-tag v-else type="success">Token</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rootPath" label="根目录" width="140" show-overflow-tooltip />
        <el-table-column label="启用" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.healthStatus === 'ok'" type="success">正常</el-tag>
            <el-tag v-else-if="row.healthStatus === 'error'" type="danger">异常</el-tag>
            <el-tag v-else type="info">未测试</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button
                size="small"
                :loading="testLoading"
                @click="handleTestAlist(row)">
                <el-icon><Connection /></el-icon>
                测试
              </el-button>
              <el-button
                type="primary"
                size="small"
                @click="handleEditAlist(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-popconfirm
                title="确定要删除这个数据源吗？"
                @confirm="handleDeleteAlist(row)">
                <template #reference>
                  <el-button type="danger" size="small">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </template>
              </el-popconfirm>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-6 flex justify-center">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalCount"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <el-dialog
      v-model="alistDialogShow"
      :title="form.id ? '编辑 AList 数据源' : '添加 AList 数据源'"
      width="560px"
      destroy-on-close>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        :disabled="loading">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入数据源名称" />
        </el-form-item>
        <el-form-item label="源链接" prop="link">
          <el-input v-model="form.link" placeholder="https://alist.example.com" />
        </el-form-item>
        <el-form-item label="认证模式" prop="authMode">
          <el-select v-model="form.authMode" class="w-full">
            <el-option
              v-for="item in authOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.authMode === 'password'" label="用户名">
          <el-input v-model="form.username" placeholder="AList 用户名" />
        </el-form-item>
        <el-form-item v-if="form.authMode !== 'public'" :label="form.authMode === 'token' ? 'Token' : '密码'">
          <el-input
            v-model="form.secret"
            :type="form.authMode === 'token' ? 'textarea' : 'password'"
            :placeholder="form.id ? '留空则保留原配置' : '请输入认证信息'"
            :show-password="form.authMode === 'password'"
          />
        </el-form-item>
        <el-form-item label="根目录" prop="rootPath">
          <el-input v-model="form.rootPath" placeholder="/" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="alistDialogShow = false">取消</el-button>
          <el-button :loading="testLoading" @click="handleTestAlist()">
            测试连接
          </el-button>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleSubmitAdd">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
