interface Query {
    engine: string,
    page: number,
    size: number
}

interface ApiEndpoint {
    engine: number
    latest_url: string
    adv_params: object
}

export default defineEventHandler(async (event) => {

    try {
        const query: Query = await getQuery(event)
        // https://so.yuneu.com/v1/disk/latest
        let apiEndpoints: ApiEndpoint[] = await $fetch('/api/sources/api-endpoints')

        let engineValue = query.engine
        let index = apiEndpoints.findIndex((item) => item.engine === parseInt(engineValue))

        let res = await $fetch(apiEndpoints[index].latest_url, {
            method: 'GET',
            query: {
                ...query,
                adv_params: apiEndpoints[index].adv_params
            }
        })

        return res

    } catch (e) {
        console.log(e)
        return {
            code: 500,
            msg: 'error',
        }
    }
})