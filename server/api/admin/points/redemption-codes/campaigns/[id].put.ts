import prisma from "~/lib/prisma";
import {
  normalizeCampaignInput,
  toAdminCampaignPayload,
} from "~/server/services/points/redemptionCodes.mjs";

export default defineEventHandler(async (event) => {
  const id = Number.parseInt(getRouterParam(event, "id") || "", 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "活动 ID 不正确",
    });
  }

  const existing = await prisma.redemptionCodeCampaign.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          redemptions: true,
        },
      },
    },
  });
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "兑换活动不存在",
    });
  }

  const body = await readBody(event);
  const data = normalizeCampaignInput(body);
  const updateData =
    existing._count.redemptions > 0
      ? {
          name: data.name,
          description: data.description,
          enabled: data.enabled,
          endsAt: data.endsAt,
        }
      : data;

  const campaign = await prisma.redemptionCodeCampaign.update({
    where: { id },
    data: updateData,
    include: {
      _count: {
        select: {
          codes: true,
          redemptions: true,
        },
      },
    },
  });

  return {
    code: 200,
    msg: "兑换活动已更新",
    data: toAdminCampaignPayload(campaign),
  };
});
