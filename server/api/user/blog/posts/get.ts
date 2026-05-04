import prisma from '~/lib/prisma';

export default defineEventHandler(async (event) => {
  const query = await getQuery(event);
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const userId = event.context.user.userId;
  if (!userId) {
    return {
      code: 401,
      msg: 'Unauthorized',
      data: null
    };
  }
  
  try {
    // 只获取该用户的博客文章总数
    const totalCount = await prisma.blogPost.count({
      where: {
        authorId: userId
      }
    });
    
    // 获取该用户的博客文章列表
    const posts = await prisma.blogPost.findMany({
      where: {
        authorId: userId
      },
      skip,
      take,
      include: {
        author: {
          select: { username: true }, // 包含作者的用户名
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
  } catch (error: any) {
    return {
      code: 500,
      msg: 'error',
      data: error
    };
  }
});
