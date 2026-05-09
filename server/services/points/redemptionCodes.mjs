import crypto from "node:crypto";

import { POINT_TYPES } from "./pointsLedger.mjs";

export const REDEMPTION_LIMITS = {
  nameMaxLength: 80,
  descriptionMaxLength: 300,
  maxPoints: 100000000,
  maxExpireMinutes: 525600,
  maxPerUserLimit: 10,
  maxBatchQuantity: 1000,
  maxBatchNameLength: 80,
};

const normalizeString = (value) => String(value || "").trim();

const normalizeInteger = (value, fallback, min, max) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

export const normalizeRedeemCode = (value) =>
  normalizeString(value).toUpperCase().replace(/[\s-]+/g, "");

export const buildRedemptionCodeHash = (
  code,
  secret = process.env.REDEMPTION_CODE_HASH_SECRET,
) => {
  const canonicalCode = normalizeRedeemCode(code);
  const normalizedSecret = normalizeString(secret);

  if (!canonicalCode) {
    throw new Error("兑换码不能为空");
  }
  if (!normalizedSecret) {
    throw new Error("兑换码哈希密钥未配置");
  }

  return crypto
    .createHash("sha256")
    .update(`${normalizedSecret}:${canonicalCode}`)
    .digest("hex");
};

export const getRedemptionCodeMask = (code) => {
  const canonicalCode = normalizeRedeemCode(code);
  const codePrefix = canonicalCode.slice(0, 5) || null;
  const codeSuffix = canonicalCode.slice(-4) || null;

  return {
    codePrefix,
    codeSuffix,
    maskedCode: [codePrefix, codeSuffix].filter(Boolean).join("..."),
  };
};

export const generateRedemptionCode = ({ prefix = "AIPAN", randomBytes } = {}) => {
  const normalizedPrefix =
    normalizeString(prefix)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "")
      .slice(0, 8) || "AIPAN";
  const bytes = randomBytes || crypto.randomBytes(9);
  const body = bytes
    .toString("base64url")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 12)
    .padEnd(12, "X");
  const chunks = body.match(/.{1,4}/g) || [body];

  return [normalizedPrefix, ...chunks].join("-");
};

export const normalizeGeneratedCodeOptions = (input = {}) => ({
  quantity: normalizeInteger(
    input.quantity,
    1,
    1,
    REDEMPTION_LIMITS.maxBatchQuantity,
  ),
  prefix:
    normalizeString(input.prefix)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "")
      .slice(0, 8) || "AIPAN",
  batchName:
    normalizeString(input.batchName).slice(
      0,
      REDEMPTION_LIMITS.maxBatchNameLength,
    ) || null,
  maxRedemptions: normalizeInteger(input.maxRedemptions, 1, 1, 100000000),
  enabled: input.enabled === undefined ? true : Boolean(input.enabled),
});

export const normalizeCampaignInput = (input = {}) => {
  const name = normalizeString(input.name);
  if (!name) throw new Error("活动名称不能为空");
  if (name.length > REDEMPTION_LIMITS.nameMaxLength) {
    throw new Error(`活动名称不能超过 ${REDEMPTION_LIMITS.nameMaxLength} 个字符`);
  }

  const description = normalizeString(input.description);
  if (description.length > REDEMPTION_LIMITS.descriptionMaxLength) {
    throw new Error(
      `活动说明不能超过 ${REDEMPTION_LIMITS.descriptionMaxLength} 个字符`,
    );
  }

  const points = normalizeInteger(input.points, 0, 1, REDEMPTION_LIMITS.maxPoints);
  const rewardMode = normalizeString(input.rewardMode || "permanent").toLowerCase();
  const pointsExpiresInMinutes =
    rewardMode === "temporary"
      ? normalizeInteger(
          input.pointsExpiresInMinutes,
          1440,
          1,
          REDEMPTION_LIMITS.maxExpireMinutes,
        )
      : null;

  return {
    name,
    description,
    rewardType: "points",
    points,
    pointsExpiresInMinutes,
    enabled: input.enabled === undefined ? true : Boolean(input.enabled),
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    maxRedemptionsPerUser: normalizeInteger(
      input.maxRedemptionsPerUser,
      1,
      1,
      REDEMPTION_LIMITS.maxPerUserLimit,
    ),
  };
};

