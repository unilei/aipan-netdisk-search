-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "description" TEXT,
ADD COLUMN     "group" TEXT,
ADD COLUMN     "isEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "system_settings_group_idx" ON "system_settings"("group");
