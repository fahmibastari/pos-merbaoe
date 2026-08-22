# PHASE 2 — AUDIT IMPLEMENTASI AKTUAL

**Objek audit:** repository `merbaoe/` (read-only)
**Acuan planning:** `README.md`, dengan konteks `docs/checkpoint.md`
**Status output:** Selesai

---

## 1. METODE & CAKUPAN

Seluruh berkas di `src/`, `prisma/`, dan konfigurasi akar dibaca. Dikecualikan: `node_modules/`, `.next/`, `src/generated/prisma/` (keluaran generator), dan `hallmark-main/` (dinilai terpisah sebagai design reference).

Verifikasi mekanis yang dijalankan:

| Perintah | Hasil |
| :--- | :--- |
| `npx tsc --noEmit` | Lulus, exit 0 |
| `npm run build` | Lulus — Next.js 16.2.11, 12 halaman, 1 peringatan deprecation |
| `npx eslint .` | **Gagal** — 3 error, 21 warning |
| `npx prisma validate` (skema §5.15 README) | Valid |

**Discrepancy terhadap `docs/checkpoint.md`:** tidak ditemukan. Temuan Phase 2 konsisten dengan checkpoint v4.0. Satu catatan metodologis: checkpoint menetapkan berkas kerja lokal sebagai basis pemeriksaan, dan Phase 2 mengikuti basis yang sama.

---

## 2. ROOT STRUCTURE MAPPING

```
merbaoe/
├── prisma/
│   ├── schema.prisma          15 model/enum  (5 enum, 10 model)
│   ├── migrations/            1 migrasi: 20260822075607_init
│   └── seed.ts                206 baris
├── src/
│   ├── app/
│   │   ├── layout.tsx         root layout
│   │   ├── page.tsx           redirect berbasis peran
│   │   ├── globals.css        353 baris — design system de-facto
│   │   ├── login/             page + LoginForm + actions
│   │   ├── admin/             layout + AdminSidebar + actions + 6 rute
│   │   └── cashier/           layout + page + CashierPOS + actions
│   ├── lib/                   auth.ts, prisma.ts
│   ├── middleware.ts          proteksi rute
│   └── generated/prisma/      keluaran generator (dikecualikan)
├── docs/                      checkpoint.md, execute-step/, prompt-audit/
├── hallmark-main/             design reference
└── test_db.js                 skrip debug di akar
```

