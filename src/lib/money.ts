/**
 * Presisi, pembulatan, dan pemformatan uang — README §3.2.
 *
 * Aturan yang ditegakkan berkas ini:
 *
 * - Nominal transaksi selalu dibulatkan ke rupiah penuh.
 * - Pembulatan hanya dilakukan pada titik akhir perhitungan, tidak di tengah.
 * - Harga perolehan per satuan mempertahankan 4 desimal, karena bahan baku
 *   dihitung per gram/ml sehingga harga per satuan kerap bernilai pecahan kecil.
 *   Membulatkannya lebih awal menimbulkan akumulasi galat pada HPP.
 *
 * Seluruh fungsi di sini murni. Lihat kasus uji U-10 pada README §9.1.
 */

/** Nilai uang yang dapat diterima: number, string, atau Prisma Decimal. */
export type MoneyInput = number | string | { toString(): string };

/** Presisi desimal untuk harga perolehan per satuan (README §3.2). */
export const UNIT_COST_DECIMALS = 4;

/** Mengubah masukan apa pun menjadi number, menolak nilai yang tidak sah. */
export function toNumber(value: MoneyInput): number {
  const n = typeof value === "number" ? value : Number(value.toString());
  if (!Number.isFinite(n)) {
    throw new Error(`Nilai uang tidak sah: ${String(value)}`);
  }
  return n;
}

/**
 * Membulatkan ke rupiah penuh dengan metode *round half up* (README §3.2).
 *
 * Catatan untuk nilai negatif: "half up" diartikan secara harfiah sebagai
 * pembulatan ke arah positif, sehingga −0,5 menjadi −0 dan bukan −1. Nilai
 * negatif hanya muncul pada laba yang merugi, dan nilainya sudah merupakan
 * selisih dari angka-angka yang dibulatkan, sehingga kasus tepat-setengah
 * praktis tidak terjadi.
 */
export function roundRupiah(value: MoneyInput): number {
  return Math.round(toNumber(value));
}

/** Membulatkan harga per satuan ke 4 desimal (README §3.2). */
export function roundUnitCost(value: MoneyInput): number {
  const f = 10 ** UNIT_COST_DECIMALS;
  return Math.round(toNumber(value) * f) / f;
}

/**
 * Memformat nominal sebagai rupiah untuk ditampilkan.
 *
 * Menggantikan tujuh definisi `formatRupiah`/`formatRp` yang sebelumnya
 * tersebar di komponen (Phase 2 ST-01).
 */
export function formatRupiah(value: MoneyInput | null | undefined): string {
  if (value === null || value === undefined) return "Rp 0";
  return "Rp " + roundRupiah(value).toLocaleString("id-ID");
}

/** Sama seperti `formatRupiah`, tanpa awalan "Rp". Untuk kolom tabel yang sudah berlabel. */
export function formatRupiahPlain(value: MoneyInput | null | undefined): string {
  if (value === null || value === undefined) return "0";
  return roundRupiah(value).toLocaleString("id-ID");
}

/** Memformat kuantitas bahan baku, membuang nol desimal yang tidak perlu. */
export function formatQuantity(value: MoneyInput | null | undefined): string {
  if (value === null || value === undefined) return "0";
  return toNumber(value).toLocaleString("id-ID", { maximumFractionDigits: 3 });
}
