import {XMLBuilder, XMLParser, XMLValidator} from "fast-xml-parser"

export default defineEventHandler(async (event) => {

    try {
        let query: any = getQuery(event)
        const res: any = await $fetch(query.api, {
            method: 'GET',
            query: query
        });
        if (query.type === 'xml') {
            const parser = new XMLParser();
            let jObj = parser.parse(res);
            return jObj
        }
        if(typeof res === 'string'){
            return JSON.parse(res)
        }
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