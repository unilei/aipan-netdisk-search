import { requireAdmin } from '~/server/utils/auth';
import { deleteDataFromRedis } from '~/server/utils/redis';
import {
    DOUBAN_HOMEPAGE_CACHE_KEY,
    DOUBAN_HOMEPAGE_LAST_GOOD_CACHE_KEY,
    DOUBAN_HOMEPAGE_LEGACY_CACHE_KEYS,
} from '~/utils/doubanHomepage.mjs';

export default defineEventHandler(async (event) => {
    await requireAdmin(event);

    const cacheKeys = [
        DOUBAN_HOMEPAGE_CACHE_KEY,
        DOUBAN_HOMEPAGE_LAST_GOOD_CACHE_KEY,
        ...DOUBAN_HOMEPAGE_LEGACY_CACHE_KEYS,
    ];
    const results = await Promise.all(
        cacheKeys.map((key) => deleteDataFromRedis(key)),
    );

    if (!results.every(Boolean)) {
        throw createError({
            statusCode: 503,
            statusMessage: 'Redis unavailable',
            message: '豆瓣缓存清理失败',
        });
    }

    return {
        code: 200,
        msg: '豆瓣缓存清空成功',
    };
});
