export default defineEventHandler(async (event) => {

    try {
        let body: body = await readBody(event)

        let res = await $fetch('http://m.ssr021.cn/v/api/getTTZJB', {
            method: 'POST',
            body: {
                ...body,
                token: "i69"
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