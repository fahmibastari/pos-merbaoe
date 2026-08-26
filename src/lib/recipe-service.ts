import { Prisma } from "@/generated/prisma";
import { ActionError } from "./action-result";

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
}
