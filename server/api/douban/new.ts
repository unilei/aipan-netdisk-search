import { getDataFromRedis, setDataInRedis } from '~/server/utils/redis';

export default defineEventHandler(async (event) => {
    const REDIS_KEY = 'douban_homepage_data';
    const CACHE_EXPIRATION = 60 * 60 * 24; // 缓存1天

    try {
        // 尝试从Redis获取缓存数据
        const cachedData = await getDataFromRedis(REDIS_KEY);
        if (cachedData) {
            return {
                code: 200,
                data: cachedData,
                source: 'redis-cache'
            };
        }

        // 如果没有缓存数据，从外部 API 获取新数据
        // 使用用户提供的 API：https://iamyourfather.link0.me/api/v1/category
        const response: any = await $fetch('https://iamyourfather.link0.me/api/v1/new', {
            method: 'GET'
        });

        if (response.code !== 200 || !Array.isArray(response.data)) {
            throw new Error('Failed to fetch data from new API');
        }

        // 新 API 返回的 data 已经是符合前端格式的数组
        // 每个元素包含 name 和 data 字段
        const resultData = response.data;


        // 将数据存入Redis缓存
        await setDataInRedis(REDIS_KEY, resultData, CACHE_EXPIRATION);

        return {
            code: 200,
            data: resultData,
            source: 'fresh-data'
        }

    } catch (e) {
        console.error('Category API Error:', e);
        return {
            code: 500,
            msg: 'error',
        }
    }
})