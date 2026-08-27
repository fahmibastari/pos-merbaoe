"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/guard";
import {
  parseOrThrow, field, fields,
  ingredientSchema, ingredientUpdateSchema, idSchema,
  productSchema, productUpdateSchema, toggleActiveSchema,
  recipeSchema, purchaseSchema, expenseSchema,
  voidSaleSchema, inventoryMutationSchema,
} from "@/lib/validation";
import { parseWibDate } from "@/lib/period";
import { roundRupiah } from "@/lib/money";
import { applyStockIn } from "@/lib/costing";
import { replaceProductRecipe } from "@/lib/recipe-service";
import { Prisma } from "@/generated/prisma";
import {
  ActionError,
  actionFailure,
  actionSuccess,
} from "@/lib/action-result";
import { processSaleVoid } from "@/lib/void-sale-service";
import { calculateShiftCash } from "@/lib/shift-service";
import { processInventoryMutation } from "@/lib/inventory-adjustment-service";
import {
  deleteProductImage,
  imageFileFrom,
  uploadProductImage,
} from "@/lib/product-image";

type LockedIngredientCost = {
  id: number;
  currentStock: Prisma.Decimal;
  stockValue: Prisma.Decimal;
  averageCost: Prisma.Decimal;
};

type LockedExpenseShift = {
  id: number;
  openingCash: Prisma.Decimal;
  status: "open" | "closed";
};

// ── Ingredient Actions ────────────────────────────────────────────────────────
export async function createIngredient(formData: FormData) {
  try {
    await requireAdmin();
    const data = parseOrThrow(ingredientSchema, {
      name: field(formData, "name"),
      unit: field(formData, "unit"),
      minimumStock: field(formData, "minimumStock") || 0,
    });

    await prisma.ingredient.create({ data: { ...data, currentStock: 0 } });
    revalidatePath("/admin/ingredients");
    return actionSuccess({ message: "Bahan baku berhasil ditambahkan." });
  } catch (error) {
    return actionFailure(error, { actionName: "createIngredient" });
  }
}

export async function updateIngredient(formData: FormData) {
  try {
    await requireAdmin();
    const { id, ...data } = parseOrThrow(ingredientUpdateSchema, {
      id: field(formData, "id"),
      name: field(formData, "name"),
      unit: field(formData, "unit"),
      minimumStock: field(formData, "minimumStock") || 0,
    });

    await prisma.ingredient.update({ where: { id }, data });
    revalidatePath("/admin/ingredients");
    return actionSuccess({ message: "Bahan baku berhasil diperbarui." });
  } catch (error) {
    return actionFailure(error, { actionName: "updateIngredient" });
  }
}

export async function toggleIngredientActive(formData: FormData) {
  try {
    await requireAdmin();
    const { id, isActive } = parseOrThrow(toggleActiveSchema, {
      id: field(formData, "id"),
      isActive: field(formData, "isActive"),
    });
    await prisma.ingredient.update({
      where: { id },
      data: { isActive: !isActive },
    });
    revalidatePath("/admin/ingredients");
    revalidatePath("/admin/purchases");
    revalidatePath("/admin/products");
    revalidatePath("/admin/dashboard");
    return actionSuccess({
      message: `Bahan baku berhasil ${isActive ? "dinonaktifkan" : "diaktifkan"}.`,
    });
  } catch (error) {
    return actionFailure(error, { actionName: "toggleIngredientActive" });
  }
}

export async function adjustInventory(formData: FormData) {
  try {
    const session = await requireAdmin();
    const input = parseOrThrow(inventoryMutationSchema, {
      kind: field(formData, "kind"),
      ingredientId: field(formData, "ingredientId"),
      physicalStock: field(formData, "physicalStock"),
      quantity: field(formData, "quantity"),
      notes: field(formData, "notes"),
    });

    const result = await processInventoryMutation(session.userId, input);
    revalidatePath("/admin/ingredients");
    revalidatePath("/admin/ingredients/adjustment");
    revalidatePath(`/admin/ingredients/${result.ingredientId}/card`);
    revalidatePath("/admin/expenses");
    revalidatePath("/admin/dashboard");

    const direction = result.type === "in" ? "bertambah" : "berkurang";
    return actionSuccess({
      ...result,
      message:
        result.source === "waste"
          ? `Waste ${result.ingredientName} berhasil dicatat dan beban otomatis telah dibuat.`
          : `Opname ${result.ingredientName} berhasil dicatat; stok ${direction}.`,
    });
  } catch (error) {
    return actionFailure(error, { actionName: "adjustInventory" });
  }
}

