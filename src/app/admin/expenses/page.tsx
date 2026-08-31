import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import ExpenseForm from "./ExpenseForm";
import { formatRupiah } from "@/lib/money";
import { dateOnlyRangeFromDates, formatDateOnly } from "@/lib/period";
import ExpenseDeleteButton from "./ExpenseDeleteButton";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Feedback } from "@/components/Feedback";
import { Pagination } from "@/components/Pagination";
import { getStringParam, pageHref, paginate, parsePage } from "@/lib/pagination";

export const metadata: Metadata = { title: "Pengeluaran Operasional" };

const CATEGORIES: Record<string, string> = {
  utilitas: "Utilitas",
  sewa: "Sewa",
  pemeliharaan: "Pemeliharaan",
  lain_lain: "Lain-lain",
};

const PAGE_SIZE = 20;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const q = getStringParam(query.q);
  const from = getStringParam(query.from);
  const to = getStringParam(query.to);
  let filterError: string | null = null;
  let expenseDate: { gte: Date; lt: Date } | undefined;
  if (from || to) {
    if (!from || !to) filterError = "Tanggal awal dan akhir harus diisi bersamaan.";
    else {
      try {
        expenseDate = dateOnlyRangeFromDates(from, to);
      } catch (error) {
        filterError = error instanceof Error ? error.message : "Rentang tanggal tidak sah.";
      }
    }
  }
  const where: Prisma.OperationalExpenseWhereInput = {
    ...(expenseDate ? { expenseDate } : {}),
    ...(q
      ? {
          OR: [
            { description: { contains: q, mode: "insensitive" } },
            { user: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  // Daftar dan agregat tetap dua kueri: agregat mencakup seluruh hasil filter,
  // bukan hanya baris pada halaman aktif (README §8.2).
  const [totalItems, filteredAgg, openShifts] = await Promise.all([
    prisma.operationalExpense.count({ where }),
    prisma.operationalExpense.aggregate({
      where,
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
  const paging = paginate(totalItems, parsePage(query.page), PAGE_SIZE);
  const expenses = await prisma.operationalExpense.findMany({
      where,
      orderBy: [{ expenseDate: "desc" }, { id: "desc" }],
      skip: paging.skip,
      take: paging.take,
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
    });

  const totalFiltered = Number(filteredAgg._sum.amount ?? 0);
  const countFiltered = filteredAgg._count.id;

  return (
    <div>
      <div className="page-header">
        <h1>Pengeluaran Operasional</h1>
        <p>Catat pengeluaran selain pembelian bahan baku (utilitas, sewa, dll)</p>
      </div>

      <Form
        action="/admin/expenses"
        className="card"
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto auto", gap: "var(--space-sm)", alignItems: "end", marginBottom: "var(--space-md)" }}
      >
        <div>
          <label className="label" htmlFor="expense-search">Cari Pengeluaran</label>
          <input id="expense-search" name="q" className="input" defaultValue={q} placeholder="Deskripsi atau pencatat" />
        </div>
        <div>
          <label className="label" htmlFor="expense-from">Dari</label>
          <input id="expense-from" name="from" type="date" className="input" defaultValue={from} />
        </div>
        <div>
          <label className="label" htmlFor="expense-to">Sampai</label>
          <input id="expense-to" name="to" type="date" className="input" defaultValue={to} />
        </div>
        <button className="btn btn-primary" type="submit">Terapkan</button>
        {(q || from || to) && <Link className="btn btn-secondary" href="/admin/expenses">Reset</Link>}
      </Form>
      <Feedback tone="error" message={filterError} />

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "var(--space-lg)", alignItems: "start" }}>
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

        <div className="stack">
          <div className="stat-card" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span className="stat-label">Total Pengeluaran Sesuai Filter</span>
              <span className="stat-value" style={{ color: "var(--danger)", display: "block", marginTop: "var(--space-2xs)" }}>
                {formatRupiah(totalFiltered)}
              </span>
            </div>
            <span className="badge badge-danger">{countFiltered} item</span>
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
                        <td className="meta">
                          {formatDateOnly(exp.expenseDate)}
                        </td>
                        <td className="meta">{exp.user.name}</td>
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
                            <span className="meta">
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
                            <ExpenseDeleteButton id={exp.id} description={exp.description} />
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
          </DataTable>
          <Pagination
            page={paging.page}
            totalPages={paging.totalPages}
            previousHref={paging.page > 1 ? pageHref("/admin/expenses", { q, from, to }, paging.page - 1) : undefined}
            nextHref={paging.page < paging.totalPages ? pageHref("/admin/expenses", { q, from, to }, paging.page + 1) : undefined}
          />
        </div>
      </div>
    </div>
  );
}
