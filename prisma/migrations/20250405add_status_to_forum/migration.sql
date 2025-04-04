-- Add status field to ForumTopic
ALTER TABLE "ForumTopic" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';

-- Add status field to ForumPost
ALTER TABLE "ForumPost" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';

-- Create index for status to improve query performance
CREATE INDEX "ForumTopic_status_idx" ON "ForumTopic"("status");
CREATE INDEX "ForumPost_status_idx" ON "ForumPost"("status"); 