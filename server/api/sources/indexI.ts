interface Result {
    list: Array<any>
}

interface Body {
    name: string
}

export default defineEventHandler(async (event) => {

    try {
        const body: Body = await readBody(event);
        const result: Result = await $fetch('https://netdisk.aipan.me/api/search/a', {
            method: 'GET',
            query: {
                ...body
            }
        });

        return result;

    } catch (e) {
        console.error(e);
        return {
            code: 500,
            msg: 'error',
        };
    }
})