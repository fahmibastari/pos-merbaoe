# PROGRES IMPLEMENTASI — POS KOPI MERBAOE

> **Dokumen ini adalah titik masuk setiap sesi kerja.** Baca bagian §1 lebih dulu, lalu
> lanjutkan dari task pertama yang berstatus `⬜ Belum`.

**Terakhir diperbarui:** 31 Agustus 2026 · Sesi 34
**Progres:** **40 / 41 task selesai**, 1 sebagian, 0 terblokir
**Berikutnya:** UAT operasional tiga hari dan uji restore backup; TASK-001 tetap sebagian sesuai keputusan menunda deploy/riwayat Git

---

## 1. CARA MELANJUTKAN

### Kalau ini sesi pertama Anda di proyek ini

Baca berurutan, jangan dilompati:

| Urut | Dokumen | Untuk apa |
| :---: | :--- | :--- |
| 1 | `README.md` | Dokumen desain sistem — kebijakan akuntansi, skema, NFR. **Ini acuan kebenaran.** |
| 2 | `docs/checkpoint.md` — “Status Implementasi Terkini” | Ringkasan kondisi Sesi 34, bukti verifikasi, dan titik lanjut |
| 3 | `docs/execute-step/phase11.md` | **Peta jalan resmi** — spesifikasi lengkap 41 task |
| 4 | `docs/testing-checklist.md` | Runbook test otomatis, smoke test, UAT, dan pradeploy |
| 5 | `docs/design-direction.md` | Arah visual dan design token (untuk task UI saja) |
| 6 | Dokumen ini §3 | Status terkini dan apa yang harus dikerjakan berikutnya |

### Kalau Anda melanjutkan pekerjaan

1. Lihat §3 — ambil task pertama yang berstatus `⬜ Belum` dan dependency-nya sudah `✅`.
2. Buka spesifikasi lengkapnya di `phase11.md` — cari `## [TASK-0XX]`.
3. Kerjakan sampai seluruh *Acceptance Criteria*-nya terpenuhi.
4. Jalankan pemeriksaan §5 sebelum menandai selesai.
5. Perbarui §3 dan tambahkan entri di §6.

### Aturan yang berlaku sepanjang proyek

- **`README.md` adalah acuan.** Bila kode dan README berbeda, README yang benar — kecuali README-nya sendiri yang keliru, dan itu diperbaiki lebih dulu.
- **Jangan menandai task selesai sebelum seluruh Acceptance Criteria terpenuhi.** Sebagian selesai tetap `🟡`.
- **Jangan melewati dependency.** Urutan di §3 sudah memperhitungkannya.
- Setiap perubahan skema lewat migrasi Prisma, tidak pernah mengubah basis data langsung.
- `npm run build` harus tetap lulus setelah setiap task.

---

## 2. STATUS KESELURUHAN

| | Jumlah |
| :--- | ---: |
| ✅ Selesai | 40 |
| 🟡 Sebagian | 1 |
| ⛔ Terblokir | 0 |
| ⚠️ Menunggu keputusan | 0 |
| ⬜ Belum | 0 |
| **Total** | **41** |

Tidak ada task implementasi yang menunggu keputusan atau terblokir. TASK-001 tetap
sebagian karena deployment dan pembersihan riwayat Git sengaja ditunda.

**Selesai sampai sesi ini:** TASK-002, TASK-030, TASK-003, TASK-004, TASK-005, TASK-006, TASK-008, TASK-007, TASK-010, TASK-009, TASK-011, TASK-012, TASK-013, TASK-021, TASK-026, TASK-014, TASK-015, TASK-016, TASK-017, TASK-022, TASK-018, TASK-019, TASK-020, TASK-027, TASK-032, TASK-031, TASK-029, TASK-024, TASK-023, TASK-028, TASK-033, TASK-041, TASK-025, TASK-037, TASK-034, TASK-040, TASK-036, TASK-038, TASK-039, TASK-035.

**Tidak ada blocker aktif.** D-13 selesai setelah reset database development mendapat persetujuan eksplisit dan migrasi target diterapkan.

### Ringkasan handoff Sesi 34

| Area | Kondisi saat ini |
| :--- | :--- |
| Fondasi database dan akuntansi | Skema target, constraint, sequence invoice, average costing, HPP snapshot, DPP/pajak, idempotensi, void, shift, opname, waste, dan kartu stok sudah selesai. |
| Alur operasional | POS, resep BOM, struk termal, rekonsiliasi shift, soft delete master, riwayat transaksi milik kasir, stok read-only, serta umpan balik Server Action sudah tersedia. |
| Fondasi UI | Komponen bersama, kontrak tiga state, modal/form aksesibel, palet kertas, token visual, koreksi komposisi, sidebar adaptif, serta layout POS desktop/tablet/mobile sudah selesai. |
| Foto produk | Skema, migrasi, fallback 4:3, UI admin, dan alur server unggah/ganti/hapus sudah tersedia. Storage telah dikonfigurasi; bucket publik `menu-images` dan smoke test upload/read/delete lulus tanpa menyisakan fixture. |
| Verifikasi terakhir | Prisma valid; TypeScript dan full ESLint lulus; **82 test Node** dan **11 test Playwright** lulus; build produksi lulus dengan **23 route**. |
| Review pengujian | U-01–U-10 dan I-01–I-10 memiliki regresi otomatis. Playwright membuktikan login/peran, rute admin, checkout/struk, dan responsivitas 1440/768/375 px. CI PostgreSQL sementara tersedia tanpa deploy atau akses Supabase development. |
| Runbook pengujian | `docs/testing-checklist.md` memuat perintah baseline, matriks U/I, smoke manual, QA responsif/aksesibilitas, UAT tiga hari, serta gate pradeploy. |
| Smoke Sesi 33 | Alur browser kategori → bahan → pembelian → menu/resep → QRIS/void → pengeluaran → pengguna/audit lulus. Seluruh fixture dibersihkan. Lima temuan aplikasi QA-001/002/003/005/006 sudah diperbaiki serta lolos retest; QA-004 adalah pemulihan dependency lokal, bukan bug aplikasi. |
| Deploy dan rahasia | Password database Supabase sudah dirotasi setelah alert GitGuardian; URL lokal baru terverifikasi. Belum ada deployment/Vercel; pembersihan riwayat Git dan secret produksi masih tertunda. |
| Kategori menu | TASK-041 selesai: master dinamis, relasi wajib, modal admin, filter tabel/POS, backfill, audit, dan pengaman penonaktifan telah tersedia. |
| TASK-025 | **Selesai.** Source, migrasi, audit atomik, test, build, runtime HTML/CSV, auth, performa, dan QA visual 1440/768/375 px lengkap. |
| TASK-037 | **Selesai.** Full lint 0 error/0 warning, Hallmark di-ignore, `test_db.js` dihapus, dan `src/proxy.ts` menggantikan middleware tanpa regresi akses. |
| TASK-034 | **Selesai.** Checkout terukur satu kueri produk di luar transaksi; payload produk turun 56,5% dan riwayat turun 45,5% melalui `select` eksplisit. |
| TASK-040 | **Selesai.** Empat boundary memakai DTO eksplisit; Decimal menjadi string serializable bertipe dan seluruh konversi melalui `money.ts`. |
| TASK-036 | **Selesai.** Throttle database 5/15 menit, bcrypt dummy, akun nonaktif ditolak, versi sesi, `/admin/users`, reset password, soft deactivation, dan audit pengguna tersedia. |
| TASK-038 | **Selesai.** Fokus awal pencarian, `/`, Enter hasil pertama, F2 pembayaran, Enter checkout tunai, roving Tab/panah kartu, petunjuk UI, dan live announcement tersedia. |
| TASK-039 | **Selesai.** Keranjang session per kasir+shift, expiry 8 jam, rekonsiliasi katalog/stok, copy “Menu”, pesan stok seragam, label HPP terbaca, dan konfirmasi konsekuensi tersedia. |
| TASK-035 | **Selesai.** D-10 menetapkan `node:test` + Prisma + Playwright; tujuh gap integrasi ditutup, 11 E2E lulus, dan GitHub Actions QA tersedia. |
| Titik lanjut | Jalankan UAT operasional minimal tiga hari dan uji restore backup. TASK-001 tetap sebagian sesuai keputusan menunda deploy/riwayat Git. |

---

## 3. DAFTAR TASK

Urutan mengikuti *Final Execution Order* pada `phase11.md` §4. Kolom **Dep** menyebut task yang harus selesai lebih dulu.

Legenda: `⬜ Belum` · `🔵 Dikerjakan` · `🟡 Sebagian` · `✅ Selesai` · `⛔ Terblokir` · `⚠️ Menunggu keputusan`

### Fondasi — keamanan & skema

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 1 | TASK-001 Amankan kredensial dan rahasia sesi | P0 | S | — | 🟡 | Rotasi Supabase dan pengamanan runtime selesai; salinan lokal/riwayat Git serta secret Vercel masih tersisa |
| 2 | TASK-002 Verifikasi status data & strategi migrasi | P0 | S | — | ✅ | 30 baris, hanya 1 transaksi uji. **Keputusan: reset bersih** |
| 3 | TASK-030 Tabular numerals | P1 | S | — | ✅ | `td`, `.stat-value`, utilitas `.num`; 7 titik nominal kasir |
| 4 | TASK-003 Migrasi skema + constraint + indeks | P0 | **L** | 002 | ✅ | 12 model, 9 enum, 17 `CHECK`, 17 indeks, partial unique, sequence; reset + seed berhasil |
| 5 | TASK-004 `lib/guard.ts` + otorisasi Server Action | P0 | S | — | ✅ | 10 aksi terjaga; `AuthorizationError` terpisah dari galat bisnis |
| 6 | TASK-005 `lib/period.ts` + `lib/money.ts` | P0 | S | 003 | ✅ | 18 uji lulus di TZ=UTC **dan** TZ=Asia/Jakarta (U-09, U-10) |
| 7 | TASK-006 Validasi `zod` | P0 | M | 003 | ✅ | **S5 tertutup.** 20 uji lulus; `lib/validation.ts` |
| 8 | TASK-008 Agregasi basis data | P0 | S | 005 | ✅ | `expenses` & `sales` memakai `aggregate`; label menyebut cakupan |
| 9 | TASK-007 Rumus laba bersih + label | P0 | S | 005, 008 | ✅ | `lib/profit.ts`, 10 uji cocok dengan simulasi README §3.10 |
| 10 | TASK-010 Nomor invoice dari sequence | P0 | S | 003 | ✅ | Sequence di dalam transaksi; server mengembalikan `invoiceNumber` + `saleId`; nomor tampil di kasir |
| 11 | TASK-009 Race condition stok | P0 | M | 003, 006 | ✅ | Produk dibaca di luar transaksi; kebutuhan bahan diagregasi; `FOR UPDATE` terurut; I-05 lulus |

### Fitur inti — average costing

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 12 | TASK-011 `lib/costing.ts` + average costing pembelian | P0 | M | 003, 005 | ✅ | Helper murni `applyStockIn/Out`; pembelian memakai lock terurut; U-01–U-03 dan I-01 lulus |
| 13 | TASK-012 HPP dinamis + kartu stok keluar | P0 | M | 009, 011 | ✅ | HPP BOM dari average cost; jalur base/fallback; kartu stok `out`; I-03 dan I-06 lulus |
| 14 | TASK-013 Perbaiki seed → transaksi `opening` | P1 | S | 011 | ✅ | 7 opening idempotent; average cost nonnol; simulasi Rp5.250 dan jalur `recipe` lulus |
| 15 | TASK-021 Bentuk hasil Server Action seragam | P1 | M | 004, 006 | ✅ | 12 action memakai `ok/data` atau `ok:false/error/fieldErrors`; seluruh pemanggil memeriksa hasil |
| 16 | TASK-026 Ekstrak komponen bersama | P1 | M | 021 | ✅ | `DataTable`, `Modal`, `Field`, `EmptyState`, `Feedback`, `Pagination`; seluruh layar lama dimigrasikan |

### Kelengkapan alur POS

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 17 | TASK-014 Model DPP: diskon, pajak, kembalian | P1 | M | 003, 006, 012 | ✅ | Decimal; U-07/U-08; tunai kurang ditolak; nominal cepat dan nilai server ditampilkan |
| 18 | TASK-015 Penyusun resep BOM | P1 | M | 003, 004, 011 | ✅ | L-07; simpan atomik; HPP preview sama dengan checkout; `has_recipe` sinkron |
| 19 | TASK-016 Ubah produk + soft delete | P1 | S | 003, 021 | ✅ | Edit harga/HPP; produk dan bahan memakai aktif/nonaktif; hard delete dihapus |
| 20 | TASK-017 Idempotensi transaksi | P1 | M | 003, 010 | ✅ | UUID stabil; fingerprint SHA-256; replay aman; UNIQUE + pemulihan P2002; retry sekuensial/konkuren lulus |
| 21 | TASK-022 Struk termal | P1 | M | 010, 014 | ✅ | L-17 server-rendered; 58/80mm; waktu WIB; print CSS; akses kasir dibatasi pemilik sale |
| 22 | TASK-018 Pembatalan transaksi (void) | P1 | M | 003, 012 | ✅ | Admin saja; reversal dari kartu stok historis; audit log; I-07 lulus |
| 23 | TASK-019 Shift kasir | P1 | M | 003, 014 | ✅ | Admin/Kasir memakai L-20; pengeluaran laci tertaut shift; I-10 lulus |
| 24 | TASK-020 Opname, waste, kartu stok | P2 | M | 011, 012 | ✅ | L-04/L-05; beban waste tertaut dan terkunci; I-08 lulus |

### Kualitas antarmuka

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 25 | TASK-027 Kontrak tiga state | P1 | M | 021, 026 | ✅ | Skeleton root/admin/kasir; error + not-found; 13 submit memakai spinner pengganti label; empty state selalu punya aksi |
| 26 | TASK-032 Modal yang dapat diakses | P1 | S | 026 | ✅ | Semantik dialog, fokus awal/trap/return, Escape, scroll lock; diuji langsung lewat keyboard |
| 27 | TASK-031 Asosiasi label + semantik form | P1 | M | 021, 026 | ✅ | Semua kontrol terlihat berlabel; galat terhubung dan diumumkan; metode bayar serta kontrol ikon memiliki nama/semantik AT |
| 28 | TASK-029 Adopsi palet kertas Merbaoe | P1 | M | — | ✅ | Token §4 diterapkan; 27 kombinasi teks/permukaan lulus AA; kontrol 3,08:1; primary solid dan destructive outline |
| 29 | TASK-028 Token tipografi/spasi/radius + hapus efek | P2 | **L** | 026 | ✅ | Workbench kertas; EB Garamond/Inter/IBM Plex Mono; token penuh; logo resmi; ikon garis; efek off-brand nol |
| 30 | TASK-033 Koreksi komposisi + touch + tablet | P1 | **L** | 026, 028 | ✅ | Login optis; dashboard terkelompok; sidebar adaptif; POS 768/mobile; foto asli opsional + fallback |

