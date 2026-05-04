import prisma from '~/lib/prisma';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { contentType, contentId, reason, description, email, contentTitle } = body;

    // 验证必填字段
    if (!contentType || !contentId || !reason || !description) {
      return {
        code: 400,
        msg: '缺少必要的举报信息'
      };
    }

    // 验证内容类型
    const validTypes = ['post', 'comment', 'topic', 'message', 'resource'];
    if (!validTypes.includes(contentType)) {
      return {
        code: 400,
        msg: '无效的内容类型'
      };
    }

    // 验证描述长度
    if (description.length < 10 || description.length > 500) {
      return {
        code: 400,
        msg: '描述长度需要在10-500字之间'
      };
    }

    // 获取举报者IP
    const ip = getRequestIP(event, { xForwardedFor: true });

    // 检查是否重复举报（同一IP在5分钟内举报同一内容）
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingReport = await prisma.report.findFirst({
      where: {
        contentType,
        contentId: String(contentId),
        reporterIp: ip,
        createdAt: {
          gte: fiveMinutesAgo
        }
      }
    });

    if (existingReport) {
      return {
        code: 400,
        msg: '您已举报过该内容，请勿重复举报'
      };
    }

    // 创建举报记录
    const report = await prisma.report.create({
      data: {
        contentType,
        contentId: String(contentId),
        contentTitle: contentTitle || '',
        reason,
        description,
        reporterEmail: email || null,
        reporterIp: ip,
        status: 'pending'
      }
    });

    // TODO: 发送通知给管理员
    // await sendAdminNotification('新的内容举报', {
    //   reportId: report.id,
    //   contentType,
    //   reason
    // });

    return {
      code: 200,
      msg: '举报已提交，感谢您的反馈',
      data: {
        reportId: report.id
      }
    };

  } catch (error) {
    console.error('Submit report error:', error);
    return {
      code: 500,
      msg: '举报提交失败，请稍后重试'
    };
  }
});
