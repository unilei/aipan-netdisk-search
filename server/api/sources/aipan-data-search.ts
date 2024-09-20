import { encrypt, decrypt } from "~/utils/tools"
interface Result {
    list: Array<any>
}

interface Body {
    name: string
}

interface Link {
    service: string,
    link: string,
    pwd?: string
}

interface TransformedItem {
    name: string,
    links: Link[]
}

interface TransformedResult {
    list: TransformedItem[]
}

interface Token {
    token: string,
    user: Array<any>
}

// 提取通用的API请求函数
const fetchApi = (url: string, body: Body, token: string, append: Object) => {
    return $fetch<Result>(url, {
        method: 'POST',
        body: {
            ...body,
            ...append,
            token
        }
    });
};

// 提取链接解析逻辑为独立函数
const extractLinks = (answer: string | undefined): Link[] => {
    if (!answer) {
        return [];  // 如果 answer 是 undefined 或 null，直接返回空数组
    }

    const urlRegex = /https?:\/\/[^\s]+/g;
    const codeRegex = /提取码[:：]\s*([a-zA-Z0-9]+)/;

    return answer.split('\n').reduce<Link[]>((acc, answerLine) => {
        const urls = answerLine.match(urlRegex);
        const url = urls ? urls[0] : null;
        const codeMatch = answerLine.match(codeRegex);
        const code = codeMatch ? codeMatch[1] : undefined;

        if (url) {
            let service = 'OTHER';
            if (url.includes('pan.baidu.com')) {
                service = 'BAIDU';
            } else if (url.includes('pan.xunlei.com')) {
                service = 'XUNLEI';
            } else if (url.includes('pan.quark.cn')) {
                service = 'QUARK';
            } else if (url.includes('www.aliyundrive.com')) {
                service = 'ALIYUN';
            }

            acc.push({ service, link: url, pwd: code });
        }
        return acc;
    }, []);
};

export default defineEventHandler(async (event) => {
    try {
        const body: Body = await readBody(event);
        const decryptedData = decrypt({
            iv: 'da128718bfbf504e6df43bc8e77f00e5',
            key: '2e9096e311ab53f32776f87f669dbf9b04e2e4a12cd10db47b8d814ff7af605b',
            encryptedData: 'ee7b334d32778411441fdf6e891e51d4143558b6027a0b06a45f4e1fe9a9d137'
        });
        console.log(decryptedData);
        // 获取 token
        const token: Token = await $fetch(`${decryptedData}/v/api/gettoken`);
        // 使用通用 fetchApi 函数并行请求多个 API
        const apiUrls = [
            {
                url: `${decryptedData}/v/api/getJuzi`,
                append: {}
            },
            {
                url: `${decryptedData}/v/api/sortWeb`,
                append: {
                    tabN: "movie_200317xlb",
                    topNo: 10,
                    whr: `question like "%${body.name}%"`,
                    orderBy: "isTop DESC, date_time",
                    orderType: "DESC",
                    keys: "question,answer,isTop,id"
                }
            },
            {
                url: `${decryptedData}/v/api/getTop`,
                append: {}
            },
            {
                url: `${decryptedData}/v/api/getXiaoy`,
                append: {}
            },
            {
                url: `${decryptedData}/v/api/getDyfx`,
                append: {}
            },
            {
                url: `${decryptedData}/v/api/getTTZJB`,
                append: {}
            }, {
                url: `${decryptedData}/v/api/getGGang`,
                append: {}
            },
            {
                url: `${decryptedData}/v/api/getGirls`,
                append: {}
            }
        ];

        const apiRequests = apiUrls.map(apiEndpoint => fetchApi(apiEndpoint.url, body, token.token, apiEndpoint.append));
        const apiResponses = await Promise.all(apiRequests);

        // 合并所有的列表数据
        const combinedList = apiResponses.flatMap(response => response.list);

        // 处理并转换获取到的数据
        const transformedList: TransformedItem[] = combinedList
            .filter(item => item.question)  // 过滤掉没有 question (name) 的项
            .map(item => ({
                name: item.question,
                links: extractLinks(item.answer)
            }));

        // 返回转换后的结果
        return { list: transformedList };

    } catch (e) {
        console.error(e);
        return {
            code: 500,
            msg: e,
        };
    }
});
