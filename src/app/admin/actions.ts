"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

// ── Ingredient Actions ────────────────────────────────────────────────────────
export async function createIngredient(formData: FormData) {
  const name = formData.get("name") as string;
  const unit = formData.get("unit") as string;
  const minimumStock = parseFloat(formData.get("minimumStock") as string) || 0;

  if (!name || !unit) return { error: "Nama dan satuan wajib diisi." };

  await prisma.ingredient.create({
    data: { name, unit, minimumStock, currentStock: 0 },
  });
  revalidatePath("/admin/ingredients");
}

export async function updateIngredient(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const name = formData.get("name") as string;
  const unit = formData.get("unit") as string;
  const minimumStock = parseFloat(formData.get("minimumStock") as string) || 0;

  await prisma.ingredient.update({
    where: { id },
    data: { name, unit, minimumStock },
  });
  revalidatePath("/admin/ingredients");
}

export async function deleteIngredient(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  await prisma.ingredient.delete({ where: { id } });
  revalidatePath("/admin/ingredients");
}

// ── Product Actions ───────────────────────────────────────────────────────────
export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const sellingPrice = parseFloat(formData.get("sellingPrice") as string);
  const baseHpp = parseFloat(formData.get("baseHpp") as string) || 0;

  if (!name || isNaN(sellingPrice)) return { error: "Nama dan harga jual wajib diisi." };

  await prisma.product.create({
    data: { name, sellingPrice, baseHpp, hasRecipe: false, isActive: true },
  });
  revalidatePath("/admin/products");
}

export async function toggleProductActive(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const current = formData.get("isActive") === "true";
  await prisma.product.update({ where: { id }, data: { isActive: !current } });
  revalidatePath("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
}

// ── Purchase Actions ──────────────────────────────────────────────────────────
export async function createPurchase(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Tidak terautentikasi." };

  const supplierName = (formData.get("supplierName") as string) || null;
  const purchaseDate = new Date(formData.get("purchaseDate") as string);

  const ingredientIds = (formData.getAll("ingredientId") as string[]).map(Number);
  const quantities = (formData.getAll("quantity") as string[]).map(parseFloat);
  const unitCosts = (formData.getAll("unitCost") as string[]).map(parseFloat);

  if (ingredientIds.length === 0) return { error: "Tambahkan minimal 1 item pembelian." };

  const totalAmount = unitCosts.reduce((sum, cost, i) => sum + cost * quantities[i], 0);
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
  const session = await getSession();
  if (!session) return { error: "Tidak terautentikasi." };

  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const expenseDate = new Date(formData.get("expenseDate") as string);

  if (!description || !category || isNaN(amount)) return { error: "Semua field wajib diisi." };

  await prisma.operationalExpense.create({
    data: {
      description,
      category: category as "utilitas" | "sewa" | "pemeliharaan" | "lain_lain",
      amount,
      expenseDate,
      createdBy: session.userId,
    },
  });

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/dashboard");
}

export async function deleteExpense(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  await prisma.operationalExpense.delete({ where: { id } });
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/dashboard");
}
