CREATE TABLE "product_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_categories_sort_order_check" CHECK ("sort_order" >= 0)
);

CREATE UNIQUE INDEX "product_categories_slug_key" ON "product_categories"("slug");
CREATE INDEX "product_categories_is_active_sort_order_name_idx"
    ON "product_categories"("is_active", "sort_order", "name");

INSERT INTO "product_categories" ("name", "slug", "sort_order", "updated_at")
VALUES
    ('Kopi', 'kopi', 10, CURRENT_TIMESTAMP),
    ('Non Kopi', 'non-kopi', 20, CURRENT_TIMESTAMP);

ALTER TABLE "products" ADD COLUMN "category_id" INTEGER;

UPDATE "products"
SET "category_id" = (
    SELECT "id" FROM "product_categories" WHERE "slug" = 'kopi'
)
WHERE "name" IN ('Americano', 'Es Kopi Susu', 'Kopi Susu Aren');

UPDATE "products"
SET "category_id" = (
    SELECT "id" FROM "product_categories" WHERE "slug" = 'non-kopi'
)
WHERE "name" IN ('Coklat Panas', 'Matcha Latte');

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "products" WHERE "category_id" IS NULL) THEN
        INSERT INTO "product_categories" ("name", "slug", "sort_order", "updated_at")
        VALUES ('Lainnya', 'lainnya', 999, CURRENT_TIMESTAMP)
        ON CONFLICT ("slug") DO NOTHING;

        UPDATE "products"
        SET "category_id" = (
            SELECT "id" FROM "product_categories" WHERE "slug" = 'lainnya'
        )
        WHERE "category_id" IS NULL;
    END IF;
END $$;

ALTER TABLE "products" ALTER COLUMN "category_id" SET NOT NULL;
CREATE INDEX "products_category_id_is_active_idx" ON "products"("category_id", "is_active");
ALTER TABLE "products"
    ADD CONSTRAINT "products_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "product_categories"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
