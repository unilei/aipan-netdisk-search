import { createError, getHeader } from "h3";
import { verifyToken } from "~/server/model/user";

const getBearerToken = (event: any) => {
  const authorization = getHeader(event, "authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
};

export const getOptionalForumUser = (event: any) => {
  if (event.context.user?.userId) {
    return event.context.user;
  }

  const token = getBearerToken(event);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded?.userId) return null;

  return decoded;
};

export const requireForumUser = (event: any) => {
  const user = getOptionalForumUser(event);
  if (!user?.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "请先登录",
    });
  }

  return user;
};
