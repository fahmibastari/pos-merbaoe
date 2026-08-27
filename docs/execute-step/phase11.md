# PHASE 11 — EXECUTION ROADMAP & IMPLEMENTATION PLAN

**Input:** Phase 0–10, `README.md`, `docs/checkpoint.md`
**Sifat dokumen:** implementation plan, bukan audit report
**Status:** Selesai

---

## 0. CARA MEMAKAI DOKUMEN INI

Dokumen ini mengubah 40 butir technical debt (Phase 9) dan Priority Matrix (Phase 10) menjadi 40 task yang dapat dieksekusi (TASK-001 s.d. TASK-040).

Arah visual aplikasi ditetapkan terpisah di `docs/design-direction.md`; TASK-026, TASK-028, TASK-029, TASK-033, dan TASK-039 mengambil nilainya dari sana.

**Aturan yang dipatuhi:**

- Tidak ada temuan baru. Setiap task merujuk **Source Finding** dari Phase 1–10.
- Tidak semua temuan menjadi task. Yang dikecualikan tercantum di §5 *Deferred*.
- Urutan ditentukan **dependency**, bukan severity semata.
- Optimasi performa hanya dimasukkan bila ada evidence (Phase 6 memisahkan *Verified* dari *Potential*).
- Path berkas hanya ditulis bila diketahui dari audit. Bila belum, ditulis `To be determined during implementation`.

**Konvensi:** Effort = Small (satu berkas / perubahan lokal) · Medium (beberapa berkas / satu modul) · Large (lintas modul atau infrastruktur baru).

---

# PHASE A — FOUNDATION & CRITICAL CORRECTIONS

---

## [TASK-001] Amankan kredensial basis data dan rahasia sesi

**Priority:** P0 · **Category:** Security · **Effort:** Small

**Source Finding** — Phase 7 SEC-01, SEC-02 · Phase 9 CD-01, CD-02

**Problem**
`supabaseConnect.txt` di akar proyek memuat password basis data teks polos dan ikut terlacak Git pada commit `da342e9`. `JWT_SECRET` tidak ada di `.env`, sehingga `lib/auth.ts:5-7` memakai nilai cadangan yang tertulis di dalam source code.

**Why It Matters**
Keduanya memberi akses penuh: yang pertama ke basis data produksi, yang kedua ke sesi administrator lewat token yang dapat ditempa siapa pun yang membaca repositori. Sesi tempaan melewati ketiga lapisan otorisasi sekaligus karena semuanya memercayai `verifySession`.

**Current State**
`.env` hanya memuat `DATABASE_URL` dan `DIRECT_URL`. Pola `.gitignore` hanya `.env*`, tidak mencakup `supabaseConnect.txt`.

**Target State**
Tidak ada kredensial dalam berkas proyek maupun riwayat. `JWT_SECRET` wajib ada, tanpa nilai cadangan.

**Affected Area** — `supabaseConnect.txt`, `.gitignore`, `.env`, `src/lib/auth.ts`, environment variable Vercel

**Dependencies** — None

**Implementation Notes**
Rotasi password di Supabase **sebelum** langkah lain. Bangkitkan kunci dengan `openssl rand -base64 32`. Ganti `process.env.JWT_SECRET ?? "..."` menjadi pembacaan yang melempar bila tidak ada. Repositori baru 4 commit — membangun ulang riwayat lebih sederhana daripada `git filter-repo`.

**Acceptance Criteria**
- [ ] Password basis data Supabase sudah dirotasi.
- [ ] `supabaseConnect.txt` tidak ada di working tree maupun riwayat Git.
- [ ] Polanya masuk `.gitignore`.
- [ ] `.env.example` ada, memuat 4 variabel §10.2 tanpa nilai.
- [ ] `JWT_SECRET` terset di `.env` dan Vercel (Production + Preview).
- [ ] Aplikasi gagal start bila `JWT_SECRET` tidak ada.
- [ ] `git ls-files | grep -i supabase` tidak mengembalikan hasil.

**Definition of Done** — Tidak ada kredensial yang dapat ditemukan dari salinan repositori, dan sesi tidak dapat ditempa tanpa mengetahui `JWT_SECRET` runtime.

---

## [TASK-002] Verifikasi status data dan tetapkan strategi migrasi ⟵ GATE

**Priority:** P0 · **Category:** Architecture · **Effort:** Small

**Source Finding** — Phase 1 GAP-06 · Phase 9 SD-02

**Problem**
Migrasi `20260822075607_init` sudah ada. Skema target §5.15 menambahkan kolom `NOT NULL` tanpa default bermakna untuk baris lama — `stock_transactions.balance_after`, `value_after`, `created_by`. Keberadaan data nyata pada basis data Supabase berstatus **Not Verified**.

**Why It Matters**
TASK-003 dapat gagal saat dijalankan, atau berhasil dengan nilai yang keliru. Ini satu-satunya butir Not Verified yang memblokir jalur kritis.

**Current State** — Audit bersifat read-only; tidak ada koneksi ke basis data.

**Target State** — Diketahui apakah ada data nyata, dan strategi migrasi ditetapkan tertulis.

**Affected Area** — `prisma/migrations/`, README §10 (tambahan subbab)

**Dependencies** — None (dapat paralel dengan TASK-001)

**Implementation Notes**
Hitung baris pada `sales`, `purchases`, `stock_transactions`, `operational_expenses`. Bila seluruhnya nol atau hanya berisi data seed → reset dan migrasi bersih, jauh lebih sederhana. Bila ada data nyata → tetapkan nilai backfill per kolom: `created_by` ke user admin, `balance_after`/`value_after` dihitung ulang berurutan dari riwayat.

**Acceptance Criteria**
- [ ] Jumlah baris setiap tabel transaksional terdokumentasi.
- [ ] Keputusan tertulis: reset bersih atau backfill.
- [ ] Bila backfill: nilai untuk setiap kolom `NOT NULL` baru ditetapkan.
- [ ] Cadangan `pg_dump` diambil sebelum TASK-003 dijalankan.

**Definition of Done** — TASK-003 dapat dijalankan tanpa risiko kehilangan data atau nilai keliru.

---

## [TASK-003] Migrasi skema ke §5.15 beserta constraint, indeks, dan sequence

**Priority:** P0 · **Category:** Architecture · **Effort:** Large

**Source Finding** — Phase 2 §4.1 · Phase 6 §4 · Phase 9 SD-01, CD-07

**Problem**
Skema aktual memiliki 10 dari 12 model, 5 dari 9 enum, kekurangan 27 kolom, dan hanya 3 dari 39 constraint/indeks. Presisi `DECIMAL(10,2)` dipakai untuk seluruh nilai termasuk harga per satuan; kolom waktu `TIMESTAMP(3)` tanpa zona.

**Why It Matters**
**15 dari 24 item Not Found pada Phase 2 terblokir langsung oleh task ini.** Tanpa `stock_value` dan `average_cost`, average costing mustahil. Tanpa 12 kolom `sales`, model DPP mustahil. Lima `CHECK` pada `sales` akan menegakkan rumus §3.4 di tingkat basis data sehingga kelas kesalahan seperti CD-03 dan CD-05 tertangkap otomatis.

**Current State** — `prisma/schema.prisma` versi lama; `migration.sql` tanpa satu pun `CHECK` maupun indeks non-unik.

**Target State** — Skema identik dengan README §5.15, ditambah 17 `CHECK`, 17 indeks, 1 partial unique index, 1 sequence.

**Affected Area** — `prisma/schema.prisma`, `prisma/migrations/`, `src/generated/prisma/` (regenerasi)

**Dependencies** — TASK-002

**Implementation Notes**
Skema §5.15 sudah lolos `npx prisma validate`; salin apa adanya. `CHECK`, partial unique index (`cashier_shifts_one_open`), dan `CREATE SEQUENCE sales_invoice_seq` tidak dapat diekspresikan Prisma — tambahkan lewat migrasi SQL kustom setelah `migrate dev`. Kode yang ada akan gagal kompilasi setelah regenerasi client (mis. `sales.totalAmount` kini memerlukan `subtotalAmount`/`netAmount`); ini diharapkan dan diperbaiki oleh TASK-007 s.d. TASK-014.

**Acceptance Criteria**
- [ ] `npx prisma validate` lulus.
- [ ] `npx prisma migrate deploy` berhasil pada basis data bersih.
- [ ] 12 model dan 9 enum ada.
- [ ] 17 `CHECK` terpasang; `INSERT` yang melanggar `sales_profit_valid` ditolak.
- [ ] 17 indeks + partial unique index terpasang.
- [ ] `sales_invoice_seq` ada.
- [ ] `UNIQUE(product_id, ingredient_id)` pada `recipes` terpasang.
- [ ] Kolom waktu bertipe `TIMESTAMPTZ`; `average_cost` bertipe `DECIMAL(14,4)`.

**Definition of Done** — Basis data cocok dengan §5.15, dan batasan menolak data yang melanggar rumus akuntansi.

---

## [TASK-004] Modul `lib/guard.ts` dan penegakan otorisasi Server Action

**Priority:** P0 · **Category:** Security · **Effort:** Small

**Source Finding** — Phase 7 SEC-06, SEC-07 · Phase 9 CD-06

**Problem**
Tujuh Server Action tidak memeriksa sesi sama sekali; dua memeriksa sesi tanpa memeriksa peran. `lib/guard.ts` yang diwajibkan §4.2 belum ada.

**Why It Matters**
README §4.3 menyebut lapisan ini "pengaman sesungguhnya" karena Server Action dipanggil lewat identitas aksi, bukan path — sehingga proteksi rute tidak menjangkaunya. Saat ini stok dapat diubah tanpa otorisasi.

**Current State** — `admin/actions.ts` baris 8, 21, 34, 41, 54, 61, 152 tanpa `getSession`; baris 68, 127 tanpa cek peran.

**Target State** — Setiap Server Action memanggil `requireAuth()` atau `requireAdmin()` pada baris pertama.

**Affected Area** — `src/lib/guard.ts` (baru), `src/app/admin/actions.ts`, `src/app/cashier/actions.ts`

**Dependencies** — None (dapat paralel dengan TASK-003)

**Implementation Notes**
`requireAdmin()` melempar bila `session?.role !== "admin"`. `submitSale` memakai `requireAuth()` — kedua peran berhak. Galat otorisasi harus dibedakan dari galat bisnis agar TASK-021 dapat menampilkannya dengan tepat.

**Acceptance Criteria**
- [ ] `src/lib/guard.ts` mengekspor `requireAuth()` dan `requireAdmin()`.
- [ ] Seluruh 9 aksi di `admin/actions.ts` memanggil `requireAdmin()` pada baris pertama.
- [ ] `submitSale` memanggil `requireAuth()`.
- [ ] Pemanggilan aksi admin dengan sesi kasir ditolak.
- [ ] Pemanggilan tanpa sesi ditolak.

**Definition of Done** — Tidak ada Server Action yang dapat dieksekusi tanpa otorisasi yang sesuai perannya.

---

## [TASK-005] Modul `lib/period.ts` dan `lib/money.ts`

**Priority:** P0 · **Category:** Business · **Effort:** Small

**Source Finding** — Phase 2 §4.1, ST-01, ST-02 · Phase 9 UD-01, MD-01

**Problem**
Batas periode dihitung dengan `new Date()` polos di dua tempat (`expenses/page.tsx:22` memanggilnya tiga kali dalam satu ekspresi, diulang di baris 43). Format rupiah didefinisikan 3 kali plus 4 inline.

**Why It Matters**
Di Vercel (UTC), "Pendapatan Hari Ini" berganti hari pukul 07:00 WIB — transaksi malam, jam paling ramai kafe, masuk ke tanggal yang salah. Tidak terlihat saat pengembangan lokal karena zona waktunya kebetulan WIB; baru muncul setelah deploy.

**Current State** — Tidak ada `lib/period.ts` maupun `lib/money.ts`.

**Target State** — Batas periode dan pemformatan uang berasal dari satu sumber, dengan fungsi murni yang dapat diuji.

**Affected Area** — `src/lib/period.ts`, `src/lib/money.ts` (baru); `dashboard/page.tsx`, `expenses/page.tsx`, `sales/page.tsx`, `purchases/page.tsx`, `ProductTable.tsx`, `IngredientTable.tsx`, `CashierPOS.tsx`

**Dependencies** — TASK-003 (kolom `TIMESTAMPTZ`)

**Implementation Notes**
`period.ts`: `startOfBusinessDay(date)`, `startOfBusinessMonth(date)`, `rangeFor(from, to)` — seluruhnya dipin ke `Asia/Jakarta` sesuai §3.3. `money.ts`: `roundRupiah()` (half-up, §3.2) dan `formatRupiah()`. Keduanya fungsi murni tanpa I/O agar memenuhi §9.1 U-09 dan U-10.

**Acceptance Criteria**
- [ ] Kedua modul berisi fungsi murni tanpa I/O.
- [ ] Batas hari/bulan dihitung pada `Asia/Jakarta` terlepas dari zona server.
- [ ] Uji dengan `TZ=UTC` menghasilkan batas yang sama dengan `TZ=Asia/Jakarta`.
- [ ] Tidak ada lagi definisi `formatRupiah`/`formatRp` lokal di komponen.
- [ ] Tidak ada lagi `new Date()` untuk perhitungan batas periode di komponen halaman.

**Definition of Done** — Seluruh batas periode dan pemformatan uang berasal dari modul terpusat, dan kasus uji §9.1 U-09/U-10 dapat ditulis.

---

## [TASK-006] Validasi `zod` pada seluruh Server Action

**Priority:** P0 · **Category:** Security · **Effort:** Medium

**Source Finding** — Phase 7 SEC-09, SEC-12, SEC-13 · Phase 9 CD-05

