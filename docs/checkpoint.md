# CHECKPOINT PROGRES APLIKASI — AUDIT KODE TERHADAP DOKUMEN DESAIN

**Proyek:** Aplikasi Web POS & Analisis Laba — Kafe Kopi Merbaoe
**Acuan:** `README.md` — Dokumen Desain Sistem
**Tanggal audit:** 22 Agustus 2026
**Basis pemeriksaan:** berkas kerja lokal apa adanya di diska
**Versi dokumen:** 7.2
**Audit lanjutan:** `docs/execute-step/phase1.md` s.d. `phase11.md` (Phase 0–11)
**Arah visual:** `docs/design-direction.md`

---

> ### ⚠️ Dokumen ini adalah SNAPSHOT audit, bukan kondisi terkini
>
> Sejak audit ini ditulis, sebagian temuan **sudah diperbaiki**. Status terkini
> ada di **`docs/progress.md`**.
>
> Sudah ditangani per 30 Agustus 2026 — lihat `docs/progress.md` untuk bukti terbaru:
> **S3** (otorisasi Server Action) · **S5** (kuantitas negatif) · **A1** (rumus laba
> bersih) · **A2** (HPP dinamis) · **A3** (kartu stok keluar) · **A4** (model DPP,
> pajak, dan kembalian) · **A5** (zona waktu) ·
> **A6** dan **A7** (agregasi di memori) ·
> **UI-01–UI-04**, **UI-07**, dan **UI-09** (kontras, aksesibilitas field/dialog,
> komponen bersama, tabular numerals, dan umpan balik) · **E4–E5** (error boundary dan umpan balik
> Server Action) · **DB-01–DB-18** (migrasi skema, constraint,
> indeks, dan sequence) · **D1** (row lock stok terurut; uji konkurensi I-05 lulus) ·
> **D2–D3** (nomor invoice server dari sequence dan dikembalikan ke kasir) ·
> **§3.6.C** (saldo seed dicatat sebagai transaksi `opening`).
> **F1 / L-07** (penyusun resep BOM, pratinjau HPP, dan sinkronisasi otomatis
> `has_recipe`) · **D4/D7** (edit produk dan soft delete produk/bahan tanpa
> merusak relasi historis) · **TASK-017** (idempotensi checkout berbasis UUID,
> fingerprint payload, replay aman, dan pengaman retry paralel) · **TASK-022 / L-17**
> (struk server-rendered 58/80mm dengan waktu WIB dan CSS cetak) · **D6 / §7.4**
> (void admin atomik, reversal stok historis, audit log, dan filter laporan) ·
> **TASK-019 / §7.6** (shift wajib untuk Admin/Kasir, rekonsiliasi pengeluaran
> laci, L-13/L-20, dan I-10) · **TASK-020 / §7.5** (opname, waste, beban
> otomatis terkunci, L-04/L-05, dan invariant I-08) · **TASK-027 / §8.7**
> (kontrak loading-empty-error, skeleton rute, tombol pending, dan fallback
> error/not-found yang dapat dipulihkan) · **TASK-032** (modal aksesibel yang
> diverifikasi langsung dengan keyboard) · **TASK-031** (seluruh kontrol terlihat
> bernama, galat terasosiasi dan diumumkan, serta status pembayaran terekspos ke AT) ·
> **TASK-029** (palet kertas Merbaoe, 27 kombinasi teks/permukaan lulus AA, dan
> batas kontrol memenuhi 3:1) · **TASK-024 / §8.5** (pagination seluruh daftar
> admin, pencarian/filter server-side, agregat sesuai filter, dan periode WIB
> maksimal satu tahun) · **TASK-023 / L-18–L-19** (riwayat milik kasir,
> stok aktif read-only, dan navigasi kasir/admin) · **TASK-028** (token visual,
> tiga keluarga font lewat `next/font`, logo resmi, ikon garis, workbench kertas,
> serta penghapusan seluruh efek off-brand) · **TASK-033** (koreksi komposisi,
> sidebar responsif, POS tablet/mobile, target sentuh, dan foto menu opsional) ·
> **TASK-041** (master kategori dinamis, relasi wajib, backfill Kopi/Non Kopi,
> modal admin, filter POS, pengaman status, dan audit perubahan kategori) ·
> **TASK-025** (laporan laba/persediaan, rekonsiliasi ledger, jejak audit, CSV,
> stylesheet cetak, dan QA responsif 1440/768/375 px) · **TASK-037** (full lint
> bersih, skrip debug dihapus, Hallmark dikecualikan, dan konvensi `proxy.ts`) ·
> **TASK-034** (satu kueri produk checkout di luar transaksi serta payload checkout dan
> riwayat dipersempit berdasarkan hasil pengukuran) · **TASK-040** (DTO eksplisit pada
> boundary klien/server dan Decimal string serializable tanpa kehilangan tipe) ·
> **TASK-036 / L-14** (throttle login, bcrypt dummy, versi sesi, manajemen akun,
> reset password, soft deactivation, dan audit pengguna) · **TASK-038 / UX-10**
> (alur POS tanpa mouse melalui pencarian, Enter, F2, dan roving focus kartu) ·
> **TASK-039 / UD-10 / CT-01/03/06/09** (persistensi keranjang aman, copy Menu,
> label biaya, pesan stok, dan konfirmasi yang konsisten).
>
> Temuan lain masih berlaku. Angka cakupan pada §1 mencerminkan kondisi saat
> audit, bukan sekarang.

---

## STATUS IMPLEMENTASI TERKINI — 30 AGUSTUS 2026, SESI 32

Bagian ini adalah ringkasan kondisi kerja terbaru. Bagian §0–§15 di bawahnya tetap
dipertahankan sebagai jejak audit 22 Agustus 2026; klaim “belum diuji” di snapshot lama
tidak membatalkan bukti baru yang dicatat di sini dan di `docs/progress.md`.

| Aspek | Status terbaru |
| :--- | :--- |
| Progres peta jalan | **39 dari 41 task selesai**; 1 sebagian, 1 menunggu keputusan, 0 belum, dan 0 terblokir. |
| Task terakhir | **TASK-039 — persistensi keranjang, copy, dan visual**. |
| Task aktif | Belum ada; TASK-035 menunggu keputusan tooling/CI pada D-10. Runbook eksekusi tersedia di `docs/testing-checklist.md`. |
| Database development | Sudah di-reset dan di-seed atas persetujuan pengguna; sepuluh migrasi aplikasi tercatat sampai `add_login_security_constraints`. |
| Deployment | Belum ada deployment atau proyek Vercel; fokus tetap pengembangan lokal dengan Supabase yang ada. |
| Keamanan tertunda | Password database Supabase sudah dirotasi 28 Agustus setelah alert GitGuardian dan koneksi baru terverifikasi. Pembersihan salinan lokal/riwayat Git serta secret produksi tetap tertunda. |
| Kategori menu | Selesai pada Sesi 26. Dikelola dari modal di halaman Menu, satu kategori wajib per menu, dan menjadi filter POS yang bekerja bersama pencarian. |
| TASK-025 | **Selesai.** Laporan laba/persediaan, rekonsiliasi, audit, CSV, cetak, navigasi, hook audit, indeks, regresi finansial, dan QA visual terautentikasi sudah lengkap. |
| TASK-037 | **Selesai.** Full lint 0 error/0 warning; Hallmark tidak dipindai; `test_db.js` dihapus; build dan dev memakai `src/proxy.ts` tanpa warning deprecation. |
| TASK-034 | **Selesai.** Checkout tiga item tetap memakai satu kueri produk di luar transaksi. `select` eksplisit menurunkan payload produk checkout 56,5% dan riwayat penjualan 45,5%. |
| TASK-040 | **Selesai.** Empat payload klien memakai DTO eksplisit dan `select` sempit. Decimal diserialkan sebagai string melalui `money.ts`; tidak ada field uang `unknown` atau round-trip JSON generik. |
| TASK-036 | **Selesai.** Throttle database 5 kegagalan/15 menit, bcrypt dummy, akun nonaktif ditolak, versi sesi, `/admin/users`, reset password, soft deactivation, dan audit pengguna lengkap. |
| TASK-038 | **Selesai.** Fokus awal pencarian; `/`, Enter, dan F2; checkout tunai dengan Enter; satu titik Tab pada katalog dengan navigasi panah; petunjuk UI dan live announcement. |
| TASK-039 | **Selesai.** Keranjang `sessionStorage` per kasir+shift dengan expiry 8 jam dan restore terhadap katalog/stok terbaru; copy Menu, pesan stok, label HPP, serta konfirmasi diseragamkan. |
| Testing formal | Baseline 72/72 hijau, tetapi TASK-035 belum selesai: I-01/I-02/I-06/I-09 sebagian; I-03/I-04/I-05 belum mempunyai test khusus; CI dan UAT belum ada. |

### Kemampuan yang sudah tersedia

- Otorisasi Server Action, validasi Zod, zona waktu WIB, perhitungan uang, agregasi
  database, average costing perpetual, HPP snapshot, serta invariant kartu stok.
- Checkout aman terhadap race condition dan retry, invoice database, model DPP,
  diskon/pajak/kembalian, resep BOM, struk 58/80mm, dan pembatalan transaksi atomik.
- Shift Admin/Kasir, rekonsiliasi kas termasuk pengeluaran laci, opname, waste dengan
  beban otomatis terkunci, kartu stok, edit master, dan soft delete.
- Komponen UI bersama, kontrak loading/empty/error, skeleton seluruh segmen data,
  fallback error/not-found, tombol pending, modal aksesibel, field bernama, relasi
  galat terprogram, live feedback, dan status pembayaran yang terbaca AT.
- Palet kertas resmi Merbaoe, tinta hangat, warna semantik, garis dekoratif/kontrol,
  aksi utama solid, dan aksi destruktif outline dengan kontras terverifikasi.