### Kelengkapan data & pelaporan

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 31 | TASK-041 Kategori menu dinamis + katalog POS | P1 | M | 016, 026, 033 | ✅ | Master kategori di halaman Menu & Produk; relasi wajib; filter POS; backfill Kopi/Non Kopi |
| 32 | TASK-024 Paginasi, filter tanggal, pencarian | P2 | M | 008, 026 | ✅ | Semua daftar admin berpaginasi; pencarian/filter server-side; dashboard dan agregat mengikuti periode WIB; batas 1 tahun diuji |
| 33 | TASK-023 Layar kasir: riwayat + stok read-only | P2 | S | 024 | ✅ | Filter kepemilikan server; stok aktif read-only; navigasi kasir/admin |
| 34 | TASK-025 Laporan laba, persediaan, jejak audit | P2 | **L** | 007, 012, 020, 024 | ✅ | QA 1440/768/375 px; CSV, empty/error state, audit detail, dan struktur cetak lulus |

### Pengerasan & kualitas

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 35 | TASK-037 Lint bersih, kode mati, `proxy.ts` | P2 | S | 012 | ✅ | Full lint 0/0; Hallmark di-ignore; proxy Next 16; build tanpa deprecation |
| 36 | TASK-034 Optimalkan kueri checkout | P2 | S | 009 | ✅ | 1 kueri produk sebelum transaksi; `select` sempit checkout dan riwayat; payload terukur turun |
| 37 | TASK-040 Tipe uang utuh di batas klien/server | P2 | M | 005 | ✅ | DTO eksplisit, `select` sempit, Decimal string serializable, tanpa `unknown`/round-trip JSON |
| 38 | TASK-035 Infrastruktur pengujian + 25 kasus uji | P1 | **L** | 005, 011, 012 | ✅ | `node:test` + Prisma + Playwright; U/I lengkap, 82 Node test, 11 E2E, CI PostgreSQL sementara |
| 39 | TASK-036 Rate limit login + manajemen pengguna | P2 | M | 003, 021 | ✅ | Database throttle; bcrypt dummy; session version; tambah Kasir/reset/status/audit; 5 test baru |

### Penyempurnaan

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 40 | TASK-038 Interaksi keyboard kasir | P2 | M | 014, 032, 033 | ✅ | Fokus cari + `/`; Enter tambah hasil; F2 pembayaran; roving Tab/panah; shortcut terlihat; 4 test baru |
| 41 | TASK-039 Persistensi keranjang, copy, visual | P3 | S | 026, 028 | ✅ | `sessionStorage` per kasir+shift; expiry 8 jam; restore aman; copy/stock/HPP/konfirmasi dirapikan; 5 test baru |

---

## 4. MENUNGGU KEPUTUSAN ATAU AKSI ANDA

Tidak ada task implementasi yang menunggu keputusan atau sedang terblokir.

| # | Butir | Menahan | Apa yang dibutuhkan |
| :---: | :--- | :--- | :--- |
| **D-01** | ~~Rotasi password Supabase~~ | — | **SELESAI (28 Agu 2026).** Dilakukan setelah alert GitGuardian; kedua URL koneksi lokal diperbarui. Delapan migrasi up to date dan query read-only berhasil. |
| **D-02** | ~~Visibilitas repo GitHub~~ | — | Menyusul D-01. Tetap layak dicek agar tingkat risikonya diketahui. |
| **D-03** | ~~Izin membersihkan riwayat Git~~ | — | Menyusul D-01. |
| **D-04** | **`JWT_SECRET` produksi** | Deploy | **DITUNDA.** Belum ada rencana deploy/Vercel. Nilai lokal tersedia; secret produksi wajib diset sebelum deploy pertama. |
| **D-05** | ~~Basis data berisi data nyata?~~ | — | **SELESAI.** 30 baris, seluruhnya seed kecuali 1 transaksi uji. Keputusan: reset bersih. |
| **D-13** | ~~Izin menjalankan `prisma migrate`~~ | — | **SELESAI (25 Agu 2026).** Reset disetujui eksplisit; migrasi `align_with_design_doc` diterapkan dan database di-seed ulang. |
| **D-06** | ~~Spesifikasi idempotensi~~ | — | **SELESAI (26 Agu 2026).** Kontrak ditetapkan pada README §3.11 dan diterapkan oleh TASK-017. |
| **D-07** | ~~Jalur shift untuk Admin~~ | — | **SELESAI (26 Agu 2026).** Admin dan Kasir membuka shift miliknya melalui `/cashier/shift`; `/admin/shifts` untuk pengawasan seluruh shift. |
| **D-08** | ~~Pengeluaran dari uang laci~~ | — | **SELESAI (26 Agu 2026).** Pengeluaran laci ditautkan ke shift aktif dan mengurangi `expected_cash`; pengeluaran non-laci tidak memengaruhi rekonsiliasi kas. |
| **D-09** | ~~Keluarga serif~~ | — | **SELESAI (27 Agu 2026).** EB Garamond dipilih mengikuti rekomendasi pairing editorial Hallmark; terbatas pada wordmark/judul. Inter tetap untuk UI/data. |
| **D-14** | ~~Penempatan pengelolaan kategori~~ | — | **SELESAI (28 Agu 2026).** Kategori dikelola dari panel/modal `Kelola Kategori` pada halaman Menu; tidak menambah halaman atau item sidebar baru. |
| **D-15** | ~~Format ekspor inti TASK-025~~ | — | **SELESAI (28 Agu 2026).** Inti memakai CSV sesuai filter dan tampilan cetak/simpan PDF browser. XLSX asli serta PDF buatan server tetap DEF-09 sampai ada kebutuhan operasional. |
| **D-10** | ~~Tooling pengujian~~ | — | **SELESAI (31 Agu 2026).** `node:test` + Prisma dipertahankan untuk unit/integrasi; Playwright Test dipakai untuk browser E2E; CI memakai PostgreSQL sementara dan Chromium tanpa deploy. Maestro opsional untuk mobile/PWA dan WireMock ditunda sampai ada API eksternal. |
| **D-11** | ~~Persistensi keranjang~~ | — | **SELESAI (30 Agu 2026).** `sessionStorage` per kasir+shift, expiry 8 jam, payload ID+jumlah, rekonsiliasi katalog/stok, dan pembersihan setelah sukses/kosongkan ditetapkan di README §3.12. |
| **D-12** | **Favicon** | Pra-rilis | Empat varian PNG transparan tersedia, tetapi `Logo-IconOnly.png` berasio 2,25:1 dan tidak aman dipotong otomatis tanpa merusak komposisi. Minta ekspor persegi resmi 32×32, 180×180, dan `.ico`; tidak menghalangi acceptance palet TASK-029. |

**Catatan operasional foto menu (bukan blocker task berikutnya).** Database dan aplikasi
mendukung foto opsional. `.env` lokal telah dikonfigurasi, bucket publik `menu-images`
berhasil dibuat dengan batas 3 MiB dan MIME JPEG/PNG/WebP, serta smoke test
upload/read/delete lulus tanpa menyisakan fixture. Fallback tanpa foto tetap menjadi
kondisi sah; foto asli dapat diunggah dari form produk.

---

## 4b. RIWAYAT PENYELESAIAN D-13

D-13 selesai pada 25 Agustus 2026. Snapshot JSON pra-reset disimpan di direktori
temporary lokal, database development di-reset, dua migrasi diterapkan, Prisma
Client dibangkitkan ulang, dan seed berhasil. Tidak ada tindakan manual tersisa.

---

## 5. PEMERIKSAAN SEBELUM MENANDAI TASK SELESAI

Jalankan seluruhnya. Bila ada yang gagal, task belum selesai.

```powershell
npx tsc --noEmit      # wajib lulus
npm run build         # wajib lulus
npx eslint src        # area aplikasi wajib lulus
node --import tsx --test "src/**/*.test.ts"
```

Lint seluruh repo sudah bersih setelah TASK-037; `npx eslint .` wajib tetap lulus tanpa
error maupun warning pada setiap task berikutnya.

Ditambah, khusus untuk task yang menyentuh logika finansial:

- [ ] Seluruh *Acceptance Criteria* task tersebut di `phase11.md` tercentang
- [ ] Angka hasil dapat dicocokkan dengan simulasi `README.md` §3.10
- [ ] Tidak ada regresi pada task yang sudah `✅`

### 5.1 Test integrasi database yang bersifat opt-in

Tujuh berkas test integrasi database sengaja diskip bila `RUN_DB_TESTS` tidak bernilai `1`, karena test
membuat transaksi dan fixture sementara pada database development. Status **skip bukan
lulus**. Pada Sesi 28 seluruh suite dijalankan dengan `RUN_DB_TESTS=1`: **58 test lulus,
0 gagal, 0 skip**, dan fixture sementara dibersihkan. Seluruh
skenario tetap wajib dijalankan ulang setelah perubahan service finansial, sebelum UAT,
dan sebelum deployment pertama.

| Test | Skenario yang diverifikasi |
| :--- | :--- |
| `checkout-service.integration.test.ts` | TASK-017 — retry berurutan/bersamaan hanya membuat satu sale dan satu mutasi stok. |
| `void-sale-service.integration.test.ts` | I-07 — void mengembalikan nilai stok historis, mempertahankan average cost, dan keluar dari agregat. |
| `inventory-adjustment-service.integration.test.ts` | I-08 saat ini — subset BOM: opening + pembelian − sale/out − waste ± penyesuaian sama dengan persediaan akhir. TASK-025 wajib menambah sale void dan batas periode. |
| `shift-service.integration.test.ts` | I-10 — shift wajib/unik dan kas seharusnya memasukkan pengeluaran laci. |
| `product-category-service.integration.test.ts` | I-11 — kategori unik, status kategori terpakai, dan audit mutasi kategori. |
| `recipe-service.integration.test.ts` | Penggantian dan pengosongan resep dicatat atomik bersama audit. |
| `reporting.integration.test.ts` | TASK-025 — PB1, fallback HPP, snapshot historis, opening, dan void lintas periode. |

Perintah PowerShell untuk menjalankan seluruh test termasuk lima test database:

```powershell
$env:RUN_DB_TESTS = "1"
node --import tsx --test "src/**/*.test.ts"
Remove-Item Env:RUN_DB_TESTS
```

Setiap test membersihkan fixture miliknya dalam blok `finally`. Tetap gunakan hanya
database development/test dan periksa jumlah fixture sisa setelah eksekusi.

### Dua invariant yang menentukan

Keduanya adalah bukti utama bahwa sistem bekerja, dan menjadi temuan inti untuk bab pengujian:

| Kode | Isi | Diuji setelah |
| :--- | :--- | :--- |
| **I-03** | Untuk item ber-BOM, Σ nilai `sale/out` = `sale_items.hpp_snapshot`; HPP manual/fallback tidak membuat mutasi stok fiktif | TASK-012; perlu regresi eksplisit pada TASK-025 |
| **I-08** | Snapshot awal + opening + purchase + sale void − sale − waste + adjustment in − adjustment out = snapshot akhir | TASK-020; cakupan periode lengkap pada TASK-025 |

---

## 6. CATATAN SESI

Setiap sesi kerja menambahkan satu entri. Tulis apa yang dikerjakan, apa yang berubah dari rencana, dan apa yang ditemukan di luar dugaan.

### Sesi 1 — 22 Agustus 2026

**Dikerjakan**
- Audit Phase 0–11 dijalankan penuh, menghasilkan 11 dokumen di `docs/execute-step/`.
- `README.md` ditulis ulang sebagai dokumen desain yang dapat dieksekusi; skema §5.15 lolos `npx prisma validate`.
- `docs/checkpoint.md` diperbarui ke v5.0 dengan bab antarmuka & aksesibilitas.
- `docs/design-direction.md` ditulis — arah visual diturunkan dari logo, seluruh token lolos kontras AA.
- Dokumen ini dibuat.

**Temuan di luar dugaan**
- `supabaseConnect.txt` berisi password basis data **sudah ter-*push* ke `origin/dev`**, bukan hanya ada di lokal. Ini menaikkan urgensi TASK-001 secara signifikan.
- Warna merek `#8A2416` tidak dapat dipakai di atas tema gelap yang ada (1,60–2,14:1), sehingga arah visual harus berpindah ke kertas terang.
- `updateProduct` tidak pernah ada — harga menu terkunci setelah menu pernah terjual.

**Aset merek diterima**
- Empat varian logo berlatar transparan masuk ke `public/`: Vertikal (950×516), Horizontal (1477×230), IconOnly (1355×601), TextOnly (2415×273).
- **Warna resmi berbeda tipis dari yang saya sampel dari JPG.** Resmi: kertas `#F1EFEC`, tinta `#8A2416`. Tinta terverifikasi pada **100% piksel opak** di keempat berkas.
- Seluruh palet `design-direction.md` §4 dihitung ulang dari nilai resmi — 27 kombinasi teks/permukaan, semuanya lolos AA.
- `design-direction.md` §9 ditulis ulang menjadi inventaris aset nyata beserta aturan pemakaian per varian.
- Rujukan nilai lama diselaraskan di `checkpoint.md`, `progress.md`, dan `phase11.md`. Verifikasi: `grep -rn '8B2316\|F0F1EB' docs/` → nihil.
- `Logo-Merbaoe-Raw.JPG` diturunkan statusnya menjadi arsip — tidak boleh dipakai di UI.

**TASK-001 — sisi repo selesai**

| Perubahan | Berkas |
| :--- | :--- |
| `JWT_SECRET` lokal dibangkitkan (32 byte acak, base64) | `.env` |
| Template variabel lingkungan dibuat | `.env.example` (baru) |
| Pola berkas kredensial ditambahkan | `.gitignore` |
| Nilai cadangan `JWT_SECRET` dihapus — aplikasi kini gagal start bila variabel kosong atau <32 karakter | `src/lib/auth.ts` |
| `supabaseConnect.txt` dikeluarkan dari pelacakan Git (berkas lokal sengaja dibiarkan sampai rotasi selesai) | indeks Git |

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| `npx tsc --noEmit` | lulus, exit 0 |
| `npm run build` | lulus, 12 halaman |
| `git ls-files \| grep supabaseConnect` | 0 hasil — sudah tidak terlacak |
| Uji ambang `readJwtSecret` | kosong / string kosong / 10 karakter / 31 karakter → **ditolak**; 32 karakter dan nilai `.env` → diterima |

**Belum selesai — menunggu Anda**
- D-01 rotasi password Supabase · D-02 visibilitas repo · D-03 izin bersihkan riwayat · D-04 `JWT_SECRET` di Vercel.
- Selama riwayat Git belum dibersihkan, password lama masih dapat diambil dari commit `da342e9` di `origin/dev`. **Rotasi adalah perbaikan sesungguhnya; pembersihan riwayat hanya kebersihan.**

---

### Sesi 2 — 24 Agustus 2026

**Keputusan yang diambil**
- **Kredensial dipakai apa adanya** atas keputusan Anda. D-01, D-02, D-03 ditunda sebagai risiko yang diterima; dicatat di §4 agar tidak hilang.
- **TASK-002 → reset bersih.** Basis data diperiksa: 30 baris, dan satu-satunya data non-seed adalah 1 transaksi uji (`TRX-1787389777991`, Americano + Kopi Susu Aren). Tidak ada data bisnis nyata.

**Dua temuan audit terbukti dengan data nyata**

Sebelumnya keduanya berstatus `[BELUM DIUJI]` karena hanya dibaca dari kode. Kini terkonfirmasi dari basis data:

