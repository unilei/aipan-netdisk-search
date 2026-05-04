import prisma from '~/lib/prisma';
import { requireAdmin } from '../../../utils/auth';

export default defineEventHandler(async (event) => {
  try {
    // 验证管理员权限
    const admin = await requireAdmin(event);

    const body = await readBody(event);
    const { reportId, action, adminNote } = body;

    // 验证参数
    if (!reportId || !action) {
      return {
        code: 400,
        msg: '缺少必要参数'
      };
    }

    const validActions = ['resolve', 'reject', 'reviewing'];
    if (!validActions.includes(action)) {
      return {
        code: 400,
        msg: '无效的操作类型'
      };
    }

    // 查询举报记录
    const report = await prisma.report.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      return {
        code: 404,
        msg: '举报记录不存在'
      };
    }

    // 映射操作到状态
    const statusMap: Record<string, string> = {
      resolve: 'resolved',
      reject: 'rejected',
      reviewing: 'reviewing'
    };

    // 更新举报状态
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: statusMap[action],
        adminNote: adminNote || null,
        handledBy: admin.id,
        handledAt: new Date()
      }
    });

    // TODO: 如果是解决举报，可能需要对被举报的内容进行处理
    // 例如：删除内容、禁用用户等
    if (action === 'resolve') {
      await handleReportedContent(report);
    }

    // TODO: 如果举报者留了邮箱，发送处理结果通知
    if (report.reporterEmail) {
      // await sendEmailNotification(report.reporterEmail, action, adminNote);
    }

    return {
      code: 200,
      msg: '处理成功',
      data: updatedReport
    };

  } catch (error: any) {
    console.error('Handle report error:', error);
    
    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        code: error.statusCode,
        msg: error.message
      };
    }

    return {
      code: 500,
      msg: '处理失败'
    };
  }
});

// 处理被举报的内容
async function handleReportedContent(report: any) {
  try {
    const { contentType, contentId, reason } = report;

    // 对于严重违规内容（色情、暴力、违法），直接删除或禁用
    const severeReasons = ['pornography', 'violence', 'illegal'];
    
    if (severeReasons.includes(reason)) {
      switch (contentType) {
        case 'post':
          // 删除博客文章或标记为已删除
          await prisma.blogPost.update({
            where: { id: parseInt(contentId) },
            data: { status: 'rejected' }
          }).catch(() => {});
          break;

        case 'comment':
          // 删除评论
          await prisma.comment.delete({
            where: { id: parseInt(contentId) }
          }).catch(() => {});
          break;

        case 'topic':
          // 禁用论坛主题
          await prisma.forumTopic.update({
            where: { id: parseInt(contentId) },
            data: { status: 'rejected' }
          }).catch(() => {});
          break;

        case 'resource':
          // 删除用户资源
          await prisma.userResource.update({
            where: { id: parseInt(contentId) },
            data: { status: 'rejected' }
          }).catch(() => {});
          break;
      }
    }

    console.log(`Handled reported content: ${contentType} #${contentId}`);
  } catch (error) {
    console.error('Error handling reported content:', error);
  }
}
