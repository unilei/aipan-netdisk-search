import prisma from "~/lib/prisma";
import { createRedemptionCodesForCampaign } from "~/server/services/points/redemptionCodes.mjs";

export default defineEventHandler(async (event) => {
  const campaignId = Number.parseInt(getRouterParam(event, "id") || "", 10);
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "活动 ID 不正确",
    });
  }

  const campaign = await prisma.redemptionCodeCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true },
  });
  if (!campaign) {
    throw createError({
      statusCode: 404,
      statusMessage: "兑换活动不存在",
    });
  }

  const body = await readBody(event);
  const codes = await createRedemptionCodesForCampaign({
    campaignId,
    input: body,
  });

  return {
    code: 200,
    msg: "兑换码已生成，请立即导出保存",
    data: {
      createdCount: codes.length,
      codes,
    },
  };
});
