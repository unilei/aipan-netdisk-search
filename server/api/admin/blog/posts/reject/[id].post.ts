import prisma from '~/lib/prisma';
import type { PrismaClient } from '@prisma/client';

export default defineEventHandler(async (event) => {
  const blogPostId = parseInt(event.context.params?.id as string);
  const body = await readBody(event);
  const reason = body.reason || '未提供拒绝原因';

  if (!blogPostId) {
    return {
      code: 400,
      msg: '缺少博客文章ID',
      data: null
    };
  }

  try {
    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx: PrismaClient) => {
      // 1. 获取博客文章
      const blogPost = await tx.blogPost.findUnique({
        where: { id: blogPostId },
        include: { author: true }
      });

      if (!blogPost) {
        throw new Error('找不到指定的博客文章');
      }

      // 只能拒绝待审核状态的文章
      if (blogPost.status !== 'pending') {
        throw new Error(`该文章当前状态为 ${blogPost.status}，只有待审核的文章才能被拒绝`);
      }

      // 2. 更新博客文章状态为已拒绝
      const updatedPost = await tx.blogPost.update({
        where: { id: blogPostId },
        data: {
          status: 'rejected',
          rejectionReason: reason
        }
      });

      return { blogPost, updatedPost };
    });

    // 可选：发送通知给用户
    // ...此处可以添加通知逻辑

    return {
      code: 200,
      msg: '已拒绝文章',
      data: {
        id: result.updatedPost.id,
        status: result.updatedPost.status
      }
    };
  } catch (error: any) {
    console.error('拒绝文章失败:', error);
    return {
      code: 500,
      msg: '操作失败: ' + (error.message || '未知错误'),
      data: null
    };
  }
});
