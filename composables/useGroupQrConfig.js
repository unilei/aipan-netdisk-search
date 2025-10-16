import { ref, reactive, computed, readonly } from 'vue'

export const useGroupQrConfig = () => {
  const loading = ref(false)
  const error = ref(null)
  
  // 配置数据
  const config = reactive({
    enabled: true,
    title: '为防止网站和谐，请扫码获取最新网址',
    description: '长按识别二维码或扫码进群',
    qrCodeUrl: '',
    showInHeader: true,
    showInSearchResults: true
  })

  // 获取配置
  const getConfig = async () => {
    if (loading.value) return config
    
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch('/api/group-qr/config')
      
      if (response.code === 200) {
        Object.assign(config, response.data)
      } else {
        throw new Error(response.msg || '获取配置失败')
      }
    } catch (err) {
      error.value = err.message || '获取群二维码配置失败'
      console.error('获取群二维码配置失败:', err)
    } finally {
      loading.value = false
    }
    
    return config
  }

  // 刷新配置
  const refreshConfig = async () => {
    return await getConfig()
  }

  // 检查是否应该显示在指定位置
  const shouldShowInHeader = computed(() => {
    return config.enabled && config.showInHeader && config.qrCodeUrl
  })

  const shouldShowInSearchResults = computed(() => {
    return config.enabled && config.showInSearchResults && config.qrCodeUrl
  })

  return {
    config: readonly(config),
    loading: readonly(loading),
    error: readonly(error),
    getConfig,
    refreshConfig,
    shouldShowInHeader,
    shouldShowInSearchResults
  }
}