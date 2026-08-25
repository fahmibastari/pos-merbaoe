import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/money";

export const metadata: Metadata = { title: "Riwayat Penjualan" };

export default async function SalesPage() {
  // Daftar menampilkan 100 terakhir; agregat dihitung atas SELURUH data di
  // basis data. Menjumlahkan hasil `take` membuat angkanya salah begitu data
  // melewati 100 baris (README §8.2). Filter rentang tanggal menyusul di
  // TASK-024; sampai saat itu label menyebut cakupannya secara eksplisit.
  const [sales, agg] = await Promise.all([
    prisma.sale.findMany({
      orderBy: { transactionDate: "desc" },
      take: 100,
      include: {
        user: { select: { name: true } },
        details: { include: { product: { select: { name: true } } } },
      },
    }),
    prisma.sale.aggregate({
      _sum: { totalAmount: true, grossProfit: true },
      _count: { id: true },
    }),
  ]);

  const totalRevenue = Number(agg._sum.totalAmount ?? 0);
  const totalProfit = Number(agg._sum.grossProfit ?? 0);
  const totalCount = agg._count.id;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Riwayat Penjualan</h1>
        <p>Menampilkan 100 transaksi terakhir — angka ringkasan di bawah mencakup seluruh periode</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <span className="stat-label">Total Transaksi</span>
          <span className="stat-value">{totalCount}</span>
          <span className="stat-sub">seluruh periode</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Pendapatan</span>
          <span className="stat-value" style={{ color: "var(--brand-400)" }}>{formatRupiah(totalRevenue)}</span>
          <span className="stat-sub">seluruh periode</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Laba Kotor</span>
          <span className="stat-value" style={{ color: "var(--success)" }}>{formatRupiah(totalProfit)}</span>
          <span className="stat-sub">seluruh periode</span>
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
                    <td style={{ fontWeight: 700 }}>{formatRupiah(s.totalAmount)}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{formatRupiah(s.totalHpp)}</td>
                    <td style={{ fontWeight: 700, color: "var(--success)" }}>{formatRupiah(s.grossProfit)}</td>
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
