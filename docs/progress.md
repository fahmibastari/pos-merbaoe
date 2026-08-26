# PROGRES IMPLEMENTASI — POS KOPI MERBAOE

> **Dokumen ini adalah titik masuk setiap sesi kerja.** Baca bagian §1 lebih dulu, lalu
> lanjutkan dari task pertama yang berstatus `⬜ Belum`.

**Terakhir diperbarui:** 26 Agustus 2026 · Sesi 18
**Progres:** **25 / 40 task selesai**, 1 sebagian, 0 terblokir
**Berikutnya:** TASK-031 (asosiasi label dan semantik form)

---

## 1. CARA MELANJUTKAN

### Kalau ini sesi pertama Anda di proyek ini

Baca berurutan, jangan dilompati:

| Urut | Dokumen | Untuk apa |
| :---: | :--- | :--- |
| 1 | `README.md` | Dokumen desain sistem — kebijakan akuntansi, skema, NFR. **Ini acuan kebenaran.** |
| 2 | `docs/checkpoint.md` — “Status Implementasi Terkini” | Ringkasan kondisi Sesi 18, bukti verifikasi, dan titik lanjut |
| 3 | `docs/execute-step/phase11.md` | **Peta jalan resmi** — spesifikasi lengkap 40 task |
| 4 | `docs/design-direction.md` | Arah visual dan design token (untuk task UI saja) |
| 5 | Dokumen ini §3 | Status terkini dan apa yang harus dikerjakan berikutnya |

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
| ✅ Selesai | 25 |
| 🟡 Sebagian | 1 |
| ⛔ Terblokir | 0 |
| ⚠️ Menunggu keputusan | 3 |
| ⬜ Belum | 11 |
| **Total** | **40** |

Tiga task lain bertanda ⚠️ — belum terblokir, tetapi ada keputusan yang harus diambil sebelum dikerjakan (§4).

**Selesai sampai sesi ini:** TASK-002, TASK-030, TASK-003, TASK-004, TASK-005, TASK-006, TASK-008, TASK-007, TASK-010, TASK-009, TASK-011, TASK-012, TASK-013, TASK-021, TASK-026, TASK-014, TASK-015, TASK-016, TASK-017, TASK-022, TASK-018, TASK-019, TASK-020, TASK-027, TASK-032.

**Tidak ada blocker aktif.** D-13 selesai setelah reset database development mendapat persetujuan eksplisit dan migrasi target diterapkan.

### Ringkasan handoff Sesi 18

| Area | Kondisi saat ini |
| :--- | :--- |
| Fondasi database dan akuntansi | Skema target, constraint, sequence invoice, average costing, HPP snapshot, DPP/pajak, idempotensi, void, shift, opname, waste, dan kartu stok sudah selesai. |
| Alur operasional | POS, resep BOM, struk termal, rekonsiliasi shift, soft delete master, serta umpan balik Server Action sudah tersedia. |
| Fondasi UI | Komponen bersama, kontrak loading/empty/error, skeleton, not-found, tombol pending, dan modal aksesibel sudah selesai. |
| Verifikasi terakhir | TypeScript lulus; ESLint area aplikasi lulus; 36 test non-database lulus; build produksi lulus dengan 15 halaman; modal diuji langsung dengan keyboard. |
| Review pengujian | Empat integration test database tidak dijalankan pada recheck terakhir. Status, alasan, dan perintah ulang tercatat di §5.1. |
| Deploy dan rahasia | Belum ada deployment/Vercel sesuai keputusan pengembangan. Rotasi kredensial dan pembersihan riwayat Git tetap ditunda sampai sebelum penggunaan nyata. |
| Titik lanjut | Mulai dari TASK-031. Dependency TASK-021 dan TASK-026 sudah selesai; audit seluruh label, relasi pesan galat, `aria-invalid`, dan elemen dekoratif. |

---

## 3. DAFTAR TASK

