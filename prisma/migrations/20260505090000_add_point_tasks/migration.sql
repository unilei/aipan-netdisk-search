-- Add configurable point tasks and user claim records.
CREATE TABLE "PointTask" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "claimLimit" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PointTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PointTaskCompletion" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "taskId" INTEGER NOT NULL,
    "claimNo" INTEGER NOT NULL DEFAULT 1,
    "points" INTEGER NOT NULL,
    "pointsHistoryId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTaskCompletion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PointTask_key_key" ON "PointTask"("key");
CREATE INDEX "PointTask_enabled_idx" ON "PointTask"("enabled");
CREATE INDEX "PointTask_sortOrder_idx" ON "PointTask"("sortOrder");
CREATE INDEX "PointTask_createdAt_idx" ON "PointTask"("createdAt");

CREATE UNIQUE INDEX "PointTaskCompletion_pointsHistoryId_key" ON "PointTaskCompletion"("pointsHistoryId");
CREATE UNIQUE INDEX "PointTaskCompletion_userId_taskId_claimNo_key" ON "PointTaskCompletion"("userId", "taskId", "claimNo");
CREATE INDEX "PointTaskCompletion_userId_idx" ON "PointTaskCompletion"("userId");
CREATE INDEX "PointTaskCompletion_taskId_idx" ON "PointTaskCompletion"("taskId");
CREATE INDEX "PointTaskCompletion_createdAt_idx" ON "PointTaskCompletion"("createdAt");

ALTER TABLE "PointTaskCompletion" ADD CONSTRAINT "PointTaskCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PointTaskCompletion" ADD CONSTRAINT "PointTaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "PointTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PointTaskCompletion" ADD CONSTRAINT "PointTaskCompletion_pointsHistoryId_fkey" FOREIGN KEY ("pointsHistoryId") REFERENCES "PointsHistory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "PointTask" ("key", "title", "description", "url", "points", "enabled", "sortOrder", "claimLimit", "updatedAt")
VALUES (
    'netease-popcorn-blog-2026-05',
    '阅读网易爆米花推广文章',
    '阅读文章后领取一次性推广积分奖励。',
    'https://www.aipan.me/blog/%E7%BD%91%E6%98%93%E7%88%86%E7%B1%B3%E8%8A%B1%E6%8A%8A%E6%B5%B7%E9%87%8F%E7%BD%91%E7%9B%98%E8%B5%84%E6%BA%90%E7%A7%92%E5%8F%98%E4%BD%A0%E7%9A%84%E7%A7%81%E4%BA%BA4k%E5%BD%B1%E9%99%A2-33-1777944701838',
    100,
    true,
    10,
    1,
    CURRENT_TIMESTAMP
);
