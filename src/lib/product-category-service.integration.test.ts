import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { ActionError } from "./action-result";
import {
  createProductCategory,
  setProductCategoryActive,
  updateProductCategory,
} from "./product-category-service";
import { prisma } from "./prisma";

const runDatabaseTests = process.env.RUN_DB_TESTS === "1";

test(
  "I-11: kategori diaudit dan tidak dapat dinonaktifkan saat dipakai menu aktif",
  { skip: !runDatabaseTests },
  async () => {
    const suffix = randomUUID().slice(0, 8);
    const admin = await prisma.user.create({
      data: {
        name: `CATEGORY Admin ${suffix}`,
        username: `category-${suffix}`,
        passwordHash: "integration-test-only",
        role: "admin",
      },
    });
    let categoryId: number | null = null;
    let productId: number | null = null;

    try {
      const category = await createProductCategory(admin.id, {
        name: `Cemilan ${suffix}`,
        sortOrder: 30,
      });
      categoryId = category.id;

      const product = await prisma.product.create({
        data: {
          categoryId: category.id,
          name: `Snack ${suffix}`,
          sellingPrice: 10_000,
          baseHpp: 4_000,
          hasRecipe: false,
        },
      });
      productId = product.id;

      await assert.rejects(
        setProductCategoryActive(admin.id, category.id, false),
        (error) =>
          error instanceof ActionError && /menu aktif/.test(error.message),
      );

      const renamed = await updateProductCategory(admin.id, category.id, {
        name: `Makanan Ringan ${suffix}`,
        sortOrder: 35,
      });
      assert.equal(renamed.sortOrder, 35);
      assert.match(renamed.slug, /^makanan-ringan-/);

      await prisma.product.update({
        where: { id: product.id },
        data: { isActive: false },
      });
      const deactivated = await Promise.all([
        setProductCategoryActive(admin.id, category.id, false),
        setProductCategoryActive(admin.id, category.id, false),
      ]);
      assert.deepEqual(deactivated.map((entry) => entry.isActive), [false, false]);

      const activated = await Promise.all([
        setProductCategoryActive(admin.id, category.id, true),
        setProductCategoryActive(admin.id, category.id, true),
      ]);
      assert.deepEqual(activated.map((entry) => entry.isActive), [true, true]);

      const actions = await prisma.auditLog.findMany({
        where: { entity: "product_category", entityId: category.id },
        orderBy: { id: "asc" },
        select: { action: true },
      });
      assert.deepEqual(
        actions.map((entry) => entry.action),
        ["create", "update", "deactivate", "activate"],
      );
    } finally {
      if (categoryId !== null) {
        await prisma.auditLog.deleteMany({
          where: { entity: "product_category", entityId: categoryId },
        });
      }
      if (productId !== null) {
        await prisma.product.deleteMany({ where: { id: productId } });
      }
      if (categoryId !== null) {
        await prisma.productCategory.deleteMany({ where: { id: categoryId } });
      }
      await prisma.user.deleteMany({ where: { id: admin.id } });
    }
  },
);
