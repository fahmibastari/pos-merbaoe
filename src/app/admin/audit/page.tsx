import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Feedback } from "@/components/Feedback";
import { Pagination } from "@/components/Pagination";
import { getAuditReport } from "@/lib/audit-report";
import { formatQuantity, formatRupiah } from "@/lib/money";
import { getStringParam, pageHref, parsePage } from "@/lib/pagination";
import {
  businessRangeFromDates,
  startOfBusinessMonth,
  toWibDateString,
  type PeriodRange,
} from "@/lib/period";
import styles from "./audit.module.css";

export const metadata: Metadata = { title: "Jejak Audit" };

const PAGE_SIZE = 20;

const entityLabels: Record<string, string> = {
  ingredient: "Bahan baku",
  product: "Menu / produk",
  product_category: "Kategori menu",
  recipe: "Resep",
  sale: "Penjualan",
  cashier_shift: "Shift kasir",
  user: "Pengguna",
};

const actionLabels: Record<string, string> = {
  create: "Dibuat",
  update: "Diubah",
  activate: "Diaktifkan",
  deactivate: "Dinonaktifkan",
  void: "Dibatalkan",
};

const fieldLabels: Record<string, string> = {
  name: "Nama",
  unit: "Satuan",
  minimumStock: "Stok minimum",
  isActive: "Aktif",
  categoryId: "ID kategori",
  categoryName: "Kategori",
  sellingPrice: "Harga jual",
  baseHpp: "HPP manual",
  imagePath: "Foto",
  hasRecipe: "Memiliki resep",
  ingredients: "Komposisi resep",
  status: "Status",
  voidReason: "Alasan pembatalan",
  voidedBy: "Dibatalkan oleh",
  voidedAt: "Waktu pembatalan",
  openedAt: "Waktu dibuka",
  closedAt: "Waktu ditutup",
  openingCash: "Kas awal",
  cashSales: "Penjualan tunai",
  cashDrawerExpenses: "Pengeluaran dari laci",
  expectedCash: "Kas seharusnya",
  actualCash: "Kas aktual",
  difference: "Selisih",
  notes: "Keterangan",
  sortOrder: "Urutan",
  slug: "Slug",
  ingredientId: "ID bahan",
  ingredientName: "Bahan",
  quantityNeeded: "Jumlah kebutuhan",
};

const dateFields = new Set(["openedAt", "closedAt", "voidedAt"]);
const moneyFields = new Set([
  "sellingPrice",
  "baseHpp",
  "openingCash",
  "cashSales",
  "cashDrawerExpenses",
  "expectedCash",
  "actualCash",
  "difference",
]);
const quantityFields = new Set(["minimumStock", "quantityNeeded"]);

function displayAuditValue(value: unknown, key = ""): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (dateFields.has(key) && typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      });
    }
  }
  if (moneyFields.has(key) && (typeof value === "number" || typeof value === "string")) {
    return formatRupiah(value);
  }
  if (quantityFields.has(key) && (typeof value === "number" || typeof value === "string")) {
    return formatQuantity(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "Kosong";
    return value
      .map((item) => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const row = item as Record<string, unknown>;
          if (row.ingredientName) {
            return `${row.ingredientName} × ${displayAuditValue(row.quantityNeeded, "quantityNeeded")}`;
          }
          return Object.entries(row)
            .map(([childKey, child]) => `${fieldLabels[childKey] ?? childKey}: ${displayAuditValue(child, childKey)}`)
            .join(", ");
        }
        return displayAuditValue(item);
      })
      .join("; ");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([childKey, child]) => `${fieldLabels[childKey] ?? childKey}: ${displayAuditValue(child, childKey)}`)
      .join("; ");
  }
  return String(value);
}

