import { Prisma } from "@/generated/prisma";
import { ActionError } from "@/lib/action-result";
import {
  applyStockInAtAverageCost,
  applyStockOut,
} from "@/lib/costing";
import { formatQuantity, roundRupiah } from "@/lib/money";
import { parseDateOnly, toWibDateString } from "@/lib/period";
import { prisma } from "@/lib/prisma";

type LockedIngredient = {
  id: number;
  name: string;
  unit: string;
  currentStock: Prisma.Decimal;
  stockValue: Prisma.Decimal;
  averageCost: Prisma.Decimal;
};

export type InventoryMutationInput =
  | {
      kind: "adjustment";
      ingredientId: number;
      physicalStock: number;
      notes: string;
    }
  | {
      kind: "waste";
      ingredientId: number;
      quantity: number;
      notes: string;
    };

export type InventoryMutationResult = {
  ingredientId: number;
  ingredientName: string;
  type: "in" | "out";
  source: "adjustment" | "waste";
  quantity: number;
  totalCost: number;
  balanceAfter: number;
  valueAfter: number;
  stockTransactionId: number;
  expenseId: number | null;
};

function roundQuantity(value: number) {
  return Math.round(value * 1000) / 1000;
}

/**
 * Mencatat opname atau waste secara atomik.
 *
 * Baris bahan dikunci agar checkout, pembelian, dan penyesuaian bersamaan tidak
 * menghitung dari saldo lama yang sama. Mutasi stok menjadi sumber audit utama;
 * waste juga membuat OPEX tertaut dalam transaksi database yang sama.
 */
export async function processInventoryMutation(
  userId: number,
  input: InventoryMutationInput,
): Promise<InventoryMutationResult> {
  const notes = input.notes.trim();
  if (!notes) throw new ActionError("Keterangan penyesuaian wajib diisi.");

  return prisma.$transaction(async (tx) => {
    const [ingredient] = await tx.$queryRaw<LockedIngredient[]>(Prisma.sql`
      SELECT
        id,
        name,
        unit,
        current_stock AS "currentStock",
        stock_value AS "stockValue",
        average_cost AS "averageCost"
      FROM ingredients
      WHERE id = ${input.ingredientId}
      FOR UPDATE
    `);
    if (!ingredient) throw new ActionError("Bahan baku tidak ditemukan.");

    const currentStock = Number(ingredient.currentStock);
    const currentValue = Number(ingredient.stockValue);
    let type: "in" | "out";
    let source: "adjustment" | "waste";
    let quantity: number;

    if (input.kind === "adjustment") {
      const difference = roundQuantity(input.physicalStock - currentStock);
      if (difference === 0) {
        throw new ActionError(
          "Stok fisik sama dengan stok sistem; tidak ada selisih untuk dicatat.",
        );
      }
      type = difference > 0 ? "in" : "out";
      source = "adjustment";
      quantity = Math.abs(difference);
    } else {
      type = "out";
      source = "waste";
      quantity = roundQuantity(input.quantity);
    }

    let next;
    try {
      next =
        type === "in"
          ? applyStockInAtAverageCost(ingredient, quantity)
          : applyStockOut(ingredient, quantity);
    } catch (error) {
      if (error instanceof Error && /Stok tidak cukup/.test(error.message)) {
        throw new ActionError(
          `Stok ${ingredient.name} tidak cukup. Dibutuhkan ${formatQuantity(quantity)} ${ingredient.unit}, tersedia ${formatQuantity(currentStock)} ${ingredient.unit}.`,
        );
      }
      throw error;
    }

    // Menggunakan perubahan nilai aktual menjaga rekonsiliasi tetap eksak,
    // termasuk saat mutasi terakhir memaksa nilai persediaan menjadi nol.
    const totalCost = roundRupiah(Math.abs(next.stockValue - currentValue));

    await tx.ingredient.update({
      where: { id: ingredient.id },
      data: {
        currentStock: next.currentStock,
        stockValue: next.stockValue,
        averageCost: next.averageCost,
      },
    });

    const movement = await tx.stockTransaction.create({
      data: {
        ingredientId: ingredient.id,
        type,
        quantity,
        unitCost: ingredient.averageCost,
        totalCost,
        balanceAfter: next.currentStock,
        valueAfter: next.stockValue,
        source,
        notes,
        createdBy: userId,
      },
    });

    const expense =
      source === "waste"
        ? await tx.operationalExpense.create({
            data: {
              description: `Waste ${ingredient.name}: ${notes}`,
              category: "lain_lain",
              amount: totalCost,
              expenseDate: parseDateOnly(toWibDateString()),
              createdBy: userId,
              stockTransactionId: movement.id,
            },
          })
        : null;

    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      type,
      source,
      quantity,
      totalCost,
      balanceAfter: next.currentStock,
      valueAfter: next.stockValue,
      stockTransactionId: movement.id,
      expenseId: expense?.id ?? null,
    };
  });
}
