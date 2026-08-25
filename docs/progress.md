# PROGRES IMPLEMENTASI — POS KOPI MERBAOE

> **Dokumen ini adalah titik masuk setiap sesi kerja.** Baca bagian §1 lebih dulu, lalu
> lanjutkan dari task pertama yang berstatus `⬜ Belum`.

**Terakhir diperbarui:** 24 Agustus 2026 · Sesi 2
**Progres:** **6 / 40 task selesai**, 1 sebagian, 3 terblokir
**Terblokir:** TASK-003, TASK-009, TASK-010 — seluruhnya oleh D-13 (izin menjalankan `prisma migrate`)

---

## 1. CARA MELANJUTKAN

### Kalau ini sesi pertama Anda di proyek ini

Baca berurutan, jangan dilompati:

| Urut | Dokumen | Untuk apa |
| :---: | :--- | :--- |
| 1 | `README.md` | Dokumen desain sistem — kebijakan akuntansi, skema, NFR. **Ini acuan kebenaran.** |
| 2 | `docs/checkpoint.md` §1 | Kondisi aplikasi saat ini dalam satu halaman |
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
| ✅ Selesai | 6 |
| 🟡 Sebagian | 1 |
| ⛔ Terblokir | 3 |
| ⬜ Belum | 30 |
| **Total** | **40** |

Lima task lain bertanda ⚠️ — belum terblokir, tetapi ada keputusan yang harus diambil sebelum dikerjakan (§4).

**Selesai sesi ini:** TASK-002, TASK-030, TASK-004, TASK-005, TASK-006, TASK-008, TASK-007.

**Penghalang tunggal saat ini:** perintah `prisma migrate` diblokir oleh pengaman izin (D-13). Tiga task fondasi menunggu itu, dan sesudahnya 15 fitur lain baru bisa dikerjakan.

---

## 3. DAFTAR TASK

Urutan mengikuti *Final Execution Order* pada `phase11.md` §4. Kolom **Dep** menyebut task yang harus selesai lebih dulu.

Legenda: `⬜ Belum` · `🔵 Dikerjakan` · `🟡 Sebagian` · `✅ Selesai` · `⛔ Terblokir`

### Fondasi — keamanan & skema

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 1 | TASK-001 Amankan kredensial dan rahasia sesi | P0 | S | — | 🟡 | Sisi repo selesai. Rotasi & pembersihan riwayat **ditunda atas keputusan Anda** — lihat D-01 |
| 2 | TASK-002 Verifikasi status data & strategi migrasi | P0 | S | — | ✅ | 30 baris, hanya 1 transaksi uji. **Keputusan: reset bersih** |
| 3 | TASK-030 Tabular numerals | P1 | S | — | ✅ | `td`, `.stat-value`, utilitas `.num`; 7 titik nominal kasir |
| 4 | TASK-003 Migrasi skema + constraint + indeks | P0 | **L** | 002 | ⛔ | Skema sudah ditulis & `prisma validate` lolos. **Penerapan terblokir D-13** |
| 5 | TASK-004 `lib/guard.ts` + otorisasi Server Action | P0 | S | — | ✅ | 10 aksi terjaga; `AuthorizationError` terpisah dari galat bisnis |
| 6 | TASK-005 `lib/period.ts` + `lib/money.ts` | P0 | S | 003 | ✅ | 18 uji lulus di TZ=UTC **dan** TZ=Asia/Jakarta (U-09, U-10) |
| 7 | TASK-006 Validasi `zod` | P0 | M | 003 | ✅ | **S5 tertutup.** 20 uji lulus; `lib/validation.ts` |
| 8 | TASK-008 Agregasi basis data | P0 | S | 005 | ✅ | `expenses` & `sales` memakai `aggregate`; label menyebut cakupan |
| 9 | TASK-007 Rumus laba bersih + label | P0 | S | 005, 008 | ✅ | `lib/profit.ts`, 10 uji cocok dengan simulasi README §3.10 |
| 10 | TASK-010 Nomor invoice dari sequence | P0 | S | 003 | ⛔ | Butuh `sales_invoice_seq` dari migrasi — D-13 |
| 11 | TASK-009 Race condition stok | P0 | M | 003, 006 | ⛔ | Butuh `CHECK (current_stock >= 0)` dari migrasi — D-13 |

