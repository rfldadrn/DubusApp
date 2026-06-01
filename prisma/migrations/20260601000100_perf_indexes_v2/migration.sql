-- Performance indexes v2 — DubusApp production hardening
-- Aman dipakai dengan IF NOT EXISTS (Postgres 9.5+).

CREATE INDEX IF NOT EXISTS "payments_paidAt_idx" ON "payments" ("paidAt" DESC);
CREATE INDEX IF NOT EXISTS "payments_transactionId_idx" ON "payments" ("transactionId");
CREATE INDEX IF NOT EXISTS "payments_walletId_paidAt_idx" ON "payments" ("walletId", "paidAt" DESC);

CREATE INDEX IF NOT EXISTS "deliveries_createdAt_idx" ON "deliveries" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "deliveries_agencyProjectId_deliveryDate_idx" ON "deliveries" ("agencyProjectId", "deliveryDate" DESC);

CREATE INDEX IF NOT EXISTS "worker_logs_employeeId_isPaid_createdAt_idx" ON "worker_logs" ("employeeId", "isPaid", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "customers_rowStatus_createdAt_idx" ON "customers" ("rowStatus", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "agency_projects_rowStatus_agencyId_idx" ON "agency_projects" ("rowStatus", "agencyId");

CREATE INDEX IF NOT EXISTS "transaction_items_transactionId_rowStatus_idx" ON "transaction_items" ("transactionId", "rowStatus");

CREATE INDEX IF NOT EXISTS "transactions_agencyProjectId_rowStatus_createdAt_idx" ON "transactions" ("agencyProjectId", "rowStatus", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "production_logs_transactionItemId_idx" ON "production_logs" ("transactionItemId");
CREATE INDEX IF NOT EXISTS "production_logs_createdAt_idx" ON "production_logs" ("createdAt" DESC);

CREATE INDEX IF NOT EXISTS "audit_logs_userId_createdAt_idx" ON "audit_logs" ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "audit_logs_tableName_recordId_idx" ON "audit_logs" ("tableName", "recordId");
