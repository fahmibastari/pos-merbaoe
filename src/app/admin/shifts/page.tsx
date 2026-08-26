import type { Metadata } from "next";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { formatRupiah } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { calculateShiftCash } from "@/lib/shift-service";

export const metadata: Metadata = { title: "Shift Kasir" };

export default async function AdminShiftsPage() {
  const shifts = await prisma.cashierShift.findMany({
    take: 100,
    orderBy: { openedAt: "desc" },
    include: {
      cashier: { select: { name: true } },
      _count: { select: { sales: true, cashDrawerExpenses: true } },
    },
  });
  const openIds = shifts
    .filter((shift) => shift.status === "open")
    .map((shift) => shift.id);
  const [salesByShift, expensesByShift] = openIds.length
    ? await Promise.all([
        prisma.sale.groupBy({
          by: ["shiftId"],
          where: {
            shiftId: { in: openIds },
            paymentMethod: "cash",
            status: "completed",
          },
          _sum: { totalAmount: true },
        }),
        prisma.operationalExpense.groupBy({
          by: ["cashierShiftId"],
          where: { cashierShiftId: { in: openIds } },
          _sum: { amount: true },
        }),
      ])
    : [[], []];
  const cashSalesByShift = new Map(
    salesByShift.map((row) => [row.shiftId, Number(row._sum.totalAmount ?? 0)]),
  );
  const cashExpensesByShift = new Map(
    expensesByShift.map((row) => [
      row.cashierShiftId,
      Number(row._sum.amount ?? 0),
    ]),
  );

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "end", justifyContent: "space-between" }}>
        <div>
          <h1>Shift Kasir</h1>
          <p>100 shift terakhir beserta rekonsiliasi kas dan selisihnya</p>
        </div>
        <Link href="/cashier/shift" className="btn btn-primary">Buka Shift Saya</Link>
      </div>

      <DataTable>
        <table>
          <thead>
            <tr>
              <th>Kasir</th>
              <th>Dibuka</th>
              <th>Kas Awal</th>
              <th>Kas Seharusnya</th>
              <th>Kas Aktual</th>
              <th>Selisih</th>
              <th>Aktivitas</th>
              <th>Status</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {shifts.length === 0 ? (
              <tr><td colSpan={9}><EmptyState title="Belum ada shift" description="Buka shift pertama sebelum menggunakan POS." action={<Link href="/cashier/shift" className="btn btn-primary btn-sm">Buka Shift</Link>} /></td></tr>
            ) : shifts.map((shift) => {
              const live = shift.status === "open"
                ? calculateShiftCash({
                    openingCash: shift.openingCash,
                    cashSales: cashSalesByShift.get(shift.id) ?? 0,
                    cashDrawerExpenses: cashExpensesByShift.get(shift.id) ?? 0,
                  })
                : null;
              const expectedCash = live?.expectedCash ?? Number(shift.expectedCash ?? 0);
              const difference = shift.difference === null ? null : Number(shift.difference);
              return (
                <tr key={shift.id}>
                  <td style={{ fontWeight: 600 }}>{shift.cashier.name}</td>
                  <td style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{shift.openedAt.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}</td>
                  <td>{formatRupiah(shift.openingCash)}</td>
                  <td style={{ fontWeight: 700 }}>{formatRupiah(expectedCash)}</td>
                  <td>{shift.actualCash === null ? "—" : formatRupiah(shift.actualCash)}</td>
                  <td style={{ color: difference === null || difference === 0 ? "var(--text-secondary)" : "var(--danger)", fontWeight: 700 }}>{difference === null ? "—" : formatRupiah(difference)}</td>
                  <td style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>{shift._count.sales} transaksi · {shift._count.cashDrawerExpenses} pengeluaran laci</td>
                  <td><span className={`badge ${shift.status === "open" ? "badge-success" : "badge-info"}`}>{shift.status === "open" ? "Terbuka" : "Ditutup"}</span></td>
                  <td style={{ maxWidth: "14rem", fontSize: "0.76rem", color: "var(--text-muted)" }}>{shift.notes ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
