import { verifyToken } from "../model/user";

export default defineEventHandler((event) => {
  if (!event.node.req.url.startsWith("/api/admin")) {
    return;
  }
  const authHeader = event.node.req.headers["authorization"];

  if (!authHeader) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const user = verifyToken(token);
  // console.log(user);
  if (!user) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  // 把用户信息添加到上下文中，供后续的 API 处理器使用
  event.context.user = user;
});
