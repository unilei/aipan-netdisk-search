import {
    deleteDataFromRedis,
    getDataFromRedis,
    setDataInRedis,
} from '~/server/utils/redis';
import {
    DOUBAN_HOMEPAGE_CACHE_KEY,
    DOUBAN_HOMEPAGE_CACHE_TTL_SECONDS,
    DOUBAN_HOMEPAGE_LAST_GOOD_CACHE_KEY,
    DOUBAN_HOMEPAGE_LAST_GOOD_TTL_SECONDS,
    countDoubanHomepageItems,
    hasUsableDoubanHomepageData,
    normalizeDoubanHomepageData,
} from '~/utils/doubanHomepage.mjs';

const DOUBAN_UPSTREAM_URL = 'https://iamyourfather.link0.me/api/v1/new';
const DOUBAN_UPSTREAM_TIMEOUT_MS = 10_000;

export default defineEventHandler(async (event) => {
    const cachedValue = await getDataFromRedis(DOUBAN_HOMEPAGE_CACHE_KEY);
    const cachedData = normalizeDoubanHomepageData(cachedValue);

    if (hasUsableDoubanHomepageData(cachedData)) {
        return {
            code: 200,
            data: cachedData,
            source: 'redis-cache',
        };
    }

    if (cachedValue !== null) {
        console.warn('[Douban homepage] Ignoring and removing an empty or invalid primary cache entry.');
        await deleteDataFromRedis(DOUBAN_HOMEPAGE_CACHE_KEY);
    }

    const lastGoodValue = await getDataFromRedis(DOUBAN_HOMEPAGE_LAST_GOOD_CACHE_KEY);
    const lastGoodData = normalizeDoubanHomepageData(lastGoodValue);

    try {
        const response: any = await $fetch(DOUBAN_UPSTREAM_URL, {
            method: 'GET',
            timeout: DOUBAN_UPSTREAM_TIMEOUT_MS,
            retry: 1,
            retryDelay: 250,
        });
        const freshData = normalizeDoubanHomepageData(response?.data);

        if (response?.code !== 200 || !hasUsableDoubanHomepageData(freshData)) {
            throw new Error(
                `Upstream returned no usable movies (code=${String(response?.code)}, items=${countDoubanHomepageItems(freshData)})`,
            );
        }

        const [primaryStored, lastGoodStored] = await Promise.all([
            setDataInRedis(
                DOUBAN_HOMEPAGE_CACHE_KEY,
                freshData,
                DOUBAN_HOMEPAGE_CACHE_TTL_SECONDS,
            ),
            setDataInRedis(
                DOUBAN_HOMEPAGE_LAST_GOOD_CACHE_KEY,
                freshData,
                DOUBAN_HOMEPAGE_LAST_GOOD_TTL_SECONDS,
            ),
        ]);

        if (!primaryStored || !lastGoodStored) {
            console.warn('[Douban homepage] Fresh data was returned but one or more Redis writes failed.');
        }

        return {
            code: 200,
            data: freshData,
            source: 'fresh-data',
        };
    } catch (error) {
        if (hasUsableDoubanHomepageData(lastGoodData)) {
            console.warn('[Douban homepage] Upstream refresh failed; serving last-known-good data.', error);
            return {
                code: 200,
                data: lastGoodData,
                source: 'stale-cache',
                stale: true,
            };
        }

        console.error('[Douban homepage] No usable upstream or cached data is available.', error);
        setResponseStatus(event, 502);
        return {
            code: 502,
            msg: 'Douban data is temporarily unavailable',
            data: [],
        };
    }
});