// ── Product Actions ───────────────────────────────────────────────────────────
export async function createProduct(formData: FormData) {
  let uploadedImagePath: string | null = null;
  try {
    await requireAdmin();
    const data = parseOrThrow(productSchema, {
      name: field(formData, "name"),
      sellingPrice: field(formData, "sellingPrice"),
      baseHpp: field(formData, "baseHpp") || 0,
    });

    const image = imageFileFrom(formData);
    if (image) uploadedImagePath = await uploadProductImage(image);

    await prisma.product.create({
      data: {
        ...data,
        imagePath: uploadedImagePath,
        hasRecipe: false,
        isActive: true,
      },
    });
    // Setelah commit basis data, foto bukan lagi orphan yang boleh dibersihkan
    // oleh jalur galat revalidation.
    uploadedImagePath = null;
    revalidatePath("/admin/products");
    revalidatePath("/cashier");
    return actionSuccess({ message: "Produk berhasil ditambahkan." });
  } catch (error) {
    if (uploadedImagePath) {
      try {
        await deleteProductImage(uploadedImagePath);
      } catch (cleanupError) {
        console.error("[Product image cleanup:create]", cleanupError);
      }
    }
    return actionFailure(error, { actionName: "createProduct" });
  }
}

export async function updateProduct(formData: FormData) {
  let uploadedImagePath: string | null = null;
  try {
    await requireAdmin();
    const { id, ...data } = parseOrThrow(productUpdateSchema, {
      id: field(formData, "id"),
      name: field(formData, "name"),
      sellingPrice: field(formData, "sellingPrice"),
      baseHpp: field(formData, "baseHpp") || 0,
    });

    const current = await prisma.product.findUnique({
      where: { id },
      select: { imagePath: true },
    });
    if (!current) throw new ActionError("Produk tidak ditemukan.");

    const image = imageFileFrom(formData);
    const removeImage = field(formData, "removeImage") === "true";
    if (image) uploadedImagePath = await uploadProductImage(image);
    const nextImagePath = image
      ? uploadedImagePath
      : removeImage
        ? null
        : current.imagePath;

    await prisma.product.update({
      where: { id },
      data: { ...data, imagePath: nextImagePath },
    });
    uploadedImagePath = null;

    if (current.imagePath && current.imagePath !== nextImagePath) {
      try {
        await deleteProductImage(current.imagePath);
      } catch (cleanupError) {
        console.error("[Product image cleanup:update]", cleanupError);
      }
    }
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}/recipe`);
    revalidatePath("/cashier");
    return actionSuccess({ message: "Produk berhasil diperbarui." });
  } catch (error) {
    if (uploadedImagePath) {
      try {
        await deleteProductImage(uploadedImagePath);
      } catch (cleanupError) {
        console.error("[Product image cleanup:update rollback]", cleanupError);
      }
    }
    return actionFailure(error, { actionName: "updateProduct" });
  }
}

export async function toggleProductActive(formData: FormData) {
  try {
    await requireAdmin();
    const { id, isActive } = parseOrThrow(toggleActiveSchema, {
      id: field(formData, "id"),
      isActive: field(formData, "isActive"),
    });
    await prisma.product.update({ where: { id }, data: { isActive: !isActive } });
    revalidatePath("/admin/products");
    revalidatePath("/cashier");
    return actionSuccess({
      message: `Produk berhasil ${isActive ? "dinonaktifkan" : "diaktifkan"}.`,
    });
  } catch (error) {
    return actionFailure(error, { actionName: "toggleProductActive" });
  }
}

export async function saveProductRecipe(formData: FormData) {
  try {
    await requireAdmin();
    const input = parseOrThrow(recipeSchema, {
      productId: field(formData, "productId"),
      ingredientId: fields(formData, "ingredientId"),
      quantityNeeded: fields(formData, "quantityNeeded"),
    });

    await prisma.$transaction((tx) =>
      replaceProductRecipe(
        tx,
        input.productId,
        input.ingredientId.map((ingredientId, index) => ({
          ingredientId,
          quantityNeeded: input.quantityNeeded[index],
        })),
      ),
    );

    revalidatePath(`/admin/products/${input.productId}/recipe`);
    revalidatePath("/admin/products");
    revalidatePath("/cashier");
    return actionSuccess({
      message:
        input.ingredientId.length > 0
          ? "Resep berhasil disimpan."
          : "Resep berhasil dikosongkan; produk kembali memakai HPP manual.",
    });
  } catch (error) {
    return actionFailure(error, { actionName: "saveProductRecipe" });
  }
}

// ── Purchase Actions ──────────────────────────────────────────────────────────
export async function createPurchase(formData: FormData) {
  try {
    const session = await requireAdmin();

  const input = parseOrThrow(purchaseSchema, {
    supplierName: field(formData, "supplierName"),
    purchaseDate: field(formData, "purchaseDate"),
    ingredientId: fields(formData, "ingredientId"),
    quantity: fields(formData, "quantity"),
    unitCost: fields(formData, "unitCost"),
  });
  const { supplierName } = input;
  const ingredientIds = input.ingredientId;
  const quantities = input.quantity;
  const unitCosts = input.unitCost;
  const purchaseDate = parseWibDate(input.purchaseDate);

  const subtotals = quantities.map((q, i) => roundRupiah(q * unitCosts[i]));
  const totalAmount = subtotals.reduce((a, b) => a + b, 0);
  const invoiceNumber = `INV-${Date.now()}`;

  await prisma.$transaction(async (tx) => {
    const sortedIngredientIds = [...ingredientIds].sort((a, b) => a - b);
    const lockedIngredients = await tx.$queryRaw<LockedIngredientCost[]>(Prisma.sql`
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
    `);

    if (lockedIngredients.length !== sortedIngredientIds.length) {
      throw new ActionError(
        "Salah satu bahan baku tidak ditemukan atau sudah nonaktif.",
      );
    }

    const lockedById = new Map(
      lockedIngredients.map((ingredient) => [ingredient.id, ingredient])
    );

    const purchase = await tx.purchase.create({
      data: {
        invoiceNumber,
        supplierName,
        totalAmount,
        purchaseDate,
        createdBy: session.userId,
        details: {
          create: ingredientIds.map((ingredientId, i) => ({
            ingredientId,
            quantity: quantities[i],
            unitCost: unitCosts[i],
            subtotal: subtotals[i],
          })),
        },
      },
    });

    // Perbarui kuantitas, nilai, dan harga rata-rata dari snapshot yang sudah
    // dikunci agar pembelian bersamaan tidak saling menimpa.
    for (let i = 0; i < ingredientIds.length; i++) {
      const current = lockedById.get(ingredientIds[i])!;
      const next = applyStockIn(current, quantities[i], unitCosts[i]);

      await tx.ingredient.update({
        where: { id: ingredientIds[i] },
        data: {
          currentStock: next.currentStock,
          stockValue: next.stockValue,
          averageCost: next.averageCost,
        },
      });
      await tx.stockTransaction.create({
        data: {
          ingredientId: ingredientIds[i],
          type: "in",
          quantity: quantities[i],
          unitCost: unitCosts[i],
          totalCost: subtotals[i],
          balanceAfter: next.currentStock,
          valueAfter: next.stockValue,
          source: "purchase",
          referenceType: "purchase",
          referenceId: purchase.id,
          createdBy: session.userId,
        },
      });
    }
  });

    revalidatePath("/admin/purchases");
    revalidatePath("/admin/ingredients");
    revalidatePath("/admin/dashboard");
    return actionSuccess({ message: "Pembelian berhasil disimpan." });
  } catch (error) {
    return actionFailure(error, { actionName: "createPurchase" });
  }
}

// ── Operational Expense Actions ───────────────────────────────────────────────
export async function createExpense(formData: FormData) {
  try {
    const session = await requireAdmin();

    const input = parseOrThrow(expenseSchema, {
      description: field(formData, "description"),
      category: field(formData, "category"),
      amount: field(formData, "amount"),
      expenseDate: field(formData, "expenseDate"),
      cashierShiftId: field(formData, "cashierShiftId"),
    });
    const amount = roundRupiah(input.amount);
    const expenseDate = parseWibDate(input.expenseDate);

    await prisma.$transaction(async (tx) => {
      if (input.cashierShiftId !== null) {
        const [shift] = await tx.$queryRaw<LockedExpenseShift[]>(Prisma.sql`
          SELECT
            id,
            opening_cash AS "openingCash",
            status
          FROM cashier_shifts
          WHERE id = ${input.cashierShiftId}
            AND status = 'open'
          FOR UPDATE
        `);
        if (!shift) {
          throw new ActionError(
            "Shift laci tidak ditemukan atau sudah ditutup.",
          );
        }

        const [sales, expenses] = await Promise.all([
          tx.sale.aggregate({
            where: {
              shiftId: shift.id,
              paymentMethod: "cash",
              status: "completed",
            },
            _sum: { totalAmount: true },
          }),
          tx.operationalExpense.aggregate({
            where: { cashierShiftId: shift.id },
            _sum: { amount: true },
          }),
        ]);
        const available = calculateShiftCash({
          openingCash: shift.openingCash,
          cashSales: sales._sum.totalAmount ?? 0,
          cashDrawerExpenses: expenses._sum.amount ?? 0,
        }).expectedCash;
        if (amount > available) {
          throw new ActionError(
            `Kas laci tidak cukup. Tersedia ${available.toLocaleString("id-ID")} rupiah.`,
          );
        }
      }

      await tx.operationalExpense.create({
        data: {
          description: input.description,
          category: input.category,
          amount,
          expenseDate,
          createdBy: session.userId,
          cashierShiftId: input.cashierShiftId,
        },
      });
    });

    revalidatePath("/admin/expenses");
    revalidatePath("/admin/dashboard");
    revalidatePath("/cashier/shift");
    revalidatePath("/admin/shifts");
    return actionSuccess({ message: "Biaya operasional berhasil disimpan." });
  } catch (error) {
    return actionFailure(error, { actionName: "createExpense" });
  }
}

export async function deleteExpense(formData: FormData) {
  try {
    await requireAdmin();
    const { id } = parseOrThrow(idSchema, { id: field(formData, "id") });
    await prisma.$transaction(async (tx) => {
      const expense = await tx.operationalExpense.findUnique({
        where: { id },
        select: { cashierShiftId: true, stockTransactionId: true },
      });
      if (!expense) throw new ActionError("Pengeluaran tidak ditemukan.");

      if (expense.stockTransactionId !== null) {
        throw new ActionError(
          "Beban otomatis dari waste tidak dapat dihapus manual. Koreksi harus dicatat sebagai mutasi stok baru.",
        );
      }

      if (expense.cashierShiftId !== null) {
        const [shift] = await tx.$queryRaw<LockedExpenseShift[]>(Prisma.sql`
          SELECT
            id,
            opening_cash AS "openingCash",
            status
          FROM cashier_shifts
          WHERE id = ${expense.cashierShiftId}
          FOR UPDATE
        `);
        if (!shift || shift.status === "closed") {
          throw new ActionError(
            "Pengeluaran dari laci tidak dapat dihapus setelah shift ditutup.",
          );
        }
      }

      await tx.operationalExpense.delete({ where: { id } });
    });
    revalidatePath("/admin/expenses");
    revalidatePath("/admin/dashboard");
    revalidatePath("/cashier/shift");
    revalidatePath("/admin/shifts");
    return actionSuccess({ message: "Biaya operasional berhasil dihapus." });
  } catch (error) {
    return actionFailure(error, { actionName: "deleteExpense" });
  }
}

// ── Sale Actions ─────────────────────────────────────────────────────────────
export async function voidSale(formData: FormData) {
  try {
    const session = await requireAdmin();
    const input = parseOrThrow(voidSaleSchema, {
      saleId: field(formData, "saleId"),
      reason: field(formData, "reason"),
    });

    const sale = await processSaleVoid(
      input.saleId,
      session.userId,
      input.reason,
    );

    revalidatePath("/admin/sales");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/ingredients");
    revalidatePath(`/cashier/receipt/${sale.saleId}`);
    return actionSuccess({
      message: `${sale.invoiceNumber} berhasil dibatalkan dan stok telah dikembalikan.`,
    });
  } catch (error) {
    return actionFailure(error, { actionName: "voidSale" });
  }
}
