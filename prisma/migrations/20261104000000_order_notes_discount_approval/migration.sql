-- Additive migration: preserve all historical transactions, passwords and stock.
CREATE TYPE "DiscountType" AS ENUM ('amount', 'percentage');
ALTER TABLE "users" ADD COLUMN "approval_pin_hash" VARCHAR(255);
ALTER TABLE "sales_details" ADD COLUMN "notes" VARCHAR(150);
ALTER TABLE "sales"
  ADD COLUMN "discount_type" "DiscountType" NOT NULL DEFAULT 'amount',
  ADD COLUMN "discount_value" DECIMAL(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN "discount_approved_by" INTEGER;
UPDATE "sales" SET "discount_value" = "discount_amount";
-- Legacy approvers remain NULL: no identity is fabricated for old discounts.
ALTER TABLE "sales"
  ADD CONSTRAINT "sales_discount_input_valid" CHECK (
    ("discount_type" = 'amount' AND "discount_value" >= 0) OR
    ("discount_type" = 'percentage' AND "discount_value" BETWEEN 0 AND 100)
  ),
  ADD CONSTRAINT "sales_discount_approved_by_fkey" FOREIGN KEY ("discount_approved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "approval_attempts" (
  "actor_id" INTEGER NOT NULL,
  "action_scope" VARCHAR(20) NOT NULL,
  "failed_count" INTEGER NOT NULL DEFAULT 0,
  "window_started_at" TIMESTAMPTZ(3) NOT NULL,
  "blocked_until" TIMESTAMPTZ(3),
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "approval_attempts_pkey" PRIMARY KEY ("actor_id", "action_scope"),
  CONSTRAINT "approval_attempts_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "approval_attempts_failed_count_check" CHECK ("failed_count" BETWEEN 0 AND 5),
  CONSTRAINT "approval_attempts_scope_check" CHECK ("action_scope" IN ('discount', 'void'))
);
CREATE INDEX "approval_attempts_updated_at_idx" ON "approval_attempts"("updated_at");