**Problem**
Tidak ada validasi sisi server. `submitSale` mem-*parse* JSON klien tanpa memeriksa `quantity`; telusuran `quantity: -5` menghasilkan `decrement: -90` (stok **naik**) dan `subtotal: -110000` (penjualan bernilai negatif). Nilai numerik master data juga tidak dibatasi, dan enum di-*cast* tanpa validasi.

**Why It Matters**
Sesi kasir dengan permintaan buatan dapat menaikkan stok tanpa pembelian dan mengurangi pendapatan pada laporan owner — merusak justru angka yang menjadi tujuan sistem.

**Current State** — `zod` tidak ada di `package.json`. `formData.get(...) as string` + `parseFloat` tanpa pemeriksaan di seluruh aksi.

**Target State** — Setiap Server Action memvalidasi payload dengan skema `zod` sebelum menyentuh basis data.

**Affected Area** — `package.json`, `src/lib/validation.ts` (baru), `src/app/admin/actions.ts`, `src/app/cashier/actions.ts`, `src/app/login/actions.ts`

**Dependencies** — TASK-003 (bentuk payload berubah karena kolom baru)

**Implementation Notes**
Aturan minimum §8.1: harga dan kuantitas tidak negatif, kuantitas bilangan bulat positif, tanggal tidak melampaui hari ini, enum harus bernilai sah. Ini lapisan kedua — `CHECK` dari TASK-003 adalah lapisan pertama; keduanya disyaratkan README dan saling melengkapi.

**Acceptance Criteria**
- [ ] `zod` terpasang; skema terpusat di `src/lib/validation.ts`.
- [ ] Seluruh Server Action memvalidasi sebelum operasi basis data.
- [ ] `quantity ≤ 0` pada payload checkout ditolak dengan pesan yang dapat dipahami.
- [ ] `quantity` non-integer ditolak.
- [ ] Harga jual, `base_hpp`, `unit_cost`, dan `amount` negatif ditolak.
- [ ] Nilai enum tidak sah ditolak sebelum mencapai Prisma.
- [ ] Kegagalan validasi mengembalikan bentuk hasil yang dapat ditampilkan (lihat TASK-021).

**Definition of Done** — Tidak ada payload tidak sah yang dapat mencapai basis data, dan penolakannya memberi pesan yang berguna.

---

## [TASK-007] Perbaiki rumus laba bersih dan labelnya

**Priority:** P0 · **Category:** Business · **Effort:** Small

**Source Finding** — Phase 2 §4.2 · Phase 8 CT-02 · Phase 9 CD-03

**Problem**
`dashboard/page.tsx:44-45` menghitung `netProfitMonth = grossProfitMonth - purchasesMonthTotal`. Label baris 57 berbunyi "Laba Kotor − Pembelian Bahan". Tabel `operational_expenses` tidak pernah dipakai.

**Why It Matters**
Melanggar §3.1.A: biaya bahan terhitung dua kali karena laba kotor sudah dikurangi HPP. Angka "Laba Bersih Bulan Ini" — keluaran utama sistem — tidak bermakna. Labelnya juga mengajarkan model akuntansi yang salah kepada owner.

**Current State** — Pembelian dipakai sebagai pengurang laba; beban operasional diabaikan.

**Target State** — `Laba Bersih = Laba Kotor − Total OPEX`, dengan OPEX dari `operational_expenses` (§3.8).

**Affected Area** — `src/app/admin/dashboard/page.tsx`, `src/lib/` (fungsi perhitungan)

**Dependencies** — TASK-005 (batas periode), TASK-008 (agregasi)

**Implementation Notes**
Ekstrak perhitungan ke fungsi murni agar §9.1 U-08 dapat ditulis. Pertimbangkan menampilkan pembelian sebagai baris arus kas terpisah, bukan menghapusnya dari dashboard — owner tetap perlu melihatnya, hanya bukan sebagai pengurang laba.

**Acceptance Criteria**
- [ ] Laba bersih dihitung dari `operationalExpense._sum.amount` periode berjalan.
- [ ] `purchases` tidak lagi menjadi pengurang laba di titik mana pun.
- [ ] Label kartu berbunyi "Laba Kotor − Beban Operasional".
- [ ] Perhitungan berada pada fungsi murni yang dapat diuji.
- [ ] Hasil cocok dengan simulasi README §3.10.F (Rp 82.500).

**Definition of Done** — Angka laba bersih dapat diverifikasi terhadap hitungan manual dan konsisten dengan §3.1.

---

## [TASK-008] Ganti agregasi di memori dengan agregasi basis data

**Priority:** P0 · **Category:** Business · **Effort:** Small

**Source Finding** — Phase 4 UX-12 · Phase 6 PF-04, PF-05 · Phase 8 CT-05 · Phase 9 UD-02

**Problem**
`expenses/page.tsx:15-23` mengambil `take: 50` lalu memfilter di memori dan melabelinya "Total Pengeluaran Bulan Ini". `sales/page.tsx:9,16-17` menjumlahkan 100 baris dan melabelinya "Total Pendapatan".

**Why It Matters**
Angka yang ditampilkan **salah** begitu data melewati ambang, tanpa indikasi apa pun. Melanggar §8.2 yang mewajibkan agregasi di basis data.

**Current State** — `take` + `.filter().reduce()`.

**Target State** — `prisma.*.aggregate` dengan filter periode; label menyebut cakupan.

**Affected Area** — `src/app/admin/expenses/page.tsx`, `src/app/admin/sales/page.tsx`

**Dependencies** — TASK-005

**Implementation Notes**
Pisahkan kueri daftar (berpaginasi) dari kueri agregat. Label harus menyebut periode secara eksplisit — CT-05 menunjukkan teks dan angka saat ini menyesatkan bersama-sama.

**Acceptance Criteria**
- [ ] Total pengeluaran memakai `aggregate` dengan filter bulan berjalan.
- [ ] Total penjualan memakai `aggregate` dengan filter periode eksplisit.
- [ ] Label kartu menyebut periode.
- [ ] Angka tetap benar setelah data melewati 50/100 baris.

**Definition of Done** — Seluruh angka agregat benar terlepas dari jumlah baris yang ditampilkan.

---

## [TASK-009] Atasi race condition stok pada checkout

**Priority:** P0 · **Category:** Business · **Effort:** Medium

**Source Finding** — Phase 6 PF-08, PF-09 · Phase 7 SEC-11 · Phase 9 CD-04

**Problem**
`cashier/actions.ts:65-72` (validasi) dan `:75-81` (decrement) adalah statement terpisah tanpa row lock, pada isolasi Read Committed. Batas transaksi juga terlalu lebar — `findUnique` per item berada di dalamnya, menahan kunci selama seluruh pembacaan.

**Why It Matters**
Dua checkout bersamaan atas bahan yang hanya cukup untuk satu dapat sama-sama lolos → stok negatif diam-diam → nilai persediaan dan HPP menjadi salah tanpa jejak.

**Current State** — Tanpa row lock; `CHECK (current_stock >= 0)` juga belum ada.

**Target State** — Pengurangan stok aman terhadap konkurensi, dengan `CHECK` sebagai pengaman terakhir.

**Affected Area** — `src/app/cashier/actions.ts`

**Dependencies** — TASK-003 (`CHECK`), TASK-006 (validasi kuantitas)

**Implementation Notes**
Dua pendekatan sah: `SELECT ... FOR UPDATE` **terurut menurut `ingredient_id`** untuk mencegah deadlock (§7.2), atau `UPDATE ... WHERE current_stock >= n` yang memeriksa jumlah baris terpengaruh. Pindahkan pembacaan produk ke **sebelum** transaksi dibuka untuk mempersempit jendela kontensi (PF-09). Akumulasi kebutuhan bahan per `ingredient_id` lebih dulu agar bahan yang muncul di beberapa produk hanya di-update sekali.

**Acceptance Criteria**
- [ ] Baris bahan dikunci terurut `ingredient_id` sebelum divalidasi dan dikurangi.
- [ ] Pembacaan produk dilakukan sebelum transaksi dibuka.
- [ ] Kebutuhan bahan diakumulasi sebelum update.
- [ ] Dua checkout bersamaan atas stok yang cukup untuk satu: satu berhasil, satu gagal (§9.2 I-05).
- [ ] `current_stock` tidak pernah negatif.

**Definition of Done** — Kasus uji I-05 lulus, dan stok tidak dapat menjadi negatif lewat jalur mana pun.

---

## [TASK-010] Nomor invoice dari sequence dan dikembalikan ke klien

**Priority:** P0 · **Category:** Business · **Effort:** Small

**Source Finding** — Phase 2 §4.2 · Phase 4 UX-04 · Phase 6 PF-10 · Phase 9 UD-04

**Problem**
Server memakai `` `TRX-${Date.now()}` `` (`cashier/actions.ts:101`) yang dapat bertabrakan dengan unique index. Klien membangkitkan nomor **lain** dengan cara sama (`CashierPOS.tsx:112`) untuk kotak sukses — nilainya pasti berbeda dari yang tersimpan.

**Why It Matters**
Tabrakan menyebabkan seluruh transaksi rollback dengan galat mentah. Nomor di layar tidak dapat dicari di riwayat, dan menjadi fatal begitu struk (TASK-022) dibangun di atas state ini.

**Current State** — Sequence belum dibuat; klien membangkitkan nomornya sendiri.

**Target State** — Nomor berasal dari `sales_invoice_seq` dan dikembalikan server ke antarmuka.

**Affected Area** — `src/app/cashier/actions.ts`, `src/app/cashier/CashierPOS.tsx`

**Dependencies** — TASK-003 (sequence)

**Implementation Notes**
Format §5.10: `TRX-` + tanggal WIB + `nextval` dengan `lpad` 5 digit. Server action mengembalikan `{ invoiceNumber, saleId }`; hapus pembangkitan di klien.

**Acceptance Criteria**
- [ ] Nomor dibangkitkan dari sequence di dalam transaksi.
- [ ] Format sesuai `TRX-YYYYMMDD-NNNNN` dengan tanggal WIB.
- [ ] Server action mengembalikan `invoiceNumber` dan `saleId`.
- [ ] `CashierPOS` tidak lagi memanggil `Date.now()` untuk nomor.
- [ ] Nomor pada layar dapat ditemukan di `/admin/sales`.

**Definition of Done** — Setiap transaksi memiliki nomor unik yang sama antara layar dan basis data.

---

# PHASE B — CORE BUSINESS WORKFLOW

---

## [TASK-011] Modul `lib/costing.ts` dan average costing pada pembelian

**Priority:** P0 · **Category:** Business · **Effort:** Medium

**Source Finding** — Phase 2 §4.2 · Phase 9 SD-03, SD-04

**Problem**
Pembelian hanya menaikkan `currentStock` (`admin/actions.ts:104-107`). `stock_value` dan `average_cost` tidak pernah diperbarui karena kolomnya belum ada.

**Why It Matters**
Ini prasyarat TASK-012. Tanpa harga rata-rata yang terbentuk saat pembelian, HPP dinamis tidak punya sumber nilai.

**Current State** — Alur pembelian sudah atomik dan menulis kartu stok masuk — kerangkanya benar, tinggal dilengkapi.

**Target State** — Setiap mutasi masuk memperbarui `stock_value`, `current_stock`, dan `average_cost` sesuai §3.6.A.

**Affected Area** — `src/lib/costing.ts` (baru), `src/app/admin/actions.ts`

**Dependencies** — TASK-003, TASK-005

**Implementation Notes**
Fungsi murni sesuai §3.6: `applyStockIn(current, incomingQty, unitCost)` mengembalikan `{ stockValue, currentStock, averageCost }`; `applyStockOut(current, qty)` mengurangi nilai tanpa mengubah rata-rata. Lengkapi baris `stock_transactions` dengan `total_cost`, `balance_after`, `value_after`, `reference_type`, `created_by`. Aturan §3.6.C: bila `current_stock` mencapai nol, `stock_value` dipaksa nol dan `average_cost` mempertahankan nilai terakhir.

**Acceptance Criteria**
- [ ] `lib/costing.ts` berisi fungsi murni tanpa I/O.
- [ ] Pembelian memperbarui ketiga kolom sesuai rumus §3.6.A.
- [ ] Mutasi keluar tidak mengubah `average_cost`.
- [ ] `stock_transactions` terisi lengkap termasuk `balance_after` dan `value_after`.
- [ ] Kasus uji §9.1 U-01, U-02, U-03 lulus.
- [ ] Simulasi §3.10.G menghasilkan `average_cost` Rp 161,1111/gram.

**Definition of Done** — Harga rata-rata terbentuk dan berubah dengan benar pada setiap pembelian.

---

## [TASK-012] HPP dinamis dan pencatatan mutasi stok keluar pada checkout

**Priority:** P0 · **Category:** Business · **Effort:** Medium

**Source Finding** — Phase 2 §4.2 · Phase 9 (fitur inti)

**Problem**
`cashier/actions.ts:61` menetapkan `hpp = baseHpp` dan tidak pernah menulisnya ulang — ESLint melaporkan `'hpp' is never reassigned`. Blok `hasRecipe` hanya memvalidasi stok dan mengurangi stok. Tidak ada `stockTransaction.create` di seluruh berkas.

**Why It Matters**
**Ini fitur inti sistem.** Tanpa keduanya, klaim "HPP dinamis Olsera-inspired" tidak terpenuhi, kartu stok hanya berisi mutasi masuk, dan *invariant* I-03 serta I-08 tidak dapat diuji.

**Current State** — Snapshot HPP tersimpan, tetapi nilainya statis. Stok berkurang tanpa jejak.

**Target State** — HPP = Σ(takaran × `average_cost`) dengan fallback ke `base_hpp`; setiap pengurangan stok menulis baris `out`.

