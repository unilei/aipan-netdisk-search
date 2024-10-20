-- DropForeignKey
ALTER TABLE "PostToCategory" DROP CONSTRAINT "PostToCategory_postId_fkey";

-- AddForeignKey
ALTER TABLE "PostToCategory" ADD CONSTRAINT "PostToCategory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
