import prisma from "~/lib/prisma";
import { toAdminCampaignPayload } from "~/server/services/points/redemptionCodes.mjs";

export default defineEventHandler(async () => {
  const campaigns = await prisma.redemptionCodeCampaign.findMany({
    orderBy: { createdAt: "desc" },
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
    msg: "获取成功",
    data: campaigns.map(toAdminCampaignPayload),
  };
});