Urutan mengikuti *Final Execution Order* pada `phase11.md` §4. Kolom **Dep** menyebut task yang harus selesai lebih dulu.

Legenda: `⬜ Belum` · `🔵 Dikerjakan` · `🟡 Sebagian` · `✅ Selesai` · `⛔ Terblokir` · `⚠️ Menunggu keputusan`

### Fondasi — keamanan & skema

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 1 | TASK-001 Amankan kredensial dan rahasia sesi | P0 | S | — | 🟡 | Sisi repo selesai. Rotasi & pembersihan riwayat **ditunda atas keputusan Anda** — lihat D-01 |
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
| 27 | TASK-031 Asosiasi label + semantik form | P1 | M | 021, 026 | ⬜ | 21 dari 23 field |
| 28 | TASK-029 Adopsi palet kertas Merbaoe | P1 | M | — | ⬜ | Nilai di `design-direction.md` §4 |
| 29 | TASK-028 Token tipografi/spasi/radius + hapus efek | P2 | **L** | 026 | ⚠️ | Keluarga serif belum final — §4 |
| 30 | TASK-033 Target sentuh + responsivitas tablet | P1 | M | 026, 028 | ⬜ | |

### Kelengkapan data & pelaporan

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 31 | TASK-024 Paginasi, filter tanggal, pencarian | P2 | M | 008, 026 | ⬜ | |
| 32 | TASK-023 Layar kasir: riwayat + stok read-only | P2 | S | 024 | ⬜ | |
| 33 | TASK-025 Laporan laba, persediaan, jejak audit | P2 | M | 007, 020, 024 | ⬜ | |

### Pengerasan & kualitas

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 34 | TASK-037 Lint bersih, kode mati, `proxy.ts` | P2 | S | 012 | ⬜ | |
| 35 | TASK-034 Optimalkan kueri checkout | P2 | S | 009 | ⬜ | |
| 36 | TASK-040 Tipe uang utuh di batas klien/server | P2 | M | 005 | ⬜ | |
| 37 | TASK-035 Infrastruktur pengujian + 25 kasus uji | P1 | **L** | 005, 011, 012 | ⚠️ | Tooling belum dipilih — §4 |
| 38 | TASK-036 Rate limit login + manajemen pengguna | P2 | M | 003, 021 | ⬜ | |

### Penyempurnaan

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 39 | TASK-038 Interaksi keyboard kasir | P2 | M | 014, 032, 033 | ⬜ | |
| 40 | TASK-039 Persistensi keranjang, copy, visual | P3 | S | 026, 028 | ⚠️ | Persistensi keranjang belum diputuskan — §4 |

---

## 4. MENUNGGU KEPUTUSAN ATAU AKSI ANDA

Task bertanda ⚠️ di §3 menunggu keputusan produk. Tidak ada task yang sedang terblokir.

