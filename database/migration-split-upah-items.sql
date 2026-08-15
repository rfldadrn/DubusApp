-- Migration: pisahkan upah potong dan upah jahit pada tabel items
-- Target DB: PostgreSQL (sesuai datasource Prisma)

BEGIN;

ALTER TABLE "items"
  ADD COLUMN IF NOT EXISTS "cutterPrice" NUMERIC(10,2);

-- Dummy awal: samakan upah potong dengan upah jahit existing
UPDATE "items"
SET "cutterPrice" = "employeePrice"
WHERE "cutterPrice" IS NULL;

-- Pastikan selalu terisi setelah backfill
ALTER TABLE "items"
  ALTER COLUMN "cutterPrice" SET NOT NULL;

COMMIT;
