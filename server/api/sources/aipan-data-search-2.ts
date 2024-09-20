import { encrypt, decrypt } from "~/utils/tools"
import http from "~/utils/http";
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
const fetchApi = (url: string, body: Body, token: string) => {
    return http.post<Result>(url, {
        ...body,
        token
    })

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
            iv: '4ccfd90fd778ad0d284b6c6e182063f0',
            key: '1cc5d119477a952d96e63d2a92cb4b188eb4189c758be1fb648caeae9cfc08eb',
            encryptedData: '0a2471511ba2e5ed3b5c4daa6ec0bae30d295361d47455731675d39b09ecdcbc'
        });
        console.log(decryptedData);
        const token = "i69";
        // 使用通用 fetchApi 函数并行请求多个 API
        const apiUrls = [
            `${decryptedData}/v/api/getJuzi`,
            `${decryptedData}/v/api/getXiaoyu`,
            `${decryptedData}/v/api/search`,
            `${decryptedData}/v/api/getSearchX`,
        ];

        const apiRequests = apiUrls.map(url => fetchApi(url, body, token).catch((e) => {
            console.error(e);
            return { list: [] };
        }));
        const apiResponses = await Promise.all(apiRequests);
        // 合并所有的列表数据
        const combinedList = apiResponses.flatMap(response => (response as Result).list || []);

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
