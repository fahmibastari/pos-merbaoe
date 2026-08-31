# PHASE 6 — PERFORMANCE & ARCHITECTURE AUDIT

**Metode:** analisis statis + hasil `npm run build`. **Tidak ada profiling, tidak ada pengukuran runtime, tidak ada `EXPLAIN ANALYZE`.**
**Status output:** Selesai

---

## 0. BATAS KLAIM

Instruksi Phase 6 melarang mengklaim masalah performa tanpa evidence. Audit ini karena itu memisahkan dua kategori secara tegas:

- **Verified** — dapat dipastikan dari kode atau keluaran build (mis. indeks yang tidak ada, kueri dalam loop, agregasi di memori).
- **Potential** — pola yang berpotensi menjadi bottleneck tetapi **belum diukur**. Tidak boleh diperlakukan sebagai masalah terbukti.

Volume data aktual pada basis data Supabase: **Not Verified** — audit bersifat read-only dan tidak melakukan koneksi. Skala yang diasumsikan untuk penilaian dampak: satu kafe, puluhan transaksi per hari, ribuan baris per tahun. Pada skala ini banyak pola yang secara teori lambat **tidak akan terasa** — hal itu dinyatakan di tempatnya agar tidak menghasilkan prioritas yang salah.

---

## 1. HASIL BUILD

```
Next.js 16.2.11 (Turbopack)
✓ Compiled successfully in 8.0s
  Finished TypeScript in 11.5s
✓ Generating static pages (12/12) in 5.0s

Route (app)                    Rendering
┌ ƒ /                          dynamic
├ ○ /_not-found                static
├ ƒ /admin/dashboard           dynamic
├ ƒ /admin/expenses            dynamic
├ ƒ /admin/ingredients         dynamic
├ ƒ /admin/products            dynamic
├ ƒ /admin/purchases           dynamic
├ ƒ /admin/sales               dynamic
├ ƒ /cashier                   dynamic
└ ○ /login                     static
ƒ Proxy (Middleware)
```

| Observasi | Penilaian |
| :--- | :--- |
| Seluruh rute data bersifat dinamis | **Benar** — data POS harus segar; SSG tidak sesuai |
| `/login` statis | **Benar** |
| Build 8 detik, TypeScript 11,5 detik | Sehat |
| **Angka ukuran bundle tidak dilaporkan** oleh keluaran build ini | Analisis bundle → **Not Verified** |

Peringatan build: konvensi `middleware` sudah usang di Next.js 16 (`proxy.ts`). Bukan isu performa — dicatat di Phase 9.

---

## 2. FRONTEND

