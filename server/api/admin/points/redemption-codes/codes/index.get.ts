import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const campaignId = query.campaignId ? Number(query.campaignId) : null;

  const codes = await prisma.redemptionCode.findMany({
    where: campaignId ? { campaignId } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    code: 200,
    msg: "获取成功",
    data: codes.map((item: any) => ({
      id: item.id,
      campaignId: item.campaignId,
      campaignName: item.campaign.name,
      maskedCode: [item.codePrefix, item.codeSuffix].filter(Boolean).join("..."),
      batchName: item.batchName,
      maxRedemptions: item.maxRedemptions,
      usedCount: item.usedCount,
      enabled: item.enabled,
      createdAt: item.createdAt,
    })),
  };
});
