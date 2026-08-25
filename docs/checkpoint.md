# CHECKPOINT PROGRES APLIKASI — AUDIT KODE TERHADAP DOKUMEN DESAIN

**Proyek:** Aplikasi Web POS & Analisis Laba — Kafe Kopi Merbaoe
**Acuan:** `README.md` — Dokumen Desain Sistem
**Tanggal audit:** 22 Agustus 2026
**Basis pemeriksaan:** berkas kerja lokal apa adanya di diska
**Versi dokumen:** 5.1
**Audit lanjutan:** `docs/execute-step/phase1.md` s.d. `phase11.md` (Phase 0–11)
**Arah visual:** `docs/design-direction.md`

---

> ### ⚠️ Dokumen ini adalah SNAPSHOT audit, bukan kondisi terkini
>
> Sejak audit ini ditulis, sebagian temuan **sudah diperbaiki**. Status terkini
> ada di **`docs/progress.md`**.
>
> Sudah ditangani per 24 Agustus 2026 — lihat §12 untuk penandanya:
> **S3** (otorisasi Server Action) · **S5** (kuantitas negatif) · **A1** (rumus laba
> bersih) · **A5** (zona waktu) · **A6** dan **A7** (agregasi di memori) ·
> **UI-02** (tabular numerals).
>
> Temuan lain masih berlaku. Angka cakupan pada §1 mencerminkan kondisi saat
> audit, bukan sekarang.

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
| **checkpoint.md** (dokumen ini) | Snapshot kondisi aplikasi terhadap `README.md` |
| `execute-step/phase1.md`–`phase9.md` | Audit per dimensi: planning, implementasi, visual, UX, aksesibilitas, performa, keamanan, konten, technical debt |
| `execute-step/phase10.md` | Sintesis dan priority matrix |
| `execute-step/phase11.md` | **Peta jalan implementasi** — 40 task dengan dependency dan acceptance criteria |
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

### 🟠 A4. Perhitungan transaksi belum mengikuti model DPP

* **Ketentuan §3.4:** urutan Subtotal → Diskon → DPP → Pajak → Total Dibayar, dengan
  **Laba Kotor = DPP − Total HPP** dan pajak dikeluarkan dari laba (§3.1.C).
* **[TERVERIFIKASI]** `src/app/cashier/actions.ts:84-114` hanya mengenal `totalAmount`,
  `totalHpp`, dan `grossProfit`. Tidak ada diskon, tarif pajak, DPP, uang diterima, maupun
  kembalian — sejalan dengan 12 kolom `sales` yang belum ada (DB-08 pada §6).
* **Dampak:** transaksi belum dapat mencatat diskon maupun PB1, dan §7.8 belum terpenuhi.

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