- EB Garamond untuk judul, Inter untuk UI/data, IBM Plex Mono untuk invoice, skala
  tipografi/spasi/radius/motion terpusat, empat varian logo resmi pada konteksnya,
  serta satu set ikon garis SVG tanpa emoji.
- Pagination pada dashboard, seluruh riwayat, master bahan/produk, dan kartu stok;
  pencarian/filter server-side; dashboard dan agregat mengikuti periode WIB terpilih.
- Riwayat kasir dengan filter kepemilikan permanen di server, tampilan stok aktif tanpa
  data biaya atau aksi mutasi, serta navigasi POS/Riwayat/Stok/Shift dan tautan POS admin.
- Login dan dashboard sudah memiliki hierarki editorial yang lebih matang; shell admin
  beradaptasi menjadi rail/bar; POS memakai logo vertikal dan layout desktop/tablet/mobile.
- Produk mendukung foto asli opsional 4:3, fallback tipografis, dan alur admin
  unggah/ganti/hapus. Foto stok/generatif tidak dipakai; bucket `menu-images` sudah
  dikonfigurasi dan smoke test upload/read/delete lulus.
- Login memakai throttle PostgreSQL per username dengan jeda bertingkat dan jalur bcrypt
  yang sama untuk username dikenal/tidak dikenal. Admin mengelola akun Kasir dari
  `/admin/users`; reset password/status mencabut sesi lama lewat `session_version`.
- POS dapat dijalankan tanpa mouse: pencarian fokus otomatis, Enter menambah hasil,
  F2 menuju pembayaran, Enter menyelesaikan tunai yang valid, dan kartu menu memakai
  roving focus dengan tombol panah tanpa memenuhi urutan Tab.
- Keranjang bertahan melewati refresh/navigasi tab yang sama tanpa membawa nilai uang.
  Restore dibatasi kasir+shift dan delapan jam, lalu direkonsiliasi dengan katalog serta
  stok server terbaru sebelum ditampilkan.

### Implementasi TASK-025

- `/admin/reports/profit`, `/admin/reports/inventory`, dan `/admin/audit` sudah tersedia.
  Dashboard dan laporan memakai ringkasan bersama berbasis `net_amount`, sehingga PB1
  tidak lagi dianggap pendapatan.
- Laporan persediaan mengambil snapshot historis dari `balance_after`/`value_after` mutasi
  terakhir dan merekonsiliasi seluruh sumber ledger. Data development seimbang pada
  Rp549.000 − Rp50.950 = Rp498.050; HPP finansial Rp70.950 tetap dipisahkan secara sah.
- Hook audit atomik sekarang mencakup bahan, seluruh perubahan produk, resep, kategori,
  shift, void, dan pengguna. Data ditampilkan sebagai before/after terbaca serta
  disanitasi dari key rahasia; tidak ada backfill palsu.
- CSV sesuai filter dan tampilan cetak/PDF browser tersedia. Handler ekspor melakukan
  otorisasi admin sendiri; request tanpa sesi ditolak sebelum data dikirim.
- Indeks tanggal/sumber/tipe stok dan urutan tanggal audit diterapkan lewat migrasi
  `add_report_indexes`. Kueri laba + persediaan bulan penuh pada data development terukur
  sekitar **1,9 detik**, di bawah target tiga detik.
- QA visual terautentikasi lulus pada 1440, 768, dan 375 px. Tidak ada overflow halaman;
  filter bertumpuk sesuai breakpoint, navigasi mobile dapat digulir, dan overflow tabel
  persediaan/audit tetap terlokalisasi pada pembungkus tabel. Empty/error state, detail
  before/after, kedua unduhan CSV, aksi cetak, serta struktur stylesheet cetak juga diperiksa.
  Detail audit dirapikan menjadi label Indonesia, waktu WIB, dan nominal rupiah.

### Bukti verifikasi terbaru

| Pemeriksaan | Hasil terbaru |
| :--- | :--- |
| Prisma | Sepuluh migrasi ditemukan; database schema up to date. |
| TypeScript | `tsc --noEmit` lulus tanpa error. |
| ESLint | Seluruh repo lulus dengan **0 error dan 0 warning**; `hallmark-main/**` dikecualikan sebagai referensi, bukan source aplikasi. |
| Test keseluruhan | **72 lulus, 0 gagal, 0 skip** dengan `RUN_DB_TESTS=1` dan concurrency 1. |
| Test integrasi database opt-in | TASK-017, I-07, I-08, I-10, I-11, laporan TASK-025, dan audit resep seluruhnya lulus; fixture TASK-025 tersisa nol. |
| Build produksi | Lulus; **23 route** terdaftar termasuk `/admin/users`; Proxy dikenali dan warning deprecation `middleware` tidak muncul. |
| Uji TASK-036 | Lima test baru lulus: normalisasi, jadwal throttle, reset jendela, create/reset/audit/version sesi, penguncian 5 kegagalan, akun nonaktif, dan pengaman shift terbuka. QA browser terautentikasi juga lulus pada desktop 1280 × 800 dan mobile 375 × 812: tanpa overflow halaman, tabel menggulir secara lokal, kontrol mobile minimal 44 px, serta label/fokus/Escape modal benar. Modal akun dengan shift terbuka kini hanya menjelaskan tindakan yang diperlukan tanpa menawarkan mutasi; warning LCP logo compact juga sudah hilang setelah verifikasi ulang. |
| Uji TASK-038 | Empat test helper keyboard lulus: `/` tidak membajak field, F2 tetap dapat menuju pembayaran, roving focus wrap/skip menu nonaktif, dan kondisi seluruh menu nonaktif aman. Full lint, TypeScript, serta build 23 route lulus. Navigasi otomatis localhost ditolak kebijakan alat setelah restart; tidak ada checkout uji yang dikirim dan smoke keyboard manual tetap disarankan. |
| Uji TASK-039 | Lima test persistensi lulus: payload minimal/key per kasir-shift, rekonsiliasi katalog, pembatasan stok bersama, expiry 8 jam, dan penolakan payload rusak. Audit source menemukan nol istilah “Produk”, “HPP Dasar”, atau “BOM” di teks UI, serta nol orb/gradient/glass login dan nol impor URL font. |
| Recheck Sesi 32 | ESLint 0/0, TypeScript lulus, Prisma valid dan 10 migrasi up to date, 72 test lulus tanpa skip, serta build 23 route lulus. UAT, restore backup, CI, dan tujuh gap integrasi tidak diklaim selesai. |
| Pengukuran TASK-034 | Checkout tiga item menghasilkan **1 kueri produk di luar transaksi**; payload checkout turun 1.075 → 468 byte dan riwayat 2.261 → 1.233 byte. Smoke `/admin/sales` terautentikasi merespons 200. |
| Uji TASK-040 | Uji DTO mempertahankan digit Decimal 2/3/4 desimal. Produk, Bahan Baku, Pembelian, dan POS merespons 200 serta merender data aktual tanpa hydration/runtime error. |
| Rotasi Supabase | Pada saat rotasi password, `DATABASE_URL`/`DIRECT_URL` lokal diperbarui; **8 migrasi saat itu** dan query read-only (2 user, 5 produk) berhasil tanpa mutasi data. Status terbaru sekarang 10 migrasi up to date. |
| Audit kontras TASK-029 | **27/27** kombinasi tinta/merek/semantik pada tiga permukaan lulus ≥4,5:1; minimum 4,67:1. Batas kontrol pada kertas 3,08:1; teks kertas pada brand 7,80:1. |
| Uji browser TASK-028 | Login diverifikasi pada 1440, 768, 375, dan 320 px; POS state kosong/terisi dan shell admin diperiksa pada 1440 px. Tidak ada scroll horizontal pada viewport yang diuji, label tombol publik tidak terbungkus, kontrol 44–48 px, computed font benar-benar Inter/EB Garamond/IBM Plex Mono, serta gradient dan shadow 0. Preview QA sementara sudah dihapus. |
| Uji browser TASK-033 | Login 1440/375 px, dashboard dan produk 1280 px, POS 1440/768/375 px, serta shell admin 768 px diperiksa dengan komponen/data aktual. Tidak ada body overflow horizontal; POS mobile tetap dua kolom dan kontrol kasir ≥44 px. |
| Foto menu TASK-033 | Migrasi, fallback, form admin, validasi server, dan alur Storage tersedia. Bucket publik `menu-images` terverifikasi; upload/read/delete objek sementara lulus dan fixture dihapus. |
| Uji browser TASK-041 | Modal kategori, filter admin, pengaman kategori terpakai, serta filter POS diperiksa dengan data aktual. Admin dan POS tidak memiliki body overflow horizontal pada 375, 768, dan 1440 px. |
| Uji browser TASK-025 | Laporan laba, persediaan, dan audit lulus pada 1440/768/375 px tanpa body overflow. Tabel sempit menggulir di pembungkusnya; filter, empty/error state, detail audit, dua CSV, dan tombol cetak berfungsi. Dialog cetak native tidak diekspos panel automasi, sehingga layout cetak diverifikasi dari struktur print-only, logo vertikal, aturan `@media print`, dan pemanggilan `window.print()`. |
| Smoke browser TASK-024 | Proteksi `/admin/dashboard` tanpa sesi mengarah ke `/login`; pengujian UI admin terautentikasi kemudian dilengkapi pada TASK-025. |
| Audit aksesibilitas form | Audit statis seluruh `input`, `select`, `textarea`, label, state galat, live region, tombol ikon, dan emoji dekoratif lulus; uji pembaca layar tetap belum dilakukan sehingga tidak ada klaim kepatuhan WCAG. |
| Uji browser | Modal edit produk dari TASK-032 lulus semantik dialog, fokus awal, trap Tab/Shift+Tab, Escape, pengembalian fokus, dan pemulihan scroll latar. |

