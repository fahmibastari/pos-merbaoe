import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/money";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import VoidSaleButton from "./VoidSaleButton";

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
        cashier: { select: { name: true } },
        details: { select: { productName: true, quantity: true } },
      },
    }),
    prisma.sale.aggregate({
      where: { status: "completed" },
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
          <span className="stat-sub">transaksi selesai · seluruh periode</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Pendapatan</span>
          <span className="stat-value" style={{ color: "var(--brand-400)" }}>{formatRupiah(totalRevenue)}</span>
          <span className="stat-sub">transaksi selesai · seluruh periode</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Laba Kotor</span>
          <span className="stat-value" style={{ color: "var(--success)" }}>{formatRupiah(totalProfit)}</span>
          <span className="stat-sub">transaksi selesai · seluruh periode</span>
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
                    <td style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{s.invoiceNumber}</td>
                    <td style={{ fontSize: "0.82rem" }}>{s.details.map((d) => `${d.productName} ×${d.quantity}`).join(", ")}</td>
                    <td style={{ fontSize: "0.8rem" }}>{s.cashier.name}</td>
                    <td><span className={`badge ${s.paymentMethod === "cash" ? "badge-success" : s.paymentMethod === "qris" ? "badge-info" : "badge-warning"}`}>{s.paymentMethod.toUpperCase()}</span></td>
                    <td style={{ fontWeight: 700 }}>{formatRupiah(s.totalAmount)}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{formatRupiah(s.totalHpp)}</td>
                    <td style={{ fontWeight: 700, color: "var(--success)" }}>{formatRupiah(s.grossProfit)}</td>
                    <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {new Date(s.transactionDate).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}
                    </td>
                    <td>
                      <span className={`badge ${s.status === "completed" ? "badge-success" : "badge-danger"}`}>
                        {s.status === "completed" ? "Selesai" : "Dibatalkan"}
                      </span>
                      {s.status === "voided" && s.voidReason && (
                        <p style={{ marginTop: "0.35rem", maxWidth: "14rem", color: "var(--text-muted)", fontSize: "0.72rem" }}>
                          {s.voidReason}
                        </p>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
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
    </div>
  );
}