**Affected Area** — `src/app/cashier/actions.ts`, `src/lib/costing.ts`

**Dependencies** — TASK-009, TASK-011

**Implementation Notes**
Tetapkan `hpp_source` sesuai §3.6.C: `recipe` bila average tersedia, `base` untuk produk tanpa resep, `fallback` bila `average_cost = 0`. Baris `out` memakai `source: 'sale'`, `reference_type: 'sale'`, `reference_id: sale.id`. Karena `sale.id` baru ada setelah `sales` dibuat, urutannya: hitung → buat sale → tulis mutasi, seluruhnya dalam satu transaksi.

**Acceptance Criteria**
- [ ] HPP produk ber-BOM dihitung dari `average_cost`, bukan `base_hpp`.
- [ ] `hpp_source` terisi benar untuk ketiga kasus.
- [ ] Setiap bahan yang berkurang menghasilkan satu baris `stock_transactions` bertipe `out`.
- [ ] **Invariant I-03:** Σ `total_cost` baris `out` = `sales.total_hpp`.
- [ ] `hpp_snapshot` transaksi lama tidak berubah setelah harga beli naik (§9.2 I-06).
- [ ] ESLint tidak lagi melaporkan `prefer-const` pada baris tersebut.

**Definition of Done** — Invariant I-03 lulus, dan fluktuasi harga supplier tercermin pada HPP transaksi berikutnya tanpa mengubah transaksi lama.

---

## [TASK-013] Perbaiki seed: saldo pembukaan sebagai transaksi `opening`

**Priority:** P1 · **Category:** Business · **Effort:** Small

**Source Finding** — Phase 2 §4.2 · Phase 9 MD-05

**Problem**
`seed.ts:43-82` mengisi `currentStock` langsung tanpa membuat `purchases` atau `stock_transactions`.

**Why It Matters**
`average_cost` akan bernilai 0 sehingga **seluruh menu ber-BOM jatuh ke jalur fallback** — TASK-012 akan tampak tidak bekerja meski kodenya benar. Sangat membingungkan saat pengujian.

**Current State** — Stok terisi tanpa riwayat perolehan.

**Target State** — Saldo pembukaan dicatat sebagai transaksi `opening` dengan harga perolehan (§3.6.C).

**Affected Area** — `prisma/seed.ts`

**Dependencies** — TASK-011

**Implementation Notes**
Pakai angka dari simulasi §3.10.A agar hasil seed dapat dicocokkan langsung dengan contoh di README — memudahkan verifikasi manual dan penulisan bab pengujian.

**Acceptance Criteria**
- [ ] Setiap bahan memiliki baris `stock_transactions` bertipe `in`, `source: 'opening'`.
- [ ] `average_cost` terisi setelah seed, tidak nol.
- [ ] Checkout menu ber-BOM setelah seed menghasilkan `hpp_source: 'recipe'`.
- [ ] Nilai cocok dengan simulasi §3.10.

**Definition of Done** — Instalasi bersih langsung dapat mendemonstrasikan average costing tanpa input manual.

---

## [TASK-014] Model DPP: diskon, pajak, uang diterima, dan kembalian

**Priority:** P1 · **Category:** Business · **Effort:** Medium

**Source Finding** — Phase 2 §4.2 · Phase 4 UX-03 · Phase 9 UD-03

**Problem**
`cashier/actions.ts:84-114` hanya mengenal `totalAmount`, `totalHpp`, `grossProfit`. Tidak ada diskon, tarif pajak, DPP, uang diterima, maupun kembalian. Kasir menghitung kembalian di kepala.

**Why It Matters**
Kembalian adalah titik kesalahan uang paling umum pada POS dan paling mudah diotomatiskan. Tanpa `cash_received`, `expected_cash` pada TASK-019 tidak dapat diverifikasi per transaksi.

**Current State** — 12 kolom `sales` yang dibutuhkan belum ada sebelum TASK-003.

**Target State** — Urutan §3.4 diterapkan penuh: Subtotal → Diskon → DPP → Pajak → Total; laba kotor dari DPP.

**Affected Area** — `src/app/cashier/actions.ts`, `src/app/cashier/CashierPOS.tsx`

**Dependencies** — TASK-003, TASK-006, TASK-012

**Implementation Notes**
Laba kotor dihitung dari DPP, **bukan** dari total yang dibayar (§3.1.C) — `CHECK sales_profit_valid` akan menolak bila keliru. Tolak checkout bila `cash_received < total_amount`. Sediakan tombol nominal cepat (Rp 50.000, Rp 100.000, uang pas) untuk mempercepat input. Pertimbangkan menghapus tampilan "Est. HPP"/"Est. Laba Kotor" dari panel kasir — lihat §5 *Deferred* DEF-01.

**Acceptance Criteria**
- [ ] Subtotal, diskon, DPP, pajak, dan total tersimpan terpisah.
- [ ] `gross_profit = net_amount − total_hpp`; seluruh `CHECK` pada `sales` lolos.
- [ ] Diskon tidak dapat melebihi subtotal.
- [ ] Input uang diterima muncul saat metode tunai dipilih.
- [ ] Kembalian dihitung otomatis dan tersimpan.
- [ ] Checkout ditolak bila uang diterima kurang dari total.
- [ ] Kasus uji §9.1 U-07, U-08 lulus.
- [ ] Angka yang ditampilkan panel kasir tidak menyimpang dari nilai yang disimpan server (Phase 4 UX-02) — dicapai dengan menghapus tampilan estimasi HPP/laba (lihat DEF-01) atau dengan menghitungnya dari sumber yang sama.

**Definition of Done** — Transaksi tunai tercatat lengkap dengan uang diterima dan kembalian, dan rumus §3.4 ditegakkan basis data.

---

## [TASK-015] Penyusun resep BOM

**Priority:** P1 · **Category:** Business · **Effort:** Medium

**Source Finding** — Phase 2 §4.3 · Phase 9 UD-06

**Problem**
Tidak ada satu pun Server Action untuk `Recipe` di seluruh `src/`. `createProduct` mengunci `hasRecipe: false` (`admin/actions.ts:49`). Resep hanya dapat dibuat lewat `seed.ts`.

**Why It Matters**
Admin tidak akan pernah dapat membuat menu ber-BOM dari aplikasi — memblokir fitur inti sistem. Menu baru apa pun otomatis tidak ber-resep.

**Current State** — Layar L-07 tidak ada.

**Target State** — Admin dapat menyusun komposisi bahan per menu, dengan pratinjau HPP dinamis terkini.

**Affected Area** — `src/app/admin/products/[id]/recipe/` (baru), `src/app/admin/actions.ts`

**Dependencies** — TASK-003 (unique constraint), TASK-004, TASK-011

**Implementation Notes**
§5.4 mensyaratkan `has_recipe` diperbarui **otomatis**: `true` saat resep pertama ditambahkan, `false` saat yang terakhir dihapus. `UNIQUE(product_id, ingredient_id)` dari TASK-003 mencegah bahan tercatat dua kali — tangani galatnya dengan pesan yang jelas. Pratinjau HPP memakai `lib/costing.ts` sehingga admin melihat dampak resep sebelum menyimpan.

**Acceptance Criteria**
- [ ] Admin dapat menambah, mengubah, dan menghapus baris resep.
- [ ] `has_recipe` diperbarui otomatis pada kedua arah.
- [ ] Bahan yang sama tidak dapat ditambahkan dua kali.
- [ ] Takaran harus lebih besar dari nol.
- [ ] Pratinjau HPP dinamis tampil dan cocok dengan hasil checkout.
- [ ] Menu ber-BOM yang dibuat dari aplikasi dapat dijual dengan `hpp_source: 'recipe'`.

**Definition of Done** — Seluruh siklus menu ber-BOM dapat dijalankan tanpa menyentuh basis data atau seed.

---

## [TASK-016] Ubah produk dan soft delete master data

**Priority:** P1 · **Category:** Business · **Effort:** Small

**Source Finding** — Phase 2 §4.3 · Phase 4 UX-08, UX-11 · Phase 9 UD-05

**Problem**
Tidak ada `updateProduct`. Penghapusan memakai hard delete yang gagal karena FK `Restrict` bila bahan dipakai resep atau menu pernah terjual — tanpa umpan balik apa pun.

**Why It Matters**
**Harga menu terkunci setelah menu pernah laku** — satu-satunya jalur (hapus lalu buat ulang) pasti gagal. Untuk kafe yang menyesuaikan harga berkala, ini menghentikan pekerjaan.

**Current State** — Hanya `createProduct`, `toggleProductActive`, `deleteProduct`.

**Target State** — Produk dan bahan dapat diubah; penghapusan diganti penonaktifan.

**Affected Area** — `src/app/admin/actions.ts`, `src/app/admin/products/ProductTable.tsx`, `src/app/admin/ingredients/IngredientTable.tsx`

**Dependencies** — TASK-003 (`ingredients.is_active`), TASK-004, TASK-021

**Implementation Notes**
Ganti `deleteProduct`/`deleteIngredient` dengan penonaktifan. Bila hard delete tetap dipertahankan untuk data yang belum pernah dipakai, tangkap galat FK dan tampilkan pesan yang menjelaskan alasannya (CT-09) — atau nonaktifkan tombolnya sejak awal dengan keterangan.

**Acceptance Criteria**
- [ ] `updateProduct` ada; harga jual dan `base_hpp` dapat diubah.
- [ ] Form ubah tersedia di L-06.
- [ ] Menu yang pernah terjual dapat dinonaktifkan, tidak dihapus.
- [ ] Bahan yang dipakai resep dapat dinonaktifkan, tidak dihapus.
- [ ] Bila penghapusan gagal karena FK, pengguna menerima pesan yang menjelaskan sebabnya.
- [ ] Riwayat transaksi tetap utuh setelah menu dinonaktifkan.

**Definition of Done** — Master data dapat dikelola sepanjang siklus hidupnya tanpa merusak riwayat.

---

## [TASK-017] Idempotensi transaksi

**Priority:** P1 · **Category:** Business · **Effort:** Medium

**Source Finding** — Phase 1 GAP-03 · Phase 4 UX-05 · Phase 7 SEC-10 · Phase 9 CD-08

**Problem**
Tidak ada kunci idempotensi. `disabled={loading}` di klien hanya melindungi dalam satu render, bukan dari pengiriman ulang setelah jaringan terputus.

**Why It Matters**
Jaringan putus setelah request terkirim → kasir mengira gagal → mengulang → stok terpotong dua kali dan pendapatan tercatat dua kali. Pada kafe dengan Wi-Fi tidak stabil, ini bukan skenario langka.

**Current State** — Tidak ada kolom kunci idempotensi pada `sales`.

**Target State** — Pengiriman ulang mengembalikan transaksi yang sama alih-alih membuat yang baru.

**Affected Area** — `prisma/schema.prisma` (migrasi tambahan), `src/app/cashier/actions.ts`, `src/app/cashier/CashierPOS.tsx`, README §3/§5 (tambahan spesifikasi)

**Dependencies** — TASK-003, TASK-010

**Implementation Notes**
**Requires verification** — README belum memodelkan ini (GAP-03), sehingga spesifikasinya perlu ditetapkan lebih dulu. Pendekatan yang diusulkan: klien membangkitkan UUID saat keranjang **dibuat** (bukan saat tombol ditekan), dikirim bersama payload, disimpan sebagai kolom unik pada `sales`. Pada pelanggaran unique, kembalikan transaksi yang sudah ada, bukan galat.

**Acceptance Criteria**
- [ ] Spesifikasi idempotensi ditambahkan ke README sebelum implementasi.
- [ ] Kolom kunci idempotensi ada dan unik.
- [ ] Pengiriman payload identik dua kali menghasilkan satu baris `sales`.
- [ ] Pengiriman kedua mengembalikan `invoiceNumber` yang sama.
- [ ] Stok hanya berkurang satu kali.
- [ ] Kunci baru dibangkitkan setelah keranjang dikosongkan.

**Definition of Done** — Pengiriman ganda tidak dapat menghasilkan dua transaksi.

---

## [TASK-018] Pembatalan transaksi (void)

**Priority:** P1 · **Category:** Business · **Effort:** Medium

**Source Finding** — README §7.4 · Phase 2 §4.2 · Phase 9 D6

**Problem**
Tidak ada mekanisme membatalkan transaksi yang tersimpan. Kesalahan kasir tidak dapat dikoreksi dari aplikasi.

**Why It Matters**
POS tanpa void memaksa koreksi manual di basis data. Ini juga jalur pemulihan yang menggantikan dialog konfirmasi pada checkout (Phase 4 UX-06).

**Current State** — Kolom `status`, `void_reason`, `voided_by`, `voided_at` dan nilai enum `sale_void` belum ada.

**Target State** — Transaksi dapat dibatalkan dengan pembalikan stok dan jejak audit; laporan mengecualikannya.

**Affected Area** — `src/app/admin/sales/page.tsx`, `src/app/admin/actions.ts`

**Dependencies** — TASK-003, TASK-004, TASK-012, TASK-025 (audit trail dapat menyusul)

**Implementation Notes**
Sesuai §7.4: stok dikembalikan dengan nilai `hpp_snapshot` yang dulu dibebankan, **bukan** `average_cost` saat ini — agar pembatalan tidak mengubah harga rata-rata secara keliru. Tulis baris `in` dengan `source: 'sale_void'`. Seluruh laporan harus memfilter `status = 'completed'`. Kewenangan void perlu ditetapkan (GAP-04) — usulan: admin saja.

**Acceptance Criteria**
- [ ] Void mengubah `status` menjadi `voided` dan mengisi ketiga kolom pendamping.
- [ ] Stok kembali sesuai kuantitas yang dulu terpakai.
- [ ] Nilai pembalikan memakai `hpp_snapshot`, dan `average_cost` tidak berubah.
- [ ] Baris `stock_transactions` `source: 'sale_void'` tertulis.
- [ ] Transaksi voided hilang dari seluruh agregasi laba dan pendapatan.
- [ ] Alasan pembatalan wajib diisi.
- [ ] Kasus uji §9.2 I-07 lulus.