| Temuan | Bukti |
| :--- | :--- |
| A2 — average costing belum jalan | `hpp_snapshot` bernilai 5000 dan 8500, persis `base_hpp` statis, bukan hasil hitung dari harga rata-rata |
| A3 — mutasi stok keluar tidak dicatat | `stock_transactions` **0 baris** padahal stok berkurang (Kopi Arabica 2000 → 1962, sesuai resep) |

**Task selesai**

| Task | Hasil | Bukti |
| :--- | :--- | :--- |
| **TASK-002** | Status data diverifikasi, strategi migrasi ditetapkan | 30 baris; 1 transaksi uji |
| **TASK-030** | `tabular-nums` pada `td`, `.stat-value`, utilitas `.num`/`.num-right`, 7 titik nominal kasir | Seluruh nominal kini sejajar vertikal |
| **TASK-004** | `src/lib/guard.ts`; `requireAdmin()` pada 9 aksi admin, `requireAuth()` pada `submitSale` | 10/10 aksi terjaga di baris pertama |
| **TASK-005** | `src/lib/period.ts` + `src/lib/money.ts`; 3 definisi `formatRupiah` lokal dan 12 pemformatan inline dihapus | **18 uji lulus di TZ=UTC dan TZ=Asia/Jakarta** — memenuhi U-09 |
| **TASK-006** | `src/lib/validation.ts` dengan `zod` 4.4.3; seluruh 10 aksi memvalidasi masukan | **20 uji lulus** |
| **TASK-008** | `expenses` dan `sales` memakai `aggregate`; label kartu menyebut cakupan | Angka total tidak lagi salah setelah data melewati `take` |
| **TASK-007** | `src/lib/profit.ts`; dashboard memakai `operationalExpense`, pembelian dipindah jadi kartu arus kas | **10 uji lulus**, cocok dengan simulasi README §3.10 |

**S5 tertutup — dibuktikan, bukan diasumsikan**

Celah kuantitas negatif yang dapat menaikkan stok kini ditolak di lapisan validasi:

```
quantity = -5   -> ditolak: Jumlah harus lebih besar dari nol.
quantity = 0    -> ditolak: Jumlah harus lebih besar dari nol.
quantity = 0.5  -> ditolak: Jumlah harus bilangan bulat.
quantity = 1    -> diterima
```

Lapisan kedua (`CHECK (quantity > 0)` di basis data) menyusul bersama TASK-003.

**A1 tertutup — selisihnya besar**

Uji `lib/profit.ts` memperlihatkan dampak rumus lama secara langsung. Untuk periode dengan DPP 180.000, HPP 52.500, OPEX 45.000, dan belanja supplier 500.000:

| Rumus | Hasil |
| :--- | ---: |
| Lama (Laba Kotor − Pembelian) | **−372.500** |
| Benar (Laba Kotor − OPEX) | **82.500** |

**Terblokir**

`prisma migrate reset` dan `prisma migrate diff` ditolak pengaman izin karena destruktif terhadap basis data. Saya tidak mengakalinya. Akibatnya TASK-003, TASK-009, dan TASK-010 berhenti. Perintah yang perlu Anda jalankan ada di §4b.

Kondisi antara saat ini **aman**: `prisma/schema.prisma` sudah berisi skema baru dan lolos `validate`, tetapi Prisma Client dan basis data masih versi lama. Tidak ada script yang memicu `generate` otomatis (`package.json` hanya punya dev/build/start/lint), sehingga build tetap konsisten. Cadangan skema lama ada di `prisma/schema.prisma.bak`.

**Verifikasi akhir sesi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| `npx tsc --noEmit` | lulus |
| `npm run build` | lulus, 12 halaman |
| `npx eslint .` | 3 error tersisa — seluruhnya pra-ada, jatah TASK-037 |
| Uji `period` + `money` | 18/18 lulus, dua zona waktu |
| Uji `validation` | 20/20 lulus |
| Uji `profit` | 10/10 lulus |

**Berkas baru**

`src/lib/guard.ts` · `src/lib/period.ts` · `src/lib/money.ts` · `src/lib/validation.ts` · `src/lib/profit.ts`

Lima dari enam modul `lib/` yang diwajibkan README §4.2 kini ada. Yang tersisa: `lib/costing.ts` (TASK-011).

### Sesi 3 — 25 Agustus 2026

**Keputusan pengguna**
- Belum ada deploy atau Vercel; `JWT_SECRET` produksi ditunda sampai menjelang deploy.
- Kredensial Supabase dan kebocoran pada riwayat Git diterima sementara sebagai risiko development.
- Reset database development disetujui eksplisit agar jalur kritis dapat dilanjutkan.

**TASK-003 — selesai**
- Snapshot pra-reset dibuat di direktori temporary lokal; isinya 29 baris aplikasi (seed + satu transaksi uji).
- Migrasi `20260825000000_align_with_design_doc` dibuat dan diterapkan setelah migrasi awal.
- Prisma Client dibangkitkan ulang dan database berhasil di-seed.
- Kode aplikasi disesuaikan untuk snapshot nama produk, `hpp_source`, kolom DPP dasar, relasi `cashier`, subtotal pembelian, serta metadata kartu stok masuk.
- Penyesuaian pembelian sekaligus mengaktifkan pembaruan `stock_value` dan `average_cost`; ini dicatat sebagai TASK-011 sebagian karena modul murni dan pengujiannya belum dibuat.
- Perintah seed tidak lagi bergantung pada `npx`; Prisma menjalankan CLI `tsx` lokal melalui Node.

**Bukti acceptance criteria**

| Pemeriksaan | Hasil |
| :--- | :--- |
| `prisma migrate status` | 2 migrasi; database up to date |
| `prisma validate` | lulus |
| Model / enum | 12 / 9 |
| `CHECK` / indeks laporan | 17 / 17 |
| Indeks khusus | unique recipe dan partial unique shift tersedia |
| Sequence | `sales_invoice_seq` tersedia |
| Tipe target | `average_cost DECIMAL(14,4)` dan waktu `TIMESTAMPTZ` |
| Uji `sales_profit_valid` | insert yang melanggar ditolak PostgreSQL |
| `tsc --noEmit` | lulus |
| Build produksi | lulus; 12 halaman |
| ESLint | 3 error pra-ada, 22 warning; tetap jatah TASK-037 |

**Status setelah sesi**
- D-13 tidak lagi memblokir pekerjaan.
- TASK-010 dan TASK-009 kembali berstatus `⬜ Belum` dengan seluruh dependency terpenuhi.
- TASK-011 berstatus `🟡 Sebagian`; jalur pembelian sudah menghitung nilai persediaan, tetapi acceptance criteria task belum lengkap.
- Task berikutnya sesuai urutan resmi: TASK-010, lalu TASK-009.

---

### Sesi 4 — 25 Agustus 2026

**TASK-010 — selesai**
- Nomor penjualan dibangkitkan di dalam transaksi melalui `sales_invoice_seq`.
- Format menggunakan tanggal `Asia/Jakarta`: `TRX-YYYYMMDD-NNNNN`.
- Server Action mengembalikan `invoiceNumber` dan `saleId` dari baris yang benar-benar tersimpan.
- `CashierPOS` tidak lagi memakai `Date.now()` dan menampilkan nomor invoice server pada panel sukses.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Dua pemanggilan sequence | `TRX-20260825-00001` dan `TRX-20260825-00002`; unik |
| Format nomor | lulus pola `TRX-YYYYMMDD-NNNNN` |
| Kecocokan database | nomor hasil sequence = `sales.invoice_number`; transaksi uji di-rollback |
| Pencarian `Date.now()` di alur kasir | nihil |
| `tsc --noEmit` | lulus |
| Build produksi | lulus; 12 halaman |
| ESLint berkas kasir | 1 error pra-ada `prefer-const`; akan hilang saat TASK-012 menghitung HPP dinamis |

**Berikutnya:** TASK-009 — pengurangan stok aman terhadap checkout bersamaan.

---

### Sesi 5 — 25 Agustus 2026

**TASK-009 — selesai**
- Produk aktif beserta resep dibaca dalam satu kueri sebelum transaksi dibuka.
- Kebutuhan bahan diakumulasi per `ingredient_id`, termasuk bila satu bahan dipakai beberapa produk.
- Seluruh baris bahan dikunci dengan `SELECT ... FOR UPDATE` berurutan menurut ID.
- Stok divalidasi setelah lock; pengurangan baru dilakukan setelah seluruh bahan dinyatakan cukup dan tiap bahan hanya di-update sekali.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| I-05, dua checkout pada stok 1 | satu berhasil; satu menunggu lalu ditolak setelah membaca stok 0 |
| Saldo akhir skenario I-05 | `0`, tidak negatif |
| Kueri lock melalui Prisma | `Prisma.sql` + `Prisma.join` mengunci ID 1 dan 2 sesuai urutan |
| Baris stok negatif di database | `0` |
| Pengaman database | update ke `-1` ditolak (`23514`) oleh `ingredients_stock_non_negative` |
| Pembersihan data uji | tidak ada baris `__codex_i05_%` tersisa |
| `tsc --noEmit` | lulus |
| ESLint `cashier/actions.ts` | lulus tanpa temuan |
| Build produksi | lulus; 12 halaman |

**TASK-011 — selesai**
- `lib/costing.ts` menyediakan `applyStockIn()` dan `applyStockOut()` tanpa I/O.
- Mutasi masuk memperbarui `current_stock`, `stock_value`, dan `average_cost` dengan weighted-average perpetual.
- Mutasi keluar mempertahankan `average_cost`; stok habis memaksa `stock_value = 0`.
- Pembelian mengunci bahan dengan `FOR UPDATE` berurutan sebelum menghitung saldo, sehingga pembelian paralel tidak saling menimpa.
- Kartu stok pembelian mengisi `unit_cost`, `total_cost`, `balance_after`, `value_after`, `reference_type`, `reference_id`, dan `created_by`.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| U-01 weighted average masuk | lulus; 1.000 × Rp150 + 500 × Rp180 menghasilkan Rp160/unit |
| U-02 mutasi keluar | lulus; `average_cost` tetap Rp150 |
| U-03 stok menjadi nol | lulus; `stock_value = 0`, average terakhir tetap Rp150 |
| Simulasi README §3.10.G | lulus; `217.500 / 1.350 = 161,1111` |
| I-01 transaksi pembelian | stok 100→150, nilai Rp15.000→Rp24.000, average Rp150→Rp160; kartu stok lengkap |
| Isolasi data uji I-01 | seluruh skenario di-rollback; tidak ada data uji tertinggal |
| `tsc --noEmit` dan ESLint berkas terkait | lulus |
| Build produksi | lulus; 12 halaman |

**TASK-012 — selesai**
- HPP produk ber-BOM dihitung dari Σ(takaran × `average_cost`) pada baris bahan yang sudah dikunci.
- `hpp_source` membedakan tiga jalur: `recipe`, `base`, dan `fallback`.
- Pengurangan persediaan memakai `applyStockOut()`, sehingga `current_stock`, `stock_value`, dan `average_cost` tetap konsisten.
- Setiap bahan yang berkurang menghasilkan tepat satu `stock_transactions` bertipe `out`, `source = sale`, dan referensi ke sale yang sama.
- Sale dibuat sebelum kartu stok agar `reference_id = sale.id`; seluruh langkah tetap berada dalam satu transaksi.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| U-04 HPP BOM | lulus; simulasi menghasilkan Rp5.417 dan sumber `recipe` |
| U-05 produk tanpa BOM | lulus; memakai `base_hpp` dan sumber `base` |
| U-06 average cost nol | lulus; memakai `base_hpp` dan sumber `fallback` |
| I-03 penjualan pertama | `sales.total_hpp = 7.000`; Σ kartu stok keluar `= 7.000` |
| I-03 setelah harga naik | `sales.total_hpp = 3.652`; Σ kartu stok keluar `= 3.652` |
| I-06 kenaikan harga beli | average kopi Rp150→Rp165,1515; HPP berikutnya Rp3.500→Rp3.652 |
| Snapshot historis | transaksi lama tetap Rp3.500 setelah harga beli naik |
| Isolasi data uji | seluruh bahan, produk, purchase, sale, dan kartu stok di-rollback |
| Unit test costing | 8/8 lulus |
| `tsc --noEmit` dan ESLint berkas terkait | lulus; `prefer-const` lama hilang |
| Build produksi | lulus; 12 halaman |

**Berikutnya:** TASK-013 — ubah saldo seed menjadi transaksi `opening` agar instalasi bersih langsung memakai jalur `recipe`.

---

### Sesi 6 — 25 Agustus 2026

**TASK-013 — selesai**
- Bahan seed dibuat dari saldo nol lalu menerima mutasi `in` dengan `source = opening` dalam transaksi yang sama.
- Setiap kartu opening menyimpan `unit_cost`, `total_cost`, `balance_after`, `value_after`, `notes`, dan `created_by`; pasangan referensi dibiarkan `null` sesuai constraint.
- Seed idempotent: opening hanya dibuat bila bahan belum mempunyai mutasi; seed ulang tidak menambah saldo atau kartu.
- Angka Kopi Arabica, Susu Full Cream, dan Sirup Gula Aren serta BOM Kopi Susu Aren diselaraskan dengan simulasi README §3.10.
- Product upsert kini merekonsiliasi data demo agar seed ulang tetap menghasilkan skenario yang sama.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Clean install | `prisma migrate reset --force`, `prisma generate`, dan `prisma db seed` lulus |
| Migrasi clean install | migrasi `init` dan `align_with_design_doc` diterapkan ulang |
| Saldo opening | 7 bahan, tepat 7 kartu `opening` unik |
| Average cost | 7/7 bahan bernilai lebih dari nol |
| Idempotensi seed | seed kedua menghasilkan `0 saldo opening baru`; total tetap 7 |
| Simulasi §3.10.A | kopi 1.000/Rp150.000/Rp150; susu 2.000/Rp40.000/Rp20; gula aren 500/Rp15.000/Rp30 |
| Checkout seed | `hpp_source = recipe`; `hpp_snapshot = Rp5.250`; Σ kartu keluar = Rp5.250 |
| Isolasi checkout uji | sale dan mutasi keluar di-rollback; opening tetap 7 |
| Prisma schema, TypeScript, ESLint, unit test | lulus; costing 8/8 |
| Build produksi | lulus; 12 halaman |

**Berikutnya:** TASK-021 — seragamkan bentuk hasil seluruh Server Action dan penanganan galatnya.

---

### Sesi 7 — 25 Agustus 2026

**TASK-021 — selesai**
- Seluruh 12 Server Action mengembalikan kontrak `ActionResult`: `{ ok: true, data }` atau `{ ok: false, error, fieldErrors? }`.
- Galat validasi dan otorisasi tetap informatif; galat bisnis memakai `ActionError`; galat tak terduga dicatat di server lalu diganti pesan umum.
- Prisma `P2002`, `P2003`, dan `P2025` dipetakan tanpa membocorkan pesan basis data. Penghapusan bahan/produk yang tertahan FK memberi sebab yang spesifik.
- Seluruh form, tombol hapus, checkout, login, dan logout memeriksa hasil action. Form hanya ditutup atau direset setelah `ok: true`.
- `ActionFeedback` dan `FieldError` menampilkan galat umum serta galat per-field, termasuk baris pembelian dinamis.
- Error boundary tersedia pada segmen admin dan kasir.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Seluruh Server Action | 12/12 memakai `actionSuccess` dan `actionFailure` |
| Pemanggil action | tidak ada hasil yang dibuang; kegagalan jaringan juga ditampilkan |
| Unit test kontrak hasil | 5/5 lulus; termasuk validasi, FK, dan penyamaran galat tak terduga |
| Seluruh unit test yang tersedia | 13/13 lulus |
| `tsc --noEmit` | lulus |
| ESLint `src/` | 0 error; 1 warning lama di dashboard |
| Build produksi | lulus; 10 rute aplikasi + `/_not-found` |
| Runtime lokal `/login` | HTTP 200; konten login ter-render |

