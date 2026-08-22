import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Riwayat Penjualan" };

export default async function SalesPage() {
  const sales = await prisma.sale.findMany({
    orderBy: { transactionDate: "desc" },
    take: 100,
    include: {
      user: { select: { name: true } },
      details: { include: { product: { select: { name: true } } } },
    },
  });

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalProfit = sales.reduce((sum, s) => sum + Number(s.grossProfit), 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Riwayat Penjualan</h1>
        <p>100 transaksi terakhir</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <span className="stat-label">Total Transaksi</span>
          <span className="stat-value">{sales.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Pendapatan</span>
          <span className="stat-value" style={{ color: "var(--brand-400)" }}>Rp {totalRevenue.toLocaleString("id-ID")}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Laba Kotor</span>
          <span className="stat-value" style={{ color: "var(--success)" }}>Rp {totalProfit.toLocaleString("id-ID")}</span>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
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
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Belum ada transaksi</td></tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{s.invoiceNumber}</td>
                    <td style={{ fontSize: "0.82rem" }}>{s.details.map((d) => `${d.product.name} ×${d.quantity}`).join(", ")}</td>
                    <td style={{ fontSize: "0.8rem" }}>{s.user.name}</td>
                    <td><span className={`badge ${s.paymentMethod === "cash" ? "badge-success" : s.paymentMethod === "qris" ? "badge-info" : "badge-warning"}`}>{s.paymentMethod.toUpperCase()}</span></td>
                    <td style={{ fontWeight: 700 }}>Rp {Number(s.totalAmount).toLocaleString("id-ID")}</td>
                    <td style={{ color: "var(--text-secondary)" }}>Rp {Number(s.totalHpp).toLocaleString("id-ID")}</td>
                    <td style={{ fontWeight: 700, color: "var(--success)" }}>Rp {Number(s.grossProfit).toLocaleString("id-ID")}</td>
                    <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {new Date(s.transactionDate).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
