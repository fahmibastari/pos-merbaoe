import { Prisma } from "@/generated/prisma";
import { ActionError } from "./action-result";
import { auditJson } from "./audit";

export type RecipeRowInput = {
  ingredientId: number;
  quantityNeeded: number;
};

/**
 * Mengganti seluruh komposisi resep dalam transaksi yang disediakan pemanggil.
 * Penguncian produk membuat dua penyimpanan resep untuk menu yang sama berjalan
 * berurutan, sedangkan pembaruan `hasRecipe` selalu satu atom dengan baris BOM.
 */
export async function replaceProductRecipe(
  tx: Prisma.TransactionClient,
  productId: number,
  rows: RecipeRowInput[],
  userId: number,
) {
  const lockedProduct = await tx.$queryRaw<{ id: number }[]>(Prisma.sql`
    SELECT id
    FROM products
    WHERE id = ${productId}
    FOR UPDATE
  `);
  if (lockedProduct.length === 0) {
    throw new ActionError("Produk tidak ditemukan.");
  }

  const before = await tx.recipe.findMany({
    where: { productId },
    orderBy: [{ ingredient: { name: "asc" } }, { ingredientId: "asc" }],
    include: { ingredient: { select: { name: true } } },
  });

  if (rows.length > 0) {
    const ingredients = await tx.ingredient.findMany({
      where: { id: { in: rows.map((row) => row.ingredientId) } },
      select: { id: true },
    });
    if (ingredients.length !== rows.length) {
      throw new ActionError("Salah satu bahan baku tidak ditemukan.");
    }
  }

  await tx.recipe.deleteMany({ where: { productId } });
  if (rows.length > 0) {
    await tx.recipe.createMany({
      data: rows.map((row) => ({ productId, ...row })),
    });
  }
  await tx.product.update({
    where: { id: productId },
    data: { hasRecipe: rows.length > 0 },
  });
  const after = await tx.recipe.findMany({
    where: { productId },
    orderBy: [{ ingredient: { name: "asc" } }, { ingredientId: "asc" }],
    include: { ingredient: { select: { name: true } } },
  });
  await tx.auditLog.create({
    data: {
      userId,
      action: "update",
      entity: "recipe",
      entityId: productId,
      beforeData: auditJson({
        ingredients: before.map((row) => ({
          ingredientId: row.ingredientId,
          ingredientName: row.ingredient.name,
          quantityNeeded: row.quantityNeeded,
        })),
      }),
      afterData: auditJson({
        ingredients: after.map((row) => ({
          ingredientId: row.ingredientId,
          ingredientName: row.ingredient.name,
          quantityNeeded: row.quantityNeeded,
        })),
      }),
    },
  });
}
