-- CreateEnum
CREATE TYPE "StorageBucket" AS ENUM ('transactions', 'documents', 'company_catalog');

-- CreateEnum
CREATE TYPE "AttachmentEntityType" AS ENUM ('TRANSACTION', 'TRANSACTION_ITEM', 'AGENCY_PROJECT', 'DELIVERY', 'PRODUCTION', 'CUSTOMER', 'COMPANY');

-- AlterTable: clothing_designs add optional catalog image storage reference.
ALTER TABLE "clothing_designs"
ADD COLUMN "imageBucket" "StorageBucket",
ADD COLUMN "imagePath" VARCHAR(500);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "bucket" "StorageBucket" NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "entityType" "AttachmentEntityType" NOT NULL,
    "entityId" VARCHAR(50) NOT NULL,
    "uploadedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attachments_entityType_entityId_idx" ON "attachments"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "attachments_bucket_path_idx" ON "attachments"("bucket", "path");

-- CreateIndex
CREATE INDEX "attachments_createdAt_idx" ON "attachments"("createdAt");

-- AddForeignKey
ALTER TABLE "attachments"
ADD CONSTRAINT "attachments_uploadedBy_fkey"
FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;