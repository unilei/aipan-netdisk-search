<script setup>
useHead({
    title: 'TVbox系列数据源接口地址',
    meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'keywords', content: 'aipan.me,TVbox,数据源,接口地址,猫影视TV,电视盒子接口,数据源接口,免费数据源' },
        { hid: 'description', name: 'description', content: 'aipan.me是全网最全免费数据源,TVbox系列数据源接口地址,TVbox影视仓电视盒子接口,猫影视TV数据源接口' },
        { name: 'format-detection', content: 'telephone=no' }
    ]
})

const tvbox = ref([])
const searchQuery = ref('')
const currentDate = ref(new Date().toLocaleString())
const activeCategory = ref('全部')
const categories = ref(['全部'])

const getData = async () => {
    const res = await $fetch('/api/tvbox')
    tvbox.value = res.list || [];
    // 提取所有分类
    const cats = new Set(tvbox.value.map(item => item.category || '未分类'))
    categories.value = ['全部', ...Array.from(cats)]
}

// 过滤后的数据源列表
const filteredTvbox = computed(() => {
    return tvbox.value.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                            item.link.toLowerCase().includes(searchQuery.value.toLowerCase())
        const matchesCategory = activeCategory.value === '全部' || item.category === activeCategory.value
        return matchesSearch && matchesCategory
    })
})

onMounted(() => {
    getData()
})

const copyTipsMsg = (type, message = '') => {
    ElMessage({
        message: message || (type === 'success' ? '复制成功' : '复制失败'),
        type: type
    })
}

const copy = async (text) => {
    try {
        await navigator.clipboard.writeText(text)
        copyTipsMsg('success')
    } catch (err) {
        // 降级方案
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        try {
            document.execCommand('copy')
            copyTipsMsg('success')
        } catch (err) {
            copyTipsMsg('error', '您的浏览器不支持复制功能')
        }
        document.body.removeChild(textarea)
    }
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <!-- 头部区域 -->
            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">TVbox系列数据源接口地址</h1>
                <p class="text-sm text-gray-500">更新时间: {{ currentDate }}</p>
            </div>

            <!-- 搜索和分类过滤区域 -->
            <div class="mb-8 space-y-4">
                <div class="max-w-md mx-auto">
                    <div class="relative">
                        <input type="text" 
                               v-model="searchQuery"
                               placeholder="搜索数据源..." 
                               class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                        <span class="absolute right-3 top-2.5 text-gray-400">
                            <i class="fas fa-search"></i>
                        </span>
                    </div>
                </div>
                
                <div class="flex flex-wrap justify-center gap-2">
                    <button v-for="category in categories" 
                            :key="category"
                            @click="activeCategory = category"
                            :class="[
                                'px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200',
                                activeCategory === category 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            ]"
                    >
                        {{ category }}
                    </button>
                </div>
            </div>

            <!-- 数据源列表 -->
            <div v-if="tvbox.length === 0" class="text-center py-12">
                <div class="animate-pulse">
                    <p class="text-gray-500">正在加载数据源...</p>
                </div>
            </div>
            
            <div v-else-if="filteredTvbox.length === 0" class="text-center py-12">
                <p class="text-gray-500">未找到匹配的数据源</p>
            </div>

            <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div v-for="(item, index) in filteredTvbox" 
                     :key="index"
                     class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
                >
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">{{ item.name }}</h3>
                            <span class="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                                {{ item.category || '未分类' }}
                            </span>
                        </div>
                        
                        <div class="flex items-center gap-2">
                            <input type="text" 
                                   :value="item.link" 
                                   readonly
                                   class="flex-1 px-3 py-2 text-sm bg-gray-50 rounded border border-gray-200 focus:outline-none"
                            >
                            <button @click="copy(item.link)"
                                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                复制
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}
</style>