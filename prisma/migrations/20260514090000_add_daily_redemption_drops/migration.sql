-- CreateTable
CREATE TABLE "DailyRedemptionDrop" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT '每日福利',
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "releaseTime" TEXT NOT NULL DEFAULT '12:00',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "dailyQuota" INTEGER NOT NULL DEFAULT 100,
    "points" INTEGER NOT NULL DEFAULT 100,
    "pointsExpiresInMinutes" INTEGER,
    "maxClaimsPerUserPerDay" INTEGER NOT NULL DEFAULT 1,
    "requireEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "minimumAccountAgeDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyRedemptionDrop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyRedemptionDropClaim" (
    "id" SERIAL NOT NULL,
    "dropId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "claimDate" DATE NOT NULL,
    "claimNo" INTEGER NOT NULL DEFAULT 1,
    "points" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "pointsHistoryId" INTEGER,
    "ipHash" TEXT,
    "userAgentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyRedemptionDropClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyRedemptionDrop_enabled_idx" ON "DailyRedemptionDrop"("enabled");

-- CreateIndex
CREATE INDEX "DailyRedemptionDrop_releaseTime_idx" ON "DailyRedemptionDrop"("releaseTime");

-- CreateIndex
CREATE INDEX "DailyRedemptionDrop_createdAt_idx" ON "DailyRedemptionDrop"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyRedemptionDropClaim_pointsHistoryId_key" ON "DailyRedemptionDropClaim"("pointsHistoryId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyRedemptionDropClaim_dropId_userId_claimDate_claimNo_key" ON "DailyRedemptionDropClaim"("dropId", "userId", "claimDate", "claimNo");

-- CreateIndex
CREATE INDEX "DailyRedemptionDropClaim_dropId_claimDate_idx" ON "DailyRedemptionDropClaim"("dropId", "claimDate");

-- CreateIndex
CREATE INDEX "DailyRedemptionDropClaim_userId_idx" ON "DailyRedemptionDropClaim"("userId");

-- CreateIndex
CREATE INDEX "DailyRedemptionDropClaim_claimDate_idx" ON "DailyRedemptionDropClaim"("claimDate");

-- CreateIndex
CREATE INDEX "DailyRedemptionDropClaim_createdAt_idx" ON "DailyRedemptionDropClaim"("createdAt");

-- AddForeignKey
ALTER TABLE "DailyRedemptionDropClaim" ADD CONSTRAINT "DailyRedemptionDropClaim_dropId_fkey" FOREIGN KEY ("dropId") REFERENCES "DailyRedemptionDrop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRedemptionDropClaim" ADD CONSTRAINT "DailyRedemptionDropClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRedemptionDropClaim" ADD CONSTRAINT "DailyRedemptionDropClaim_pointsHistoryId_fkey" FOREIGN KEY ("pointsHistoryId") REFERENCES "PointsHistory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
