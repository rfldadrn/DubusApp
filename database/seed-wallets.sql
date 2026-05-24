-- ============================================================
-- SEED DATA: Wallets/Kas untuk tracking pembayaran
-- ============================================================

-- Insert dummy wallets
INSERT INTO public.wallets 
(id, name, "walletType", "bankName", "accountNumber", "openingBalance", "openingDate", "isActive", notes, "createdAt", "updatedAt")
VALUES
  (1, 'Kas Tunai', 'Cash', NULL, NULL, 0, '2026-01-01', true, 'Kas tunai untuk pembayaran langsung', NOW(), NOW()),
  (2, 'QRIS Toko', 'QRIS', NULL, NULL, 0, '2026-01-01', true, 'Pembayaran via QRIS', NOW(), NOW()),
  (3, 'Bank BNI', 'BankAccount', 'Bank BNI', '1234567890', 0, '2026-01-01', true, 'Rekening bank untuk transfer', NOW(), NOW()),
  (4, 'Bank BCA', 'BankAccount', 'Bank BCA', '9876543210', 0, '2026-01-01', true, 'Rekening bank untuk transfer', NOW(), NOW()),
  (5, 'Bank Mandiri', 'BankAccount', 'Bank Mandiri', '5555666677', 0, '2026-01-01', true, 'Rekening bank untuk transfer', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "walletType" = EXCLUDED."walletType",
  "bankName" = EXCLUDED."bankName",
  "accountNumber" = EXCLUDED."accountNumber",
  "isActive" = EXCLUDED."isActive",
  notes = EXCLUDED.notes,
  "updatedAt" = NOW();

-- Verify
SELECT id, name, "walletType", "bankName", "accountNumber", "isActive" 
FROM public.wallets 
ORDER BY id;

COMMENT ON TABLE public.wallets IS 'Dompet/Kas untuk tracking pembayaran. Untuk TUNAI pilih "Kas Tunai", untuk TRANSFER pilih Bank, untuk QRIS pilih "QRIS Toko"';
