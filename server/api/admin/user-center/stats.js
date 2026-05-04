// 获取用户统计信息
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  // 检查认证和权限
  const { user } = event.context;
  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 403,
      message: "没有权限访问此资源",
    });
  }

  try {
    // 获取用户总数
    const count = await prisma.user.count();

    // 获取各角色用户数量
    // 由于Prisma不支持像MongoDB的aggregate，我们需要先获取所有的role类型，然后分别统计
    const allRoles = await prisma.user.findMany({
      select: {
        role: true,
      },
      distinct: ["role"],
    });

    const roleStats = await Promise.all(
      allRoles.map(async ({ role }) => {
        const count = await prisma.user.count({
          where: { role },
        });
        return { _id: role, count };
      })
    );

    // 获取各状态用户数量
    const allStatuses = await prisma.user.findMany({
      select: {
        status: true,
      },
      distinct: ["status"],
    });

    const statusStats = await Promise.all(
      allStatuses.map(async ({ status }) => {
        const count = await prisma.user.count({
          where: { status },
        });
        return { _id: status, count };
      })
    );

    // 获取今日注册用户数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.user.count({
      where: {
        createdAt: { gte: today },
      },
    });

    // 获取本周注册用户数
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
    thisWeek.setHours(0, 0, 0, 0);
    const weekCount = await prisma.user.count({
      where: {
        createdAt: { gte: thisWeek },
      },
    });

    // 获取本月注册用户数
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const monthCount = await prisma.user.count({
      where: {
        createdAt: { gte: thisMonth },
      },
    });

    return {
      code: 200,
      count,
      roleStats,
      statusStats,
      today: todayCount,
      week: weekCount,
      month: monthCount,
    };
  } catch (error) {
    console.error("获取用户统计失败", error);
    throw createError({
      statusCode: 500,
      message: "服务器错误",
    });
  }
});
