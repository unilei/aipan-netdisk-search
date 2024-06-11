export default defineEventHandler(async (event) => {

    try {
        let body: body = await readBody(event)

        let res = await $fetch('http://m.ssr021.cn/v/api/sortWeb', {
            method: 'POST',
            body: {
                ...body,
                token: "i69",
                tabN: "movie_test",
                topNo: 10,
                whr: 'question like "%' + body.name + '%"',
                orderBy: "isTop DESC, date_time",
                orderType: "DESC",
                keys: "question,answer,isTop,id"
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