| Aspek | Temuan | Evidence | Status |
| :--- | :--- | :--- | :--- |
| Batas client/server | Disiplin dan benar. Hanya 6 komponen `"use client"`, semuanya memang butuh state. Seluruh pengambilan data terjadi di Server Component. | `LoginForm`, `AdminSidebar`, `IngredientTable`, `ProductTable`, `PurchaseForm`, `ExpenseForm`, `CashierPOS` | ✅ Kekuatan |
| Ukuran komponen | `CashierPOS.tsx` 414 baris — komponen terbesar, memuat state keranjang, filter, pembayaran, dan seluruh markup dua panel. Belum "giant", tetapi sudah menjadi titik pusat. | `CashierPOS.tsx` | Observation |
| Re-render tidak perlu | Setiap perubahan state (termasuk mengetik satu huruf di kolom Cari) me-render ulang seluruh `CashierPOS`, termasuk seluruh kartu produk. Tidak ada `memo`, `useMemo`, atau `useCallback`. | `CashierPOS.tsx:64-69,117` | **Potential** — pada 5–50 produk kemungkinan tidak terasa; menjadi relevan bila menu tumbuh besar |
| `canAfford` dipanggil per produk per render | `filteredProducts.map` memanggil `canAfford()` untuk setiap kartu, dan setiap panggilan melakukan `cart.filter().reduce()` bersarang. Kompleksitas ≈ O(produk × keranjang × resep). | `CashierPOS.tsx:37-55,179` | **Potential** — pada 20 produk × 10 item keranjang × 4 bahan ≈ 800 operasi per render; tidak signifikan pada skala ini |
| Dynamic import | Tidak dipakai. Tidak ada komponen berat yang membenarkannya saat ini. | — | Netral |
| Optimasi gambar | Tidak ada `<img>` maupun `next/image` — seluruh "ikon" adalah emoji. Tidak ada isu gambar. | — | Netral |
| Font | `@import url(...)` Google Fonts di dalam CSS. Ini memblokir render karena penemuan font tertunda sampai CSS terunduh dan diurai. `next/font` akan menghilangkan round-trip dan menyediakan `font-display` otomatis. | `globals.css:6` | **Verified** — dampak kecil tetapi nyata pada muat pertama |
| Caching | `revalidatePath` dipanggil dengan tepat setelah mutasi (4 path setelah checkout, 3 setelah pembelian). | `cashier/actions.ts:119-122`; `admin/actions.ts:121-123` | ✅ Baik |
| Daftar besar | Tidak ada virtualisasi. Tidak diperlukan pada volume saat ini. | — | Netral |
| State architecture | State keranjang murni `useState` lokal, tidak dipersistensi. **Refresh halaman = keranjang hilang.** Bukan isu performa, tetapi isu keandalan operasional yang belum diputuskan (GAP Phase 1 §4 state management). | `CashierPOS.tsx:64` | **Verified — Medium** |

---

## 3. BACKEND

### 3.1 Kueri dalam loop — Verified

| Kode | Temuan | Evidence | Dampak |
| :--- | :--- | :--- | :--- |
| PF-01 | **Checkout melakukan kueri per item keranjang.** `for (const item of items)` memanggil `tx.product.findUnique` dengan `include: { recipes: { include: { ingredient } } }` satu per satu. Keranjang 10 item = 10 round-trip. | `cashier/actions.ts:48-56` | Verified. Semuanya di dalam satu transaksi → transaksi terbuka lebih lama → memperbesar jendela kontensi kunci. Dapat diganti satu `findMany({ where: { id: { in: ids } } })`. |
| PF-02 | **Pengurangan stok dilakukan per bahan per item.** `for (const recipe of product.recipes)` memanggil `tx.ingredient.update` satu per satu, di dalam loop item. Keranjang 10 item × 4 bahan = 40 UPDATE. | `cashier/actions.ts:75-81` | Verified. Sebagian tak terhindarkan (nilai decrement berbeda per bahan), tetapi bahan yang sama muncul di beberapa produk akan di-update berkali-kali alih-alih diakumulasi sekali. |
| PF-03 | **Pembelian melakukan 2 kueri per item.** `for` loop menjalankan `ingredient.update` + `stockTransaction.create` berurutan. | `admin/actions.ts:103-118` | Verified. `createMany` untuk mutasi stok dapat menggabungkan setengahnya. Volume rendah (input manual) → dampak praktis kecil. |

### 3.2 Agregasi di memori — Verified

