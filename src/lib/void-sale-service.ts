import { Prisma } from "@/generated/prisma/client";
import { ActionError } from "@/lib/action-result";
import { applyHistoricalStockReturn } from "@/lib/costing";
import { prisma } from "@/lib/prisma";

type LockedSale = {
  id: number;
  invoiceNumber: string;
  status: "completed" | "voided";
  voidReason: string | null;
  voidedBy: number | null;
  voidedAt: Date | null;
};

type LockedIngredient = {
  id: number;
  currentStock: Prisma.Decimal;
  stockValue: Prisma.Decimal;
  averageCost: Prisma.Decimal;
};

type HistoricalMovement = {
  ingredientId: number;
  quantity: Prisma.Decimal;
  unitCost: Prisma.Decimal;
  totalCost: Prisma.Decimal;
};

export type VoidSaleResult = {
  saleId: number;
  invoiceNumber: string;
  voidedAt: Date;
};

/**
 * Membatalkan penjualan dan membalik mutasi persediaannya secara atomik.
 *
 * Mutasi `sale` asli adalah snapshot konsumsi bahan yang otoritatif. Membaca
 * resep produk saat void akan salah bila resep sudah berubah sejak checkout.
 */
export async function processSaleVoid(
  saleId: number,
  adminId: number,
  reason: string,
): Promise<VoidSaleResult> {
  return prisma.$transaction(async (tx) => {
    const [sale] = await tx.$queryRaw<LockedSale[]>(Prisma.sql`
      SELECT
        id,
        invoice_number AS "invoiceNumber",
        status,
        void_reason AS "voidReason",
        voided_by AS "voidedBy",
        voided_at AS "voidedAt"
      FROM sales
      WHERE id = ${saleId}
      FOR UPDATE
    `);

    if (!sale) throw new ActionError("Transaksi tidak ditemukan.");
    if (sale.status === "voided") {
      throw new ActionError("Transaksi ini sudah dibatalkan sebelumnya.");
    }

    const originalMovements = await tx.stockTransaction.findMany({
      where: {
        referenceType: "sale",
        referenceId: sale.id,
        source: "sale",
        type: "out",
      },
      select: {
        ingredientId: true,
        quantity: true,
        unitCost: true,
        totalCost: true,
      },
      orderBy: { ingredientId: "asc" },
    });

    // Agregasi defensif: checkout saat ini menulis satu baris per bahan, tetapi
    // reversal tetap benar untuk data lama yang mungkin memiliki beberapa baris.
    const movementByIngredient = new Map<number, HistoricalMovement>();
    for (const movement of originalMovements) {
      const previous = movementByIngredient.get(movement.ingredientId);
      movementByIngredient.set(
        movement.ingredientId,
        previous
          ? {
              ...previous,
              quantity: previous.quantity.plus(movement.quantity),
              totalCost: previous.totalCost.plus(movement.totalCost),
              unitCost: previous.totalCost
                .plus(movement.totalCost)
                .div(previous.quantity.plus(movement.quantity))
                .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP),
            }
          : movement,
      );
    }

    const ingredientIds = [...movementByIngredient.keys()].sort(
      (left, right) => left - right,
    );
    const lockedIngredients =
      ingredientIds.length === 0
        ? []
        : await tx.$queryRaw<LockedIngredient[]>(Prisma.sql`
            SELECT
              id,
              current_stock AS "currentStock",
              stock_value AS "stockValue",
              average_cost AS "averageCost"
            FROM ingredients
            WHERE id IN (${Prisma.join(ingredientIds)})
            ORDER BY id
            FOR UPDATE
          `);

    if (lockedIngredients.length !== ingredientIds.length) {
      throw new ActionError(
        "Bahan baku transaksi tidak lengkap; pembatalan dibatalkan agar stok tetap konsisten.",
      );
    }

    const voidedAt = new Date();
    for (const ingredient of lockedIngredients) {
      const movement = movementByIngredient.get(ingredient.id)!;
      const next = applyHistoricalStockReturn(
        ingredient,
        movement.quantity,
        movement.totalCost,
      );

      await tx.ingredient.update({
        where: { id: ingredient.id },
        data: next,
      });
      await tx.stockTransaction.create({
        data: {
          ingredientId: ingredient.id,
          type: "in",
          quantity: movement.quantity,
          unitCost: movement.unitCost,
          totalCost: movement.totalCost,
          balanceAfter: next.currentStock,
          valueAfter: next.stockValue,
          source: "sale_void",
          referenceType: "sale",
          referenceId: sale.id,
          notes: `Void ${sale.invoiceNumber}: ${reason}`.slice(0, 255),
          createdBy: adminId,
          transactionDate: voidedAt,
        },
      });
    }

    await tx.sale.update({
      where: { id: sale.id },
      data: {
        status: "voided",
        voidReason: reason,
        voidedBy: adminId,
        voidedAt,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: "void",
        entity: "sale",
        entityId: sale.id,
        beforeData: {
          status: sale.status,
          voidReason: sale.voidReason,
          voidedBy: sale.voidedBy,
          voidedAt: sale.voidedAt?.toISOString() ?? null,
        },
        afterData: {
          status: "voided",
          voidReason: reason,
          voidedBy: adminId,
          voidedAt: voidedAt.toISOString(),
        },
      },
    });

    return { saleId: sale.id, invoiceNumber: sale.invoiceNumber, voidedAt };
  });
}
