-- Performance indexes for high-traffic dashboard and transaction paths
CREATE INDEX IF NOT EXISTS "idx_role_menu_mappings_role_menu"
  ON "role_menu_mappings" ("roleId", "menuId");

CREATE INDEX IF NOT EXISTS "idx_transactions_rowstatus_createdat"
  ON "transactions" ("rowStatus", "createdAt");

CREATE INDEX IF NOT EXISTS "idx_transactions_rowstatus_paymentstatus"
  ON "transactions" ("rowStatus", "paymentStatus");

CREATE INDEX IF NOT EXISTS "idx_transactions_customerid"
  ON "transactions" ("customerId");

CREATE INDEX IF NOT EXISTS "idx_transactions_statustransactionid"
  ON "transactions" ("statusTransactionId");

CREATE INDEX IF NOT EXISTS "idx_transaction_items_rowstatus_statusitemid"
  ON "transaction_items" ("rowStatus", "statusItemId");

CREATE INDEX IF NOT EXISTS "idx_transaction_items_targetdate"
  ON "transaction_items" ("targetDate");

CREATE INDEX IF NOT EXISTS "idx_transaction_items_transactionid"
  ON "transaction_items" ("transactionId");

CREATE INDEX IF NOT EXISTS "idx_cash_ledger_entrydate"
  ON "cash_ledger" ("entryDate");

CREATE INDEX IF NOT EXISTS "idx_cash_ledger_type_entrydate"
  ON "cash_ledger" ("type", "entryDate");

CREATE INDEX IF NOT EXISTS "idx_cash_ledger_walletid_entrydate"
  ON "cash_ledger" ("walletId", "entryDate");
