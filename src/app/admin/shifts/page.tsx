import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Feedback } from "@/components/Feedback";
import { Pagination } from "@/components/Pagination";
import { formatRupiah } from "@/lib/money";
import { getStringParam, pageHref, paginate, parsePage } from "@/lib/pagination";
import { businessRangeFromDates } from "@/lib/period";
import { prisma } from "@/lib/prisma";
import { calculateShiftCash } from "@/lib/shift-service";

export const metadata: Metadata = { title: "Shift Kasir" };

const PAGE_SIZE = 20;

export default async function AdminShiftsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const q = getStringParam(query.q);
  const from = getStringParam(query.from);
  const to = getStringParam(query.to);
  const statusParam = getStringParam(query.status);
  const status = statusParam === "open" || statusParam === "closed" ? statusParam : undefined;
  let filterError: string | null = null;
  let openedAt: { gte: Date; lt: Date } | undefined;
  if (from || to) {
    if (!from || !to) filterError = "Tanggal awal dan akhir harus diisi bersamaan.";
    else {
      try {
        openedAt = businessRangeFromDates(from, to);
      } catch (error) {
        filterError = error instanceof Error ? error.message : "Rentang tanggal tidak sah.";
      }
    }
  }
  const where: Prisma.CashierShiftWhereInput = {
    ...(openedAt ? { openedAt } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { cashier: { name: { contains: q, mode: "insensitive" } } },
            { notes: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const totalItems = await prisma.cashierShift.count({ where });
  const paging = paginate(totalItems, parsePage(query.page), PAGE_SIZE);
  const shifts = await prisma.cashierShift.findMany({
    where,
    skip: paging.skip,
    take: paging.take,
    orderBy: [{ openedAt: "desc" }, { id: "desc" }],
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
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "end", justifyContent: "space-between" }}>
        <div>
          <h1>Shift Kasir</h1>
          <p>Riwayat shift beserta rekonsiliasi kas dan selisihnya</p>
        </div>
        <Link href="/cashier/shift" className="btn btn-primary">Buka Shift Saya</Link>
      </div>

      <Form
        action="/admin/shifts"
        className="card"
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto auto", gap: "var(--space-sm)", alignItems: "end", marginBottom: "var(--space-md)" }}
      >
        <div>
          <label className="label" htmlFor="shift-search">Cari Shift</label>
          <input id="shift-search" name="q" className="input" defaultValue={q} placeholder="Nama kasir atau catatan" />
        </div>
        <div>
          <label className="label" htmlFor="shift-from">Dari</label>
          <input id="shift-from" name="from" type="date" className="input" defaultValue={from} />
        </div>
        <div>
          <label className="label" htmlFor="shift-to">Sampai</label>
          <input id="shift-to" name="to" type="date" className="input" defaultValue={to} />
        </div>
        <div>
          <label className="label" htmlFor="shift-status">Status</label>
          <select id="shift-status" name="status" className="input" defaultValue={statusParam}>
            <option value="">Semua status</option>
            <option value="open">Terbuka</option>
            <option value="closed">Ditutup</option>
          </select>
        </div>
        <button className="btn btn-primary" type="submit">Terapkan</button>
        {(q || from || to || statusParam) && <Link className="btn btn-secondary" href="/admin/shifts">Reset</Link>}
      </Form>
      <Feedback tone="error" message={filterError} />

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
                  <td className="meta">{shift.openedAt.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}</td>
                  <td>{formatRupiah(shift.openingCash)}</td>
                  <td style={{ fontWeight: 700 }}>{formatRupiah(expectedCash)}</td>
                  <td>{shift.actualCash === null ? "—" : formatRupiah(shift.actualCash)}</td>
                  <td style={{ color: difference === null || difference === 0 ? "var(--text-secondary)" : "var(--danger)", fontWeight: 700 }}>{difference === null ? "—" : formatRupiah(difference)}</td>
                  <td className="meta">{shift._count.sales} transaksi · {shift._count.cashDrawerExpenses} pengeluaran laci</td>
                  <td><span className={`badge ${shift.status === "open" ? "badge-success" : "badge-info"}`}>{shift.status === "open" ? "Terbuka" : "Ditutup"}</span></td>
                  <td className="meta" style={{ maxWidth: "14rem" }}>{shift.notes ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DataTable>
      <Pagination
        page={paging.page}
        totalPages={paging.totalPages}
        previousHref={paging.page > 1 ? pageHref("/admin/shifts", { q, from, to, status: statusParam }, paging.page - 1) : undefined}
        nextHref={paging.page < paging.totalPages ? pageHref("/admin/shifts", { q, from, to, status: statusParam }, paging.page + 1) : undefined}
      />
    </div>
  );
}