function AuditDetails({
  before,
  after,
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  const keys = Array.from(new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]));
  if (keys.length === 0) return <span className={styles.emptyValue}>Tidak ada detail</span>;

  return (
    <details className={styles.details}>
      <summary>Lihat perubahan</summary>
      <table className={styles.changeTable}>
        <thead>
          <tr><th>Field</th><th>Sebelum</th><th>Sesudah</th></tr>
        </thead>
        <tbody>
          {keys.map((key) => (
            <tr key={key}>
              <th>{fieldLabels[key] ?? key}</th>
              <td>{displayAuditValue(before?.[key], key)}</td>
              <td>{displayAuditValue(after?.[key], key)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const now = new Date();
  const defaultFrom = toWibDateString(startOfBusinessMonth(now));
  const defaultTo = toWibDateString(now);
  const from = getStringParam(query.from) || defaultFrom;
  const to = getStringParam(query.to) || defaultTo;
  const userParam = getStringParam(query.userId);
  const parsedUserId = Number(userParam);
  const userId = Number.isSafeInteger(parsedUserId) && parsedUserId > 0
    ? parsedUserId
    : undefined;
  const entity = getStringParam(query.entity);
  const action = getStringParam(query.action);
  let filterError: string | null = null;
  let period: PeriodRange;
  let appliedFrom = from;
  let appliedTo = to;
  try {
    period = businessRangeFromDates(from, to);
  } catch (error) {
    filterError = error instanceof Error ? error.message : "Rentang tanggal tidak sah.";
    appliedFrom = defaultFrom;
    appliedTo = defaultTo;
    period = businessRangeFromDates(defaultFrom, defaultTo);
  }

  const report = await getAuditReport({
    period,
    userId,
    entity,
    action,
    page: parsePage(query.page),
    pageSize: PAGE_SIZE,
  });
  const hrefParams = {
    from: appliedFrom,
    to: appliedTo,
    userId: userParam,
    entity,
    action,
  };

  return (
    <div className={styles.page}>
      <div className="page-header">
        <h1>Jejak Audit</h1>
        <p>Perubahan master dan pembatalan transaksi, lengkap dengan pelaku serta waktunya</p>
      </div>

      <Form action="/admin/audit" className={styles.filterBar}>
        <div>
          <label className="label" htmlFor="audit-user">Pengguna</label>
          <select id="audit-user" name="userId" className="input" defaultValue={userParam}>
            <option value="">Semua pengguna</option>
            {report.users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.username}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="audit-from">Dari</label>
          <input id="audit-from" name="from" type="date" className="input" defaultValue={from} required />
        </div>
        <div>
          <label className="label" htmlFor="audit-to">Sampai</label>
          <input id="audit-to" name="to" type="date" className="input" defaultValue={to} required />
        </div>
        <div>
          <label className="label" htmlFor="audit-entity">Entitas</label>
          <select id="audit-entity" name="entity" className="input" defaultValue={entity}>
            <option value="">Semua entitas</option>
            {report.entities.map((value) => <option key={value} value={value}>{entityLabels[value] ?? value}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="audit-action">Aksi</label>
          <select id="audit-action" name="action" className="input" defaultValue={action}>
            <option value="">Semua aksi</option>
            {report.actions.map((value) => <option key={value} value={value}>{actionLabels[value] ?? value}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" type="submit">Terapkan</button>
        <Link className="btn btn-secondary" href="/admin/audit">Reset</Link>
      </Form>
      <Feedback tone="error" message={filterError} />

      <DataTable title="Aktivitas Terbaru" className={styles.table}>
        <table>
          <thead>
            <tr><th>Waktu WIB</th><th>Pelaku</th><th>Aksi</th><th>Entitas</th><th>ID</th><th>Detail</th></tr>
          </thead>
          <tbody>
            {report.logs.length === 0 ? (
              <tr><td colSpan={6}><EmptyState title="Tidak ada aktivitas" description="Tidak ada jejak audit yang cocok dengan filter ini." action={null} /></td></tr>
            ) : report.logs.map((log) => (
              <tr key={log.id}>
                <td className="meta">{log.createdAt.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" })}</td>
                <td className={styles.actor}><strong>{log.user.name}</strong><span>{log.user.username}</span></td>
                <td><span className={`badge ${log.action === "void" || log.action === "deactivate" ? "badge-danger" : log.action === "create" || log.action === "activate" ? "badge-success" : "badge-info"}`}>{actionLabels[log.action] ?? log.action}</span></td>
                <td>{entityLabels[log.entity] ?? log.entity}</td>
                <td className="mono">#{log.entityId}</td>
                <td><AuditDetails before={log.beforeData} after={log.afterData} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
      <Pagination
        page={report.paging.page}
        totalPages={report.paging.totalPages}
        previousHref={report.paging.page > 1 ? pageHref("/admin/audit", hrefParams, report.paging.page - 1) : undefined}
        nextHref={report.paging.page < report.paging.totalPages ? pageHref("/admin/audit", hrefParams, report.paging.page + 1) : undefined}
      />
    </div>
  );
}
