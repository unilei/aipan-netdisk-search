// 处理用户状态切换
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

  // 检查请求方法
  if (event.node.req.method !== "PATCH") {
    throw createError({
      statusCode: 405,
      message: "不支持的请求方法",
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

  try {
    // 获取请求体
    const body = await readBody(event);
    const { status } = body;

    // 验证状态值
    if (!status || !["active", "disabled"].includes(status)) {
      throw createError({
        statusCode: 400,
        message: "无效的状态值，必须为 active 或 disabled",
      });
    }

    // 检查是否为当前用户
    if (user.userId === parseInt(id)) {
      throw createError({
        statusCode: 400,
        message: "不能修改当前登录用户的状态",
      });
    }

    // 更新状态
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return {
      code: 200,
      message: `用户状态已更新为${status === "active" ? "活跃" : "禁用"}`,
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    console.error("更新用户状态失败", error);
    throw createError({
      statusCode: 500,
      message: "服务器错误",
    });
  }
});
