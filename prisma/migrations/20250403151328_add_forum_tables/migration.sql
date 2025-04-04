/*
  Warnings:

  - You are about to drop the column `isEnabled` on the `ForumCategory` table. All the data in the column will be lost.
  - You are about to drop the column `lastReplyAt` on the `ForumTopic` table. All the data in the column will be lost.
  - You are about to drop the column `lastReplyId` on the `ForumTopic` table. All the data in the column will be lost.
  - You are about to drop the `ForumLike` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ForumReply` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `description` on table `ForumCategory` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ForumLike" DROP CONSTRAINT "ForumLike_replyId_fkey";

-- DropForeignKey
ALTER TABLE "ForumLike" DROP CONSTRAINT "ForumLike_topicId_fkey";

-- DropForeignKey
ALTER TABLE "ForumLike" DROP CONSTRAINT "ForumLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "ForumReply" DROP CONSTRAINT "ForumReply_authorId_fkey";

-- DropForeignKey
ALTER TABLE "ForumReply" DROP CONSTRAINT "ForumReply_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ForumReply" DROP CONSTRAINT "ForumReply_topicId_fkey";

-- DropIndex
DROP INDEX "ForumTopic_isSticky_createdAt_idx";

-- AlterTable
ALTER TABLE "ForumCategory" DROP COLUMN "isEnabled",
ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "ForumTopic" DROP COLUMN "lastReplyAt",
DROP COLUMN "lastReplyId",
ADD COLUMN     "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "ForumLike";

-- DropTable
DROP TABLE "ForumReply";

-- CreateTable
CREATE TABLE "ForumPost" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "topicId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,

    CONSTRAINT "ForumPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForumPost_topicId_idx" ON "ForumPost"("topicId");

-- CreateIndex
CREATE INDEX "ForumPost_authorId_idx" ON "ForumPost"("authorId");

-- CreateIndex
CREATE INDEX "ForumTopic_lastActivityAt_idx" ON "ForumTopic"("lastActivityAt");

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ForumTopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