| Kode | Temuan | Evidence | Dampak |
| :--- | :--- | :--- | :--- |
| PF-04 | **Total pengeluaran bulan berjalan dihitung dari 50 baris di memori.** `take: 50` lalu `.filter().reduce()`. Ekspresi batas bulan memanggil `new Date()` tiga kali dan diulang lagi utuh di baris 43. | `expenses/page.tsx:15-23,43` | Verified. Ini **bug korektness sekaligus** pemborosan — melanggar README §8.2. |
| PF-05 | **Total penjualan dijumlahkan dari 100 baris di memori** lalu dilabeli "Total Pendapatan". | `sales/page.tsx:9,16-17` | Verified. Sama: salah dan boros. |
| PF-06 | **Halaman riwayat memuat seluruh relasi bersarang untuk 100 baris.** `include: { user, details: { include: { product } } }` → satu penjualan 5 item menghasilkan 500 baris detail + join produk, hanya untuk dirangkai jadi satu string nama. | `sales/page.tsx:10-13,63` | Verified sebagai over-fetching. Prisma melakukan ini efisien (bukan N+1 sejati), tetapi payload jauh lebih besar dari yang dipakai. |
| PF-07 | Dashboard menjalankan 4 agregasi paralel via `Promise.all` — **pola yang benar**, lalu satu kueri `recentSales` **di luar** `Promise.all` sehingga berurutan. Mudah digabungkan. | `dashboard/page.tsx:18-51` | ✅ Sebagian besar baik; satu round-trip dapat dihemat |

### 3.3 Transaksi & konkurensi — Verified, kritis

| Kode | Temuan | Evidence | Dampak |
| :--- | :--- | :--- | :--- |
| PF-08 | **Cek stok dan pengurangan stok adalah statement terpisah tanpa row lock.** Validasi di baris 65-72, `decrement` di baris 75-81. Isolasi bawaan PostgreSQL adalah Read Committed. Tidak ada `SELECT ... FOR UPDATE`, tidak ada `CHECK (current_stock >= 0)`. | `cashier/actions.ts:65-81`; `migration.sql` tanpa CHECK | **Verified — Critical.** Dua checkout bersamaan atas bahan yang hanya cukup untuk satu dapat sama-sama lolos validasi lalu sama-sama mengurangi stok → stok negatif secara diam-diam. |
| PF-09 | **Batas transaksi terlalu lebar.** Seluruh `findUnique` per item berada di dalam `$transaction`, sehingga kunci baris ditahan selama seluruh round-trip pembacaan. | `cashier/actions.ts:35-117` | Verified. Memperbesar jendela kontensi PF-08. Pembacaan produk dapat dilakukan sebelum transaksi dibuka. |
| PF-10 | **Nomor invoice dari `Date.now()` melawan unique index.** | `cashier/actions.ts:101` | Verified. Dua checkout dalam milidetik sama → pelanggaran unique constraint → seluruh transaksi rollback dengan galat Prisma mentah. |
| PF-11 | Pembelian stok memakai `$transaction` dengan benar. | `admin/actions.ts:84-119` | ✅ Baik |

### 3.4 Panggilan jaringan & validasi

| Temuan | Status |
| :--- | :--- |
| Tidak ada panggilan jaringan eksternal selain basis data. | ✅ |
| Tidak ada validasi masukan sisi server (`zod` tidak terpasang). Nilai `parseFloat` yang menghasilkan `NaN` akan diteruskan ke Prisma. | Verified — dibahas Phase 7 |
| Koneksi memakai `PrismaPg` adapter dengan `DATABASE_URL` (pooler port 6543) sementara migrasi memakai `DIRECT_URL` — pemisahan yang benar untuk PgBouncer. | ✅ Baik |
| Singleton Prisma dijaga lewat `globalForPrisma` pada non-produksi — mencegah kehabisan koneksi saat hot reload. | ✅ Baik |

---

## 4. DATABASE

### 4.1 Indeks — Verified

| Temuan | Evidence |
| :--- | :--- |
| Migrasi hanya membuat **3 unique index**: `users_username_key`, `purchases_invoice_number_key`, `sales_invoice_number_key`. | `migration.sql:145-152` |
| **Tidak ada indeks non-unik sama sekali.** PostgreSQL tidak membuat indeks otomatis untuk kolom foreign key, dan Prisma tidak menambahkannya kecuali diminta. | `migration.sql` |

Kolom yang dipakai untuk penyaringan/join tanpa indeks:

