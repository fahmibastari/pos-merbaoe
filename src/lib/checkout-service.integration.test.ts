import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { ActionError } from "./action-result";
import { processSale, type CheckoutInput } from "./checkout-service";
import { prisma } from "./prisma";

const runDatabaseTests = process.env.RUN_DB_TESTS === "1";

async function createFixture(label: string) {
  const suffix = randomUUID().slice(0, 8);
  const ingredient = await prisma.ingredient.create({
    data: {
      name: `IDEMP-${label}-${suffix}`,
      unit: "gram",
      currentStock: 100,
      stockValue: 1000,
      averageCost: 10,
      minimumStock: 0,
    },
  });
  const product = await prisma.product.create({
    data: {
      name: `IDEMP-${label}-${suffix}`,
      sellingPrice: 100,
      baseHpp: 20,
      category: { connect: { slug: "kopi" } },
      hasRecipe: true,
      recipes: {
        create: { ingredientId: ingredient.id, quantityNeeded: 2 },
      },
    },
  });

  return { ingredient, product };
}

test(
  "TASK-017: retry berurutan dan konkuren hanya membuat satu sale dan satu stok keluar",
  { skip: !runDatabaseTests },
  async () => {
    const userSuffix = randomUUID().slice(0, 8);
    const cashier = await prisma.user.create({
      data: {
        name: `IDEMP Cashier ${userSuffix}`,
        username: `idemp-${userSuffix}`,
        passwordHash: "integration-test-only",
        role: "kasir",
      },
    });
    const shift = await prisma.cashierShift.create({
      data: { cashierId: cashier.id, openingCash: 0 },
    });
    const keys = [randomUUID(), randomUUID()];
    const ingredientIds: number[] = [];
    const productIds: number[] = [];

    try {
      const sequential = await createFixture("SEQ");
      ingredientIds.push(sequential.ingredient.id);
      productIds.push(sequential.product.id);
      const sequentialInput: CheckoutInput = {
        idempotencyKey: keys[0],
        paymentMethod: "qris",
        discountAmount: 0,
        taxRate: 0,
        cashReceived: null,
        items: [{ productId: sequential.product.id, quantity: 3 }],
      };

      const first = await processSale(cashier.id, sequentialInput);
      const replay = await processSale(cashier.id, sequentialInput);
      assert.equal(replay.saleId, first.saleId);
      assert.equal(replay.invoiceNumber, first.invoiceNumber);

      await assert.rejects(
        processSale(cashier.id, {
          ...sequentialInput,
          items: [{ productId: sequential.product.id, quantity: 2 }],
        }),
        (error) =>
          error instanceof ActionError && /checkout yang berbeda/.test(error.message),
      );

      const concurrent = await createFixture("CON");
      ingredientIds.push(concurrent.ingredient.id);
      productIds.push(concurrent.product.id);
      const concurrentInput: CheckoutInput = {
        ...sequentialInput,
        idempotencyKey: keys[1],
        items: [{ productId: concurrent.product.id, quantity: 3 }],
      };
      const [left, right] = await Promise.all([
        processSale(cashier.id, concurrentInput),
        processSale(cashier.id, concurrentInput),
      ]);
      assert.equal(left.saleId, right.saleId);
      assert.equal(left.invoiceNumber, right.invoiceNumber);

      const [sales, ingredients, stockMovements] = await Promise.all([
        prisma.sale.findMany({
          where: { idempotencyKey: { in: keys } },
          select: { id: true, idempotencyKey: true },
        }),
        prisma.ingredient.findMany({
          where: { id: { in: ingredientIds } },
          select: { id: true, currentStock: true, stockValue: true },
        }),
        prisma.stockTransaction.findMany({
          where: { ingredientId: { in: ingredientIds }, source: "sale" },
          select: { ingredientId: true, quantity: true },
        }),
      ]);

      assert.equal(sales.length, 2);
      assert.deepEqual(
        ingredients.map((ingredient) => Number(ingredient.currentStock)).sort(),
        [94, 94],
      );
      assert.deepEqual(
        ingredients.map((ingredient) => Number(ingredient.stockValue)).sort(),
        [940, 940],
      );
      assert.equal(stockMovements.length, 2);
      assert.ok(
        stockMovements.every((movement) => Number(movement.quantity) === 6),
      );
    } finally {
      await prisma.$transaction(async (tx) => {
        await tx.stockTransaction.deleteMany({
          where: { ingredientId: { in: ingredientIds } },
        });
        await tx.sale.deleteMany({
          where: { idempotencyKey: { in: keys } },
        });
        await tx.product.deleteMany({ where: { id: { in: productIds } } });
        await tx.ingredient.deleteMany({
          where: { id: { in: ingredientIds } },
        });
        await tx.cashierShift.delete({ where: { id: shift.id } });
        await tx.user.delete({ where: { id: cashier.id } });
      });
      const [salesLeft, ingredientsLeft, productsLeft] = await Promise.all([
        prisma.sale.count({ where: { idempotencyKey: { in: keys } } }),
        prisma.ingredient.count({ where: { id: { in: ingredientIds } } }),
        prisma.product.count({ where: { id: { in: productIds } } }),
      ]);
      assert.deepEqual(
        { salesLeft, ingredientsLeft, productsLeft },
        { salesLeft: 0, ingredientsLeft: 0, productsLeft: 0 },
      );
      await prisma.$disconnect();
    }
  },
);
