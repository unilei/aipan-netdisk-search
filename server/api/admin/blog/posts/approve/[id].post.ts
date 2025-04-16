import prisma from '~/lib/prisma';
import { PrismaClient, Prisma } from '@prisma/client';

export default defineEventHandler(async (event) => {
  // 获取要审核的博客文章ID
  const blogPostId = parseInt(event.context.params?.id as string);
  
  if (!blogPostId) {
    return {
      code: 400,
      msg: '缺少博客文章ID',
      data: null
    };
  }

  try {
    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. 获取博客文章
      const blogPost = await tx.blogPost.findUnique({
        where: { id: blogPostId },
        include: {
          categories: {
            include: { category: true }
          },
          author: true
        }
      });

      if (!blogPost) {
        throw new Error('找不到指定的博客文章');
      }

      // 只能审核待审核状态的文章
      if (blogPost.status !== 'pending') {
        throw new Error(`该文章当前状态为 ${blogPost.status}，只有待审核的文章才能被通过`);
      }

      // 2. 创建新的 Post 记录
      const newPost = await tx.post.create({
        data: {
          title: blogPost.title,
          slug: blogPost.slug,
          content: blogPost.content,
          creatorId: blogPost.authorId,
          // 创建所有关联的分类关系
          categories: {
            create: blogPost.categories.map((cat: any) => ({
              categoryId: cat.categoryId
            }))
          }
        }
      });

      // 3. 更新博客文章状态为已发布
      const updatedBlogPost = await tx.blogPost.update({
        where: { id: blogPostId },
        data: { 
          status: 'published',
          postId: newPost.id  // 关联到新创建的 Post 记录
        }
      });

      return { blogPost: updatedBlogPost, newPost };
    });

    // 可选：发送通知给用户
    // ...此处可以添加通知逻辑

    return {
      code: 200,
      msg: '审核成功',
      data: {
        originalId: result.blogPost.id,
        postId: result.newPost.id,
        status: result.blogPost.status
      }
    };
  } catch (error: any) {
    console.error('审核文章失败:', error);
    return {
      code: 500,
      msg: '审核失败: ' + (error.message || '未知错误'),
      data: null
    };
  }
});
