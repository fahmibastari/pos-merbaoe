import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import CashierPOS from "./CashierPOS";

export const metadata: Metadata = { title: "Kasir" };

export default async function CashierPage() {
  const session = await getSession();

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

  const serializedProducts = JSON.parse(JSON.stringify(products));

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        background: "var(--bg-base)",
        overflow: "hidden",
      }}
    >
      <CashierPOS products={serializedProducts} cashierName={session?.username ?? "Kasir"} />
    </div>
  );
}
