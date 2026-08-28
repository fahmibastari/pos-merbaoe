import type { Metadata } from "next";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { Feedback } from "@/components/Feedback";
import { formatQuantity, formatRupiah, formatUnitCost } from "@/lib/money";
import { getStringParam } from "@/lib/pagination";
import {
  businessRangeFromDates,
  startOfBusinessMonth,
  toWibDateString,
  type PeriodRange,
} from "@/lib/period";
import { getInventoryReport } from "@/lib/reporting";
import { PrintButton } from "../PrintButton";
import { ReportTabs } from "../ReportTabs";
import styles from "../reports.module.css";

export const metadata: Metadata = { title: "Laporan Persediaan" };

export default async function InventoryReportPage({
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
  let appliedFrom = from;
  let appliedTo = to;
  let filterError: string | null = null;
  let period: PeriodRange;
  try {
    period = businessRangeFromDates(from, to);
  } catch (error) {
    filterError = error instanceof Error ? error.message : "Rentang tanggal tidak sah.";
    appliedFrom = defaultFrom;
    appliedTo = defaultTo;
    period = businessRangeFromDates(defaultFrom, defaultTo);
  }
  const report = await getInventoryReport(period);
  const { reconciliation: rec } = report;
  const exportHref = `/admin/reports/inventory/export?${new URLSearchParams({
    from: appliedFrom,
    to: appliedTo,
  })}`;
  const printedAt = now.toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });

  const equationRows = [
    ["", "Persediaan awal", rec.openingValue],
    ["+", "Saldo awal dicatat dalam periode", rec.openingIn],
    ["+", "Pembelian masuk", rec.purchaseIn],
    ["+", "Pengembalian dari void", rec.saleVoidIn],
    ["−", "Pemakaian bahan untuk penjualan", rec.saleOut],
    ["−", "Waste", rec.wasteOut],
    ["+", "Penyesuaian masuk", rec.adjustmentIn],
    ["−", "Penyesuaian keluar", rec.adjustmentOut],
  ] as const;

  return (
    <div className={styles.reportPage}>
      <header className={styles.screenHeader}>
        <div>
          <h1>Laporan</h1>
          <p>Snapshot nilai bahan baku dan pemeriksaan buku besar persediaan</p>
        </div>
        <div className={`cluster ${styles.screenOnly}`}>
          <Link href={exportHref} className="btn btn-secondary">Unduh CSV</Link>
          <PrintButton />
        </div>
      </header>

      <ReportTabs active="inventory" />

      <div className={styles.printHeader}>
        <Image className={styles.printLogo} src="/Logo-Vertikal.png" alt="Kopi Merbaoe" width={950} height={516} />
        <div className={styles.printMeta}>
          <h1>Laporan Nilai Persediaan</h1>
          <p>Rekonsiliasi {appliedFrom} s.d. {appliedTo} · snapshot akhir {appliedTo}</p>
          <p>Dicetak {printedAt} WIB</p>
        </div>
      </div>

      <Form action="/admin/reports/inventory" className={styles.filterBar}>
        <div>
          <label className="label" htmlFor="inventory-from">Awal Rekonsiliasi</label>
          <input id="inventory-from" name="from" type="date" className="input" defaultValue={from} required />
        </div>
        <div>
          <label className="label" htmlFor="inventory-to">Tanggal Snapshot</label>
          <input id="inventory-to" name="to" type="date" className="input" defaultValue={to} required />
        </div>
        <button className="btn btn-primary" type="submit">Terapkan</button>
        <Link className="btn btn-secondary" href="/admin/reports/inventory">Bulan Ini</Link>
      </Form>
      <Feedback tone="error" message={filterError} />

      <section className={styles.reconciliation} aria-labelledby="reconciliation-title">
        <div className={styles.equation}>
          <h2 id="reconciliation-title">Rekonsiliasi Buku Besar</h2>
          {equationRows.map(([sign, label, value]) => (
            <div className={styles.equationLine} key={label}>
              <span aria-hidden="true">{sign}</span>
              <span>{label}</span>
              <strong>{formatRupiah(value)}</strong>
            </div>
          ))}
          <div className={`${styles.equationLine} ${styles.equationResult}`}>
            <span>=</span>
            <span>Persediaan akhir menurut mutasi</span>
            <strong>{formatRupiah(rec.expectedEndingValue)}</strong>
          </div>
        </div>
        <div className={`${styles.balanceStatus} ${!rec.balanced ? styles.balanceStatusWarning : ""}`.trim()}>
          <strong>{rec.balanced ? "Seimbang" : "Perlu diperiksa"}</strong>
          <p>Snapshot aktual {formatRupiah(rec.actualEndingValue)}.</p>
          <p>Selisih {formatRupiah(rec.difference)}.</p>
          <p className="meta">HPP finansial tidak dipakai dalam persamaan ini; nilai penjualan berasal dari mutasi bahan `sale/out`.</p>
        </div>
      </section>

      <DataTable title={`Nilai Persediaan per ${appliedTo}`} className={styles.inventoryTable}>
        <table>
          <thead>
            <tr>
              <th>Bahan</th>
              <th>Status</th>
              <th>Stok Awal</th>
              <th>Nilai Awal</th>
              <th>Stok Akhir</th>
              <th>Harga Rata-rata</th>
              <th>Nilai Akhir</th>
            </tr>
          </thead>
          <tbody>
            {report.items.map((item) => (
              <tr key={item.id}>
                <td className={!item.isActive ? styles.inactiveName : undefined}>
                  <strong>{item.name}</strong>
                  <span className="meta"> · {item.unit}</span>
                </td>
                <td><span className={`badge ${item.isActive ? "badge-success" : "badge-info"}`}>{item.isActive ? "Aktif" : "Nonaktif"}</span></td>
                <td>{formatQuantity(item.openingQuantity)} {item.unit}</td>
                <td>{formatRupiah(item.openingValue)}</td>
                <td><strong>{formatQuantity(item.endingQuantity)} {item.unit}</strong></td>
                <td>{formatUnitCost(item.endingAverageCost)} / {item.unit}</td>
                <td><strong>{formatRupiah(item.endingValue)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>
    </div>
  );
}
