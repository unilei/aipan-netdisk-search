-- Enable pg_trgm extension for trigram-based indexing (improves LIKE '%keyword%' queries)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram index on Resource.name for faster contains/insensitive searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Resource_name_trgm_idx" ON "Resource" USING GIN ("name" gin_trgm_ops);
