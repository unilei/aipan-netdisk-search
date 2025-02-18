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

            // 使用 upsert 来更新或创建记录
            await prisma.searchRecord.upsert({
                where: {
                    keyword
                },
                update: {
                    count: { increment: 1 },
                    lastSearchAt: new Date()
                },
                create: {
                    keyword,
                    count: 1,
                    lastSearchAt: new Date()
                }
            });

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