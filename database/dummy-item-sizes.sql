-- ============================================================
-- DUMMY DATA: Item Sizes & Customer Sizes
-- Item: Kemeja (id: 1) dan Celana (id: 2)
-- Customer: id 2
-- ============================================================

-- 1. INSERT item_sizes untuk Kemeja (id: 1)
INSERT INTO public.item_sizes
(id, "itemId", "name", "isMandatory", "isStandard", "sortOrder", "rowStatus")
VALUES
  (nextval('item_sizes_id_seq'::regclass), 1, 'Lingkar Leher', true, true, 1, true),
  (nextval('item_sizes_id_seq'::regclass), 1, 'Panjang Baju', true, true, 2, true),
  (nextval('item_sizes_id_seq'::regclass), 1, 'Lebar Bahu', true, true, 3, true),
  (nextval('item_sizes_id_seq'::regclass), 1, 'Lingkar Dada', true, true, 4, true),
  (nextval('item_sizes_id_seq'::regclass), 1, 'Lingkar Perut', true, true, 5, true),
  (nextval('item_sizes_id_seq'::regclass), 1, 'Panjang Lengan', true, true, 6, true),
  (nextval('item_sizes_id_seq'::regclass), 1, 'Lingkar Lengan', false, true, 7, true);

-- 2. INSERT item_sizes untuk Celana (id: 2)
INSERT INTO public.item_sizes
(id, "itemId", "name", "isMandatory", "isStandard", "sortOrder", "rowStatus")
VALUES
  (nextval('item_sizes_id_seq'::regclass), 2, 'Lingkar Pinggang', true, true, 1, true),
  (nextval('item_sizes_id_seq'::regclass), 2, 'Lingkar Panggul', true, true, 2, true),
  (nextval('item_sizes_id_seq'::regclass), 2, 'Panjang Celana', true, true, 3, true),
  (nextval('item_sizes_id_seq'::regclass), 2, 'Lingkar Paha', false, true, 4, true),
  (nextval('item_sizes_id_seq'::regclass), 2, 'Lingkar Lutut', false, true, 5, true),
  (nextval('item_sizes_id_seq'::regclass), 2, 'Lingkar Kaki', false, true, 6, true),
  (nextval('item_sizes_id_seq'::regclass), 2, 'Panjang Kaki Dalam', false, true, 7, true);

-- 3. INSERT header_size_customers untuk customer id 2 (kemeja & celana)
-- CATATAN: Ganti dengan customer id yang sesuai jika berbeda
INSERT INTO public.header_size_customers
(id, "customerId", "itemId", note, "createdBy", "rowStatus", "createdAt", "updatedAt")
VALUES
  (nextval('header_size_customers_id_seq'::regclass), 2, 1, 'Ukuran kemeja standar Mei 2026', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (nextval('header_size_customers_id_seq'::regclass), 2, 2, 'Ukuran celana standar Mei 2026', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. INSERT item_size_customers - Detail ukuran untuk setiap field
-- CATATAN: Sesuaikan headerSizeCustomerId dengan hasil insert di atas

-- Untuk mendapatkan ID header yang baru diinsert, gunakan query ini:
-- SELECT id, "customerId", "itemId", note FROM header_size_customers 
-- WHERE "customerId" = 2 AND "itemId" IN (1, 2) ORDER BY "createdAt" DESC;

-- Contoh: Jika header kemeja id = 100, celana id = 101
-- Ganti nilai 100 dan 101 dengan ID yang sesuai dari hasil insert header di atas

-- Detail ukuran KEMEJA (customerId: 2, itemId: 1)
-- Ganti 100 dengan header_size_customers.id untuk kemeja
WITH kemeja_header AS (
  SELECT id FROM header_size_customers 
  WHERE "customerId" = 2 AND "itemId" = 1 
  ORDER BY "createdAt" DESC LIMIT 1
)
INSERT INTO public.item_size_customers
("itemSizeId", "headerSizeCustomerId", size, "rowStatus")
SELECT 
  item_sizes.id,
  kemeja_header.id,
  CASE item_sizes.name
    WHEN 'Lingkar Leher' THEN 38.0
    WHEN 'Panjang Baju' THEN 72.0
    WHEN 'Lebar Bahu' THEN 42.0
    WHEN 'Lingkar Dada' THEN 96.0
    WHEN 'Lingkar Perut' THEN 92.0
    WHEN 'Panjang Lengan' THEN 58.0
    WHEN 'Lingkar Lengan' THEN 34.0
    ELSE 40.0
  END,
  true
FROM item_sizes
CROSS JOIN kemeja_header
WHERE item_sizes."itemId" = 1
  AND item_sizes."rowStatus" = true;

-- Detail ukuran CELANA (customerId: 2, itemId: 2)
-- Ganti 101 dengan header_size_customers.id untuk celana
WITH celana_header AS (
  SELECT id FROM header_size_customers 
  WHERE "customerId" = 2 AND "itemId" = 2 
  ORDER BY "createdAt" DESC LIMIT 1
)
INSERT INTO public.item_size_customers
("itemSizeId", "headerSizeCustomerId", size, "rowStatus")
SELECT 
  item_sizes.id,
  celana_header.id,
  CASE item_sizes.name
    WHEN 'Lingkar Pinggang' THEN 82.0
    WHEN 'Lingkar Panggul' THEN 98.0
    WHEN 'Panjang Celana' THEN 102.0
    WHEN 'Lingkar Paha' THEN 56.0
    WHEN 'Lingkar Lutut' THEN 42.0
    WHEN 'Lingkar Kaki' THEN 38.0
    WHEN 'Panjang Kaki Dalam' THEN 78.0
    ELSE 50.0
  END,
  true
FROM item_sizes
CROSS JOIN celana_header
WHERE item_sizes."itemId" = 2
  AND item_sizes."rowStatus" = true;

-- ============================================================
-- VERIFIKASI DATA
-- ============================================================

-- Cek item_sizes yang baru diinsert
SELECT id, "itemId", name, "isMandatory", "sortOrder" 
FROM item_sizes 
WHERE "itemId" IN (1, 2) 
ORDER BY "itemId", "sortOrder";

-- Cek header_size_customers untuk customer 2
SELECT id, "customerId", "itemId", note, "createdAt" 
FROM header_size_customers 
WHERE "customerId" = 2 
ORDER BY "createdAt" DESC;

-- Cek detail ukuran per customer
SELECT 
  hsc.id AS header_id,
  hsc."customerId",
  i.name AS item_name,
  its.name AS size_field,
  isc.size,
  hsc.note
FROM header_size_customers hsc
JOIN item_size_customers isc ON isc."headerSizeCustomerId" = hsc.id
JOIN item_sizes its ON its.id = isc."itemSizeId"
JOIN items i ON i.id = hsc."itemId"
WHERE hsc."customerId" = 2
ORDER BY hsc."itemId", its."sortOrder";
