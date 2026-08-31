import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { Role } from "@/generated/prisma/client";
import { ActionError } from "./action-result";
import { processSale, type CheckoutInput } from "./checkout-service";
import {
  AuthorizationError,
  requireAdminSession,
} from "./guard";
import { prisma } from "./prisma";
import { recordPurchase } from "./purchase-service";

const runDatabaseTests = process.env.RUN_DB_TESTS === "1";

type Fixture = {
  userId: number;
  ingredientIds: number[];
  productIds: number[];
  categoryIds: number[];
};

async function createFixture(role: Role = "admin"): Promise<Fixture> {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      name: `TASK-035 ${role} ${suffix}`,
      username: `task035-${role}-${suffix}`,
      passwordHash: "integration-test-only",
      role,
    },
  });
  return {
    userId: user.id,
    ingredientIds: [],
    productIds: [],
    categoryIds: [],
  };
}

async function addIngredient(
  fixture: Fixture,
  label: string,
  currentStock: number,
  averageCost: number,
) {
  const ingredient = await prisma.ingredient.create({
    data: {
      name: `TASK-035 ${label} ${randomUUID().slice(0, 8)}`,
      unit: "gram",
      currentStock,
      stockValue: currentStock * averageCost,
      averageCost,
      minimumStock: 0,
    },
  });
  fixture.ingredientIds.push(ingredient.id);
  return ingredient;
}

async function addCategory(fixture: Fixture) {
  const suffix = randomUUID().slice(0, 8);
  const category = await prisma.productCategory.create({
    data: {
      name: `TASK-035 ${suffix}`,
      slug: `task-035-${suffix}`,
    },
  });
  fixture.categoryIds.push(category.id);
  return category;
}

async function addProduct(
  fixture: Fixture,
  input: {
    label: string;
    categoryId: number;
    sellingPrice?: number;
    baseHpp: number;
    hasRecipe: boolean;
    recipes?: Array<{ ingredientId: number; quantityNeeded: number }>;
  },
) {
  const product = await prisma.product.create({
    data: {
      name: `TASK-035 ${input.label} ${randomUUID().slice(0, 8)}`,
      categoryId: input.categoryId,
      sellingPrice: input.sellingPrice ?? 100,
      baseHpp: input.baseHpp,
      hasRecipe: input.hasRecipe,
      recipes: input.recipes?.length
        ? { create: input.recipes }
        : undefined,
    },
  });
  fixture.productIds.push(product.id);
  return product;
}

async function openShift(userId: number) {
  return prisma.cashierShift.create({
    data: { cashierId: userId, openingCash: 0 },
  });
}

function checkoutInput(
  productId: number,
  quantity = 1,
  idempotencyKey = randomUUID(),
): CheckoutInput {
  return {
    idempotencyKey,
    paymentMethod: "qris",
    discountAmount: 0,
    taxRate: 0,
    cashReceived: null,
    items: [{ productId, quantity }],
  };
}

async function cleanupFixture(fixture: Fixture) {
  await prisma.$transaction(async (tx) => {
    await tx.operationalExpense.deleteMany({
      where: { createdBy: fixture.userId },
    });
    await tx.stockTransaction.deleteMany({
      where: {
        OR: [
          { createdBy: fixture.userId },
          { ingredientId: { in: fixture.ingredientIds } },
        ],
      },
    });
    await tx.sale.deleteMany({ where: { cashierId: fixture.userId } });
    await tx.cashierShift.deleteMany({ where: { cashierId: fixture.userId } });
    await tx.product.deleteMany({ where: { id: { in: fixture.productIds } } });
    await tx.purchase.deleteMany({ where: { createdBy: fixture.userId } });
    await tx.ingredient.deleteMany({
      where: { id: { in: fixture.ingredientIds } },
    });
    await tx.productCategory.deleteMany({
      where: { id: { in: fixture.categoryIds } },
    });
    await tx.auditLog.deleteMany({ where: { userId: fixture.userId } });
    await tx.loginAttempt.deleteMany({
      where: { username: { startsWith: "task035-" } },
    });
    await tx.user.deleteMany({ where: { id: fixture.userId } });
  });
}

