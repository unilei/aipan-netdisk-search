import prisma from "~/lib/prisma";

export default defineEventHandler(async () => {
  const redemptions = await prisma.redemptionCodeRedemption.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      campaign: {
        select: {
          id: true,
          name: true,
          pointsExpiresInMinutes: true,
        },
      },
      code: {
        select: {
          codePrefix: true,
          codeSuffix: true,
          batchName: true,
        },
      },
    },
  });

  return {
    code: 200,
    msg: "获取成功",
    data: redemptions.map((item: any) => ({
      id: item.id,
      user: item.user,
      campaignId: item.campaignId,
      campaignName: item.campaign.name,
      maskedCode: [item.code.codePrefix, item.code.codeSuffix]
        .filter(Boolean)
        .join("..."),
      batchName: item.code.batchName,
      points: item.points,
      isTemporary: Boolean(item.expiresAt),
      expiresAt: item.expiresAt,
      createdAt: item.createdAt,
    })),
  };
});
