-- Add transfer-content fingerprint so reward uniqueness follows the transferred
-- file instance instead of the generated share link.
ALTER TABLE "TransferPointGrant" ADD COLUMN "transferFingerprint" TEXT;

UPDATE "TransferPointGrant"
SET "transferFingerprint" = 'legacy-share:' || "shareId"
WHERE "transferFingerprint" IS NULL;

ALTER TABLE "TransferPointGrant" ALTER COLUMN "transferFingerprint" SET NOT NULL;

CREATE INDEX "TransferPointGrant_transferFingerprint_idx" ON "TransferPointGrant"("transferFingerprint");

CREATE UNIQUE INDEX "TransferPointGrant_userId_transferFingerprint_key" ON "TransferPointGrant"("userId", "transferFingerprint");
