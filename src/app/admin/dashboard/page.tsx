import type { Metadata } from "next";
import Form from "next/form";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatQuantity } from "@/lib/money";
import { businessRangeFromDates, startOfBusinessMonth, toWibDateString, type PeriodRange } from "@/lib/period";
import { pageHref, paginate, parsePage, getStringParam } from "@/lib/pagination";
import { getProfitReport } from "@/lib/reporting";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Feedback } from "@/components/Feedback";
import { Pagination } from "@/components/Pagination";
import { Icon } from "@/components/Icon";
import styles from "./dashboard.module.css";

export const metadata: Metadata = { title: "Dashboard" };

const PAGE_SIZE = 8;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  const query = await searchParams;
  const now = new Date();
  const defaultFrom = toWibDateString(startOfBusinessMonth(now));
  const defaultTo = toWibDateString(now);
  const from = getStringParam(query.from) || defaultFrom;
  const to = getStringParam(query.to) || defaultTo;
  let filterError: string | null = null;
  let appliedFrom = from;
  let appliedTo = to;
  let period: PeriodRange;
  try {
    period = businessRangeFromDates(from, to);
  } catch (error) {
    filterError = error instanceof Error ? error.message : "Rentang tanggal tidak sah.";
    appliedFrom = defaultFrom;
    appliedTo = defaultTo;
    period = businessRangeFromDates(defaultFrom, defaultTo);
  }

  const [profit, lowStockIngredients] =
    await Promise.all([
      getProfitReport(period),
      prisma.ingredient.findMany({
        where: {
          isActive: true,
          currentStock: { lte: prisma.ingredient.fields.minimumStock },
        },
        orderBy: { currentStock: "asc" },
      }),
    ]);

  const paging = paginate(profit.transactionCount, parsePage(query.page), PAGE_SIZE);
  const recentSales = await prisma.sale.findMany({
    where: { status: "completed", transactionDate: period },
    skip: paging.skip,
    take: paging.take,
    orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
    include: {
      cashier: { select: { name: true } },
      details: { select: { productName: true } },
    },
  });

  return (
    <div className={styles.dashboard}>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Selamat datang kembali, <strong style={{ color: "var(--brand-400)" }}>{session?.username}</strong> — {now.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Jakarta" })}</p>
      </div>

      <Form action="/admin/dashboard" className={styles.periodBar}>
        <div>
          <label className="label" htmlFor="dashboard-from">Dari Tanggal</label>
          <input id="dashboard-from" name="from" type="date" className="input" defaultValue={from} required />
        </div>
        <div>
          <label className="label" htmlFor="dashboard-to">Sampai Tanggal</label>
          <input id="dashboard-to" name="to" type="date" className="input" defaultValue={to} required />
        </div>
        <button className="btn btn-primary" type="submit">Terapkan Periode</button>
        <Link className="btn btn-secondary" href="/admin/dashboard">Bulan Ini</Link>
      </Form>
      <Feedback tone="error" message={filterError} />

      <section className={styles.summary} aria-label="Ringkasan periode">
        <div className={styles.headlineMetrics}>
          <article className={styles.headlineMetric}>
            <span className={styles.metricLabel}>Penjualan bersih</span>
            <strong className={`num ${styles.headlineValue}`}>{formatRupiah(profit.netRevenue)}</strong>
            <span className={styles.metricNote}>Setelah diskon, sebelum pajak</span>
          </article>
          <article className={styles.headlineMetric}>
            <span className={styles.metricLabel}>Laba bersih</span>
            <strong className={`num ${styles.headlineValue} ${profit.netProfit < 0 ? styles.loss : styles.brandValue}`}>
              {formatRupiah(profit.netProfit)}
            </strong>
            <span className={styles.metricNote}>Laba kotor dikurangi beban operasional</span>
          </article>
        </div>

        <div className={styles.facts}>
          <article className={styles.fact}>
            <span className={styles.metricLabel}>Transaksi</span>
            <strong className={`num ${styles.factValue}`}>{profit.transactionCount}</strong>
            <span className={styles.metricNote}>{appliedFrom}—{appliedTo}</span>
          </article>
          <article className={styles.fact}>
            <span className={styles.metricLabel}>Laba kotor</span>
            <strong className={`num ${styles.factValue}`}>{formatRupiah(profit.grossProfit)}</strong>
            <span className={styles.metricNote}>Pendapatan − HPP</span>
          </article>
          <article className={styles.fact}>
            <span className={styles.metricLabel}>Beban operasional</span>
            <strong className={`num ${styles.factValue}`}>{formatRupiah(profit.operatingExpenses)}</strong>
            <span className={styles.metricNote}>Utilitas, sewa, pemeliharaan</span>
          </article>
          <article className={styles.fact}>
            <span className={styles.metricLabel}>Belanja bahan</span>
            <strong className={`num ${styles.factValue}`}>{formatRupiah(profit.inventoryPurchases)}</strong>
            <span className={styles.metricNote}>Arus kas persediaan, bukan beban</span>
          </article>
        </div>
      </section>

      <div className={styles.contentGrid}>
        {/* Recent Sales */}
        <div className="stack">
          <DataTable title="Transaksi pada Periode" className={styles.ledger}>
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Produk</th>
                  <th>Kasir</th>
                  <th>Bayar</th>
                  <th>Total</th>
                  <th>Laba Kotor</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length === 0 ? (
                  <tr><td colSpan={6}>
                    <EmptyState
                      title="Belum ada transaksi"
                      description="Mulai transaksi pertama dari layar kasir."
                      action={<Link href="/cashier" className="btn btn-primary btn-sm">Buka Kasir</Link>}
                    />
                  </td></tr>
                ) : (
                  recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="invoice-number meta">
                        {sale.invoiceNumber}
                      </td>
                      <td className="meta">
                        {sale.details.map((d) => d.productName).join(", ")}
                      </td>
                      <td className="meta">{sale.cashier.name}</td>
                      <td>
                        <span className={`badge ${sale.paymentMethod === "cash" ? "badge-success" : sale.paymentMethod === "qris" ? "badge-info" : "badge-warning"}`}>
                          {sale.paymentMethod.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatRupiah(sale.totalAmount)}</td>
                      <td style={{ color: "var(--success)", fontWeight: 600 }}>{formatRupiah(sale.grossProfit)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DataTable>
          <Pagination
            page={paging.page}
            totalPages={paging.totalPages}
            previousHref={paging.page > 1 ? pageHref("/admin/dashboard", { from, to }, paging.page - 1) : undefined}
            nextHref={paging.page < paging.totalPages ? pageHref("/admin/dashboard", { from, to }, paging.page + 1) : undefined}
          />
        </div>

        {/* Low Stock Alert */}
        <section className={`${styles.stockPanel} ${lowStockIngredients.length > 0 ? styles.stockWarning : ""}`.trim()}>
          <div className={styles.stockHeader}>
            <div>
              <p className={styles.sectionKicker}>Pengawasan bahan</p>
              <h2>Stok Menipis</h2>
            </div>
            {lowStockIngredients.length > 0 && (
              <span className="badge badge-danger">{lowStockIngredients.length} item</span>
            )}
          </div>
          {lowStockIngredients.length === 0 ? (
            <EmptyState
              title="Semua stok aman"
              description="Lihat seluruh saldo dan batas minimum bahan baku."
              icon={<Icon name="check" size={24} />}
              action={<Link href="/admin/ingredients" className="btn btn-secondary btn-sm">Lihat Bahan Baku</Link>}
            />
          ) : (
            <div className="stack-sm">
              {lowStockIngredients.map((ing) => {
                const pct = Math.min(100, (Number(ing.currentStock) / Number(ing.minimumStock)) * 100);
                return (
                  <div key={ing.id} className={styles.stockItem}>
                    <div className={styles.stockLine}>
                      <span>{ing.name}</span>
                      <span className={styles.stockAmount}>
                        {formatQuantity(ing.currentStock)} {ing.unit}
                      </span>
                    </div>
                    <div className={styles.stockTrack}>
                      <div className={pct < 30 ? styles.stockBarDanger : styles.stockBarWarning} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="meta">
                      Minimum: {formatQuantity(ing.minimumStock)} {ing.unit}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
