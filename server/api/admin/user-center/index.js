// 处理用户列表请求和创建新用户
import prisma from "~/lib/prisma";
import crypto from "crypto";

export default defineEventHandler(async (event) => {
  // 检查认证和权限
  const { user } = event.context;
  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 403,
      message: "没有权限访问此资源",
    });
  }

  const method = event.node.req.method;

  // 获取用户列表
  if (method === "GET") {
    const query = getQuery(event);
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 10;
    const search = query.search || "";
    const role = query.role || "";
    const status = query.status || "";

    try {
      // 构建查询条件
      const where = {};

      if (search) {
        where.OR = [
          { username: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      if (role) {
        where.role = role;
      }

      if (status) {
        where.status = status;
      }

      // 获取总数
      const total = await prisma.user.count({ where });

      // 获取分页数据
      const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          avatarStyle: true,
        },
      });

      return {
        code: 200,
        data: {
          users,
          total,
          page,
          pageSize,
        },
      };
    } catch (error) {
      console.error("获取用户列表失败", error);
      throw createError({
        statusCode: 500,
        message: "服务器错误",
      });
    }
  }

  // 创建新用户
  if (method === "POST") {
    try {
      const body = await readBody(event);
      const { username, email, password, role, status } = body;

      // 验证必填字段
      if (!username || !email || !password) {
        throw createError({
          statusCode: 400,
          message: "用户名、邮箱和密码为必填项",
        });
      }

      // 检查用户名或邮箱是否已存在
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ username }, { email }],
        },
      });

      if (existingUser) {
        throw createError({
          statusCode: 400,
          message: "用户名或邮箱已被使用",
        });
      }

      // 生成盐值和密码哈希
      const salt = crypto.randomBytes(16).toString("hex");
      const hash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, "sha512")
        .toString("hex");

      // 创建新用户
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          password: hash,
          salt,
          role: role || "user",
          status: status || "active",
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      return {
        code: 201,
        message: "用户创建成功",
        data: newUser,
      };
    } catch (error) {
      console.error("创建用户失败", error);

      // 如果是已知错误,直接抛出
      if (error.statusCode) {
        throw error;
      }

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
