import { Prisma } from "@/generated/prisma/client";
import { ActionError } from "@/lib/action-result";
import { applyStockOut, calculateProductHpp } from "@/lib/costing";
import { formatQuantity, formatRupiah, roundRupiah } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { createSaleRequestFingerprint } from "@/lib/sale-idempotency";
import {
  calculateCashChange,
  calculateTransactionTotals,
} from "@/lib/transaction-totals";

export type CheckoutInput = {
  idempotencyKey: string;
  paymentMethod: "cash" | "qris" | "transfer";
  discountAmount: number;
  taxRate: number;
  cashReceived: number | null;
  items: Array<{ productId: number; quantity: number }>;
};

export type SaleReceipt = {
  invoiceNumber: string;
  saleId: number;
  subtotalAmount: number;
  discountAmount: number;
  netAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  cashReceived: number | null;
  changeAmount: number | null;
};

type SaleDetailInput = {
  productId: number;
  productName: string;
  quantity: number;
  sellingPrice: Prisma.Decimal;
  hppSnapshot: Prisma.Decimal;
  hppSource: "recipe" | "base" | "fallback";
  subtotal: Prisma.Decimal;
  grossProfitSnapshot: Prisma.Decimal;
};

type LockedIngredient = {
  id: number;
  name: string;
  unit: string;
  currentStock: Prisma.Decimal;
  stockValue: Prisma.Decimal;
  averageCost: Prisma.Decimal;
};

type LockedShift = { id: number };

type StoredSale = {
  id: number;
  invoiceNumber: string;
  cashierId: number;
  requestFingerprint: string;
  subtotalAmount: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  netAmount: Prisma.Decimal;
  taxRate: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  cashReceived: Prisma.Decimal | null;
  changeAmount: Prisma.Decimal | null;
};

function toReceipt(sale: StoredSale): SaleReceipt {
  return {
    invoiceNumber: sale.invoiceNumber,
    saleId: sale.id,
    subtotalAmount: Number(sale.subtotalAmount),
    discountAmount: Number(sale.discountAmount),
    netAmount: Number(sale.netAmount),
    taxRate: Number(sale.taxRate),
    taxAmount: Number(sale.taxAmount),
    totalAmount: Number(sale.totalAmount),
    cashReceived:
      sale.cashReceived === null ? null : Number(sale.cashReceived),
    changeAmount:
      sale.changeAmount === null ? null : Number(sale.changeAmount),
  };
}

function replayStoredSale(
  sale: StoredSale,
  cashierId: number,
  requestFingerprint: string,
): SaleReceipt {
  if (
    sale.cashierId !== cashierId ||
    sale.requestFingerprint !== requestFingerprint
  ) {
    throw new ActionError(
      "Kunci transaksi sudah digunakan untuk checkout yang berbeda. Kosongkan keranjang untuk memulai transaksi baru.",
    );
  }

  return toReceipt(sale);
}