Smoke test interaktif melalui browser sempat dicoba, tetapi webview pengujian tidak berhasil terpasang. Bukti runtime pada sesi ini dibatasi pada respons HTTP lokal; pengujian interaksi visual tidak diklaim.

**Berikutnya:** TASK-026 — ekstrak komponen bersama sebelum menambah 12 layar baru.

---

### Sesi 8 — 25 Agustus 2026

**TASK-026 — selesai**
- Enam komponen bersama tersedia di `src/components`: `DataTable`, `Modal`, `Field`, `EmptyState`, `Feedback`, dan `Pagination`.
- Seluruh enam tabel aplikasi memakai `DataTable`; varian card tanpa padding mencegah border dan radius ganda.
- Seluruh kondisi data kosong memakai `EmptyState` dengan ikon, judul, deskripsi, dan aksi yang dapat dijalankan.
- Seluruh umpan balik form, aksi hapus, login/logout, checkout, dan error boundary memakai `Feedback` dengan live-region yang sesuai.
- Seluruh field form yang terlihat memakai `Field`, sehingga label terhubung ke kontrol dan galat validasi terhubung melalui atribut ARIA.
- Dialog edit bahan memakai `Modal` dengan semantik dialog, Escape, focus trap, fokus awal, dan pengembalian fokus.
- Definisi animasi spinner dikonsolidasikan menjadi satu `@keyframes spin` global.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Komponen minimal | 6/6 tersedia |
| Tabel aplikasi | 6/6 memakai `DataTable` |
| Empty state | seluruh 9 kondisi memakai `EmptyState` dan memiliki aksi |
| Pola `card` + `padding: 0` inline | nihil |
| Border wrapper tabel di dalam card | nihil; memakai varian tanpa border |
| Definisi `@keyframes spin` | tepat 1 |
| TypeScript | lulus |
| ESLint kode aplikasi dan Prisma | 0 error, 0 warning |
| Unit test | 13/13 lulus |
| Build produksi | lulus; 10 rute aplikasi + `/_not-found` |
| Smoke test browser `/login` | lulus; judul, label field, input, dan tombol ter-render tanpa galat |

**Berikutnya:** TASK-014 — model DPP, diskon, pajak, dan kembalian.

---

### Sesi 9 — 25 Agustus 2026

**Perbaikan koneksi runtime**
- `src/lib/prisma.ts` kini memuat `dotenv/config`, sehingga Prisma memakai `DATABASE_URL` yang sama saat dipanggil Next.js maupun skrip diagnostik standalone.
- Supabase pooler port 6543 dan `PrismaPg` terverifikasi sehat; `DIRECT_URL` tetap khusus Prisma CLI/migrasi.
- Pemeriksaan paralel berhasil membaca 2 user, 7 bahan, 5 produk, dan 7 mutasi opening; tidak ada stok negatif, average cost nol, atau data uji tertinggal.

**TASK-014 — selesai**
- `calculateTransactionTotals()` menghitung Subtotal → Diskon → DPP → Pajak → Total dengan `Prisma.Decimal` dan pembulatan half-up pada nilai akhir.
- Laba kotor disimpan sebagai DPP dikurangi HPP; pajak tidak masuk ke laba.
- Payload checkout memvalidasi diskon, tarif pajak, uang diterima, metode pembayaran, dan keranjang di server.
- Pembayaran tunai ditolak bila uang diterima kurang; kembalian dihitung server dan disimpan pada sale.
- Panel kasir menyediakan diskon nominal, pilihan tanpa pajak/PB1 10%, input uang diterima, serta tombol Uang Pas, Rp50.000, dan Rp100.000.
- Estimasi HPP/laba klien dihapus. Hasil transaksi menampilkan subtotal, diskon, DPP, pajak, total, uang diterima, dan kembalian yang dikembalikan dari baris database.
- Pembayaran QRIS/transfer menyimpan `cash_received` dan `change_amount` sebagai `null`.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| U-07 model DPP | lulus; 180.000 − 10.000 + pajak 17.000 = 187.000 |
| U-08 laba kotor | lulus; DPP 170.000 − HPP 52.500 = 117.500 |
| Kembalian | 200.000 − 187.000 = 13.000; pembayaran kurang ditolak |
| Validasi pembayaran | tunai wajib mengisi uang diterima; nontunai menghasilkan `null` |
| Unit test keseluruhan | 21/21 lulus |
| Integrasi database terisolasi | seluruh nilai DPP/tunai tersimpan benar; `sales_profit_valid` menolak rumus salah |
| Isolasi data uji | transaksi di-rollback; 0 baris `__codex_task014_*` tersisa |
| TypeScript dan ESLint `src/` | lulus tanpa temuan |
| Build produksi | lulus; 10 rute aplikasi + `/_not-found` |
| Smoke test browser | `/login` ter-render; `/cashier` tanpa sesi kembali ke `/login` |

**Berikutnya:** TASK-015 — penyusun resep BOM.

---

### Sesi 10 — 25 Agustus 2026

**TASK-015 — selesai**
- Layar L-07 tersedia di `/admin/products/[id]/recipe` dan dapat dibuka dari aksi “Atur Resep” pada daftar menu.
- Admin dapat menambah, mengubah, dan menghapus baris komposisi sebelum menyimpan seluruh resep secara atomik.
- Validasi server menolak takaran nol/negatif, baris tidak lengkap, lebih dari 100 bahan, dan bahan yang sama dua kali; constraint database tetap menjadi lapisan terakhir.
- `replaceProductRecipe()` mengunci baris produk, mengganti komposisi, dan memperbarui `has_recipe` dalam transaksi yang sama. Resep pertama menghasilkan `true`; resep kosong menghasilkan `false`.
- Pratinjau HPP memakai `calculateProductHpp()` yang sama dengan checkout, termasuk fallback ke `base_hpp` bila satu bahan belum memiliki `average_cost`.
- Daftar menu menampilkan jumlah bahan resep dan menautkan langsung ke penyusun resep.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Validasi resep | duplikat ditolak; takaran nol ditolak; resep kosong diterima |
| Unit test keseluruhan | 23/23 lulus |
| Integrasi database terisolasi | tambah 2 bahan → `has_recipe=true` dan HPP `recipe`; ubah takaran mengubah HPP; kosongkan → `has_recipe=false` |
| Isolasi data uji | produk dan bahan verifikasi di-rollback seluruhnya |
| TypeScript dan ESLint `src/` | lulus tanpa temuan |
| Build produksi | lulus; rute dinamis L-07 terdaftar |
| Smoke test browser | rute L-07 tanpa sesi kembali ke `/login`; form login ter-render |

**Berikutnya:** TASK-016 — form ubah produk dan soft delete master data.

---

### Sesi 11 — 25 Agustus 2026

**TASK-016 — selesai**
- `updateProduct` tersedia dan memvalidasi perubahan nama, harga jual, serta HPP manual/fallback di server.
- L-06 memiliki modal edit produk dengan umpan balik per field; perubahan produk direvalidasi ke daftar menu, penyusun resep, dan kasir.
- Hard delete produk dan bahan dihapus dari Server Action serta antarmuka. Lifecycle keduanya kini memakai status aktif/nonaktif yang dapat dipulihkan.
- Bahan nonaktif tetap terlihat di master dan tetap terhubung ke resep lama, tetapi tidak tersedia untuk pembelian baru atau baris resep baru.
- Produk nonaktif tetap terlihat di master dan riwayat penjualan, tetapi tidak muncul di kasir.
- Alert stok dashboard dan pilihan pembelian hanya membaca bahan aktif; request pembelian basi juga ditolak server bila bahan sudah nonaktif.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Validasi edit produk | harga baru diterima; nominal negatif ditolak |
| Jalur hard delete master | nihil di `src/`; tidak ada `deleteProduct`/`deleteIngredient` atau tombol hapus master |
| Integrasi database terisolasi | edit harga dan nonaktif produk/bahan berhasil; recipe, sale detail, snapshot, dan FK tetap utuh |
| Query operasional | produk/bahan nonaktif tidak muncul pada query aktif |
| Isolasi data uji | seluruh produk, bahan, sale, dan detail verifikasi di-rollback; 0 baris sementara tertinggal |
| Unit test keseluruhan | 24/24 lulus |
| TypeScript dan ESLint `src/` | lulus tanpa temuan |
| Build produksi | lulus; seluruh rute aplikasi terbangun |

**Berikutnya:** TASK-022 — struk termal. TASK-017 tetap berstatus menunggu keputusan karena README belum menetapkan kontrak idempotensi.

---

### Sesi 12 — 26 Agustus 2026

**TASK-017 — selesai**
- README §3.11 kini menetapkan kontrak idempotensi: UUID stabil per keranjang, payload kanonis, fingerprint SHA-256, replay identik, penolakan payload berbeda, dan `UNIQUE` sebagai arbiter request paralel.
- Migrasi `20260825010000_add_sale_idempotency` menambah `sales.idempotency_key UUID NOT NULL UNIQUE`, `request_fingerprint CHAR(64) NOT NULL`, serta constraint format fingerprint. Migrasi diterapkan tanpa reset data.
- Checkout dipisahkan ke `processSale()`. Retry identik mengembalikan sale ID, invoice, dan nominal lama tanpa membuat detail atau kartu stok baru.
- Konflik `P2002` akibat request bersamaan ditangani setelah transaksi yang kalah rollback, lalu hasil transaksi pemenang dibaca kembali.
- Kunci yang sama dengan isi berbeda atau kasir berbeda ditolak. Payload juga menolak UUID tidak sah dan produk duplikat.
- Antarmuka kasir membuat UUID saat keranjang mulai diisi, mempertahankannya pada timeout/galat, dan membuangnya hanya setelah sukses atau keranjang sengaja dikosongkan.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Prisma schema dan migrasi | valid; migrasi diterapkan; `migrate status` menyatakan database sinkron (3 migrasi) |
| Fingerprint | stabil saat urutan item berubah; berubah saat isi checkout berubah; 64 karakter heksadesimal |
| Retry berurutan | dua pemanggilan mengembalikan sale ID dan invoice yang sama |
| Payload berbeda | UUID yang sudah terpakai ditolak dengan galat bisnis eksplisit |
| Request konkuren | dua pemanggilan paralel mengembalikan satu sale yang sama |
| Efek stok | stok fixture 100 menjadi 94 tepat sekali; hanya satu kartu `out` qty 6 per transaksi logis |
| Isolasi data uji | sale, produk, dan bahan fixture seluruhnya 0 setelah cleanup |
| Unit test keseluruhan | 27 lulus, 0 gagal; uji integrasi database terpisah 1/1 lulus |
| TypeScript dan ESLint file terdampak | lulus tanpa temuan |
| Build produksi | lulus; 12 halaman ter-generate dan seluruh rute aplikasi terdaftar |

**Berikutnya:** TASK-022 — struk termal.

---

### Sesi 13 — 26 Agustus 2026

**TASK-022 — selesai**
- L-17 tersedia di `/cashier/receipt/[id]` dan membaca transaksi beserta detail serta nama kasir langsung dari database berdasarkan `saleId`.
- Kasir hanya dapat membuka struk transaksi miliknya sendiri; admin tetap dapat membuka seluruh transaksi. ID tidak sah atau transaksi di luar cakupan menghasilkan 404.
- Struk memuat nama/alamat kafe, waktu WIB, invoice database, kasir, metode pembayaran, rincian item, subtotal, diskon, DPP, pajak, total, serta uang diterima dan kembalian untuk tunai.
- Pilihan pratinjau 58mm dan 80mm tersedia. CSS module khusus cetak menghapus kontrol/warna aplikasi, margin halaman, dan bayangan saat `window.print()`.
- Panel sukses checkout menautkan sale yang baru selesai ke aksi “Lihat & Cetak Struk”.
- Alamat struk dikonfigurasi melalui `STORE_ADDRESS`; fallback eksplisit ditampilkan bila alamat development belum diisi.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Sumber data | query server `sale` + `details` + `cashier`; tidak memakai state keranjang |
| Nomor invoice | membaca `sale.invoiceNumber` yang tersimpan |
| Waktu | `Intl.DateTimeFormat` dipasang eksplisit ke `Asia/Jakarta` |
| Hak akses | filter `cashierId` diterapkan di query untuk peran kasir |
| Lebar/cetak | class 58mm dan 80mm tersedia; `@media print` lulus kompilasi CSS |
| TypeScript dan ESLint file terdampak | lulus tanpa temuan |
| Build produksi | lulus; rute dinamis `/cashier/receipt/[id]` terdaftar |

**Berikutnya:** TASK-018 — pembatalan transaksi (void).

---

### Sesi 14 — 26 Agustus 2026

**TASK-018 — selesai**
- Admin dapat membatalkan transaksi selesai dari L-10 melalui dialog konfirmasi yang mewajibkan alasan; transaksi yang sudah void tidak menawarkan aksi ulang.
- `processSaleVoid()` mengunci baris sale dan bahan baku secara terurut, lalu mengubah status beserta `void_reason`, `voided_by`, dan `voided_at` dalam satu transaksi database.
- Kuantitas dan nilai reversal dibaca dari kartu stok `sale` asli, bukan dari resep saat ini atau `average_cost` berjalan. Karena itu void tetap benar bila resep atau harga rata-rata berubah setelah checkout.
- Setiap bahan menghasilkan kartu stok `in` dengan `source=sale_void`, saldo setelah mutasi, nilai setelah mutasi, pelaku admin, dan referensi ke sale asli. `average_cost` tidak dihitung ulang.
- Audit `action=void`, data sebelum, dan data sesudah ditulis atomik bersama perubahan sale dan stok.
- Dashboard, ringkasan riwayat penjualan, dan daftar transaksi terbaru hanya menghitung/menampilkan transaksi `completed`; riwayat L-10 tetap memperlihatkan transaksi void beserta alasannya untuk penelusuran.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Validasi | ID positif dan alasan wajib/nonkosong; batas 255 karakter |
| I-07 database | stok +6 dan nilai historis +Rp60; average cost berjalan 10,9615 tidak berubah |
| Status dan audit | kolom void lengkap; satu baris `audit_logs` beraksi `void` |
| Idempotensi void | percobaan kedua ditolak; kartu `sale_void` tetap tepat satu |
| Agregat finansial | sale void tidak lagi masuk hitungan pendapatan, HPP, laba, atau jumlah transaksi selesai |
| Unit test keseluruhan | 29 lulus, 0 gagal, 2 integrasi diskip pada mode tanpa database |
| Integrasi I-07 | 1/1 lulus dengan fixture yang dibersihkan seluruhnya |
| TypeScript dan ESLint file terdampak | lulus tanpa temuan |
| Build produksi | lulus; seluruh 12 halaman ter-generate |
| Lint seluruh repo | masih gagal hanya karena 2 error lama `require()` pada `test_db.js`; file TASK-018 bersih |

