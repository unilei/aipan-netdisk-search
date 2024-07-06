import {XMLBuilder, XMLParser, XMLValidator} from "fast-xml-parser"

export default defineEventHandler(async (event) => {

    try {
        let query: any = getQuery(event)
        const res: any = await $fetch(query.api, {
            method: 'GET',
            query: query
        });
        return res
    } catch (e) {
        console.log(e)
        return {
            code: 500,
            data: e,
            msg: 'error'
        }
    }
})