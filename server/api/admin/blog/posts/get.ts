import prisma from '~/lib/prisma';

export default defineEventHandler(async (event) => {
  const query = await getQuery(event);
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  // 获取总记录数
  const totalCount = await prisma.post.count();
  try {
    const posts = await prisma.post.findMany({
      skip,
      take,
      include: {
        creator: {
          select: { username: true }, // 包含创建者的用户名
        },
        categories: {
          include: { category: true }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      totalCount,
      page,
      pageSize,
      posts,
    };
  } catch (error) {
    return {
      code: 500,
      msg: 'error',
      data: error
    }
  }


});