**Berikutnya:** TASK-019 — shift kasir. Dua keputusan operasional di §4 masih perlu ditetapkan sebelum implementasi.

---

### Sesi 15 — 26 Agustus 2026

**TASK-019 — selesai**
- Keputusan D-07 ditetapkan: Admin dan Kasir sama-sama membuka/tutup shift miliknya melalui L-20 `/cashier/shift`; L-13 `/admin/shifts` menampilkan 100 shift terakhir untuk pengawasan owner.
- Keputusan D-08 ditetapkan: pengeluaran yang dibayar dari uang laci ditautkan ke shift aktif. Rumus penutupan menjadi `kas awal + penjualan tunai completed − pengeluaran laci`.
- Migrasi `20260826000000_add_shift_cash_expenses` membuat `sales.shift_id` wajib, menambah relasi pengeluaran-laci ke shift, FK/indeks, constraint nominal, kelengkapan state buka/tutup, dan kewajiban catatan untuk selisih.
- Checkout mengunci shift terbuka sebelum bahan baku. Penutupan memakai lock yang sama, sehingga checkout tidak dapat masuk setelah kas seharusnya dihitung.
- Satu pengguna hanya dapat mempunyai satu shift terbuka melalui partial unique index. Checkout tanpa shift ditolak pada UI dan service.
- Pengeluaran laci hanya dapat memakai shift yang masih terbuka dan tidak boleh melampaui kas tersedia. Setelah shift ditutup, pengeluaran tersebut terkunci dari penghapusan.
- Buka dan tutup shift menghasilkan audit log. Selisih tidak nol tanpa keterangan ditolak atomik.
- Regresi TASK-017 dan TASK-018 diperbarui agar memakai shift terisolasi dan tetap lulus.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Prisma | schema valid; Client 7.9.1 dibangkitkan ulang; 4 migrasi sinkron |
| I-10 database | kas awal Rp100 + tunai Rp200 − pengeluaran laci Rp20 = expected Rp280 |
| Selisih | aktual Rp279 tanpa catatan ditolak; dengan catatan tersimpan sebagai −Rp1 |
| Shift wajib | sale menyimpan `shift_id`; checkout sesudah shift ditutup ditolak |
| Shift unik | pembukaan kedua saat shift masih aktif ditolak |
| Regresi database | TASK-017, I-07, dan I-10 masing-masing 1/1 lulus |
| Unit test keseluruhan | 33 lulus, 0 gagal, 3 integrasi diskip pada mode tanpa database |
| TypeScript dan ESLint file terdampak | lulus tanpa temuan |
| Build produksi | lulus; 14 halaman termasuk L-13 dan L-20 terdaftar |
| Isolasi fixture | user, produk, shift, dan pengeluaran test tersisa 0 |

**Berikutnya:** TASK-020 — penyesuaian stok, waste, dan kartu stok.

---

### Sesi 16 — 26 Agustus 2026

**TASK-020 — selesai**
- L-05 `/admin/ingredients/adjustment` menyediakan opname berdasarkan stok fisik dan pencatatan waste. Keduanya mewajibkan keterangan dan memakai row lock pada bahan sebelum menghitung saldo baru.
- Opname naik dan turun dinilai dengan `average_cost` berjalan tanpa menghitung ulang harga rata-rata. Waste menjadi mutasi keluar dengan nilai aktual perubahan persediaan.
- Waste membuat `operational_expenses` kategori `lain_lain` secara atomik. Migrasi `20260826010000_add_waste_expense_link` menautkan beban ke mutasi melalui `stock_transaction_id`.
- Beban waste ditandai “Otomatis · Terkunci” pada L-09. Server Action menolak penghapusan manual; koreksi wajib berupa mutasi baru agar kartu stok tetap append-only.
- L-04 `/admin/ingredients/[id]/card` menampilkan mutasi terbaru, jenis/sumber, kuantitas, harga dan nilai mutasi, `balance_after`, `value_after`, keterangan, pelaku, serta filter rentang tanggal.
- L-03 kini menampilkan harga rata-rata dan nilai persediaan serta menyediakan tautan ke kartu stok dan opname/waste.
- Waste bernilai nol tetap dapat dicatat bila stok mempunyai `average_cost = 0`, sedangkan pengeluaran manual tetap wajib bernilai positif.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Prisma | schema valid; Client 7.9.1 dibangkitkan ulang; 5 migrasi sinkron |
| I-08 database | Rp1.000 opening + Rp1.000 purchase − Rp133 HPP − Rp267 waste + Rp133 adjustment in − Rp133 adjustment out = Rp1.600 persediaan akhir |
| Average cost | opname naik/turun dan waste mempertahankan Rp133,3333 per unit |
| Beban waste | kategori `lain_lain`, nilai Rp267, dan `stock_transaction_id` sama dengan mutasi asal |
| Unit test keseluruhan | 36 lulus, 0 gagal |
| Regresi database | TASK-017, I-07, I-08, dan I-10 seluruhnya lulus |
| TypeScript dan ESLint file terdampak | lulus tanpa temuan |
| Build produksi | lulus; 15 halaman termasuk L-04 dan L-05 ter-generate |
| Isolasi fixture | seluruh user integration test tersisa 0 |

**Berikutnya:** TASK-027 — kontrak tiga state untuk loading, empty, dan error.

---

### Sesi 17 — 26 Agustus 2026

**TASK-027 — selesai**
- README §8.7 kini menetapkan kontrak loading, empty, error, dan checklist delapan state interaksi.
- Root, Admin, dan Kasir mempunyai fallback `loading.tsx` berbasis skeleton. Skeleton Admin mempertahankan bentuk stat card dan tabel; skeleton Kasir mempertahankan bentuk katalog dan keranjang.
- Root, Admin, dan Kasir mempunyai `error.tsx` dengan pesan aman dan retry berbasis `unstable_retry`, serta `not-found.tsx` dengan penjelasan dan jalan kembali.
- Seluruh 13 tombol submit memakai `aria-busy`, disabled selama proses, dan spinner yang menggantikan label visual melalui `PendingButtonContent`. Checkout, logout, dan hapus pengeluaran memakai pola yang sama.
- Empty state kartu stok yang sebelumnya tanpa aksi kini menawarkan reset filter atau pencatatan mutasi. Halaman opname tanpa bahan kini mengarahkan pengguna untuk menambah bahan, bukan menampilkan form mati.
- State focus, active, disabled, loading, error, dan success distandardkan pada utilitas tombol/input; animasi menghormati `prefers-reduced-motion`.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| TypeScript | lulus, 0 error |
| ESLint area aplikasi | lulus, 0 temuan |
| Unit test keseluruhan | 36 lulus, 0 gagal; 4 integrasi database **belum dijalankan pada recheck ini** dan dicatat untuk review di §5.1 |
| Build produksi | lulus; 15 halaman dan fallback `/_not-found` terdaftar |
| Audit submit | 13/13 mempunyai state pending; 16 pemicu asinkron memakai `aria-busy` |
| Audit empty state | tidak ada lagi `action={null}` |
| Lint seluruh repo | masih gagal hanya karena 2 error lama `require()` pada `test_db.js`; 20 warning berasal dari folder referensi `hallmark-main` |

**Berikutnya:** TASK-032 — modal yang dapat diakses.

---

### Sesi 18 — 26 Agustus 2026

**TASK-032 — selesai**
- Fondasi modal dari TASK-026 diverifikasi dan diperkuat: dialog tanpa kontrol aktif dapat menerima fokus, fokus yang keluar secara tak terduga dikembalikan ke dalam trap, dan scroll halaman latar dikunci selama dialog terbuka.
- Cleanup modal memulihkan nilai `overflow` sebelumnya dan hanya mengembalikan fokus bila elemen pemicu masih terhubung ke dokumen.
- Checklist TASK-026 yang tertinggal di `phase11.md` disinkronkan setelah enam komponen dan seluruh kriterianya diaudit kembali.
- Empat integration test database opt-in yang diskip pada recheck dicatat eksplisit di §5.1 beserta alasan, cakupan, dan perintah eksekusi ulang. Status skip tidak diklaim sebagai lulus.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Semantik dialog | `role="dialog"`, `aria-modal="true"`, dan `aria-labelledby` cocok dengan ID judul |
| Fokus awal | input nama produk pertama menerima fokus saat modal dibuka |
| Focus trap | Shift+Tab dari tombol tutup berpindah ke tombol submit terakhir; Tab dari submit kembali ke tombol tutup |
| Escape & fokus kembali | Escape menutup dialog dan fokus kembali tepat ke tombol Edit pemicu |
| Scroll latar | `body.style.overflow` menjadi `hidden` saat terbuka dan pulih saat tutup |
| TypeScript dan ESLint file terdampak | lulus tanpa temuan |
| Test non-database | 36 lulus, 0 gagal; 4 integrasi database tetap opt-in dan tercatat di §5.1 |
| Build produksi | lulus; 15 halaman terdaftar |

**Berikutnya:** TASK-031 — asosiasi label dan semantik form.

---

### Sesi 19 — 26 Agustus 2026

**TASK-031 — selesai**
- `Field` kini menggabungkan galat Server Action dan galat lokal, mempertahankan state invalid bawaan kontrol, serta menghubungkan seluruh pesan ke kontrol melalui `aria-invalid` dan `aria-describedby`.
- Pencarian, diskon, dan uang diterima di POS memiliki nama serta relasi galat yang dapat diprogram. Kekurangan uang tidak lagi ditandai hanya lewat warna.
- Metode pembayaran menjadi kelompok form dengan `fieldset`/`legend`; tombol tetap mengekspor status pilihan melalui `aria-pressed`.
- Baris resep dinamis memakai `Field`, termasuk relasi galat berbasis indeks dan pesan bahan duplikat bersama.
- Tombol tambah/kurang jumlah serta hapus item pembelian memiliki nama kontekstual. Emoji dan avatar dekoratif di kasir, login, dan sidebar disembunyikan dari accessibility tree.
- `Feedback` mengumumkan galat secara assertive dan sukses/informasi secara polite dengan pembaruan atomik.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| TypeScript | lulus, 0 error |
| ESLint | lulus, 0 temuan |
| Test non-database | 36 lulus, 0 gagal; 4 integrasi database tetap opt-in dan tercatat di §5.1 |
| Audit kontrol form | seluruh kontrol terlihat memiliki label/nama; kontrol tersembunyi dikecualikan; filter kartu stok memakai pasangan `htmlFor`/`id` eksplisit |
| Audit state aksesibel | galat lokal/server terhubung ke field; feedback memakai live region; pilihan pembayaran memakai `aria-pressed`; dekorasi memakai `aria-hidden` |
| Build produksi | lulus; 15 halaman terdaftar; hanya peringatan deprecation lama `middleware` → `proxy` |

Catatan tooling: wrapper `pnpm` bundel sempat berhenti pada kebijakan lifecycle dependency sebelum build berjalan. Build kemudian dijalankan langsung memakai binary Next yang sudah terpasang dan lulus; file `pnpm` temporer hasil wrapper tidak dipertahankan.

**Berikutnya:** TASK-029 — adopsi palet warna kertas Merbaoe.

---

### Sesi 20 — 27 Agustus 2026

**TASK-029 — selesai**
- Token kanonik `--paper`, `--ink`, `--brand`, warna semantik, dan garis kini sama persis dengan `design-direction.md` §4. Alias sementara untuk inline style lama seluruhnya menunjuk ke token kanonik; tidak ada nilai palet gelap/oranye lama tersisa.
- Permukaan halaman/kartu/tabel/input berpindah ke keluarga kertas hangat. Tombol utama memakai isian bata solid dengan teks kertas; tombol destruktif transparan dengan outline merah dan tidak pernah terisi.
- Feedback, badge, scrim modal, selected state POS, sidebar aktif, dan dekorasi login memakai token atau turunan `color-mix`, tanpa literal warna yang menduplikasi token.
- Checkout POS memakai varian primary yang sama dengan aksi utama lain. Selector ukuran struk mengikuti palet aplikasi, sementara isi kertas termal tetap hitam/putih agar hasil cetak tidak berubah.
- Favicon tidak dibuat dari crop otomatis: aset ikon resmi berasio 2,25:1 sehingga crop persegi akan merusak komposisi atau tidak terbaca pada 32px. D-12 dipindahkan menjadi kebutuhan aset pra-rilis resmi dan tidak diklaim selesai.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Matriks kontras | 27/27 kombinasi lulus ≥4,5:1; minimum 4,67:1 (`warning` pada `paper-sunken`) |
| Batas kontrol | 3,08:1 pada `paper`; 3,27:1 pada `paper-raised` |
| Isian utama | teks `paper` pada `brand` 7,80:1; hover `brand-deep` |
| Audit literal lama | tidak ada hex palet gelap/oranye lama atau literal rgba brand/semantik pada UI aplikasi |
| Uji browser | login merender `paper`, `ink`, kartu raised, input ber-border kontrol, dan tombol solid brand; console tanpa error/warning |
| TypeScript dan ESLint | lulus tanpa temuan |
| Test non-database | 36 lulus, 0 gagal; 4 integrasi database tetap opt-in dan tercatat di §5.1 |
| Build produksi | lulus; 15 halaman terdaftar; hanya peringatan deprecation lama `middleware` → `proxy` |

**Task yang dilewati sementara:** TASK-028 masih menunggu keputusan D-09 (keluarga serif), sehingga TASK-033 yang bergantung padanya belum dapat dimulai. Urutan berlanjut ke task pertama dengan dependency siap, TASK-024.

**Berikutnya:** TASK-024 — paginasi, filter tanggal, dan pencarian.

---

### Sesi 21 — 27 Agustus 2026

**TASK-024 — selesai**
- Helper `lib/pagination.ts` memusatkan parsing halaman, pembatasan halaman terakhir,
  offset, ukuran halaman, dan pembuatan URL yang mempertahankan filter aktif.
- Dashboard menerima rentang tanggal, default bulan berjalan sampai hari ini, menghitung
  penjualan/HPP/OPEX/laba/pembelian pada periode yang sama, dan memaginasi transaksi
  periode tersebut.
- Riwayat penjualan dapat dicari menurut invoice/produk serta difilter tanggal dan kasir;
  agregat transaksi, pendapatan, dan laba kotor berasal dari seluruh hasil filter, bukan
  hanya halaman aktif.
- Pembelian, pengeluaran, dan shift memperoleh pencarian, filter tanggal, serta pagination.
  Shift juga dapat difilter status. Master bahan dan produk memperoleh pencarian dan
  pagination, sedangkan kartu stok mempertahankan filter tanggal saat berpindah halaman.
- `businessRangeFromDates()` kini menolak permintaan lebih dari satu tahun dan tetap
  memakai batas setengah terbuka pada kalender WIB.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| TypeScript | lulus, 0 error |
