/*
  Warnings:

  - A unique constraint covering the columns `[deleteToken]` on the table `Comment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deleteToken` to the `Comment` table without a default value. This is not possible if the table is not empty.

*/
-- First, add the column as nullable
ALTER TABLE "Comment" ADD COLUMN "deleteToken" TEXT;

-- Generate UUID for existing comments
UPDATE "Comment" SET "deleteToken" = gen_random_uuid()::text;

-- Make the column required and unique
ALTER TABLE "Comment" ALTER COLUMN "deleteToken" SET NOT NULL;
CREATE UNIQUE INDEX "Comment_deleteToken_key" ON "Comment"("deleteToken");
