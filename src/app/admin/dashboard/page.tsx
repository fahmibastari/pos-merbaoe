import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard" };

function formatRupiah(n: unknown) {
  return "Rp " + Number(n ?? 0).toLocaleString("id-ID");
}

export default async function DashboardPage() {
  const session = await getSession();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // ── Penjualan hari ini ────────────────────────────────────
  const [salesToday, salesMonth, purchasesMonth, lowStockIngredients] =
    await Promise.all([
      prisma.sale.aggregate({
        where: { transactionDate: { gte: startOfDay } },
        _sum: { totalAmount: true, totalHpp: true, grossProfit: true },
        _count: { id: true },
      }),
      prisma.sale.aggregate({
        where: { transactionDate: { gte: startOfMonth } },
        _sum: { totalAmount: true, totalHpp: true, grossProfit: true },
        _count: { id: true },
      }),
      prisma.purchase.aggregate({
        where: { purchaseDate: { gte: startOfMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.ingredient.findMany({
        where: { currentStock: { lte: prisma.ingredient.fields.minimumStock } },
        orderBy: { currentStock: "asc" },
      }),
    ]);

  const revenueToday = Number(salesToday._sum.totalAmount ?? 0);
  const grossProfitToday = Number(salesToday._sum.grossProfit ?? 0);
  const revenueMonth = Number(salesMonth._sum.totalAmount ?? 0);
  const grossProfitMonth = Number(salesMonth._sum.grossProfit ?? 0);
  const purchasesMonthTotal = Number(purchasesMonth._sum.totalAmount ?? 0);
  const netProfitMonth = grossProfitMonth - purchasesMonthTotal;

  const recentSales = await prisma.sale.findMany({
    take: 8,
    orderBy: { transactionDate: "desc" },
    include: { user: { select: { name: true } }, details: { include: { product: { select: { name: true } } } } },
  });

  const stats = [
    { label: "Pendapatan Hari Ini", value: formatRupiah(revenueToday), sub: `${salesToday._count.id} transaksi`, color: "var(--brand-400)" },
    { label: "Laba Kotor Hari Ini", value: formatRupiah(grossProfitToday), sub: "Pendapatan − HPP", color: "var(--success)" },
    { label: "Pendapatan Bulan Ini", value: formatRupiah(revenueMonth), sub: `${salesMonth._count.id} transaksi`, color: "var(--info)" },
    { label: "Laba Bersih Bulan Ini", value: formatRupiah(netProfitMonth), sub: "Laba Kotor − Pembelian Bahan", color: netProfitMonth >= 0 ? "var(--success)" : "var(--danger)" },
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
        <div className="card">
          <h2 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Transaksi Terbaru</h2>
          <div className="table-wrapper">
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
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                      Belum ada transaksi
                    </td>
                  </tr>
                ) : (
                  recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                        {sale.invoiceNumber}
                      </td>
                      <td style={{ fontSize: "0.8rem" }}>
                        {sale.details.map((d) => d.product.name).join(", ")}
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{sale.user.name}</td>
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
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card" style={{ borderColor: lowStockIngredients.length > 0 ? "rgba(239,68,68,0.3)" : "var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1rem" }}>Stok Menipis</h2>
            {lowStockIngredients.length > 0 && (
              <span className="badge badge-danger">{lowStockIngredients.length} item</span>
            )}
          </div>
          {lowStockIngredients.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✓</div>
              <p style={{ fontSize: "0.85rem" }}>Semua stok aman</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {lowStockIngredients.map((ing) => {
                const pct = Math.min(100, (Number(ing.currentStock) / Number(ing.minimumStock)) * 100);
                return (
                  <div key={ing.id} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                      <span style={{ fontWeight: 600 }}>{ing.name}</span>
                      <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                        {Number(ing.currentStock).toLocaleString("id-ID")} {ing.unit}
                      </span>
                    </div>
                    <div style={{ height: "4px", background: "var(--bg-elevated)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct < 30 ? "var(--danger)" : "var(--warning)", borderRadius: "var(--radius-full)", transition: "width 0.5s ease" }} />
                    </div>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      Minimum: {Number(ing.minimumStock).toLocaleString("id-ID")} {ing.unit}
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
