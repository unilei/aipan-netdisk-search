-- CreateTable
CREATE TABLE "daily_search_stats" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "keyword" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_search_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_search_stats_date_idx" ON "daily_search_stats"("date");

-- CreateIndex
CREATE INDEX "daily_search_stats_keyword_idx" ON "daily_search_stats"("keyword");

-- CreateIndex
CREATE UNIQUE INDEX "daily_search_stats_date_keyword_key" ON "daily_search_stats"("date", "keyword");
