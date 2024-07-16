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
            if(jObj){
                let vodData = jObj.rss.list.video
                return {
                    code: 1,
                    list:vodData.map((item: any) => {
                        return {
                            vod_name:item.name,
                            vod_pic:item.pic,
                            vod_id:item.id,
                            vod_play_url: item.dl.dd
                        }
                    })
                }
            }
            return []
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