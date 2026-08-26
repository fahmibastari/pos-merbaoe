-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('purchase', 'sale', 'adjustment');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('completed', 'voided');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "HppSource" AS ENUM ('recipe', 'base', 'fallback');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StockSource" ADD VALUE 'sale_void';
ALTER TYPE "StockSource" ADD VALUE 'opening';

-- DropForeignKey
ALTER TABLE "stock_transactions" DROP CONSTRAINT "stock_transactions_ingredient_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_login_at" TIMESTAMPTZ(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "ingredients" ADD COLUMN     "average_cost" DECIMAL(14,4) NOT NULL DEFAULT 0,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "stock_value" DECIMAL(14,2) NOT NULL DEFAULT 0,
ALTER COLUMN "current_stock" SET DATA TYPE DECIMAL(14,3),
ALTER COLUMN "minimum_stock" SET DEFAULT 0,
ALTER COLUMN "minimum_stock" SET DATA TYPE DECIMAL(14,3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "selling_price" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "base_hpp" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "recipes" ALTER COLUMN "quantity_needed" SET DATA TYPE DECIMAL(14,3);

-- AlterTable
ALTER TABLE "stock_transactions" ADD COLUMN     "balance_after" DECIMAL(14,3) NOT NULL,
ADD COLUMN     "created_by" INTEGER NOT NULL,
ADD COLUMN     "notes" VARCHAR(255),
ADD COLUMN     "reference_type" "ReferenceType",
ADD COLUMN     "total_cost" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "value_after" DECIMAL(14,2) NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(14,3),
ALTER COLUMN "unit_cost" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "transaction_date" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "purchases" ADD COLUMN     "notes" VARCHAR(255),
ALTER COLUMN "total_amount" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "purchase_details" ADD COLUMN     "subtotal" DECIMAL(14,2) NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(14,3),
ALTER COLUMN "unit_cost" SET DATA TYPE DECIMAL(14,4);

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "cash_received" DECIMAL(14,2),
ADD COLUMN     "change_amount" DECIMAL(14,2),
ADD COLUMN     "discount_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "net_amount" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "shift_id" INTEGER,
ADD COLUMN     "status" "SaleStatus" NOT NULL DEFAULT 'completed',
ADD COLUMN     "subtotal_amount" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "tax_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tax_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
ADD COLUMN     "void_reason" VARCHAR(255),
ADD COLUMN     "voided_at" TIMESTAMPTZ(3),
ADD COLUMN     "voided_by" INTEGER,
ALTER COLUMN "total_amount" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "total_hpp" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "gross_profit" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "transaction_date" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "sales_details" ADD COLUMN     "hpp_source" "HppSource" NOT NULL,
ADD COLUMN     "product_name" VARCHAR(100) NOT NULL,
ALTER COLUMN "selling_price" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "hpp_snapshot" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "gross_profit_snapshot" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "operational_expenses" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "cashier_shifts" (
    "id" SERIAL NOT NULL,
    "cashier_id" INTEGER NOT NULL,
    "opening_cash" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "expected_cash" DECIMAL(14,2),
    "actual_cash" DECIMAL(14,2),
    "difference" DECIMAL(14,2),
    "status" "ShiftStatus" NOT NULL DEFAULT 'open',
    "notes" VARCHAR(255),
    "opened_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(3),

    CONSTRAINT "cashier_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "entity" VARCHAR(50) NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "before_data" JSONB,
    "after_data" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "recipes_product_id_idx" ON "recipes"("product_id");

-- CreateIndex
CREATE INDEX "recipes_ingredient_id_idx" ON "recipes"("ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipes_product_id_ingredient_id_key" ON "recipes"("product_id", "ingredient_id");

-- CreateIndex
CREATE INDEX "stock_transactions_ingredient_id_transaction_date_idx" ON "stock_transactions"("ingredient_id", "transaction_date");

-- CreateIndex
CREATE INDEX "stock_transactions_reference_type_reference_id_idx" ON "stock_transactions"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "purchases_purchase_date_idx" ON "purchases"("purchase_date");

-- CreateIndex
CREATE INDEX "purchase_details_purchase_id_idx" ON "purchase_details"("purchase_id");

-- CreateIndex
CREATE INDEX "purchase_details_ingredient_id_idx" ON "purchase_details"("ingredient_id");

-- CreateIndex
CREATE INDEX "sales_transaction_date_idx" ON "sales"("transaction_date");

-- CreateIndex
CREATE INDEX "sales_cashier_id_transaction_date_idx" ON "sales"("cashier_id", "transaction_date");

-- CreateIndex
CREATE INDEX "sales_status_transaction_date_idx" ON "sales"("status", "transaction_date");

-- CreateIndex
CREATE INDEX "sales_shift_id_idx" ON "sales"("shift_id");

-- CreateIndex
CREATE INDEX "sales_details_sale_id_idx" ON "sales_details"("sale_id");

-- CreateIndex
CREATE INDEX "sales_details_product_id_idx" ON "sales_details"("product_id");

-- CreateIndex
CREATE INDEX "operational_expenses_expense_date_idx" ON "operational_expenses"("expense_date");

-- CreateIndex
CREATE INDEX "operational_expenses_category_expense_date_idx" ON "operational_expenses"("category", "expense_date");

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashier_shifts" ADD CONSTRAINT "cashier_shifts_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_voided_by_fkey" FOREIGN KEY ("voided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "cashier_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Application invariants that Prisma schema syntax cannot express.
ALTER TABLE "ingredients"
ADD CONSTRAINT "ingredients_stock_non_negative" CHECK ("current_stock" >= 0),
ADD CONSTRAINT "ingredients_value_non_negative" CHECK ("stock_value" >= 0);

ALTER TABLE "products"
ADD CONSTRAINT "products_price_non_negative" CHECK ("selling_price" >= 0),
ADD CONSTRAINT "products_hpp_non_negative" CHECK ("base_hpp" >= 0);

ALTER TABLE "recipes"
ADD CONSTRAINT "recipes_qty_positive" CHECK ("quantity_needed" > 0);

ALTER TABLE "stock_transactions"
ADD CONSTRAINT "stock_tx_qty_positive" CHECK ("quantity" > 0),
ADD CONSTRAINT "stock_tx_reference_pair" CHECK (
    ("reference_type" IS NULL AND "reference_id" IS NULL) OR
    ("reference_type" IS NOT NULL AND "reference_id" IS NOT NULL)
);

ALTER TABLE "purchases"
ADD CONSTRAINT "purchases_total_non_negative" CHECK ("total_amount" >= 0);

ALTER TABLE "purchase_details"
ADD CONSTRAINT "purchase_details_qty_positive" CHECK ("quantity" > 0),
ADD CONSTRAINT "purchase_details_cost_positive" CHECK ("unit_cost" >= 0);

ALTER TABLE "sales"
ADD CONSTRAINT "sales_discount_valid" CHECK (
    "discount_amount" >= 0 AND "discount_amount" <= "subtotal_amount"
),
ADD CONSTRAINT "sales_net_valid" CHECK (
    "net_amount" = "subtotal_amount" - "discount_amount"
),
ADD CONSTRAINT "sales_total_valid" CHECK (
    "total_amount" = "net_amount" + "tax_amount"
),
ADD CONSTRAINT "sales_profit_valid" CHECK (
    "gross_profit" = "net_amount" - "total_hpp"
),
ADD CONSTRAINT "sales_void_complete" CHECK (
    ("status" = 'completed' AND "voided_at" IS NULL AND "voided_by" IS NULL) OR
    ("status" = 'voided' AND "voided_at" IS NOT NULL AND "voided_by" IS NOT NULL)
);

ALTER TABLE "sales_details"
ADD CONSTRAINT "sales_details_qty_positive" CHECK ("quantity" > 0);

ALTER TABLE "operational_expenses"
ADD CONSTRAINT "expenses_amount_positive" CHECK ("amount" > 0);

-- A cashier may have at most one open shift.
CREATE UNIQUE INDEX "cashier_shifts_one_open"
ON "cashier_shifts"("cashier_id")
WHERE "status" = 'open';

-- Collision-free source for sale invoice numbers.
CREATE SEQUENCE "sales_invoice_seq";
