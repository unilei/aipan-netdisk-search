import {XMLBuilder, XMLParser, XMLValidator} from "fast-xml-parser"

const vodApiEndpoints = [
    {
        "key": "ikunzy",
        "name": "爱坤联盟资源网",
        "api": "https://ikunzyapi.com/api.php/provide/vod",
        "playUrl": "https://www.ikdmjx.com/?url=",
        "type": "json"
    },
    {
        "key": "haiwaikan",
        "name": "海外看(外)",
        "api": "https://api.haiwaikan.com/v1/vod",
        "playUrl": "https://dp.haiwaikan.com/index.html?url=",
        "type": "json"
    },
    {
        "key": "moduzy",
        "name": "魔都资源网",
        "api": "https://caiji.moduapi.cc/api.php/provide/vod",
        "playUrl": "https://jiexi.modujx01.com/?url=",
        "type": "json"
    },
    {
        "key": "haohuazy",
        "name": "豪华资源",
        "api": "https://hhzyapi.com/api.php/provide/vod",
        "playUrl": "https://hhjiexi.com/play/?url=",
        "type": "json"
    },
    {
        "key": "kuaikanzy",
        "name": "快看资源",
        "api": "https://kuaikan-api.com/api.php/provide/vod/from/kuaikan",
        "playUrl": "https://kkzyplayer.com/player/?url=",
        "type": "json"
    },
    {
        "key": "qihuzy",
        "name": "奇虎资源",
        "api": "https://caiji.qhzyapi.com/api.php/provide/vod",
        "playUrl": "https://jiexi.qhzyapi.com/dp/?url=",
        "type": "json"
    }
]

export default defineEventHandler(async (event) => {

    try {
        let query: any = getQuery(event)
        const requests = vodApiEndpoints.map(async (endpoint) => {
            try {
                const res: any = await $fetch(endpoint.api, {
                    method: 'GET',
                    query: query
                });
                if (endpoint.type === 'xml') {
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
                return []
            }
        })

        // 等待所有请求完成
        const results = await Promise.all(requests);

        let resultsData: any = []
        results.forEach((item: any) => {
            resultsData = resultsData.concat(item)
        })
        // 返回所有请求的结果数组
        return {
            code: 200,
            msg: 'success',
            data: resultsData
        };
    } catch (e) {
        console.log(e)
        return {
            code: 500,
            data: e,
            msg: 'error'
        }
    }
})