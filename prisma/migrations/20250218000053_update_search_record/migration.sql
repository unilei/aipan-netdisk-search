/*
  Warnings:

  - A unique constraint covering the columns `[keyword]` on the table `search_records` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "search_records_keyword_idx";

-- CreateIndex
CREATE UNIQUE INDEX "search_records_keyword_key" ON "search_records"("keyword");