### Titik lanjut

TASK-039 selesai. TASK-035 tetap menunggu keputusan **D-10** tentang tooling/CI.
TASK-001 tetap sebagian sesuai keputusan menunda deploy dan pembersihan riwayat Git.
Pertahankan 72 test, full lint, dan build tetap hijau.
Gunakan `docs/testing-checklist.md` untuk smoke manual, UAT, dan gate pradeploy.

---

## 0. METODOLOGI & BATAS KEABSAHAN AUDIT

Bagian ini ditulis lebih dulu agar tidak ada klaim yang menyesatkan. Setiap pernyataan
dalam dokumen ini memiliki salah satu dari dua status:

| Tanda | Arti |
| :--- | :--- |
| **[TERVERIFIKASI]** | Dibuktikan dengan menjalankan perintah atau membaca baris kode yang dikutip. |
| **[BELUM DIUJI]** | Kesimpulan dari pembacaan kode, **belum** dibuktikan dengan menjalankan aplikasi. |

### Yang benar-benar dijalankan saat audit ini

| Perintah | Hasil |
| :--- | :--- |
| `npx tsc --noEmit` | **Lulus**, exit code 0. |
| `npm run build` | **Lulus.** Next.js 16.2.11 (Turbopack), compile 8,0 detik, 12 halaman ter-generate. Disertai satu peringatan deprecation (lihat E2). |
| `npx eslint .` | **GAGAL.** 3 error, 21 warning (lihat E1). |
| `npx prisma validate` atas skema §5.15 README | **Valid.** Skema target dapat dimigrasikan. |
| `git ls-files` | Memeriksa apakah berkas kredensial ikut terlacak. Dasar temuan S1. |
| Pembacaan 100% berkas di `src/`, `prisma/`, dan `README.md` | Dasar seluruh temuan di bawah. |

**Acuan audit adalah berkas kerja lokal**, yaitu isi direktori `src/`, `prisma/`, dan
berkas konfigurasi apa adanya di diska. Status *commit* tidak dijadikan ukuran, karena
tidak menentukan kesesuaian kode terhadap dokumen desain. Riwayat Git hanya diperiksa untuk
satu hal: memastikan tidak ada kredensial yang ikut terbawa (S1).

### Yang TIDAK dilakukan — karena itu tidak boleh diklaim di skripsi

* **Aplikasi tidak dijalankan (`npm run dev` tidak dieksekusi).** Tidak ada satu pun alur
  yang diuji *end-to-end* terhadap basis data Supabase.
* Tidak ada login, *checkout* kasir, atau input pembelian yang benar-benar dicoba.
* Tidak ada pengujian beban, pengujian konkurensi, maupun pengujian pada peramban atau
  perangkat nyata.
* Angka pada dashboard belum pernah dicocokkan dengan perhitungan manual.

> **Konsekuensi:** kalimat "aplikasi berjalan *end-to-end*" **belum dapat dipakai** sampai
> tersedia bukti pengujian. Yang sah diklaim hari ini hanyalah: *kode berhasil dikompilasi
> menjadi build produksi tanpa galat TypeScript.*

### Hubungan dengan dokumen lain

Setelah checkpoint v4.0, workflow audit Phase 0–11 dijalankan dan menghasilkan sebelas dokumen di `docs/execute-step/`. Pembagian perannya:

| Dokumen | Isi |
| :--- | :--- |
| **checkpoint.md** (dokumen ini) | Ringkasan implementasi terbaru di bagian awal, diikuti snapshot audit historis terhadap `README.md` |
| `execute-step/phase1.md`–`phase9.md` | Audit per dimensi: planning, implementasi, visual, UX, aksesibilitas, performa, keamanan, konten, technical debt |
| `execute-step/phase10.md` | Sintesis dan priority matrix |
| `execute-step/phase11.md` | **Peta jalan implementasi** — 41 task dengan dependency dan acceptance criteria |
| `design-direction.md` | Arah visual dan design token, diturunkan dari logo |

Versi 5.0 menyerap temuan antarmuka dan aksesibilitas dari Phase 3–5 yang belum ada di v4.0 (§11), serta mempertajam satu temuan keamanan (S5).

### Perubahan dari audit sebelumnya

Dokumen desain kini memuat kebijakan akuntansi (§3.1), kebijakan presisi dan zona waktu
(§3.2–3.3), daftar layar (§2.2), kebutuhan non-fungsional (§8), strategi pengujian (§9),
dan panduan *deployment* (§10). Audit versi ini mengukur kode terhadap seluruh ketentuan
tersebut.

**Berkas kode belum berubah sejak audit sebelumnya.** [TERVERIFIKASI] Perbandingan berkas
kerja menunjukkan hanya `README.md` yang termodifikasi. Karena cakupan spesifikasi bertambah
sementara kode tetap, angka cakupan pada §1 turun dibandingkan audit sebelumnya. Penurunan
ini mencerminkan bertambahnya ketentuan yang diukur, bukan berkurangnya fungsi yang sudah
ada.

---

## 1. RINGKASAN STATUS

Aplikasi berada pada tahap **kerangka fungsional (*functional skeleton*)**. Seluruh modul
inti sudah memiliki halaman dan tersambung ke basis data melalui Prisma. Namun tiga logika
yang menjadi nilai jual skripsi — *average costing* dinamis, kartu stok keluar, dan rumus
laba bersih — belum terimplementasi, dan terdapat dua masalah keamanan yang harus
ditangani segera.

| Area | Acuan | Cakupan | Keterangan |
| :--- | :--- | :---: | :--- |
| Model basis data | §5 | **10 / 12** | `cashier_shifts` dan `audit_logs` belum ada. |
| Kolom basis data | §5 | **−27 kolom** | 27 kolom wajib belum ada, tersebar di 8 tabel. |
| Tipe enumerasi | §5.1 | **5 / 9** | 4 enum belum ada; `StockSource` kurang 2 nilai. |
| Constraint & indeks | §5.3–5.14 | **3 / 39** | Hanya 3 *unique index*. Tidak ada satu pun `CHECK` atau indeks laporan. |
| Layar aplikasi | §2.2 | **3 penuh / 5 sebagian / 12 belum** | Dari 20 layar yang dispesifikasikan. |
| Fitur operasional POS | §7 | **2 penuh / 2 sebagian / 5 belum** | Dari 9 ketentuan. |
| Kebijakan akuntansi | §3 | **1 / 5** | Snapshot terpasang secara struktur. Average costing, laba bersih, zona waktu, dan presisi uang belum. |
| Lapisan otorisasi | §4.3 | **2 / 3** | Lapisan Server Action belum ada. |
| Kebutuhan non-fungsional | §8 | **sebagian kecil** | Rinci pada §9 dokumen ini. |
| Antarmuka & aksesibilitas | §8.6 | **lihat §11** | Nol `@media` query, kontras token gagal AA, 21 dari 23 field tanpa label. |
| Pengujian otomatis | §9 | **0 / 25** | Belum ada satu pun kasus uji. |

**Kesimpulan yang jujur:** modul yang sudah berjalan menutup alur dasar POS, tetapi
sisanya justru memuat logika akuntansi yang menjadi inti skripsi. Pekerjaan terbesar ada
pada migrasi skema (§6 dokumen ini) — hampir seluruh fitur yang belum ada bergantung
padanya.

---

## 2. YANG SUDAH TERBUKTI BEKERJA DI TINGKAT KODE

1. **[TERVERIFIKASI]** *Build* produksi lulus dengan 10 rute: `/`, `/login`, `/cashier`,
   dan `/admin/{dashboard,ingredients,products,purchases,expenses,sales}`.
2. **[TERVERIFIKASI]** Skema Prisma target pada README §5.15 lolos `prisma validate`,
   sehingga dapat langsung dijadikan dasar migrasi.
3. **[BELUM DIUJI]** Autentikasi mengikuti praktik yang benar: `bcrypt.compare`
   (`src/app/login/actions.ts:23`), JWT HS256 via `jose` dengan masa berlaku 8 jam
   (`src/lib/auth.ts:15-21`), cookie `httpOnly` + `secure` di produksi + `sameSite: lax`
   (`src/app/login/actions.ts:35-41`). Sesuai ketentuan §8.1.
4. **[BELUM DIUJI]** Dua dari tiga lapisan otorisasi §4.3 sudah terpasang: pemeriksaan
   tingkat *request* di `src/middleware.ts` dan tingkat halaman di
   `src/app/admin/layout.tsx:18-21` serta `src/app/cashier/layout.tsx:6`.
5. **[BELUM DIUJI]** **Alur pembelian stok adalah modul yang paling lengkap.**
   `src/app/admin/actions.ts:84-119` membungkus semuanya dalam `$transaction`: membuat
   `purchases` + `purchase_details`, menaikkan `current_stock`, dan menulis baris
   `stock_transactions` bertipe `in` dengan `unitCost`, `source: 'purchase'`, serta
   `referenceId`. Kerangka ini tinggal dilengkapi pembaruan `stock_value` dan
   `average_cost` sesuai §3.6 dan §6.4.
6. **[BELUM DIUJI]** *Checkout* kasir sudah atomik (`prisma.$transaction`,
   `src/app/cashier/actions.ts:35`) dan sudah menyimpan `hppSnapshot` serta
   `grossProfitSnapshot` per baris. Mekanisme *snapshot* §3.7 sudah benar secara struktur;
   hanya nilainya yang belum benar (lihat A2).
7. **[BELUM DIUJI]** Deteksi stok menipis (§7.1) memakai perbandingan antar-kolom yang
   benar (`prisma.ingredient.fields.minimumStock`,
   `src/app/admin/dashboard/page.tsx:35`), bukan konstanta *hardcode*.
