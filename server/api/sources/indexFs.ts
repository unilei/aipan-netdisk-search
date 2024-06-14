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

import * as cheerio from 'cheerio';

export default defineEventHandler(async (event) => {

    try {
        const body: Body = await readBody(event);

        const result: string = await $fetch('https://www.wogg.net/index.php/vodsearch/-------------.html', {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0(WindowsNT10.0;Win64;x64)AppleWebKit/537.36(KHTML,likeGecko)Chrome/120.0.0.0Safari/537.36Edg/120.0.0.0'
            },
            query: {
                wd: body.name
            }
        });

        const $ = cheerio.load(result);
        const items = $('.module-search-item').toArray();

        const transformedList: Awaited<{
            name: string;
            links: { service: string; link: string | undefined }[]
        } | null>[] = await Promise.all(items.map(async (item) => {
            try {
                const name = $(item).find('.video-info-header h3 a').text();
                const link = $(item).find('.video-info-footer a').attr('href');

                const res: string = await $fetch('https://www.wogg.net/' + link, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0(WindowsNT10.0;Win64;x64)AppleWebKit/537.36(KHTML,likeGecko)Chrome/120.0.0.0Safari/537.36Edg/120.0.0.0'
                    },
                });

                const $$ = cheerio.load(res);

                const links: {
                    service: string;
                    link: string | undefined
                }[] = $$('.module-row-one').toArray().map((item) => {
                    const link = $(item).find('.btn-pc.btn-down.fzlj').attr('href');

                    let service = '';
                    if (link) {
                        if (link.includes('pan.baidu.com')) {
                            service = 'BAIDU';
                        } else if (link.includes('pan.xunlei.com')) {
                            service = 'XUNLEI';
                        } else if (link.includes('pan.quark.cn')) {
                            service = 'QUARK';
                        } else if (link.includes('www.aliyundrive.com') || link.includes('alipan.com')) {
                            service = 'ALIYUN';
                        } else {
                            service = 'OTHER';
                        }
                    }
                    return {
                        link,
                        service
                    };
                });

                return {
                    name,
                    links
                };
            } catch (error) {
                console.error(`Error processing item: ${error}`);
                return null;
            }
        }));

        // Filter out any null items from the transformed list
        const filteredList = transformedList.filter(item => item !== null) as TransformedItem[];

        const transformedResult: TransformedResult = {list: filteredList};

        return transformedResult;

    } catch (e) {
        console.error(e);
        return {
            code: 500,
            msg: 'error',
        };
    }
})