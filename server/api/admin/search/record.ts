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
            const { period = 'all', date } = getQuery(event);

            if (period === 'custom' && date) {
                // 自定义日期查询：从dailySearchStats表查询指定日期的数据
                const customDate = new Date(date as string);
                const startOfDay = new Date(customDate.getFullYear(), customDate.getMonth(), customDate.getDate());

                const dailyStats = await prisma.dailySearchStats.findMany({
                    where: {
                        date: startOfDay
                    },
                    orderBy: {
                        count: 'desc'
                    },
                    take: 100
                });

                // 获取关键词的详细信息
                const records = await Promise.all(
                    dailyStats.map(async (stat) => {
                        const record = await prisma.searchRecord.findUnique({
                            where: { keyword: stat.keyword }
                        });
                        return {
                            keyword: stat.keyword,
                            count: stat.count,
                            lastSearchAt: record?.lastSearchAt || stat.date
                        };
                    })
                );

                return {
                    code: 200,
                    data: records
                };
            }

            // 其他周期查询
            let dateFilter: any = {};
            const now = new Date();

            switch (period) {
                case 'day':
                    // 今日：从dailySearchStats表查询今天的数据
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const todayStats = await prisma.dailySearchStats.findMany({
                        where: {
                            date: today
                        },
                        orderBy: {
                            count: 'desc'
                        },
                        take: 100
                    });

                    const todayRecords = await Promise.all(
                        todayStats.map(async (stat) => {
                            const record = await prisma.searchRecord.findUnique({
                                where: { keyword: stat.keyword }
                            });
                            return {
                                keyword: stat.keyword,
                                count: stat.count,
                                lastSearchAt: record?.lastSearchAt || stat.date
                            };
                        })
                    );

                    return {
                        code: 200,
                        data: todayRecords
                    };

                case 'week':
                    // 本周：聚合本周的dailySearchStats数据
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - now.getDay());
                    weekStart.setHours(0, 0, 0, 0);

                    const weekStats = await prisma.dailySearchStats.groupBy({
                        by: ['keyword'],
                        _sum: {
                            count: true
                        },
                        where: {
                            date: {
                                gte: weekStart
                            }
                        },
                        orderBy: {
                            _sum: {
                                count: 'desc'
                            }
                        },
                        take: 100
                    });

                    const weekRecords = await Promise.all(
                        weekStats.map(async (stat) => {
                            const record = await prisma.searchRecord.findUnique({
                                where: { keyword: stat.keyword }
                            });
                            return {
                                keyword: stat.keyword,
                                count: stat._sum.count || 0,
                                lastSearchAt: record?.lastSearchAt || new Date()
                            };
                        })
                    );

                    return {
                        code: 200,
                        data: weekRecords
                    };

                case 'month':
                    // 本月：聚合本月的dailySearchStats数据
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

                    const monthStats = await prisma.dailySearchStats.groupBy({
                        by: ['keyword'],
                        _sum: {
                            count: true
                        },
                        where: {
                            date: {
                                gte: monthStart
                            }
                        },
                        orderBy: {
                            _sum: {
                                count: 'desc'
                            }
                        },
                        take: 100
                    });

                    const monthRecords = await Promise.all(
                        monthStats.map(async (stat) => {
                            const record = await prisma.searchRecord.findUnique({
                                where: { keyword: stat.keyword }
                            });
                            return {
                                keyword: stat.keyword,
                                count: stat._sum.count || 0,
                                lastSearchAt: record?.lastSearchAt || new Date()
                            };
                        })
                    );

                    return {
                        code: 200,
                        data: monthRecords
                    };

                default:
                    // 全部：从searchRecord表查询所有数据
                    const records = await prisma.searchRecord.findMany({
                        orderBy: {
                            count: 'desc'
                        },
                        take: 100
                    });

                    return {
                        code: 200,
                        data: records
                    };
            }

            return {
                code: 200,
                data: []
            };
        } catch (error) {
            console.error('获取搜索排行失败:', error);
            return {
                code: 500,
                msg: '获取搜索排行失败',
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }
}); 