8. **[BELUM DIUJI]** Validasi stok tingkat antarmuka (§7.2 tingkat 1) sudah
   memperhitungkan item yang berada di keranjang namun belum di-*checkout*
   (`src/app/cashier/CashierPOS.tsx:43-49`).

---

## 3. TEMUAN KRITIS — KEAMANAN (TANGANI HARI INI)

### 🔴 S1. Password basis data tersimpan sebagai teks polos di dalam proyek

* **Ketentuan §8.1:** seluruh kredensial hanya boleh berada pada variabel lingkungan;
  repositori hanya memuat `.env.example` tanpa nilai.
* **[TERVERIFIKASI]** Berkas `supabaseConnect.txt` berada di akar proyek dan memuat
  *connection string* Supabase lengkap dengan **password basis data dalam bentuk teks
  polos**, ditambah URL proyek dan *publishable key*. Kredensial di luar variabel
  lingkungan sudah melanggar §8.1 sejak dari berkas lokalnya.
* **[TERVERIFIKASI] Pemberat:** `git ls-files` menunjukkan berkas ini **ikut terlacak Git**
  dan sudah masuk *commit* `da342e9`.
* **Dampak:** siapa pun yang memperoleh salinan proyek memegang akses tulis penuh ke basis
  data produksi. Menghapus berkasnya saja **tidak cukup**, karena password tetap tersimpan
  di riwayat *commit*.
* **Tindakan:**
  1. Rotasi password basis data di dashboard Supabase **sekarang**, sebelum hal lain.
  2. `git rm --cached supabaseConnect.txt`, lalu tambahkan ke `.gitignore`.
  3. Bersihkan riwayat (`git filter-repo`, atau — karena baru 4 *commit* — bangun ulang
     riwayat dari awal) sebelum repositori di-*push* ke mana pun.
  4. Buat `.env.example` sesuai daftar variabel §10.2.

### 🔴 S2. `JWT_SECRET` tidak diset — sistem memakai kunci *hardcode*

* **Ketentuan §8.1:** `JWT_SECRET` minimal 32 byte acak, dan **aplikasi wajib gagal saat
  *start*** bila variabel tidak tersedia. Nilai cadangan di dalam kode dilarang.
* **[TERVERIFIKASI]** `.env` hanya memuat `DATABASE_URL` dan `DIRECT_URL`. Tidak ada
  `JWT_SECRET`.
* **[TERVERIFIKASI]** `src/lib/auth.ts:5-7` menyediakan nilai cadangan:
  ```ts
  const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET ?? "merbaoe-pos-secret-key-2024-fallback"
  );
  ```
* **Dampak:** seluruh token sesi ditandatangani dengan string yang tertulis di dalam kode.
  Siapa pun yang membaca repositori dapat menempa cookie sesi dengan `role: "admin"` dan
  masuk sebagai *owner* tanpa password.
* **Tindakan:** bangkitkan `JWT_SECRET` dengan `openssl rand -base64 32`, isikan di `.env`
  dan pada *environment variable* Vercel, lalu **hapus nilai cadangannya**.

### ✅ S3. Lapisan otorisasi ketiga belum ada pada Server Action — **SELESAI (TASK-004)**

* **Ketentuan §4.3:** setiap Server Action **wajib** memanggil `requireAdmin()` atau
  `requireAuth()` pada baris pertama, karena Server Action dipanggil berdasarkan identitas
  aksi — bukan alamat halaman — sehingga tidak terjangkau oleh lapisan 1 dan 2.
* **[TERVERIFIKASI]** Berkas `src/lib/guard.ts` belum ada. Di `src/app/admin/actions.ts`,
  tujuh aksi **tidak memanggil `getSession()` sama sekali**: `createIngredient` (baris 8),
  `updateIngredient` (21), `deleteIngredient` (34), `createProduct` (41),
  `toggleProductActive` (54), `deleteProduct` (61), dan `deleteExpense` (152). Dua aksi
  lain — `createPurchase` (68) dan `createExpense` (127) — memeriksa sesi tetapi **tidak
  memeriksa peran**, sehingga akun kasir tetap lolos.
* **Tindakan:** buat `src/lib/guard.ts` berisi `requireAuth()` dan `requireAdmin()`, lalu
  panggil pada baris pertama **setiap** Server Action.

### ✅ S5. Kuantitas tidak divalidasi — nilai negatif menaikkan stok — **SELESAI (TASK-006)**

* **Ketentuan §8.1:** seluruh masukan Server Action divalidasi dengan skema `zod`; kuantitas tidak boleh negatif.
* **[TERVERIFIKASI]** `submitSale` mem-*parse* `items` dari JSON kiriman klien (`cashier/actions.ts:24`) dan tidak pernah memvalidasi `quantity`. Telusuran untuk `quantity: -5` pada produk ber-resep:

  | Baris | Ekspresi | Hasil |
  | :--- | :--- | :--- |
  | `:66` | `neededTotal = 18 × (−5)` | `−90` |
  | `:67` | `currentStock (2000) < −90` ? | **false** → validasi lolos |
  | `:77-80` | `currentStock: { decrement: −90 }` | stok **naik** menjadi 2090 |
  | `:84` | `subtotal = 22000 × (−5)` | `−110000` |

* **Dampak:** sesi kasir yang mengirim permintaan buatan dapat menaikkan stok bahan baku tanpa pembelian, dan mencatat penjualan bernilai negatif yang mengurangi total pendapatan serta laba pada laporan owner. Keduanya merusak justru angka yang menjadi tujuan sistem.
* **Mengapa belum tertangkap:** README §5.11 mensyaratkan `CHECK (quantity > 0)` dan §5.3 `CHECK (current_stock >= 0)`. Nol dari 17 `CHECK` tersebut ada di migrasi (§6.5).
* **Tindakan:** validasi `zod` **dan** batasan `CHECK` — keduanya disyaratkan README dan saling melengkapi.

### 🟡 S4. Pembatasan percobaan login belum ada

* **Ketentuan §8.1:** maksimal 5 kegagalan per *username* dalam 15 menit, disertai jeda
  bertingkat.
* **[TERVERIFIKASI]** `loginAction` tidak memiliki pembatasan, jeda, maupun penguncian
  akun. Dengan password bawaan `admin123`, *brute force* menjadi sepele.
* **Catatan:** perlindungan CSRF sudah terpenuhi melalui pemeriksaan asal permintaan bawaan
  Next.js Server Actions, sesuai §8.1.

---

## 4. TEMUAN KRITIS — LOGIKA AKUNTANSI

### ✅ A1. Rumus laba bersih tidak sesuai kebijakan akuntansi — **SELESAI (TASK-007)**

* **Ketentuan §3.1.A:** pembelian bahan baku adalah penambahan persediaan, **bukan beban
  periode**, dan tidak boleh dikurangkan dari laba dalam bentuk apa pun.
* **Ketentuan §3.8:** Laba Bersih = Laba Kotor − Total OPEX, dengan OPEX bersumber dari
  tabel `operational_expenses`.
* **[TERVERIFIKASI]** `src/app/admin/dashboard/page.tsx:44-45`:
  ```ts
  const purchasesMonthTotal = Number(purchasesMonth._sum.totalAmount ?? 0);
  const netProfitMonth = grossProfitMonth - purchasesMonthTotal;
  ```
  Label kartu statistik pun mengikuti: `"Laba Kotor − Pembelian Bahan"` (baris 57).
* **Dua akibat sekaligus:**
  1. **Biaya bahan terhitung dua kali.** Laba kotor sudah dikurangi HPP, lalu dikurangi
     lagi dengan total belanja supplier.
  2. **Tabel `operational_expenses` tidak pernah dipakai.** Data listrik, sewa, dan
     pemeliharaan yang diinput di `/admin/expenses` tidak memengaruhi laba bersih.
* **Status:** angka "Laba Bersih Bulan Ini" yang tampil saat ini belum memiliki makna
  akuntansi dan belum dapat dijadikan hasil pada bab pembahasan.

### 🔴 A2. *Average costing* dinamis belum terimplementasi

* **Ketentuan §3.5.B dan §3.6:** produk ber-BOM wajib memakai
  HPP = Σ(takaran × `average_cost`).
* **[TERVERIFIKASI]** `src/app/cashier/actions.ts:61`:
  ```ts
  let hpp = Number(product.baseHpp);
  ```
  Blok `if (product.hasRecipe ...)` pada baris 63-82 **hanya** memvalidasi kecukupan stok
  lalu mengurangi stok. Variabel `hpp` tidak pernah ditulis ulang.
* **Bukti independen:** ESLint melaporkan
  `61:13 error 'hpp' is never reassigned. Use 'const' instead`.
* **Dampak:** seluruh menu ber-resep memakai HPP statis. Fluktuasi harga supplier tidak
  memengaruhi HPP, sehingga fitur yang menjadi klaim utama skripsi belum berfungsi.
* **Prasyarat perbaikan:** kolom `stock_value` dan `average_cost` (§5.3) harus dibuat lebih
  dahulu — lihat DB-06 pada §6 dokumen ini.

### 🔴 A3. Mutasi stok keluar tidak dicatat saat penjualan

* **Ketentuan §7.3 dan §6.3:** setiap perubahan stok **wajib** menghasilkan satu baris
  `stock_transactions` di dalam transaksi basis data yang sama. Tidak ada pengecualian.
* **[TERVERIFIKASI]** `src/app/cashier/actions.ts:74-81` hanya menjalankan
  `tx.ingredient.update({ ... decrement ... })`. Tidak ada `tx.stockTransaction.create`
  di seluruh berkas.
* **Dampak:** kartu stok hanya berisi baris masuk. Saldo `current_stock` tidak dapat
  direkonsiliasi dari riwayat mutasi, sehingga *invariant* I-03 dan I-08 (§9.4) belum dapat
  diuji.

