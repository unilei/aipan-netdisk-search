-- AlterTable
ALTER TABLE "ResourceType" ADD COLUMN     "isEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isUserType" BOOLEAN NOT NULL DEFAULT false;
