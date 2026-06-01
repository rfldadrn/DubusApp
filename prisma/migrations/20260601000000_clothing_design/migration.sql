-- CreateTable: clothing_designs
CREATE TABLE "clothing_designs" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(255),
    "category" VARCHAR(100),
    "genderTarget" "GenderTarget" NOT NULL DEFAULT 'Unisex',
    "svgContent" TEXT NOT NULL,
    "isBuiltin" BOOLEAN NOT NULL DEFAULT false,
    "itemId" INTEGER,
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clothing_designs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "clothing_designs_code_key" ON "clothing_designs"("code");
CREATE INDEX "clothing_designs_rowStatus_itemId_idx" ON "clothing_designs"("rowStatus", "itemId");

-- AlterTable: items add defaultDesignId
ALTER TABLE "items" ADD COLUMN "defaultDesignId" INTEGER;

-- AlterTable: transaction_items add designId
ALTER TABLE "transaction_items" ADD COLUMN "designId" INTEGER;

-- AddForeignKey
ALTER TABLE "clothing_designs"
    ADD CONSTRAINT "clothing_designs_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "items"
    ADD CONSTRAINT "items_defaultDesignId_fkey"
    FOREIGN KEY ("defaultDesignId") REFERENCES "clothing_designs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "transaction_items"
    ADD CONSTRAINT "transaction_items_designId_fkey"
    FOREIGN KEY ("designId") REFERENCES "clothing_designs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
