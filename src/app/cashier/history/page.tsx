import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { getActiveSession } from "@/lib/guard";
import { cashierSalesWhere } from "@/lib/cashier-view";
import { formatRupiah } from "@/lib/money";
import { getStringParam, pageHref, paginate, parsePage } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import CashierHeader from "../CashierHeader";

export const metadata: Metadata = { title: "Riwayat Saya" };

const PAGE_SIZE = 20;

export default async function CashierHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, query] = await Promise.all([getActiveSession(), searchParams]);
  if (!session) redirect("/login");

  const q = getStringParam(query.q);
  const where = cashierSalesWhere(session.userId, q);
  const totalItems = await prisma.sale.count({ where });
  const paging = paginate(totalItems, parsePage(query.page), PAGE_SIZE);
  const sales = await prisma.sale.findMany({
    where,
    orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
    skip: paging.skip,
    take: paging.take,
    include: {
      details: { select: { productName: true, quantity: true } },
    },
  });

  return (
    <main className="support-page">
      <div className="support-container">
        <CashierHeader
          title="Riwayat Transaksi Saya"
          description={`Hanya transaksi milik ${session.username} yang ditampilkan.`}
          current="history"
          role={session.role}
        />

        <Form
          action="/cashier/history"
          className="card filter-bar"
        >
          <div className="filter-grow">
            <label className="label" htmlFor="cashier-history-search">Cari Transaksi</label>
            <input id="cashier-history-search" name="q" className="input" defaultValue={q} placeholder="Invoice atau nama menu" />
          </div>
          <button className="btn btn-primary" type="submit">Cari</button>
          {q && <Link className="btn btn-secondary" href="/cashier/history">Reset</Link>}
        </Form>

        <DataTable title={`${totalItems} transaksi ditemukan`}>
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Menu</th>
                <th>Metode</th>
                <th>Total</th>
                <th>Waktu</th>
                <th>Status</th>
                <th>Struk</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title={q ? "Transaksi tidak ditemukan" : "Belum ada transaksi"}
                      description={q ? "Coba kata pencarian lain atau reset pencarian." : "Transaksi yang Anda selesaikan akan muncul di sini."}
                      action={q ? <Link href="/cashier/history" className="btn btn-secondary btn-sm">Reset Pencarian</Link> : <Link href="/cashier" className="btn btn-primary btn-sm">Buka POS</Link>}
                    />
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="invoice-number">{sale.invoiceNumber}</td>
                    <td>{sale.details.map((detail) => `${detail.productName} ×${detail.quantity}`).join(", ")}</td>
                    <td><span className={`badge ${sale.paymentMethod === "cash" ? "badge-success" : sale.paymentMethod === "qris" ? "badge-info" : "badge-warning"}`}>{sale.paymentMethod.toUpperCase()}</span></td>
                    <td className="num" style={{ fontWeight: 700 }}>{formatRupiah(sale.totalAmount)}</td>
                    <td className="meta" style={{ whiteSpace: "nowrap" }}>
                      {sale.transactionDate.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" })}
                    </td>
                    <td><span className={`badge ${sale.status === "completed" ? "badge-success" : "badge-danger"}`}>{sale.status === "completed" ? "Selesai" : "Dibatalkan"}</span></td>
                    <td><Link href={`/cashier/receipt/${sale.id}`} className="btn btn-secondary btn-sm">Lihat</Link></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTable>
        <Pagination
          page={paging.page}
          totalPages={paging.totalPages}
          previousHref={paging.page > 1 ? pageHref("/cashier/history", { q }, paging.page - 1) : undefined}
          nextHref={paging.page < paging.totalPages ? pageHref("/cashier/history", { q }, paging.page + 1) : undefined}
        />
      </div>
    </main>
  );
}
