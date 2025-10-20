import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    // 验证管理员权限
    const user = event.context.user;
    if (!user || user.role !== 'admin') {
        return {
            code: 403,
            msg: '无权限访问'
        };
    }

    try {
        const { period = 'today', date } = getQuery(event);
        const now = new Date();

        // 获取总搜索次数（所有记录的 count 之和）
        const totalSearches = await prisma.searchRecord.aggregate({
            _sum: {
                count: true
            }
        });

        // 获取独立关键词数量
        const uniqueKeywords = await prisma.searchRecord.count();

        let periodSearches = 0;
        let dateFilter: any = {};

        // 根据不同的周期计算搜索次数
        if (period === 'custom' && date) {
            // 自定义日期查询
            const customDate = new Date(date as string);
            const startOfDay = new Date(customDate.getFullYear(), customDate.getMonth(), customDate.getDate());
            
            const customSearches = await prisma.dailySearchStats.aggregate({
                _sum: {
                    count: true
                },
                where: {
                    date: startOfDay
                }
            });
            periodSearches = customSearches._sum.count || 0;
        } else if (period === 'today') {
            // 今日搜索次数（从每日统计表）
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todaySearches = await prisma.dailySearchStats.aggregate({
                _sum: {
                    count: true
                },
                where: {
                    date: today
                }
            });
            periodSearches = todaySearches._sum.count || 0;
        } else if (period === 'week') {
            // 本周搜索次数
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay()); // 本周第一天（周日）
            weekStart.setHours(0, 0, 0, 0);
            
            const weekSearches = await prisma.dailySearchStats.aggregate({
                _sum: {
                    count: true
                },
                where: {
                    date: {
                        gte: weekStart
                    }
                }
            });
            periodSearches = weekSearches._sum.count || 0;
        } else if (period === 'month') {
            // 本月搜索次数
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            
            const monthSearches = await prisma.dailySearchStats.aggregate({
                _sum: {
                    count: true
                },
                where: {
                    date: {
                        gte: monthStart
                    }
                }
            });
            periodSearches = monthSearches._sum.count || 0;
        } else if (period === 'all') {
            // 全部时间（使用总搜索次数）
            periodSearches = totalSearches._sum.count || 0;
        }

        return {
            code: 200,
            data: {
                totalSearches: totalSearches._sum.count || 0,
                periodSearches, // 当前选择周期的搜索次数
                uniqueKeywords,
                period,
                date: date || null
            }
        };
    } catch (error) {
        console.error('获取搜索统计失败:', error);
        return {
            code: 500,
            msg: '获取搜索统计失败'
        };
    }
}); 