import { roundRupiah, toNumber, type MoneyInput } from "./money";

/**
 * Perhitungan laba — README §3.1, §3.4, §3.8.
 *
 * Fungsi di berkas ini murni: tidak melakukan I/O. Perhitungan sengaja
 * dipisahkan dari komponen halaman agar dapat diuji unit (README §9.1 U-07,
 * U-08) — sebelumnya rumus laba bersih tertanam di dalam `dashboard/page.tsx`
 * sehingga tidak dapat diverifikasi tanpa basis data.
 */

/**
 * KEBIJAKAN YANG DITEGAKKAN BERKAS INI — README §3.1.A
 *
 * Pembelian bahan baku dari supplier BUKAN beban periode. Pembelian adalah
 * perpindahan bentuk aset — dari kas menjadi persediaan — sehingga menaikkan
 * nilai persediaan dan TIDAK BOLEH dikurangkan dari laba dalam bentuk apa pun.
 *
 * Biaya bahan baku sudah masuk ke laba lewat HPP, yaitu hanya untuk bahan yang
 * benar-benar TERJUAL. Mengurangkan total belanja supplier lagi berarti
 * menghitung biaya bahan dua kali.
 *
 * Karena itu tidak ada satu pun fungsi di sini yang menerima nilai pembelian.
 */

/** Komponen laba untuk satu periode. */
export type ProfitSummary = {
  /** Penjualan bersih setelah diskon, sebelum pajak (DPP). */
  netRevenue: number;
  /** Harga pokok penjualan dari barang yang terjual. */
  cogs: number;
  /** Laba kotor = DPP − HPP. */
  grossProfit: number;
  /** Beban operasional periode berjalan. */
  operatingExpenses: number;
  /** Laba bersih = Laba Kotor − OPEX. */
  netProfit: number;
};

/**
 * Laba kotor satu periode — README §3.4.
 *
 * Dihitung dari penjualan bersih (DPP), **bukan** dari total yang dibayar
 * pelanggan. Pajak yang dipungut adalah kewajiban kepada pemerintah daerah,
 * bukan pendapatan kafe (§3.1.C).
 */
export function calculateGrossProfit(netRevenue: MoneyInput, cogs: MoneyInput): number {
  return roundRupiah(toNumber(netRevenue) - toNumber(cogs));
}

/**
 * Laba bersih satu periode — README §3.8.
 *
 * `Laba Bersih = Laba Kotor − Total OPEX`
 *
 * Satu-satunya sumber OPEX yang sah adalah tabel `operational_expenses`.
 */
export function calculateNetProfit(grossProfit: MoneyInput, operatingExpenses: MoneyInput): number {
  return roundRupiah(toNumber(grossProfit) - toNumber(operatingExpenses));
}

/** Merangkai seluruh komponen laba satu periode. */
export function summarizeProfit(input: {
  netRevenue: MoneyInput;
  cogs: MoneyInput;
  operatingExpenses: MoneyInput;
}): ProfitSummary {
  const netRevenue = roundRupiah(input.netRevenue);
  const cogs = roundRupiah(input.cogs);
  const grossProfit = calculateGrossProfit(netRevenue, cogs);
  const operatingExpenses = roundRupiah(input.operatingExpenses);
  const netProfit = calculateNetProfit(grossProfit, operatingExpenses);
  return { netRevenue, cogs, grossProfit, operatingExpenses, netProfit };
}
