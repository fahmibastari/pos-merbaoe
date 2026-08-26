import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatQuantity } from "@/lib/money";
import { businessDayRange, businessMonthRange } from "@/lib/period";
import { summarizeProfit } from "@/lib/profit";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getSession();
  const now = new Date();
  // Batas periode dipin ke Asia/Jakarta (README §3.3) — pada server UTC,
  // `new Date()` polos membuat "hari ini" berganti pukul 07:00 WIB.
  const today = businessDayRange(now);
  const thisMonth = businessMonthRange(now);

  // ── Penjualan hari ini ────────────────────────────────────
  const [salesToday, salesMonth, expensesMonth, purchasesMonth, lowStockIngredients] =
    await Promise.all([
      prisma.sale.aggregate({
        where: { transactionDate: today, status: "completed" },
        _sum: { totalAmount: true, totalHpp: true, grossProfit: true },
        _count: { id: true },
      }),
      prisma.sale.aggregate({
        where: { transactionDate: thisMonth, status: "completed" },
        _sum: { totalAmount: true, totalHpp: true, grossProfit: true },
        _count: { id: true },
      }),
      // README §3.8 — laba bersih dikurangi BEBAN OPERASIONAL, bukan pembelian
      // bahan baku. Pembelian adalah penambahan persediaan (§3.1.A); memakainya
      // sebagai pengurang laba menghitung biaya bahan dua kali.
      prisma.operationalExpense.aggregate({
        where: { expenseDate: thisMonth },
        _sum: { amount: true },
      }),
      // Ditampilkan terpisah sebagai arus kas, bukan sebagai pengurang laba.
      prisma.purchase.aggregate({
        where: { purchaseDate: thisMonth },
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

  const revenueToday = Number(salesToday._sum.totalAmount ?? 0);
  const grossProfitToday = Number(salesToday._sum.grossProfit ?? 0);
  const revenueMonth = Number(salesMonth._sum.totalAmount ?? 0);
  const opexMonth = Number(expensesMonth._sum.amount ?? 0);
  const purchasesMonthTotal = Number(purchasesMonth._sum.totalAmount ?? 0);

  const profitMonth = summarizeProfit({
    netRevenue: revenueMonth,
    cogs: Number(salesMonth._sum.totalHpp ?? 0),
    operatingExpenses: opexMonth,
  });
  const netProfitMonth = profitMonth.netProfit;

  const recentSales = await prisma.sale.findMany({
    where: { status: "completed" },
    take: 8,
    orderBy: { transactionDate: "desc" },
    include: {
      cashier: { select: { name: true } },
      details: { select: { productName: true } },
    },
  });

  const stats = [
    { label: "Pendapatan Hari Ini", value: formatRupiah(revenueToday), sub: `${salesToday._count.id} transaksi`, color: "var(--brand-400)" },
    { label: "Laba Kotor Hari Ini", value: formatRupiah(grossProfitToday), sub: "Pendapatan − HPP", color: "var(--success)" },
    { label: "Pendapatan Bulan Ini", value: formatRupiah(revenueMonth), sub: `${salesMonth._count.id} transaksi`, color: "var(--info)" },
    { label: "Beban Operasional Bulan Ini", value: formatRupiah(opexMonth), sub: "Utilitas, sewa, pemeliharaan", color: "var(--warning)" },
    { label: "Laba Bersih Bulan Ini", value: formatRupiah(netProfitMonth), sub: "Laba Kotor − Beban Operasional", color: netProfitMonth >= 0 ? "var(--success)" : "var(--danger)" },
    { label: "Belanja Bahan Bulan Ini", value: formatRupiah(purchasesMonthTotal), sub: "Arus kas — menambah persediaan, bukan beban", color: "var(--info)" },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Selamat datang kembali, <strong style={{ color: "var(--brand-400)" }}>{session?.username}</strong> — {now.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
            <span className="stat-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
        {/* Recent Sales */}
        <DataTable title="Transaksi Terbaru">
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
                      <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                        {sale.invoiceNumber}
                      </td>
                      <td style={{ fontSize: "0.8rem" }}>
                        {sale.details.map((d) => d.productName).join(", ")}
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{sale.cashier.name}</td>
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

        {/* Low Stock Alert */}
        <div className="card" style={{ borderColor: lowStockIngredients.length > 0 ? "rgba(239,68,68,0.3)" : "var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1rem" }}>Stok Menipis</h2>
            {lowStockIngredients.length > 0 && (
              <span className="badge badge-danger">{lowStockIngredients.length} item</span>
            )}
          </div>
          {lowStockIngredients.length === 0 ? (
            <EmptyState
              title="Semua stok aman"
              description="Lihat seluruh saldo dan batas minimum bahan baku."
              icon="✓"
              action={<Link href="/admin/ingredients" className="btn btn-secondary btn-sm">Lihat Bahan Baku</Link>}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {lowStockIngredients.map((ing) => {
                const pct = Math.min(100, (Number(ing.currentStock) / Number(ing.minimumStock)) * 100);
                return (
                  <div key={ing.id} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                      <span style={{ fontWeight: 600 }}>{ing.name}</span>
                      <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                        {formatQuantity(ing.currentStock)} {ing.unit}
                      </span>
                    </div>
                    <div style={{ height: "4px", background: "var(--bg-elevated)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct < 30 ? "var(--danger)" : "var(--warning)", borderRadius: "var(--radius-full)", transition: "width 0.5s ease" }} />
                    </div>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
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
