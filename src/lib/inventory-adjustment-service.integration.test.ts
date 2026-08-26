import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { applyStockIn } from "./costing";
import { processSale } from "./checkout-service";
import { processInventoryMutation } from "./inventory-adjustment-service";
import { prisma } from "./prisma";
import { openCashierShift } from "./shift-service";

const runDatabaseTests = process.env.RUN_DB_TESTS === "1";

test(
  "I-08: opening + pembelian - HPP - waste +/- penyesuaian = persediaan akhir",
  { skip: !runDatabaseTests },
  async () => {
    const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
    let userId: number | null = null;
    let ingredientId: number | null = null;
    let productId: number | null = null;

    try {
      const user = await prisma.user.create({
        data: {
          name: "Inventory Integration Test",
          username: `inventory-${suffix}`,
          passwordHash: "integration-test-only",
          role: "admin",
        },
      });
      userId = user.id;

      const ingredient = await prisma.ingredient.create({
        data: {
          name: `Bahan I-08 ${suffix}`,
          unit: "gram",
          currentStock: 10,
          stockValue: 1_000,
          averageCost: 100,
        },
      });
      ingredientId = ingredient.id;
      await prisma.stockTransaction.create({
        data: {
          ingredientId: ingredient.id,
          type: "in",
          quantity: 10,
          unitCost: 100,
          totalCost: 1_000,
          balanceAfter: 10,
          valueAfter: 1_000,
          source: "opening",
          notes: "Fixture saldo awal I-08",
          createdBy: user.id,
        },
      });

      // Pembelian 5 gram @ Rp200: nilai menjadi Rp2.000 dan average Rp133,3333.
      await prisma.$transaction(async (tx) => {
        const purchase = await tx.purchase.create({
          data: {
            invoiceNumber: `I08-${suffix}`,
            supplierName: "Supplier I-08",
            totalAmount: 1_000,
            purchaseDate: new Date("2026-08-26T00:00:00.000Z"),
            createdBy: user.id,
            details: {
              create: {
                ingredientId: ingredient.id,
                quantity: 5,
                unitCost: 200,
                subtotal: 1_000,
              },
            },
          },
        });
        const next = applyStockIn(
          { currentStock: 10, stockValue: 1_000, averageCost: 100 },
          5,
          200,
        );
        await tx.ingredient.update({
          where: { id: ingredient.id },
          data: next,
        });
        await tx.stockTransaction.create({
          data: {
            ingredientId: ingredient.id,
            type: "in",
            quantity: 5,
            unitCost: 200,
            totalCost: 1_000,
            balanceAfter: next.currentStock,
            valueAfter: next.stockValue,
            source: "purchase",
            referenceType: "purchase",
            referenceId: purchase.id,
            createdBy: user.id,
          },
        });
      });

      const product = await prisma.product.create({
        data: {
          name: `Produk I-08 ${suffix}`,
          sellingPrice: 500,
          baseHpp: 100,
          hasRecipe: true,
          recipes: {
            create: { ingredientId: ingredient.id, quantityNeeded: 1 },
          },
        },
      });
      productId = product.id;
      await openCashierShift(user.id, 0);
      const sale = await processSale(user.id, {
        idempotencyKey: randomUUID(),
        paymentMethod: "qris",
        discountAmount: 0,
        taxRate: 0,
        cashReceived: null,
        items: [{ productId: product.id, quantity: 1 }],
      });

      const adjustmentIn = await processInventoryMutation(user.id, {
        kind: "adjustment",
        ingredientId: ingredient.id,
        physicalStock: 15,
        notes: "Selisih tambah hasil opname",
      });
      const adjustmentOut = await processInventoryMutation(user.id, {
        kind: "adjustment",
        ingredientId: ingredient.id,
        physicalStock: 14,
        notes: "Koreksi hitungan fisik",
      });
      const waste = await processInventoryMutation(user.id, {
        kind: "waste",
        ingredientId: ingredient.id,
        quantity: 2,
        notes: "Bahan tumpah saat produksi",
      });

      assert.equal(adjustmentIn.type, "in");
      assert.equal(adjustmentIn.totalCost, 133);
      assert.equal(adjustmentOut.type, "out");
      assert.equal(adjustmentOut.totalCost, 133);
      assert.equal(waste.type, "out");
      assert.equal(waste.totalCost, 267);
      assert.ok(waste.expenseId);

      const [finalIngredient, movements, wasteExpense, storedSale] =
        await Promise.all([
          prisma.ingredient.findUniqueOrThrow({ where: { id: ingredient.id } }),
          prisma.stockTransaction.findMany({
            where: { ingredientId: ingredient.id },
          }),
          prisma.operationalExpense.findUniqueOrThrow({
            where: { id: waste.expenseId! },
          }),
          prisma.sale.findUniqueOrThrow({ where: { id: sale.saleId } }),
        ]);

      assert.equal(Number(finalIngredient.currentStock), 12);
      assert.equal(Number(finalIngredient.stockValue), 1_600);
      assert.equal(Number(finalIngredient.averageCost), 133.3333);
      assert.equal(wasteExpense.category, "lain_lain");
      assert.equal(Number(wasteExpense.amount), 267);
      assert.equal(wasteExpense.stockTransactionId, waste.stockTransactionId);

      const sum = (source: string, type?: "in" | "out") =>
        movements
          .filter(
            (movement) =>
              movement.source === source && (!type || movement.type === type),
          )
          .reduce((total, movement) => total + Number(movement.totalCost), 0);
      const opening = sum("opening", "in");
      const purchases = sum("purchase", "in");
      const hpp = Number(storedSale.totalHpp);
      const wasteValue = sum("waste", "out");
      const adjustmentValue =
        sum("adjustment", "in") - sum("adjustment", "out");

      assert.equal(opening, 1_000);
      assert.equal(purchases, 1_000);
      assert.equal(hpp, 133);
      assert.equal(wasteValue, 267);
      assert.equal(adjustmentValue, 0);
      assert.equal(
        opening + purchases - hpp - wasteValue + adjustmentValue,
        Number(finalIngredient.stockValue),
      );
    } finally {
      if (userId !== null) {
        await prisma.$transaction(async (tx) => {
          await tx.operationalExpense.deleteMany({
            where: { createdBy: userId! },
          });
          await tx.stockTransaction.deleteMany({
            where: { createdBy: userId! },
          });
          await tx.sale.deleteMany({ where: { cashierId: userId! } });
          await tx.cashierShift.deleteMany({ where: { cashierId: userId! } });
          if (productId !== null) {
            await tx.product.deleteMany({ where: { id: productId } });
          }
          await tx.purchase.deleteMany({ where: { createdBy: userId! } });
          if (ingredientId !== null) {
            await tx.ingredient.deleteMany({ where: { id: ingredientId } });
          }
          await tx.auditLog.deleteMany({ where: { userId: userId! } });
          await tx.user.deleteMany({ where: { id: userId! } });
        });
      }
    }
  },
);