| # | Butir | Menahan | Apa yang dibutuhkan |
| :---: | :--- | :--- | :--- |
| **D-01** | ~~Rotasi password Supabase~~ | — | **DITUNDA — risiko diterima kembali (25 Agu 2026).** Fokus saat ini pengembangan; kredensial yang ada tetap dipakai. Selesaikan sebelum aplikasi dipakai kafe secara nyata. |
| **D-02** | ~~Visibilitas repo GitHub~~ | — | Menyusul D-01. Tetap layak dicek agar tingkat risikonya diketahui. |
| **D-03** | ~~Izin membersihkan riwayat Git~~ | — | Menyusul D-01. |
| **D-04** | **`JWT_SECRET` produksi** | Deploy | **DITUNDA.** Belum ada rencana deploy/Vercel. Nilai lokal tersedia; secret produksi wajib diset sebelum deploy pertama. |
| **D-05** | ~~Basis data berisi data nyata?~~ | — | **SELESAI.** 30 baris, seluruhnya seed kecuali 1 transaksi uji. Keputusan: reset bersih. |
| **D-13** | ~~Izin menjalankan `prisma migrate`~~ | — | **SELESAI (25 Agu 2026).** Reset disetujui eksplisit; migrasi `align_with_design_doc` diterapkan dan database di-seed ulang. |
| **D-06** | ~~Spesifikasi idempotensi~~ | — | **SELESAI (26 Agu 2026).** Kontrak ditetapkan pada README §3.11 dan diterapkan oleh TASK-017. |
| **D-07** | ~~Jalur shift untuk Admin~~ | — | **SELESAI (26 Agu 2026).** Admin dan Kasir membuka shift miliknya melalui `/cashier/shift`; `/admin/shifts` untuk pengawasan seluruh shift. |
| **D-08** | ~~Pengeluaran dari uang laci~~ | — | **SELESAI (26 Agu 2026).** Pengeluaran laci ditautkan ke shift aktif dan mengurangi `expected_cash`; pengeluaran non-laci tidak memengaruhi rekonsiliasi kas. |
| **D-09** | **Keluarga serif** | TASK-028 | Cormorant Garamond / EB Garamond / Playfair Display — perlu perbandingan visual dengan logo pada 28px. |
| **D-10** | **Tooling pengujian** | TASK-035 | Framework + strategi basis data uji menyeluruh belum dipilih. TASK-017 sudah menyediakan pola integration test database terisolasi yang dapat dipakai kembali. |
| **D-11** | **Persistensi keranjang** | TASK-039 | README belum memutuskan state management. |
| **D-12** | **Favicon** | TASK-029 | Sebagian besar **teratasi** — empat varian PNG berlatar transparan sudah ada di `public/`. Yang masih kurang: potongan persegi untuk favicon (32×32, 180×180, `.ico`). Versi SVG prioritas rendah. |

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

Lint seluruh repo masih mempunyai dua error lama pada `test_db.js` dan warning dari
folder referensi `hallmark-main`; penyelesaiannya dijadwalkan pada TASK-037. Setelah
TASK-037, `npx eslint .` wajib lulus tanpa error.

Ditambah, khusus untuk task yang menyentuh logika finansial:

- [ ] Seluruh *Acceptance Criteria* task tersebut di `phase11.md` tercentang
- [ ] Angka hasil dapat dicocokkan dengan simulasi `README.md` §3.10
- [ ] Tidak ada regresi pada task yang sudah `✅`

### 5.1 Test integrasi database yang bersifat opt-in

Empat test berikut sengaja diskip bila `RUN_DB_TESTS` tidak bernilai `1`, karena test
membuat transaksi dan fixture sementara pada database development. Status **skip bukan
lulus**: hasil recheck terakhir hanya membuktikan 36 test non-database lulus. Keempat
skenario ini wajib direview dan dijalankan ulang setelah perubahan service finansial,
sebelum UAT, dan sebelum deployment pertama.

| Test | Skenario yang diverifikasi |
| :--- | :--- |
| `checkout-service.integration.test.ts` | TASK-017 — retry berurutan/bersamaan hanya membuat satu sale dan satu mutasi stok. |
| `void-sale-service.integration.test.ts` | I-07 — void mengembalikan nilai stok historis, mempertahankan average cost, dan keluar dari agregat. |
| `inventory-adjustment-service.integration.test.ts` | I-08 — opening + pembelian − HPP − waste ± penyesuaian sama dengan persediaan akhir. |
| `shift-service.integration.test.ts` | I-10 — shift wajib/unik dan kas seharusnya memasukkan pengeluaran laci. |

Perintah PowerShell untuk menjalankan seluruh test termasuk empat test database:

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
| **I-03** | Σ `total_cost` baris `stock_transactions` bertipe `out` = `sales.total_hpp` | TASK-012 |
| **I-08** | Persediaan awal + pembelian − HPP − waste ± penyesuaian = persediaan akhir | TASK-020 |

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
