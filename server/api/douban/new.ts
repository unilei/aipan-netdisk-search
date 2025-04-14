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

        // 如果没有缓存数据，获取新数据
        let res: any = await $fetch('https://movie.douban.com/j/search_subjects', {
            method: 'GET',
            query: {
                type: "",
                tag: "热门",
                page_limit: 24,
                page_start: 0
            }
        })
        let remenTv: any = await $fetch('https://movie.douban.com/j/search_subjects', {
            method: 'GET',
            query: {
                type: "tv",
                tag: "热门",
                page_limit: 24,
                page_start: 0
            }
        })
        let guochanTV: any = await $fetch('https://movie.douban.com/j/search_subjects', {
            method: 'GET',
            query: {
                type: "tv",
                tag: "国产剧",
                page_limit: 24,
                page_start: 0
            }
        })
        let zongyi: any = await $fetch('https://movie.douban.com/j/search_subjects', {
            method: 'GET',
            query: {
                type: "tv",
                tag: "综艺",
                page_limit: 24,
                page_start: 0
            }
        })
        let meiju: any = await $fetch('https://movie.douban.com/j/search_subjects', {
            method: 'GET',
            query: {
                type: "tv",
                tag: "美剧",
                page_limit: 24,
                page_start: 0
            }
        })
        let riju: any = await $fetch('https://movie.douban.com/j/search_subjects', {
            method: 'GET',
            query: {
                type: "tv",
                tag: "日剧",
                page_limit: 24,
                page_start: 0
            }
        })
        let hanju: any = await $fetch('https://movie.douban.com/j/search_subjects', {
            method: 'GET',
            query: {
                type: "tv",
                tag: "韩剧",
                page_limit: 24,
                page_start: 0
            }
        })
        let ribendonghua: any = await $fetch('https://movie.douban.com/j/search_subjects', {
            method: 'GET',
            query: {
                type: "tv",
                tag: "日本动画",
                page_limit: 24,
                page_start: 0
            }
        })
        let jilupian: any = await $fetch('https://movie.douban.com/j/search_subjects', {
            method: 'GET',
            query: {
                type: "tv",
                tag: "纪录片",
                page_limit: 24,
                page_start: 0
            }
        })

        const resultData = [
            {
                name: '豆瓣热映',
                data: res.subjects
            },
            {
                name: '热门电视',
                data: remenTv.subjects
            },
            {
                name: '国产剧',
                data: guochanTV.subjects
            },
            {
                name: '综艺',
                data: zongyi.subjects
            },
            {
                name: '美剧',
                data: meiju.subjects
            },
            {
                name: '日剧',
                data: riju.subjects
            },
            {
                name: '韩剧',
                data: hanju.subjects
            },
            {
                name: '日本动画',
                data: ribendonghua.subjects
            },
            {
                name: '纪录片',
                data: jilupian.subjects
            }
        ];

        // 将数据存入Redis缓存
        await setDataInRedis(REDIS_KEY, resultData, CACHE_EXPIRATION);

        return {
            code: 200,
            data: resultData,
            source: 'fresh-data'
        }

    } catch (e) {
        console.log(e)
        return {
            code: 500,
            msg: 'error',
        }
    }
})