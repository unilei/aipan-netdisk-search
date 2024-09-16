export default defineEventHandler(async (event) => {

    try {
        let query = await getQuery(event)
        let res: any = await $fetch('https://kwapi.aipan.me/search_music', {
            method: 'GET',
            query: query
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