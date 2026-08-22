import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProductTable from "./ProductTable";

export const metadata: Metadata = { title: "Menu & Produk" };

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  const serializedProducts = JSON.parse(JSON.stringify(products));

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Menu &amp; Produk</h1>
        <p>Kelola daftar menu yang tersedia di kasir</p>
      </div>
      <ProductTable products={serializedProducts} />
    </div>
  );
}
