-- Speed up dashboard reminder queries that filter active items and sort by target date.
CREATE INDEX IF NOT EXISTS "idx_transaction_items_rowstatus_targetdate"
ON "transaction_items" ("rowStatus", "targetDate");
