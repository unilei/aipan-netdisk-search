interface ApiEndpoint {
    engine: number
    latest_url: string
    adv_params: object
}

interface Body {
    page: number
    size: number
}

export default defineEventHandler(async (event) => {
    try {
        const body: Body = await readBody(event)
        // https://so.yuneu.com/v1/disk/latest
        let apiEndpoints: ApiEndpoint[] = await $fetch('/api/sources/api-endpoints')
        // 使用 Promise.all() 并行发起多个请求
        const requests = apiEndpoints.map(async (endpoint) => {
            const res: any = await $fetch(endpoint.latest_url, {
                method: 'GET',
                query: {
                    ...body,
                    adv_params: endpoint.adv_params
                }
            });
            if (res.code !== 200) {
               return []
            }
            let resData = []
            if (res.data.list) {
                resData = res.data.list
                resData.map((item: any) => {
                    item.engine = endpoint.engine
                })

            } else {
                resData = res.data
                resData.map((item: any) => {
                    item.engine = endpoint.engine
                })
            }
            return resData
        })

        // 等待所有请求完成
        const results = await Promise.all(requests);

        let resultsData: any = []
        results.forEach((item: any) => {
            resultsData = resultsData.concat(item)
        })
        // 返回所有请求的结果数组
        return {
            code: 200,
            msg: 'success',
            data: {
                list: resultsData
            }
        };

    } catch (e) {
        console.log(e);
        return {
            code: 500,
            msg: 'error',
        };
    }

})