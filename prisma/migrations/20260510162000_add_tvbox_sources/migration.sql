CREATE TABLE "tvbox_sources" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "link" TEXT NOT NULL,
  "source_type" TEXT NOT NULL DEFAULT 'other',
  "source_type_label" TEXT NOT NULL,
  "upstream" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "tvbox_sources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tvbox_sources_link_key" ON "tvbox_sources"("link");
CREATE INDEX "tvbox_sources_source_type_idx" ON "tvbox_sources"("source_type");
CREATE INDEX "tvbox_sources_active_idx" ON "tvbox_sources"("active");
CREATE INDEX "tvbox_sources_last_seen_at_idx" ON "tvbox_sources"("last_seen_at");
CREATE INDEX "tvbox_sources_name_idx" ON "tvbox_sources"("name");
