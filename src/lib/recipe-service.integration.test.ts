import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { prisma } from "./prisma";
import { replaceProductRecipe } from "./recipe-service";

const runDatabaseTests = process.env.RUN_DB_TESTS === "1";

test(
  "TASK-025: penggantian resep dan pengosongan BOM diaudit atomik",
  { skip: !runDatabaseTests },
  async () => {
    const suffix = randomUUID().slice(0, 8);
    const admin = await prisma.user.create({
      data: {
        name: `RECIPE Admin ${suffix}`,
        username: `recipe-${suffix}`,
        passwordHash: "integration-test-only",
        role: "admin",
      },
    });
    const category = await prisma.productCategory.create({
      data: { name: `Recipe ${suffix}`, slug: `recipe-${suffix}`, sortOrder: 900 },
    });
    const ingredient = await prisma.ingredient.create({
      data: { name: `Bahan Recipe ${suffix}`, unit: "gram" },
    });
    const product = await prisma.product.create({
      data: {
        categoryId: category.id,
        name: `Menu Recipe ${suffix}`,
        sellingPrice: 20_000,
        baseHpp: 5_000,
      },
    });

    try {
      await prisma.$transaction((tx) =>
        replaceProductRecipe(
          tx,
          product.id,
          [{ ingredientId: ingredient.id, quantityNeeded: 12.5 }],
          admin.id,
        ),
      );
      await prisma.$transaction((tx) =>
        replaceProductRecipe(tx, product.id, [], admin.id),
      );

      const [storedProduct, logs] = await Promise.all([
        prisma.product.findUniqueOrThrow({ where: { id: product.id } }),
        prisma.auditLog.findMany({
          where: { entity: "recipe", entityId: product.id },
          orderBy: { id: "asc" },
        }),
      ]);
      assert.equal(storedProduct.hasRecipe, false);
      assert.equal(logs.length, 2);
      assert.deepEqual(logs.map((log) => log.action), ["update", "update"]);
      assert.equal(
        ((logs[0].afterData as { ingredients: unknown[] }).ingredients).length,
        1,
      );
      assert.equal(
        ((logs[1].afterData as { ingredients: unknown[] }).ingredients).length,
        0,
      );
    } finally {
      await prisma.auditLog.deleteMany({
        where: { entity: "recipe", entityId: product.id },
      });
      await prisma.product.deleteMany({ where: { id: product.id } });
      await prisma.ingredient.deleteMany({ where: { id: ingredient.id } });
      await prisma.productCategory.deleteMany({ where: { id: category.id } });
      await prisma.user.deleteMany({ where: { id: admin.id } });
    }
  },
);
