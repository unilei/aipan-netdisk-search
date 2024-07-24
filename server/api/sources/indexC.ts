interface Result {
    list: Array<any>
}

interface Body {
    name: string
}

interface Link {
    service: string,
    link: string
}

interface TransformedItem {
    name: string,
    links: Link[]
}

interface TransformedResult {
    list: TransformedItem[]
}

interface Token {
    token: String,
    user: Array<any>
}
export default defineEventHandler(async (event) => {

    try {
        const body: Body = await readBody(event);

        const token: Token = await $fetch('http://wzrbs.com/v/api/gettoken')

        const result: Result = await $fetch('http://wzrbs.com/v/api/sortWeb', {
            method: 'POST',
            body: {
                ...body,
                token: token.token,
                tabN: "movie_200317xlb",
                topNo: 10,
                whr: `question like "%${body.name}%"`,
                orderBy: "isTop DESC, date_time",
                orderType: "DESC",
                keys: "question,answer,isTop,id"
            }
        });

        const transformedList: TransformedItem[] = result.list.map(item => {
            const urlRegex = /https?:\/\/[^\s]+/g;
            const codeRegex = /提取码[:：]\s*([a-zA-Z0-9]+)/;

            const itemArr: Array<any> = item.answer.split('\n');

            const links: Link[] = itemArr.map(answer => {
                const urls = answer.match(urlRegex);
                const url = urls ? urls[0] : null;

                const codeMatch = answer.match(codeRegex);
                const code = codeMatch ? codeMatch[1] : null;

                let service = '';
                if (url) {
                    if (url.includes('pan.baidu.com')) {
                        service = 'BAIDU';
                    } else if (url.includes('pan.xunlei.com')) {
                        service = 'XUNLEI';
                    } else if (url.includes('pan.quark.cn')) {
                        service = 'QUARK';
                    } else if(url.includes('www.aliyundrive.com')){
                        service = 'ALIYUN'
                    } else {
                        service = 'OTHER';
                    }
                }

                return {
                    pwd: code,
                    link: url,
                    service
                };
            }).filter(link => link.link); // 过滤掉没有链接的项

            return {
                name: item.question,
                links
            };
        });

        const transformedResult: TransformedResult = { list: transformedList };

        return transformedResult;

    } catch (e) {
        console.error(e);
        return {
            code: 500,
            msg: 'error',
        };
    }
})