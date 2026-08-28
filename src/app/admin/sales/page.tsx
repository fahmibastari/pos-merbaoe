import type { Metadata } from "next";
import Form from "next/form";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/money";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Feedback } from "@/components/Feedback";
import { Pagination } from "@/components/Pagination";
import { getStringParam, pageHref, paginate, parsePage } from "@/lib/pagination";
import { businessRangeFromDates } from "@/lib/period";
import VoidSaleButton from "./VoidSaleButton";

export const metadata: Metadata = { title: "Riwayat Penjualan" };

const PAGE_SIZE = 20;

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const q = getStringParam(query.q);
  const from = getStringParam(query.from);
  const to = getStringParam(query.to);
  const cashierParam = getStringParam(query.cashierId);
  const parsedCashierId = Number(cashierParam);
  const cashierId = Number.isSafeInteger(parsedCashierId) && parsedCashierId > 0
    ? parsedCashierId
    : undefined;
  let filterError: string | null = null;
  let transactionDate: { gte: Date; lt: Date } | undefined;
  if (from || to) {
    if (!from || !to) {
      filterError = "Tanggal awal dan akhir harus diisi bersamaan.";
    } else {
      try {
        transactionDate = businessRangeFromDates(from, to);
      } catch (error) {
        filterError = error instanceof Error ? error.message : "Rentang tanggal tidak sah.";
      }
    }
  }

  const where: Prisma.SaleWhereInput = {
    ...(transactionDate ? { transactionDate } : {}),
    ...(cashierId ? { cashierId } : {}),
    ...(q
      ? {
          OR: [
            { invoiceNumber: { contains: q, mode: "insensitive" } },
            { details: { some: { productName: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };
  const [totalItems, cashiers] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.user.findMany({
      where: { sales: { some: {} } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  const paging = paginate(totalItems, parsePage(query.page), PAGE_SIZE);
  const [sales, agg] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
      skip: paging.skip,
      take: paging.take,
      select: {
        id: true,
        invoiceNumber: true,
        paymentMethod: true,
        totalAmount: true,
        totalHpp: true,
        grossProfit: true,
        transactionDate: true,
        status: true,
        voidReason: true,
        cashier: { select: { name: true } },
        details: { select: { productName: true, quantity: true } },
      },
    }),
    prisma.sale.aggregate({
      where: { ...where, status: "completed" },
      _sum: { totalAmount: true, grossProfit: true },
      _count: { id: true },
    }),
  ]);

  const totalRevenue = Number(agg._sum.totalAmount ?? 0);
  const totalProfit = Number(agg._sum.grossProfit ?? 0);
  const totalCount = agg._count.id;

  return (
    <div>
      <div className="page-header">
        <h1>Riwayat Penjualan</h1>
        <p>Telusuri transaksi berdasarkan periode WIB, kasir, invoice, atau produk</p>
      </div>

      <Form
        action="/admin/sales"
        className="card"
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.4fr auto auto", gap: "var(--space-sm)", alignItems: "end", marginBottom: "var(--space-md)" }}
      >
        <div>
          <label className="label" htmlFor="sale-search">Cari</label>
          <input id="sale-search" name="q" className="input" defaultValue={q} placeholder="Invoice atau produk" />
        </div>
        <div>
          <label className="label" htmlFor="sale-from">Dari</label>
          <input id="sale-from" name="from" type="date" className="input" defaultValue={from} />
        </div>
        <div>
          <label className="label" htmlFor="sale-to">Sampai</label>
          <input id="sale-to" name="to" type="date" className="input" defaultValue={to} />
        </div>
        <div>
          <label className="label" htmlFor="sale-cashier">Kasir</label>
          <select id="sale-cashier" name="cashierId" className="input" defaultValue={cashierParam}>
            <option value="">Semua kasir</option>
            {cashiers.map((cashier) => <option key={cashier.id} value={cashier.id}>{cashier.name}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" type="submit">Terapkan</button>
        {(q || from || to || cashierParam) && <Link className="btn btn-secondary" href="/admin/sales">Reset</Link>}
      </Form>
      <Feedback tone="error" message={filterError} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-md)", marginBottom: "var(--space-lg)" }}>
        <div className="stat-card">
          <span className="stat-label">Total Transaksi</span>
          <span className="stat-value">{totalCount}</span>
          <span className="stat-sub">transaksi selesai · sesuai filter</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Pendapatan</span>
          <span className="stat-value" style={{ color: "var(--brand-400)" }}>{formatRupiah(totalRevenue)}</span>
          <span className="stat-sub">transaksi selesai · sesuai filter</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Laba Kotor</span>
          <span className="stat-value" style={{ color: "var(--success)" }}>{formatRupiah(totalProfit)}</span>
          <span className="stat-sub">transaksi selesai · sesuai filter</span>
        </div>
      </div>

      <DataTable>
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Produk</th>
                <th>Kasir</th>
                <th>Metode</th>
                <th>Total</th>
                <th>HPP</th>
                <th>Laba Kotor</th>
                <th>Waktu</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr><td colSpan={10}>
                  <EmptyState
                    title="Belum ada transaksi"
                    description="Transaksi yang selesai dari layar kasir akan muncul di sini."
                    action={<Link href="/cashier" className="btn btn-primary btn-sm">Buka Kasir</Link>}
                  />
                </td></tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id}>
                    <td className="invoice-number meta">{s.invoiceNumber}</td>
                    <td style={{ fontSize: "var(--text-sm)" }}>{s.details.map((d) => `${d.productName} ×${d.quantity}`).join(", ")}</td>
                    <td className="meta">{s.cashier.name}</td>
                    <td><span className={`badge ${s.paymentMethod === "cash" ? "badge-success" : s.paymentMethod === "qris" ? "badge-info" : "badge-warning"}`}>{s.paymentMethod.toUpperCase()}</span></td>
                    <td style={{ fontWeight: 700 }}>{formatRupiah(s.totalAmount)}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{formatRupiah(s.totalHpp)}</td>
                    <td style={{ fontWeight: 700, color: "var(--success)" }}>{formatRupiah(s.grossProfit)}</td>
                    <td className="meta">
                      {new Date(s.transactionDate).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}
                    </td>
                    <td>
                      <span className={`badge ${s.status === "completed" ? "badge-success" : "badge-danger"}`}>
                        {s.status === "completed" ? "Selesai" : "Dibatalkan"}
                      </span>
                      {s.status === "voided" && s.voidReason && (
                        <p className="meta" style={{ marginTop: "var(--space-2xs)", maxWidth: "14rem" }}>
                          {s.voidReason}
                        </p>
                      )}
                    </td>
                    <td>
                      <div className="cluster">
                        <Link href={`/cashier/receipt/${s.id}`} className="btn btn-secondary btn-sm">
                          Struk
                        </Link>
                        {s.status === "completed" && (
                          <VoidSaleButton saleId={s.id} invoiceNumber={s.invoiceNumber} />
                        )}
                      </div>
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
        previousHref={paging.page > 1 ? pageHref("/admin/sales", { q, from, to, cashierId: cashierParam }, paging.page - 1) : undefined}
        nextHref={paging.page < paging.totalPages ? pageHref("/admin/sales", { q, from, to, cashierId: cashierParam }, paging.page + 1) : undefined}
      />
    </div>
  );
}
