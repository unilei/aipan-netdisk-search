import prisma from "~/lib/prisma";
import {
  normalizeCampaignInput,
  toAdminCampaignPayload,
} from "~/server/services/points/redemptionCodes.mjs";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const data = normalizeCampaignInput(body);

  const campaign = await prisma.redemptionCodeCampaign.create({
    data: {
      ...data,
      createdById: event.context.user?.userId || null,
    },
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
    msg: "兑换活动已创建",
    data: toAdminCampaignPayload(campaign),
  };
});