| ESLint `src` | lulus, 0 temuan |
| Seluruh test dengan database | **46 lulus, 0 gagal, 0 skip**, termasuk TASK-017, I-07, I-08, dan I-10 |
| Kebersihan fixture | 0 user fixture dan 0 bahan fixture tersisa |
| Build produksi | lulus; 15 halaman terdaftar; hanya peringatan deprecation lama `middleware` → `proxy` |
| `git diff --check` | lulus; hanya peringatan normal konversi LF/CRLF Git pada Windows |
| Smoke test browser | `/admin/dashboard` tanpa sesi kembali ke `/login`; form login ter-render. Layar admin terautentikasi belum diuji visual karena browser tidak memiliki sesi dan tidak ada kredensial yang dimasukkan. |

Referensi Prisma Client memengaruhi implementasi dengan memastikan filter relasi memakai
`some`, pencarian string memakai `contains` + `mode: insensitive`, dan pagination nomor
halaman memakai pasangan `skip`/`take` yang konsisten dengan `count()`.

**Berikutnya:** TASK-023 — layar kasir untuk riwayat transaksi miliknya dan stok read-only.

---

### Sesi 22 — 27 Agustus 2026

**D-09 — selesai**
- EB Garamond dipilih sebagai serif display mengikuti rekomendasi pairing editorial
  Hallmark. Pemakaiannya dibatasi pada wordmark dan judul halaman; Inter tetap menjadi
  font UI/data dan IBM Plex Mono direncanakan untuk nomor invoice.
- Keputusan ini membuka TASK-028. Arah visual Hallmark tidak disalin ke layout POS;
  yang diadopsi adalah disiplin pairing dan hierarki tipografinya.

**TASK-023 — selesai**
- `/cashier/history` menampilkan transaksi milik pengguna sesi saja. Filter
  `cashierId = session.userId` selalu dibentuk di server dan tetap aktif ketika pencarian
  invoice/produk serta pagination dipakai.
- `/cashier/stock` hanya memilih bahan aktif dan hanya mengekspos nama, satuan, stok
  berjalan, serta stok minimum. Tidak ada data harga/biaya atau aksi mutasi; status
  Habis, Menipis, dan Aman ditampilkan dari nilai stok.
- Navigasi bersama menghubungkan POS, Riwayat, Stok, dan Shift. Admin memperoleh tautan
  langsung “Buka POS” dari sidebar dan tetap dapat kembali ke dashboard.
- Helper kueri dan tiga unit test baru menjaga filter kepemilikan, penolakan ID tidak
  valid, dan pembatasan bahan aktif.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| TypeScript | lulus, 0 error |
| ESLint `src` | lulus, 0 temuan |
| Seluruh test dengan database | **49 lulus, 0 gagal, 0 skip**, termasuk empat integrasi database dan tiga test TASK-023 |
| Build produksi | lulus; **17 halaman** terdaftar, termasuk `/cashier/history` dan `/cashier/stock`; hanya peringatan deprecation lama `middleware` → `proxy` |
| Smoke test terautentikasi | belum dilakukan karena browser tidak memiliki sesi dan tidak ada kredensial yang dimasukkan; otorisasi, tipe, kueri, test, dan build telah diverifikasi |

Referensi Prisma Client memengaruhi implementasi dengan memastikan filter kepemilikan
berada pada level teratas `SaleWhereInput`, pencarian produk memakai relasi `some`, dan
pasangan `count()`/`findMany()` memakai kondisi server yang identik.

**Berikutnya:** TASK-028 — mulai tahap perombakan UI sesuai design direction: token
tipografi/spasi/radius, pemasangan font, dan penghapusan efek off-brand.

---

### Sesi 23 — 27 Agustus 2026

**TASK-028 — selesai**
- `tokens.css` menjadi sumber tunggal palet, peran font, skala tipografi tujuh langkah,
  kisi spasi 4 px, radius 3/4 px, durasi motion, ukuran kontrol, layout, dan z-index.
- Inter, EB Garamond, dan IBM Plex Mono dimuat melalui `next/font`; inspeksi computed
  style menangkap dan memperbaiki penempatan variabel font dari `<body>` ke `<html>`.
  Serif hanya dipakai untuk judul; invoice dan struk memakai mono; UI/data tetap sans.
- Login dirombak menjadi split editorial tanpa orb, glass, gradient, atau entrance motion.
  Admin memakai side-rail workbench; POS memakai katalog + buku transaksi; konteks kasir
  pendukung memakai header bersama. Keempat PNG logo resmi dipakai sesuai arahnya.
- Emoji dan simbol aksi lepas diganti satu set SVG garis 1,5 px. Tombol, input, kartu,
  tabel, badge, modal, empty state, feedback, skeleton, sidebar, POS, shift, dan struk
  menggunakan token serta state focus/active/disabled yang konsisten.
- Audit statis menemukan 0 `box-shadow`, 0 gradient, 0 glass/backdrop, 0 `transition: all`,
  0 animasi masuk halaman, 0 kelas efek lama, 0 radius lama, dan 0 nilai font/spasi inline
  ad-hoc pada TSX. Kontrak Hallmark dicatat di `.hallmark/` dan stamp token.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| TypeScript bersih | lulus, 0 error (`--incremental false`) |
| ESLint aplikasi | `eslint src` lulus, 0 temuan |
| Seluruh test dengan database | **49 lulus, 0 gagal, 0 skip** |
| Kebersihan fixture | 0 user fixture dan 0 bahan fixture tersisa |
| Build produksi final | lulus; **17 halaman**; hanya peringatan deprecation lama `middleware` → `proxy` |
| `git diff --check` | lulus; hanya peringatan konversi LF/CRLF normal pada Windows |
| Browser login | 1440/768/375/320 px; tidak ada scroll horizontal; kontrol 44–48 px; tombol tidak terbungkus |
| Browser POS/admin | POS kosong + terisi dan shell admin dirender memakai komponen aktual pada 1440 px; 0 gradient, 0 shadow; font display/UI/invoice terukur benar; route preview sementara dihapus |

`eslint .` masih membaca salinan referensi `hallmark-main/` dan `test_db.js` lama di luar
source aplikasi, sehingga menghasilkan 2 error + 20 warning yang tidak berasal dari
TASK-028. Pemeriksaan resmi source aplikasi (`eslint src`) bersih; cleanup lint seluruh
repo tetap berada pada TASK-037.

**Berikutnya:** TASK-033 — target sentuh dan responsivitas tablet. Fondasi 44 px dan
`@media (hover: hover)` sudah tersedia dari TASK-028, tetapi adaptasi POS 768 px,
sidebar <1280 px, grid tetap, dan zoom 200% tetap harus diverifikasi sebagai task terpisah.

---

### Sesi 24 — 27 Agustus 2026

**TASK-033 — selesai**

- Login dikalibrasi ulang sebagai komposisi editorial yang seimbang optis: logo dan copy
  terpusat pada panel merek, sedangkan form berdiri tanpa kartu berlapis dan tetap rapi
  pada layar sempit.
- Dashboard tidak lagi berupa enam kartu statistik setara. Pendapatan dan laba bersih
  menjadi angka utama dalam satu ringkasan, metrik pendukung dikelompokkan, filter menjadi
  toolbar tipis, dan panel bawah memakai pola ledger/editorial dengan lebih sedikit border.
- Sidebar admin berubah menjadi rail ikon pada 761–1279 px dan bar navigasi horizontal pada
  mobile. Lebar konten dibatasi, grid dibuat responsif, target kontrol minimal 44 px, dan
  hover hanya diterapkan pada perangkat yang benar-benar mendukung hover.
- POS memakai logo vertikal, masthead dua baris, katalog foto 4:3, keranjang berhierarki
  jelas, serta susunan bertumpuk pada tablet. Verifikasi 768 px dan 375 px tidak menemukan
  gulir horizontal; katalog tetap dua kolom pada ponsel dan checkout tetap dapat digunakan.
- Produk mendapat `image_path` opsional melalui migrasi
  `20260827010000_add_product_image_path`. Admin dapat memilih, mengganti, atau menghapus
  JPEG/PNG/WebP maksimum 3 MiB; fallback tipografis tampil bila foto kosong/gagal. Tidak ada
  foto stok atau gambar generatif yang ditambahkan.
- Alur Storage memakai bucket publik `menu-images`, validasi magic byte, path UUID, dan
  pembersihan best-effort. Upload nyata belum diuji karena `.env` belum memuat
  `SUPABASE_SERVICE_ROLE_KEY`; kondisi tanpa foto sudah diuji dan tidak menghalangi POS.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Migrasi development | `add_product_image_path` berhasil diterapkan ke Supabase yang ada |
| Prisma | `prisma validate` dan `prisma generate` lulus |
| TypeScript | lulus melalui tahap TypeScript build production |
| ESLint perubahan TS/TSX/config | lulus, 0 temuan; lint seluruh repo tetap menjadi TASK-037 |
| Seluruh test database serial | **49 lulus, 0 gagal, 0 skip** dengan `RUN_DB_TESTS=1` dan concurrency 1 |
| Build produksi bersih | lulus; **17 route**; hanya peringatan deprecation lama `middleware` → `proxy` |
| Browser desktop | login 1440 px, dashboard/produk 1280 px, dan POS 1440 px diperiksa dengan data aktual |
| Browser tablet/mobile | admin/POS 768 px dan POS/login 375 px; tidak ada body overflow horizontal; target kontrol ≥44 px |
| Audit efek off-brand | 0 gradient, 0 shadow, dan 0 `transition: all` pada source aplikasi |

Dependency lokal sempat ditemukan parsial saat build bersih: junction runtime
`@prisma/client` dan `pg` mengarah ke folder kosong. Paket dipulihkan dari lockfile tanpa
mengubah versi, Prisma digenerate ulang, lalu build production lulus. Cache `.next` lama
yang hanya menyimpan referensi route preview dipindahkan ke folder temp di luar repo;
route preview sudah dihapus dari source dan tidak muncul pada daftar build.

**Berikutnya:** TASK-025 — laporan laba, persediaan, dan jejak audit. TASK-038 sudah terbuka
setelah TASK-033, tetapi dikerjakan pada urutan ke-39 sesuai peta jalan resmi.

---

### Sesi 25 — 28 Agustus 2026

**Requirement kategori menu — spesifikasi selesai, implementasi belum dimulai**

- Kebutuhan kategori yang sebelumnya belum masuk Sistem Desain ditambahkan sebagai
  **TASK-041 — Kategori menu dinamis dan organisasi katalog POS**.
- Kategori ditetapkan sebagai master data dinamis, bukan enum atau teks bebas. Setiap menu
  wajib mempunyai tepat satu kategori melalui relasi `category_id`.
- UX admin disepakati tetap di L-06 `/admin/products`: tombol `Kelola Kategori` membuka
  panel/modal ringkas untuk tambah, ubah nama, urutan, dan status. Tidak ada halaman atau
  item sidebar baru agar halaman Menu & Produk yang sudah disetujui tidak dirombak.
- POS akan memakai filter `Semua` + kategori aktif yang bekerja bersama pencarian dan
  mengikuti responsivitas serta bahasa visual TASK-033.
- Spesifikasi migrasi menetapkan backfill aman: Americano, Es Kopi Susu, dan Kopi Susu
  Aren → `Kopi`; Coklat Panas dan Matcha Latte → `Non Kopi`.
- Penonaktifan kategori dengan produk aktif harus ditolak; hard delete tidak tersedia;
  perubahan kategori dan perpindahan kategori produk masuk jejak audit.
- README, ERD, Prisma target, screen inventory, design direction, roadmap, progress, dan
  checkpoint diperbarui. **Tidak ada source aplikasi, database, atau operasi Git yang
  dilakukan dalam sesi dokumentasi ini.**

**Berikutnya:** implementasikan TASK-041 dan verifikasi admin/POS pada 375, 768, dan
1440 px. Setelah TASK-041 selesai, lanjutkan TASK-025.

---

### Sesi 26 — 28 Agustus 2026

**TASK-041 — selesai**

- Model `ProductCategory` dan relasi wajib `Product.categoryId` ditambahkan bersama indeks,
  constraint `sort_order >= 0`, FK `ON DELETE RESTRICT`, dan migrasi
  `20260828000000_add_product_categories`.
- Migrasi diterapkan tanpa reset. Hasil aktual: Americano, Es Kopi Susu, dan Kopi Susu
  Aren berada pada `Kopi`; Coklat Panas dan Matcha Latte pada `Non Kopi`. Fallback
  `Lainnya` hanya dibuat migrasi bila menemukan produk legacy di luar pemetaan tersebut.
- `/admin/products` kini memiliki filter kategori, kategori pada setiap baris/form, dan
  modal `Kelola Kategori` untuk tambah, ubah nama, ubah urutan, aktivasi, serta
  penonaktifan tanpa rute/sidebar baru.
- Kategori yang masih dipakai menu aktif tidak dapat dinonaktifkan. Hard delete tidak
  tersedia; slug dibentuk di server dan collision ditampilkan sebagai galat aman.
- POS memiliki tab `Semua` dan kategori aktif dinamis berdasarkan `sortOrder`. Filter
  kategori bekerja bersama pencarian dan empty state dapat mengembalikan seluruh menu.
- Create/update/toggle kategori serta perpindahan kategori produk ditulis ke `audit_logs`
  dalam transaksi yang sama dengan mutasinya.
- Follow-up Storage memperbaiki deteksi bucket kosong: Supabase mengembalikan HTTP 400
  `NoSuchBucket`, bukan selalu HTTP 404. Bucket `menu-images` dibuat dan smoke test
  upload/read/delete lulus; objek uji langsung dibersihkan.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Prisma | format, validate, generate, dan `migrate deploy` lulus; migrasi ketujuh diterapkan |
| Backfill aktual | tepat 3 menu Kopi dan 2 menu Non Kopi; semua produk memiliki kategori |
| TypeScript + ESLint perubahan | lulus tanpa temuan |
| Seluruh test database serial | **53 lulus, 0 gagal, 0 skip**; termasuk I-11 kategori |
| Build produksi | lulus; **17 route**; hanya peringatan deprecation lama `middleware` → `proxy` |
| Browser admin | modal kategori, pesan blokir, filter Kopi = 3 menu, dan komposisi desktop/mobile lulus |
| Browser POS | filter Non Kopi = 2 menu; pencarian+filter dan empty state tersedia |
| Responsif | admin dan POS tanpa body overflow horizontal pada 375, 768, dan 1440 px |

**Berikutnya:** TASK-025 — laporan laba, persediaan, dan jejak audit.

---

### Sesi 27 — 28 Agustus 2026

**Preflight TASK-025 — selesai; implementasi belum dimulai**

- Tiga route target (`/admin/reports/profit`, `/admin/reports/inventory`, dan
  `/admin/audit`) memang belum tersedia. Dashboard sudah memiliki filter periode WIB,
  sehingga catatan lama “hanya hari ini/bulan berjalan” dikoreksi.
- Model `AuditLog` dan tujuh migrasi sudah ada serta seluruh migrasi berstatus up to date.
  Audit aktual berisi empat aktivitas shift. Hook kategori dan void tersedia, tetapi audit
  create/update/toggle bahan dan produk serta penggantian resep belum lengkap; audit master
  pengguna tetap mengikuti TASK-036.
- Ditemukan regresi laten pada dashboard: pendapatan ringkas memakai `total_amount`, bukan
  `net_amount`. Data sekarang memiliki pajak nol sehingga angka tampak benar, tetapi PB1
  nonnol akan membuat pajak ikut dianggap pendapatan. Koreksi ini menjadi bagian awal
  TASK-025 melalui lapisan ringkasan laporan bersama.
