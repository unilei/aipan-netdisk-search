interface Result {
    list: Array<any>
}

interface Body {
    name: string
}

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache = new Map<string, { data: Result; timestamp: number }>();

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function fetchWithRetry(url: string, options: any, retries = MAX_RETRIES): Promise<any> {
    try {
        return await $fetch(url, options);
    } catch (error) {
        if (retries > 0) {
            console.warn(`Request failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`, { url, error });
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return fetchWithRetry(url, options, retries - 1);
        }
        console.error('All retry attempts failed', { url, error });
        throw error;
    }
}

export default defineEventHandler(async (event) => {
    try {
        const body: Body = await readBody(event);
        const cacheKey = `search:${body.name}`;

        // Check cache
        const cachedResult = cache.get(cacheKey);
        if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
            return cachedResult.data;
        }

        // Fetch with retry if not in cache or cache expired
        const result = await fetchWithRetry('https://netdisk.aipan.me/api/search/a', {
            method: 'GET',
            query: {
                ...body
            }
        });

        // Update cache
        cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        return result;

    } catch (e) {
        console.error('Search API error:', e);
        return {
            code: 500,
            msg: 'error',
        };
    }
})