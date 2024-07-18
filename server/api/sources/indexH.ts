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

        const result: any = await $fetch(`https://www.yun1sou.com/s?query=${body.name}`, {
            method: 'GET'
        })

        const $ = cheerio.load(result);
        const items = $('.result-item-mobile'); // 修改为实际的选择器

        const transformedResult: TransformedResult = {
            list: items.map((i, element) => {
                const spanElement = $(element).find('div:first-child span').first();

                if (spanElement.length === 0) {
                    // Skip this item if the span element does not exist
                    return;
                }

                const name = $(element).find('div:first-child').text().trim();
                const links: Link[] = [];
                const link = $(element).find('object a').attr('href');
                links.push({ service: 'QUARK', link });

                return {
                    name,
                    links
                };
            }).toArray()
        };

        return transformedResult;

    } catch (e) {
        console.error(e);
        return {
            code: 500,
            msg: 'error',
        };
    }
});
