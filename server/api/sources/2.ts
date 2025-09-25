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

// Rate limiting configuration
const RATE_LIMIT = {
    windowMs: 60000, // 1 minute window
    maxRequests: 30, // Max 30 requests per minute per IP
    requests: new Map<string, { count: number; resetTime: number }>()
};

// Rate limiting function
function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const userRequests = RATE_LIMIT.requests.get(ip);

    if (!userRequests || now > userRequests.resetTime) {
        // Reset or create new window
        RATE_LIMIT.requests.set(ip, {
            count: 1,
            resetTime: now + RATE_LIMIT.windowMs
        });
        return true;
    }

    if (userRequests.count >= RATE_LIMIT.maxRequests) {
        return false; // Rate limit exceeded
    }

    userRequests.count++;
    return true;
}

// Performance optimized fetch with retry
async function fetchWithRetry(url: string, options: any, retries = MAX_RETRIES): Promise<any> {
    const attempt = MAX_RETRIES - retries;

    // Add debug logging
    console.log(`🔄 Starting request attempt ${attempt + 1}/${MAX_RETRIES} to ${url}`);
    console.log(`📊 Retries left: ${retries}, Circuit breaker state: ${CIRCUIT_BREAKER.state}`);

    // Circuit breaker check
    if (CIRCUIT_BREAKER.state === 'OPEN') {
        if (Date.now() - CIRCUIT_BREAKER.lastFailureTime > CIRCUIT_BREAKER.resetTimeout) {
            CIRCUIT_BREAKER.state = 'HALF_OPEN';
            console.log('🔧 Circuit breaker moved to HALF_OPEN state');
        } else {
            console.log('🚫 Circuit breaker is OPEN, rejecting request');
            throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
        }
    }

    // In HALF_OPEN state, only allow one request to test the service
    if (CIRCUIT_BREAKER.state === 'HALF_OPEN' && attempt > 0) {
        console.log('🔧 Circuit breaker is HALF_OPEN, skipping retry');
        throw new Error('Circuit breaker is HALF_OPEN - testing service availability');
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
        const clientIP = getRequestIP(event) || 'unknown';

        const isValidDomain = host.endsWith('ailookzy.com') ||
            referer.includes('ailookzy.com') || host.includes('localhost');

        if (!isValidDomain) {
            return {
                code: 403,
                msg: 'Access denied',
            };
        }

        // Rate limiting check
        if (!checkRateLimit(clientIP)) {
            console.log(`🚫 Rate limit exceeded for IP: ${clientIP}`);
            return {
                code: 429,
                msg: 'Too many requests - please try again later',
            };
        }

        const body: Body = await readBody(event);

        // Input validation
        if (!body || typeof body !== 'object') {
            return {
                code: 400,
                msg: 'Invalid request body',
            };
        }

        if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
            return {
                code: 400,
                msg: 'Missing or invalid search query',
            };
        }

        // Sanitize input
        body.name = body.name.trim();

        // Check for reasonable query length
        if (body.name.length > 200) {
            return {
                code: 400,
                msg: 'Search query too long (max 200 characters)',
            };
        }

        // Select proxy URL first for consistent caching
        const proxyUrls = [
            'https://gying-proxy-api-production.ahagwybwqs.workers.dev/api/search/a_search',
            'https://gying-proxy-api-production.hwyybsb.workers.dev/api/search/a_search',
            'https://gying-proxy-api-production.xuliulei666.workers.dev/api/search/a_search',
            'https://gying-proxy-api-production.pansearch-proxy.workers.dev/api/search/a_search'
        ];
        const randomUrl = proxyUrls[Math.floor(Math.random() * proxyUrls.length)];
        console.log(`🎯 Selected proxy URL: ${randomUrl}`);

        // Request deduplication - create cache key with selected URL
        const cacheKey = JSON.stringify({
            url: randomUrl,
            query: body
        });

        // Check if request is already in progress
        if (requestCache.has(cacheKey)) {
            return await requestCache.get(cacheKey);
        }

        // Create and cache the request promise
        const requestPromise = fetchWithRetry(randomUrl, {
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
                stack: e instanceof Error ? e.stack : undefined,
                timestamp: new Date().toISOString(),
                userAgent: getRequestHeader(event, 'user-agent'),
                ip: getRequestIP(event),
                circuitBreakerState: CIRCUIT_BREAKER.state
            });
        });

        // Provide more specific error responses
        if (e instanceof Error) {
            if (e.message.includes('Circuit breaker')) {
                return {
                    code: 503,
                    msg: 'Service temporarily unavailable - please try again later',
                };
            }

            if (e.message.includes('timeout') || e.message.includes('TIMEOUT')) {
                return {
                    code: 504,
                    msg: 'Request timeout - please try again',
                };
            }

            if (e.message.includes('network') || e.message.includes('NETWORK')) {
                return {
                    code: 502,
                    msg: 'Network error - please check your connection',
                };
            }
        }

        return {
            code: 500,
            msg: 'Internal server error - please try again later',
        };
    }
})