- Data development membuktikan HPP finansial tidak boleh dipakai untuk rekonsiliasi stok:
  tiga penjualan completed memiliki `sales.total_hpp` Rp70.950, sedangkan buku besar
  `sale/out` hanya Rp50.950. Selisih Rp20.000 berasal dari HPP manual/fallback yang tidak
  mengonsumsi bahan BOM dan merupakan kondisi sah.
- Rumus README §3.9 diperbaiki menjadi rekonsiliasi buku besar yang mencakup opening,
  purchase, sale void, sale, waste, serta adjustment dua arah. Dengan data saat ini,
  opening Rp549.000 dikurangi `sale/out` Rp50.950 menghasilkan persediaan akhir
  Rp498.050. Snapshot tanggal lampau wajib memakai `value_after` mutasi terakhir per bahan,
  bukan kolom stok terkini.
- Kontrak ekspor diputuskan: CSV sesuai filter dan tampilan cetak/simpan PDF browser masuk
  inti TASK-025; XLSX asli serta PDF buatan server dicatat sebagai DEF-09.
- Spesifikasi TASK-025 diperluas dengan akses admin, pagination/filter audit, hook audit
  atomik, indeks/kueri tanpa N+1, arah visual laporan, dan kasus uji PB1, HPP fallback,
  opening, void lintas periode, snapshot historis, serta otorisasi ekspor. Dependency
  TASK-012 yang sebelumnya hilang dari tabel/grafik juga dipulihkan.

**Verifikasi recheck**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Prisma migrate status | **7 migrasi ditemukan; database schema up to date** |
| Seluruh test database serial | **53 lulus, 0 gagal, 0 skip** |
| TypeScript | `tsc --noEmit` lulus |
| Build produksi | lulus; **17 route**; hanya peringatan deprecation lama `middleware` → `proxy` |

**Berikutnya:** implementasikan TASK-025 dari lapisan kueri/agregasi bersama, lalu laporan
laba, laporan persediaan, audit, ekspor, pengujian, dan verifikasi responsif/cetak. Jangan
menandai TASK-025 selesai sebelum seluruh acceptance baru di `phase11.md` terpenuhi.

---

### Sesi 28 — 28 Agustus 2026

**TASK-025 — selesai**

- Lapisan `reporting.ts` menjadi sumber ringkasan laba dashboard dan laporan. Pendapatan
  memakai `net_amount`; PB1 ditampilkan sebagai pungutan terpisah dan pembelian tetap arus
  persediaan, bukan beban.
- Laporan laba, nilai persediaan historis, rekonsiliasi ledger, dan jejak audit tersedia pada
  tiga route admin baru. Sidebar mendapat item Laporan serta Jejak Audit tanpa menambah
  dekorasi/chart yang tidak diperlukan.
- Snapshot persediaan memakai lateral query mutasi terakhir per bahan. Rekonsiliasi memuat
  opening, purchase, sale void, sale, waste, dan adjustment dua arah; HPP finansial tidak
  dipaksa sama dengan nilai `sale/out`.
- Audit create/update/toggle bahan dan produk serta penggantian resep ditulis atomik bersama
  mutasinya. Kategori, shift, dan void yang sudah ada tetap dipakai. Renderer before/after
  menyembunyikan key password/hash/token/secret dan tidak menampilkan JSON mentah.
- CSV sesuai filter tersedia untuk kedua laporan, dilindungi admin dan formula injection.
  Stylesheet cetak memakai logo vertikal serta menyembunyikan sidebar/kontrol interaktif.
- Migrasi kedelapan `20260828010000_add_report_indexes` menambah indeks laporan pada mutasi
  stok dan urutan audit; diterapkan tanpa reset atau perubahan data bisnis.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Prisma | format + validate lulus; 8 migrasi diterapkan; schema up to date |
| TypeScript + ESLint perubahan | lulus tanpa temuan |
| Seluruh test database serial | **57 lulus, 0 gagal, 0 skip**; fixture TASK-025 tersisa nol |
| Build produksi | lulus; **22 route**; hanya warning lama `middleware` → `proxy` |
| Runtime terautentikasi | 3 halaman HTML dan 2 CSV merespons 200; tanpa sesi dialihkan ke login |
| Performa | laba + persediaan periode 1–28 Agustus sekitar **1,9 detik**; rekonsiliasi selisih nol |
| Browser | Laba, persediaan, dan audit lulus pada 1440/768/375 px tanpa body overflow; filter, empty/error state, detail, CSV, dan aksi cetak diperiksa |

**QA visual final**

- Laporan laba, persediaan, dan jejak audit diperiksa dengan sesi Admin nyata pada desktop
  1440 px, tablet 768 px, dan ponsel 375 px. Tidak ada overflow pada halaman; tabel yang
  lebar menggulir hanya di pembungkusnya, sementara filter dan sidebar mengikuti breakpoint.
- Empty state dan galat rentang tanggal tampil jelas. Detail audit dapat dibuka pada layar
  sempit; field teknis `openedAt` dan waktu ISO kemudian dirapikan menjadi label Indonesia,
  waktu WIB, dan nominal rupiah.
- Kedua tombol CSV menghasilkan file bernama sesuai periode. Tombol cetak memanggil alur
  native; panel automasi tidak mengekspos dialog sistemnya, sehingga struktur print-only,
  logo vertikal, penyembunyian sidebar/kontrol, dan aturan `@media print` turut diverifikasi
  langsung pada source dan markup.
- Setelah perapian audit, ESLint berkas berubah dan `tsc --noEmit` lulus. Seluruh suite
  database dijalankan ulang: **57 lulus, 0 gagal, 0 skip**.

**Berikutnya:** TASK-037 — lint bersih, kode mati, dan migrasi `middleware.ts` ke `proxy.ts`.

---

### Sesi 28 — lanjutan, 28 Agustus 2026

**TASK-037 — selesai**

- Baseline aktual sebelum perubahan adalah 2 error dari `test_db.js` dan 20 warning yang
  seluruhnya berasal dari salinan referensi `hallmark-main/`; temuan lama `matchaLatte`,
  `.pulse-slow`, dan duplikasi `@keyframes` sudah tidak ada.
- `hallmark-main/**` ditambahkan ke `globalIgnores`, sedangkan `test_db.js` dihapus karena
  hanya skrip debug basis data lama dan tidak dirujuk source aplikasi.
- `src/middleware.ts` diganti `src/proxy.ts`; ekspor dinamai `proxy` sesuai Next.js 16.
  Matcher, pemeriksaan sesi, redirect login, dan pembatasan route Admin dipertahankan.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Full ESLint | **0 error, 0 warning** |
| TypeScript | `tsc --noEmit` lulus |
| Seluruh test database serial | **57 lulus, 0 gagal, 0 skip** |
| Build produksi | lulus; 22 route; tidak ada warning deprecation middleware |
| Smoke proxy | `/admin/dashboard` tanpa sesi → `307 /login`; `/login` → `200` |
| Server development | hidup kembali di `http://localhost:3000`; request dicatat melalui `proxy.ts` |

**Berikutnya:** TASK-034 — ukur pola kueri checkout, lalu optimalkan hanya bottleneck yang
terverifikasi.

---

### Sesi 28 — lanjutan, 28 Agustus 2026

**TASK-034 — selesai**

- Baseline checkout dengan tiga item membuktikan pembacaan produk sudah dilakukan melalui
  **satu kueri** sebelum transaksi database. Karena tidak ditemukan pola N+1 maupun
  pembacaan produk di dalam transaksi, batas transaksi dan mekanisme row lock yang sudah
  aman tidak dirombak.
- Payload produk checkout dipersempit dari `include` relasi penuh menjadi `select`
  eksplisit untuk field yang benar-benar dipakai beserta `ingredientId` dan
  `quantityNeeded` resep. Pada data development, ukuran serialisasi turun dari 1.075 byte
  menjadi 468 byte, atau **56,5%**.
- Kueri riwayat penjualan admin juga memakai `select` eksplisit untuk transaksi, kasir,
  dan detail produk yang dirender. Pada data development, ukuran serialisasi turun dari
  2.261 byte menjadi 1.233 byte, atau **45,5%**.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Instrumentasi checkout | 3 item tetap **1 kueri produk** dan kueri terjadi di luar transaksi |
| TypeScript | `tsc --noEmit` lulus |
| Full ESLint | **0 error, 0 warning** |
| Seluruh test database serial | **57 lulus, 0 gagal, 0 skip** |
| Build produksi | lulus; **22 route** |
| Smoke terautentikasi | `/admin/sales` merespons 200 dan merender Riwayat Penjualan tanpa internal error |
| Server development | hidup kembali di `http://localhost:3000` |

**Berikutnya:** TASK-040 — audit dan pertahankan nilai uang utuh pada batas Server
Component dan Client Component tanpa mengubah kebijakan pembulatan yang sudah berlaku.

---

### Sesi 28 — lanjutan, 28 Agustus 2026

**TASK-040 — selesai**

- `src/lib/dto.ts` menjadi kontrak eksplisit empat payload Server Component → Client
  Component: katalog kasir, tabel produk, tabel bahan, dan pilihan bahan pembelian.
- Setiap kueri memakai `select` yang sejajar dengan DTO. Round-trip
  `JSON.parse(JSON.stringify(...))` di source aplikasi dihapus seluruhnya.
- `Decimal` Prisma dipetakan tanpa pembulatan menjadi string serializable melalui satu
  fungsi `toDecimalDTO` di `money.ts`. Komponen klien memakai tipe DTO dan `toNumber`
  terpusat hanya ketika perlu menghitung pada lapisan tampilan; tidak ada lagi field uang
  bertipe `unknown`.
- Uji DTO mengunci presisi `DECIMAL(14,2)`, kuantitas tiga desimal, dan average cost empat
  desimal, serta memastikan payload kasir tidak membawa `imagePath` internal.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Acceptance statis | Tidak ada round-trip JSON generik pada source non-test; tidak ada field uang `unknown` pada empat komponen klien |
| TypeScript | `tsc --noEmit` lulus tanpa assertion `as` untuk menyembunyikan tipe DTO |
| Full ESLint | **0 error, 0 warning** |
| Seluruh test database serial | **58 lulus, 0 gagal, 0 skip** |
| Build produksi | lulus; **22 route** |
| Smoke browser terautentikasi | Produk, Bahan Baku, Pembelian, dan POS merender data aktual tanpa hydration/runtime error |
| Server development | hidup kembali di `http://localhost:3000` |

**Temuan yang tidak ditutup oleh TASK-040**

- Dev browser memberi warning bahwa dua foto menu dapat menjadi LCP dan menyarankan
  prioritas pemuatan. Tidak ada kegagalan render atau fungsi. Ini sengaja tidak dicampur
  ke refactor tipe uang; tinjau pada TASK-039/final performance polish agar prioritas hanya
  diberikan pada foto yang benar-benar berada di atas fold, bukan seluruh katalog.

**Berikutnya:** TASK-035 masih menunggu D-10 (tooling/CI). Task independen yang dapat
langsung dilanjutkan adalah TASK-036 — rate limit login dan manajemen pengguna.

---

### Sesi 28 — tindak lanjut keamanan, 28 Agustus 2026

**D-01 — rotasi password Supabase selesai**

- GitGuardian mendeteksi PostgreSQL URI lama pada push GitHub. URI diperlakukan sebagai
  kredensial yang sudah terkompromi, bukan lagi sekadar risiko teoritis.
- Pemilik proyek merotasi password database langsung dari Supabase dan memperbarui
  `DATABASE_URL` serta `DIRECT_URL` pada `.env` lokal.
- Verifikasi tidak menampilkan nilai rahasia: `prisma migrate status` menemukan delapan
  migrasi dan menyatakan schema up to date; query read-only berhasil membaca 2 user dan
  5 produk. Tidak ada reset, seed, atau mutasi data.
- Server development direstart dengan environment baru dan `/login` merespons 200.
- TASK-001 tetap `🟡 Sebagian`: `supabaseConnect.txt` masih ada sebagai salinan lokal
  berisi kredensial lama yang kini invalid, pembersihan riwayat Git ditangani pemilik,
  dan secret Vercel belum relevan karena belum ada deployment.

---

### Sesi 29 — 29 Agustus 2026

**TASK-036 — selesai**

- Migrasi `add_login_security` menambahkan `users.session_version` dan tabel
  `login_attempts`; migrasi constraint menjaga versi sesi minimal 1 dan hitungan gagal
  pada rentang 0–5. Seluruh sepuluh migrasi terpasang tanpa reset atau kehilangan data.
- Login dinormalisasi per username dan dibatasi dalam jendela 15 menit: kegagalan ke-3
  menahan 2 detik, ke-4 selama 5 detik, dan ke-5 sampai jendela berakhir. State berada di
  PostgreSQL dengan transaksi serializable; username tidak dikenal tetap menjalankan
  `bcrypt.compare` terhadap dummy hash cost 10 dan memperoleh throttle yang sama.
- Login berhasil membersihkan throttle dan memperbarui `last_login_at`. Akun nonaktif
  ditolak dengan pesan generik yang sama seperti kredensial salah.
- JWT membawa `sessionVersion`. Guard server memeriksa versi, peran, username, serta
  `is_active` terhadap database; reset password dan perubahan status menaikkan versi,
  sehingga sesi lama langsung tidak berlaku. Proxy tetap menjadi gerbang JWT cepat.
- `/admin/users` ditambahkan dengan pola DataTable/Modal/Field/Feedback yang sudah ada:
  Admin dapat menambah Kasir, mereset password minimal 8 karakter, dan mengubah status.
  Tidak ada hard delete atau perubahan peran. Akun sendiri, admin aktif terakhir, dan
  Kasir dengan shift terbuka dilindungi dari penonaktifan.
- Create/reset/status pengguna dicatat atomik pada `audit_logs` tanpa password/hash.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Prisma | **10 migrasi up to date**; query akhir tidak menemukan fixture test tersisa |
| TypeScript | `tsc --noEmit` lulus |
| Full ESLint | **0 error, 0 warning** |
| Seluruh test database | **63 lulus, 0 gagal, 0 skip**; 5 kasus TASK-036 baru |
| Build produksi | lulus; **23 route**, termasuk `/admin/users` |
| Browser lokal | QA terautentikasi lulus pada viewport 1280 × 800 dan 375 × 812: tidak ada overflow halaman, tabel menggulir secara lokal, kontrol mobile minimal 44 px, label/fokus/Escape tiga modal benar, dan console bersih dari warning baru. Temuan modal status saat shift terbuka serta warning LCP logo compact sudah diperbaiki dan diverifikasi ulang. |

**Berikutnya:** TASK-038 — interaksi keyboard kasir. TASK-035 dan keputusan
persistensi TASK-039 tetap mengikuti §4.

---

### Sesi 30 — 29 Agustus 2026

**TASK-038 — selesai**

- POS memfokuskan kolom pencarian ketika layar dibuka. Tombol `/` mengembalikan fokus
  ke pencarian hanya saat pengguna tidak sedang mengetik di field lain.
- Enter pada pencarian yang berisi kata kunci menambahkan hasil pertama, mengosongkan
  kata kunci, dan mempertahankan fokus agar entri berikutnya dapat langsung diketik.
