/*
  Warnings:

  - You are about to drop the column `authorId` on the `UserResource` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `UserResource` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `UserResource` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `UserResource` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `UserResource` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `UserResource` table. All the data in the column will be lost.
  - Added the required column `creatorId` to the `UserResource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `links` to the `UserResource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `UserResource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typeId` to the `UserResource` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserResource" DROP CONSTRAINT "UserResource_authorId_fkey";

-- AlterTable
ALTER TABLE "UserResource" DROP COLUMN "authorId",
DROP COLUMN "category",
DROP COLUMN "tags",
DROP COLUMN "title",
DROP COLUMN "type",
DROP COLUMN "url",
ADD COLUMN     "creatorId" INTEGER NOT NULL,
ADD COLUMN     "links" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "typeId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "UserResource" ADD CONSTRAINT "UserResource_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserResource" ADD CONSTRAINT "UserResource_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ResourceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
