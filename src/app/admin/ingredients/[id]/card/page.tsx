import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { notFound } from "next/navigation";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Feedback } from "@/components/Feedback";
import { Pagination } from "@/components/Pagination";
import { formatQuantity, formatRupiah, formatUnitCost } from "@/lib/money";
import { pageHref, paginate, parsePage } from "@/lib/pagination";
import { businessRangeFromDates } from "@/lib/period";
import { prisma } from "@/lib/prisma";
import StockCardFilter from "./StockCardFilter";

export const metadata: Metadata = { title: "Kartu Stok" };

const SOURCE_LABELS: Record<string, string> = {
  opening: "Saldo Awal",
  purchase: "Pembelian",
  sale: "Penjualan",
  sale_void: "Void Penjualan",
  adjustment: "Penyesuaian",
  waste: "Waste",
};

const PAGE_SIZE = 20;

function scalar(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function IngredientStockCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const ingredientId = Number(id);
  if (!Number.isInteger(ingredientId) || ingredientId <= 0) notFound();

  const from = scalar(query.from) ?? "";
  const to = scalar(query.to) ?? "";
  let filterError: string | null = null;
  let transactionDate: { gte: Date; lt: Date } | undefined;
  if (from || to) {
    if (!from || !to) {
      filterError = "Tanggal awal dan akhir harus diisi bersamaan.";
    } else {
      try {
        transactionDate = businessRangeFromDates(from, to);
      } catch (error) {
        filterError =
          error instanceof Error ? error.message : "Rentang tanggal tidak sah.";
      }
    }
  }

  const movementWhere = {
    ingredientId,
    ...(transactionDate ? { transactionDate } : {}),
  };
  const [ingredient, totalItems] = await Promise.all([
    prisma.ingredient.findUnique({ where: { id: ingredientId } }),
    prisma.stockTransaction.count({ where: movementWhere }),
  ]);
  if (!ingredient) notFound();
  const paging = paginate(totalItems, parsePage(query.page), PAGE_SIZE);
  const stockTransactions = await prisma.stockTransaction.findMany({
    where: movementWhere,
    orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
    skip: paging.skip,
    take: paging.take,
    include: { user: { select: { name: true } } },
  });

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "var(--space-md)",
        }}
      >
        <div>
          <h1>Kartu Stok {ingredient.name}</h1>
          <p>Riwayat mutasi terbaru beserta saldo dan nilai setelah setiap perubahan</p>
        </div>
        <div className="cluster">
          <Link href="/admin/ingredients/adjustment" className="btn btn-primary">
            + Opname / Waste
          </Link>
          <Link href="/admin/ingredients" className="btn btn-secondary">
            <Icon name="arrow-left" /> Kembali
          </Link>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "var(--space-md)",
          marginBottom: "var(--space-md)",
        }}
      >
        <div className="stat-card">
          <span className="stat-label">Stok Sekarang</span>
          <span className="stat-value">{formatQuantity(ingredient.currentStock)} {ingredient.unit}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Harga Rata-rata</span>
          <span className="stat-value">{formatUnitCost(ingredient.averageCost)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Nilai Persediaan</span>
          <span className="stat-value">{formatRupiah(ingredient.stockValue)}</span>
        </div>
      </div>

      <StockCardFilter ingredientId={ingredient.id} from={from} to={to} />

      <Feedback tone="error" message={filterError} />

      <DataTable title="Riwayat Mutasi">
        <table>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Jenis</th>
              <th>Sumber</th>
              <th>Jumlah</th>
              <th>Harga/Unit</th>
              <th>Nilai Mutasi</th>
              <th>Saldo Setelah</th>
              <th>Nilai Setelah</th>
              <th>Keterangan</th>
              <th>Pelaku</th>
            </tr>
          </thead>
          <tbody>
            {stockTransactions.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <EmptyState
                    title="Tidak ada mutasi pada rentang ini"
                    description="Ubah filter tanggal atau catat opname untuk memulai kartu stok."
                    action={
                      from || to ? (
                        <Link href={`/admin/ingredients/${ingredient.id}/card`} className="btn btn-secondary btn-sm">
                          Reset Filter
                        </Link>
                      ) : (
                        <Link href="/admin/ingredients/adjustment" className="btn btn-primary btn-sm">
                          Catat Opname / Waste
                        </Link>
                      )
                    }
                  />
                </td>
              </tr>
            ) : (
              stockTransactions.map((movement) => (
                <tr key={movement.id}>
                  <td className="meta" style={{ whiteSpace: "nowrap" }}>
                    {movement.transactionDate.toLocaleString("id-ID", {
                      timeZone: "Asia/Jakarta",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <span className={`badge ${movement.type === "in" ? "badge-success" : "badge-danger"}`}>
                      {movement.type === "in" ? "Masuk" : "Keluar"}
                    </span>
                  </td>
                  <td>{SOURCE_LABELS[movement.source] ?? movement.source}</td>
                  <td className="num">{formatQuantity(movement.quantity)} {ingredient.unit}</td>
                  <td className="num">{formatUnitCost(movement.unitCost)}</td>
                  <td className="num">{formatRupiah(movement.totalCost)}</td>
                  <td className="num">{formatQuantity(movement.balanceAfter)} {ingredient.unit}</td>
                  <td className="num">{formatRupiah(movement.valueAfter)}</td>
                  <td style={{ minWidth: "12rem" }}>
                    {movement.notes ?? (
                      <span style={{ color: "var(--text-muted)" }}>
                        {movement.referenceType
                          ? `${movement.referenceType} #${movement.referenceId}`
                          : "—"}
                      </span>
                    )}
                  </td>
                  <td>{movement.user.name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </DataTable>
      <Pagination
        page={paging.page}
        totalPages={paging.totalPages}
        previousHref={paging.page > 1 ? pageHref(`/admin/ingredients/${ingredient.id}/card`, { from, to }, paging.page - 1) : undefined}
        nextHref={paging.page < paging.totalPages ? pageHref(`/admin/ingredients/${ingredient.id}/card`, { from, to }, paging.page + 1) : undefined}
      />
    </div>
  );
}