const toDateOrNull = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const createServiceError = ({ statusCode, statusMessage }) => {
  if (typeof globalThis.createError === "function") {
    return globalThis.createError({ statusCode, statusMessage });
  }

  const error = new Error(statusMessage);
  error.statusCode = statusCode;
  error.statusMessage = statusMessage;
  return error;
};

export const resolveRedemptionEligibility = ({
  code,
  userCampaignRedemptionCount = 0,
  userCodeRedeemed = false,
  now = new Date(),
}) => {
  const currentTime = toDateOrNull(now) || new Date();

  if (!code) {
    return {
      redeemable: false,
      reason: "not_found",
      message: "兑换码无效或不可用",
    };
  }
  if (!code.enabled) {
    return {
      redeemable: false,
      reason: "code_disabled",
      message: "兑换码无效或不可用",
    };
  }
  if (
    code.maxRedemptions !== null &&
    code.maxRedemptions !== undefined &&
    Number(code.usedCount || 0) >= Number(code.maxRedemptions)
  ) {
    return {
      redeemable: false,
      reason: "code_exhausted",
      message: "该活动已达到兑换上限",
    };
  }

  const campaign = code.campaign;
  if (!campaign || !campaign.enabled) {
    return {
      redeemable: false,
      reason: "campaign_disabled",
      message: "兑换码无效或不可用",
    };
  }

  const startsAt = toDateOrNull(campaign.startsAt);
  const endsAt = toDateOrNull(campaign.endsAt);
  if (startsAt && startsAt > currentTime) {
    return {
      redeemable: false,
      reason: "not_started",
      message: "兑换码无效或不可用",
    };
  }
  if (endsAt && endsAt <= currentTime) {
    return {
      redeemable: false,
      reason: "expired",
      message: "兑换码无效或不可用",
    };
  }
  if (userCodeRedeemed) {
    return {
      redeemable: false,
      reason: "already_redeemed",
      message: "该兑换码已被兑换",
    };
  }
  if (
    Number(userCampaignRedemptionCount || 0) >=
    Number(campaign.maxRedemptionsPerUser || 1)
  ) {
    return {
      redeemable: false,
      reason: "campaign_user_limit",
      message: "该活动已达到兑换上限",
    };
  }

  return { redeemable: true, reason: "redeemable", message: "" };
};

const hashRequestValue = (value) => {
  const normalized = normalizeString(value);
  if (!normalized) return null;
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 32);
};

const getDefaultPrisma = async () => {
  const prismaModule = await import("~/lib/prisma");
  return prismaModule.default;
};

const getDefaultUserPointsBreakdown = async () => {
  const pointsModule = await import("~/server/services/points/userPoints");
  return pointsModule.getUserPointsBreakdown;
};

export const buildRedemptionGrantPlan = ({ campaign, now = new Date() }) => {
  const points = Number(campaign?.points || 0);
  const durationMinutes = Number(campaign?.pointsExpiresInMinutes || 0);
  const currentTime = toDateOrNull(now) || new Date();
  const isTemporary = durationMinutes > 0;
  const expiresAt = isTemporary
    ? new Date(currentTime.getTime() + durationMinutes * 60 * 1000)
    : null;

  return {
    points,
    expiresAt,
    isTemporary,
    description: `兑换码奖励：${campaign?.name || "兑换活动"}`,
  };
};

