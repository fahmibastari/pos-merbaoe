import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import CashierPOS from "./CashierPOS";
import { redirect } from "next/navigation";
import { productImageUrl } from "@/lib/product-image";

export const metadata: Metadata = { title: "Kasir" };

export default async function CashierPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const openShift = await prisma.cashierShift.findFirst({
    where: { cashierId: session.userId, status: "open" },
    select: { id: true },
  });
  if (!openShift) redirect("/cashier/shift");

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      recipes: {
        include: {
          ingredient: { select: { id: true, name: true, unit: true, currentStock: true } },
        },
      },
    },
  });

  const serializedProducts = JSON.parse(JSON.stringify(
    products.map((product) => ({
      ...product,
      imageUrl: productImageUrl(product.imagePath),
    })),
  ));

  return (
    <div className="cashier-shell">
      <CashierPOS products={serializedProducts} cashierName={session.username} role={session.role} />
    </div>
  );
}