### ✅ A4. Model DPP, pajak, dan kembalian — **SELESAI (TASK-014)**

* **Ketentuan §3.4:** urutan Subtotal → Diskon → DPP → Pajak → Total Dibayar, dengan
  **Laba Kotor = DPP − Total HPP** dan pajak dikeluarkan dari laba (§3.1.C).
* **[SELESAI]** `calculateTransactionTotals()` menghitung seluruh tahapan memakai Decimal;
  checkout menyimpan semua nilai secara terpisah, menolak tunai kurang, dan mengembalikan
  angka database ke panel kasir. U-07/U-08 serta constraint aritmetika database lulus.

### ✅ A5. Zona waktu server menentukan batas "hari ini" — **SELESAI (TASK-005)**

* **Ketentuan §3.3:** seluruh batas periode dihitung pada `Asia/Jakarta`.
* **[TERVERIFIKASI]** `src/app/admin/dashboard/page.tsx:13-15` memakai `new Date()` polos,
  dan `src/lib/period.ts` (§4.2) belum ada. Seluruh kolom waktu pada skema masih
  `TIMESTAMP(3)`, bukan `TIMESTAMPTZ`.
* **Dampak:** di Vercel, server berjalan pada UTC sehingga "Pendapatan Hari Ini" berganti
  hari pada pukul **07:00 WIB**. Transaksi malam hari — jam operasional paling ramai —
  masuk ke tanggal yang keliru. Di komputer lokal masalah ini tidak terlihat karena zona
  waktunya kebetulan sudah WIB, sehingga baru muncul setelah *deploy*.

### ✅ A6. Total pengeluaran bulan berjalan dihitung dari 50 baris terakhir — **SELESAI (TASK-008)**

* **Ketentuan §8.2:** seluruh penjumlahan finansial wajib menggunakan agregasi basis data,
  bukan penjumlahan di memori atas hasil kueri yang terbatas `take`.
* **[TERVERIFIKASI]** `src/app/admin/expenses/page.tsx:15-23` mengambil `take: 50` lalu
  memfilter bulan berjalan **di memori**. Begitu jumlah pengeluaran melewati 50 baris,
  angka "Total Pengeluaran Bulan Ini" menjadi lebih kecil dari yang sebenarnya, tanpa
  peringatan apa pun.

### ✅ A7. Label total pada halaman penjualan menyesatkan — **SELESAI (TASK-008)**

* **[TERVERIFIKASI]** `src/app/admin/sales/page.tsx:9,16-17` menjumlahkan hanya 100 baris
  hasil `take: 100`, tetapi kartunya berlabel "Total Pendapatan" dan "Total Laba Kotor"
  tanpa keterangan periode. Melanggar §8.2 dan §8.5.

### 🟡 A8. Uang diproses sebagai *floating point*

* **Ketentuan §3.2:** seluruh perhitungan finansial menggunakan tipe `Decimal` Prisma;
  konversi ke `number` hanya diperbolehkan pada lapisan tampilan.
* **[TERVERIFIKASI]** Setiap kolom `DECIMAL` dikonversi `Number(...)` sebelum dihitung, di
  seluruh Server Action dan halaman. Berkas `src/lib/money.ts` (§4.2) belum ada.

---

## 5. TEMUAN — INTEGRITAS DATA

> **Status terkini (25 Agustus 2026): D4 dan D7 sudah ditangani.** Produk dapat
> diubah, sedangkan hard delete produk/bahan sudah diganti status aktif/nonaktif.
> Recipe dan riwayat penjualan terverifikasi tetap utuh. Baris audit di bawah
> dipertahankan sebagai snapshot kondisi awal; bukti terbaru ada di
> `docs/progress.md` Sesi 11.

| Kode | Temuan | Acuan | Dampak |
| :--- | :--- | :--- | :--- |
| **D1** | **Balapan stok (*oversell*).** Pengecekan kecukupan stok (`cashier/actions.ts:65-72`) dan pengurangan stok (75-81) adalah dua statement terpisah tanpa `SELECT ... FOR UPDATE`, pada isolasi bawaan *Read Committed*. Batasan `CHECK (current_stock >= 0)` juga belum ada. | §7.2 tingkat 2, §5.3 | Dua kasir yang *checkout* bersamaan dapat sama-sama lolos validasi sehingga stok menjadi negatif tanpa terdeteksi. |
| **D2** | **Nomor invoice rawan tabrakan.** `` `TRX-${Date.now()}` `` (`cashier/actions.ts:101`) melawan *unique index* `sales_invoice_number_key`. *Sequence* `sales_invoice_seq` belum dibuat. | §5.10 | Dua *checkout* dalam milidetik yang sama gagal dengan pesan galat Prisma mentah. |
| **D3** | **Nomor invoice pada struk bukan nomor yang tersimpan.** Klien membangkitkan `` `TRX-${Date.now()}` `` sendiri (`CashierPOS.tsx:112`) setelah aksi selesai, sehingga nilainya berbeda dari yang dibuat server. | §5.10, §6.3 | Nomor yang dilihat kasir tidak dapat ditemukan di riwayat penjualan. Menjadi fatal begitu fitur cetak struk dibangun di atas nilai ini. |
| **D4** 🟡 | **Penanganan galat hapus selesai pada TASK-021; soft delete belum.** `deleteIngredient` dan `deleteProduct` kini memetakan kegagalan FK ke pesan yang menjelaskan data masih digunakan, tanpa menampilkan galat Prisma mentah. Kolom `ingredients.is_active` untuk *soft delete* tetap menjadi TASK-016. | §5.3, §7.4 | Kegagalan tidak lagi senyap; penggantian hapus keras dengan soft delete belum dikerjakan. |
| **D5** | **Tidak ada indeks untuk kueri laporan.** Migrasi hanya membuat 3 *unique index*. Prisma tidak membuat indeks otomatis untuk kolom *foreign key* di PostgreSQL. | §5.14 | 17 indeks yang dispesifikasikan pada §5.14 belum ada. Laporan periodik akan melakukan *sequential scan*. |
| **D6** 🟢 | **Void, penyesuaian stok, dan waste selesai.** Void memakai nilai historis; opname/waste memakai `average_cost` berjalan, row lock, kartu stok append-only, serta beban otomatis tertaut. | §7.4, §7.5 | Kesalahan transaksi, selisih fisik, dan bahan rusak dapat dikoreksi serta ditelusuri tanpa merusak harga rata-rata. |
| **D7** | **Produk tidak dapat diubah sama sekali.** [TERVERIFIKASI] Tidak ada Server Action `updateProduct` di seluruh `src/`. Aksi yang tersedia hanya `createProduct`, `toggleProductActive`, dan `deleteProduct`. | §2.2 L-06 | Harga jual dan `base_hpp` tidak dapat diperbarui dari aplikasi. Satu-satunya cara mengubah harga adalah menghapus menu — yang akan gagal bila menu pernah terjual (D4). |

---

## 6. GAP SKEMA BASIS DATA (§5 README)

Ini adalah pekerjaan terbesar. Hampir seluruh fitur yang belum ada bergantung pada migrasi
ini, sehingga migrasi skema perlu didahulukan.

### 6.1 Model yang belum ada

| Kode | Model | Acuan | Kegunaan |
| :--- | :--- | :--- | :--- |
| **DB-01** | `cashier_shifts` | §5.9 | Manajemen shift kasir dan rekonsiliasi kas (§7.6). |
| **DB-02** | `audit_logs` | §5.13 | Jejak audit perubahan data master (§8.4). |

### 6.2 Tipe enumerasi yang belum ada

| Kode | Enum | Acuan |
| :--- | :--- | :--- |
| **DB-03** | `ReferenceType`, `SaleStatus`, `ShiftStatus`, `HppSource` | §5.1 |
| **DB-04** | `StockSource` kurang nilai `sale_void` dan `opening` | §5.1, §7.4, §7.5 |

### 6.3 Kolom yang belum ada — 27 kolom pada 8 tabel

| Kode | Tabel | Kolom yang belum ada | Acuan | Menghambat |
| :--- | :--- | :--- | :--- | :--- |
| **DB-05** | `users` | `is_active`, `last_login_at` | §5.2 | Manajemen pengguna (L-14). |
| **DB-06** | `ingredients` | `stock_value`, `average_cost`, `is_active` | §5.3 | **Average costing (A2)**, laporan persediaan, *soft delete* (D4). |
| **DB-07** | `stock_transactions` | `total_cost`, `balance_after`, `value_after`, `reference_type`, `notes`, `created_by` | §5.6 | Kartu stok dengan saldo berjalan (L-04), penelusuran referensi, pertanggungjawaban mutasi. |
| **DB-08** | `sales` | `subtotal_amount`, `discount_amount`, `net_amount`, `tax_rate`, `tax_amount`, `cash_received`, `change_amount`, `status`, `void_reason`, `voided_by`, `voided_at`, `shift_id` | §5.10 | **Model DPP (A4)**, diskon & pajak (§7.8), void (§7.4), shift (§7.6). |
| **DB-09** | `sales_details` | `product_name`, `hpp_source` | §5.11 | Struk historis yang tetap benar, penelusuran asal HPP dan *fallback* (§3.6.C). |
| **DB-10** | `purchases` | `notes` | §5.7 | Keterangan pembelian. |
| **DB-11** | `purchase_details` | `subtotal` | §5.8 | Rincian nilai per item. |

### 6.4 Presisi tipe data belum sesuai

