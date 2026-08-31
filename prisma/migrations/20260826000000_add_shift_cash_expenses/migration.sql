-- TASK-019: every sale belongs to a shift and drawer-funded expenses are
-- attributable to the exact open shift whose expected cash they reduce.

ALTER TABLE "operational_expenses"
ADD COLUMN "cashier_shift_id" INTEGER;

ALTER TABLE "sales"
DROP CONSTRAINT "sales_shift_id_fkey";

ALTER TABLE "sales"
ALTER COLUMN "shift_id" SET NOT NULL;

CREATE INDEX "operational_expenses_cashier_shift_id_idx"
ON "operational_expenses"("cashier_shift_id");

ALTER TABLE "sales"
ADD CONSTRAINT "sales_shift_id_fkey"
FOREIGN KEY ("shift_id") REFERENCES "cashier_shifts"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "operational_expenses"
ADD CONSTRAINT "operational_expenses_cashier_shift_id_fkey"
FOREIGN KEY ("cashier_shift_id") REFERENCES "cashier_shifts"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cashier_shifts"
ADD CONSTRAINT "cashier_shifts_opening_cash_non_negative"
  CHECK ("opening_cash" >= 0),
ADD CONSTRAINT "cashier_shifts_amounts_non_negative"
  CHECK (
    ("expected_cash" IS NULL OR "expected_cash" >= 0) AND
    ("actual_cash" IS NULL OR "actual_cash" >= 0)
  ),
ADD CONSTRAINT "cashier_shifts_state_complete"
  CHECK (
    (
      "status" = 'open' AND
      "expected_cash" IS NULL AND
      "actual_cash" IS NULL AND
      "difference" IS NULL AND
      "closed_at" IS NULL
    ) OR (
      "status" = 'closed' AND
      "expected_cash" IS NOT NULL AND
      "actual_cash" IS NOT NULL AND
      "difference" IS NOT NULL AND
      "closed_at" IS NOT NULL
    )
  ),
ADD CONSTRAINT "cashier_shifts_difference_note_required"
  CHECK (
    "difference" IS NULL OR
    "difference" = 0 OR
    NULLIF(BTRIM("notes"), '') IS NOT NULL
  );
