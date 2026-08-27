import type { Metadata } from "next";
import { Pagination } from "@/components/Pagination";
import { getStringParam, pageHref, paginate, parsePage } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { productImageUrl } from "@/lib/product-image";
import ProductTable from "./ProductTable";
import styles from "./products.module.css";

export const metadata: Metadata = { title: "Menu & Produk" };

const PAGE_SIZE = 20;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const q = getStringParam(query.q);
  const requestedPage = parsePage(query.page);
  const where = q
    ? { name: { contains: q, mode: "insensitive" as const } }
    : undefined;
  const totalItems = await prisma.product.count({ where });
  const paging = paginate(totalItems, requestedPage, PAGE_SIZE);
  const products = await prisma.product.findMany({
    where,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    skip: paging.skip,
    take: paging.take,
    include: { _count: { select: { recipes: true } } },
  });

  const serializedProducts = JSON.parse(JSON.stringify(
    products.map((product) => ({
      ...product,
      imageUrl: productImageUrl(product.imagePath),
    })),
  ));

  return (
    <div className={styles.page}>
      <div className="page-header">
        <h1>Menu &amp; Produk</h1>
        <p>Kelola daftar menu yang tersedia di kasir</p>
      </div>
      <ProductTable
        products={serializedProducts}
        rowOffset={paging.skip}
        query={q}
      />
      <Pagination
        page={paging.page}
        totalPages={paging.totalPages}
        previousHref={paging.page > 1 ? pageHref("/admin/products", { q }, paging.page - 1) : undefined}
        nextHref={paging.page < paging.totalPages ? pageHref("/admin/products", { q }, paging.page + 1) : undefined}
      />
    </div>
  );
}
