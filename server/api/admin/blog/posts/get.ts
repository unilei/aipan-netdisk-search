import prisma from '~/lib/prisma';

export default defineEventHandler(async (event) => {
  const query = await getQuery(event);
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const status = query.status as string || 'all'; // 可以是 'pending', 'published', 'rejected', 'all'
  const userId = event.context.user.userId;

  try {
    // 构建 BlogPost 查询条件
    let blogPostWhereClause: any = {};
    
    // 如果筛选条件不是 'all'，则应用筛选条件
    if (status !== 'all') {
      blogPostWhereClause.status = status;
    }

    // 如果是查询已发布的文章，我们需要同时获取管理员创建的 Post 记录
    if (status === 'all' || status === 'published') {
      // 1. 获取已发布的用户博客文章
      const userBlogPosts = await prisma.blogPost.findMany({
        where: {
          ...blogPostWhereClause,
          status: 'published'
        },
        skip: status === 'published' ? skip : 0,
        take: status === 'published' ? take : 1000, // 如果是只查询已发布的，则使用分页参数，否则获取足够多的记录
        include: {
          author: {
            select: { username: true },
          },
          categories: {
            include: { category: true }
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // 2. 获取管理员直接创建的文章
      const adminPosts = await prisma.post.findMany({
        where: {
          creatorId: userId, // 只获取当前管理员创建的文章
        },
        skip: status === 'published' ? 0 : skip, // 如果不是只查询已发布的，对管理员文章使用分页参数
        take: status === 'published' ? 1000 : take, // 如果是只查询已发布的，获取足够多的记录，否则使用分页参数
        include: {
          creator: {
            select: { username: true },
          },
          categories: {
            include: { category: true }
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // 3. 对管理员创建的文章进行格式转换，使其结构与 BlogPost 兼容
      const formattedAdminPosts = adminPosts.map((post: any) => ({
        id: `admin_${post.id}`, // 添加前缀以区分
        title: post.title,
        slug: post.slug,
        content: post.content,
        tags: [], // Post 可能没有 tags 字段
        status: 'admin_post', // 特殊状态表示这是管理员直接创建的文章
        author: post.creator,
        authorId: post.creatorId,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        categories: post.categories.map((cat: any) => ({
          category: cat.category
        })),
        isAdminPost: true // 添加标记表示这是管理员文章
      }));

      // 4. 合并两个列表并排序
      let allPosts = [...userBlogPosts, ...formattedAdminPosts];
      allPosts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // 5. 如果是查询所有状态，则应用分页参数
      if (status === 'all') {
        allPosts = allPosts.slice(skip, skip + take);
      }

      // 计算总数
      const userBlogPostsTotalCount = await prisma.blogPost.count({
        where: {
          ...blogPostWhereClause,
          status: 'published'
        }
      });
      
      const adminPostsTotalCount = await prisma.post.count({
        where: {
          creatorId: userId
        }
      });

      const totalCount = userBlogPostsTotalCount + adminPostsTotalCount;

      return {
        totalCount,
        page,
        pageSize,
        posts: allPosts,
      };
    } else {
      // 如果不是查询已发布的文章或全部，则只查询 BlogPost
      const totalCount = await prisma.blogPost.count({
        where: blogPostWhereClause
      });

      const posts = await prisma.blogPost.findMany({
        where: blogPostWhereClause,
        skip,
        take,
        include: {
          author: {
            select: { username: true },
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
    }
  } catch (error) {
    console.error('获取博客文章列表失败:', error);
    return {
      code: 500,
      msg: 'error',
      data: error
    }
  }
});
