-- AlterTable: move catalog image storage out of clothing_designs.
ALTER TABLE "clothing_designs"
DROP COLUMN IF EXISTS "imageBucket",
DROP COLUMN IF EXISTS "imagePath";

-- CreateTable
CREATE TABLE "company_catalogs" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(500),
    "price" DECIMAL(18,2),
    "imageBucket" "StorageBucket" NOT NULL DEFAULT 'company_catalog',
    "imagePath" VARCHAR(500),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_catalogs_rowStatus_sortOrder_idx" ON "company_catalogs"("rowStatus", "sortOrder");