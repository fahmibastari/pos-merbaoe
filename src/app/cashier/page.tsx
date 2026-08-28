import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import CashierPOS from "./CashierPOS";
import { redirect } from "next/navigation";
import { productImageUrl } from "@/lib/product-image";
import { cashierProductSelect, toCashierProductDTO } from "@/lib/dto";

export const metadata: Metadata = { title: "Kasir" };

export default async function CashierPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const openShift = await prisma.cashierShift.findFirst({
    where: { cashierId: session.userId, status: "open" },
    select: { id: true },
  });
  if (!openShift) redirect("/cashier/shift");

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, category: { isActive: true } },
      orderBy: [
        { category: { sortOrder: "asc" } },
        { name: "asc" },
        { id: "asc" },
      ],
      select: cashierProductSelect,
    }),
    prisma.productCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  const serializedProducts = products.map((product) =>
    toCashierProductDTO(product, productImageUrl(product.imagePath)),
  );

  return (
    <div className="cashier-shell">
      <CashierPOS products={serializedProducts} categories={categories} cashierName={session.username} role={session.role} />
    </div>
  );
}