### Fitur inti — average costing

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 12 | TASK-011 `lib/costing.ts` + average costing pembelian | P0 | M | 003, 005 | ⬜ | |
| 13 | TASK-012 HPP dinamis + kartu stok keluar | P0 | M | 009, 011 | ⬜ | **Fitur inti skripsi.** Invariant I-03 |
| 14 | TASK-013 Perbaiki seed → transaksi `opening` | P1 | S | 011 | ⬜ | Tanpa ini average cost = 0 |
| 15 | TASK-021 Bentuk hasil Server Action seragam | P1 | M | 004, 006 | ⬜ | |
| 16 | TASK-026 Ekstrak komponen bersama | P1 | M | 021 | ⬜ | **Harus sebelum 12 layar baru** |

### Kelengkapan alur POS

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 17 | TASK-014 Model DPP: diskon, pajak, kembalian | P1 | M | 003, 006, 012 | ⬜ | |
| 18 | TASK-015 Penyusun resep BOM | P1 | M | 003, 004, 011 | ⬜ | Tanpa ini admin tak bisa buat menu BOM |
| 19 | TASK-016 Ubah produk + soft delete | P1 | S | 003, 021 | ⬜ | |
| 20 | TASK-017 Idempotensi transaksi | P1 | M | 003, 010 | ⚠️ | Spesifikasi belum ada di README — §4 |
| 21 | TASK-022 Struk termal | P1 | M | 010, 014 | ⬜ | |
| 22 | TASK-018 Pembatalan transaksi (void) | P1 | M | 003, 012 | ⬜ | |
| 23 | TASK-019 Shift kasir | P1 | M | 003, 014 | ⚠️ | Dua keputusan tertunda — §4 |
| 24 | TASK-020 Opname, waste, kartu stok | P2 | M | 011, 012 | ⬜ | Invariant I-08 |

### Kualitas antarmuka

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 25 | TASK-027 Kontrak tiga state | P1 | M | 021, 026 | ⬜ | |
| 26 | TASK-032 Modal yang dapat diakses | P1 | S | 026 | ⬜ | |
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

Task bertanda ⚠️ atau ⛔ di §3 tertahan di sini. Selesaikan agar tidak menghambat.