**Definition of Done** — Kesalahan transaksi dapat dikoreksi dari aplikasi tanpa merusak laporan atau harga rata-rata.

---

## [TASK-019] Shift kasir

**Priority:** P1 · **Category:** Business · **Effort:** Medium

**Source Finding** — README §7.6, §5.9 · Phase 2 §4.2

**Problem**
Model `cashier_shifts` dan layar L-13/L-20 belum ada. Tidak ada pertanggungjawaban kas kasir.

**Why It Matters**
Rekonsiliasi kas harian adalah kontrol operasional dasar POS. `expected_cash` juga menjadi verifikasi silang terhadap `cash_received` dari TASK-014.

**Current State** — Tidak ada model maupun rute.

**Target State** — Kasir membuka kas sebelum bertransaksi dan menutupnya dengan hitungan fisik; owner dapat meninjau selisih.

**Affected Area** — `src/app/cashier/shift/` (baru), `src/app/admin/shifts/` (baru), `src/app/cashier/actions.ts`

**Dependencies** — TASK-003, TASK-014

**Implementation Notes**
§5.9 memakai partial unique index sehingga satu kasir hanya boleh punya satu shift terbuka. Keputusan produk 26 Agustus 2026: Admin dan Kasir sama-sama membuka shift miliknya melalui `/cashier/shift`; `/admin/shifts` adalah layar pengawasan. Pengeluaran yang secara eksplisit ditandai dibayar dari laci ditautkan ke shift aktif. Karena itu `expected_cash` = kas awal + penjualan tunai berstatus `completed` − pengeluaran dari laci pada shift tersebut. Pengeluaran non-laci tidak memengaruhi rekonsiliasi kas.

**Acceptance Criteria**
- [ ] Kasir wajib membuka shift sebelum checkout.
- [ ] Setiap `sales` terikat pada `shift_id`.
- [ ] Satu kasir tidak dapat membuka dua shift bersamaan.
- [ ] `expected_cash` dihitung dari penjualan tunai `completed` pada shift.
- [ ] Selisih tidak nol mewajibkan keterangan.
- [ ] Kasus uji §9.2 I-10 lulus.
- [ ] Jalur shift untuk Admin diputuskan dan didokumentasikan.

**Definition of Done** — Kas harian dapat dipertanggungjawabkan per shift dengan selisih yang tertelusur.

---

## [TASK-020] Penyesuaian stok, waste, dan kartu stok

**Priority:** P2 · **Category:** Business · **Effort:** Medium

**Source Finding** — README §7.5, §2.2 L-04/L-05 · Phase 2 §4.5

**Problem**
Nilai enum `adjustment` dan `waste` direncanakan tetapi tidak ada alur maupun layar. Kartu stok (L-04) belum ada meski tabelnya tersedia.

**Why It Matters**
Gelas pecah — contoh yang disebut README sendiri — tidak dapat dicatat. Selisih fisik tidak dapat ditelusuri. Rekonsiliasi §3.9 tidak dapat diverifikasi.

**Current State** — Selesai 26 Agustus 2026. L-04/L-05, layanan transaksi
atomik, relasi beban waste, dan pengujian I-08 tersedia.

**Target State** — Opname dan waste tercatat sebagai mutasi bernilai; kartu stok menampilkan saldo berjalan.

**Affected Area** — `src/app/admin/ingredients/adjustment/` dan `src/app/admin/ingredients/[id]/card/` (baru), `src/app/admin/actions.ts`

**Dependencies** — TASK-003, TASK-011, TASK-012

**Implementation Notes**
Tabel perlakuan nilai ada di §7.5. Waste otomatis mencatat `operational_expenses` kategori `lain_lain` — perlakuan akuntansinya benar (aset turun, beban naik). Implementasi memakai `operational_expenses.stock_transaction_id` agar beban otomatis dapat ditelusuri dan dikunci dari penghapusan manual.

**Acceptance Criteria**
- [x] Opname naik/turun tercatat dengan `source: 'adjustment'` dan dinilai `average_cost` berjalan.
- [x] Waste tercatat `source: 'waste'` dan membuat beban operasional otomatis.
- [x] Beban otomatis hasil waste tidak dapat dihapus lewat L-09.
- [x] Keterangan wajib pada setiap penyesuaian.
- [x] Kartu stok menampilkan mutasi kronologis dengan `balance_after` dan `value_after`.
- [x] **Invariant I-08:** persediaan awal + pembelian − HPP − waste ± penyesuaian = persediaan akhir.

**Definition of Done** — Invariant I-08 lulus dan setiap selisih stok dapat ditelusuri sampai penyebabnya.

---

# PHASE C — UX ENGINEERING

---

## [TASK-021] Bentuk hasil Server Action seragam dan penampilan galat

**Priority:** P1 · **Category:** UX · **Effort:** Medium

**Source Finding** — Phase 4 UX-07, UX-11 · Phase 6 §5 · Phase 8 CT-07, CT-08 · Phase 9 CD-09

**Problem**
Delapan Server Action tanpa try/catch. Empat komponen klien membuang nilai kembalian. `PurchaseForm.tsx:36-39` dan `ExpenseForm.tsx:14-17` menampilkan pesan sukses **tanpa syarat** setelah `await` — muncul bahkan ketika server menolak.

**Why It Matters**
Umpan balik yang **salah** lebih merusak daripada yang tidak ada: pengguna percaya data tersimpan padahal tidak. Teks galat yang sudah ditulis baik tidak pernah sampai ke pengguna.

**Current State** — Hanya login yang menampilkan galat.

**Target State** — Setiap aksi mengembalikan bentuk hasil seragam; sukses hanya ditampilkan bila benar-benar sukses.

**Affected Area** — `src/lib/action-result.ts` (baru), seluruh `actions.ts`, seluruh komponen form, `src/app/**/error.tsx` (baru)

**Dependencies** — TASK-004, TASK-006

**Implementation Notes**
Bentuk hasil: `{ ok: true, data }` atau `{ ok: false, error, fieldErrors? }`. Bedakan galat yang sengaja dilempar (tampilkan apa adanya) dari galat tak terduga (pesan umum, detail ke log) untuk mengatasi CT-08. `fieldErrors` menyiapkan jalan bagi `aria-describedby` pada TASK-031.

**Acceptance Criteria**
- [ ] Seluruh Server Action mengembalikan bentuk hasil seragam.
- [ ] Tidak ada komponen yang membuang nilai kembalian.
- [ ] Pesan sukses hanya muncul bila `ok: true`.
- [ ] Kegagalan validasi ditampilkan dekat field terkait.
- [ ] Penghapusan yang gagal karena FK menampilkan pesan yang menjelaskan sebabnya.
- [ ] Galat Prisma mentah tidak pernah tampil ke pengguna.
- [ ] `error.tsx` ada pada segmen admin dan cashier.

**Definition of Done** — Tidak ada operasi yang gagal secara senyap, dan tidak ada pesan sukses yang keliru.

---

## [TASK-022] Struk termal

**Priority:** P1 · **Category:** UX · **Effort:** Medium

**Source Finding** — README §7.7, L-17 · Phase 2 §4.5

**Problem**
Setelah checkout hanya muncul kotak notifikasi hijau berisi total (`CashierPOS.tsx:333-338`). Tidak ada CSS `@media print`.

**Why It Matters**
Kafe tidak dapat memberi bukti transaksi kepada pelanggan.

**Current State** — Belum ada; dan sampai TASK-010 selesai, nomor invoice di klien pun keliru.

**Target State** — Struk 58/80mm dapat dicetak, dirender dari data server.

**Affected Area** — `src/app/cashier/receipt/[id]/` (baru), `src/app/globals.css`

**Dependencies** — TASK-010, TASK-014

**Implementation Notes**
Isi struk sesuai §7.7. **Render dari data server berdasarkan `saleId`, bukan dari state klien** — inilah alasan TASK-010 harus mendahului. Sediakan CSS `@media print` khusus lebar struk.

**Acceptance Criteria**
- [ ] Struk memuat seluruh elemen §7.7 termasuk uang diterima dan kembalian.
- [ ] Nomor invoice pada struk sama dengan yang tersimpan.
- [ ] Waktu ditampilkan dalam WIB.
- [ ] Tata letak sesuai lebar 58mm dan 80mm.
- [ ] Data berasal dari server, bukan state klien.

**Definition of Done** — Struk yang tercetak dapat dicocokkan dengan basis data lewat nomor invoicenya.

---

## [TASK-023] Layar kasir pendukung: riwayat sendiri dan stok read-only

**Priority:** P2 · **Category:** UX · **Effort:** Small

**Source Finding** — README §2.1, L-18, L-19 · Phase 2 §4.5

**Problem**
Matriks peran §2.1 memberi kasir hak melihat riwayat transaksi sendiri dan stok bahan baku, tetapi kedua rute tidak ada. `/cashier` adalah layar tunggal tanpa navigasi.

**Why It Matters**
Kasir tidak dapat memverifikasi transaksinya sendiri atau mengecek ketersediaan sebelum menjanjikan menu ke pelanggan.

**Current State** — Hanya `/cashier`.

**Target State** — Kasir memiliki riwayat miliknya sendiri dan tampilan stok hanya baca, dengan navigasi antar layar.

**Affected Area** — `src/app/cashier/history/`, `src/app/cashier/stock/` (baru), navigasi kasir

**Dependencies** — TASK-004, TASK-026

**Implementation Notes**
Riwayat **wajib** difilter `cashierId = session.userId` di server, bukan di klien. Tambahkan navigasi kasir; sekaligus selesaikan temuan Phase 4 bahwa admin tidak punya tautan ke layar kasir.

**Acceptance Criteria**
- [x] Kasir hanya melihat transaksi miliknya sendiri (difilter di server).
- [x] Tampilan stok bersifat hanya baca dengan indikator stok menipis.
- [x] Navigasi antar layar kasir tersedia.
- [x] Admin memiliki tautan menuju layar kasir.

**Definition of Done** — Hak kasir pada §2.1 terpenuhi seluruhnya.

---

## [TASK-024] Paginasi, filter tanggal, dan pencarian

**Priority:** P2 · **Category:** UX · **Effort:** Medium

**Source Finding** — Phase 4 §7 · Phase 9 UD-08

**Problem**
Seluruh daftar memakai `take` tetap (100/50/30/8) tanpa navigasi. Dashboard terkunci pada hari ini dan bulan berjalan. Tidak ada pencarian di halaman admin mana pun.

**Why It Matters**
Data lama tidak terjangkau dari antarmuka. §8.5 melarang `take` tetap; §2.2 L-10/L-11 mensyaratkan filter tanggal.

**Current State** — Tidak ada paginasi, filter, maupun sorting.

**Target State** — Seluruh daftar berpaginasi; riwayat dan laporan dapat difilter rentang tanggal.

**Affected Area** — Seluruh halaman daftar admin, komponen paginasi bersama

**Dependencies** — TASK-005, TASK-008, TASK-026

**Implementation Notes**
Paginasi berbasis kursor atau nomor halaman. Filter tanggal memakai `lib/period.ts` agar batasnya konsisten WIB. Batasi rentang maksimal satu tahun per permintaan (§8.5).

**Acceptance Criteria**
- [x] Seluruh daftar memiliki navigasi halaman.
- [x] Riwayat penjualan dapat difilter rentang tanggal dan kasir.
- [x] Dashboard menerima pemilihan periode.
- [x] Angka agregat mengikuti filter, bukan halaman yang ditampilkan.
- [x] Batas periode dihitung pada WIB.

**Definition of Done** — Seluruh data historis terjangkau dari antarmuka, dan angka agregat selalu mencerminkan filter yang aktif.

---

## [TASK-025] Laporan laba, laporan nilai persediaan, dan jejak audit

**Priority:** P2 · **Category:** Business · **Effort:** Medium

**Source Finding** — README §3.9, §8.4, L-11/L-12/L-15 · Phase 2 §4.5

**Problem**
Tidak ada layar laporan periodik, laporan persediaan, maupun jejak audit. Model `audit_logs` belum ada.

**Why It Matters**
Laporan laba periodik adalah keluaran utama bagi owner. Laporan persediaan memungkinkan rekonsiliasi §3.9 yang menjadi bukti bahwa laba dihitung benar. Jejak audit mendukung klaim auditabilitas README.

**Current State** — Hanya dashboard hari ini dan bulan berjalan.

**Target State** — Tiga layar tersedia dengan filter periode dan ekspor.

**Affected Area** — `src/app/admin/reports/profit/`, `src/app/admin/reports/inventory/`, `src/app/admin/audit/` (baru)

**Dependencies** — TASK-007, TASK-012, TASK-020, TASK-024

**Implementation Notes**
Laporan laba mengikuti alur §6.5 termasuk langkah rekonsiliasi persediaan dan peringatan bila tidak seimbang. Jejak audit dicatat pada perubahan master data dan void. Ekspor Excel/PDF dapat menyusul bila effort membengkak — pisahkan sebagai pekerjaan lanjutan.

**Acceptance Criteria**
- [ ] Laporan laba menampilkan penjualan bersih, HPP, laba kotor, OPEX, laba bersih untuk rentang pilihan.
- [ ] Transaksi voided dikecualikan.
- [ ] Laporan persediaan menampilkan `stock_value` per bahan pada tanggal tertentu.
- [ ] Peringatan tampil bila rekonsiliasi §3.9 tidak seimbang.
- [ ] Perubahan master data dan void tercatat di `audit_logs`.
- [ ] Ekspor tersedia, atau dijadwalkan sebagai pekerjaan lanjutan yang tercatat.