| Kode | Kondisi saat ini | Ketentuan | Acuan |
| :--- | :--- | :--- | :--- |
| **DB-12** | Seluruh nominal `DECIMAL(10,2)` | Nominal `DECIMAL(14,2)`, harga per satuan `DECIMAL(14,4)`, kuantitas `DECIMAL(14,3)` | §3.2, §5 |
| **DB-13** | Seluruh kolom waktu `TIMESTAMP(3)` | `TIMESTAMPTZ` | §3.3, §5 |

Ketentuan `DECIMAL(14,4)` pada `average_cost` bukan detail kosmetik: bahan baku dihitung
per gram atau mililiter, sehingga harga per satuan kerap bernilai pecahan kecil. Presisi 2
desimal akan menimbulkan akumulasi galat pada HPP.

### 6.5 Constraint dan indeks

| Kode | Belum ada | Jumlah | Acuan |
| :--- | :--- | :---: | :--- |
| **DB-14** | Batasan `CHECK` | 17 | §5.3–5.12 |
| **DB-15** | `UNIQUE (product_id, ingredient_id)` pada `recipes` | 1 | §5.5 |
| **DB-16** | *Partial unique index* satu shift terbuka per kasir | 1 | §5.9 |
| **DB-17** | Indeks laporan | 17 | §5.14 |
| **DB-18** | *Sequence* `sales_invoice_seq` | 1 | §5.10 |

Lima batasan `CHECK` pada tabel `sales` (§5.10) sangat berarti: empat di antaranya memaksa
rumus §3.4 dipatuhi pada tingkat basis data, sehingga baris yang melanggar rumus laba tidak akan
pernah tersimpan sekalipun terdapat kekeliruan pada kode aplikasi. Batasan ini akan
menangkap kelas kesalahan seperti A1 secara otomatis.

### 6.6 Data awal (*seed*)

**[TERVERIFIKASI]** `prisma/seed.ts:43-82` mengisi `currentStock` secara langsung **tanpa
membuat baris `purchases` atau `stock_transactions`**. Ketentuan §3.6.C mewajibkan saldo
pembukaan dicatat sebagai transaksi bertipe `opening` dengan harga perolehan yang
ditetapkan admin. Tanpa itu, `average_cost` bernilai nol dan seluruh menu ber-BOM akan
jatuh ke jalur *fallback*.

---

## 7. GAP LAYAR (§2.2 README)

| Kode | Rute | Status | Keterangan |
| :--- | :--- | :---: | :--- |
| **L-01** | `/login` | 🟢 Sesuai | Form dan penanganan pesan galat lengkap. |
| **L-02** | `/admin/dashboard` | 🟡 Sebagian | Kartu ringkasan dan panel stok menipis ada. Belum: grafik tren 30 hari, OPEX, dan laba bersih yang benar (A1). |
| **L-03** | `/admin/ingredients` | 🟢 Sesuai | Master bahan, status stok, harga rata-rata, nilai persediaan, dan tautan kartu stok tersedia. |
| **L-04** | `/admin/ingredients/[id]/card` | 🟢 Sesuai | Mutasi kronologis, saldo/nilai setelah mutasi, pelaku, keterangan, dan filter tanggal tersedia. |
| **L-05** | `/admin/ingredients/adjustment` | 🟢 Sesuai | Opname fisik dan waste atomik; keterangan wajib dan beban waste dibuat otomatis. |
| **L-06** | `/admin/products` | 🟡 Sebagian | Tambah, aktif/nonaktif, dan hapus ada. Belum: form ubah (D7). |
| **L-07** | `/admin/products/[id]/recipe` | 🔴 Belum ada | **Penyusun resep BOM.** Lihat F1. |
| **L-08** | `/admin/purchases` | 🟢 Sesuai | Form multi-item dan riwayat lengkap. |
| **L-09** | `/admin/expenses` | 🟢 Sesuai | Form dan riwayat berkategori lengkap. |
| **L-10** | `/admin/sales` | 🟢 Sesuai | Tabel riwayat, pencarian, filter tanggal/kasir, pagination, agregat sesuai filter, dan aksi void admin tersedia. |
| **L-11** | `/admin/reports/profit` | 🔴 Belum ada | Laporan laba dengan filter rentang tanggal & ekspor. |
| **L-12** | `/admin/reports/inventory` | 🔴 Belum ada | Laporan nilai persediaan (§3.9). |
| **L-13** | `/admin/shifts` | 🟢 Sesuai | TASK-019/TASK-024: seluruh shift dapat dijangkau melalui pagination, pencarian, filter tanggal/status, rekonsiliasi kas, aktivitas, dan catatan. |
| **L-14** | `/admin/users` | 🔴 Belum ada | Kelola akun dan reset password. |
| **L-15** | `/admin/audit` | 🔴 Belum ada | Jejak audit. |
| **L-16** | `/cashier` | 🟢 Sesuai | Grid menu, pencarian, keranjang, diskon, pajak, metode bayar, kalkulator kembalian, dan blokir stok habis tersedia. |
| **L-17** | `/cashier/receipt/[id]` | 🔴 Belum ada | Struk termal siap cetak. |
| **L-18** | `/cashier/history` | 🟢 Sesuai | TASK-023: riwayat transaksi milik kasir, difilter permanen menurut `cashierId` sesi di server, dengan pencarian dan pagination. |
| **L-19** | `/cashier/stock` | 🟢 Sesuai | TASK-023: stok bahan aktif read-only dengan indikator Habis/Menipis/Aman dan tanpa data biaya atau kontrol mutasi. |
| **L-20** | `/cashier/shift` | 🟢 Sesuai | TASK-019: Admin/Kasir membuka shift miliknya, melihat ringkasan berjalan, dan menutup dengan hitung fisik. |

**Rekapitulasi:** 6 sesuai, 4 sebagian, 10 belum ada.

### Catatan khusus — F1: penyusun resep BOM

> **Status terkini (25 Agustus 2026): sudah ditangani.** Layar L-07 dan Server
> Action penyimpanan resep atomik sudah tersedia; bukti verifikasi ada di
> `docs/progress.md` Sesi 10. Uraian di bawah dipertahankan sebagai snapshot audit.

**[TERVERIFIKASI]** Ini gap fitur terbesar di luar skema. `createProduct` mengunci
`hasRecipe: false` (`admin/actions.ts:49`), dan **tidak ada satu pun Server Action untuk
membuat, mengubah, atau menghapus `Recipe`** di seluruh `src/`. Resep hanya dapat dibuat
melalui `prisma/seed.ts`. Akibatnya admin tidak akan pernah dapat membuat menu ber-BOM dari
aplikasi — padahal HPP dinamis adalah inti sistem ini. Ketentuan §5.4 juga mensyaratkan
`has_recipe` diperbarui otomatis saat resep pertama ditambahkan dan resep terakhir dihapus.

---

## 8. GAP FITUR OPERASIONAL POS (§7 README)

| Acuan | Fitur | Status | Keterangan |
| :--- | :--- | :---: | :--- |
| §7.1 | Safety Stock Alert | 🟢 Sesuai | Indikator merah tampil di dashboard dan tabel bahan baku. |
| §7.2 | Pencegahan transaksi saat stok kurang | 🟡 Sebagian | Tingkat 1 (antarmuka) sudah benar. Tingkat 2 (`SELECT ... FOR UPDATE` + `CHECK`) belum ada — lihat D1. |
| §7.3 | Kartu stok | 🟡 Sebagian | Mutasi `in` tercatat saat pembelian. Mutasi `out` saat penjualan belum (A3), dan kolom `balance_after`/`value_after`/`created_by` belum ada (DB-07). |
| §7.4 | Pembatalan transaksi (void) | 🟢 Sesuai | TASK-018: status + alasan/pelaku/waktu, reversal historis, kartu `sale_void`, audit, dan pengecualian laporan; I-07 lulus. |
| §7.5 | Penyesuaian stok & waste | 🔴 Belum ada | Memerlukan DB-04 dan L-05. |
| §7.6 | Manajemen shift kasir | 🟢 Sesuai | TASK-019: shift wajib/unik, setiap sale terikat shift, pengeluaran laci mengurangi expected cash, selisih wajib dijelaskan; I-10 lulus. |
| §7.7 | Cetak nota transaksi | 🔴 Belum ada | Setelah *checkout* hanya muncul kotak notifikasi (`CashierPOS.tsx:333-338`). |
| §7.8 | Diskon, pajak, kalkulator kembalian | 🟢 Sesuai | TASK-014 selesai; nominal cepat dan validasi tunai tersedia. |
| §7.9 | Fleksibilitas pembayaran | 🟢 Sesuai | Tunai, QRIS, dan transfer tercatat; hanya penjualan tunai completed yang menambah kas shift. |

---

## 9. GAP KEBUTUHAN NON-FUNGSIONAL (§8 README)

| Acuan | Ketentuan | Status |
| :--- | :--- | :--- |
| §8.1 | Pengelolaan rahasia | 🔴 S1 — kredensial tersimpan di berkas proyek, bukan variabel lingkungan, dan ikut terbawa riwayat Git; `.env.example` belum ada. |
| §8.1 | `JWT_SECRET` wajib, tanpa nilai cadangan | 🔴 S2. |
| §8.1 | `bcrypt` cost ≥ 10 | 🟢 Sesuai — `bcrypt.hash(..., 10)`. |
| §8.1 | Masa berlaku sesi 8 jam, cookie aman | 🟢 Sesuai. |
| §8.1 | Otorisasi tiga lapis | 🟠 S3 — lapisan Server Action belum ada. |
| §8.1 | Pembatasan percobaan login | 🔴 S4. |
| §8.1 | Validasi masukan dengan `zod` | 🔴 Belum ada. FormData di-*cast* `as string` lalu `parseFloat` tanpa batas; harga dan kuantitas negatif diterima. |
| §8.1 | Perlindungan CSRF | 🟢 Sesuai — bawaan Next.js Server Actions. |
| §8.2 | Agregasi di basis data | 🔴 A6, A7. |
| §8.2 | Target waktu muat & *checkout* | ⚪ Belum diukur — memerlukan pengujian runtime. |
| §8.3 | Prosedur cadangan & uji pemulihan | 🔴 Belum dijalankan. |
| §8.4 | Jejak audit bisnis | 🔴 `audit_logs` belum ada (DB-02). |
| §8.4 | `stock_transactions` sebagai jejak audit | 🟡 Sebagian — lihat A3. |
| §8.5 | Paginasi pada seluruh daftar | 🔴 Seluruh daftar memakai `take` tetap (30/50/100) tanpa navigasi halaman. |
| §8.6 | Responsivitas desktop/tablet/ponsel | 🔴 Nol `@media` query; lebar tetap pada sidebar, panel keranjang, dan enam grid. Rincian dan angkanya di **§11** (UI-05, UI-10). |

