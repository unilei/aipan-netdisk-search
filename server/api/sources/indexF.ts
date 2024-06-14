import cloudscraper from 'cloudscraper';
import * as cheerio from 'cheerio';

interface Body {
    name: string;
}

interface Link {
    service: string;
    link: string | undefined;
}

interface TransformedItem {
    name: string;
    links: Link[];
}

interface TransformedResult {
    list: TransformedItem[];
}

export default defineEventHandler(async (event) => {
    try {
        const body: Body = await readBody(event);
        const searchTerm = encodeURIComponent(body.name);

        const result = await cloudscraper({
            method: 'GET',
            url:`https://www.wogg.net/index.php/vodsearch/-------------.html?wd=${searchTerm}`,
            headers: {
                'Cookie' : '_ga=GA1.1.104026464.1718349413; cf_clearance=iwtP6wrRLa7szOTtY.S1jbaBmR1d4i2cOh9KxiBu9n0-1718368306-1.0.1.1-CmoCr1k.pEtQFK.vcG4ITkLAehxxB2nx85UZyHbQijBMU98IyA17TIVFJFzrFMEDPtxlrBYC4I270QsY03Qyxw; closeclick=closeclick; _ga_JSCFX80PZS=GS1.1.1718368315.2.1.1718368416.0.0.0',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
            }
        })

        const $ = cheerio.load(result);
        const items = $('.module-search-item').toArray();

        const transformedList: Awaited<null | {
            name: string;
            links: Link[]
        }>[] = await Promise.all(items.map(async (item) => {
            try {
                const name = $(item).find('.video-info-header h3 a').text();
                const link = $(item).find('.video-info-footer a').attr('href');

                if (!link) {
                    return null;
                }

                const res = await cloudscraper({
                    url:`https://www.wogg.net/${link}`,
                    headers: {
                        'Cookie' : '_ga=GA1.1.104026464.1718349413; cf_clearance=iwtP6wrRLa7szOTtY.S1jbaBmR1d4i2cOh9KxiBu9n0-1718368306-1.0.1.1-CmoCr1k.pEtQFK.vcG4ITkLAehxxB2nx85UZyHbQijBMU98IyA17TIVFJFzrFMEDPtxlrBYC4I270QsY03Qyxw; closeclick=closeclick; _ga_JSCFX80PZS=GS1.1.1718368315.2.1.1718368416.0.0.0',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
                    }
                });

                const $$ = cheerio.load(res);

                const links: Link[] = $$('.module-row-one').toArray().map((item) => {
                    const link = $$(item).find('.btn-pc.btn-down.fzlj').attr('href');
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
                    return { link, service };
                });

                return { name, links };
            } catch (error) {
                console.error(`Error processing item: ${error}`);
                return null;
            }
        }));

        const filteredList = transformedList.filter(item => item !== null) as TransformedItem[];
        const transformedResult: TransformedResult = { list: filteredList };

        return transformedResult;

    } catch (e) {
        console.error(e);
        return {
            code: 500,
            msg: 'error',
        };
    }
});
