import {
  REGISTRATION_GIFT_SOURCE,
  grantRegistrationGiftForUser,
} from "~/server/services/points/registrationGift.mjs";

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "请先登录",
    });
  }

  try {
    const result = await grantRegistrationGiftForUser({
      userId,
      source: REGISTRATION_GIFT_SOURCE.legacyClaim,
    });

    return {
      code: 200,
      msg: result.message || (result.granted ? "注册礼包领取成功" : "注册礼包已领取"),
      data: result,
    };
  } catch (error: any) {
    if (error.code === "P2002") {
      throw createError({
        statusCode: 409,
        statusMessage: "注册礼包已领取",
      });
    }

    if (error.statusCode) {
      throw error;
    }

    console.error("领取注册礼包失败:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "领取注册礼包失败",
    });
  }
});
