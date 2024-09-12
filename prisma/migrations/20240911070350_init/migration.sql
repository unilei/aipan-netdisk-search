/*
  Warnings:

  - You are about to drop the `_PostToPostCategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PostToPostCategory" DROP CONSTRAINT "_PostToPostCategory_A_fkey";

-- DropForeignKey
ALTER TABLE "_PostToPostCategory" DROP CONSTRAINT "_PostToPostCategory_B_fkey";

-- DropTable
DROP TABLE "_PostToPostCategory";

-- CreateTable
CREATE TABLE "PostToCategory" (
    "postId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "PostToCategory_pkey" PRIMARY KEY ("postId","categoryId")
);

-- AddForeignKey
ALTER TABLE "PostToCategory" ADD CONSTRAINT "PostToCategory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostToCategory" ADD CONSTRAINT "PostToCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PostCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