test(
  "I-01: pembelian memperbarui stok, nilai, average cost, dan satu ledger masuk",
  { skip: !runDatabaseTests },
  async () => {
    const fixture = await createFixture();
    try {
      const ingredient = await addIngredient(fixture, "I-01", 100, 100);
      const purchase = await recordPurchase(fixture.userId, {
        supplierName: "Supplier I-01",
        purchaseDate: new Date("2026-08-31T00:00:00.000Z"),
        items: [{ ingredientId: ingredient.id, quantity: 50, unitCost: 200 }],
      });

      const [updated, movements] = await Promise.all([
        prisma.ingredient.findUniqueOrThrow({ where: { id: ingredient.id } }),
        prisma.stockTransaction.findMany({
          where: {
            ingredientId: ingredient.id,
            source: "purchase",
            referenceId: purchase.id,
          },
        }),
      ]);
      assert.equal(Number(updated.currentStock), 150);
      assert.equal(Number(updated.stockValue), 20_000);
      assert.equal(Number(updated.averageCost), 133.3333);
      assert.equal(movements.length, 1);
      assert.equal(movements[0].type, "in");
      assert.equal(Number(movements[0].quantity), 50);
      assert.equal(Number(movements[0].totalCost), 10_000);
      assert.equal(Number(movements[0].balanceAfter), 150);
      assert.equal(Number(movements[0].valueAfter), 20_000);
    } finally {
      await cleanupFixture(fixture);
    }
  },
);

test(
  "I-02: checkout menu ber-BOM mengurangi stok dan menyimpan HPP manual yang sama",
  { skip: !runDatabaseTests },
  async () => {
    const fixture = await createFixture();
    try {
      const ingredient = await addIngredient(fixture, "I-02", 100, 10);
      const category = await addCategory(fixture);
      const product = await addProduct(fixture, {
        label: "I-02",
        categoryId: category.id,
        baseHpp: 5,
        hasRecipe: true,
        recipes: [{ ingredientId: ingredient.id, quantityNeeded: 2 }],
      });
      await openShift(fixture.userId);
      const receipt = await processSale(
        fixture.userId,
        checkoutInput(product.id, 3),
      );

      const [updated, sale, movements] = await Promise.all([
        prisma.ingredient.findUniqueOrThrow({ where: { id: ingredient.id } }),
        prisma.sale.findUniqueOrThrow({
          where: { id: receipt.saleId },
          include: { details: true },
        }),
        prisma.stockTransaction.findMany({
          where: { referenceType: "sale", referenceId: receipt.saleId },
        }),
      ]);
      assert.equal(Number(updated.currentStock), 94);
      assert.equal(Number(updated.stockValue), 940);
      assert.equal(sale.details.length, 1);
      assert.equal(Number(sale.details[0].hppSnapshot), 20);
      assert.equal(sale.details[0].hppSource, "recipe");
      assert.equal(Number(sale.totalHpp), 60);
      assert.equal(movements.length, 1);
      assert.equal(Number(movements[0].quantity), 6);
      assert.equal(Number(movements[0].totalCost), 60);
    } finally {
      await cleanupFixture(fixture);
    }
  },
);