| Kode | Temuan | Acuan | Dampak |
| :--- | :--- | :--- | :--- |
| **D1** | **Balapan stok (*oversell*).** Pengecekan kecukupan stok (`cashier/actions.ts:65-72`) dan pengurangan stok (75-81) adalah dua statement terpisah tanpa `SELECT ... FOR UPDATE`, pada isolasi bawaan *Read Committed*. Batasan `CHECK (current_stock >= 0)` juga belum ada. | §7.2 tingkat 2, §5.3 | Dua kasir yang *checkout* bersamaan dapat sama-sama lolos validasi sehingga stok menjadi negatif tanpa terdeteksi. |
| **D2** | **Nomor invoice rawan tabrakan.** `` `TRX-${Date.now()}` `` (`cashier/actions.ts:101`) melawan *unique index* `sales_invoice_number_key`. *Sequence* `sales_invoice_seq` belum dibuat. | §5.10 | Dua *checkout* dalam milidetik yang sama gagal dengan pesan galat Prisma mentah. |
| **D3** | **Nomor invoice pada struk bukan nomor yang tersimpan.** Klien membangkitkan `` `TRX-${Date.now()}` `` sendiri (`CashierPOS.tsx:112`) setelah aksi selesai, sehingga nilainya berbeda dari yang dibuat server. | §5.10, §6.3 | Nomor yang dilihat kasir tidak dapat ditemukan di riwayat penjualan. Menjadi fatal begitu fitur cetak struk dibangun di atas nilai ini. |
| **D4** | **Hapus keras tanpa penanganan galat.** `deleteIngredient` bertabrakan dengan `Recipe.ingredient onDelete: Restrict`; `deleteProduct` bertabrakan dengan relasi `SaleDetail.product`. Kolom `ingredients.is_active` untuk *soft delete* belum ada. | §5.3, §7.4 | Menghapus bahan yang dipakai resep, atau menu yang pernah terjual, melempar galat Prisma yang tidak ditangkap — antarmuka hanya diam. |
| **D5** | **Tidak ada indeks untuk kueri laporan.** Migrasi hanya membuat 3 *unique index*. Prisma tidak membuat indeks otomatis untuk kolom *foreign key* di PostgreSQL. | §5.14 | 17 indeks yang dispesifikasikan pada §5.14 belum ada. Laporan periodik akan melakukan *sequential scan*. |
| **D6** | **Belum ada void, penyesuaian stok, dan pencatatan waste.** | §7.4, §7.5 | Kesalahan input kasir tidak dapat dikoreksi dari aplikasi, dan gelas pecah tidak dapat dicatat sebagai mutasi stok. |
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
| **L-03** | `/admin/ingredients` | 🟡 Sebagian | CRUD dan indikator stok menipis ada. Belum: kolom harga rata-rata dan nilai persediaan. |
| **L-04** | `/admin/ingredients/[id]/card` | 🔴 Belum ada | Kartu stok per bahan baku. |
| **L-05** | `/admin/ingredients/adjustment` | 🔴 Belum ada | Penyesuaian stok dan waste. |
| **L-06** | `/admin/products` | 🟡 Sebagian | Tambah, aktif/nonaktif, dan hapus ada. Belum: form ubah (D7). |
| **L-07** | `/admin/products/[id]/recipe` | 🔴 Belum ada | **Penyusun resep BOM.** Lihat F1. |
| **L-08** | `/admin/purchases` | 🟢 Sesuai | Form multi-item dan riwayat lengkap. |
| **L-09** | `/admin/expenses` | 🟢 Sesuai | Form dan riwayat berkategori lengkap. |
| **L-10** | `/admin/sales` | 🟡 Sebagian | Tabel riwayat ada. Belum: filter tanggal & kasir, aksi void. |
| **L-11** | `/admin/reports/profit` | 🔴 Belum ada | Laporan laba dengan filter rentang tanggal & ekspor. |
| **L-12** | `/admin/reports/inventory` | 🔴 Belum ada | Laporan nilai persediaan (§3.9). |
| **L-13** | `/admin/shifts` | 🔴 Belum ada | Daftar shift kasir. |
| **L-14** | `/admin/users` | 🔴 Belum ada | Kelola akun dan reset password. |
| **L-15** | `/admin/audit` | 🔴 Belum ada | Jejak audit. |
| **L-16** | `/cashier` | 🟡 Sebagian | Grid menu, pencarian, keranjang, metode bayar, blokir stok habis ada. Belum: diskon, kalkulator kembalian. |
| **L-17** | `/cashier/receipt/[id]` | 🔴 Belum ada | Struk termal siap cetak. |
| **L-18** | `/cashier/history` | 🔴 Belum ada | Riwayat transaksi milik kasir. |
| **L-19** | `/cashier/stock` | 🔴 Belum ada | Tampilan stok hanya baca. |
| **L-20** | `/cashier/shift` | 🔴 Belum ada | Buka dan tutup kas. |

**Rekapitulasi:** 3 sesuai, 5 sebagian, 12 belum ada.