| Kolom | Dipakai oleh | Dampak |
| :--- | :--- | :--- |
| `sales.transaction_date` | Dashboard (2 agregasi), riwayat, seluruh laporan periodik | Seq scan pada setiap muat dashboard |
| `sales_details.sale_id` | Join `include: { details }` pada 2 halaman | Seq scan per join |
| `sales_details.product_id` | Join produk | Seq scan |
| `sales.cashier_id` | Join `user` | Seq scan |
| `stock_transactions.ingredient_id` | Kartu stok (belum dibangun) | Akan menjadi masalah saat L-04 ada |
| `operational_expenses.expense_date` | Total bulan berjalan | Seq scan |
| `purchases.purchase_date` | Agregasi dashboard | Seq scan |
| `recipes.product_id` | Join resep pada setiap muat kasir | Seq scan per checkout |

**Penilaian jujur mengenai dampak:** pada tabel berisi ratusan hingga beberapa ribu baris, PostgreSQL akan memilih seq scan dan tetap merespons dalam milidetik. **Ini belum menjadi bottleneck nyata hari ini.** Yang membuatnya tetap layak dikerjakan lebih awal: indeks adalah bagian dari migrasi skema yang bagaimanapun harus dijalankan (§5.14), sehingga biayanya nyaris nol bila digabungkan — bukan karena ada bukti kelambatan.

### 4.2 Constraint & integritas — Verified

| Temuan | Evidence | Status |
| :--- | :--- | :--- |
| **Nol batasan `CHECK`.** README §5 mensyaratkan 17. | `migration.sql` | Verified — Critical |
| Lima di antaranya adalah `CHECK` aritmetika pada `sales` yang akan menegakkan rumus §3.4 di tingkat basis data — pengaman yang akan menangkap kesalahan seperti rumus laba bersih yang keliru secara otomatis. | README §5.10 | — |
| **Tidak ada `UNIQUE(product_id, ingredient_id)` pada `recipes`.** Satu bahan dapat masuk dua kali ke satu resep → HPP tergandakan tanpa peringatan. | `schema.prisma` model Recipe | Verified — High |
| Foreign key lengkap dan `onDelete` dipilih secara sadar: `Cascade` untuk detail, `Restrict` untuk master. | `schema.prisma` | ✅ Baik |
| Normalisasi wajar. Tidak ada duplikasi data yang tidak disengaja. | — | ✅ Baik |
| Presisi `DECIMAL(10,2)` untuk seluruh nilai, termasuk harga per satuan. Untuk bahan per gram/ml, 2 desimal tidak cukup (README §3.2 mensyaratkan `(14,4)`). | `schema.prisma` | Verified — akumulasi galat pembulatan |
| Kolom waktu `TIMESTAMP(3)` tanpa zona waktu. | `schema.prisma` | Verified — dibahas Phase 2 |

### 4.3 Pola kueri

| Temuan | Status |
| :--- | :--- |
| Perbandingan antar-kolom untuk stok menipis memakai `prisma.ingredient.fields.minimumStock` — cara yang benar, dieksekusi di basis data alih-alih di memori. | ✅ Kekuatan |
| Agregasi dashboard memakai `aggregate` dengan `_sum`/`_count` — benar. | ✅ Baik |
| Halaman daftar memakai `take` tetap tanpa `skip`/kursor. | Verified — Phase 4 UX-12 |
| Tidak ada `select` yang mempersempit kolom; seluruh kueri mengambil semua kolom model. Dampak kecil pada tabel sempit. | Observation |

---

## 5. CODE QUALITY

