-- Add configurable redemption-code campaigns, generated code inventory,
-- and per-user redemption audit records.
CREATE TABLE "RedemptionCodeCampaign" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rewardType" TEXT NOT NULL DEFAULT 'points',
    "points" INTEGER NOT NULL,
    "pointsExpiresInMinutes" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "maxRedemptionsPerUser" INTEGER NOT NULL DEFAULT 1,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RedemptionCodeCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RedemptionCode" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "codeHash" TEXT NOT NULL,
    "codePrefix" TEXT,
    "codeSuffix" TEXT,
    "batchName" TEXT,
    "maxRedemptions" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RedemptionCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RedemptionCodeRedemption" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "codeId" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "pointsHistoryId" INTEGER,
    "ipHash" TEXT,
    "userAgentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RedemptionCodeRedemption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RedemptionCodeCampaign_enabled_idx" ON "RedemptionCodeCampaign"("enabled");
CREATE INDEX "RedemptionCodeCampaign_startsAt_idx" ON "RedemptionCodeCampaign"("startsAt");
CREATE INDEX "RedemptionCodeCampaign_endsAt_idx" ON "RedemptionCodeCampaign"("endsAt");
CREATE INDEX "RedemptionCodeCampaign_createdAt_idx" ON "RedemptionCodeCampaign"("createdAt");

CREATE UNIQUE INDEX "RedemptionCode_codeHash_key" ON "RedemptionCode"("codeHash");
CREATE INDEX "RedemptionCode_campaignId_idx" ON "RedemptionCode"("campaignId");
CREATE INDEX "RedemptionCode_enabled_idx" ON "RedemptionCode"("enabled");
CREATE INDEX "RedemptionCode_batchName_idx" ON "RedemptionCode"("batchName");
CREATE INDEX "RedemptionCode_createdAt_idx" ON "RedemptionCode"("createdAt");

CREATE UNIQUE INDEX "RedemptionCodeRedemption_pointsHistoryId_key" ON "RedemptionCodeRedemption"("pointsHistoryId");
CREATE UNIQUE INDEX "RedemptionCodeRedemption_userId_codeId_key" ON "RedemptionCodeRedemption"("userId", "codeId");
CREATE INDEX "RedemptionCodeRedemption_userId_idx" ON "RedemptionCodeRedemption"("userId");
CREATE INDEX "RedemptionCodeRedemption_campaignId_idx" ON "RedemptionCodeRedemption"("campaignId");
CREATE INDEX "RedemptionCodeRedemption_codeId_idx" ON "RedemptionCodeRedemption"("codeId");
CREATE INDEX "RedemptionCodeRedemption_createdAt_idx" ON "RedemptionCodeRedemption"("createdAt");

ALTER TABLE "RedemptionCodeCampaign" ADD CONSTRAINT "RedemptionCodeCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RedemptionCode" ADD CONSTRAINT "RedemptionCode_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "RedemptionCodeCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RedemptionCodeRedemption" ADD CONSTRAINT "RedemptionCodeRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RedemptionCodeRedemption" ADD CONSTRAINT "RedemptionCodeRedemption_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "RedemptionCodeCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RedemptionCodeRedemption" ADD CONSTRAINT "RedemptionCodeRedemption_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "RedemptionCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RedemptionCodeRedemption" ADD CONSTRAINT "RedemptionCodeRedemption_pointsHistoryId_fkey" FOREIGN KEY ("pointsHistoryId") REFERENCES "PointsHistory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