### Catatan khusus — F1: penyusun resep BOM

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
| §7.4 | Pembatalan transaksi (void) | 🔴 Belum ada | Memerlukan DB-08 dan DB-04. |
| §7.5 | Penyesuaian stok & waste | 🔴 Belum ada | Memerlukan DB-04 dan L-05. |
| §7.6 | Manajemen shift kasir | 🔴 Belum ada | Memerlukan DB-01, L-13, L-20. |
| §7.7 | Cetak nota transaksi | 🔴 Belum ada | Setelah *checkout* hanya muncul kotak notifikasi (`CashierPOS.tsx:333-338`). |
| §7.8 | Diskon, pajak, kalkulator kembalian | 🔴 Belum ada | Memerlukan DB-08 — lihat A4. |
| §7.9 | Fleksibilitas pembayaran | 🟢 Sesuai | Tunai, QRIS, dan transfer tercatat. Pemisahan kas tunai untuk shift menyusul bersama §7.6. |

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

Dua kasus paling menentukan adalah **I-03** (Σ nilai mutasi keluar = `sales.total_hpp`) dan
**I-08** (rekonsiliasi persediaan). Keduanya adalah *invariant* yang menjadi bukti utama
bahwa otomatisasi HPP dan laba bekerja benar, sekaligus temuan inti yang akan dilaporkan
dalam skripsi. Saat ini keduanya **belum dapat diuji**, karena mutasi stok keluar memang
belum dicatat (A3).

Kriteria kelulusan §9.4 juga mensyaratkan `npm run lint` berjalan tanpa galat — saat ini
gagal (E1).

---

## 11. TEMUAN — ANTARMUKA, VISUAL & AKSESIBILITAS

Bersumber dari `execute-step/phase3.md`, `phase4.md`, dan `phase5.md`. Rasio kontras dihitung dengan formula WCAG 2.x dari nilai token sebenarnya; ukuran target sentuh dihitung dari nilai CSS. Keduanya **[TERVERIFIKASI]**. Tidak ada pengujian pembaca layar maupun pemindaian otomatis, sehingga **tidak ada klaim kepatuhan WCAG**.

