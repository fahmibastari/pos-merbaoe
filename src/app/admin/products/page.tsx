import type { Metadata } from "next";
import { Pagination } from "@/components/Pagination";
import { getStringParam, pageHref, paginate, parsePage } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { productImageUrl } from "@/lib/product-image";
import ProductTable from "./ProductTable";
import styles from "./products.module.css";
import { productRowSelect, toProductRowDTO } from "@/lib/dto";

export const metadata: Metadata = { title: "Menu & Produk" };

const PAGE_SIZE = 20;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const q = getStringParam(query.q);
  const categoryParam = getStringParam(query.category);
  const selectedCategory = /^\d+$/.test(categoryParam)
    ? Number(categoryParam)
    : null;
  const requestedPage = parsePage(query.page);
  const where = {
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    ...(selectedCategory ? { categoryId: selectedCategory } : {}),
  };
  const [totalItems, categories, activeProductCounts] = await Promise.all([
    prisma.product.count({ where }),
    prisma.productCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
      include: { _count: { select: { products: true } } },
    }),
    prisma.product.groupBy({
      by: ["categoryId"],
      where: { isActive: true },
      _count: { _all: true },
    }),
  ]);
  const paging = paginate(totalItems, requestedPage, PAGE_SIZE);
  const products = await prisma.product.findMany({
    where,
    orderBy: [
      { category: { sortOrder: "asc" } },
      { name: "asc" },
      { id: "asc" },
    ],
    skip: paging.skip,
    take: paging.take,
    select: productRowSelect,
  });

  const activeCountByCategory = new Map(
    activeProductCounts.map((item) => [item.categoryId, item._count._all]),
  );
  const serializedCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    totalProducts: category._count.products,
    activeProducts: activeCountByCategory.get(category.id) ?? 0,
  }));

  const serializedProducts = products.map((product) =>
    toProductRowDTO(product, productImageUrl(product.imagePath)),
  );

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
        categories={serializedCategories}
        selectedCategory={selectedCategory}
      />
      <Pagination
        page={paging.page}
        totalPages={paging.totalPages}
        previousHref={paging.page > 1 ? pageHref("/admin/products", { q, category: categoryParam }, paging.page - 1) : undefined}
        nextHref={paging.page < paging.totalPages ? pageHref("/admin/products", { q, category: categoryParam }, paging.page + 1) : undefined}
      />
    </div>
  );
}