test(
  "I-03: ledger sale/out sama dengan HPP BOM; base dan fallback tanpa resep tidak membuat mutasi",
  { skip: !runDatabaseTests },
  async () => {
    const fixture = await createFixture();
    try {
      const ingredient = await addIngredient(fixture, "I-03", 20, 25);
      const category = await addCategory(fixture);
      const recipeProduct = await addProduct(fixture, {
        label: "I-03 BOM",
        categoryId: category.id,
        baseHpp: 5,
        hasRecipe: true,
        recipes: [{ ingredientId: ingredient.id, quantityNeeded: 2 }],
      });
      const baseProduct = await addProduct(fixture, {
        label: "I-03 Base",
        categoryId: category.id,
        baseHpp: 30,
        hasRecipe: false,
      });
      const fallbackProduct = await addProduct(fixture, {
        label: "I-03 Fallback",
        categoryId: category.id,
        baseHpp: 40,
        hasRecipe: true,
      });
      await openShift(fixture.userId);
      const key = randomUUID();
      const receipt = await processSale(fixture.userId, {
        ...checkoutInput(recipeProduct.id, 2, key),
        items: [
          { productId: recipeProduct.id, quantity: 2 },
          { productId: baseProduct.id, quantity: 1 },
          { productId: fallbackProduct.id, quantity: 1 },
        ],
      });

      const [details, movements] = await Promise.all([
        prisma.saleDetail.findMany({
          where: { saleId: receipt.saleId },
          orderBy: { productId: "asc" },
        }),
        prisma.stockTransaction.findMany({
          where: { referenceType: "sale", referenceId: receipt.saleId },
        }),
      ]);
      const detailByProduct = new Map(details.map((detail) => [detail.productId, detail]));
      const bomDetail = detailByProduct.get(recipeProduct.id)!;
      assert.equal(bomDetail.hppSource, "recipe");
      assert.equal(Number(bomDetail.hppSnapshot) * bomDetail.quantity, 100);
      assert.equal(
        movements.reduce((sum, movement) => sum + Number(movement.totalCost), 0),
        Number(bomDetail.hppSnapshot) * bomDetail.quantity,
      );
      assert.equal(detailByProduct.get(baseProduct.id)?.hppSource, "base");
      assert.equal(detailByProduct.get(fallbackProduct.id)?.hppSource, "fallback");
      assert.equal(movements.length, 1);
      assert.equal(movements[0].ingredientId, ingredient.id);
    } finally {
      await cleanupFixture(fixture);
    }
  },
);

test(
  "I-04: stok tidak cukup me-rollback sale, ledger, dan saldo bahan",
  { skip: !runDatabaseTests },
  async () => {
    const fixture = await createFixture();
    const idempotencyKey = randomUUID();
    try {
      const ingredient = await addIngredient(fixture, "I-04", 2, 10);
      const category = await addCategory(fixture);
      const product = await addProduct(fixture, {
        label: "I-04",
        categoryId: category.id,
        baseHpp: 20,
        hasRecipe: true,
        recipes: [{ ingredientId: ingredient.id, quantityNeeded: 2 }],
      });
      await openShift(fixture.userId);

      await assert.rejects(
        processSale(fixture.userId, checkoutInput(product.id, 2, idempotencyKey)),
        (error) => error instanceof ActionError && /Stok .* tidak cukup/.test(error.message),
      );
      const [updated, sales, movements] = await Promise.all([
        prisma.ingredient.findUniqueOrThrow({ where: { id: ingredient.id } }),
        prisma.sale.count({ where: { idempotencyKey } }),
        prisma.stockTransaction.count({
          where: { ingredientId: ingredient.id, source: "sale" },
        }),
      ]);
      assert.equal(Number(updated.currentStock), 2);
      assert.equal(Number(updated.stockValue), 20);
      assert.equal(sales, 0);
      assert.equal(movements, 0);
    } finally {
      await cleanupFixture(fixture);
    }
  },
);

test(
  "I-05: dua checkout berbeda berebut stok; tepat satu berhasil dan stok tidak negatif",
  { skip: !runDatabaseTests },
  async () => {
    const fixture = await createFixture();
    const keys = [randomUUID(), randomUUID()];
    try {
      const ingredient = await addIngredient(fixture, "I-05", 2, 10);
      const category = await addCategory(fixture);
      const product = await addProduct(fixture, {
        label: "I-05",
        categoryId: category.id,
        baseHpp: 20,
        hasRecipe: true,
        recipes: [{ ingredientId: ingredient.id, quantityNeeded: 2 }],
      });
      await openShift(fixture.userId);

      const results = await Promise.allSettled([
        processSale(fixture.userId, checkoutInput(product.id, 1, keys[0])),
        processSale(fixture.userId, checkoutInput(product.id, 1, keys[1])),
      ]);
      const fulfilled = results.filter((result) => result.status === "fulfilled");
      const rejected = results.filter((result) => result.status === "rejected");
      assert.equal(fulfilled.length, 1);
      assert.equal(rejected.length, 1);
      assert.ok(
        rejected[0].status === "rejected" &&
          rejected[0].reason instanceof ActionError &&
          /Stok .* tidak cukup/.test(rejected[0].reason.message),
      );

      const [updated, saleCount, movements] = await Promise.all([
        prisma.ingredient.findUniqueOrThrow({ where: { id: ingredient.id } }),
        prisma.sale.count({ where: { idempotencyKey: { in: keys } } }),
        prisma.stockTransaction.findMany({
          where: { ingredientId: ingredient.id, source: "sale" },
        }),
      ]);
      assert.equal(Number(updated.currentStock), 0);
      assert.equal(Number(updated.stockValue), 0);
      assert.equal(saleCount, 1);
      assert.equal(movements.length, 1);
    } finally {
      await cleanupFixture(fixture);
    }
  },
);

