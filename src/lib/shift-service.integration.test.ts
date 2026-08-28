import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { ActionError } from "./action-result";
import { processSale, type CheckoutInput } from "./checkout-service";
import { prisma } from "./prisma";
import { closeCashierShift, openCashierShift } from "./shift-service";

const runDatabaseTests = process.env.RUN_DB_TESTS === "1";

test(
  "I-10: shift wajib, unik, dan rekonsiliasi kas memasukkan pengeluaran laci",
  { skip: !runDatabaseTests },
  async () => {
    const suffix = randomUUID().slice(0, 8);
    const idempotencyKey = randomUUID();
    const cashier = await prisma.user.create({
      data: {
        name: `SHIFT Cashier ${suffix}`,
        username: `shift-${suffix}`,
        passwordHash: "integration-test-only",
        role: "kasir",
      },
    });
    let shiftId: number | null = null;
    let productId: number | null = null;

    try {
      const shift = await openCashierShift(cashier.id, 100);
      shiftId = shift.id;
      await assert.rejects(
        openCashierShift(cashier.id, 0),
        (error) =>
          error instanceof ActionError && /masih memiliki shift/.test(error.message),
      );

      const product = await prisma.product.create({
        data: {
          name: `SHIFT-${suffix}`,
          sellingPrice: 100,
          baseHpp: 40,
          category: { connect: { slug: "kopi" } },
          hasRecipe: false,
        },
      });
      productId = product.id;
      const checkout: CheckoutInput = {
        idempotencyKey,
        paymentMethod: "cash",
        discountAmount: 0,
        taxRate: 0,
        cashReceived: 200,
        items: [{ productId: product.id, quantity: 2 }],
      };
      const receipt = await processSale(cashier.id, checkout);
      const storedSale = await prisma.sale.findUniqueOrThrow({
        where: { id: receipt.saleId },
      });
      assert.equal(storedSale.shiftId, shift.id);

      await prisma.operationalExpense.create({
        data: {
          description: "Pengeluaran laci integration test",
          category: "lain_lain",
          amount: 20,
          expenseDate: new Date(),
          createdBy: cashier.id,
          cashierShiftId: shift.id,
        },
      });

      await assert.rejects(
        closeCashierShift(cashier.id, 279, null),
        (error) =>
          error instanceof ActionError && /Keterangan wajib/.test(error.message),
      );
      assert.equal(
        (
          await prisma.cashierShift.findUniqueOrThrow({ where: { id: shift.id } })
        ).status,
        "open",
      );

      const closed = await closeCashierShift(
        cashier.id,
        279,
        "Kurang satu rupiah saat hitung fisik",
      );
      assert.deepEqual(
        {
          openingCash: closed.openingCash,
          cashSales: closed.cashSales,
          cashDrawerExpenses: closed.cashDrawerExpenses,
          expectedCash: closed.expectedCash,
          actualCash: closed.actualCash,
          difference: closed.difference,
        },
        {
          openingCash: 100,
          cashSales: 200,
          cashDrawerExpenses: 20,
          expectedCash: 280,
          actualCash: 279,
          difference: -1,
        },
      );

      await assert.rejects(
        processSale(cashier.id, {
          ...checkout,
          idempotencyKey: randomUUID(),
        }),
        (error) =>
          error instanceof ActionError && /Buka shift/.test(error.message),
      );
    } finally {
      await prisma.$transaction(async (tx) => {
        if (shiftId !== null) {
          await tx.auditLog.deleteMany({
            where: { entity: "cashier_shift", entityId: shiftId },
          });
          await tx.operationalExpense.deleteMany({
            where: { cashierShiftId: shiftId },
          });
        }
        await tx.sale.deleteMany({ where: { idempotencyKey } });
        if (productId !== null) {
          await tx.product.deleteMany({ where: { id: productId } });
        }
        if (shiftId !== null) {
          await tx.cashierShift.deleteMany({ where: { id: shiftId } });
        }
        await tx.user.delete({ where: { id: cashier.id } });
      });
      await prisma.$disconnect();
    }
  },
);