export const redeemCodeForUser = async ({
  userId,
  code,
  ip,
  userAgent,
  now = new Date(),
  client,
  getUserPointsBreakdown,
}) => {
  const codeHash = buildRedemptionCodeHash(code);
  const prismaClient = client || (await getDefaultPrisma());
  const resolvePointsBreakdown =
    getUserPointsBreakdown || (await getDefaultUserPointsBreakdown());

  return prismaClient.$transaction(async (tx) => {
    const redemptionCode = await tx.redemptionCode.findUnique({
      where: { codeHash },
      include: { campaign: true },
    });

    const userCodeRedeemed = redemptionCode
      ? await tx.redemptionCodeRedemption.findFirst({
          where: { userId, codeId: redemptionCode.id },
          select: { id: true },
        })
      : null;

    const userCampaignRedemptionCount = redemptionCode
      ? await tx.redemptionCodeRedemption.count({
          where: { userId, campaignId: redemptionCode.campaignId },
        })
      : 0;

    const decision = resolveRedemptionEligibility({
      code: redemptionCode,
      userCampaignRedemptionCount,
      userCodeRedeemed: Boolean(userCodeRedeemed),
      now,
    });

    if (!decision.redeemable) {
      throw createServiceError({
        statusCode: decision.reason === "already_redeemed" ? 409 : 400,
        statusMessage: decision.message,
      });
    }

    const updateResult = await tx.redemptionCode.updateMany({
      where: {
        id: redemptionCode.id,
        enabled: true,
        OR: [
          { maxRedemptions: null },
          { usedCount: { lt: redemptionCode.maxRedemptions } },
        ],
      },
      data: {
        usedCount: { increment: 1 },
      },
    });

    if (updateResult.count !== 1) {
      throw createServiceError({
        statusCode: 409,
        statusMessage: "该活动已达到兑换上限",
      });
    }

    const grant = buildRedemptionGrantPlan({
      campaign: redemptionCode.campaign,
      now,
    });

    let permanentPoints = null;
    if (!grant.isTemporary) {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { points: { increment: grant.points } },
        select: { points: true },
      });
      permanentPoints = updatedUser.points;
    } else {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { points: true },
      });
      permanentPoints = Number(user?.points || 0);
    }

    const pointsHistory = await tx.pointsHistory.create({
      data: {
        userId,
        points: grant.points,
        type: POINT_TYPES.redemption,
        description: grant.description,
        relatedId: redemptionCode.campaignId,
        expiresAt: grant.expiresAt,
      },
    });

    const redemption = await tx.redemptionCodeRedemption.create({
      data: {
        userId,
        campaignId: redemptionCode.campaignId,
        codeId: redemptionCode.id,
        points: grant.points,
        expiresAt: grant.expiresAt,
        pointsHistoryId: pointsHistory.id,
        ipHash: hashRequestValue(ip),
        userAgentHash: hashRequestValue(userAgent),
      },
    });

    const pointsBreakdown = await resolvePointsBreakdown(userId, {
      client: tx,
      permanentPoints,
      now,
    });

    return {
      granted: true,
      points: grant.points,
      isTemporary: grant.isTemporary,
      expiresAt: grant.expiresAt,
      redemption,
      campaign: redemptionCode.campaign,
      totalPoints: pointsBreakdown.effectivePoints,
      permanentPoints: pointsBreakdown.permanentPoints,
      temporaryPoints: pointsBreakdown.temporaryPoints,
      effectivePoints: pointsBreakdown.effectivePoints,
      nextExpiringAt: pointsBreakdown.nextExpiringAt,
      pointsBreakdown,
    };
  });
};

export const createRedemptionCodesForCampaign = async ({
  campaignId,
  input = {},
  client,
}) => {
  const prismaClient = client || (await getDefaultPrisma());
  const options = normalizeGeneratedCodeOptions(input);
  const createdCodes = [];

  for (let index = 0; index < options.quantity; index += 1) {
    let plaintextCode = "";
    let codeHash = "";

    for (let attempt = 0; attempt < 5; attempt += 1) {
      plaintextCode = generateRedemptionCode({ prefix: options.prefix });
      codeHash = buildRedemptionCodeHash(plaintextCode);
      const existing = await prismaClient.redemptionCode.findUnique({
        where: { codeHash },
        select: { id: true },
      });
      if (!existing) break;
    }

    const mask = getRedemptionCodeMask(plaintextCode);
    const record = await prismaClient.redemptionCode.create({
      data: {
        campaignId,
        codeHash,
        codePrefix: mask.codePrefix,
        codeSuffix: mask.codeSuffix,
        batchName: options.batchName,
        maxRedemptions: options.maxRedemptions,
        enabled: options.enabled,
      },
    });

    createdCodes.push({
      id: record.id,
      code: plaintextCode,
      maskedCode: mask.maskedCode,
      batchName: record.batchName,
      maxRedemptions: record.maxRedemptions,
      enabled: record.enabled,
    });
  }

  return createdCodes;
};

export const toAdminCampaignPayload = (campaign) => ({
  id: campaign.id,
  name: campaign.name,
  description: campaign.description || "",
  rewardType: campaign.rewardType,
  points: campaign.points,
  pointsExpiresInMinutes: campaign.pointsExpiresInMinutes,
  enabled: campaign.enabled,
  startsAt: campaign.startsAt,
  endsAt: campaign.endsAt,
  maxRedemptionsPerUser: campaign.maxRedemptionsPerUser,
  codeCount: campaign._count?.codes || 0,
  redemptionCount: campaign._count?.redemptions || 0,
  createdAt: campaign.createdAt,
  updatedAt: campaign.updatedAt,
});
