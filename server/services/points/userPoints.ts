import prisma from "~/lib/prisma";
import {
  calculateEffectivePoints,
  decoratePointsHistoryRecords,
  POINT_TYPES,
  resolveTransferRewardDecision,
  normalizeTransferRewardConfig,
} from "~/server/services/points/pointsLedger.mjs";

export {
  decoratePointsHistoryRecords,
  POINT_TYPES,
  normalizeTransferRewardConfig,
};

type PrismaLike = any;

export const getUserPointsBreakdown = async (
  userId: number,
  options: {
    client?: PrismaLike;
    permanentPoints?: number;
    now?: Date;
  } = {},
) => {
  const client = options.client || prisma;
  const now = options.now || new Date();
  let permanentPoints = options.permanentPoints;

  if (permanentPoints === undefined || permanentPoints === null) {
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    permanentPoints = Number(user?.points || 0);
  }

  const temporaryEntries = await client.pointsHistory.findMany({
    where: {
      userId,
      points: { gt: 0 },
      expiresAt: { gt: now },
    },
    select: {
      points: true,
      expiresAt: true,
    },
  });

  return calculateEffectivePoints({
    permanentPoints,
    temporaryEntries,
    now,
  });
};

export const decoratePointsHistory = (records: any[], now = new Date()) => {
  return decoratePointsHistoryRecords(records, now);
};

export const buildTransferRewardDescription = (durationMinutes: number) => {
  if (durationMinutes % 1440 === 0) {
    const days = durationMinutes / 1440;
    return `网盘转存奖励，${days}天内有效`;
  }

  if (durationMinutes % 60 === 0) {
    const hours = durationMinutes / 60;
    return `网盘转存奖励，${hours}小时内有效`;
  }

  return `网盘转存奖励，${durationMinutes}分钟内有效`;
};

export const grantTransferPointsForShare = async ({
  userId,
  shareId,
  transferFingerprint,
  config,
  now = new Date(),
}: {
  userId: number;
  shareId: string;
  transferFingerprint?: string | null;
  config: Record<string, unknown>;
  now?: Date;
}) => {
  const rewardConfig = normalizeTransferRewardConfig(config);
  const normalizedTransferFingerprint =
    typeof transferFingerprint === "string" && transferFingerprint.trim()
      ? transferFingerprint.trim()
      : `legacy-share:${shareId}`;

  return prisma.$transaction(async (tx: PrismaLike) => {
    const existingGrant = await tx.transferPointGrant.findUnique({
      where: {
        userId_transferFingerprint: {
          userId,
          transferFingerprint: normalizedTransferFingerprint,
        },
      },
    });

    const decision = resolveTransferRewardDecision({
      existingGrant,
      config: rewardConfig,
      now,
    });

    if (!decision.granted) {
      const breakdown = await getUserPointsBreakdown(userId, {
        client: tx,
        now,
      });

      return {
        granted: false,
        alreadyGranted: decision.alreadyGranted,
        points: 0,
        expiresAt: null,
        effectivePoints: breakdown.effectivePoints,
        breakdown,
      };
    }

    const pointsRecord = await tx.pointsHistory.create({
      data: {
        userId,
        points: decision.points,
        type: POINT_TYPES.transfer,
        description: buildTransferRewardDescription(
          rewardConfig.transferRewardDurationMinutes,
        ),
        expiresAt: decision.expiresAt,
      },
    });

    await tx.transferPointGrant.create({
      data: {
        userId,
        shareId,
        transferFingerprint: normalizedTransferFingerprint,
        points: decision.points,
        expiresAt: decision.expiresAt,
        pointsHistoryId: pointsRecord.id,
      },
    });

    const breakdown = await getUserPointsBreakdown(userId, {
      client: tx,
      now,
    });

    return {
      granted: true,
      alreadyGranted: false,
      points: decision.points,
      expiresAt: decision.expiresAt,
      effectivePoints: breakdown.effectivePoints,
      breakdown,
    };
  });
};
