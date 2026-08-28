import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { businessRangeFromDates } from "./period";
import { prisma } from "./prisma";
import { getInventoryReport, getProfitReport } from "./reporting";
import { getAuditReport } from "./audit-report";

const runDatabaseTests = process.env.RUN_DB_TESTS === "1";

test(
  "TASK-025: PB1, HPP fallback, snapshot historis, opening, dan void lintas periode",
  { skip: !runDatabaseTests },
  async () => {
    const suffix = randomUUID().slice(0, 8);
    const admin = await prisma.user.create({
      data: {
        name: `REPORT Admin ${suffix}`,
        username: `report-${suffix}`,
        passwordHash: "integration-test-only",
        role: "admin",
      },
    });
    let ingredientId: number | null = null;
    let shiftId: number | null = null;

    try {
      const ingredient = await prisma.ingredient.create({
        data: {
          name: `Bahan Report ${suffix}`,
          unit: "gram",
          currentStock: 10,
          stockValue: 1_000,
          averageCost: 100,
        },
      });
      ingredientId = ingredient.id;
      const shift = await prisma.cashierShift.create({
        data: {
          cashierId: admin.id,
          openingCash: 0,
          status: "closed",
          expectedCash: 0,
          actualCash: 0,
          difference: 0,
          openedAt: new Date("2026-08-01T00:00:00.000Z"),
          closedAt: new Date("2026-08-04T00:00:00.000Z"),
        },
      });
      shiftId = shift.id;

      const voidedSale = await prisma.sale.create({
        data: {
          invoiceNumber: `VOID-${suffix}`,
          idempotencyKey: randomUUID(),
          requestFingerprint: "b".repeat(64),
          cashierId: admin.id,
          shiftId: shift.id,
          subtotalAmount: 400,
          discountAmount: 0,
          netAmount: 400,
          taxRate: 0,
          taxAmount: 0,
          totalAmount: 400,
          totalHpp: 200,
          grossProfit: 200,
          paymentMethod: "qris",
          status: "voided",
          voidReason: "Fixture void lintas periode",
          voidedBy: admin.id,
          voidedAt: new Date("2026-08-03T01:00:00.000Z"),
          transactionDate: new Date("2026-08-01T01:00:00.000Z"),
        },
      });
      await prisma.sale.create({
        data: {
          invoiceNumber: `DONE-${suffix}`,
          idempotencyKey: randomUUID(),
          requestFingerprint: "d".repeat(64),
          cashierId: admin.id,
          shiftId: shift.id,
          subtotalAmount: 1_000,
          discountAmount: 0,
          netAmount: 1_000,
          taxRate: 0.1,
          taxAmount: 100,
          totalAmount: 1_100,
          totalHpp: 500,
          grossProfit: 500,
          paymentMethod: "cash",
          cashReceived: 1_100,
          changeAmount: 0,
          status: "completed",
          transactionDate: new Date("2026-08-02T03:00:00.000Z"),
        },
      });
      await prisma.stockTransaction.createMany({
        data: [
          {
            ingredientId: ingredient.id,
            type: "in",
            quantity: 10,
            unitCost: 100,
            totalCost: 1_000,
            balanceAfter: 10,
            valueAfter: 1_000,
            source: "opening",
            createdBy: admin.id,
            transactionDate: new Date("2026-08-01T00:00:00.000Z"),
          },
          {
            ingredientId: ingredient.id,
            type: "out",
            quantity: 2,
            unitCost: 100,
            totalCost: 200,
            balanceAfter: 8,
            valueAfter: 800,
            source: "sale",
            referenceType: "sale",
            referenceId: voidedSale.id,
            createdBy: admin.id,
            transactionDate: new Date("2026-08-01T01:00:00.000Z"),
          },
          {
            ingredientId: ingredient.id,
            type: "in",
            quantity: 2,
            unitCost: 100,
            totalCost: 200,
            balanceAfter: 10,
            valueAfter: 1_000,
            source: "sale_void",
            referenceType: "sale",
            referenceId: voidedSale.id,
            createdBy: admin.id,
            transactionDate: new Date("2026-08-03T01:00:00.000Z"),
          },
        ],
      });
      await prisma.operationalExpense.create({
        data: {
          description: `OPEX Report ${suffix}`,
          category: "utilitas",
          amount: 100,
          expenseDate: new Date("2026-08-02T00:00:00.000Z"),
          createdBy: admin.id,
        },
      });
      await prisma.purchase.create({
        data: {
          invoiceNumber: `BUY-${suffix}`,
          supplierName: "Fixture",
          totalAmount: 300,
          purchaseDate: new Date("2026-08-02T00:00:00.000Z"),
          createdBy: admin.id,
        },
      });
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: "update",
          entity: "ingredient",
          entityId: ingredient.id,
          beforeData: { name: "Sebelum", passwordHash: "tidak-boleh-tampil" },
          afterData: { name: ingredient.name },
          createdAt: new Date("2026-08-02T04:00:00.000Z"),
        },
      });

      const profit = await getProfitReport(
        businessRangeFromDates("2026-08-02", "2026-08-02"),
      );
      assert.equal(profit.transactionCount, 1);
      assert.equal(profit.netRevenue, 1_000);
      assert.equal(profit.taxCollected, 100);
      assert.equal(profit.customerPayments, 1_100);
      assert.equal(profit.cogs, 500);
      assert.equal(profit.grossProfit, 500);
      assert.equal(profit.operatingExpenses, 100);
      assert.equal(profit.netProfit, 400);
      assert.equal(profit.inventoryPurchases, 300);

      const audit = await getAuditReport({
        period: businessRangeFromDates("2026-08-02", "2026-08-02"),
        userId: admin.id,
        entity: "ingredient",
        action: "update",
        page: 1,
        pageSize: 20,
      });
      assert.equal(audit.logs.length, 1);
      assert.equal(audit.logs[0].beforeData?.passwordHash, "[DISEMBUNYIKAN]");
      assert.equal(audit.paging.page, 1);

      const fullInventory = await getInventoryReport(
        businessRangeFromDates("2026-08-01", "2026-08-04"),
      );
      const item = fullInventory.items.find((row) => row.id === ingredient.id);
      assert.ok(item);
      assert.equal(item.openingValue, 0);
      assert.equal(item.endingValue, 1_000);
      assert.equal(fullInventory.reconciliation.openingIn, 1_000);
      assert.equal(fullInventory.reconciliation.saleOut, 200);
      assert.equal(fullInventory.reconciliation.saleVoidIn, 200);
      assert.equal(fullInventory.reconciliation.difference, 0);
      assert.equal(fullInventory.reconciliation.balanced, true);
      assert.notEqual(profit.cogs, fullInventory.reconciliation.saleOut);

      const voidPeriod = await getInventoryReport(
        businessRangeFromDates("2026-08-03", "2026-08-03"),
      );
      const voidItem = voidPeriod.items.find((row) => row.id === ingredient.id);
      assert.ok(voidItem);
      assert.equal(voidItem.openingValue, 800);
      assert.equal(voidItem.endingValue, 1_000);
      assert.equal(voidPeriod.reconciliation.saleVoidIn, 200);
      assert.equal(voidPeriod.reconciliation.difference, 0);
    } finally {
      await prisma.$transaction(async (tx) => {
        await tx.operationalExpense.deleteMany({ where: { createdBy: admin.id } });
        await tx.stockTransaction.deleteMany({ where: { createdBy: admin.id } });
        await tx.purchase.deleteMany({ where: { createdBy: admin.id } });
        await tx.sale.deleteMany({ where: { cashierId: admin.id } });
        if (shiftId !== null) {
          await tx.cashierShift.deleteMany({ where: { id: shiftId } });
        }
        if (ingredientId !== null) {
          await tx.ingredient.deleteMany({ where: { id: ingredientId } });
        }
        await tx.auditLog.deleteMany({ where: { userId: admin.id } });
        await tx.user.deleteMany({ where: { id: admin.id } });
      });
    }
  },
);
