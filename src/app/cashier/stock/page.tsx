import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { getSession } from "@/lib/auth";
import { cashierStockWhere } from "@/lib/cashier-view";
import { formatQuantity } from "@/lib/money";
import { getStringParam, pageHref, paginate, parsePage } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import CashierHeader from "../CashierHeader";

export const metadata: Metadata = { title: "Stok Bahan" };

const PAGE_SIZE = 20;

export default async function CashierStockPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, query] = await Promise.all([getSession(), searchParams]);
  if (!session) redirect("/login");

  const q = getStringParam(query.q);
  const where = cashierStockWhere(q);
  const totalItems = await prisma.ingredient.count({ where });
  const paging = paginate(totalItems, parsePage(query.page), PAGE_SIZE);
  const ingredients = await prisma.ingredient.findMany({
    where,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    skip: paging.skip,
    take: paging.take,
    select: {
      id: true,
      name: true,
      unit: true,
      currentStock: true,
      minimumStock: true,
    },
  });

  return (
    <main className="support-page">
      <div className="support-container support-container-narrow">
        <CashierHeader
          title="Stok Bahan Baku"
          description="Informasi ketersediaan hanya baca untuk kebutuhan pelayanan."
          current="stock"
          role={session.role}
        />

        <Form
          action="/cashier/stock"
          className="card filter-bar"
        >
          <div className="filter-grow">
            <label className="label" htmlFor="cashier-stock-search">Cari Bahan</label>
            <input id="cashier-stock-search" name="q" className="input" defaultValue={q} placeholder="Nama bahan baku" />
          </div>
          <button className="btn btn-primary" type="submit">Cari</button>
          {q && <Link className="btn btn-secondary" href="/cashier/stock">Reset</Link>}
        </Form>

        <DataTable title={`${totalItems} bahan aktif`}>
          <table>
            <thead>
              <tr>
                <th>Bahan</th>
                <th>Stok Saat Ini</th>
                <th>Stok Minimum</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      title={q ? "Bahan tidak ditemukan" : "Belum ada bahan aktif"}
                      description={q ? "Coba kata pencarian lain atau reset pencarian." : "Hubungi administrator untuk menambahkan bahan baku."}
                      action={q ? <Link href="/cashier/stock" className="btn btn-secondary btn-sm">Reset Pencarian</Link> : <Link href="/cashier" className="btn btn-primary btn-sm">Kembali ke POS</Link>}
                    />
                  </td>
                </tr>
              ) : (
                ingredients.map((ingredient) => {
                  const currentStock = Number(ingredient.currentStock);
                  const minimumStock = Number(ingredient.minimumStock);
                  const empty = currentStock <= 0;
                  const low = currentStock <= minimumStock;
                  return (
                    <tr key={ingredient.id}>
                      <td style={{ fontWeight: 600 }}>{ingredient.name}</td>
                      <td className="num" style={{ fontWeight: 700, color: low ? "var(--danger)" : "var(--success)" }}>
                        {formatQuantity(ingredient.currentStock)} {ingredient.unit}
                      </td>
                      <td className="num">{formatQuantity(ingredient.minimumStock)} {ingredient.unit}</td>
                      <td><span className={`badge ${low ? "badge-danger" : "badge-success"}`}>{empty ? "Habis" : low ? "Menipis" : "Aman"}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </DataTable>
        <Pagination
          page={paging.page}
          totalPages={paging.totalPages}
          previousHref={paging.page > 1 ? pageHref("/cashier/stock", { q }, paging.page - 1) : undefined}
          nextHref={paging.page < paging.totalPages ? pageHref("/cashier/stock", { q }, paging.page + 1) : undefined}
        />
      </div>
    </main>
  );
}
