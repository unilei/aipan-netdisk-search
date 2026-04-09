// 处理单个用户的获取、更新和删除
import prisma from "~/lib/prisma";
import { sendVerificationEmail } from "~/server/services/email/emailVerification";
import { getEmailServiceConfig } from "~/server/services/email/resend";

export default defineEventHandler(async (event) => {
  // 检查认证和权限
  const { user } = event.context;
  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 403,
      message: "没有权限访问此资源",
    });
  }

  // 获取用户ID
  const id = event.context.params.id;
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "缺少用户ID",
    });
  }

  // 获取请求方法
  const method = event.node.req.method;

  // 获取单个用户
  if (method === "GET") {
    try {
      const userData = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          avatarStyle: true,
          isVerified: true,
          emailVerifiedAt: true,
          emailVerificationRequired: true,
        },
      });

      if (!userData) {
        throw createError({
          statusCode: 404,
          message: "用户不存在",
        });
      }

      return {
        code: 200,
        data: userData,
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }

      console.error("获取用户详情失败", error);
      throw createError({
        statusCode: 500,
        message: "服务器错误",
      });
    }
  }

  // 更新用户信息
  if (method === "PUT") {
    try {
      const body = await readBody(event);
      const { username, email, role, status } = body;

      // 验证必填字段
      if (!username || !email) {
        throw createError({
          statusCode: 400,
          message: "用户名和邮箱为必填项",
        });
      }

      // 检查用户名或邮箱是否被其他用户使用
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ username }, { email }],
          NOT: { id: parseInt(id) },
        },
      });

      if (existingUser) {
        throw createError({
          statusCode: 400,
          message: "用户名或邮箱已被其他用户使用",
        });
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isVerified: true,
          emailVerificationRequired: true,
        },
      });

      if (!currentUser) {
        throw createError({
          statusCode: 404,
          message: "用户不存在",
        });
      }

      const normalizedRole = role || currentUser.role;
      const emailChanged = currentUser.email !== email;
      const emailConfig = await getEmailServiceConfig();
      const shouldRequireReverification =
        emailChanged && emailConfig.enabled && normalizedRole !== "admin";

      // 执行更新
      const result = await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
          username,
          email,
          role: normalizedRole,
          status: status || undefined,
          isVerified: shouldRequireReverification
            ? false
            : currentUser.isVerified,
          emailVerifiedAt: shouldRequireReverification ? null : undefined,
          emailVerificationRequired: shouldRequireReverification
            ? true
            : currentUser.emailVerificationRequired,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          username: true,
          email: true,
          isVerified: true,
        },
      });

      let message = "用户信息更新成功";

      if (shouldRequireReverification) {
        try {
          await sendVerificationEmail({
            id: result.id,
            username: result.username,
            email: result.email,
            isVerified: result.isVerified,
          });
          message = "用户信息更新成功，新的激活邮件已发送";
        } catch (error) {
          console.error("管理员修改邮箱后发送验证邮件失败", error);
          message = "用户信息已更新，但激活邮件发送失败";
        }
      }

      return {
        code: 200,
        message,
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }

      console.error("更新用户失败", error);
      throw createError({
        statusCode: 500,
        message: "服务器错误",
      });
    }
  }

  // 删除用户
  if (method === "DELETE") {
    try {
      // 检查是否为当前用户
      if (user.userId === parseInt(id)) {
        throw createError({
          statusCode: 400,
          message: "不能删除当前登录的用户",
        });
      }

      const result = await prisma.user.delete({
        where: { id: parseInt(id) },
      });

      return {
        code: 200,
        message: "用户删除成功",
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }

      console.error("删除用户失败", error);
      throw createError({
        statusCode: 500,
        message: "服务器错误",
      });
    }
  }

  // 不支持的方法
  throw createError({
    statusCode: 405,
    message: "不支持的请求方法",
  });
});
