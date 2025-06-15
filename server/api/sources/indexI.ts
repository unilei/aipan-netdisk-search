interface SearchResult {
    code: number
    msg: string
    list: Array<any>
}

interface Body {
    name: string
}

// Performance optimization configurations
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000; // Base delay for exponential backoff
const MAX_RETRY_DELAY = 8000; // Maximum retry delay
const BASE_TIMEOUT = 10000; // Base timeout - reduced to 10s for faster retry
const MAX_TIMEOUT = 30000; // Maximum timeout - reduced to 30s

// Circuit breaker configuration
const CIRCUIT_BREAKER = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    failures: 0,
    lastFailureTime: 0,
    state: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF_OPEN'
};

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();
const CACHE_TTL = 5000; // 5 seconds for deduplication

// Performance optimized fetch with retry
async function fetchWithRetry(url: string, options: any, retries = MAX_RETRIES): Promise<any> {
    const attempt = MAX_RETRIES - retries;

    // Add debug logging
    console.log(`🔄 Starting request attempt ${attempt + 1}/${MAX_RETRIES} to ${url}`);
    console.log(`📊 Retries left: ${retries}, Circuit breaker state: ${CIRCUIT_BREAKER.state}`);

    // Circuit breaker check - only reject if this is the first attempt
    if (CIRCUIT_BREAKER.state === 'OPEN' && attempt === 0) {
        if (Date.now() - CIRCUIT_BREAKER.lastFailureTime > CIRCUIT_BREAKER.resetTimeout) {
            CIRCUIT_BREAKER.state = 'HALF_OPEN';
            console.log('🔧 Circuit breaker moved to HALF_OPEN state');
        } else {
            console.log('🚫 Circuit breaker is OPEN, but allowing retry attempts');
            // Don't throw error here, let the retry mechanism work
        }
    }

    // Dynamic timeout adjustment based on attempt
    const dynamicTimeout = Math.min(
        BASE_TIMEOUT + (attempt * 5000), // Increase timeout by 5s each retry
        MAX_TIMEOUT
    );

    console.log(`⏱️ Using timeout: ${dynamicTimeout}ms for attempt ${attempt + 1}`);

    try {
        const startTime = Date.now();
        const result = await $fetch(url, {
            ...options,
            timeout: dynamicTimeout,
            // Enable compression
            headers: {
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                ...options.headers
            }
        });

        const duration = Date.now() - startTime;
        console.log(`✅ Request successful on attempt ${attempt + 1} (took ${duration}ms)`);

        // Reset circuit breaker on success
        if (CIRCUIT_BREAKER.state === 'HALF_OPEN') {
            CIRCUIT_BREAKER.state = 'CLOSED';
            CIRCUIT_BREAKER.failures = 0;
            console.log('🔧 Circuit breaker reset to CLOSED state');
        }

        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`❌ Request failed on attempt ${attempt + 1}: ${errorMessage}`);

        // Update circuit breaker
        CIRCUIT_BREAKER.failures++;
        CIRCUIT_BREAKER.lastFailureTime = Date.now();

        if (CIRCUIT_BREAKER.failures >= CIRCUIT_BREAKER.failureThreshold) {
            CIRCUIT_BREAKER.state = 'OPEN';
            console.log(`🚫 Circuit breaker opened after ${CIRCUIT_BREAKER.failures} failures`);
        }

        // Async error logging (non-blocking)
        setImmediate(() => {
            console.error(`API request failed (attempt ${attempt + 1}/${MAX_RETRIES}):`, {
                url,
                error: errorMessage,
                timestamp: new Date().toISOString(),
                circuitBreakerState: CIRCUIT_BREAKER.state
            });
        });

        if (retries > 0) {
            // Exponential backoff with jitter
            const delay = Math.min(
                BASE_RETRY_DELAY * Math.pow(2, attempt) + Math.random() * 1000,
                MAX_RETRY_DELAY
            );

            console.log(`⏳ Retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, options, retries - 1);
        }

        console.log('💥 All retry attempts exhausted');
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

        // Request deduplication - create cache key
        const cacheKey = JSON.stringify({
            url: 'https://netdisk.aipan.me/api/search/a_search',
            query: body
        });

        // Check if request is already in progress
        if (requestCache.has(cacheKey)) {
            return await requestCache.get(cacheKey);
        }

        // Create and cache the request promise
        const requestPromise = fetchWithRetry('https://netdisk.aipan.me/api/search/a_search', {
            method: 'GET',
            query: {
                ...body
            }
        });

        requestCache.set(cacheKey, requestPromise);

        // Clean up cache after TTL
        setTimeout(() => {
            requestCache.delete(cacheKey);
        }, CACHE_TTL);

        const result = await requestPromise;
        return result;

    } catch (e) {
        // Enhanced error logging with more context
        setImmediate(() => {
            console.error('API Handler Error:', {
                error: e instanceof Error ? e.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                userAgent: getRequestHeader(event, 'user-agent'),
                ip: getRequestIP(event)
            });
        });

        return {
            code: 500,
            msg: 'error',
        };
    }
})