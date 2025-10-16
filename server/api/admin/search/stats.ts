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
        // 获取总搜索次数（所有记录的 count 之和）
        const totalSearches = await prisma.searchRecord.aggregate({
            _sum: {
                count: true
            }
        });

        // 获取今日搜索次数（从每日统计表）
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const todaySearches = await prisma.dailySearchStats.aggregate({
            _sum: {
                count: true
            },
            where: {
                date: today
            }
        });

        // 获取独立关键词数量
        const uniqueKeywords = await prisma.searchRecord.count();

        return {
            code: 200,
            data: {
                totalSearches: totalSearches._sum.count || 0,
                todaySearches: todaySearches._sum.count || 0, // 今日搜索次数
                uniqueKeywords
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