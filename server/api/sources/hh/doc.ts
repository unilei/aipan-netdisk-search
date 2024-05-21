interface body {
    engine: number
    doc_id: string
}
interface ApiEndpoint {
    engine: number
    doc_url: string
}
export default defineEventHandler(async (event) => {

    try {
        const body: body = await readBody(event)
        // https://so.yuneu.com/v1/disk/latest
        let apiEndpoints: ApiEndpoint[] = await $fetch('/api/sources/api-endpoints')

        let engineValue = body.engine
        let index = apiEndpoints.findIndex((item) => item.engine === engineValue)

        let res = await $fetch(apiEndpoints[index].doc_url + '/' + body.doc_id, {
            method: 'GET',
            query: {
                from: "web",
                with_meta: true
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