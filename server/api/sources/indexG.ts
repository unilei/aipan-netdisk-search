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

        const result: any = await $fetch(`https://www.quarkfinder.top/s?query=${body.name}`, {
            method: 'GET'
        })

        const $ = cheerio.load(result);

        const transformedResult: TransformedResult = {
            list: $('.yp-search-result-item').map((i, element) => {
                const name = $(element).find('.yp-search-result-item-text-title').text().trim();
                const links: Link[] = [];
                const link = $(element).attr('href');
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
