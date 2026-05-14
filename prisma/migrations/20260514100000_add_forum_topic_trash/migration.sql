-- Add reversible trash metadata for forum topics.
ALTER TABLE "ForumTopic"
  ADD COLUMN "statusBeforeTrash" TEXT,
  ADD COLUMN "trashedAt" TIMESTAMP(3),
  ADD COLUMN "trashedById" INTEGER,
  ADD COLUMN "trashReason" TEXT;

CREATE INDEX "ForumTopic_status_trashedAt_idx" ON "ForumTopic"("status", "trashedAt");
CREATE INDEX "ForumTopic_trashedById_idx" ON "ForumTopic"("trashedById");