| # | Butir | Menahan | Apa yang dibutuhkan |
| :---: | :--- | :--- | :--- |
| **D-01** | ~~Rotasi password Supabase~~ | — | **DITUNDA — risiko diterima (24 Agu 2026).** Anda memutuskan memakai kredensial yang ada dulu. Yang perlu diingat: password teks polos masih dapat diambil dari commit `da342e9` di `origin/dev`. Selesaikan sebelum aplikasi dipakai kafe secara nyata. |
| **D-02** | ~~Visibilitas repo GitHub~~ | — | Menyusul D-01. Tetap layak dicek agar tingkat risikonya diketahui. |
| **D-03** | ~~Izin membersihkan riwayat Git~~ | — | Menyusul D-01. |
| **D-04** | **`JWT_SECRET` produksi** | Deploy | Nilai lokal sudah dibuatkan dan aplikasi kini gagal start tanpanya. **Wajib diset di Vercel sebelum deploy berikutnya**, jika tidak build produksi akan gagal. |
| **D-05** | ~~Basis data berisi data nyata?~~ | — | **SELESAI.** 30 baris, seluruhnya seed kecuali 1 transaksi uji. Keputusan: reset bersih. |
| **D-13** | **Izin menjalankan `prisma migrate`** | **TASK-003, TASK-009, TASK-010** | Perintah `prisma migrate reset` dan `prisma migrate diff` diblokir pengaman izin karena bersifat destruktif terhadap basis data. **Ini penghalang tunggal terbesar saat ini.** Lihat §7 untuk perintah yang perlu Anda jalankan. |
| **D-06** | **Spesifikasi idempotensi** | TASK-017 | README belum memodelkannya (GAP-03 Phase 1). Perlu ditambahkan lebih dulu. |
| **D-07** | **Jalur shift untuk Admin** | TASK-019 | Kontradiksi C-04: Admin punya hak POS tetapi tidak punya layar buka shift. |
| **D-08** | **Pengeluaran dari uang laci** | TASK-019 | GAP-07: bila kafe bayar pengeluaran kecil pakai uang laci, `expected_cash` akan selalu selisih. |
| **D-09** | **Keluarga serif** | TASK-028 | Cormorant Garamond / EB Garamond / Playfair Display — perlu perbandingan visual dengan logo pada 28px. |
| **D-10** | **Tooling pengujian** | TASK-035 | Framework + strategi basis data uji. Kasus I-05 (konkurensi) butuh harness khusus. |
| **D-11** | **Persistensi keranjang** | TASK-039 | README belum memutuskan state management. |
| **D-12** | **Favicon** | TASK-029 | Sebagian besar **teratasi** — empat varian PNG berlatar transparan sudah ada di `public/`. Yang masih kurang: potongan persegi untuk favicon (32×32, 180×180, `.ico`). Versi SVG prioritas rendah. |

---

## 4b. LANGKAH YANG PERLU ANDA JALANKAN SENDIRI (D-13)

Migrasi skema tidak dapat saya jalankan karena perintahnya diblokir pengaman izin.
Jalankan tiga perintah berikut di terminal, lalu pekerjaan bisa dilanjutkan.

```bash
# 1. Reset basis data ke keadaan bersih.
#    AMAN: sudah diverifikasi hanya berisi data seed + 1 transaksi uji (TASK-002).
npx prisma migrate reset --force

# 2. Buat migrasi dari skema baru yang sudah ada di prisma/schema.prisma.
#    Skema tersebut sudah lolos `npx prisma validate`.
npx prisma migrate dev --name align_with_design_doc

# 3. Bangkitkan ulang Prisma Client agar tipe TypeScript mengikuti skema baru.
npx prisma generate
```

Setelah itu **kode aplikasi akan gagal kompilasi** — itu diharapkan. Kolom baru
seperti `sales.subtotal_amount`, `sales_details.product_name`, dan
`stock_transactions.balance_after` bersifat `NOT NULL` sehingga pemanggilnya
harus dilengkapi. Perbaikan itu bagian dari TASK-003 dan akan dikerjakan pada
sesi berikutnya.

Belum termasuk dalam ketiga perintah di atas, dan menyusul sebagai migrasi SQL
kustom pada TASK-003: **17 batasan `CHECK`, 17 indeks, satu partial unique index,
dan sequence `sales_invoice_seq`.**

---

## 5. PEMERIKSAAN SEBELUM MENANDAI TASK SELESAI

Jalankan seluruhnya. Bila ada yang gagal, task belum selesai.

```bash
npx tsc --noEmit      # wajib lulus
npm run build         # wajib lulus
npx eslint .          # wajib lulus mulai TASK-037
npm test              # wajib lulus mulai TASK-035
```

Ditambah, khusus untuk task yang menyentuh logika finansial:

- [ ] Seluruh *Acceptance Criteria* task tersebut di `phase11.md` tercentang
- [ ] Angka hasil dapat dicocokkan dengan simulasi `README.md` §3.10
- [ ] Tidak ada regresi pada task yang sudah `✅`

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

Empat dari enam modul `lib/` yang diwajibkan README §4.2 kini ada. Yang tersisa: `lib/costing.ts` (TASK-011).

---