test(
  "I-06: harga beli baru menaikkan HPP berikutnya tanpa mengubah snapshot lama",
  { skip: !runDatabaseTests },
  async () => {
    const fixture = await createFixture();
    try {
      const ingredient = await addIngredient(fixture, "I-06", 100, 10);
      const category = await addCategory(fixture);
      const product = await addProduct(fixture, {
        label: "I-06",
        categoryId: category.id,
        baseHpp: 5,
        hasRecipe: true,
        recipes: [{ ingredientId: ingredient.id, quantityNeeded: 2 }],
      });
      await openShift(fixture.userId);
      const first = await processSale(
        fixture.userId,
        checkoutInput(product.id),
      );
      const oldSnapshotBefore = await prisma.saleDetail.findFirstOrThrow({
        where: { saleId: first.saleId, productId: product.id },
      });

      await recordPurchase(fixture.userId, {
        supplierName: "Supplier I-06",
        purchaseDate: new Date("2026-08-31T00:00:00.000Z"),
        items: [{ ingredientId: ingredient.id, quantity: 100, unitCost: 30 }],
      });
      const second = await processSale(
        fixture.userId,
        checkoutInput(product.id),
      );
      const [oldSnapshotAfter, newSnapshot, updatedIngredient] = await Promise.all([
        prisma.saleDetail.findFirstOrThrow({
          where: { saleId: first.saleId, productId: product.id },
        }),
        prisma.saleDetail.findFirstOrThrow({
          where: { saleId: second.saleId, productId: product.id },
        }),
        prisma.ingredient.findUniqueOrThrow({ where: { id: ingredient.id } }),
      ]);

      assert.equal(Number(oldSnapshotBefore.hppSnapshot), 20);
      assert.equal(Number(oldSnapshotAfter.hppSnapshot), 20);
      assert.ok(Number(updatedIngredient.averageCost) > 10);
      assert.ok(Number(newSnapshot.hppSnapshot) > Number(oldSnapshotAfter.hppSnapshot));
    } finally {
      await cleanupFixture(fixture);
    }
  },
);

test(
  "I-09: guard yang dipakai Server Action menolak sesi kasir dan menerima admin aktif",
  { skip: !runDatabaseTests },
  async () => {
    const cashierFixture = await createFixture("kasir");
    const adminFixture = await createFixture("admin");
    try {
      const cashier = await prisma.user.findUniqueOrThrow({
        where: { id: cashierFixture.userId },
      });
      const admin = await prisma.user.findUniqueOrThrow({
        where: { id: adminFixture.userId },
      });
      await assert.rejects(
        requireAdminSession({
          userId: cashier.id,
          username: cashier.username,
          role: "kasir",
          sessionVersion: cashier.sessionVersion,
        }),
        (error) =>
          error instanceof AuthorizationError &&
          /tidak memiliki akses/.test(error.message),
      );
      const accepted = await requireAdminSession({
        userId: admin.id,
        username: admin.username,
        role: "admin",
        sessionVersion: admin.sessionVersion,
      });
      assert.equal(accepted.userId, admin.id);
    } finally {
      await cleanupFixture(cashierFixture);
      await cleanupFixture(adminFixture);
    }
  },
);
