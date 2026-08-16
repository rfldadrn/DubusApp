-- AlterEnum
ALTER TYPE "AttachmentEntityType" ADD VALUE IF NOT EXISTS 'AGENCY';

-- AlterTable
ALTER TABLE "attachments" ADD COLUMN IF NOT EXISTS "description" VARCHAR(500);

-- Seed menus for storage-backed company data.
INSERT INTO "menus" ("id", "menuName", "menuUrl", "menuIcon", "menuSlug", "parentId", "isMenu", "orderNo", "rowStatus", "createdAt", "updatedAt")
VALUES
  (16, 'Company Catalog', '/dashboard/master/company-catalog', 'BookOpen', 'company-catalog', 6, true, 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (17, 'Dokumen Perusahaan', '/dashboard/master/company-documents', 'FileText', 'company-documents', 6, true, 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET
  "menuName" = EXCLUDED."menuName",
  "menuUrl" = EXCLUDED."menuUrl",
  "menuIcon" = EXCLUDED."menuIcon",
  "menuSlug" = EXCLUDED."menuSlug",
  "parentId" = EXCLUDED."parentId",
  "isMenu" = EXCLUDED."isMenu",
  "orderNo" = EXCLUDED."orderNo",
  "rowStatus" = EXCLUDED."rowStatus",
  "updatedAt" = CURRENT_TIMESTAMP;

SELECT setval(
  pg_get_serial_sequence('"role_menu_mappings"', 'id'),
  COALESCE((SELECT MAX("id") FROM "role_menu_mappings"), 0) + 1,
  false
);

INSERT INTO "role_menu_mappings" ("roleId", "menuId", "createdAt")
SELECT allowed.role_id, allowed.menu_id, CURRENT_TIMESTAMP
FROM (VALUES (1, 16), (1, 17), (2, 16), (2, 17)) AS allowed(role_id, menu_id)
JOIN "roles" role_row ON role_row."id" = allowed.role_id
JOIN "menus" menu_row ON menu_row."id" = allowed.menu_id
WHERE NOT EXISTS (
  SELECT 1 FROM "role_menu_mappings" existing
  WHERE existing."roleId" = allowed.role_id AND existing."menuId" = allowed.menu_id
);