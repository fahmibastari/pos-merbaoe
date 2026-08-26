import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ExpenseForm from "./ExpenseForm";
import { formatRupiah } from "@/lib/money";
import { businessMonthRange } from "@/lib/period";
import ExpenseDeleteButton from "./ExpenseDeleteButton";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";

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
  const [expenses, monthAgg, openShifts] = await Promise.all([
    prisma.operationalExpense.findMany({
      orderBy: { expenseDate: "desc" },
      take: 50,
      include: {
        user: { select: { name: true } },
        stockTransaction: {
          select: {
            id: true,
            ingredient: { select: { id: true, name: true } },
          },
        },
        cashierShift: {
          select: {
            status: true,
            cashier: { select: { name: true } },
          },
        },
      },
    }),
    prisma.operationalExpense.aggregate({
      where: { expenseDate: thisMonth },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.cashierShift.findMany({
      where: { status: "open" },
      orderBy: { openedAt: "asc" },
      select: {
        id: true,
        openedAt: true,
        cashier: { select: { name: true } },
      },
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
        <ExpenseForm
          openShifts={openShifts.map((shift) => ({
            id: shift.id,
            cashierName: shift.cashier.name,
            openedAtLabel: shift.openedAt.toLocaleString("id-ID", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Jakarta",
            }),
          }))}
        />

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

          <DataTable>
              <table>
                <thead>
                  <tr>
                    <th>Deskripsi</th>
                    <th>Kategori</th>
                    <th>Jumlah</th>
                    <th>Tanggal</th>
                    <th>Dicatat oleh</th>
                    <th>Sumber Dana</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr><td colSpan={7}>
                      <EmptyState
                        title="Belum ada pengeluaran"
                        description="Catat biaya operasional agar laba bersih tetap akurat."
                        action={<a href="#expense-form" className="btn btn-primary btn-sm">Catat Pengeluaran</a>}
                      />
                    </td></tr>
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
                          {exp.stockTransaction ? (
                            <span className="badge badge-warning">
                              Waste otomatis · {exp.stockTransaction.ingredient.name}
                            </span>
                          ) : exp.cashierShift ? (
                            <span className="badge badge-info">
                              Laci {exp.cashierShift.cashier.name}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                              Di luar laci
                            </span>
                          )}
                        </td>
                        <td>
                          {exp.stockTransactionId !== null ? (
                            <span className="badge badge-warning">Otomatis · Terkunci</span>
                          ) : exp.cashierShift?.status === "closed" ? (
                            <span className="badge badge-warning">Terkunci</span>
                          ) : (
                            <ExpenseDeleteButton id={exp.id} />
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
          </DataTable>
        </div>
      </div>
    </div>
  );
}
