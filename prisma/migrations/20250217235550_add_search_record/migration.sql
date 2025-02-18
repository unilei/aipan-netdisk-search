-- CreateTable
CREATE TABLE "search_records" (
    "id" SERIAL NOT NULL,
    "keyword" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastSearchAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_records_keyword_idx" ON "search_records"("keyword");

-- CreateIndex
CREATE INDEX "search_records_count_idx" ON "search_records"("count");
