-- Migration: Make walletId optional in payments table
-- Date: 2026-05-09
-- Purpose: Allow payments without wallet (dompet tidak wajib)

-- Step 1: Make walletId nullable
ALTER TABLE payments 
ALTER COLUMN "walletId" DROP NOT NULL;

-- Verify the change
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
  AND column_name = 'walletId';

-- Test: This should now work (set existing payments to NULL if needed)
-- UPDATE payments SET "walletId" = NULL WHERE "walletId" IS NOT NULL;

COMMENT ON COLUMN payments."walletId" IS 'Optional: Wallet/Akun tujuan pembayaran (NULL jika tidak perlu tracking wallet)';