| Kategori | Kondisi |
| :--- | :--- |
| Frontend | Menyatu dengan backend dalam App Router |
| Backend | Server Actions — 12 fungsi tersebar di 3 berkas |
| Database | Prisma + PostgreSQL via `@prisma/adapter-pg` |
| Shared packages | Tidak ada (single package) |
| Assets | `public/` + `favicon.ico` saja |
| Components | **Tidak ada direktori komponen bersama.** Semua komponen bersifat page-local |
| Pages/routes | 9 `page.tsx` → 10 rute setelah build |
| Hooks | **Not Found** — tidak ada custom hook |
| Services | **Not Found** — logika bisnis berada langsung di dalam Server Action |
| Utilities | Hanya `lib/auth.ts` dan `lib/prisma.ts` |
| Configuration | `next.config.ts` (kosong), `prisma.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `postcss.config.mjs` |
| Tests | **Not Found** — tidak ada berkas uji, tidak ada CI |
| Documentation | `README.md`, `docs/checkpoint.md`, `AGENTS.md`, `CLAUDE.md` |

---

## 3. ARCHITECTURAL PATTERN

**Pola aktual:** *Route-colocated server actions* — setiap segmen rute memiliki `actions.ts` sendiri; komponen klien memanggilnya langsung. Tidak ada lapisan service, repository, atau domain.

Untuk aplikasi sebesar ini pola tersebut **sah dan tidak perlu dipaksa menjadi clean architecture** (Phase 0 aturan 4). Yang menjadi masalah bukan ketiadaan lapisan, melainkan **ketiadaan modul bersama untuk aturan yang sudah dinyatakan lintas-modul oleh README** — `guard.ts`, `money.ts`, `period.ts`, `costing.ts` (§4.2) semuanya belum ada, sehingga aturan seperti otorisasi dan batas periode tidak punya satu tempat untuk ditegakkan.

### Entry points

| Entry | Berkas | Catatan |
| :--- | :--- | :--- |
| Root redirect | `src/app/page.tsx` | Mengarahkan berdasarkan peran |
| Proteksi request | `src/middleware.ts` | Matcher `/admin/:path*`, `/cashier/:path*`, `/login` |
| Sesi | `src/lib/auth.ts` | `jose` HS256 |
| Basis data | `src/lib/prisma.ts` | Singleton + `PrismaPg` adapter |

### Critical flows

| Flow | Berkas | Transaksional |
| :--- | :--- | :---: |
| Login | `login/actions.ts:9-48` | — |
| Checkout kasir | `cashier/actions.ts:12-129` | Ya — `$transaction` |
| Pembelian stok | `admin/actions.ts:68-124` | Ya — `$transaction` |
| Pengeluaran operasional | `admin/actions.ts:127-150` | Tidak perlu |
| Agregasi dashboard | `admin/dashboard/page.tsx:18-51` | — |

### Temuan struktural

| Kode | Temuan | Evidence | Severity |
| :--- | :--- | :--- | :--- |
| ST-01 | **Duplicated logic — format rupiah.** Fungsi `formatRupiah`/`formatRp` didefinisikan ulang di 4 berkas terpisah, dengan dua nama berbeda dan implementasi setara. | `dashboard/page.tsx:7`, `ProductTable.tsx:7`, `CashierPOS.tsx:33`; inline `"Rp " + Number(...).toLocaleString("id-ID")` di `sales/page.tsx`, `purchases/page.tsx`, `expenses/page.tsx`, `IngredientTable.tsx` | Medium |
| ST-02 | **Duplicated logic — batas periode.** Perhitungan awal bulan ditulis ulang secara inline. `expenses/page.tsx:22` memanggil `new Date()` tiga kali dalam satu ekspresi, dan mengulang seluruh ekspresi itu lagi di baris 43. | `dashboard/page.tsx:14-15`, `expenses/page.tsx:22,43` | Medium |
| ST-03 | **Duplicated logic — badge metode pembayaran.** Ekspresi ternary tiga cabang untuk memilih kelas badge disalin identik di dua halaman. | `dashboard/page.tsx:112`, `sales/page.tsx:65` | Low |
| ST-04 | **Serialisasi via `JSON.parse(JSON.stringify(...))`.** Dipakai di 4 halaman untuk melewatkan hasil Prisma ke komponen klien. Berfungsi, tetapi mengubah `Decimal` menjadi string tanpa tipe yang mencerminkannya — komponen penerima mengetik field uang sebagai `unknown` lalu memaksa `Number()`. | `cashier/page.tsx:23`, `products/page.tsx:12`, `ingredients/page.tsx:12`, `purchases/page.tsx:20`; tipe `unknown` di `CashierPOS.tsx:11,16,22-23` | Medium |
| ST-05 | **Dynamic import di dalam inline server action.** `expenses/page.tsx:73-77` mendefinisikan server action inline yang melakukan `await import("../actions")`, sementara berkas yang sama sudah bisa mengimpornya di tingkat modul. Pola ini tidak dipakai di tempat lain. | `expenses/page.tsx:73-77` | Low |
| ST-06 | **Dead code / berkas debug.** `test_db.js` di akar proyek; variabel `matchaLatte` di `seed.ts:112` dibuat tetapi tidak dipakai. | `npx eslint .` | Low |
| ST-07 | **Tidak ada boundary komponen bersama.** Tabel, modal, form, dan kartu statistik diimplementasikan ulang per halaman memakai `style={{}}` inline. Tidak ada `<Table>`, `<Modal>`, `<Field>`, atau `<Button>` sebagai komponen. | Seluruh `src/app/**/*.tsx` | Medium |
| ST-08 | **Inkonsistensi pola form.** Empat form klien memakai `onSubmit` + `startTransition`/`useState`; satu form (hapus pengeluaran) memakai `<form action={...}>` server action. Dua pola berdampingan tanpa alasan yang terlihat. | `ExpenseForm.tsx:10` vs `expenses/page.tsx:73` | Low |
| ST-09 | **Circular dependency:** tidak ditemukan. Grafik impor bersifat pohon: `app/**` → `lib/**` → `generated/**`. | Pemeriksaan impor | — |

---

## 4. PLANNING VS IMPLEMENTATION MATRIX

Kategori sesuai instruksi Phase 2.

### 4.1 Fondasi Data & Akuntansi

| Planning | Expected behavior | Actual implementation | Evidence | Status | Gap | Risk | Recommended action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| §5 Skema 12 model | 12 model, 9 enum | 10 model, 5 enum | `schema.prisma` — 15 deklarasi | **Partially Implemented** | `cashier_shifts`, `audit_logs` tidak ada; 4 enum tidak ada; `StockSource` kurang `sale_void` & `opening` | Seluruh fitur shift, void, dan audit terblokir | Migrasi skema ke §5.15 |
| §5 Kolom | 27 kolom tambahan pada 8 tabel | Tidak ada | Perbandingan kolom per model | **Not Found** | Terbesar: 12 kolom pada `sales`, 6 pada `stock_transactions` | Model DPP, void, shift, kartu stok tidak dapat dibangun | Migrasi skema |
| §3.2 Presisi | Uang `DECIMAL(14,2)`, biaya satuan `(14,4)`, kuantitas `(14,3)` | Semua `DECIMAL(10,2)` | `schema.prisma` seluruh model | **Inconsistent** | Presisi 4 desimal untuk harga per gram/ml tidak tersedia | Akumulasi galat pembulatan pada HPP | Migrasi skema |
| §3.3 Zona waktu | `TIMESTAMPTZ`, batas periode Asia/Jakarta | `TIMESTAMP(3)`, `new Date()` polos | `schema.prisma`; `dashboard/page.tsx:13-15` | **Not Found** | Tidak ada `lib/period.ts` | Di Vercel (UTC) batas hari bergeser 7 jam; angka harian salah setelah deploy | Buat `lib/period.ts`, migrasi kolom waktu |
| §5.14 Indeks | 17 indeks laporan | 0 | `migration.sql:145-152` hanya 3 unique index | **Not Found** | Prisma tidak membuat indeks FK otomatis di PostgreSQL | Laporan periodik sequential scan | Migrasi SQL kustom |
| §5.3–5.12 CHECK | 17 batasan CHECK | 0 | `migration.sql` — tidak ada CHECK | **Not Found** | Termasuk 5 CHECK pada `sales` yang menegakkan rumus §3.4 | Baris yang melanggar rumus laba dapat tersimpan | Migrasi SQL kustom |
| §5.5 Unique resep | `UNIQUE(product_id, ingredient_id)` | Tidak ada | `schema.prisma` model Recipe | **Not Found** | Satu bahan dapat masuk dua kali dalam satu resep | HPP menu tergandakan diam-diam | Migrasi skema |
| §3.7 Snapshot HPP | Bekukan HPP per baris penjualan | Diimplementasikan | `cashier/actions.ts:91-98` | **Implemented** | — | — | Pertahankan |

### 4.2 Logika Bisnis Inti

| Planning | Expected behavior | Actual implementation | Evidence | Status | Gap | Risk | Recommended action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| §3.6 Average costing | HPP = Σ(takaran × `average_cost`) | `hpp` diisi `baseHpp` dan tidak pernah ditulis ulang | `cashier/actions.ts:61`; ESLint `'hpp' is never reassigned` | **Not Found** | Blok `hasRecipe` hanya validasi + potong stok, tidak menghitung HPP | Fitur inti skripsi tidak berfungsi; harga supplier tidak memengaruhi HPP | Buat `lib/costing.ts` setelah migrasi skema |
| §6.4 Update harga rata-rata saat pembelian | Perbarui `stock_value` & `average_cost` | Hanya `currentStock` di-`increment` | `admin/actions.ts:104-107` | **Partially Implemented** | Kolom targetnya belum ada | Harga rata-rata tidak pernah terbentuk | Migrasi skema lalu lengkapi |
| §7.3 Kartu stok — mutasi masuk | Baris `in` saat pembelian | Diimplementasikan | `admin/actions.ts:108-117` | **Partially Implemented** | Tanpa `balance_after`, `value_after`, `created_by`, `reference_type` | Kartu stok tidak dapat menampilkan saldo berjalan | Lengkapi setelah migrasi |
| §7.3 Kartu stok — mutasi keluar | Baris `out` saat penjualan | Tidak ada `stockTransaction.create` di seluruh berkas | `cashier/actions.ts:74-81` hanya `decrement` | **Not Found** | Kartu stok hanya berisi mutasi masuk | *Invariant* I-03 dan I-08 (§9) tidak dapat diuji; selisih stok tidak tertelusur | Tambahkan dalam transaksi checkout |
| §3.4 Model DPP | Subtotal → diskon → DPP → pajak → total | Hanya `totalAmount`, `totalHpp`, `grossProfit` | `cashier/actions.ts:84-114` | **Not Found** | Tidak ada diskon, pajak, uang diterima, kembalian | §7.8 tidak dapat dipenuhi | Migrasi skema lalu implementasi |
| §3.8 Laba bersih | Laba Kotor − OPEX | `grossProfitMonth - purchasesMonthTotal` | `dashboard/page.tsx:44-45`, label baris 57 | **Inconsistent** | Melanggar §3.1.A; `operational_expenses` tidak dipakai | Biaya bahan terhitung dua kali; angka laba bersih tidak bermakna | Ganti agregasi ke `operationalExpense` |
| §7.2 tingkat 2 — kunci baris | `SELECT ... FOR UPDATE` terurut `ingredient_id` | Cek stok dan `decrement` sebagai statement terpisah | `cashier/actions.ts:65-72` vs `75-81` | **Not Found** | Tidak ada row lock, tidak ada `CHECK (current_stock >= 0)` | Oversell pada checkout bersamaan; stok bisa negatif | Row lock + CHECK |
| §5.10 Nomor invoice | Sequence PostgreSQL | `` `TRX-${Date.now()}` `` | `cashier/actions.ts:101` | **Inconsistent** | Sequence belum dibuat | Tabrakan unique index pada checkout bersamaan | Buat sequence |
| §5.10 Invoice dikembalikan ke klien | Nomor server dipakai di antarmuka | Klien membangkitkan `Date.now()` sendiri | `CashierPOS.tsx:112` | **Inconsistent** | Nomor di layar ≠ nomor di basis data | Struk tidak dapat ditelusuri; fatal saat L-17 dibangun | Kembalikan invoice dari server action |
| §7.4 Void | Ubah status + balikkan stok + baris `sale_void` | Tidak ada | Tidak ada action terkait | **Not Found** | — | Kesalahan kasir tidak dapat dikoreksi | Setelah migrasi skema |
| §7.5 Opname & waste | Mutasi `adjustment` / `waste` | Tidak ada | Tidak ada action terkait | **Not Found** | Nilai enum belum ada | Gelas pecah tidak tercatat | Setelah migrasi skema |
| §7.6 Shift | Buka/tutup kas, `expected_cash` | Tidak ada | Tidak ada model maupun rute | **Not Found** | — | Tidak ada pertanggungjawaban kas kasir | Setelah migrasi skema |
| §3.6.C Saldo pembukaan | Dicatat sebagai transaksi `opening` | `currentStock` diisi langsung tanpa `purchases`/`stock_transactions` | `seed.ts:43-82` | **Inconsistent** | Riwayat perolehan kosong | `average_cost` akan bernilai 0; seluruh menu BOM jatuh ke fallback | Perbaiki seed |

### 4.3 Master Data & CRUD

| Planning | Expected behavior | Actual implementation | Evidence | Status | Gap | Risk | Recommended action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| §2.2 L-03 Bahan baku | CRUD + harga rata-rata + nilai persediaan | CRUD lengkap; kolom costing tidak ada | `IngredientTable.tsx` | **Partially Implemented** | Kolom `average_cost`/`stock_value` belum ada | Admin tidak melihat nilai persediaan | Setelah migrasi skema |
| §2.2 L-06 Produk | Tabel + form tambah/**ubah** + status aktif | `createProduct`, `toggleProductActive`, `deleteProduct`. **Tidak ada `updateProduct`** | Daftar `export async function` di `admin/actions.ts` | **Partially Implemented** | Produk tidak dapat diubah sama sekali | Harga jual tidak dapat diperbarui; satu-satunya jalan adalah menghapus, yang gagal bila menu pernah terjual | Tambahkan `updateProduct` |
| §2.1/§5.4 Resep BOM | Admin menyusun komposisi | **Tidak ada satu pun action Recipe.** `createProduct` mengunci `hasRecipe: false` | `admin/actions.ts:49`; tidak ada `recipe` di seluruh `src/` | **Not Found** | Resep hanya dapat dibuat lewat `seed.ts` | Admin tidak akan pernah bisa membuat menu ber-BOM dari aplikasi — memblokir fitur inti | Bangun L-07 |
| §5.4 `has_recipe` otomatis | Diperbarui saat resep ditambah/dihapus | Selalu `false` saat create | `admin/actions.ts:49` | **Not Found** | — | Menu baru tidak akan pernah ber-BOM | Bagian dari L-07 |
| §2.2 L-08 Pembelian | Form multi-item + riwayat | Diimplementasikan, transaksional | `PurchaseForm.tsx`, `admin/actions.ts:68-124` | **Implemented** | Belum memperbarui costing (lihat 4.2) | — | Lengkapi setelah migrasi |
| §2.2 L-09 Pengeluaran | Form + riwayat berkategori | Diimplementasikan | `ExpenseForm.tsx`, `expenses/page.tsx` | **Implemented** | Total bulan dihitung dari `take: 50` di memori | Angka total salah setelah 50 baris | Ganti ke `aggregate` |
| §2.1 Manajemen pengguna | Tambah kasir, reset password | Tidak ada | Tidak ada rute `/admin/users` | **Not Found** | `users.is_active` belum ada | Password bawaan seed tidak dapat diganti dari aplikasi | Setelah migrasi skema |

### 4.4 Keamanan & Otorisasi

| Planning | Expected behavior | Actual implementation | Evidence | Status | Gap | Risk | Recommended action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| §4.3 lapisan 1 | Proteksi request | Diimplementasikan | `middleware.ts:5-30` | **Implemented** | Konvensi `middleware` sudah usang di Next 16 (§4.3 menyebut `proxy.ts`) | Peringatan build | Rename ke `proxy.ts` |
| §4.3 lapisan 2 | Proteksi halaman | Diimplementasikan | `admin/layout.tsx:18-21`, `cashier/layout.tsx:6` | **Implemented** | — | — | Pertahankan |
| §4.3 lapisan 3 | `requireAdmin()` di setiap Server Action | **Tidak ada `lib/guard.ts`.** 7 action tanpa cek sesi sama sekali; 2 action cek sesi tanpa cek peran | `admin/actions.ts:8,21,34,41,54,61,152` tanpa `getSession`; baris 68,127 cek sesi saja | **Not Found** | Lapisan pengaman sesungguhnya belum ada | Server Action dipanggil lewat identitas aksi, bukan path — kasir berpotensi memanggil aksi admin | Buat `lib/guard.ts` |
| §8.1 `JWT_SECRET` | Wajib, tanpa nilai cadangan | Nilai cadangan *hardcode* di source | `lib/auth.ts:5-7`; `.env` hanya `DATABASE_URL`, `DIRECT_URL` | **Inconsistent** | — | Token sesi dapat ditempa oleh siapa pun yang membaca repositori | Set env + hapus fallback |
| §8.1 Pengelolaan rahasia | Hanya di env, repo hanya `.env.example` | `supabaseConnect.txt` di akar berisi password teks polos; juga terlacak Git pada commit `da342e9` | `git ls-files`; isi berkas | **Inconsistent** | Tidak ada `.env.example` | Akses tulis penuh ke basis data produksi | Rotasi password, keluarkan berkas, bersihkan riwayat |
| §8.1 Rate limit login | 5 kegagalan / 15 menit | Tidak ada | `login/actions.ts:9-48` | **Not Found** | — | Brute force sepele terhadap password bawaan | Tambahkan pembatasan |
| §8.1 Validasi `zod` | Seluruh Server Action | Tidak ada `zod` di dependency | `package.json`; `as string` + `parseFloat` di seluruh action | **Not Found** | Harga & kuantitas negatif diterima | Data korup dari input | Tambahkan validasi |
| §8.1 bcrypt cost ≥ 10 | — | `bcrypt.hash(..., 10)` | `seed.ts:15-16` | **Implemented** | — | — | Pertahankan |
| §8.1 Cookie & sesi | httpOnly, secure, sameSite, 8 jam | Diimplementasikan | `login/actions.ts:35-41`; `auth.ts:19` | **Implemented** | — | — | Pertahankan |
| §8.4 Audit trail | `audit_logs` | Tidak ada | — | **Not Found** | Model belum ada | Perubahan master data tidak tertelusur | Setelah migrasi skema |

### 4.5 Pelaporan & Antarmuka

| Planning | Expected behavior | Actual implementation | Evidence | Status | Gap | Risk | Recommended action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| §2.2 L-02 Dashboard | Kartu + grafik tren 30 hari + OPEX + laba bersih | Kartu + panel stok menipis + tabel transaksi. Tidak ada grafik | `dashboard/page.tsx` | **Partially Implemented** | Grafik tidak ada; laba bersih salah rumus | Owner tidak melihat tren | Perbaiki rumus, tambah grafik |
| §7.1 Safety stock | Indikator stok menipis | Diimplementasikan dengan perbandingan antar-kolom yang benar | `dashboard/page.tsx:35` `prisma.ingredient.fields.minimumStock` | **Implemented** | — | — | Pertahankan |
| §2.2 L-10 Riwayat penjualan | Tabel + filter tanggal & kasir + aksi void | Tabel `take: 100` tanpa filter dan tanpa void | `sales/page.tsx:7-14` | **Partially Implemented** | Total berlabel "Total Pendapatan" hanya menjumlahkan 100 baris | Angka menyesatkan | Filter + agregasi + void |
| §2.2 L-11 Laporan laba | Rentang tanggal + ekspor | Tidak ada rute | — | **Not Found** | — | Owner tidak punya laporan periodik | Bangun setelah 4.2 benar |
| §2.2 L-12 Nilai persediaan | Laporan per tanggal | Tidak ada rute | — | **Not Found** | Kolom `stock_value` belum ada | Rekonsiliasi §3.9 tidak mungkin | Setelah migrasi skema |
| §2.2 L-04 Kartu stok | Mutasi + saldo berjalan | Tidak ada rute | — | **Not Found** | — | Selisih fisik tidak tertelusur | Setelah migrasi skema |
| §2.2 L-16 Kasir | Grid + cari + keranjang + diskon + kembalian | Grid, cari, keranjang, metode bayar, blokir stok habis. Tanpa diskon & kembalian | `CashierPOS.tsx` | **Partially Implemented** | §7.8 belum ada | Kasir tidak dapat memberi diskon atau menghitung kembalian | Setelah migrasi skema |
| §7.2 tingkat 1 | Blokir menu bila stok kurang | Diimplementasikan, sudah memperhitungkan isi keranjang | `CashierPOS.tsx:37-55` | **Implemented** | — | — | Pertahankan |
| §7.7 Cetak struk | Modal termal 58/80mm | Kotak notifikasi hijau di panel | `CashierPOS.tsx:333-338` | **Not Found** | Tidak ada CSS `@media print` | Kafe tidak dapat memberi struk | Setelah invoice server benar |
| §2.2 L-17..L-20 | Struk, riwayat kasir, stok read-only, shift | Tidak ada rute | Build hanya menghasilkan `/cashier` | **Not Found** | 4 dari 5 layar kasir belum ada | Kasir hanya punya layar POS | Bertahap |
| §8.5 Paginasi | Seluruh daftar berpaginasi | `take` tetap 30/50/100 tanpa navigasi | `sales:100`, `expenses:50`, `purchases:30`, `dashboard:8` | **Not Found** | — | Data lama tidak terjangkau dari antarmuka | Tambahkan paginasi |
| §9 Pengujian | 25 kasus uji | 0 | Tidak ada berkas uji | **Not Found** | Tooling belum diputuskan (GAP-10 Phase 1) | Kriteria kelulusan §9.4 tidak terpenuhi | Tetapkan tooling |

---

## 5. REKAPITULASI STATUS

| Status | Jumlah item |
| :--- | :---: |
| Implemented | 9 |
| Partially Implemented | 11 |
| Inconsistent | 7 |
| Not Found | 24 |
| Unknown | 0 |

**Pembacaan yang jujur:** kategori terbesar adalah *Not Found*, dan sebagian besar di antaranya berbagi satu akar penyebab — **skema basis data belum dimigrasikan ke §5.15**. Dari 24 item *Not Found*, 15 terblokir langsung oleh ketiadaan model, kolom, atau enum.

Ini kabar yang relatif baik: gap-nya besar tetapi **terkonsentrasi**, bukan tersebar sebagai kerusakan acak. Fondasi yang sudah ada (transaksi atomik, snapshot HPP, validasi stok tingkat UI, alur pembelian) berbentuk benar dan dapat dilanjutkan, bukan harus dibongkar.

---

## 6. CATATAN UNTUK PHASE BERIKUTNYA

- Phase 3–4 akan mengaudit UI tanpa acuan design system resmi (GAP-02 Phase 1). Penilaian visual akan bersandar pada prinsip umum dan `hallmark-main`, dan itu harus dinyatakan sebagai keterbatasan.
- ST-07 (tidak ada komponen bersama) dan ST-01/02/03 (duplikasi) adalah bahan utama Phase 9.
- Temuan otorisasi pada 4.4 akan diperdalam di Phase 7.

---

**Output Phase 2 selesai. Lanjut ke Phase 3.**
