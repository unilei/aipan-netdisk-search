export default defineEventHandler(async (event) => {

    try {

        return [

        ]


    } catch (e) {
        console.log(e)
        return {
            code: 500,
            msg: 'error',
        }
    }
})