---

## 10. GAP PENGUJIAN (§9 README)

**[TERVERIFIKASI]** Tidak ada berkas uji dan tidak ada konfigurasi CI di dalam repositori.

| Acuan | Kelompok | Jumlah kasus | Terimplementasi |
| :--- | :--- | :---: | :---: |
| §9.1 | Pengujian unit (U-01 s.d. U-10) | 10 | 0 |
| §9.2 | Pengujian integrasi (I-01 s.d. I-10) | 10 | 0 |
| §9.3 | Pengujian penerimaan pengguna (A-01 s.d. A-05) | 5 | 0 |

Dua kasus paling menentukan adalah **I-03** (kecocokan nilai mutasi dengan snapshot HPP
untuk item ber-BOM) dan **I-08** (rekonsiliasi buku besar persediaan). Test TASK-012 dan
TASK-020 lulus untuk jalur BOM dan subset mutasi yang sudah ada. Kontrak Sesi 27 memperluas
regresi wajib TASK-025 agar mencakup HPP manual/fallback tanpa mutasi stok, opening dalam
periode, `sale_void/in`, serta snapshot awal/akhir historis.

Kriteria kelulusan §9.4 juga mensyaratkan `npm run lint` berjalan tanpa galat — saat ini
gagal (E1).

---

## 11. TEMUAN — ANTARMUKA, VISUAL & AKSESIBILITAS

Bersumber dari `execute-step/phase3.md`, `phase4.md`, dan `phase5.md`. Rasio kontras dihitung dengan formula WCAG 2.x dari nilai token sebenarnya; ukuran target sentuh dihitung dari nilai CSS. Keduanya **[TERVERIFIKASI]**. Tidak ada pengujian pembaca layar maupun pemindaian otomatis, sehingga **tidak ada klaim kepatuhan WCAG**.

### 11.1 Kontras — UI-01 · High ✅ SELESAI (TASK-029)

Palet gelap pada matriks di bawah adalah bukti audit awal dan kini sudah diganti.
Palet kertas aktual memiliki 27 kombinasi tinta/merek/semantik pada tiga permukaan;
seluruhnya lulus AA dengan minimum **4,67:1** (`--warning` pada `--paper-sunken`).
Batas kontrol mencapai **3,08:1** pada `--paper`, dan teks `--paper` pada isian
`--brand` mencapai **7,80:1**.

| Foreground | bg-base | bg-surface | bg-elevated | bg-card |
| :--- | ---: | ---: | ---: | ---: |
| `--text-primary` #f5f5f5 | 17,58 ✅ | 15,96 ✅ | 14,24 ✅ | 13,17 ✅ |
| `--text-secondary` #a3a3a3 | 7,60 ✅ | 6,90 ✅ | 6,15 ✅ | 5,69 ✅ |
| **`--text-muted` #6b6b6b** | **3,60 ❌** | **3,27 ❌** | **2,91 ❌** | **2,69 ❌** |
| **`--danger` #ef4444** | 5,09 ✅ | 4,62 ✅ | **4,13 ❌** | **3,81 ❌** |
| **`--info` #3b82f6** | 5,21 ✅ | 4,73 ✅ | **4,22 ❌** | **3,90 ❌** |

Ambang AA teks normal 4,5:1. `--text-muted` dipakai untuk `.stat-sub`, placeholder, timestamp tabel, dan teks empty state — teks kecil yang paling butuh kontras. Pada `.card` rasionya kurang dari 60% ambang.

### 11.2 Temuan lainnya

| Kode | Temuan | Evidence | Severity |
| :--- | :--- | :--- | :--- |
| **UI-02** ✅ | **SELESAI (TASK-030).** Angka uang tanpa tabular numerals. `grep -rn 'tabular' src/` tidak mengembalikan hasil. Seluruh nominal dirender dengan Inter proporsional, sehingga digit tidak sejajar antar baris. Untuk aplikasi yang seluruh nilainya uang dan tujuannya pemindaian cepat, ini cacat fungsional — bukan estetika. Inter mendukungnya; perbaikannya satu baris CSS. | `globals.css` | High |
| **UI-03** ✅ | **SELESAI (TASK-026 + TASK-031).** Seluruh kontrol form yang terlihat memiliki nama terprogram; komponen `Field` menghubungkan label, hint, galat server, dan galat lokal melalui `htmlFor`, `id`, `aria-invalid`, dan `aria-describedby`. | `src/components/Field.tsx`; seluruh form | High |
| **UI-04** ✅ | **SELESAI DAN DIVERIFIKASI (TASK-032).** Dialog bersama memakai `role="dialog"`, `aria-modal`, focus trap dua arah, Escape, fokus awal, pengembalian fokus, dan penguncian scroll latar. Perilaku keyboard diuji langsung pada modal edit produk. | `src/components/Modal.tsx` | High |
| **UI-05** ✅ | **SELESAI (TASK-028 + TASK-033).** Seluruh kontrol kasir memiliki target minimum 44px; POS teruji tanpa gulir horizontal pada 768/375px; sidebar menjadi rail di lebar menengah dan bar horizontal pada mobile. Reflow pada lebar ekuivalen pembesaran 200% tetap operasional. | `tokens.css`; `globals.css`; `CashierPOS.module.css`; `AdminSidebar.module.css` | High |
| **UI-06** | **Interaksi keyboard POS belum lengkap.** Modal kini menangani Escape dan focus trap, tetapi shortcut kasir serta dukungan pemindai barcode belum tersedia. | `src/components/Modal.tsx`; `CashierPOS.tsx` | High |
| **UI-07** ✅ | **SELESAI (TASK-026 + TASK-031).** Seluruh galat dan sukses aplikasi memakai komponen `Feedback`, dengan `role="alert"`/live assertive untuk galat dan `role="status"`/live polite untuk informasi atau sukses. | `src/components/Feedback.tsx`; seluruh pemanggil action | High |
| **UI-08** ✅ | **SELESAI (TASK-028).** Skala tipografi tujuh langkah, kisi spasi 4px, radius 3/4px, durasi motion, ukuran kontrol, dan peran font terpusat di `tokens.css`; audit TSX tidak menemukan nilai font/spasi inline ad-hoc tersisa. | `tokens.css`; `src/app/globals.css`; seluruh komponen | Medium |
| **UI-09** ✅ | **SELESAI (TASK-026).** Lapisan bersama kini menyediakan `DataTable`, `Modal`, `Field`, `EmptyState`, `Feedback`, dan `Pagination`; seluruh layar lama dimigrasikan sebelum layar baru dibangun. | `src/components/`; `src/app/**` | Medium |
| **UI-10** ✅ | **SELESAI (TASK-029 + TASK-028 + TASK-039).** Palet kertas/tinta/bata resmi sudah diterapkan; orb, glass, gradient, shadow, glow, animasi masuk, dan `transition: all` sudah dihapus. Login, admin, kasir, serta struk memakai token bentuk/gerak dan aset logo resmi; copy/persistensi final juga sudah dirapikan. | `tokens.css`; `globals.css`; `login/page.tsx`; `design-direction.md` §2, §4, §10 | Medium |

### 11.3 Yang sudah benar dan perlu dipertahankan

`<html lang="id">` · `<button>` asli untuk seluruh aksi, termasuk kartu produk kasir · `aria-hidden` pada elemen dekoratif login · `role="alert"` pada galat login · `overflow-x: auto` pada pembungkus tabel sehingga badan halaman tidak pernah tergulir horizontal · satuan `rem` sehingga penskalaan font peramban bekerja · **tidak ada informasi yang disampaikan hanya lewat warna** — status stok, metode pembayaran, dan bar stok tipis semuanya disertai teks atau angka.

### 11.4 Tindak lanjut

Arah perbaikan visual ditetapkan di `docs/design-direction.md`, yang menurunkan palet, skala, dan aturan komponen dari logo. Seluruh nilai di sana sudah diverifikasi lolos AA. Pekerjaannya masuk peta jalan sebagai TASK-026, TASK-028, TASK-029, TASK-030, TASK-031, TASK-032, dan TASK-033 pada `execute-step/phase11.md`.

---

## 12. TEMUAN — KUALITAS REKAYASA