- F2 memindahkan fokus ke uang diterima untuk transaksi tunai atau tombol bayar untuk
  QRIS/transfer. Enter pada uang diterima memakai validasi dan idempotensi checkout yang
  sama; loading tetap mencegah pengiriman ganda.
- Kartu menu memakai satu titik Tab dengan navigasi panah/Home/End, sehingga urutan Tab
  tidak lagi melewati seluruh katalog. Menu yang tidak tersedia dilewati.
- Petunjuk `/`, Enter, F2, dan panah terlihat di dekat pencarian. `aria-keyshortcuts`,
  group label, dan live announcement melengkapi jalur assistive technology.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Test helper keyboard | **4 lulus**: isolasi `/`, F2 dari field, wrap/skip navigasi, dan semua menu nonaktif |
| Seluruh test database | **67 lulus, 0 gagal, 0 skip** dengan `RUN_DB_TESTS=1` dan concurrency 1 |
| Full ESLint | **0 error, 0 warning** |
| TypeScript + build | lulus; **23 route** |
| QA browser | Navigasi otomatis localhost ditolak kebijakan alat setelah restart server; tidak ada checkout uji yang dikirim. Struktur fokus, handler, state disabled/loading, dan petunjuk UI diverifikasi dari source serta build. Smoke manual tetap disarankan. |

**Berikutnya:** tidak ada task bebas-keputusan yang tersisa. Tentukan D-11 untuk
TASK-039 (persistensi keranjang) atau D-10 untuk TASK-035 (tooling pengujian/CI).

---

### Sesi 31 — 30 Agustus 2026

**TASK-039 — selesai**

- README §3.12 menetapkan persistensi keranjang memakai `sessionStorage`, dipisahkan
  menurut ID kasir dan shift aktif, serta kedaluwarsa setelah delapan jam.
- Penyimpanan hanya memuat versi, waktu, ID menu, dan jumlah. Harga, resep, stok,
  diskon, pajak, metode pembayaran, serta uang diterima tidak disalin ke browser.
- Restore merekonsiliasi ID terhadap katalog aktif dari server, membuang menu yang
  hilang, dan membatasi jumlah berdasarkan stok resep terbaru termasuk bahan bersama.
  Keranjang shift lama dibersihkan; storage error tidak memblokir transaksi.
- Checkout sukses dan “Kosongkan Keranjang” menghapus salinan. Restore yang berhasil,
  berkurang, atau kedaluwarsa dijelaskan kepada kasir melalui feedback/live region.
- Teks pengguna distandardkan ke “Menu”. “HPP Manual / Fallback” diganti label dan hint
  yang lebih jelas; kemunculan pertama menjabarkan Harga Pokok Penjualan (HPP).
- Pesan stok klien/server/opname memakai format yang sama. Konfirmasi hapus pengeluaran
  menyebut deskripsi, dampak ke laporan laba, dan bahwa tindakan tidak dapat dipulihkan.
- Temuan login, font, dan pola form lama diaudit ulang: orb/gradient/glass sudah tidak
  ada, font sudah memakai `next/font`, dan form pengeluaran sudah memakai pola client
  action seragam dari task sebelumnya sehingga tidak diubah ulang.

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Test persistensi | **5 lulus**: payload minimal/key, katalog berubah, stok bersama, expiry 8 jam, dan payload rusak |
| Seluruh test database | **72 lulus, 0 gagal, 0 skip** dengan `RUN_DB_TESTS=1` dan concurrency 1 |
| Full ESLint | **0 error, 0 warning** |
| TypeScript + build | lulus; **23 route** |
| Audit copy/visual | 0 “Produk”, “HPP Dasar”, atau “BOM” pada teks UI; 0 orb/gradient/glass login dan 0 `@import url` font |
| QA browser | Otomasi localhost masih dibatasi kebijakan alat; persistence flow tidak mengirim checkout dan smoke refresh manual disarankan. |

**Berikutnya:** TASK-035 masih menunggu keputusan D-10 tentang tooling pengujian/CI.
TASK-001 tetap sebagian sesuai keputusan menunda deploy dan riwayat Git.

---

### Sesi 32 — 30 Agustus 2026

**Recheck keseluruhan dan runbook testing — dokumentasi selesai; status task tidak berubah**

- `docs/testing-checklist.md` ditambahkan sebagai alur resmi dari baseline teknis,
  smoke manual, QA responsif/aksesibilitas, UAT minimal tiga hari, sampai gate pradeploy.
- Pemetaan README §9 dibuat eksplisit. Sepuluh kontrak unit sudah mempunyai bukti
  otomatis, tetapi I-01/I-02/I-06/I-09 baru sebagian dan I-03/I-04/I-05 belum mempunyai
  test integrasi khusus. I-07, I-08, dan I-10 sudah lulus; I-11 kategori adalah tambahan.
- Karena itu 72/72 berarti seluruh suite **yang tersedia** hijau, bukan berarti
  Acceptance Criteria TASK-035 sudah lengkap. CI juga belum tersedia.
- README §9 sekarang menautkan checklist eksekusi tanpa mengubah spesifikasi pengujian.
- Tidak ada kode aplikasi, skema, data bisnis, dependency, lockfile, atau Git yang diubah.

**Verifikasi ulang**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Full ESLint | **0 error, 0 warning** |
| TypeScript | `tsc --noEmit` lulus |
| Prisma | schema valid; **10 migrasi up to date** |
| Seluruh test database | **72 lulus, 0 gagal, 0 skip** dengan concurrency 1 |
| Build produksi | lulus; **23 route** |
| UAT/backup restore/CI | belum; dicatat sebagai gate terpisah, bukan diklaim lulus |

**Berikutnya:** putuskan dan kerjakan D-10/TASK-035 dengan mengisi tujuh gap integrasi
dan CI, lalu jalankan smoke manual serta UAT memakai `docs/testing-checklist.md`.

---

### Sesi 33 — 30–31 Agustus 2026

**Smoke browser menyeluruh — selesai dengan temuan; status task tidak berubah**

- Lima belas layar utama Admin/Kasir dirender. Dashboard, Menu, Laporan Persediaan, dan
  POS diuji pada 1440/768/375/320 px tanpa body overflow; kontrol terlihat minimal 44 px.
- Login gagal memakai pesan generik. Keyboard POS, filter kategori, persistensi keranjang,
  fokus modal, dan pengembalian fokus lulus. F2 Tunai mengungkap QA-001.
- Fixture development menguji alur kategori → bahan → pembelian → menu/resep → QRIS →
  riwayat/void → pengeluaran → pengguna/audit. Stok 100 gram @ Rp1.000 turun ke 98 pada
  sale lalu kembali tepat ke 100 setelah void; HPP resep/sale Rp2.000 dan margin Rp8.000.
- CRUD pengguna lulus untuk tambah Kasir, reset password, nonaktifkan, dan aktifkan.
  Audit memuat aksi tanpa password/hash.
- Seluruh fixture `TEST QA` dibersihkan dalam satu transaksi: 1 kategori, bahan,
  pembelian, menu/resep, sale/detail, pengeluaran, pengguna; 3 mutasi stok dan 13 audit.
  Lima layar diverifikasi kembali dan tidak menampilkan fixture.
- Enam temuan dicatat pada `docs/test-runs/2026-08-30-smoke-sesi-33.md`: QA-001 F2
  Tunai, QA-002 live region ganda, QA-003 warning LCP, QA-004 dependency junction lokal,
  QA-005 tanggal murni mundur sehari, dan QA-006 audit ganda saat toggle kategori cepat.
- Dependency lokal direkonstruksi dari frozen `pnpm-lock.yaml`; source dan lockfile tidak
  diubah. Dev server kembali hidup setelah production build. Tidak ada operasi Git.

**Verifikasi akhir**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Full ESLint | **0 error, 0 warning** |
| TypeScript | `tsc --noEmit` lulus |
| Prisma | schema valid; **10 migrasi up to date** |
| Seluruh test database | **72 lulus, 0 gagal, 0 skip**; serial, 237,9 detik |
| Production build | lulus; Next.js 16.2.11; **23 route** |
| Smoke pasca-build | `/login` 200; `/admin/dashboard` tanpa sesi 307 ke `/login`; dev server hidup kembali |
| UAT/backup restore/CI | belum; tetap merupakan gate terpisah |

#### Lanjutan Sesi 33 — penutupan QA-001 dan QA-005

- QA-001 ditutup dengan memindahkan ref shortcut pembayaran ke input Uang Diterima.
  Retest browser menunjukkan F2 pada metode Tunai membuat input tersebut aktif.
- QA-005 dipastikan sebagai bug persistensi `@db.Date`, bukan hanya format tabel.
  Pembelian, pengeluaran, filter keduanya, dan expense otomatis dari waste sekarang
  memakai kontrak tanggal murni tanpa konversi hari WIB ↔ UTC.
- Fixture pembelian/pengeluaran tanggal `2026-08-31` tampil `31/8/2026` dan ditemukan
  oleh filter satu hari. Cleanup atomik menghapus fixture sekaligus mengembalikan stok,
  nilai, dan average cost bahan setelah memastikan tidak ada mutasi yang lebih baru.
- Tiga regression test kolom `DATE` ditambahkan. Seluruh suite naik dari 72 menjadi
  **75/75**, tanpa gagal atau skip.

| Pemeriksaan | Hasil penutupan |
| :--- | :--- |
| Full ESLint | **0 error, 0 warning** |
| TypeScript | `tsc --noEmit` lulus |
| Prisma | schema valid; **10 migrasi up to date** |
| Seluruh test database | **75 lulus, 0 gagal, 0 skip**; serial, 191,8 detik |
| Production build | lulus; Next.js 16.2.11; **23 route** |
| Dev server | hidup kembali di `http://localhost:3000` setelah build |

#### Lanjutan Sesi 33 — penutupan QA-002, QA-003, dan QA-006

- QA-002 ditutup: pesan restore keranjang hanya dikirim ke satu live region. Retest
  browser menemukan tepat satu kemunculan pesan setelah reload; keranjang uji dibersihkan.
- QA-003 ditutup: logo di atas fold memakai `loading="eager"`, prop `priority` deprecated
  dihapus, dan foto awal POS/tabel diberi strategi eager/lazy eksplisit. Dashboard, Menu,
  dan POS dimuat ulang tanpa warning LCP baru pada output development.
- QA-006 ditutup pada UI dan service. Guard ref sinkron menahan klik ulang sebelum render
  pending, sedangkan row lock mengabaikan transisi yang status targetnya sudah tercapai.
  I-11 kini menguji pasangan request paralel; retest dua klik browser menghasilkan tepat
  satu audit. Fixture kategori beserta audit dihapus dan diverifikasi tidak tersisa.
- Gate akhir tetap **75/75**, ESLint 0/0, TypeScript dan Prisma lulus, 10 migrasi up to
  date, serta production build Next.js 16.2.11 menghasilkan 23 route.

**Berikutnya:** tidak ada temuan aplikasi dari smoke Sesi 33 yang masih terbuka. Putuskan
D-10 dan lanjutkan TASK-035; TASK-001 tetap sebagian.

---

### Sesi 34 — 31 Agustus 2026

**TASK-035 — selesai**

- D-10 menetapkan `node:test` + `tsx` + Prisma untuk unit/integrasi dan Playwright Test
  1.62.1 + Chromium untuk browser E2E. Maestro tidak menjadi runner web utama;
  WireMock belum diperlukan karena aplikasi belum memiliki dependency HTTP eksternal.
- Alur pembelian dipisahkan ke `purchase-service.ts` agar Server Action dan test memakai
  transaksi produksi yang sama. Invoice pembelian diberi sufiks UUID untuk menghindari
  tabrakan milidetik tanpa mengubah bentuk bisnisnya.
- Tujuh regresi khusus I-01/I-02/I-03/I-04/I-05/I-06/I-09 ditambahkan. I-05 memakai dua
  idempotency key berbeda yang benar-benar berebut stok cukup satu transaksi; tepat satu
  berhasil dan saldo akhir nol, tidak negatif.
- Guard admin menyediakan seam `requireAdminSession()` yang tetap memvalidasi akun aktif
  terhadap database. Server Action memakai seam yang sama; sesi Kasir ditolak dan sesi
  Admin aktif diterima pada test I-09.
- Playwright membuat user, kategori, bahan, menu, dan shift berawalan E2E; auth state
  memakai JWT test. Global teardown menghapus seluruh fixture bahkan setelah kegagalan.
- Sebelas E2E mencakup redirect tanpa sesi, login Admin/Kasir, larangan `/admin/*` untuk
  Kasir, enam rute Admin, checkout QRIS sampai struk, serta overflow Dashboard/POS pada
  1440, 768, dan 375 px. E2E menjalankan production build melalui `next start`.
- `.github/workflows/qa.yml` memakai PostgreSQL 16 sementara. Setiap push/PR menjalankan
  migrasi+seed, lint, TypeScript, Prisma validate, 82 test Node, build, dan 11 E2E;
  workflow tidak melakukan deploy dan tidak menyentuh Supabase development.
- `package-lock.json` dan `pnpm-lock.yaml` disinkronkan untuk dependency Playwright.
  Perintah publik tetap berbasis npm; tidak ada migrasi package manager dan tidak ada
  operasi Git yang dijalankan.

**Verifikasi akhir**

| Pemeriksaan | Hasil |
| :--- | :--- |
| Full ESLint | **0 error, 0 warning** |
| TypeScript | `tsc --noEmit` lulus |
| Prisma | schema valid; database development tetap memakai 10 migrasi |
| Unit + integration | **82 lulus, 0 gagal, 0 skip**; serial, 268,8 detik |
| Production build | lulus; Next.js 16.2.11; **23 route** |
| Playwright | **11 lulus, 0 gagal**; desktop/tablet/mobile Chromium, 2,0 menit |
| Cleanup fixture | `.playwright` terhapus; user/menu/bahan/kategori E2E masing-masing **0** |
| CI | run remote pertama berhasil menerapkan 10 migrasi, lalu gagal pada import direktori Prisma seed di Linux; import eksplisit `generated/prisma/client` sudah lulus gate lokal dan menunggu push ulang pengguna |

**Koreksi CI setelah push pertama**

- GitHub Actions berhasil membuat PostgreSQL sementara dan menerapkan seluruh 10 migrasi.
- Tahap seed berhenti sebelum test karena runner Linux tidak meresolusi import direktori
  `../src/generated/prisma` dari `prisma/seed.ts`.
- Seed, koneksi bersama, service, test, dan halaman server kini mengimpor file generator
  Prisma secara eksplisit melalui `generated/prisma/client`, sesuai struktur generator
  `prisma-client` dan portable lintas Windows/Linux.
- Verifikasi setelah koreksi: Prisma generate berhasil; smoke export `PrismaClient`
  berhasil; ESLint 0/0; TypeScript lulus; schema valid; **82/82** Node test lulus; build
  produksi **23 route** lulus. Playwright tidak diulang karena tidak ada perubahan UI,
  tetapi baseline terakhir tetap **11/11**.

**Berikutnya:** pengguna push koreksi import ke `dev`, lalu pastikan workflow QA remote
hijau. Sesudahnya jalankan UAT operasional minimal tiga hari dan uji pemulihan cadangan.
TASK-001 tetap sebagian karena deploy dan pembersihan riwayat Git sengaja ditunda.

---
