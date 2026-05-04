import { verifyEmailToken } from "~/server/services/email/emailVerification";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const token = body?.token?.trim();

    await verifyEmailToken(token);

    return {
      code: 200,
      msg: "邮箱激活成功",
      data: {
        redirectTo: "/login?verified=1",
      },
    };
  } catch (error: any) {
    console.error("邮箱验证失败:", error);

    return {
      code: error.statusCode || 500,
      msg: error.statusMessage || error.message || "邮箱验证失败",
    };
  }
});
