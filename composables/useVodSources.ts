import { ref, watch } from 'vue'
import { useUserStore } from '~/stores/user'

// VOD源类型定义
export interface VodSource {
    key: string;
    name: string;
    api: string;
    playUrl: string;
    type: 'json' | 'xml';
}

// API响应类型
interface ApiResponse {
    code: number;
    msg: string;
    data?: any;
    error?: string;
}

export const useVodSources = () => {
    const userStore = useUserStore()
    const sources = ref<VodSource[]>([])
    const isLoading = ref(false)

    /**
     * 获取VOD源的存储键
     * 如果用户已登录，则使用用户特定的键
     * 否则使用全局键
     */
    const getStorageKey = () => {
        if (userStore.loggedIn && userStore.user?.id) {
            return `vod_sources_user_${userStore.user.id}`
        }
        return 'vod_sources'
    }

    /**
     * 从localStorage加载配置
     */
    const loadFromLocalStorage = () => {
        try {
            const key = getStorageKey()
            const savedSources = localStorage.getItem(key)

            if (savedSources) {
                sources.value = JSON.parse(savedSources)
            } else if (userStore.loggedIn) {
                // 如果用户登录但没有个人配置，尝试使用全局配置
                const globalSources = localStorage.getItem('vod_sources')
                if (globalSources) {
                    sources.value = JSON.parse(globalSources)
                } else {
                    sources.value = []
                }
            } else {
                sources.value = []
            }
        } catch (error) {
            console.error('从localStorage加载VOD源配置失败:', error)
            sources.value = []
        }
    }

    /**
     * 保存VOD源配置
     * 如果用户已登录，则保存到服务器
     * 否则只保存到localStorage
     */
    const saveSources = async (newSources: VodSource[]) => {
        try {
            // 始终保存到localStorage作为备份
            const key = getStorageKey()
            localStorage.setItem(key, JSON.stringify(newSources))

            // 如果用户已登录，则同时保存到服务器
            if (userStore.loggedIn && userStore.token) {
                await $fetch<ApiResponse>('/api/user/vod-config/save', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${userStore.token}`
                    },
                    body: {
                        config: newSources
                    }
                })
            }

            sources.value = newSources
            return true
        } catch (error) {
            console.error('保存VOD源配置失败:', error)
            return false
        }
    }

    /**
     * 从服务器加载VOD源配置
     * 如果用户已登录且存在配置，则从服务器加载
     * 否则尝试从localStorage加载
     */
    const loadSources = async () => {
        isLoading.value = true
        try {
            if (userStore.loggedIn && userStore.token) {
                // 从服务器加载用户配置
                const res = await $fetch<ApiResponse>('/api/user/vod-config/get', {
                    headers: {
                        'Authorization': `Bearer ${userStore.token}`
                    }
                })

                if (res.code === 200 && res.data) {
                    sources.value = res.data
                    return
                } else if (res.code === 404) {
                    // 用户没有配置，尝试从localStorage加载并保存到服务器
                    loadFromLocalStorage()
                    if (sources.value.length > 0) {
                        await saveSources(sources.value)
                    }
                    return
                }
            }

            // 未登录或加载失败，从localStorage加载
            loadFromLocalStorage()
        } catch (error) {
            console.error('加载VOD源配置失败:', error)
            // 出错后从localStorage加载
            loadFromLocalStorage()
        } finally {
            isLoading.value = false
        }
    }

    // 监听用户登录状态变化，重新加载源
    watch(() => userStore.loggedIn, (newValue, oldValue) => {
        if (newValue !== oldValue) {
            loadSources()
        }
    })

    // 初始加载
    loadSources()

    return {
        sources,
        isLoading,
        loadSources,
        saveSources,
        getStorageKey
    }
} 