import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    if (event.method === 'POST') {
        try {
            const { keyword } = await readBody(event);

            if (!keyword) {
                return {
                    code: 400,
                    msg: '关键词不能为空'
                };
            }

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // 使用事务同时更新两个表
            await prisma.$transaction([
                // 更新总搜索记录
                prisma.searchRecord.upsert({
                    where: {
                        keyword
                    },
                    update: {
                        count: { increment: 1 },
                        lastSearchAt: now
                    },
                    create: {
                        keyword,
                        count: 1,
                        lastSearchAt: now
                    }
                }),
                // 更新每日搜索统计
                prisma.dailySearchStats.upsert({
                    where: {
                        date_keyword: {
                            date: today,
                            keyword
                        }
                    },
                    update: {
                        count: { increment: 1 },
                        updatedAt: now
                    },
                    create: {
                        date: today,
                        keyword,
                        count: 1
                    }
                })
            ]);

            return {
                code: 200,
                msg: '记录成功'
            };
        } catch (error) {
            console.error('记录搜索失败:', error);
            return {
                code: 500,
                msg: '记录搜索失败'
            };
        }
    }

    // 获取搜索排行榜
    if (event.method === 'GET') {
        try {
            const { period = 'all' } = getQuery(event);

            let dateFilter = {};
            const now = new Date();

            switch (period) {
                case 'day':
                    dateFilter = {
                        lastSearchAt: {
                            gte: new Date(now.setHours(0, 0, 0, 0))
                        }
                    };
                    break;
                case 'week':
                    dateFilter = {
                        lastSearchAt: {
                            gte: new Date(now.setDate(now.getDate() - 7))
                        }
                    };
                    break;
                case 'month':
                    dateFilter = {
                        lastSearchAt: {
                            gte: new Date(now.setMonth(now.getMonth() - 1))
                        }
                    };
                    break;
            }

            const records = await prisma.searchRecord.findMany({
                where: dateFilter,
                orderBy: {
                    count: 'desc'
                },
                take: 100
            });

            return {
                code: 200,
                data: records
            };
        } catch (error) {
            console.error('获取搜索排行失败:', error);
            return {
                code: 500,
                msg: '获取搜索排行失败'
            };
        }
    }
}); 