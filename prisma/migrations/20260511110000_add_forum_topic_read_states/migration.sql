-- CreateTable
CREATE TABLE "ForumTopicReadState" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "topicId" INTEGER NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastUnreadPostId" INTEGER,
    "lastUnreadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumTopicReadState_pkey" PRIMARY KEY ("id")
);

-- Backfill historical participants as read so old forum activity does not become unread after deploy.
INSERT INTO "ForumTopicReadState" (
    "userId",
    "topicId",
    "lastReadAt",
    "unreadCount",
    "createdAt",
    "updatedAt"
)
SELECT DISTINCT
    participant."userId",
    participant."topicId",
    COALESCE(topic."lastActivityAt", topic."updatedAt", topic."createdAt") AS "lastReadAt",
    0 AS "unreadCount",
    CURRENT_TIMESTAMP AS "createdAt",
    CURRENT_TIMESTAMP AS "updatedAt"
FROM (
    SELECT "authorId" AS "userId", "id" AS "topicId"
    FROM "ForumTopic"
    UNION
    SELECT "authorId" AS "userId", "topicId"
    FROM "ForumPost"
    WHERE "status" = 'approved'
) participant
INNER JOIN "ForumTopic" topic ON topic."id" = participant."topicId"
WHERE participant."userId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ForumTopicReadState_userId_topicId_key" ON "ForumTopicReadState"("userId", "topicId");

-- CreateIndex
CREATE INDEX "ForumTopicReadState_userId_unreadCount_idx" ON "ForumTopicReadState"("userId", "unreadCount");

-- CreateIndex
CREATE INDEX "ForumTopicReadState_topicId_idx" ON "ForumTopicReadState"("topicId");

-- CreateIndex
CREATE INDEX "ForumTopicReadState_lastUnreadAt_idx" ON "ForumTopicReadState"("lastUnreadAt");

-- AddForeignKey
ALTER TABLE "ForumTopicReadState" ADD CONSTRAINT "ForumTopicReadState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumTopicReadState" ADD CONSTRAINT "ForumTopicReadState_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ForumTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumTopicReadState" ADD CONSTRAINT "ForumTopicReadState_lastUnreadPostId_fkey" FOREIGN KEY ("lastUnreadPostId") REFERENCES "ForumPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
