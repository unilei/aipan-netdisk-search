interface Result {
    list: Array<any>
}

interface Body {
    name: string
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function fetchWithRetry(url: string, options: any, retries = MAX_RETRIES): Promise<any> {
    try {
        return await $fetch(url, options);
    } catch (error) {
        if (retries > 0) {

            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return fetchWithRetry(url, options, retries - 1);
        }

        throw error;
    }
}

export default defineEventHandler(async (event) => {
    try {
        // Check domain access restriction
        const host = getRequestHeader(event, 'host') || '';
        const referer = getRequestHeader(event, 'referer') || '';

        const isValidDomain = host.endsWith('aipan.me') ||
            referer.includes('aipan.me') || host.includes('localhost');

        if (!isValidDomain) {
            return {
                code: 403,
                msg: 'Access denied',
            };
        }

        const body: Body = await readBody(event);

        // Fetch with retry
        const result = await fetchWithRetry('https://netdisk.aipan.me/api/search/a_search', {
            method: 'GET',
            query: {
                ...body
            }
        });

        return result;

    } catch (e) {
        return {
            code: 500,
            msg: 'error',
        };
    }
})