**Definition of Done** — Owner dapat memperoleh laporan laba periodik yang dapat direkonsiliasi terhadap nilai persediaan.

---

# PHASE D — DESIGN SYSTEM & UI CONSOLIDATION

---

## [TASK-026] Ekstrak komponen bersama

**Priority:** P1 · **Category:** UI · **Effort:** Medium

**Source Finding** — Phase 2 ST-07 · Phase 3 §4 · Phase 9 SD-05

**Problem**
Satu-satunya komponen yang dapat dipakai ulang adalah `AdminSidebar`. Tabel, modal, form, empty state, dan umpan balik diimplementasikan ulang per halaman dengan `style={{}}` inline.

**Why It Matters**
**Penempatan waktunya menentukan.** Masih ada 12 layar yang harus dibangun (TASK-015, 018, 019, 020, 022, 023, 025). Bila komponen bersama tidak ada lebih dulu, debt visual dan UX akan berlipat 12 kali.

**Current State** — Enam varian empty state, tiga implementasi umpan balik sukses, satu modal inline, `.card` di-*override* `padding: 0` di lima tempat.

**Target State** — Komponen inti tersedia dan dipakai seluruh layar.

**Affected Area** — `src/components/` (baru), seluruh halaman admin dan kasir

**Dependencies** — TASK-021 (bentuk hasil menentukan API `<Feedback>`)

**Implementation Notes**
Minimal: `<DataTable>`, `<Modal>`, `<Field>`, `<EmptyState>`, `<Feedback>`, `<Pagination>`. Perbaiki API `.card` — sediakan varian tanpa padding alih-alih memaksa override. Hilangkan border ganda card-in-card (CP-07). `<EmptyState>` wajib menerima aksi (CT-10). `<Modal>` menjadi fondasi TASK-032.

**Acceptance Criteria**
- [x] Enam komponen inti ada di `src/components/`.
- [x] Tidak ada lagi `className="card" style={{ padding: 0 }}`.
- [x] Tidak ada border ganda pada tabel di dalam kartu.
- [x] Seluruh empty state memakai `<EmptyState>` dan menyediakan aksi.
- [x] Seluruh umpan balik memakai `<Feedback>`.
- [x] `@keyframes spin` didefinisikan satu kali.

**Definition of Done** — Layar baru dapat dibangun dari komponen yang ada tanpa menulis ulang pola.

---

## [TASK-027] Kontrak tiga state: loading, empty, error

**Priority:** P1 · **Category:** UX · **Effort:** Medium

**Source Finding** — Phase 1 GAP-01 · Phase 3 CP-04 · Phase 4 §6 · Phase 9 UD-11

**Problem**
README mendefinisikan 20 layar tanpa menyebutkan perilaku saat memuat, kosong, atau gagal. Tidak ada `loading.tsx` di rute mana pun; dua form tanpa state loading tombol.

**Why It Matters**
Tanpa kontrak, setiap layar menyelesaikannya sendiri-sendiri. Dengan 12 layar yang akan dibangun, inkonsistensinya melebar.

**Current State** — Setiap navigasi memblokir tanpa indikasi.

**Target State** — Kontrak tertulis di README dan diterapkan seragam.

**Affected Area** — README §8 (subbab baru), `src/app/**/loading.tsx`, komponen dari TASK-026

**Dependencies** — TASK-021, TASK-026

**Implementation Notes**
Pakai daftar delapan state hallmark sebagai checklist kelengkapan (Phase 10 §6.2): Default, Hover, Focus, Active, Disabled, Loading, Error, Success. Skeleton untuk konten berbentuk tetap seperti tabel; spinner inline **menggantikan** label tombol, bukan ditambahkan di sampingnya.

**Acceptance Criteria**
- [x] Kontrak tiga state tertulis di README.
- [x] `loading.tsx` ada pada seluruh segmen rute yang mengambil data.
- [x] Seluruh tabel memakai skeleton saat memuat.
- [x] Seluruh tombol submit memiliki state loading.
- [x] Seluruh empty state memuat penjelasan dan aksi.
- [x] Tidak ada elemen interaktif yang kehilangan salah satu dari delapan state.

**Definition of Done** — Setiap layar berperilaku dapat diprediksi pada ketiga kondisi.

---

## [TASK-028] Token tipografi, spasi, radius, dan penghapusan efek

**Priority:** P2 · **Category:** UI · **Effort:** Large

**Source Finding** — Phase 3 TY-02, TY-03, SP-01, CP-05, CL-03, SL-01, SL-02, VD-05 · Phase 9 VD-01, VD-06 · `docs/design-direction.md` §6, §7, §10

**Problem**
19 ukuran font berbeda (banyak berselisih 0,02rem) dan 17 nilai spasi (sebagian berselisih 0,05rem), semuanya inline. Literal warna berdampingan dengan token. Magic value tersebar.

**Why It Matters**
Setiap layar baru menambah nilai baru; konsistensi mustahil dijaga manual.

**Current State** — Token warna ada; token tipografi, spasi, dan radius tidak. Efek yang bertentangan dengan merek masih terpasang: gradasi, glass, shadow-glow, orb dekoratif.

**Target State** — Skala tipografi, spasi, dan radius terdefinisi sesuai `design-direction.md` §6–7; seluruh efek pada §10 dihapus; pasangan serif/sans terpasang lewat `next/font`.

**Affected Area** — `src/app/globals.css`, seluruh komponen

**Dependencies** — TASK-026 (menokenkan sebelum komponen diekstrak berarti menulis dua kali)

**Implementation Notes**
Nilai konkret ada di `design-direction.md`: skala tipografi 7 langkah (§6.2), spasi kisi 4px 8 langkah (§7.1), radius 3/4px (§7.2), gerak 120–160ms (§7.4). `--font-mono` harus benar-benar didaftarkan — `fontFamily: "monospace"` saat ini dirujuk di tiga tempat tanpa pernah dimuat. **D-09 selesai pada 27 Agustus 2026:** gunakan EB Garamond untuk wordmark/judul halaman sesuai pairing editorial Hallmark; Inter tetap untuk UI/data dan IBM Plex Mono untuk invoice.

**Acceptance Criteria**
- [x] Skala tipografi, spasi, dan radius terdefinisi sebagai token.
- [x] Komponen bersama sepenuhnya memakai token.
- [x] Keluarga serif dipilih berdasarkan rekomendasi Hallmark dan didokumentasikan.
- [x] Serif hanya dipakai untuk wordmark dan judul halaman; data tetap sans.
- [x] `--font-mono` terdaftar dan dipakai untuk nomor invoice.
- [x] Font dimuat lewat `next/font`, bukan `@import` CSS.
- [x] Seluruh butir §10 design-direction dihapus: gradasi, `.glass`, shadow-glow, orb login, `transition: all`, animasi masuk halaman, `.pulse-slow`.
- [x] Tidak ada satu pun `box-shadow` tersisa.
- [x] Ikon emoji diganti ikon garis satu bobot.

**Definition of Done** — Nilai visual baru berasal dari token, bukan dari improvisasi per halaman.

---

# PHASE E — ACCESSIBILITY & RESPONSIVENESS

---

## [TASK-029] Adopsi palet warna kertas Merbaoe

**Priority:** P1 · **Category:** UI / Accessibility · **Effort:** Medium

**Source Finding** — Phase 3 CL-01, CL-02 · Phase 5 A11Y-08 · Phase 9 VD-02 · `docs/design-direction.md` §2, §4

**Problem**
Dua masalah yang ternyata satu. Pertama, palet gelap yang ada gagal kontras: `--text-muted` #6b6b6b hanya mencapai 2,69:1 pada `bg-card` (ambang AA 4,5:1), dan `--danger`/`--info` gagal pada permukaan gelap. Kedua, warna merek resmi `#8A2416` **tidak dapat dipakai sama sekali** di atas latar gelap — hanya 1,60–2,14:1.

**Why It Matters**
Memperbaiki kontras palet gelap adalah pekerjaan yang akan dibuang, karena arah visual sudah ditetapkan ke kertas terang (`docs/design-direction.md`). Mengadopsi palet kertas menyelesaikan kegagalan kontras **dan** menyelaraskan aplikasi dengan merek dalam satu pekerjaan.

**Current State** — Palet gelap `#0F0F0F` + oranye `#F96C0F` pada `globals.css:10-60`. Tidak ada satu pun token yang berasal dari logo.

**Target State** — Seluruh token warna mengikuti `design-direction.md` §4: kertas `#F1EFEC`, tinta `#2B2521`, merek `#8A2416` (nilai resmi brand sheet). Seluruh 27 kombinasi teks/permukaan sudah diverifikasi lolos AA.

**Affected Area** — `src/app/globals.css`, dan setiap komponen yang memakai literal `rgba(249,108,15,...)`

**Dependencies** — None secara teknis. **Penempatan:** jangan dahulukan sebelum Phase A selesai — menyentuh berkas yang sama dua kali.

**Implementation Notes**
Nilai lengkap ada di `design-direction.md` §4.1–4.5, termasuk pembedaan garis dekoratif (boleh halus) dari batas kontrol (wajib ≥3:1, WCAG 1.4.11). Perhatikan §5.3: bata dan merah-alarm hanya berkontras 1,37 satu sama lain, sehingga aksi utama dan aksi destruktif **harus** dibedakan lewat isian-versus-outline, bukan hue.

**Acceptance Criteria**
- [x] Seluruh token permukaan, tinta, merek, semantik, dan garis mengikuti §4.
- [x] Tidak ada token gelap tersisa di `globals.css`.
- [x] Matriks kontras dihitung ulang; seluruh kombinasi teks/permukaan ≥4,5:1.
- [x] Batas kontrol interaktif ≥3:1.
- [x] Aksi utama memakai isian solid; aksi destruktif memakai outline, tidak pernah terisi.
- [x] Tidak ada literal warna yang menduplikasi token.

**Definition of Done** — Aplikasi memakai warna merek pada kekuatan aslinya, dan tidak ada kombinasi teks yang gagal AA.


---

## [TASK-030] Tabular numerals pada seluruh nominal ⟵ QUICK WIN

**Priority:** P1 · **Category:** UI · **Effort:** Small

**Source Finding** — Phase 3 TY-01 · Phase 9 VD-03 · Phase 10 §6.2

**Problem**
`grep -rn 'tabular' src/` tidak mengembalikan hasil. Seluruh nominal rupiah dirender dengan Inter proporsional.

**Why It Matters**
Digit tidak sejajar antar baris pada kolom nominal. Untuk aplikasi yang seluruh nilainya uang dan tujuannya pemindaian cepat oleh owner, ini cacat fungsional — bukan estetika. Inter mendukungnya; perbaikannya satu baris CSS.

**Current State** — Tidak ada `font-variant-numeric` di mana pun.

**Target State** — Seluruh angka uang dan kuantitas memakai tabular numerals.

**Affected Area** — `src/app/globals.css`

**Dependencies** — None ⟵ dapat dikerjakan kapan saja

**Acceptance Criteria**
- [ ] `font-variant-numeric: tabular-nums` diterapkan pada `td` dan `.stat-value`.
- [ ] Nominal pada panel kasir dan struk memakainya.
- [ ] Digit sejajar vertikal pada kolom nominal.

**Definition of Done** — Kolom nominal dapat dipindai secara vertikal tanpa digit yang bergeser.

---

## [TASK-031] Asosiasi label dan semantik form

**Priority:** P1 · **Category:** Accessibility · **Effort:** Medium

**Source Finding** — Phase 5 A11Y-01, A11Y-02, A11Y-03, A11Y-06, A11Y-11

**Problem**
21 dari 23 field tidak memiliki asosiasi label yang dapat diprogram — hanya `LoginForm` yang benar. Kolom pencarian kasir hanya ber-placeholder. Tidak ada `aria-invalid`/`aria-describedby`. Galat kasir bukan live region.

**Why It Matters**
Bagi pembaca layar, field-field ini tidak bernama. Ironinya, satu-satunya `role="alert"` berada di layar yang paling jarang dipakai, sementara layar kasir — tempat kegagalan transaksi paling berkonsekuensi — tidak memilikinya.

**Current State** — Pola `<label className="label">` + `<input name=...>` sebagai sibling tanpa `htmlFor`/`id`.

**Target State** — Seluruh field bernama; galat terhubung ke field-nya dan diumumkan.

**Affected Area** — Komponen `<Field>` dari TASK-026, `CashierPOS.tsx`, seluruh form

**Dependencies** — TASK-021, TASK-026

**Implementation Notes**
Komponen `<Field>` menangani `id`/`htmlFor`/`aria-describedby` secara otomatis — inilah mengapa TASK-026 mendahului. `LoginForm` sudah menjadi contoh pola yang benar. Kelompok metode pembayaran memerlukan `role="radiogroup"` atau `aria-pressed`.

**Acceptance Criteria**
- [x] Seluruh field memiliki `id` dan label ber-`htmlFor`.
- [x] Kolom pencarian kasir memiliki nama yang dapat diakses.
- [x] Field bergalat memakai `aria-invalid` dan `aria-describedby`.
- [x] Pesan galat dan sukses kasir memakai `role="alert"` / live region.
- [x] Status metode pembayaran terpilih terekspos ke AT.
- [x] Emoji dekoratif diberi `aria-hidden`.

**Definition of Done** — Setiap field dapat diidentifikasi dan setiap kegagalan diumumkan.

---

## [TASK-032] Modal yang dapat diakses

**Priority:** P1 · **Category:** Accessibility · **Effort:** Small

**Source Finding** — Phase 3 CP-01 · Phase 5 A11Y-07 · Phase 9 UD-07

