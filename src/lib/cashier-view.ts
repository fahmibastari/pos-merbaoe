import type { Prisma } from "@/generated/prisma/client";

export function cashierSalesWhere(
  cashierId: number,
  search: string,
): Prisma.SaleWhereInput {
  if (!Number.isSafeInteger(cashierId) || cashierId <= 0) {
    throw new Error("ID kasir tidak sah.");
  }

  const q = search.trim();
  return {
    cashierId,
    ...(q
      ? {
          OR: [
            { invoiceNumber: { contains: q, mode: "insensitive" } },
            {
              details: {
                some: { productName: { contains: q, mode: "insensitive" } },
              },
            },
          ],
        }
      : {}),
  };
}

export function cashierStockWhere(search: string): Prisma.IngredientWhereInput {
  const q = search.trim();
  return {
    isActive: true,
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
  };
}