| Aspek | Temuan | Evidence | Status |
| :--- | :--- | :--- | :--- |
| Type safety | `tsc --noEmit` lulus. Namun tipe uang di komponen klien dideklarasikan `unknown` lalu dipaksa `Number()` — akibat serialisasi `JSON.parse(JSON.stringify())`. Tipe kehilangan makna tepat di data paling kritis. | `CashierPOS.tsx:11,16,22-23` | **Medium** |
| Type safety — FormData | `formData.get("x") as string` dipakai di seluruh Server Action tanpa pemeriksaan. `as` di sini menyembunyikan `null` yang mungkin. | Seluruh `actions.ts` | **Medium** |
| Duplikasi logika | `formatRupiah`/`formatRp` didefinisikan 3 kali + 4 inline; batas periode 2 kali; badge metode bayar 2 kali. | Phase 2 ST-01..ST-03 | **Medium** |
| Komponen raksasa | Tidak ada. Terbesar 414 baris. | — | ✅ |
| Service raksasa | Tidak ada. `admin/actions.ts` 157 baris berisi 9 fungsi pendek. | — | ✅ |
| Circular dependency | Tidak ada. Grafik impor berbentuk pohon. | — | ✅ |
| Dead code | `test_db.js` di akar; `matchaLatte` tidak dipakai di seed; `.pulse-slow` tidak pernah dipakai; `@keyframes spin` terduplikasi. | ESLint + Phase 3 CP-02 | **Low** |
| Penamaan | Konsisten dan deskriptif, campuran Indonesia (UI) dan Inggris (kode) — pemisahan yang wajar. | — | ✅ |
| Error handling | Hanya `submitSale` yang memakai try/catch. **Delapan Server Action lain tidak memiliki penanganan galat apa pun** — galat Prisma akan naik sebagai exception yang tidak tertangkap. Tidak ada `error.tsx`. | `cashier/actions.ts:34,125` vs `admin/actions.ts` | **High** |
| Kualitas abstraksi | Empat modul yang diwajibkan README §4.2 (`guard`, `money`, `period`, `costing`) belum ada, sehingga aturan lintas-modul tidak punya tempat tinggal. | `ls src/lib` → 2 berkas | **High** |
| Separation of concerns | Halaman Server Component mencampur pengambilan data, perhitungan bisnis (laba bersih), dan presentasi dalam satu berkas. Dapat diterima pada skala ini, tetapi menempatkan rumus akuntansi di dalam komponen halaman membuatnya tidak dapat diuji unit — bertabrakan dengan §9.1 yang mensyaratkan uji unit untuk perhitungan laba. | `dashboard/page.tsx:40-45` | **Medium** |
| Lint | `npx eslint .` **gagal**: 3 error, 21 warning. ESLint juga memindai `hallmark-main/` karena tidak masuk `globalIgnores`. | Keluaran ESLint | **Medium** |

---

## 6. PENILAIAN ARSITEKTUR

Instruksi Phase 6 melarang memaksakan clean architecture demi teori. Penilaian memakai empat kriteria yang diminta.

| Kriteria | Penilaian | Alasan |
| :--- | :--- | :--- |
| **Understandable** | **Baik** | Struktur rute jelas, aksi berada di dekat halaman yang memakainya, penamaan konsisten. Pengembang baru dapat menemukan alur checkout dalam hitungan menit. |
| **Maintainable** | **Sedang** | Terhambat oleh duplikasi (ST-01..03), ketiadaan komponen bersama (ST-07), dan ketiadaan modul `lib/` yang direncanakan. Mengubah format rupiah hari ini menuntut sentuhan di 7 tempat. |
| **Testable** | **Kurang** | Ini kelemahan arsitektur paling nyata. Perhitungan HPP berada di dalam Server Action yang juga melakukan I/O basis data; rumus laba bersih berada di dalam komponen halaman. Tidak satu pun dapat diuji tanpa basis data. README §9.1 mensyaratkan 10 uji unit atas fungsi perhitungan murni — **fungsi-fungsi itu belum ada sebagai unit yang dapat dipanggil**. |
| **Scalable** | **Memadai untuk lingkupnya** | Untuk satu kafe, arsitektur serverless + Postgres terkelola sudah tepat. Tidak ada kebutuhan menaikkan kompleksitas. |

**Arah yang direkomendasikan — proporsional, bukan maksimal:**

