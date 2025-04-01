-- CreateTable
CREATE TABLE "UserVodConfig" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserVodConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserVodConfig_userId_idx" ON "UserVodConfig"("userId");

-- AddForeignKey
ALTER TABLE "UserVodConfig" ADD CONSTRAINT "UserVodConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
