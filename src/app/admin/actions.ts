"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/guard";
import {
  parseOrThrow, field, fields,
  ingredientSchema, ingredientUpdateSchema, idSchema,
  productSchema, toggleProductSchema, purchaseSchema, expenseSchema,
} from "@/lib/validation";
import { parseWibDate } from "@/lib/period";
import { roundRupiah } from "@/lib/money";

// ── Ingredient Actions ────────────────────────────────────────────────────────
export async function createIngredient(formData: FormData) {
  await requireAdmin();
  const data = parseOrThrow(ingredientSchema, {
    name: field(formData, "name"),
    unit: field(formData, "unit"),
    minimumStock: field(formData, "minimumStock") || 0,
  });

  await prisma.ingredient.create({ data: { ...data, currentStock: 0 } });
  revalidatePath("/admin/ingredients");
}

export async function updateIngredient(formData: FormData) {
  await requireAdmin();
  const { id, ...data } = parseOrThrow(ingredientUpdateSchema, {
    id: field(formData, "id"),
    name: field(formData, "name"),
    unit: field(formData, "unit"),
    minimumStock: field(formData, "minimumStock") || 0,
  });

  await prisma.ingredient.update({ where: { id }, data });
  revalidatePath("/admin/ingredients");
}

export async function deleteIngredient(formData: FormData) {
  await requireAdmin();
  const { id } = parseOrThrow(idSchema, { id: field(formData, "id") });
  await prisma.ingredient.delete({ where: { id } });
  revalidatePath("/admin/ingredients");
}

// ── Product Actions ───────────────────────────────────────────────────────────
export async function createProduct(formData: FormData) {
  await requireAdmin();
  const data = parseOrThrow(productSchema, {
    name: field(formData, "name"),
    sellingPrice: field(formData, "sellingPrice"),
    baseHpp: field(formData, "baseHpp") || 0,
  });

  await prisma.product.create({ data: { ...data, hasRecipe: false, isActive: true } });
  revalidatePath("/admin/products");
}

export async function toggleProductActive(formData: FormData) {
  await requireAdmin();
  const { id, isActive } = parseOrThrow(toggleProductSchema, {
    id: field(formData, "id"),
    isActive: field(formData, "isActive"),
  });
  await prisma.product.update({ where: { id }, data: { isActive: !isActive } });
  revalidatePath("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const { id } = parseOrThrow(idSchema, { id: field(formData, "id") });
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
}

// ── Purchase Actions ──────────────────────────────────────────────────────────
export async function createPurchase(formData: FormData) {
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
          })),
        },
      },
    });

    // Update ingredient stock
    for (let i = 0; i < ingredientIds.length; i++) {
      await tx.ingredient.update({
        where: { id: ingredientIds[i] },
        data: { currentStock: { increment: quantities[i] } },
      });
      await tx.stockTransaction.create({
        data: {
          ingredientId: ingredientIds[i],
          type: "in",
          quantity: quantities[i],
          unitCost: unitCosts[i],
          source: "purchase",
          referenceId: purchase.id,
        },
      });
    }
  });

  revalidatePath("/admin/purchases");
  revalidatePath("/admin/ingredients");
  revalidatePath("/admin/dashboard");
}

// ── Operational Expense Actions ───────────────────────────────────────────────
export async function createExpense(formData: FormData) {
  const session = await requireAdmin();

  const input = parseOrThrow(expenseSchema, {
    description: field(formData, "description"),
    category: field(formData, "category"),
    amount: field(formData, "amount"),
    expenseDate: field(formData, "expenseDate"),
  });

  await prisma.operationalExpense.create({
    data: {
      description: input.description,
      category: input.category,
      amount: roundRupiah(input.amount),
      expenseDate: parseWibDate(input.expenseDate),
      createdBy: session.userId,
    },
  });

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/dashboard");
}

export async function deleteExpense(formData: FormData) {
  await requireAdmin();
  const { id } = parseOrThrow(idSchema, { id: field(formData, "id") });
  await prisma.operationalExpense.delete({ where: { id } });
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/dashboard");
}
