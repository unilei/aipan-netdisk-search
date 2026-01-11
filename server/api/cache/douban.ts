import { deleteDataFromRedis } from '~/server/utils/redis';

export default defineEventHandler(async (event) => {
    const REDIS_KEY = 'douban_homepage_data';

    try {
        const result = await deleteDataFromRedis(REDIS_KEY);
        
        if (result) {
            return {
                code: 200,
                msg: '缓存清空成功'
            };
        } else {
            return {
                code: 500,
                msg: '清空缓存失败'
            };
        }
    } catch (e) {
        console.error('Clear cache error:', e);
        return {
            code: 500,
            msg: 'error',
        };
    }
});
