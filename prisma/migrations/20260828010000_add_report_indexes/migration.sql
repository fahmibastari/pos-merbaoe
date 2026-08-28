CREATE INDEX "stock_transactions_transaction_date_source_type_idx"
    ON "stock_transactions"("transaction_date", "source", "type");

CREATE INDEX "audit_logs_created_at_id_idx"
    ON "audit_logs"("created_at", "id");