### 11.1 Kontras — UI-01 · High

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
| **UI-03** | **21 dari 23 field tidak terhubung label.** Pola `<label className="label">` + `<input name=...>` sebagai *sibling* tanpa `htmlFor`/`id`. Hanya `LoginForm` yang benar (2 field) — jadi pola yang tepat sudah diketahui, masalahnya konsistensi. Bagi pembaca layar, 21 field lainnya tidak bernama. | Seluruh form selain login | High |
| **UI-04** | **Modal tidak memenuhi pola dialog.** Tanpa `role="dialog"`, `aria-modal`, focus trap, penanganan Escape, maupun pengembalian fokus. Konten di belakang overlay tetap terbaca AT. | `IngredientTable.tsx:65-93` | High |
| **UI-05** | **Target sentuh di bawah 44px pada kontrol kasir.** Dihitung dari CSS: tombol qty keranjang **28px**, `.btn-sm` **≈31px**, tombol metode bayar **≈31px**. README §8.6 menetapkan tablet sebagai prioritas utama layar kasir — kontrol yang paling sering ditekan justru paling kecil. | `CashierPOS.tsx:304,311`; `globals.css:189-193` | High |
| **UI-06** | **Nol interaksi keyboard.** Tidak ada satu pun `onKeyDown`/`onKeyUp` di seluruh `src/`. Tidak ada Escape, tidak ada shortcut kasir, tidak ada dukungan pemindai barcode. POS cepat hampir selalu dioperasikan keyboard. | `grep -rn 'onKeyDown' src/` | High |
| **UI-07** | **Umpan balik terpenting tidak diumumkan.** Satu-satunya `role="alert"` berada di layar login yang paling jarang dipakai. Galat dan sukses pada layar kasir — tempat kegagalan transaksi paling berkonsekuensi — hanya `<div>` biasa. | `LoginForm.tsx:46` vs `CashierPOS.tsx:326-338` | High |
| **UI-08** | **Tidak ada skala tipografi maupun spasi.** 19 ukuran font berbeda (banyak berselisih 0,02rem) dan 17 nilai spasi (sebagian berselisih 0,05rem), seluruhnya inline. Setiap layar baru menambah nilai baru. | Seluruh komponen | Medium |
| **UI-09** | **Tidak ada lapisan komponen bersama.** Satu-satunya komponen yang dapat dipakai ulang adalah `AdminSidebar`. Tabel, modal, form, empty state, dan umpan balik ditulis ulang per halaman. Masih ada 12 layar yang harus dibangun — debt ini akan berlipat bila tidak ditangani lebih dulu. | `src/app/**` | Medium |
| **UI-10** | **Arah visual tidak selaras dengan merek.** Aplikasi memakai latar gelap `#0F0F0F` dan oranye `#F96C0F`, sementara logo berlatar kertas `#F1EFEC` dengan tinta bata `#8A2416`. Warna merek hanya mencapai 1,60–2,14:1 di atas permukaan gelap, sehingga **tidak dapat dipakai sama sekali** pada tema saat ini. Ditambah tujuh anti-pattern terkonsentrasi di halaman login: orb dekoratif, gradient headline, glassmorphism, shadow-glow. | `globals.css`; `login/page.tsx:22-47`; `design-direction.md` §2 | Medium |

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
| **E4** | Tidak ada `error.tsx`, `loading.tsx`, maupun `not-found.tsx` kustom. Setiap halaman melakukan render server yang memblokir tanpa Suspense, dan setiap galat Prisma tampil sebagai layar galat Next.js. | Struktur `src/app/` |
| **E5** | **Pesan galat dari Server Action tidak pernah ditampilkan.** `createIngredient`, `createProduct`, `createExpense`, dan `createPurchase` mengembalikan `{ error: ... }`, tetapi seluruh komponen klien (`IngredientTable.tsx:15`, `ProductTable.tsx:16`, `ExpenseForm.tsx:13`, `PurchaseForm.tsx:35`) membuang nilai kembaliannya. Validasi yang gagal tampak seperti berhasil. | Kode klien |
| **E6** | Tailwind v4 di-*import* pada `globals.css:6`, namun hampir seluruh gaya ditulis sebagai `style={{}}` sebaris. Dua sistem gaya berjalan berdampingan tanpa aturan. | `globals.css` vs komponen |
| **E7** | Skrip *debug* `test_db.js` tertinggal di akar proyek dan turut membuat lint gagal. | Akar direktori |
| **E8** | Tidak ada jejak audit perubahan data master. Siapa yang mengubah harga jual atau stok minimum tidak tercatat. | DB-02 |
| **E9** | Tidak ada manajemen pengguna. Hanya dua akun hasil *seed* (`admin123` / `kasir123`), dan tidak ada cara mengganti password atau menambah kasir dari aplikasi. | L-14, DB-05 |

---

## 13. PETA JALAN

> **Acuan resmi pengerjaan adalah `execute-step/phase11.md`** — 40 task lengkap dengan
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

## 14. CARA MENJALANKAN (KONDISI SAAT INI)

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
| **I-03** | Periksa kecocokan HPP. | Σ `total_cost` baris `out` untuk penjualan tersebut **sama dengan** `sales.total_hpp`. |
| **I-06** | Naikkan harga beli lewat pembelian baru, lalu jual menu yang sama. | HPP transaksi baru naik, sementara `hpp_snapshot` transaksi **lama tidak berubah** — bukti mekanisme *snapshot* §3.7. |
| **I-05** | Dua *checkout* bersamaan atas bahan yang hanya cukup untuk satu transaksi. | Satu berhasil, satu gagal; stok tidak pernah negatif. |
| **I-08** | Rekonsiliasi persediaan satu periode. | Persediaan awal + pembelian − HPP − waste ± penyesuaian = persediaan akhir. |
| — | Input satu pengeluaran operasional. | Angka laba bersih dashboard cocok dengan hitungan manual §3.8. |