Tidak perlu lapisan repository, tidak perlu domain layer, tidak perlu DI container. Yang dibutuhkan hanya **mengekstrak perhitungan murni keluar dari I/O**, persis seperti yang sudah ditetapkan README §4.2:

```
Server Action  →  orkestrasi + I/O + transaksi
      ↓ memanggil
lib/costing.ts  →  fungsi murni: hitung average cost, hitung HPP produk
lib/money.ts    →  fungsi murni: pembulatan, format
lib/period.ts   →  fungsi murni: batas periode Asia/Jakarta
lib/guard.ts    →  requireAuth / requireAdmin
```

Empat berkas ini sekaligus menyelesaikan tiga hal: menghilangkan duplikasi, membuat 10 uji unit §9.1 mungkin ditulis, dan memberi satu tempat untuk menegakkan aturan otorisasi.

---

## 7. RINGKASAN TEMUAN

### Verified Bottleneck / Correctness Issue

| Kode | Temuan | Severity |
| :--- | :--- | :--- |
| PF-08 | Cek stok dan decrement tanpa row lock maupun `CHECK` → oversell pada checkout bersamaan | **Critical** |
| PF-10 | Nomor invoice `Date.now()` melawan unique index → transaksi gagal pada tabrakan | High |
| PF-04 | Total pengeluaran dihitung dari `take: 50` di memori → angka salah | High |
| PF-05 | Total penjualan dihitung dari `take: 100` di memori → angka salah | High |
| — | Nol `CHECK` constraint dari 17 yang disyaratkan | High |
| — | Tidak ada `UNIQUE` pada `recipes` → HPP dapat tergandakan | High |
| — | 8 Server Action tanpa error handling; tidak ada `error.tsx` | High |
| — | Perhitungan bisnis tidak dapat diuji unit (tidak ada modul murni) | High |
| PF-09 | Batas transaksi terlalu lebar, memperbesar jendela kontensi PF-08 | Medium |
| PF-01 | Kueri produk per item keranjang di dalam transaksi | Medium |
| PF-06 | Over-fetching relasi bersarang pada halaman riwayat | Medium |
| — | Presisi `DECIMAL(10,2)` untuk harga per satuan | Medium |
| — | Keranjang tidak dipersistensi; refresh menghilangkannya | Medium |
| — | Font via `@import` CSS alih-alih `next/font` | Low |
| PF-03 | 2 kueri per item pada pembelian | Low |

### Potential Optimization — belum terbukti menjadi bottleneck

| Temuan | Catatan |
| :--- | :--- |
| Tidak ada indeks non-unik (8 kolom terdampak) | Pada volume saat ini seq scan tetap cepat. Dikerjakan karena murah saat migrasi, **bukan** karena ada bukti lambat. |
| `CashierPOS` re-render penuh pada setiap ketikan | Tidak terasa pada 5–50 produk. Ukur dulu bila menu tumbuh. |
| `canAfford` O(produk × keranjang × resep) per render | Sama seperti di atas. |
| Tidak ada virtualisasi daftar | Tidak diperlukan pada volume ini. |
| Tidak ada `select` penyempit kolom | Dampak kecil pada tabel sempit. |
| Ukuran bundle | **Not Verified** — keluaran build tidak melaporkan angkanya. |

### Areas Requiring Measurement

- Waktu respons nyata dashboard dan riwayat terhadap data produksi (§8.2 menetapkan target < 3 detik untuk laporan sebulan).
- `EXPLAIN ANALYZE` pada agregasi dashboard setelah volume data tumbuh, untuk memvalidasi apakah indeks §5.14 benar-benar berdampak.
- Ukuran bundle klien dan Largest Contentful Paint layar kasir pada perangkat tablet nyata.
- Perilaku nyata di bawah checkout bersamaan (kasus uji I-05 §9.2) untuk mengonfirmasi PF-08 secara empiris.

---

**Output Phase 6 selesai. Lanjut ke Phase 7.**
