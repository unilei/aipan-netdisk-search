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
                msg: 'Access denied - domain restriction',
            };
        }

        // Check user authentication
        const authHeader = getRequestHeader(event, 'authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                code: 401,
                msg: 'Authentication required',
            };
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return {
                code: 401,
                msg: 'Invalid authentication token',
            };
        }

        // Verify token
        try {
            const { verifyToken } = await import('~/server/model/user');
            const user = verifyToken(token);
            if (!user) {
                return {
                    code: 401,
                    msg: 'Invalid or expired token',
                };
            }
        } catch (error) {
            return {
                code: 401,
                msg: 'Authentication failed',
            };
        }

        const body: Body = await readBody(event);

        // Select random proxy URL
        const proxyUrls = [
            'https://pansearch-proxy-api-production.ahagwybwqs.workers.dev/api/pansearch/search',
            'https://pansearch-proxy-api-production.hwyybsb.workers.dev/api/pansearch/search',
            'https://pansearch-proxy-api-production.xuliulei666.workers.dev/api/pansearch/search',
            'https://pansearch-proxy-api-production.pansearch-proxy.workers.dev/api/pansearch/search'
        ];
        const randomUrl = proxyUrls[Math.floor(Math.random() * proxyUrls.length)];
        if (!randomUrl) {
            throw createError({
                statusCode: 500,
                message: 'No proxy URL available'
            });
        }
        console.log(`🎯 Selected proxy URL for c_search: ${randomUrl}`);

        // Fetch with retry
        const result = await fetchWithRetry(randomUrl, {
            method: 'GET',
            query: {
                keyword: body.name
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