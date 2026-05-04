-- AlterTable
ALTER TABLE "PointsHistory" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TransferPointGrant" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "shareId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "pointsHistoryId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferPointGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PointsHistory_expiresAt_idx" ON "PointsHistory"("expiresAt");

-- CreateIndex
CREATE INDEX "TransferPointGrant_userId_idx" ON "TransferPointGrant"("userId");

-- CreateIndex
CREATE INDEX "TransferPointGrant_shareId_idx" ON "TransferPointGrant"("shareId");

-- CreateIndex
CREATE INDEX "TransferPointGrant_expiresAt_idx" ON "TransferPointGrant"("expiresAt");

-- CreateIndex
CREATE INDEX "TransferPointGrant_createdAt_idx" ON "TransferPointGrant"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TransferPointGrant_userId_shareId_key" ON "TransferPointGrant"("userId", "shareId");

-- CreateIndex
CREATE UNIQUE INDEX "TransferPointGrant_pointsHistoryId_key" ON "TransferPointGrant"("pointsHistoryId");

-- AddForeignKey
ALTER TABLE "TransferPointGrant" ADD CONSTRAINT "TransferPointGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferPointGrant" ADD CONSTRAINT "TransferPointGrant_pointsHistoryId_fkey" FOREIGN KEY ("pointsHistoryId") REFERENCES "PointsHistory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
