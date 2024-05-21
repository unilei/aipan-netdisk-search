interface body {
    engine: number
    page: number
    size: number
}
interface ApiEndpoint {
    engine: number
    url: string
    adv_params: object
} 
export default defineEventHandler(async (event) => {

    try {
        let body:body = await readBody(event)

        let apiEndpoints: ApiEndpoint[] = await $fetch('/api/sources/api-endpoints')

        let engineValue = body.engine
        let index = apiEndpoints.findIndex((item) => item.engine === engineValue)

        let res = await $fetch(apiEndpoints[index].url, {
            method: 'POST',
            body: {
                ...body,
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