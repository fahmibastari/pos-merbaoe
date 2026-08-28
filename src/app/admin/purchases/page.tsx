import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import PurchaseForm from "./PurchaseForm";
import { formatRupiah } from "@/lib/money";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Feedback } from "@/components/Feedback";
import { Pagination } from "@/components/Pagination";
import { getStringParam, pageHref, paginate, parsePage } from "@/lib/pagination";
import { businessRangeFromDates } from "@/lib/period";
import { purchaseIngredientSelect, toPurchaseIngredientDTO } from "@/lib/dto";

export const metadata: Metadata = { title: "Pembelian Stok" };

const PAGE_SIZE = 20;

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const q = getStringParam(query.q);
  const from = getStringParam(query.from);
  const to = getStringParam(query.to);
  let filterError: string | null = null;
  let purchaseDate: { gte: Date; lt: Date } | undefined;
  if (from || to) {
    if (!from || !to) filterError = "Tanggal awal dan akhir harus diisi bersamaan.";
    else {
      try {
        purchaseDate = businessRangeFromDates(from, to);
      } catch (error) {
        filterError = error instanceof Error ? error.message : "Rentang tanggal tidak sah.";
      }
    }
  }
  const where: Prisma.PurchaseWhereInput = {
    ...(purchaseDate ? { purchaseDate } : {}),
    ...(q
      ? {
          OR: [
            { invoiceNumber: { contains: q, mode: "insensitive" } },
            { supplierName: { contains: q, mode: "insensitive" } },
            { details: { some: { ingredient: { name: { contains: q, mode: "insensitive" } } } } },
          ],
        }
      : {}),
  };
  const [ingredients, totalItems] = await Promise.all([
    prisma.ingredient.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: purchaseIngredientSelect,
    }),
    prisma.purchase.count({ where }),
  ]);
  const paging = paginate(totalItems, parsePage(query.page), PAGE_SIZE);
  const purchases = await prisma.purchase.findMany({
      where,
      orderBy: [{ purchaseDate: "desc" }, { id: "desc" }],
      skip: paging.skip,
      take: paging.take,
      include: {
        user: { select: { name: true } },
        details: { include: { ingredient: { select: { name: true, unit: true } } } },
      },
    });

  const serializedIngredients = ingredients.map(toPurchaseIngredientDTO);

  return (
    <div>
      <div className="page-header">
        <h1>Pembelian Stok</h1>
        <p>Catat pembelian bahan baku dari supplier — stok otomatis bertambah</p>
      </div>

      <Form
        action="/admin/purchases"
        className="card"
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto auto", gap: "var(--space-sm)", alignItems: "end", marginBottom: "var(--space-md)" }}
      >
        <div>
          <label className="label" htmlFor="purchase-search">Cari Pembelian</label>
          <input id="purchase-search" name="q" className="input" defaultValue={q} placeholder="Invoice, supplier, atau bahan" />
        </div>
        <div>
          <label className="label" htmlFor="purchase-from">Dari</label>
          <input id="purchase-from" name="from" type="date" className="input" defaultValue={from} />
        </div>
        <div>
          <label className="label" htmlFor="purchase-to">Sampai</label>
          <input id="purchase-to" name="to" type="date" className="input" defaultValue={to} />
        </div>
        <button className="btn btn-primary" type="submit">Terapkan</button>
        {(q || from || to) && <Link className="btn btn-secondary" href="/admin/purchases">Reset</Link>}
      </Form>
      <Feedback tone="error" message={filterError} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "var(--space-lg)", alignItems: "start" }}>
        <PurchaseForm ingredients={serializedIngredients} />

        {/* History */}
        <div className="stack">
          <DataTable title="Riwayat Pembelian">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Supplier</th>
                  <th>Total</th>
                  <th>Oleh</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={5}>
                    <EmptyState
                      title="Belum ada pembelian"
                      description="Catat pembelian pertama untuk menambah stok dan menghitung average cost."
                      action={<a href="#purchase-form" className="btn btn-primary btn-sm">Catat Pembelian</a>}
                    />
                  </td></tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id}>
                      <td className="invoice-number meta">{p.invoiceNumber}</td>
                      <td>{p.supplierName || "-"}</td>
                      <td style={{ fontWeight: 700, color: "var(--brand-400)" }}>
                        {formatRupiah(p.totalAmount)}
                      </td>
                      <td className="meta">{p.user.name}</td>
                      <td className="meta">
                        {new Date(p.purchaseDate).toLocaleDateString("id-ID")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DataTable>
          <Pagination
            page={paging.page}
            totalPages={paging.totalPages}
            previousHref={paging.page > 1 ? pageHref("/admin/purchases", { q, from, to }, paging.page - 1) : undefined}
            nextHref={paging.page < paging.totalPages ? pageHref("/admin/purchases", { q, from, to }, paging.page + 1) : undefined}
          />
        </div>
      </div>
    </div>
  );
}
