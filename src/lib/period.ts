/**
 * Batas periode operasional — README §3.3.
 *
 * Batas "hari" adalah definisi bisnis, bukan detail teknis. Server produksi
 * berjalan pada UTC, sehingga seluruh batas periode WAJIB dihitung pada zona
 * `Asia/Jakarta` (WIB, UTC+7).
 *
 * Tanpa modul ini, `new Date()` polos pada server UTC membuat "hari ini"
 * berganti pukul 07:00 WIB — sehingga transaksi malam, jam paling ramai kafe,
 * masuk ke tanggal yang salah. Bug tersebut tidak terlihat saat pengembangan
 * lokal karena zona waktunya kebetulan sudah WIB, dan baru muncul setelah
 * deploy.
 *
 * WIB tidak mengenal daylight saving, sehingga offsetnya tetap +7 jam dan
 * perhitungan di bawah bersifat eksak — tidak bergantung pada zona waktu
 * proses yang menjalankannya.
 *
 * Seluruh fungsi di berkas ini murni: tidak melakukan I/O dan tidak membaca
 * konfigurasi runtime. Lihat kasus uji U-09 pada README §9.1.
 */

/** Selisih WIB terhadap UTC dalam milidetik. Tetap sepanjang tahun. */
export const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Rentang waktu setengah terbuka: `gte <= t < lt`. */
export type PeriodRange = { gte: Date; lt: Date };

/** Menggeser instant UTC ke "waktu dinding" WIB agar komponen tanggalnya dapat dibaca. */
function toWibWallClock(at: Date): Date {
  return new Date(at.getTime() + WIB_OFFSET_MS);
}

/** Kebalikan dari `toWibWallClock`. */
function fromWibWallClock(wall: Date): Date {
  return new Date(wall.getTime() - WIB_OFFSET_MS);
}

/** Awal hari operasional (00:00:00,000 WIB) yang memuat `at`, sebagai instant UTC. */
export function startOfBusinessDay(at: Date = new Date()): Date {
  const w = toWibWallClock(at);
  return fromWibWallClock(
    new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate()))
  );
}

/** Awal hari operasional berikutnya. Dipakai sebagai batas atas eksklusif. */
export function startOfNextBusinessDay(at: Date = new Date()): Date {
  const w = toWibWallClock(at);
  return fromWibWallClock(
    new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate() + 1))
  );
}

/** Awal bulan operasional (tanggal 1 pukul 00:00 WIB) yang memuat `at`. */
export function startOfBusinessMonth(at: Date = new Date()): Date {
  const w = toWibWallClock(at);
  return fromWibWallClock(new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), 1)));
}

/** Awal bulan operasional berikutnya. Batas atas eksklusif. */
export function startOfNextBusinessMonth(at: Date = new Date()): Date {
  const w = toWibWallClock(at);
  return fromWibWallClock(new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth() + 1, 1)));
}

/** Rentang satu hari operasional, siap dipakai sebagai filter Prisma. */
export function businessDayRange(at: Date = new Date()): PeriodRange {
  return { gte: startOfBusinessDay(at), lt: startOfNextBusinessDay(at) };
}

/** Rentang satu bulan operasional, siap dipakai sebagai filter Prisma. */
export function businessMonthRange(at: Date = new Date()): PeriodRange {
  return { gte: startOfBusinessMonth(at), lt: startOfNextBusinessMonth(at) };
}

/**
 * Rentang dari dua tanggal kalender WIB berformat `YYYY-MM-DD`, inklusif di
 * kedua ujungnya secara kalender. Dipakai oleh filter laporan (README §2.2 L-11).
 *
 * @throws bila format tanggal tidak sah atau `from` melewati `to`.
 */
export function businessRangeFromDates(from: string, to: string): PeriodRange {
  const gte = parseWibDate(from);
  const lt = startOfNextBusinessDay(parseWibDate(to));
  if (gte >= lt) {
    throw new Error("Tanggal awal tidak boleh melewati tanggal akhir.");
  }
  const startWall = toWibWallClock(gte);
  const oneYearLater = fromWibWallClock(
    new Date(
      Date.UTC(
        startWall.getUTCFullYear() + 1,
        startWall.getUTCMonth(),
        startWall.getUTCDate(),
      ),
    ),
  );
  if (lt > oneYearLater) {
    throw new Error("Rentang tanggal maksimal satu tahun per permintaan.");
  }
  return { gte, lt };
}

/**
 * Rentang inklusif untuk kolom PostgreSQL `DATE` yang tidak menyimpan zona waktu.
 * Nilainya direpresentasikan Prisma sebagai tengah malam UTC pada tanggal kalender itu.
 */
export function dateOnlyRangeFromDates(from: string, to: string): PeriodRange {
  const gte = parseDateOnly(from);
  const end = parseDateOnly(to);
  const lt = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() + 1),
  );
  if (gte >= lt) {
    throw new Error("Tanggal awal tidak boleh melewati tanggal akhir.");
  }
  const oneYearLater = new Date(
    Date.UTC(
      gte.getUTCFullYear() + 1,
      gte.getUTCMonth(),
      gte.getUTCDate(),
    ),
  );
  if (lt > oneYearLater) {
    throw new Error("Rentang tanggal maksimal satu tahun per permintaan.");
  }
  return { gte, lt };
}

function parseCalendarDateParts(value: string): {
  year: number;
  monthIndex: number;
  day: number;
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Format tanggal tidak sah: ${value}. Harus YYYY-MM-DD.`);
  }
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, monthIndex, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== monthIndex ||
    candidate.getUTCDate() !== day
  ) {
    throw new Error(`Tanggal tidak ada pada kalender: ${value}.`);
  }
  return { year, monthIndex, day };
}

/** Mengurai `YYYY-MM-DD` sebagai awal hari WIB. */
export function parseWibDate(value: string): Date {
  const { year, monthIndex, day } = parseCalendarDateParts(value);
  return fromWibWallClock(new Date(Date.UTC(year, monthIndex, day)));
}

/** Mengurai `YYYY-MM-DD` untuk kolom PostgreSQL `DATE`, tanpa pergeseran zona waktu. */
export function parseDateOnly(value: string): Date {
  const { year, monthIndex, day } = parseCalendarDateParts(value);
  return new Date(Date.UTC(year, monthIndex, day));
}

/** Memformat nilai kolom PostgreSQL `DATE` tanpa membiarkan zona proses menggesernya. */
export function formatDateOnly(at: Date, locale = "id-ID"): string {
  return at.toLocaleDateString(locale, { timeZone: "UTC" });
}

/** Tanggal kalender WIB dari sebuah instant, berformat `YYYY-MM-DD`. */
export function toWibDateString(at: Date = new Date()): string {
  const w = toWibWallClock(at);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${w.getUTCFullYear()}-${p(w.getUTCMonth() + 1)}-${p(w.getUTCDate())}`;
}
