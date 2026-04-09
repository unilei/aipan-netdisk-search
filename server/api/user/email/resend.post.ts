import prisma from "~/lib/prisma";
import { verifyToken } from "~/server/model/user";
import { sendVerificationEmail } from "~/server/services/email/emailVerification";

const GENERIC_SUCCESS_MESSAGE = "如该邮箱尚未激活，验证邮件已发送";

const isValidEmail = (value?: string) => {
  if (!value) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const authHeader = getHeader(event, "authorization");

    let user = null;
    let isAuthenticatedRequest = false;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1] || "";
      const decoded = verifyToken(token);

      if (decoded?.userId) {
        isAuthenticatedRequest = true;
        user = await prisma.user.findUnique({
          where: {
            id: decoded.userId,
          },
          select: {
            id: true,
            username: true,
            email: true,
            isVerified: true,
          },
        });
      }
    }

    if (!user) {
      const email = body?.email?.trim().toLowerCase();

      if (!isValidEmail(email)) {
        return {
          code: 200,
          msg: GENERIC_SUCCESS_MESSAGE,
        };
      }

      user = await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
          username: true,
          email: true,
          isVerified: true,
        },
      });

      if (!user || user.isVerified) {
        return {
          code: 200,
          msg: GENERIC_SUCCESS_MESSAGE,
        };
      }
    }

    if (user.isVerified) {
      return {
        code: isAuthenticatedRequest ? 400 : 200,
        msg: isAuthenticatedRequest ? "当前邮箱已激活" : GENERIC_SUCCESS_MESSAGE,
      };
    }

    try {
      await sendVerificationEmail(user);
    } catch (error: any) {
      if (!isAuthenticatedRequest) {
        return {
          code: 200,
          msg: GENERIC_SUCCESS_MESSAGE,
        };
      }

      return {
        code: error.statusCode || 500,
        msg: error.statusMessage || error.message || "重发验证邮件失败",
      };
    }

    return {
      code: 200,
      msg: isAuthenticatedRequest ? "验证邮件已发送" : GENERIC_SUCCESS_MESSAGE,
    };
  } catch (error) {
    console.error("重发验证邮件失败:", error);

    return {
      code: 500,
      msg: "重发验证邮件失败",
    };
  }
});