**Problem**
Modal edit bahan baku (`IngredientTable.tsx:65-93`) tidak memiliki `role="dialog"`, `aria-modal`, focus trap, penanganan Escape, maupun pengembalian fokus. Tidak ada satu pun handler keyboard di seluruh `src/`.

**Why It Matters**
Konten di belakang overlay tetap terbaca AT tanpa penanda bahwa dialog terbuka. Tab keluar dari modal ke konten di belakangnya.

**Current State** — Overlay `<div onClick>` dengan `zIndex: 100`.

**Target State** — Komponen `<Modal>` yang memenuhi pola dialog.

**Affected Area** — Komponen `<Modal>` dari TASK-026

**Dependencies** — TASK-026

**Implementation Notes**
Pertimbangkan `<dialog>` native yang menyediakan focus trap dan Escape secara bawaan. Fokus awal ke elemen pertama yang dapat difokus; kembalikan ke pemicu saat tutup.

**Acceptance Criteria**
- [x] `role="dialog"` + `aria-modal="true"` + `aria-labelledby` menunjuk judul.
- [x] Escape menutup modal.
- [x] Fokus terperangkap di dalam modal.
- [x] Fokus kembali ke tombol pemicu setelah tutup.
- [x] Fokus awal jatuh ke elemen pertama yang dapat difokus.

**Definition of Done** — Modal dapat dioperasikan penuh dengan keyboard dan diumumkan dengan benar oleh AT.

---

## [TASK-033] Target sentuh dan responsivitas tablet

**Priority:** P1 · **Category:** Accessibility · **Effort:** Medium

**Source Finding** — Phase 3 LY-01 · Phase 5 A11Y-10, §9 · Phase 9 UD-09, VD-04

**Problem**
Dihitung dari CSS: tombol qty keranjang 28px, `.btn-sm` ≈31px, tombol metode bayar ≈31px — semuanya di bawah ambang 44px. `globals.css` tidak memiliki satu pun `@media` query; sidebar `16rem` tetap, panel keranjang `340px` tetap, enam grid dengan nilai kolom di-hardcode.

**Why It Matters**
README §8.6 menetapkan tablet sebagai **prioritas utama** layar kasir. Kontrol yang paling sering ditekan justru paling kecil. Pada tablet potret 768px, panel keranjang 340px menyisakan ±428px untuk grid produk berkolom minimum 160px.

**Current State** — Praktis desktop-only; juga gagal pada pembesaran 200% (WCAG 1.4.4).

**Target State** — Layar kasir nyaman dipakai pada tablet dengan target sentuh ≥44px.

**Affected Area** — `src/app/globals.css`, `src/app/cashier/CashierPOS.tsx`, `src/app/admin/layout.tsx`

**Dependencies** — TASK-026, TASK-028

**Implementation Notes**
Prioritaskan layar kasir; layar admin menyusul. Perbesar hit target lewat padding atau `::before` tanpa harus memperbesar visual. Tambahkan `@media (hover: hover)` agar state hover tidak menempel pada perangkat sentuh. Sidebar admin dapat diciutkan pada lebar menengah.

**Acceptance Criteria**
- [ ] Seluruh kontrol kasir memiliki target sentuh ≥44×44px.
- [ ] Layar kasir dapat dipakai pada 768px tanpa gulir horizontal.
- [ ] Sidebar admin beradaptasi pada lebar <1280px.
- [ ] Nilai grid tetap diganti nilai responsif.
- [ ] Konten admin memiliki `max-width` sehingga tabel dan baris teks tidak meregang penuh pada monitor lebar (Phase 3 LY-02).
- [ ] Gaya hover dibungkus `@media (hover: hover)`.
- [ ] Tata letak tetap dapat dipakai pada pembesaran 200%.

**Definition of Done** — Kasir dapat bekerja penuh dari tablet.

---

# PHASE F — PERFORMANCE

*Hanya berisi Verified Bottleneck. Potential Optimization dari Phase 6 masuk ke §5 Deferred.*

---

## [TASK-034] Optimalkan kueri checkout dan halaman riwayat

**Priority:** P2 · **Category:** Performance · **Effort:** Small

**Source Finding** — Phase 6 PF-01, PF-06 (Verified)

**Problem**
`cashier/actions.ts:48-56` memanggil `findUnique` per item di dalam transaksi — keranjang 10 item = 10 round-trip sambil menahan kunci. `sales/page.tsx:10-13` memuat relasi bersarang penuh untuk 100 baris hanya untuk merangkai satu string nama.

**Why It Matters**
Bukan karena lambat hari ini, melainkan karena PF-01 memperbesar jendela kontensi kunci yang menjadi akar TASK-009. PF-06 adalah over-fetching yang jelas.

**Current State** — Kueri per item; over-fetching pada riwayat.

**Target State** — Satu kueri produk untuk seluruh keranjang; riwayat hanya mengambil kolom yang dipakai.

**Affected Area** — `src/app/cashier/actions.ts`, `src/app/admin/sales/page.tsx`

**Dependencies** — TASK-009 (sebagian sudah tercakup)

**Implementation Notes**
Ganti loop `findUnique` dengan satu `findMany({ where: { id: { in: ids } } })` **sebelum** transaksi dibuka. Pada riwayat, pakai `select` yang mempersempit ke kolom yang benar-benar dirender.

**Acceptance Criteria**
- [ ] Checkout memakai satu kueri produk terlepas dari jumlah item.
- [ ] Pembacaan produk terjadi sebelum transaksi dibuka.
- [ ] Halaman riwayat memakai `select` yang dipersempit.
- [ ] Tidak ada regresi fungsional.

**Definition of Done** — Jumlah round-trip pada checkout tidak lagi bertambah seiring jumlah item.

---

# PHASE G — SECURITY, HARDENING & QUALITY

---

## [TASK-035] Infrastruktur pengujian dan 25 kasus uji

**Priority:** P1 · **Category:** Quality · **Effort:** Large

**Source Finding** — Phase 1 GAP-10 · Phase 2 §4.5 · Phase 9 SD-06

**Problem**
Tidak ada berkas uji, tidak ada framework, tidak ada CI. README §9 mendefinisikan 25 kasus uji dan §9.4 menjadikan kelulusannya sebagai kriteria selesai.

**Why It Matters**
Dua *invariant* terpenting — I-03 (kecocokan HPP) dan I-08 (rekonsiliasi persediaan) — adalah bukti utama bahwa otomatisasi bekerja. Untuk skripsi, bab Pengujian belum punya bahan.

**Current State** — Nol pengujian. Fungsi perhitungan murni yang dibutuhkan §9.1 baru ada setelah TASK-005 dan TASK-011.

**Target State** — 20 kasus uji unit dan integrasi otomatis, berjalan di CI.

**Affected Area** — `package.json`, konfigurasi test runner, `tests/` (baru), `.github/workflows/` (baru)

**Dependencies** — TASK-005, TASK-011, TASK-012

**Implementation Notes**
Tetapkan tooling lebih dulu (GAP-10). Kasus I-05 (konkurensi) memerlukan harness khusus yang tidak dapat dijalankan runner unit biasa — rencanakan basis data uji terpisah. Uji unit §9.1 hanya mungkin setelah perhitungan diekstrak menjadi fungsi murni.

**Acceptance Criteria**
- [ ] Tooling ditetapkan dan didokumentasikan di README.
- [ ] 10 kasus uji unit §9.1 lulus.
- [ ] 10 kasus uji integrasi §9.2 lulus.
- [ ] **I-03 dan I-08 lulus** — keduanya wajib.
- [ ] I-05 (konkurensi) berjalan dengan harness yang sesuai.
- [ ] CI menjalankan build, lint, dan test pada setiap push.

**Definition of Done** — Kriteria kelulusan §9.4 terpenuhi kecuali UAT.

---

## [TASK-036] Rate limit login dan manajemen pengguna

**Priority:** P2 · **Category:** Security · **Effort:** Medium

**Source Finding** — Phase 7 SEC-03, SEC-04 · Phase 9 E10 · README L-14

**Problem**
Tidak ada pembatasan percobaan login. Tidak ada layar manajemen pengguna, sehingga password bawaan `admin123`/`kasir123` tidak dapat diganti dari aplikasi.

**Why It Matters**
Kombinasi keduanya membuat brute force sepele. Kafe juga mengalami pergantian pegawai.

**Current State** — Dua akun hasil seed; kolom `users.is_active` baru ada setelah TASK-003.

**Target State** — Percobaan login dibatasi; admin dapat mengelola akun dan mengganti password.

**Affected Area** — `src/app/login/actions.ts`, `src/app/admin/users/` (baru)

**Dependencies** — TASK-003, TASK-004, TASK-021

**Implementation Notes**
§8.1: maksimal 5 kegagalan per username dalam 15 menit dengan jeda bertingkat. Jalankan `bcrypt.compare` juga saat user tidak ditemukan untuk menutup oracle waktu SEC-04. Perhatikan SEC-05: menonaktifkan pengguna tidak memutus sesi yang sedang berjalan — dokumentasikan atau tambahkan pemeriksaan `is_active` saat verifikasi sesi.

**Acceptance Criteria**
- [ ] Percobaan login dibatasi sesuai §8.1.
- [ ] Waktu respons login tidak membedakan username ada dan tidak ada.
- [ ] Admin dapat menambah kasir, menonaktifkan akun, dan mereset password.
- [ ] Password minimal 8 karakter.
- [ ] Akun nonaktif tidak dapat masuk.
- [ ] Pengguna tidak pernah dihapus, hanya dinonaktifkan.

**Definition of Done** — Kredensial bawaan dapat diganti dari aplikasi dan brute force tidak lagi sepele.

---

## [TASK-037] Lint bersih, kode mati, dan konvensi `proxy` ⟵ QUICK WIN

**Priority:** P2 · **Category:** Quality · **Effort:** Small

**Source Finding** — Phase 6 §5 · Phase 9 MD-03, MD-04, SD-07

**Problem**
`npx eslint .` gagal dengan 3 error dan 21 warning; ESLint memindai `hallmark-main/` karena tidak masuk `globalIgnores`. `test_db.js` tertinggal di akar. Konvensi `middleware` sudah usang di Next 16 — README §4.3 menetapkan `proxy.ts`.

**Why It Matters**
§9.4 menjadikan lint bersih sebagai kriteria kelulusan. Lint yang selalu merah membuat sinyalnya diabaikan. `AGENTS.md` proyek secara eksplisit meminta deprecation diperhatikan.

**Current State** — 3 error: `cashier/actions.ts:61` prefer-const, 2× `require()` di `test_db.js`.

**Target State** — Lint bersih; konvensi Next 16 diikuti.

**Affected Area** — `eslint.config.mjs`, `test_db.js`, `src/middleware.ts` → `src/proxy.ts`, `prisma/seed.ts`, `src/app/globals.css`

**Dependencies** — TASK-012 (error prefer-const hilang sendiri saat average costing selesai)

**Acceptance Criteria**
- [ ] `npx eslint .` selesai tanpa error.
- [ ] `hallmark-main/**` masuk `globalIgnores`.
- [ ] `test_db.js` dihapus.
- [ ] `src/proxy.ts` menggantikan `src/middleware.ts` dengan ekspor `proxy`.
- [ ] Build tidak lagi memunculkan peringatan deprecation.
- [ ] Kode mati dihapus (`matchaLatte`, `.pulse-slow`, duplikasi `@keyframes`).

**Definition of Done** — Build dan lint keduanya bersih.

---

# PHASE H — FINAL POLISH

---

## [TASK-038] Interaksi keyboard untuk layar kasir

**Priority:** P2 · **Category:** UX · **Effort:** Medium

**Source Finding** — Phase 4 UX-10 · Phase 5 §4 · Phase 9 UD-07

**Problem**
Tidak ada satu pun handler keyboard. Tidak ada shortcut, tidak ada Enter untuk bayar, tidak ada dukungan pemindai barcode (yang bekerja sebagai keyboard input + Enter). Urutan tab melewati seluruh kartu produk sebelum mencapai panel bayar.

**Why It Matters**
POS cepat hampir selalu dioperasikan keyboard. Setiap item saat ini menuntut perpindahan tangan ke mouse.

**Current State** — Sepenuhnya bergantung penunjuk.

**Target State** — Alur transaksi dapat diselesaikan tanpa mouse.

**Affected Area** — `src/app/cashier/CashierPOS.tsx`

**Dependencies** — TASK-014, TASK-032, TASK-033

**Implementation Notes**
Minimal: fokus otomatis ke kolom cari, Enter menambahkan hasil pertama, shortcut ke input uang diterima, Enter untuk menyelesaikan pembayaran. Dukungan pemindai mengikuti secara alami bila kolom cari menerima input cepat diikuti Enter.

**Acceptance Criteria**
- [ ] Transaksi dapat diselesaikan tanpa mouse.
- [ ] Kolom cari terfokus otomatis saat layar dibuka.
- [ ] Enter pada hasil pencarian menambahkan item.
- [ ] Ada shortcut menuju pembayaran.
- [ ] Urutan tab logis, tidak menuntut melewati seluruh produk.
- [ ] Shortcut didokumentasikan di antarmuka.

**Definition of Done** — Kasir dapat menyelesaikan transaksi penuh dari keyboard.

---

## [TASK-039] Persistensi keranjang, penyempurnaan copy, dan visual

**Priority:** P3 · **Category:** UX / Content / UI · **Effort:** Small

**Source Finding** — Phase 8 CT-01, CT-03, CT-04, CT-06, CT-09, CT-10 · Phase 9 UD-10, VD-06, MD-06, MD-07

**Problem**
Sekumpulan perbaikan kecil yang tidak blocking: keranjang hilang saat refresh; "Menu" dan "Produk" dipakai bergantian; istilah teknis "HPP Dasar" dan "BOM" bocor ke antarmuka; dua format pesan berbeda untuk kondisi stok yang sama; halaman login memuat tujuh anti-pattern; font dimuat lewat `@import` CSS; dua pola form berdampingan tanpa alasan.

