export default defineEventHandler(async (event) => {
    try {
        // 直接从源头抓取，绕过已宕机的 netdisk.aipan.me
        const res = await $fetch('https://www.juwanhezi.com/other/jsonlist', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.juwanhezi.com/',
            },
            timeout: 15000,
        })

        // 正则提取 <label>名称</label>...<input value="链接">
        const pattern = /<label.*?>(.*?)<\/label>.*?<input.*?value="(.*?)"/gs
        const matches = [...res.matchAll(pattern)]

        if (!matches.length) {
            return { msg: 'No matches found', list: [] }
        }

        const list = matches.map(m => ({
            name: m[1].trim(),
            link: m[2].trim(),
        }))

        return { msg: 'success', list }
    } catch (e) {
        console.error('TVBox fetch error:', e)
        return { code: 500, msg: 'error', list: [] }
    }
})