| Kode | Temuan | Bukti |
| :--- | :--- | :--- |
| **E1** | **`npm run lint` gagal.** 3 error: `cashier/actions.ts:61` prefer-const (lihat A2) dan dua `require()` pada `test_db.js`. Ditambah 21 warning. ESLint juga memindai folder vendor `hallmark-main/` karena belum masuk `globalIgnores` di `eslint.config.mjs`. Melanggar §9.4. | **[TERVERIFIKASI]** keluaran `npx eslint .` |
| **E2** | **Konvensi `middleware` sudah usang di Next.js 16.** §4.3 menetapkan berkas `src/proxy.ts` dengan fungsi diekspor bernama `proxy`. **[TERVERIFIKASI]** yang ada saat ini adalah `src/middleware.ts`, dan *build* memunculkan peringatan. | Keluaran `npm run build` |
| **E3** | **Modul pendukung pada §4.2 belum ada.** **[TERVERIFIKASI]** `src/lib` hanya berisi `auth.ts` dan `prisma.ts`. Belum ada `guard.ts` (S3), `money.ts` (A8), `period.ts` (A5), dan `costing.ts` (A2). | `ls src/lib` |
| **E4** ✅ | **Kontrak tiga state selesai pada TASK-027.** Root, Admin, dan Kasir mempunyai `loading.tsx`, `error.tsx`, dan `not-found.tsx`; skeleton menjaga bentuk konten, error menyediakan retry, dan 404 menyediakan jalan kembali. | Struktur `src/app/` |
| **E5** ✅ | **Selesai pada TASK-021.** Seluruh Server Action memakai kontrak `ActionResult`; seluruh pemanggil memeriksa `ok`; validasi tampil dekat field; sukses tidak lagi ditampilkan tanpa syarat. | `src/lib/action-result.ts`; seluruh form klien |
| **E6** | Tailwind v4 di-*import* pada `globals.css:6`, namun hampir seluruh gaya ditulis sebagai `style={{}}` sebaris. Dua sistem gaya berjalan berdampingan tanpa aturan. | `globals.css` vs komponen |
| **E7** | Skrip *debug* `test_db.js` tertinggal di akar proyek dan turut membuat lint gagal. | Akar direktori |
| **E8** | Tidak ada jejak audit perubahan data master. Siapa yang mengubah harga jual atau stok minimum tidak tercatat. | DB-02 |
| **E9** | Tidak ada manajemen pengguna. Hanya dua akun hasil *seed* (`admin123` / `kasir123`), dan tidak ada cara mengganti password atau menambah kasir dari aplikasi. | L-14, DB-05 |

---

## 13. PETA JALAN

> **Acuan resmi pengerjaan adalah `execute-step/phase11.md`** — 41 task lengkap dengan
> dependency, *affected area*, *acceptance criteria*, dan *definition of done*. Bagian ini
> hanya ringkasan berurut untuk pembacaan cepat. Bila keduanya berbeda, `phase11.md` yang
> berlaku.

Urutan di bawah mengikuti ketergantungan teknis: keamanan lebih dulu, lalu migrasi skema,
karena hampir seluruh fitur yang belum ada bergantung pada kolom yang belum tersedia.

### Tahap 0 — Hari ini, sebelum menulis kode apa pun (± 1 jam)

1. **Rotasi password Supabase**, keluarkan `supabaseConnect.txt` dari Git beserta
   riwayatnya, dan buat `.env.example` sesuai §10.2. *(S1)*
2. **Set `JWT_SECRET` acak** di `.env` dan Vercel, lalu hapus nilai cadangan pada
   `src/lib/auth.ts`. *(S2)*

### Tahap 1 — Migrasi skema (± 1 hari)

3. Ganti `prisma/schema.prisma` dengan skema §5.15 README, lalu jalankan
   `prisma migrate dev`. Skema tersebut sudah lolos `prisma validate`.
   *(DB-01 s.d. DB-13)*
4. Tambahkan seluruh `CHECK`, indeks, *partial unique index*, dan *sequence* melalui
   migrasi SQL kustom. *(DB-14 s.d. DB-18)*
5. Perbarui `prisma/seed.ts` agar saldo pembukaan dicatat sebagai transaksi `opening`
   dengan harga perolehan, sehingga `average_cost` terdefinisi. *(§6.6)*

### Tahap 2 — Perbaikan yang membuat angka finansial benar (± 2 hari)

6. Buat `src/lib/guard.ts`, lalu panggil `requireAdmin()` pada setiap Server Action admin.
   *(S3)*
7. Buat `src/lib/period.ts` dan pin seluruh batas periode ke `Asia/Jakarta`. *(A5)*
8. Buat `src/lib/money.ts`, dan alihkan perhitungan finansial ke tipe `Decimal`. *(A8)*
9. Buat `src/lib/costing.ts`. Perbarui `stock_value` dan `average_cost` pada setiap
    pembelian (§6.4), dan hitung HPP dinamis saat *checkout* (§3.6). *(A2)*
10. Tulis baris `stock_transactions` bertipe `out` lengkap dengan `balance_after`,
    `value_after`, dan `created_by` di dalam transaksi *checkout*. *(A3)*
11. Terapkan model DPP pada *checkout*: subtotal, diskon, DPP, pajak, total, kembalian.
    *(A4)*
12. Perbaiki rumus laba bersih dashboard agar memakai `operationalExpense`. *(A1)*
13. Ganti seluruh penjumlahan di memori dengan agregasi basis data. *(A6, A7)*
14. Validasi `zod` pada seluruh Server Action — menutup kuantitas negatif yang dapat
    menaikkan stok, serta harga dan biaya negatif. *(S5, E6)*

### Tahap 3 — Fitur yang belum ada (± 4-6 hari)

15. **Penyusun resep BOM** (L-07) — prasyarat agar HPP dinamis benar-benar dapat dipakai.
16. Kunci baris dengan `SELECT ... FOR UPDATE` terurut `ingredient_id` saat *checkout*.
    *(D1, §7.2)*
17. Nomor invoice dari *sequence*, dan kembalikan nomor asli dari server ke antarmuka
    kasir. *(D2, D3)*
18. Form ubah produk dan *soft delete* untuk bahan baku serta produk. *(D4, D7)*
19. Kartu stok (L-04) dan penyesuaian stok/waste (L-05).
20. Shift kasir (L-13, L-20) dan riwayat kasir (L-18), stok hanya baca (L-19).
21. Struk termal (L-17) dan kalkulator kembalian.
22. Void transaksi pada L-10.
23. Laporan laba (L-11) dan laporan nilai persediaan (L-12).

### Tahap 4 — Kelas profesional (± 1 minggu)

24. Migrasi `middleware.ts` → `proxy.ts`. *(E2)*
25. Tampilkan pesan galat Server Action di antarmuka; hentikan pesan sukses tanpa syarat. *(E5)*
26. Paginasi pada seluruh daftar. *(§8.5)*
27. **Adopsi palet kertas Merbaoe** — menutup kegagalan kontras sekaligus menyelaraskan
    aplikasi dengan logo. Nilai lengkap di `design-direction.md` §4. *(UI-01, UI-10)*
28. Tabular numerals pada seluruh kolom nominal. *(UI-02)*
29. Asosiasi label pada 21 field, `role="alert"` pada umpan balik kasir, dan modal yang
    memenuhi pola dialog. *(UI-03, UI-04, UI-07)*
30. Ekstrak komponen bersama, lalu token tipografi, spasi, dan radius. *(UI-08, UI-09)*
31. Responsivitas tablet, target sentuh >=44px, dan interaksi keyboard kasir. *(§8.6, UI-05, UI-06)*
32. Manajemen pengguna (L-14) dan jejak audit (L-15).
33. Grafik tren pada dashboard dan ekspor Excel/PDF.
34. Tulis 20 kasus uji unit dan integrasi §9, perbaiki `npm run lint` hingga bersih, lalu
    pasang di CI. *(§9.4, E1)*
35. Prosedur cadangan dan uji pemulihan. *(§8.3)*
36. Jalankan UAT bersama pemilik kafe. *(§9.3)*

---

## 14. CARA MENJALANKAN (SNAPSHOT AUDIT 22 AGUSTUS 2026)

```powershell
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev                   # http://localhost:3000
```

Akun hasil *seed* — **kredensial pengembangan, wajib diganti sebelum dipakai pengguna
sesungguhnya**:

* Admin: `admin` / `admin123`
* Kasir: `kasir` / `kasir123`

Perlu diketahui: `npm run build` lulus, tetapi `npm run lint` **gagal** dengan 3 error, dan
`JWT_SECRET` belum diset sehingga sesi ditandatangani dengan kunci *hardcode*.

---

## 15. LANGKAH VERIFIKASI SETELAH TAHAP 2

Agar checkpoint berikutnya dapat memuat klaim "berjalan *end-to-end*" secara sah, jalankan
dan catat hasil skenario berikut. Nomor kasus mengikuti §9.2 README.

| Kasus | Skenario | Bukti yang dicatat |
| :--- | :--- | :--- |
| **I-09** | Login sebagai admin dan kasir. | Kasir ditolak saat membuka `/admin/*` **dan** saat memanggil Server Action admin. |
| **I-01** | Catat pembelian bahan baku. | `current_stock`, `stock_value`, dan `average_cost` diperbarui; satu baris `stock_transactions` bertipe `in` tertulis. |
| **I-02** | *Checkout* satu menu ber-BOM. | Stok turun sesuai resep; baris `out` tertulis; `hpp_snapshot` sama dengan hitungan manual Σ(takaran × `average_cost`). |
| **I-03** | Periksa kecocokan HPP BOM. | Untuk item ber-BOM, Σ nilai `sale/out` sama dengan `sale_items.hpp_snapshot`; item HPP manual/fallback tidak membuat mutasi bahan fiktif. |
| **I-06** | Naikkan harga beli lewat pembelian baru, lalu jual menu yang sama. | HPP transaksi baru naik, sementara `hpp_snapshot` transaksi **lama tidak berubah** — bukti mekanisme *snapshot* §3.7. |
| **I-05** | Dua *checkout* bersamaan atas bahan yang hanya cukup untuk satu transaksi. | Satu berhasil, satu gagal; stok tidak pernah negatif. |
| **I-08** | Rekonsiliasi persediaan satu periode. | Snapshot awal + opening + purchase + sale void − sale − waste + adjustment in − adjustment out = snapshot akhir. |
| — | Input satu pengeluaran operasional. | Angka laba bersih dashboard cocok dengan hitungan manual §3.8. |
