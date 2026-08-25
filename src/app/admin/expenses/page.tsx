import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ExpenseForm from "./ExpenseForm";
import { formatRupiah } from "@/lib/money";
import { businessMonthRange } from "@/lib/period";

export const metadata: Metadata = { title: "Pengeluaran Operasional" };

const CATEGORIES: Record<string, string> = {
  utilitas: "Utilitas",
  sewa: "Sewa",
  pemeliharaan: "Pemeliharaan",
  lain_lain: "Lain-lain",
};

export default async function ExpensesPage() {
  const thisMonth = businessMonthRange();

  // Daftar dan agregat adalah dua kueri terpisah. Menjumlahkan hasil `take`
  // membuat angka total SALAH begitu data melewati ambang — README §8.2
  // mewajibkan seluruh penjumlahan finansial dilakukan di basis data.
  const [expenses, monthAgg] = await Promise.all([
    prisma.operationalExpense.findMany({
      orderBy: { expenseDate: "desc" },
      take: 50,
      include: { user: { select: { name: true } } },
    }),
    prisma.operationalExpense.aggregate({
      where: { expenseDate: thisMonth },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const totalMonth = Number(monthAgg._sum.amount ?? 0);
  const countMonth = monthAgg._count.id;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Pengeluaran Operasional</h1>
        <p>Catat pengeluaran selain pembelian bahan baku (utilitas, sewa, dll)</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "1.5rem", alignItems: "start" }}>
        <ExpenseForm />

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="stat-card" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span className="stat-label">Total Pengeluaran Bulan Ini</span>
              <span className="stat-value" style={{ color: "var(--danger)", display: "block", marginTop: "0.25rem" }}>
                {formatRupiah(totalMonth)}
              </span>
            </div>
            <span className="badge badge-danger" style={{ fontSize: "0.75rem" }}>{countMonth} item</span>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Deskripsi</th>
                    <th>Kategori</th>
                    <th>Jumlah</th>
                    <th>Tanggal</th>
                    <th>Dicatat oleh</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Belum ada pengeluaran</td></tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id}>
                        <td style={{ fontWeight: 500 }}>{exp.description}</td>
                        <td><span className="badge badge-warning">{CATEGORIES[exp.category] || exp.category}</span></td>
                        <td style={{ fontWeight: 700, color: "var(--danger)" }}>{formatRupiah(exp.amount)}</td>
                        <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          {new Date(exp.expenseDate).toLocaleDateString("id-ID")}
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{exp.user.name}</td>
                        <td>
                          <form action={async (fd) => {
                            "use server";
                            const { deleteExpense } = await import("../actions");
                            await deleteExpense(fd);
                          }}>
                            <input type="hidden" name="id" value={exp.id} />
                            <button id={`btn-del-exp-${exp.id}`} type="submit" className="btn btn-danger btn-sm">Hapus</button>
                          </form>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
