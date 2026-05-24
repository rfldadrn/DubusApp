-- Supabase RLS template for Dubus App (core tables)
-- Run in Supabase SQL Editor (production)
-- IMPORTANT:
-- 1) This template is for Supabase Auth (authenticated users via JWT).
-- 2) Your Next.js app currently uses Prisma direct DB connection, so app-layer auth/role checks remain mandatory.
-- 3) Adjust role mapping in function public.is_admin() to match your JWT claims structure.

BEGIN;

-- Helper function to check admin role from JWT claims.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('SuperAdmin', 'Admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('SuperAdmin', 'Admin'),
    false
  );
$$;

-- ===== customers =====
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customers_select_authenticated ON public.customers;
CREATE POLICY customers_select_authenticated
ON public.customers
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS customers_insert_admin ON public.customers;
CREATE POLICY customers_insert_admin
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS customers_update_admin ON public.customers;
CREATE POLICY customers_update_admin
ON public.customers
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS customers_delete_admin ON public.customers;
CREATE POLICY customers_delete_admin
ON public.customers
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ===== transactions =====
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS transactions_select_authenticated ON public.transactions;
CREATE POLICY transactions_select_authenticated
ON public.transactions
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS transactions_insert_admin ON public.transactions;
CREATE POLICY transactions_insert_admin
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS transactions_update_admin ON public.transactions;
CREATE POLICY transactions_update_admin
ON public.transactions
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS transactions_delete_admin ON public.transactions;
CREATE POLICY transactions_delete_admin
ON public.transactions
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ===== transaction_items =====
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS transaction_items_select_authenticated ON public.transaction_items;
CREATE POLICY transaction_items_select_authenticated
ON public.transaction_items
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS transaction_items_insert_admin ON public.transaction_items;
CREATE POLICY transaction_items_insert_admin
ON public.transaction_items
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS transaction_items_update_admin ON public.transaction_items;
CREATE POLICY transaction_items_update_admin
ON public.transaction_items
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS transaction_items_delete_admin ON public.transaction_items;
CREATE POLICY transaction_items_delete_admin
ON public.transaction_items
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ===== payments =====
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_select_authenticated ON public.payments;
CREATE POLICY payments_select_authenticated
ON public.payments
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS payments_insert_admin ON public.payments;
CREATE POLICY payments_insert_admin
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS payments_update_admin ON public.payments;
CREATE POLICY payments_update_admin
ON public.payments
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS payments_delete_admin ON public.payments;
CREATE POLICY payments_delete_admin
ON public.payments
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ===== cash_ledger =====
ALTER TABLE public.cash_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cash_ledger_select_authenticated ON public.cash_ledger;
CREATE POLICY cash_ledger_select_authenticated
ON public.cash_ledger
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS cash_ledger_insert_admin ON public.cash_ledger;
CREATE POLICY cash_ledger_insert_admin
ON public.cash_ledger
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS cash_ledger_update_admin ON public.cash_ledger;
CREATE POLICY cash_ledger_update_admin
ON public.cash_ledger
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS cash_ledger_delete_admin ON public.cash_ledger;
CREATE POLICY cash_ledger_delete_admin
ON public.cash_ledger
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ===== users (restrict strongly) =====
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_admin ON public.users;
CREATE POLICY users_select_admin
ON public.users
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS users_insert_admin ON public.users;
CREATE POLICY users_insert_admin
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS users_update_admin ON public.users;
CREATE POLICY users_update_admin
ON public.users
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS users_delete_admin ON public.users;
CREATE POLICY users_delete_admin
ON public.users
FOR DELETE
TO authenticated
USING (public.is_admin());

COMMIT;

-- Verification queries:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
-- SELECT * FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;