**Why It Matters**
Tidak ada yang menghalangi pekerjaan, tetapi seluruhnya mengurangi kesan produk yang selesai. Persistensi keranjang punya nilai operasional nyata pada jam sibuk.

**Current State** — Lihat masing-masing temuan.

**Target State** — Konsistensi istilah, umpan balik seragam, halaman login yang proporsional.

**Affected Area** — `CashierPOS.tsx`, `ProductTable.tsx`, `login/page.tsx`, `globals.css`, `expenses/page.tsx`

**Dependencies** — TASK-026, TASK-028

**Implementation Notes**
Persistensi keranjang ke `sessionStorage` — **Requires verification**, README belum memutuskan state management (Phase 1 §4). Untuk login, cukup hapus dua orb dekoratif, gradient headline, dan glass yang tidak berfungsi; **jangan** mendesain ulang. Pindahkan font ke `next/font`.

**Acceptance Criteria**
- [ ] Keranjang bertahan melewati refresh (setelah keputusan disepakati).
- [ ] Terminologi "Menu" konsisten di seluruh teks pengguna.
- [ ] "HPP Dasar" dan "BOM" diganti istilah yang dapat dipahami.
- [ ] Pesan stok memakai satu format.
- [ ] Dialog konfirmasi menyebut nama objek dan konsekuensinya.
- [ ] Halaman login tanpa orb dekoratif dan gradient headline.
- [ ] Font dimuat lewat `next/font`.
- [ ] Pola form diseragamkan.

**Definition of Done** — Tidak ada inkonsistensi istilah atau visual yang terlihat pada penelusuran alur utama.

---

## [TASK-040] Tipe uang yang utuh di batas klien/server

**Priority:** P2 · **Category:** Architecture · **Effort:** Medium

**Source Finding** — Phase 2 ST-04 · Phase 6 §5 · Phase 9 MD-02

**Problem**
Empat halaman melewatkan hasil Prisma ke komponen klien lewat `JSON.parse(JSON.stringify(...))`. Komponen penerima mengetik field uang sebagai `unknown` lalu memaksa `Number()`.

**Why It Matters**
Type safety hilang tepat pada data paling kritis. Melanggar §3.2 README yang mensyaratkan tipe `Decimal` dipertahankan sampai lapisan tampilan. `tsc` lulus, tetapi hanya karena tipenya sudah dilepas — kompilator tidak lagi menjaga apa pun di sini.

**Current State** — `cashier/page.tsx:23`, `products/page.tsx:12`, `ingredients/page.tsx:12`, `purchases/page.tsx:20`; tipe `unknown` di `CashierPOS.tsx:11,16,22-23`.

**Target State** — Tipe DTO eksplisit untuk data yang diserialisasi; konversi terpusat; tidak ada `unknown` pada field uang.

**Affected Area** — `src/lib/money.ts`, `src/lib/dto.ts` (baru), keempat halaman di atas, `CashierPOS.tsx`

**Dependencies** — TASK-005

**Implementation Notes**
Phase 9 SD-03 menyatakan keempat modul `lib/` "sekaligus menyelesaikan MD-01 dan MD-02". Itu terlalu optimistis: `lib/money.ts` menyelesaikan duplikasi pemformatan (MD-01), tetapi tidak menyelesaikan hilangnya tipe di batas serialisasi. Task ini menutup sisanya.

**Acceptance Criteria**
- [ ] Tipe DTO eksplisit untuk setiap payload yang dikirim ke komponen klien.
- [ ] Tidak ada field uang bertipe `unknown`.
- [ ] Konversi `Decimal` → tampilan hanya terjadi di satu tempat.
- [ ] `tsc --noEmit` tetap lulus tanpa `as` yang menyembunyikan tipe.

**Definition of Done** — Tipe uang terjaga dari kueri sampai render.

---

# 1. TASK DEPENDENCY GRAPH

```text
TASK-001 Amankan kredensial ─────────────┐  (independen)
TASK-002 Verifikasi data & strategi ─────┤  ⟵ GATE
                                          ↓
                              TASK-003 Migrasi skema
                                          │
        ┌─────────────┬─────────────┬─────┴───────┬──────────────┐
        ↓             ↓             ↓             ↓              ↓
   TASK-004      TASK-005      TASK-006      TASK-010      TASK-011
    guard      period+money       zod        invoice        costing
        │             │             │             │              │
        │             ├──→ TASK-007 laba bersih   │              │
        │             ├──→ TASK-008 agregasi      │              │
        │             │                            │              │
        └─────────────┴──→ TASK-009 race ─────────┴──────────────┤
                                                                  ↓
                                                         TASK-012 HPP dinamis
                                                          + kartu stok keluar
                                                                  │
        ┌──────────────┬──────────────┬──────────────┬───────────┴──┐
        ↓              ↓              ↓              ↓              ↓
   TASK-013       TASK-014       TASK-015       TASK-017       TASK-018
   perbaiki seed   model DPP     resep BOM     idempotensi        void
                       │                                           │
                       ↓                                           │
                  TASK-019 shift ──────────────────────────────────┤
                       │                                           │
                       └──→ TASK-020 opname/waste/kartu stok ──────┘

TASK-021 bentuk hasil ──→ TASK-026 komponen bersama
                                    │
        ┌──────────┬────────────┬───┴────────┬────────────┐
        ↓          ↓            ↓            ↓            ↓
   TASK-027   TASK-028     TASK-031     TASK-032     TASK-033
  tiga state    token      label/aria     modal      touch+tablet
                   │                                      │
                   └──────────────────────────────────────┴──→ TASK-038 keyboard
                                                                      │
   TASK-016 ubah produk ⟵ TASK-021                                    ↓
   TASK-022 struk ⟵ TASK-010, TASK-014                          TASK-039 polish
   TASK-023 layar kasir ⟵ TASK-024
   TASK-024 paginasi ⟵ TASK-008, TASK-026
   TASK-025 laporan ⟵ TASK-007, TASK-020, TASK-024
   TASK-034 kueri ⟵ TASK-009
   TASK-035 pengujian ⟵ TASK-005, TASK-011, TASK-012
   TASK-036 user mgmt ⟵ TASK-003, TASK-021
   TASK-037 lint ⟵ TASK-012
```

**Parallelizable:**

- `TASK-001` ∥ `TASK-002` — keduanya independen, kerjakan bersamaan di awal.
- `TASK-030` ∥ seluruh task lain — tanpa dependency sama sekali.
- `TASK-004` ∥ `TASK-005` ∥ `TASK-006` ∥ `TASK-010` ∥ `TASK-011` — setelah TASK-003, kelimanya menyentuh berkas berbeda.
- `TASK-013` ∥ `TASK-015` ∥ `TASK-017` — setelah TASK-012.
- `TASK-027` ∥ `TASK-028` ∥ `TASK-031` ∥ `TASK-032` — setelah TASK-026.
- `TASK-034` ∥ `TASK-036` ∥ `TASK-037` — saling independen.

---

# 2. PRIORITY + EFFORT MATRIX

| Task | Priority | Impact | Effort | Dependency | Phase |
| :--- | :---: | :--- | :---: | :--- | :---: |
| TASK-001 Amankan kredensial | P0 | Menutup akses penuh ke produksi | Small | — | A |
| TASK-002 Verifikasi data | P0 | Gerbang migrasi | Small | — | A |
| TASK-003 Migrasi skema | P0 | Membuka 15 fitur | Large | 002 | A |
| TASK-004 `lib/guard.ts` | P0 | Menutup 9 aksi tanpa otorisasi | Small | — | A |
| TASK-005 period + money | P0 | Memperbaiki batas hari; buka jalan uji | Small | 003 | A |
| TASK-006 Validasi zod | P0 | Menutup kuantitas negatif | Medium | 003 | A |
| TASK-007 Rumus laba bersih | P0 | Keluaran utama menjadi bermakna | Small | 005, 008 | A |
| TASK-008 Agregasi database | P0 | Angka total menjadi benar | Small | 005 | A |
| TASK-009 Race condition | P0 | Stok tidak dapat negatif | Medium | 003, 006 | A |
| TASK-010 Invoice sequence | P0 | Transaksi dapat ditelusuri | Small | 003 | A |
| TASK-011 `lib/costing.ts` | P0 | Prasyarat fitur inti | Medium | 003, 005 | B |
| TASK-012 HPP dinamis + kartu stok | P0 | **Fitur inti sistem** | Medium | 009, 011 | B |
| TASK-013 Perbaiki seed | P1 | Fitur inti dapat didemonstrasikan | Small | 011 | B |
| TASK-014 Model DPP | P1 | Kembalian & pajak | Medium | 003, 006, 012 | B |
| TASK-015 Resep BOM | P1 | Membuka fitur inti bagi admin | Medium | 003, 004, 011 | B |
| TASK-016 Ubah produk | P1 | Harga tidak lagi terkunci | Small | 003, 021 | B |
| TASK-017 Idempotensi | P1 | Mencegah transaksi ganda | Medium | 003, 010 | B |
| TASK-018 Void | P1 | Koreksi kesalahan | Medium | 003, 012 | B |
| TASK-019 Shift kasir | P1 | Pertanggungjawaban kas | Medium | 003, 014 | B |
| TASK-020 Opname/waste/kartu stok | P2 | Invariant I-08 | Medium | 011, 012 | B |
| TASK-021 Bentuk hasil seragam | P1 | Menghapus umpan balik palsu | Medium | 004, 006 | C |
| TASK-022 Struk termal | P1 | Bukti transaksi pelanggan | Medium | 010, 014 | C |
| TASK-023 Layar kasir pendukung | P2 | Hak §2.1 terpenuhi | Small | 024 | C |
| TASK-024 Paginasi & filter | P2 | Data historis terjangkau | Medium | 008, 026 | C |
| TASK-025 Laporan & audit | P2 | Keluaran utama owner | Medium | 007, 020, 024 | C |
| TASK-026 Komponen bersama | P1 | Mencegah debt berlipat 12× | Medium | 021 | D |
| TASK-027 Kontrak tiga state | P1 | Perilaku dapat diprediksi | Medium | 021, 026 | D |
| TASK-028 Token tipografi/spasi/radius | P2 | Konsistensi visual + hapus efek off-brand | Large | 026 | D |
| TASK-029 Adopsi palet kertas | P1 | Kontras AA + selaras merek | Medium | — | E |
| TASK-030 Tabular numerals | P1 | **Impact tinggi, effort minimal** | Small | — | E |
| TASK-031 Label & aria | P1 | 21 field menjadi bernama | Medium | 021, 026 | E |
| TASK-032 Modal accessible | P1 | Dialog dapat dioperasikan | Small | 026 | E |
| TASK-033 Touch & tablet | P1 | Target perangkat §8.6 | Medium | 026, 028 | E |
| TASK-034 Optimalkan kueri | P2 | Mempersempit kontensi | Small | 009 | F |
| TASK-035 Pengujian | P1 | Kriteria §9.4 | Large | 005, 011, 012 | G |
| TASK-036 Rate limit & user mgmt | P2 | Kredensial dapat diganti | Medium | 003, 021 | G |
| TASK-037 Lint & proxy | P2 | Kriteria §9.4; hapus peringatan | Small | 012 | G |
| TASK-038 Keyboard kasir | P2 | Kecepatan POS | Medium | 014, 032, 033 | H |
| TASK-039 Polish & copy | P3 | Kesan produk selesai | Small | 026, 028 | H |
| TASK-040 Tipe uang di batas klien | P2 | Type safety pada data kritis | Medium | 005 | G |

---

# 3. QUICK WINS

Impact tinggi, effort rendah, dependency rendah, aman dikerjakan lebih awal.

| Task | Alasan |
| :--- | :--- |
| **TASK-030 Tabular numerals** | Satu baris CSS. Memperbaiki pemindaian seluruh kolom nominal — fungsi utama layar riwayat dan laporan. Tanpa dependency. |
| **TASK-001 Amankan kredensial** | Effort kecil, menutup risiko terbesar. Tanpa dependency. |
| **TASK-004 `lib/guard.ts`** | Satu berkas baru + satu baris di setiap aksi. Menutup 9 aksi tanpa otorisasi. |
| **TASK-008 Agregasi database** | Dua halaman. Mengubah angka yang salah menjadi benar. |
| **TASK-037 Lint & proxy** | Rename berkas, hapus satu berkas, tambah satu ignore. Menghapus peringatan build dan memenuhi sebagian §9.4. |

**Catatan:** TASK-003 sengaja **tidak** dimasukkan sebagai quick win meski dampaknya terbesar — effort-nya Large dan bergantung pada TASK-002.

---

# 4. FINAL EXECUTION ORDER