/** Checkout tervalidasi, dipisah dari Server Action agar retry dapat diuji. */
export async function processSale(
  cashierId: number,
  input: CheckoutInput,
): Promise<SaleReceipt> {
  const requestFingerprint = createSaleRequestFingerprint(input);
  const existingSale = await prisma.sale.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });

  if (existingSale) {
    return replayStoredSale(existingSale, cashierId, requestFingerprint);
  }

  const productIds = input.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: {
      id: true,
      name: true,
      sellingPrice: true,
      baseHpp: true,
      hasRecipe: true,
      recipes: {
        select: {
          ingredientId: true,
          quantityNeeded: true,
        },
      },
    },
  });
  const productsById = new Map(products.map((product) => [product.id, product]));

  for (const productId of productIds) {
    if (!productsById.has(productId)) {
      throw new ActionError(
        `Menu ID ${productId} tidak ditemukan atau tidak aktif.`,
      );
    }
  }

  const ingredientNeeds = new Map<number, number>();
  for (const item of input.items) {
    const product = productsById.get(item.productId)!;
    if (product.hasRecipe && product.recipes.length > 0) {
      for (const recipe of product.recipes) {
        const needed = Number(recipe.quantityNeeded) * item.quantity;
        ingredientNeeds.set(
          recipe.ingredientId,
          (ingredientNeeds.get(recipe.ingredientId) ?? 0) + needed,
        );
      }
    }
  }
  const ingredientIds = [...ingredientNeeds.keys()].sort((a, b) => a - b);

  try {
    const sale = await prisma.$transaction(async (tx) => {
      // Kunci shift lebih dulu. Penutupan shift memakai lock yang sama sehingga
      // checkout tidak dapat menyelinap setelah expected cash dihitung.
      const [openShift] = await tx.$queryRaw<LockedShift[]>(Prisma.sql`
        SELECT id
        FROM cashier_shifts
        WHERE cashier_id = ${cashierId}
          AND status = 'open'
        FOR UPDATE
      `);
      if (!openShift) {
        throw new ActionError("Buka shift kasir sebelum melakukan checkout.");
      }

      const lockedIngredients =
        ingredientIds.length === 0
          ? []
          : await tx.$queryRaw<LockedIngredient[]>(Prisma.sql`
              SELECT
                id,
                name,
                unit,
                current_stock AS "currentStock",
                stock_value AS "stockValue",
                average_cost AS "averageCost"
              FROM ingredients
              WHERE id IN (${Prisma.join(ingredientIds)})
              ORDER BY id
              FOR UPDATE
            `);

      if (lockedIngredients.length !== ingredientIds.length) {
        throw new ActionError("Salah satu bahan resep tidak ditemukan.");
      }
      const lockedById = new Map(
        lockedIngredients.map((ingredient) => [ingredient.id, ingredient]),
      );

      for (const ingredient of lockedIngredients) {
        const needed = ingredientNeeds.get(ingredient.id)!;
        const available = Number(ingredient.currentStock);
        if (available < needed) {
          throw new ActionError(
            `Stok ${ingredient.name} tidak cukup. Dibutuhkan ${formatQuantity(needed)} ${ingredient.unit}, tersedia ${formatQuantity(available)} ${ingredient.unit}.`,
          );
        }
      }

      let subtotalAmount = new Prisma.Decimal(0);
      let totalHpp = new Prisma.Decimal(0);
      const saleDetails: SaleDetailInput[] = [];

      for (const item of input.items) {
        const product = productsById.get(item.productId)!;
        const { hpp, source } = calculateProductHpp({
          baseHpp: product.baseHpp,
          hasRecipe: product.hasRecipe,
          recipeCosts: product.recipes.map((recipe) => ({
            quantityNeeded: recipe.quantityNeeded,
            averageCost: lockedById.get(recipe.ingredientId)?.averageCost ?? 0,
          })),
        });
        const sellingPrice = new Prisma.Decimal(product.sellingPrice);
        const hppSnapshot = new Prisma.Decimal(hpp);
        const subtotal = sellingPrice
          .mul(item.quantity)
          .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
        const hppTotal = hppSnapshot
          .mul(item.quantity)
          .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);

        subtotalAmount = subtotalAmount.plus(subtotal);
        totalHpp = totalHpp.plus(hppTotal);
        saleDetails.push({
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          sellingPrice,
          hppSnapshot,
          hppSource: source,
          subtotal,
          grossProfitSnapshot: subtotal.minus(hppTotal),
        });
      }

      let totals;
      try {
        totals = calculateTransactionTotals({
          subtotalAmount,
          discountAmount: input.discountAmount,
          taxRate: input.taxRate,
          totalHpp,
        });
      } catch (error) {
        if (error instanceof RangeError) throw new ActionError(error.message);
        throw error;
      }

      const receivedAmount =
        input.paymentMethod === "cash"
          ? new Prisma.Decimal(input.cashReceived ?? 0).toDecimalPlaces(
              0,
              Prisma.Decimal.ROUND_HALF_UP,
            )
          : null;
      let changeAmount: Prisma.Decimal | null = null;
      if (receivedAmount) {
        try {
          changeAmount = calculateCashChange(totals.totalAmount, receivedAmount);
        } catch (error) {
          if (error instanceof RangeError) {
            throw new ActionError(
              `Uang diterima kurang ${formatRupiah(totals.totalAmount.minus(receivedAmount))}.`,
            );
          }
          throw error;
        }
      }

      const [invoice] = await tx.$queryRaw<{ invoiceNumber: string }[]>`
        SELECT
          'TRX-'
          || to_char(NOW() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD')
          || '-'
          || lpad(nextval('sales_invoice_seq')::text, 5, '0')
          AS "invoiceNumber"
      `;
      if (!invoice?.invoiceNumber) {
        throw new ActionError("Nomor invoice tidak dapat dibangkitkan.");
      }

      const createdSale = await tx.sale.create({
        data: {
          invoiceNumber: invoice.invoiceNumber,
          idempotencyKey: input.idempotencyKey,
          requestFingerprint,
          cashierId,
          shiftId: openShift.id,
          ...totals,
          paymentMethod: input.paymentMethod,
          cashReceived: receivedAmount,
          changeAmount,
          details: { create: saleDetails },
        },
      });

      for (const ingredient of lockedIngredients) {
        const quantity = ingredientNeeds.get(ingredient.id)!;
        const next = applyStockOut(ingredient, quantity);
        const unitCost = Number(ingredient.averageCost);
        await tx.ingredient.update({ where: { id: ingredient.id }, data: next });
        await tx.stockTransaction.create({
          data: {
            ingredientId: ingredient.id,
            type: "out",
            quantity,
            unitCost,
            totalCost: roundRupiah(quantity * unitCost),
            balanceAfter: next.currentStock,
            valueAfter: next.stockValue,
            source: "sale",
            referenceType: "sale",
            referenceId: createdSale.id,
            createdBy: cashierId,
          },
        });
      }

      return createdSale;
    });

    return toReceipt(sale);
  } catch (error) {
    // UNIQUE menjadi arbiter request paralel. Efek transaksi yang kalah telah
    // rollback sebelum hasil pemenang dibaca di luar transaksi.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const winningSale = await prisma.sale.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (winningSale) {
        return replayStoredSale(winningSale, cashierId, requestFingerprint);
      }
    }

    throw error;
  }
}
