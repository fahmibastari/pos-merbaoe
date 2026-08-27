import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Pagination } from "@/components/Pagination";
import { getStringParam, pageHref, paginate, parsePage } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import IngredientTable from "./IngredientTable";

export const metadata: Metadata = { title: "Bahan Baku" };

const PAGE_SIZE = 20;

export default async function IngredientsPage({
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
  const totalItems = await prisma.ingredient.count({ where });
  const paging = paginate(totalItems, requestedPage, PAGE_SIZE);
  const ingredients = await prisma.ingredient.findMany({
    where,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    skip: paging.skip,
    take: paging.take,
  });

  const serializedIngredients = JSON.parse(JSON.stringify(ingredients));

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1>Bahan Baku</h1>
          <p>Kelola stok dan pengaturan bahan baku kafe</p>
        </div>
      </div>
      <Form
        action="/admin/ingredients"
        className="card"
        style={{ display: "flex", gap: "var(--space-sm)", alignItems: "end", marginBottom: "var(--space-md)", flexWrap: "wrap" }}
      >
        <div style={{ flex: "1 1 16rem" }}>
          <label className="label" htmlFor="ingredient-search">Cari Bahan</label>
          <input id="ingredient-search" name="q" className="input" defaultValue={q} placeholder="Nama bahan baku" />
        </div>
        <button className="btn btn-primary" type="submit">Cari</button>
        {q && <Link className="btn btn-secondary" href="/admin/ingredients">Reset</Link>}
      </Form>
      <IngredientTable ingredients={serializedIngredients} rowOffset={paging.skip} />
      <Pagination
        page={paging.page}
        totalPages={paging.totalPages}
        previousHref={paging.page > 1 ? pageHref("/admin/ingredients", { q }, paging.page - 1) : undefined}
        nextHref={paging.page < paging.totalPages ? pageHref("/admin/ingredients", { q }, paging.page + 1) : undefined}
      />
    </div>
  );
}
