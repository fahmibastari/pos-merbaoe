import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { ActionError } from "./action-result";
import { processSale, type CheckoutInput } from "./checkout-service";
import { prisma } from "./prisma";
import { processSaleVoid } from "./void-sale-service";

const runDatabaseTests = process.env.RUN_DB_TESTS === "1";

test(
  "I-07: void mengembalikan stok historis, menjaga average cost, dan keluar dari agregat",
  { skip: !runDatabaseTests },
  async () => {
    const userSuffix = randomUUID().slice(0, 8);
    const admin = await prisma.user.create({
      data: {
        name: `VOID Admin ${userSuffix}`,
        username: `void-${userSuffix}`,
        passwordHash: "integration-test-only",
        role: "admin",
      },
    });
    const shift = await prisma.cashierShift.create({
      data: { cashierId: admin.id, openingCash: 0 },
    });
    const suffix = randomUUID().slice(0, 8);
    const idempotencyKey = randomUUID();
    let ingredientId: number | null = null;
    let productId: number | null = null;
    let saleId: number | null = null;

    try {
      const ingredient = await prisma.ingredient.create({
        data: {
          name: `VOID-${suffix}`,
          unit: "gram",
          currentStock: 100,
          stockValue: 1_000,
          averageCost: 10,
          minimumStock: 0,
        },
      });
      ingredientId = ingredient.id;
      const product = await prisma.product.create({
        data: {
          name: `VOID-${suffix}`,
          sellingPrice: 100,
          baseHpp: 20,
          category: { connect: { slug: "kopi" } },
          hasRecipe: true,
          recipes: {
            create: { ingredientId: ingredient.id, quantityNeeded: 2 },
          },
        },
      });
      productId = product.id;

      const checkoutInput: CheckoutInput = {
        idempotencyKey,
        paymentMethod: "qris",
        discountAmount: 0,
        taxRate: 0,
        cashReceived: null,
        items: [{ productId: product.id, quantity: 3 }],
      };
      const receipt = await processSale(admin.id, checkoutInput);
      saleId = receipt.saleId;

      // Simulasikan pembelian setelah checkout: average cost sekarang berubah.
      // Void tetap harus menambah nilai Rp60 dari mutasi penjualan asli.
      await prisma.ingredient.update({
        where: { id: ingredient.id },
        data: {
          currentStock: 104,
          stockValue: 1_140,
          averageCost: 10.9615,
        },
      });

      const beforeAggregate = await prisma.sale.aggregate({
        where: { id: receipt.saleId, status: "completed" },
        _sum: { totalAmount: true, totalHpp: true, grossProfit: true },
        _count: { id: true },
      });
      assert.equal(beforeAggregate._count.id, 1);

      await processSaleVoid(receipt.saleId, admin.id, "Transaksi uji ganda");

      const [sale, returnedIngredient, reversal, audit, afterAggregate] =
        await Promise.all([
          prisma.sale.findUniqueOrThrow({ where: { id: receipt.saleId } }),
          prisma.ingredient.findUniqueOrThrow({ where: { id: ingredient.id } }),
          prisma.stockTransaction.findMany({
            where: {
              referenceType: "sale",
              referenceId: receipt.saleId,
              source: "sale_void",
            },
          }),
          prisma.auditLog.findMany({
            where: { entity: "sale", entityId: receipt.saleId, action: "void" },
          }),
          prisma.sale.aggregate({
            where: { id: receipt.saleId, status: "completed" },
            _sum: { totalAmount: true, totalHpp: true, grossProfit: true },
            _count: { id: true },
          }),
        ]);

      assert.equal(sale.status, "voided");
      assert.equal(sale.voidReason, "Transaksi uji ganda");
      assert.equal(sale.voidedBy, admin.id);
      assert.ok(sale.voidedAt instanceof Date);
      assert.equal(Number(returnedIngredient.currentStock), 110);
      assert.equal(Number(returnedIngredient.stockValue), 1_200);
      assert.equal(Number(returnedIngredient.averageCost), 10.9615);
      assert.equal(reversal.length, 1);
      assert.equal(reversal[0].type, "in");
      assert.equal(Number(reversal[0].quantity), 6);
      assert.equal(Number(reversal[0].totalCost), 60);
      assert.equal(reversal[0].createdBy, admin.id);
      assert.equal(audit.length, 1);
      assert.equal(afterAggregate._count.id, 0);
      assert.equal(afterAggregate._sum.totalAmount, null);

      await assert.rejects(
        processSaleVoid(receipt.saleId, admin.id, "Percobaan kedua"),
        (error) =>
          error instanceof ActionError && /sudah dibatalkan/.test(error.message),
      );
      assert.equal(
        await prisma.stockTransaction.count({
          where: {
            referenceType: "sale",
            referenceId: receipt.saleId,
            source: "sale_void",
          },
        }),
        1,
      );
    } finally {
      await prisma.$transaction(async (tx) => {
        if (saleId !== null) {
          await tx.auditLog.deleteMany({
            where: { entity: "sale", entityId: saleId },
          });
        }
        if (ingredientId !== null) {
          await tx.stockTransaction.deleteMany({
            where: { ingredientId },
          });
        }
        await tx.sale.deleteMany({ where: { idempotencyKey } });
        if (productId !== null) {
          await tx.product.deleteMany({ where: { id: productId } });
        }
        if (ingredientId !== null) {
          await tx.ingredient.deleteMany({ where: { id: ingredientId } });
        }
        await tx.cashierShift.delete({ where: { id: shift.id } });
        await tx.user.delete({ where: { id: admin.id } });
      });
      await prisma.$disconnect();
    }
  },
);
