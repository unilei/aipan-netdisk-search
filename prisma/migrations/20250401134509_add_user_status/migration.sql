-- AlterTable
ALTER TABLE "User" ADD COLUMN     "salt" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';