```text
── Gerbang keamanan & data ──────────────────────────────
 1. TASK-001  Amankan kredensial dan rahasia sesi
 2. TASK-002  Verifikasi status data & strategi migrasi   ⟵ GATE
 3. TASK-030  Tabular numerals                            ⟵ quick win, paralel

── Fondasi ──────────────────────────────────────────────
 4. TASK-003  Migrasi skema + constraint + indeks + sequence
 5. TASK-004  lib/guard.ts dan penegakan otorisasi
 6. TASK-005  lib/period.ts dan lib/money.ts
 7. TASK-006  Validasi zod
 8. TASK-008  Agregasi basis data
 9. TASK-007  Rumus laba bersih dan labelnya
10. TASK-010  Nomor invoice dari sequence
11. TASK-009  Atasi race condition stok

── Fitur inti ───────────────────────────────────────────
12. TASK-011  lib/costing.ts dan average costing
13. TASK-012  HPP dinamis dan kartu stok keluar           ⟵ fitur inti
14. TASK-013  Perbaiki seed
15. TASK-021  Bentuk hasil Server Action seragam
16. TASK-026  Ekstrak komponen bersama                    ⟵ sebelum layar baru
17. TASK-014  Model DPP: diskon, pajak, kembalian
18. TASK-015  Penyusun resep BOM
19. TASK-016  Ubah produk dan soft delete
20. TASK-017  Idempotensi transaksi

── Kelengkapan alur POS ─────────────────────────────────
21. TASK-022  Struk termal
22. TASK-018  Pembatalan transaksi (void)
23. TASK-019  Shift kasir
24. TASK-020  Opname, waste, dan kartu stok

── Kualitas antarmuka ───────────────────────────────────
25. TASK-027  Kontrak tiga state
26. TASK-032  Modal yang dapat diakses
27. TASK-031  Asosiasi label dan semantik form
28. TASK-029  Adopsi palet warna kertas Merbaoe
29. TASK-028  Token tipografi, spasi, radius, hapus efek
30. TASK-033  Target sentuh dan responsivitas tablet

── Kelengkapan data & pelaporan ─────────────────────────
31. TASK-024  Paginasi, filter tanggal, pencarian
32. TASK-023  Layar kasir pendukung
33. TASK-025  Laporan laba, persediaan, dan jejak audit

── Pengerasan & kualitas ────────────────────────────────
34. TASK-037  Lint bersih dan konvensi proxy
35. TASK-034  Optimalkan kueri checkout
36. TASK-040  Tipe uang yang utuh di batas klien/server
37. TASK-035  Infrastruktur pengujian dan 25 kasus uji
38. TASK-036  Rate limit login dan manajemen pengguna

── Penyempurnaan ────────────────────────────────────────
39. TASK-038  Interaksi keyboard kasir
40. TASK-039  Persistensi keranjang, copy, dan visual
```

**Alasan urutan yang mungkin tampak tidak intuitif:**

- **TASK-030 dikerjakan di awal** meski P1 dan bukan fondasi — tanpa dependency, effort menit, dan memperbaiki pemindaian angka sepanjang sisa pekerjaan.
- **TASK-029 justru dipindah ke akhir** meski P1. Sejak arah visual ditetapkan ke kertas terang, ia bukan lagi penyetelan tiga nilai hex melainkan pembalikan tema — harus berjalan bersama TASK-028, bukan mendahului Phase A.
- **TASK-008 mendahului TASK-007** — perhitungan laba bersih membutuhkan agregasi yang benar lebih dulu.
- **TASK-026 (komponen bersama) di posisi 17**, sebelum TASK-014/015/018/019/020 yang membangun layar baru. Bila dibalik, debt visual berlipat.
- **TASK-021 mendahului TASK-026** — bentuk hasil menentukan API `<Feedback>`.
- **TASK-035 (pengujian) di posisi 36**, bukan lebih awal — uji unit §9.1 mensyaratkan fungsi murni yang baru ada setelah TASK-005/011/012.

---

# 5. DEFERRED / DON'T DO YET

| Item | Sumber | Alasan ditunda |
| :--- | :--- | :--- |
| **DEF-01** Hapus tampilan HPP/laba dari panel kasir | Phase 4 UX-01 | **Requires verification** dengan pemilik kafe. Keputusan produk, bukan perbaikan teknis — sebagian pemilik justru ingin kasir melihatnya. |
| **DEF-02** Optimasi re-render `CashierPOS` (memo/useMemo) | Phase 6 Potential | Belum ada evidence bottleneck. Pada 5–50 produk tidak terasa. Ukur dulu bila menu tumbuh besar. |
| **DEF-03** Optimasi `canAfford` O(produk × keranjang × resep) | Phase 6 Potential | Sama. ±800 operasi per render pada skala saat ini. |
| **DEF-04** Virtualisasi daftar | Phase 6 Potential | Tidak diperlukan pada volume ini. |
| **DEF-05** Caching layer, `select` penyempit kolom menyeluruh | Phase 6 Potential | Optimasi tanpa evidence. Sebagian sudah tercakup TASK-034 pada titik yang memang terbukti. |
| **DEF-06** Analisis dan pengurangan bundle size | Phase 6 Not Verified | Keluaran build tidak melaporkan angkanya. Ukur dulu. |
| **DEF-07** Perilaku offline / offline-first | Phase 1 GAP-05 | Akan sangat memperbesar lingkup dan bertentangan §1.3. Yang dibutuhkan sekarang adalah **keputusan tertulis**, bukan implementasi. |
| **DEF-08** Kategori produk | Phase 1 GAP-08 | Pada 5–20 menu, pencarian teks memadai. Tinjau ulang bila menu tumbuh. |
| **DEF-09** Ekspor Excel/PDF | README §2.1 | Bergantung TASK-025. Pisahkan bila effort membengkak — laporan yang dapat dilihat lebih penting daripada laporan yang dapat diunduh. |
| **DEF-16** Varian tema gelap | `design-direction.md` §13 | Kertas terang berpotensi menyilaukan di kafe redup saat malam. Perlu diuji di lokasi lebih dulu. Bila diperlukan, dibangun di atas nama token yang sama — bukan mengubah arah sekarang. |
| **DEF-10** Desain ulang halaman login | Phase 3 SL-01 | Login dilihat tiga detik sehari. TASK-039 hanya menghapus dekorasi yang tidak berfungsi; desain ulang penuh adalah pekerjaan kosmetik prematur. |
| **DEF-11** Skip link, `prefers-reduced-motion`, `scope` pada `<th>` | Phase 5 Low | Dampak rendah pada konteks ini. Kerjakan setelah temuan aksesibilitas High selesai. |
| **DEF-12** Dark/light mode toggle | Phase 3 | Keputusan single-theme sah untuk POS internal. Bukan gap. |
| **DEF-13** Header keamanan HTTP, RLS Supabase | Phase 7 Not Verified | Perlu verifikasi lebih dulu apakah sudah ditangani platform. |
| **DEF-14** Lapisan repository/service/domain | Phase 6 §6 | Arsitektur route-colocated sudah sesuai skala. Menambah lapisan hanya demi teori akan memperburuk maintainability. |
| **DEF-15** Persistensi keranjang | Phase 6, Phase 9 UD-10 | Masuk TASK-039 tetapi **Requires verification** — README belum memutuskan state management (Phase 1 §4). |

---

# 6. ROADMAP SUMMARY

| Phase | Focus | Main Goal | Exit Condition |
| :---: | :--- | :--- | :--- |
| **A** | Foundation & Critical Corrections | Menutup risiko keamanan, memigrasikan skema, membenarkan angka finansial | Kredensial aman; skema §5.15 terpasang dengan 17 CHECK; laba bersih dan agregat benar; stok tidak dapat negatif |
| **B** | Core Business Workflow | Menjalankan fitur inti dan melengkapi alur POS | Average costing berfungsi; invariant I-03 lulus; admin dapat menyusun BOM; diskon/pajak/kembalian tercatat; void dan shift tersedia |
| **C** | UX Engineering | Menghapus umpan balik palsu dan melengkapi layar operasional | Tidak ada operasi gagal senyap; struk dapat dicetak; data historis terjangkau; laporan periodik tersedia |
| **D** | Design System | Membentuk bahasa visual yang konsisten dan intentional | Komponen inti dipakai seluruh layar; token tipografi/spasi terdefinisi; tidak ada duplikasi pola |
| **E** | Accessibility & Responsiveness | Aplikasi dapat dipakai di tablet dan oleh pengguna keyboard/AT | Kontras AA terpenuhi; seluruh field bernama; modal dapat dioperasikan keyboard; target sentuh ≥44px |
| **F** | Performance | Menangani bottleneck yang terverifikasi saja | Kueri checkout tidak bertambah seiring jumlah item |
| **G** | Security, Hardening & Quality | Memenuhi baseline produksi | Lint dan build bersih; 20 kasus uji lulus termasuk I-03 dan I-08; kredensial bawaan dapat diganti |
| **H** | Final Polish | Penyempurnaan yang tidak blocking | Transaksi dapat diselesaikan dari keyboard; tidak ada inkonsistensi istilah atau visual |

---

# 7. GLOBAL DEFINITION OF DONE

Aplikasi dianggap siap melanjutkan ke tahap berikutnya apabila:

- [ ] **Tidak ada kredensial** dalam berkas proyek maupun riwayat Git; `JWT_SECRET` wajib ada tanpa nilai cadangan.
- [ ] **Seluruh Server Action terotorisasi** sesuai perannya dan memvalidasi masukan.
- [ ] **Skema cocok dengan §5.15**, dengan 17 `CHECK` dan 17 indeks terpasang.
- [ ] **Average costing berfungsi**: HPP menu ber-BOM dihitung dari `average_cost`, dan `hpp_snapshot` transaksi lama tidak berubah saat harga naik.
- [ ] **Invariant I-03 lulus**: Σ nilai mutasi keluar = `sales.total_hpp`.
- [ ] **Invariant I-08 lulus**: persediaan awal + pembelian − HPP − waste ± penyesuaian = persediaan akhir.
- [ ] **Laba bersih** dihitung dari beban operasional, dan cocok dengan hitungan manual.
- [ ] **Stok tidak dapat menjadi negatif** melalui jalur mana pun, termasuk checkout bersamaan.
- [ ] **Transaksi tidak dapat terduplikasi** oleh pengiriman ulang.
- [ ] **Tidak ada operasi yang gagal secara senyap**, dan tidak ada pesan sukses yang keliru.
- [ ] **Admin dapat menjalankan siklus penuh** dari aplikasi: buat bahan → catat pembelian → susun resep → jual → lihat laporan.
- [ ] **Kasir dapat menyelesaikan transaksi tunai** lengkap dengan kembalian dan struk.
- [ ] **Kontras AA terpenuhi**; seluruh field memiliki label; modal dapat dioperasikan keyboard.
- [ ] **Layar kasir dapat dipakai pada tablet** dengan target sentuh ≥44px.
- [ ] **`npm run build` dan `npm run lint` keduanya bersih.**
- [ ] **20 kasus uji unit dan integrasi §9 lulus** dan berjalan di CI.
- [ ] **Tidak ada P0 yang tersisa terbuka.**

**Aplikasi tidak boleh dinyatakan production-ready hanya karena seluruh task selesai.** Dua hal berikut harus terpenuhi terpisah:

1. **UAT §9.3 diterima pemilik kafe** — termasuk A-02 (laporan sistem cocok dengan catatan manual) dan A-03 (selisih opname dapat dijelaskan lewat kartu stok).
2. **Butir Not Verified diverifikasi**, terutama POT-01 (eksploitabilitas Server Action), POT-03 (proteksi CSRF), header keamanan HTTP, dan pengukuran performa terhadap data nyata.

---

# 8. ROADMAP VALIDATION

| Pemeriksaan | Hasil |
| :--- | :--- |
| Apakah seluruh P0 memiliki tempat dalam roadmap? | **Ya.** 12 P0 Phase 10 → TASK-001 s.d. TASK-012, seluruhnya di Phase A dan awal Phase B. |
| Apakah P1 penting sudah masuk? | **Ya.** 17 P1 tersebar di Phase B, C, D, E, dan G. |
| Apakah dependency sudah benar? | **Ya**, diverifikasi terhadap graf §1. Tiga urutan yang tampak tidak intuitif dijelaskan alasannya di §4. |
| Apakah ada task yang redundant? | **Tidak.** Tujuh temuan digabung menjadi TASK-039 dan tiga menjadi TASK-037 justru untuk menghindari redundansi. Indeks basis data digabung ke TASK-003 alih-alih menjadi task terpisah. |
| Apakah ada task tanpa source finding? | **Tidak.** Setiap task mencantumkan Source Finding. TASK-017 dan TASK-019 memuat butir yang ditandai *Requires verification* karena README belum memutuskannya. |
| Apakah ada pekerjaan cosmetic yang ditempatkan terlalu awal? | **Tidak.** Satu-satunya pekerjaan visual di awal adalah TASK-029/030, dan keduanya masuk karena dampak fungsional (keterbacaan dan pemindaian angka), bukan estetika. Desain ulang login masuk DEF-10. |
| Apakah ada performance optimization tanpa evidence? | **Tidak.** Phase F hanya memuat TASK-034 dari kategori *Verified*. Enam butir *Potential* Phase 6 masuk DEF-02 s.d. DEF-06. |
| Apakah ada feature baru tanpa requirement? | **Tidak.** Seluruh fitur berasal dari README §2.1, §2.2, atau §7. Satu-satunya tambahan di luar README adalah idempotensi (TASK-017), yang justru mensyaratkan README diperbarui lebih dulu. |
| Apakah roadmap terlalu besar dibanding scope? | **Proporsional.** 40 task untuk aplikasi yang 12 dari 20 layarnya belum ada dan skemanya kurang 27 kolom. Sebaran effort: 15 Small, 22 Medium, 3 Large. Lima belas butir masuk Deferred justru untuk menahan lingkup. |
| Apakah roadmap dapat diikuti coding agent? | **Ya.** Setiap task memuat Affected Area dengan path nyata (atau `To be determined`), Dependencies eksplisit, Acceptance Criteria yang dapat diverifikasi, dan Definition of Done. |

**Butir yang ditandai *Requires verification* dan tidak boleh diimplementasikan sebelum diputuskan:**

- TASK-017 — spesifikasi idempotensi belum ada di README (GAP-03).
- TASK-019 — jalur shift untuk Admin (kontradiksi C-04) dan pengeluaran dari uang laci (GAP-07).
- TASK-039 — persistensi keranjang; state management belum diputuskan.
- DEF-01 — menampilkan HPP/laba di panel kasir adalah keputusan produk.

---

**Output Phase 11 selesai. Workflow Phase 0–11 selesai seluruhnya.**
