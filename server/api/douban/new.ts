export default defineEventHandler(async (event) => {

    try{
        let res:any =  await  $fetch('https://movie.douban.com/j/search_subjects?tag=%E7%83%AD%E9%97%A8',{
            method:'GET'
        })
        let res2:any =  await  $fetch('https://movie.douban.com/j/search_subjects?type=tv&tag=热门',{
            method:'GET'
        })
        return {
            code: 200,
            data: res.subjects.concat(res2.subjects)
        }

    }catch (e) {
        console.log(e)
        return {
            code: 500,
            msg:'error',
        }
    }
})