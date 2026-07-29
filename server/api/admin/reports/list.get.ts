import prisma from '~/lib/prisma';
import { requireAdmin } from '../../../utils/auth';

export default defineEventHandler(async (event) => {
  try {
    // 验证管理员权限
    const admin = await requireAdmin(event);

    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 20;
    const status = query.status as string;

    // 构建查询条件
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    // 查询总数
    const total = await prisma.report.count({ where });

    // 查询举报列表
    const reports = await prisma.report.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    return {
      code: 200,
      data: {
        reports,
        total,
        page,
        pageSize
      }
    };

  } catch (error: any) {
    console.error('List reports error:', error);
    
    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        code: error.statusCode,
        msg: error.message
      };
    }

    return {
      code: 500,
      msg: '获取举报列表失败'
    };
  }
});
