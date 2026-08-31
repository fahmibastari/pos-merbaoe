-- Add the checkout key and canonical request fingerprint. Existing development
-- rows receive non-replayable placeholders so both columns can remain NOT NULL.
ALTER TABLE "sales"
ADD COLUMN "idempotency_key" UUID,
ADD COLUMN "request_fingerprint" CHAR(64);

UPDATE "sales"
SET
    "idempotency_key" = gen_random_uuid(),
    "request_fingerprint" = repeat('0', 64)
WHERE "idempotency_key" IS NULL;

ALTER TABLE "sales"
ALTER COLUMN "idempotency_key" SET NOT NULL,
ALTER COLUMN "request_fingerprint" SET NOT NULL,
ADD CONSTRAINT "sales_fingerprint_valid"
    CHECK ("request_fingerprint" ~ '^[0-9a-f]{64}$');

CREATE UNIQUE INDEX "sales_idempotency_key_key"
ON "sales"("idempotency_key");
