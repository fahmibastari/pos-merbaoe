"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type CartItem = {
  productId: number;
  quantity: number;
};

export async function submitSale(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Tidak terautentikasi." };

  const paymentMethod = formData.get("paymentMethod") as string;
  const itemsJson = formData.get("items") as string;

  if (!itemsJson || !paymentMethod) {
    return { error: "Data transaksi tidak valid." };
  }

  let items: CartItem[];
  try {
    items = JSON.parse(itemsJson);
  } catch {
    return { error: "Format data tidak valid." };
  }

  if (!items || items.length === 0) {
    return { error: "Keranjang kosong." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      let totalHpp = 0;

      const saleDetails: {
        productId: number;
        quantity: number;
        sellingPrice: number;
        hppSnapshot: number;
        subtotal: number;
        grossProfitSnapshot: number;
      }[] = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId, isActive: true },
          include: {
            recipes: {
              include: { ingredient: true },
            },
          },
        });

        if (!product) throw new Error(`Produk ID ${item.productId} tidak ditemukan.`);

        // Compute HPP from recipe if available, otherwise use baseHpp
        let hpp = Number(product.baseHpp);

        if (product.hasRecipe && product.recipes.length > 0) {
          // Validate ingredient stock and compute dynamic HPP
          for (const recipe of product.recipes) {
            const neededTotal = Number(recipe.quantityNeeded) * item.quantity;
            if (Number(recipe.ingredient.currentStock) < neededTotal) {
              throw new Error(
                `Stok ${recipe.ingredient.name} tidak cukup! Dibutuhkan: ${neededTotal} ${recipe.ingredient.unit}, tersedia: ${Number(recipe.ingredient.currentStock).toFixed(0)} ${recipe.ingredient.unit}`
              );
            }
          }

          // Deduct ingredient stock
          for (const recipe of product.recipes) {
            const deductAmt = Number(recipe.quantityNeeded) * item.quantity;
            await tx.ingredient.update({
              where: { id: recipe.ingredientId },
              data: { currentStock: { decrement: deductAmt } },
            });
          }
        }

        const subtotal = Number(product.sellingPrice) * item.quantity;
        const hppTotal = hpp * item.quantity;
        const grossProfit = subtotal - hppTotal;

        totalAmount += subtotal;
        totalHpp += hppTotal;

        saleDetails.push({
          productId: item.productId,
          quantity: item.quantity,
          sellingPrice: Number(product.sellingPrice),
          hppSnapshot: hpp,
          subtotal,
          grossProfitSnapshot: grossProfit,
        });
      }

      const invoiceNumber = `TRX-${Date.now()}`;
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          cashierId: session.userId,
          totalAmount,
          totalHpp,
          grossProfit: totalAmount - totalHpp,
          paymentMethod: paymentMethod as "cash" | "qris" | "transfer",
          details: {
            create: saleDetails,
          },
        },
      });

      return sale;
    });

    revalidatePath("/cashier");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/sales");
    revalidatePath("/admin/ingredients");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    return { error: message };
  }
}
