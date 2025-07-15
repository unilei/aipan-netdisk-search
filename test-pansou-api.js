// 测试pansou API的简单脚本
const testPansouApi = async () => {
    try {
        console.log('开始测试pansou API...')
        
        // 直接调用pansou API
        const apiUrl = 'https://pansou.252035.xyz/api/search'
        const params = new URLSearchParams({
            kw: '凡人修仙传',
            refresh: 'false',
            res: 'merge',
            src: 'all',
            plugins: 'pansearch,qupansou,panta,pan666,hunhepan,jikepan'
        })
        
        const response = await fetch(`${apiUrl}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        console.log('API响应状态:', data.code)
        console.log('总结果数:', data.data?.total || 0)
        console.log('网盘类型:', Object.keys(data.data?.merged_by_type || {}))
        
        // 显示每种网盘类型的数量
        if (data.data?.merged_by_type) {
            Object.entries(data.data.merged_by_type).forEach(([type, items]) => {
                console.log(`${type}: ${items?.length || 0} 个结果`)
            })
        }
        
        // 显示前3个百度网盘结果作为示例
        if (data.data?.merged_by_type?.baidu?.length > 0) {
            console.log('\n前3个百度网盘结果示例:')
            data.data.merged_by_type.baidu.slice(0, 3).forEach((item, index) => {
                console.log(`${index + 1}. ${item.note}`)
                console.log(`   链接: ${item.url}`)
                console.log(`   密码: ${item.password || '无'}`)
                console.log(`   时间: ${item.datetime}`)
                console.log('')
            })
        }
        
    } catch (error) {
        console.error('测试失败:', error.message)
    }
}

// 运行测试
testPansouApi()
