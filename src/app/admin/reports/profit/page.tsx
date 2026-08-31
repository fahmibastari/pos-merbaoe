import type { Metadata } from "next";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { Feedback } from "@/components/Feedback";
import { formatRupiah } from "@/lib/money";
import { getStringParam } from "@/lib/pagination";
import {
  businessRangeFromDates,
  startOfBusinessMonth,
  toWibDateString,
  type PeriodRange,
} from "@/lib/period";
import { getProfitReport } from "@/lib/reporting";
import { PrintButton } from "../PrintButton";
import { ReportTabs } from "../ReportTabs";
import styles from "../reports.module.css";

export const metadata: Metadata = { title: "Laporan Laba" };

const paymentLabels: Record<string, string> = {
  cash: "Tunai",
  qris: "QRIS",
  transfer: "Transfer",
};

const expenseLabels: Record<string, string> = {
  utilitas: "Utilitas",
  sewa: "Sewa",
  pemeliharaan: "Pemeliharaan",
  lain_lain: "Operasional lain-lain",
};

export default async function ProfitReportPage({
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
  const report = await getProfitReport(period);
  const exportHref = `/admin/reports/profit/export?${new URLSearchParams({
    from: appliedFrom,
    to: appliedTo,
  })}`;
  const printedAt = now.toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });

  return (
    <div className={styles.reportPage}>
      <header className={styles.screenHeader}>
        <div>
          <h1>Laporan</h1>
          <p>Laba periodik dan nilai persediaan yang dapat direkonsiliasi</p>
        </div>
        <div className={`cluster ${styles.screenOnly}`}>
          <Link href={exportHref} className="btn btn-secondary">Unduh CSV</Link>
          <PrintButton />
        </div>
      </header>

      <ReportTabs active="profit" />

      <div className={styles.printHeader}>
        <Image className={styles.printLogo} src="/Logo-Vertikal.png" alt="Kopi Merbaoe" width={950} height={516} />
        <div className={styles.printMeta}>
          <h1>Laporan Laba</h1>
          <p>Periode {appliedFrom} s.d. {appliedTo}</p>
          <p>Dicetak {printedAt} WIB</p>
        </div>
      </div>

      <Form action="/admin/reports/profit" className={styles.filterBar}>
        <div>
          <label className="label" htmlFor="profit-from">Dari Tanggal</label>
          <input id="profit-from" name="from" type="date" className="input" defaultValue={from} required />
        </div>
        <div>
          <label className="label" htmlFor="profit-to">Sampai Tanggal</label>
          <input id="profit-to" name="to" type="date" className="input" defaultValue={to} required />
        </div>
        <button className="btn btn-primary" type="submit">Terapkan</button>
        <Link className="btn btn-secondary" href="/admin/reports/profit">Bulan Ini</Link>
      </Form>
      <Feedback tone="error" message={filterError} />

      <section className={styles.statement} aria-labelledby="profit-statement-title">
        <header className={styles.statementHeader}>
          <h2 id="profit-statement-title">Ikhtisar Laba</h2>
          <p>{report.transactionCount} transaksi selesai · {appliedFrom}—{appliedTo}</p>
        </header>
        <div className={styles.statementRows}>
          <div className={styles.statementRow}>
            <span>Penjualan bersih (DPP)</span>
            <strong>{formatRupiah(report.netRevenue)}</strong>
          </div>
          <div className={styles.statementRow}>
            <span>Harga pokok penjualan</span>
            <strong>− {formatRupiah(report.cogs)}</strong>
          </div>
          <div className={styles.statementSubtotal}>
            <span>Laba kotor</span>
            <strong>{formatRupiah(report.grossProfit)}</strong>
          </div>
          <div className={styles.statementRow}>
            <span>Beban operasional</span>
            <strong>− {formatRupiah(report.operatingExpenses)}</strong>
          </div>
          <div className={styles.statementTotal}>
            <span>Laba bersih</span>
            <strong className={report.netProfit < 0 ? styles.negative : undefined}>{formatRupiah(report.netProfit)}</strong>
          </div>
        </div>
      </section>

      <div className={styles.supportGrid}>
        <section className={styles.supportPanel}>
          <h2>Penerimaan pelanggan</h2>
          <div className={styles.supportRow}>
            <span>Total dibayar pelanggan</span>
            <strong>{formatRupiah(report.customerPayments)}</strong>
          </div>
          <div className={styles.supportRow}>
            <span>Pajak PB1 yang dipungut</span>
            <strong>{formatRupiah(report.taxCollected)}</strong>
          </div>
          {report.paymentBreakdown.map((row) => (
            <div className={styles.supportRow} key={row.paymentMethod}>
              <span>{paymentLabels[row.paymentMethod] ?? row.paymentMethod} · {row.count} transaksi</span>
              <strong>{formatRupiah(row.total)}</strong>
            </div>
          ))}
        </section>

        <section className={styles.supportPanel}>
          <h2>Beban dan arus persediaan</h2>
          {report.expenseBreakdown.length === 0 ? (
            <EmptyState title="Belum ada beban operasional" description="Tidak ada OPEX pada periode terpilih." action={null} />
          ) : report.expenseBreakdown.map((row) => (
            <div className={styles.supportRow} key={row.category}>
              <span>{expenseLabels[row.category] ?? row.category}</span>
              <strong>{formatRupiah(row.total)}</strong>
            </div>
          ))}
          <div className={styles.supportRow}>
            <span>Belanja bahan · tidak mengurangi laba</span>
            <strong>{formatRupiah(report.inventoryPurchases)}</strong>
          </div>
        </section>
      </div>
    </div>
  );
}
