import { ref, watch, computed } from 'vue'
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
    const selectedVodSource = ref<VodSource | null>(null)
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
     * 获取选中VOD源的存储键
     */
    const getSelectedSourceStorageKey = () => {
        if (userStore.loggedIn && userStore.user?.id) {
            return `selected_vod_source_user_${userStore.user.id}`
        }
        return 'selected_vod_source'
    }

    /**
     * 从localStorage加载选中的VOD源
     */
    const loadSelectedSourceFromLocalStorage = () => {
        if (!process.client) {
            return;
        }

        try {
            const key = getSelectedSourceStorageKey()
            const savedSelectedSource = localStorage.getItem(key)

            if (savedSelectedSource) {
                const parsedSource = JSON.parse(savedSelectedSource)
                // 验证选中的源是否还在sources列表中
                const foundSource = sources.value.find(s => s.key === parsedSource.key)
                if (foundSource) {
                    selectedVodSource.value = foundSource
                } else if (sources.value.length > 0) {
                    // 如果选中的源不存在，选择第一个可用源
                    selectedVodSource.value = sources.value[0]
                    saveSelectedSourceToLocalStorage(sources.value[0])
                }
            } else if (sources.value.length > 0) {
                // 如果没有保存的选中源，选择第一个
                selectedVodSource.value = sources.value[0]
                saveSelectedSourceToLocalStorage(sources.value[0])
            }
        } catch (error) {
            console.error('从localStorage加载选中VOD源失败:', error)
            if (sources.value.length > 0) {
                selectedVodSource.value = sources.value[0]
            }
        }
    }

    /**
     * 保存选中的VOD源到localStorage
     */
    const saveSelectedSourceToLocalStorage = (source: VodSource) => {
        if (!process.client) {
            return;
        }

        try {
            const key = getSelectedSourceStorageKey()
            localStorage.setItem(key, JSON.stringify(source))
        } catch (error) {
            console.error('保存选中VOD源到localStorage失败:', error)
        }
    }

    /**
     * 从localStorage加载配置
     */
    const loadFromLocalStorage = () => {
        if (!process.client) {
            console.log('在服务器端，跳过localStorage操作');
            sources.value = [];
            return;
        }

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

            // 加载sources后，加载选中的源
            loadSelectedSourceFromLocalStorage()
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
            if (process.client) {
                const key = getStorageKey()
                localStorage.setItem(key, JSON.stringify(newSources))
            }

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

            // 更新sources后，检查selectedVodSource是否还有效
            if (selectedVodSource.value) {
                const foundSource = newSources.find(s => s.key === selectedVodSource.value?.key)
                if (!foundSource && newSources.length > 0) {
                    // 如果当前选中的源不在新列表中，选择第一个
                    selectedVodSource.value = newSources[0]
                    saveSelectedSourceToLocalStorage(newSources[0])
                }
            } else if (newSources.length > 0) {
                // 如果没有选中源，选择第一个
                selectedVodSource.value = newSources[0]
                saveSelectedSourceToLocalStorage(newSources[0])
            }

            return true
        } catch (error) {
            console.error('保存VOD源配置失败:', error)
            return false
        }
    }

    /**
     * 切换选中的VOD源
     */
    const switchVodSource = (sourceKey: string) => {
        const foundSource = sources.value.find(s => s.key === sourceKey)
        if (foundSource) {
            selectedVodSource.value = foundSource
            saveSelectedSourceToLocalStorage(foundSource)
            return true
        }
        return false
    }

    /**
     * 获取当前选中的VOD源，确保始终有值
     */
    const getCurrentVodSource = () => {
        if (selectedVodSource.value) {
            return selectedVodSource.value
        }

        // 如果没有选中源但有可用源，选择第一个
        if (sources.value.length > 0) {
            selectedVodSource.value = sources.value[0]
            saveSelectedSourceToLocalStorage(sources.value[0])
            return sources.value[0]
        }

        // 如果没有任何源，返回null
        return null
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
                    loadSelectedSourceFromLocalStorage()
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

    // 监听sources变化，确保selectedVodSource始终有值
    watch(sources, (newSources) => {
        if (newSources.length > 0 && !selectedVodSource.value) {
            selectedVodSource.value = newSources[0]
            saveSelectedSourceToLocalStorage(newSources[0])
        }
    }, { immediate: true })

    // 监听用户登录状态变化，重新加载源
    watch(() => userStore.loggedIn, (newValue, oldValue) => {
        if (newValue !== oldValue) {
            loadSources()
        }
    })

    // 创建一个computed属性，确保selectedVodSource始终有值
    const currentVodSource = computed(() => {
        if (selectedVodSource.value) {
            return selectedVodSource.value
        }

        // 如果没有选中源但有可用源，自动选择第一个
        if (sources.value.length > 0) {
            const firstSource = sources.value[0]
            selectedVodSource.value = firstSource
            saveSelectedSourceToLocalStorage(firstSource)
            return firstSource
        }

        return null
    })

    // 初始加载
    loadSources()

    return {
        sources,
        selectedVodSource: currentVodSource,
        isLoading,
        loadSources,
        saveSources,
        switchVodSource,
        getCurrentVodSource,
        getStorageKey
    }
} 