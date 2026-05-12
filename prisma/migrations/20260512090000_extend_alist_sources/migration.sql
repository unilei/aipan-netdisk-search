ALTER TABLE "Alist"
  ADD COLUMN "authMode" TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN "username" TEXT,
  ADD COLUMN "secretEncrypted" TEXT,
  ADD COLUMN "rootPath" TEXT NOT NULL DEFAULT '/',
  ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "healthStatus" TEXT,
  ADD COLUMN "healthMessage" TEXT,
  ADD COLUMN "lastCheckedAt" TIMESTAMP(3);
