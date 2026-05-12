-- Add private-message metadata to chat rooms.
ALTER TABLE "ChatRoom" ADD COLUMN "privateKey" TEXT;
ALTER TABLE "ChatRoom" ADD COLUMN "lastMessageAt" TIMESTAMP(3);
ALTER TABLE "ChatRoom" ADD COLUMN "sourceForumTopicId" INTEGER;

-- Track read state per room member. Message-level isRead cannot model per-user unread state.
ALTER TABLE "ChatRoomUser" ADD COLUMN "lastReadAt" TIMESTAMP(3);

-- Backfill the last-message timestamp for inbox sorting.
UPDATE "ChatRoom" AS room
SET "lastMessageAt" = latest."lastMessageAt"
FROM (
  SELECT "roomId", MAX("createdAt") AS "lastMessageAt"
  FROM "ChatMessage"
  GROUP BY "roomId"
) AS latest
WHERE room."id" = latest."roomId";

-- Existing inboxes should not suddenly show all historical messages as unread.
UPDATE "ChatRoomUser" AS member
SET "lastReadAt" = COALESCE(room."lastMessageAt", room."updatedAt", member."joinedAt")
FROM "ChatRoom" AS room
WHERE member."roomId" = room."id";

-- Assign a stable pair key to existing two-member private rooms. If duplicates already exist
-- for the same pair, keep the newest room canonical and leave the older rooms nullable.
WITH private_pairs AS (
  SELECT
    room."id" AS "roomId",
    CONCAT(MIN(member."userId"), ':', MAX(member."userId")) AS "privateKey",
    ROW_NUMBER() OVER (
      PARTITION BY CONCAT(MIN(member."userId"), ':', MAX(member."userId"))
      ORDER BY room."updatedAt" DESC, room."id" DESC
    ) AS "rank"
  FROM "ChatRoom" AS room
  JOIN "ChatRoomUser" AS member ON member."roomId" = room."id"
  WHERE room."type" = 'private'
  GROUP BY room."id"
  HAVING COUNT(member."userId") = 2
)
UPDATE "ChatRoom" AS room
SET "privateKey" = private_pairs."privateKey"
FROM private_pairs
WHERE room."id" = private_pairs."roomId"
  AND private_pairs."rank" = 1;

CREATE UNIQUE INDEX "ChatRoom_privateKey_key" ON "ChatRoom"("privateKey");
CREATE INDEX "ChatRoom_lastMessageAt_idx" ON "ChatRoom"("lastMessageAt");
CREATE INDEX "ChatRoom_sourceForumTopicId_idx" ON "ChatRoom"("sourceForumTopicId");
