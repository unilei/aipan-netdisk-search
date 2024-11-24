/*
  Warnings:

  - You are about to drop the `_CategoryToResource` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CategoryToResource" DROP CONSTRAINT "_CategoryToResource_A_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryToResource" DROP CONSTRAINT "_CategoryToResource_B_fkey";

-- DropTable
DROP TABLE "_CategoryToResource";

-- CreateTable
CREATE TABLE "_ResourceToCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ResourceToCategory_AB_unique" ON "_ResourceToCategory"("A", "B");

-- CreateIndex
CREATE INDEX "_ResourceToCategory_B_index" ON "_ResourceToCategory"("B");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE INDEX "Favorite_resourceId_idx" ON "Favorite"("resourceId");

-- CreateIndex
CREATE INDEX "Resource_createdAt_title_idx" ON "Resource"("createdAt" DESC, "title");

-- CreateIndex
CREATE INDEX "Resource_creatorId_idx" ON "Resource"("creatorId");

-- CreateIndex
CREATE INDEX "Resource_title_description_idx" ON "Resource"("title", "description");

-- CreateIndex
CREATE INDEX "ResourceLink_resourceId_idx" ON "ResourceLink"("resourceId");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- AddForeignKey
ALTER TABLE "_ResourceToCategory" ADD CONSTRAINT "_ResourceToCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResourceToCategory" ADD CONSTRAINT "_ResourceToCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
