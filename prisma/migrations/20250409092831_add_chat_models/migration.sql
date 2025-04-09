/*
  Warnings:

  - You are about to drop the column `senderId` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `isGroup` on the `ChatRoom` table. All the data in the column will be lost.
  - You are about to drop the `UserChatRoom` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `ChatRoom` table without a default value. This is not possible if the table is not empty.
  - Made the column `creatorId` on table `ChatRoom` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_senderId_fkey";

-- DropForeignKey
ALTER TABLE "UserChatRoom" DROP CONSTRAINT "UserChatRoom_roomId_fkey";

-- DropForeignKey
ALTER TABLE "UserChatRoom" DROP CONSTRAINT "UserChatRoom_userId_fkey";

-- DropIndex
DROP INDEX "ChatMessage_senderId_idx";

-- DropIndex
DROP INDEX "ChatRoom_isGroup_idx";

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "senderId",
DROP COLUMN "updatedAt",
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "replyToId" INTEGER,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'text',
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ChatRoom" DROP COLUMN "isGroup",
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "creatorId" SET NOT NULL;

-- DropTable
DROP TABLE "UserChatRoom";

-- CreateTable
CREATE TABLE "ChatRoomUser" (
    "userId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "ChatRoomUser_pkey" PRIMARY KEY ("userId","roomId")
);

-- CreateIndex
CREATE INDEX "ChatRoomUser_userId_idx" ON "ChatRoomUser"("userId");

-- CreateIndex
CREATE INDEX "ChatRoomUser_roomId_idx" ON "ChatRoomUser"("roomId");

-- CreateIndex
CREATE INDEX "ChatMessage_userId_idx" ON "ChatMessage"("userId");

-- CreateIndex
CREATE INDEX "ChatMessage_replyToId_idx" ON "ChatMessage"("replyToId");

-- CreateIndex
CREATE INDEX "ChatRoom_type_idx" ON "ChatRoom"("type");

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoomUser" ADD CONSTRAINT "ChatRoomUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoomUser" ADD CONSTRAINT "ChatRoomUser_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
