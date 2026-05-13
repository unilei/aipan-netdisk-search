import { verifyEmailToken } from "~/server/services/email/emailVerification";
import {
  REGISTRATION_GIFT_SOURCE,
  grantRegistrationGiftForUser,
} from "~/server/services/points/registrationGift.mjs";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const token = body?.token?.trim();

    const user = await verifyEmailToken(token);
    const registrationGift = user?.role === "admin" ? null : await grantRegistrationGiftForUser({
      userId: user.id,
      source: REGISTRATION_GIFT_SOURCE.auto,
    });

    return {
      code: 200,
      msg: "邮箱激活成功",
      data: {
        redirectTo: "/login?verified=1",
        registrationGift,
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
