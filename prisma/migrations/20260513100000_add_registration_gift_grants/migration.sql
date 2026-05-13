-- CreateTable
CREATE TABLE "RegistrationGiftGrant" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'auto',
    "pointsHistoryId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationGiftGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationGiftGrant_userId_key" ON "RegistrationGiftGrant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationGiftGrant_pointsHistoryId_key" ON "RegistrationGiftGrant"("pointsHistoryId");

-- CreateIndex
CREATE INDEX "RegistrationGiftGrant_expiresAt_idx" ON "RegistrationGiftGrant"("expiresAt");

-- CreateIndex
CREATE INDEX "RegistrationGiftGrant_source_idx" ON "RegistrationGiftGrant"("source");

-- CreateIndex
CREATE INDEX "RegistrationGiftGrant_createdAt_idx" ON "RegistrationGiftGrant"("createdAt");

-- AddForeignKey
ALTER TABLE "RegistrationGiftGrant" ADD CONSTRAINT "RegistrationGiftGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationGiftGrant" ADD CONSTRAINT "RegistrationGiftGrant_pointsHistoryId_fkey" FOREIGN KEY ("pointsHistoryId") REFERENCES "PointsHistory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
