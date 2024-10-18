export default defineEventHandler(async (event) => {
    try {
        const data = await $fetch('https://netdisk.aipan.me/api/tvbox')
        return data
    } catch (e) {
        console.error(e);
        return {
            code: 500,
            msg: 'error',
        };
    }
})