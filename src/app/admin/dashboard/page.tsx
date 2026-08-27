import type { Metadata } from "next";
import Form from "next/form";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatQuantity } from "@/lib/money";
import { businessRangeFromDates, startOfBusinessMonth, toWibDateString, type PeriodRange } from "@/lib/period";
import { pageHref, paginate, parsePage, getStringParam } from "@/lib/pagination";
import { summarizeProfit } from "@/lib/profit";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Feedback } from "@/components/Feedback";
import { Pagination } from "@/components/Pagination";
import { Icon } from "@/components/Icon";

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

  const [salesPeriod, expensesPeriod, purchasesPeriod, lowStockIngredients] =
    await Promise.all([
      prisma.sale.aggregate({
        where: { transactionDate: period, status: "completed" },
        _sum: { totalAmount: true, totalHpp: true, grossProfit: true },
        _count: { id: true },
      }),
      // README §3.8 — laba bersih dikurangi BEBAN OPERASIONAL, bukan pembelian
      // bahan baku. Pembelian adalah penambahan persediaan (§3.1.A); memakainya
      // sebagai pengurang laba menghitung biaya bahan dua kali.
      prisma.operationalExpense.aggregate({
        where: { expenseDate: period },
        _sum: { amount: true },
      }),
      // Ditampilkan terpisah sebagai arus kas, bukan sebagai pengurang laba.
      prisma.purchase.aggregate({
        where: { purchaseDate: period },
        _sum: { totalAmount: true },
      }),
      prisma.ingredient.findMany({
        where: {
          isActive: true,
          currentStock: { lte: prisma.ingredient.fields.minimumStock },
        },
        orderBy: { currentStock: "asc" },
      }),
    ]);

  const revenue = Number(salesPeriod._sum.totalAmount ?? 0);
  const grossProfit = Number(salesPeriod._sum.grossProfit ?? 0);
  const opex = Number(expensesPeriod._sum.amount ?? 0);
  const purchasesTotal = Number(purchasesPeriod._sum.totalAmount ?? 0);

  const profit = summarizeProfit({
    netRevenue: revenue,
    cogs: Number(salesPeriod._sum.totalHpp ?? 0),
    operatingExpenses: opex,
  });
  const netProfit = profit.netProfit;

  const paging = paginate(salesPeriod._count.id, parsePage(query.page), PAGE_SIZE);
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

  const stats = [
    { label: "Transaksi Periode", value: String(salesPeriod._count.id), sub: `${appliedFrom} s.d. ${appliedTo}`, color: "var(--brand-400)" },
    { label: "Pendapatan Periode", value: formatRupiah(revenue), sub: "Transaksi selesai", color: "var(--info)" },
    { label: "Laba Kotor Periode", value: formatRupiah(grossProfit), sub: "Pendapatan − HPP", color: "var(--success)" },
    { label: "Beban Operasional Periode", value: formatRupiah(opex), sub: "Utilitas, sewa, pemeliharaan", color: "var(--warning)" },
    { label: "Laba Bersih Periode", value: formatRupiah(netProfit), sub: "Laba Kotor − Beban Operasional", color: netProfit >= 0 ? "var(--success)" : "var(--danger)" },
    { label: "Belanja Bahan Periode", value: formatRupiah(purchasesTotal), sub: "Arus kas — menambah persediaan, bukan beban", color: "var(--info)" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Selamat datang kembali, <strong style={{ color: "var(--brand-400)" }}>{session?.username}</strong> — {now.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Jakarta" })}</p>
      </div>

      <Form
        action="/admin/dashboard"
        className="card"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: "var(--space-sm)", alignItems: "end", marginBottom: "var(--space-md)" }}
      >
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

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-md)", marginBottom: "var(--space-xl)" }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="stat-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--space-lg)", alignItems: "start" }}>
        {/* Recent Sales */}
        <div className="stack">
          <DataTable title="Transaksi pada Periode">
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
        <div className="card" style={{ borderColor: lowStockIngredients.length > 0 ? "var(--danger)" : "var(--rule)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-md)" }}>
            <h2 style={{ fontSize: "var(--text-md)" }}>Stok Menipis</h2>
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
                  <div key={ing.id} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2xs)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                      <span style={{ fontWeight: 600 }}>{ing.name}</span>
                      <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                        {formatQuantity(ing.currentStock)} {ing.unit}
                      </span>
                    </div>
                    <div style={{ height: "4px", background: "var(--bg-elevated)", borderRadius: "var(--radius-control)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct < 30 ? "var(--danger)" : "var(--warning)", borderRadius: "var(--radius-control)" }} />
                    </div>
                    <p className="meta">
                      Minimum: {formatQuantity(ing.minimumStock)} {ing.unit}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
