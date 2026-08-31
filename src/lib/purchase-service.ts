import { Prisma } from "@/generated/prisma";
import { randomUUID } from "node:crypto";
import { ActionError } from "@/lib/action-result";
import { applyStockIn } from "@/lib/costing";
import { roundRupiah } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export type PurchaseInput = {
  supplierName?: string | null;
  purchaseDate: Date;
  items: Array<{
    ingredientId: number;
    quantity: number;
    unitCost: number;
  }>;
};

type LockedIngredientCost = {
  id: number;
  currentStock: Prisma.Decimal;
  stockValue: Prisma.Decimal;
  averageCost: Prisma.Decimal;
};

/**
 * Mencatat pembelian dan memperbarui buku besar persediaan secara atomis.
 * Validasi bentuk input tetap dilakukan Server Action sebelum service dipanggil.
 */
export async function recordPurchase(actorId: number, input: PurchaseInput) {
  const ingredientIds = input.items.map((item) => item.ingredientId);
  const subtotals = input.items.map((item) =>
    roundRupiah(item.quantity * item.unitCost),
  );
  const totalAmount = subtotals.reduce((total, subtotal) => total + subtotal, 0);
  const invoiceNumber = `INV-${Date.now()}-${randomUUID().slice(0, 8)}`;

  return prisma.$transaction(async (tx) => {
    const sortedIngredientIds = [...ingredientIds].sort((a, b) => a - b);
    const lockedIngredients = await tx.$queryRaw<LockedIngredientCost[]>(
      Prisma.sql`
        SELECT
          id,
          current_stock AS "currentStock",
          stock_value AS "stockValue",
          average_cost AS "averageCost"
        FROM ingredients
        WHERE id IN (${Prisma.join(sortedIngredientIds)})
          AND is_active = true
        ORDER BY id
        FOR UPDATE
      `,
    );

    if (lockedIngredients.length !== sortedIngredientIds.length) {
      throw new ActionError(
        "Salah satu bahan baku tidak ditemukan atau sudah nonaktif.",
      );
    }

    const lockedById = new Map(
      lockedIngredients.map((ingredient) => [ingredient.id, ingredient]),
    );
    const purchase = await tx.purchase.create({
      data: {
        invoiceNumber,
        supplierName: input.supplierName || null,
        totalAmount,
        purchaseDate: input.purchaseDate,
        createdBy: actorId,
        details: {
          create: input.items.map((item, index) => ({
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            subtotal: subtotals[index],
          })),
        },
      },
    });

    for (let index = 0; index < input.items.length; index += 1) {
      const item = input.items[index];
      const current = lockedById.get(item.ingredientId)!;
      const next = applyStockIn(current, item.quantity, item.unitCost);

      await tx.ingredient.update({
        where: { id: item.ingredientId },
        data: next,
      });
      await tx.stockTransaction.create({
        data: {
          ingredientId: item.ingredientId,
          type: "in",
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: subtotals[index],
          balanceAfter: next.currentStock,
          valueAfter: next.stockValue,
          source: "purchase",
          referenceType: "purchase",
          referenceId: purchase.id,
          createdBy: actorId,
        },
      });
    }

    return {
      id: purchase.id,
      invoiceNumber: purchase.invoiceNumber,
      totalAmount,
    };
  });
}
