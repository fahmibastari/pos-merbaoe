# PHASE 4 — UX & UX ENGINEERING

**Pertanyaan utama Phase 4:** *Apakah kasir dapat menyelesaikan pekerjaan secara cepat, jelas, dan dengan kemungkinan error serendah mungkin?*

**Metode:** penelusuran alur dari source code. Aplikasi tidak dijalankan; jumlah klik dihitung dari struktur JSX dan handler.
**Status output:** Selesai

---

## 1. JAWABAN RINGKAS

**Belum.** Alur inti kasir sudah benar bentuknya dan beberapa keputusannya bagus, tetapi tiga hal menghalangi kecepatan dan akurasi:

1. Kasir **tidak dapat menghitung kembalian** — perhitungan tunai dilakukan di kepala, padahal ini transaksi uang.
2. Setelah *checkout*, kasir **tidak mendapat bukti transaksi yang benar** — nomor invoice yang ditampilkan bukan nomor yang tersimpan.
3. **Tidak ada interaksi keyboard sama sekali** — seluruh alur menuntut mouse/sentuh, termasuk pencarian, penambahan item, dan pembayaran.

Di sisi admin, hambatan terbesar berbeda sifatnya: sebagian besar form **membuang pesan galat dari server**, sehingga kegagalan tampak seperti keberhasilan.

---

## 2. NAVIGATION & INFORMATION ARCHITECTURE

| Aspek | Temuan | Evidence | Status |
| :--- | :--- | :--- | :--- |
| Struktur navigasi admin | Sidebar tetap, 6 tujuan, label jelas berbahasa Indonesia, penanda aktif memakai warna + bobot + latar + border. | `AdminSidebar.tsx:7-14,84-99` | Baik |
| Pengelompokan | Urutan mengikuti alur kerja: Dashboard → Bahan Baku → Menu → Pembelian → Pengeluaran → Riwayat. Logis. | `AdminSidebar.tsx:8-13` | Baik |
| Kedalaman | Maksimal satu tingkat. Tidak ada menu bersarang. Tepat untuk enam tujuan. | — | Baik |
| Navigasi kasir | **Tidak ada navigasi.** `/cashier` adalah layar tunggal; satu-satunya jalan keluar adalah tombol Keluar. | `CashierPOS.tsx:159-161` | **Konsekuensi dari 4 layar kasir yang belum ada (L-17..L-20)** |
| Breadcrumb | Tidak ada. Tidak diperlukan pada kedalaman satu tingkat. | — | Netral |
| Penanda halaman aktif | `pathname === href \|\| pathname.startsWith(href + "/")` — sudah menangani sub-rute yang akan datang. | `AdminSidebar.tsx:84` | Baik |
| Admin → alur kasir | Admin memiliki hak POS (§2.1) tetapi sidebar admin **tidak memuat tautan ke `/cashier`**. Admin harus mengubah URL manual. | `AdminSidebar.tsx:7-14` | **Medium** |

---

## 3. ALUR INTI — TRANSAKSI KASIR

### 3.1 Alur aktual

```
Buka /cashier
  └─ Grid menu tampil (semua produk aktif, tanpa kategori)
       ├─ [opsional] Ketik di kolom Cari                 → filter client-side
       ├─ Klik kartu produk                              → +1 ke keranjang
       │    └─ Ulangi klik untuk qty>1, atau klik + di keranjang
       ├─ Pilih metode bayar (Tunai / QRIS / Transfer)   → default Tunai
       └─ Klik "Bayar Rp …"
            └─ Server: validasi stok → potong stok → simpan sale
                 ├─ Gagal → pesan galat di panel
                 └─ Sukses → kotak hijau "Transaksi Berhasil"
```

### 3.2 Penilaian per langkah

| Langkah | Temuan | Evidence | Status |
| :--- | :--- | :--- | :--- |
| Menemukan produk | Grid `minmax(160px, 1fr)` + pencarian substring case-insensitive. Untuk 5–20 menu, memadai. | `CashierPOS.tsx:117,172` | Baik |
| Menambah item | Satu klik = +1. Kartu menampilkan lencana kuantitas dan berubah warna saat ada di keranjang — umpan balik langsung yang baik. | `CashierPOS.tsx:228-248` | Baik |
| Kuantitas besar | **Untuk 10 cup harus 10 klik**, atau 1 klik + 9 klik tombol `+`. Tidak ada input kuantitas langsung. | `CashierPOS.tsx:75-95` | **Medium** |
| Menghapus item | Hanya lewat `−` berulang sampai qty 0. **Tidak ada tombol hapus baris.** | `CashierPOS.tsx:89-95` | **Medium** |
| Blokir stok habis | Kartu dinonaktifkan dan diberi lencana "Habis". Perhitungannya **sudah memperhitungkan item yang sudah ada di keranjang** — detail yang sering terlewat dan di sini benar. | `CashierPOS.tsx:37-55,180` | **Baik — kekuatan nyata** |
| Ringkasan | Menampilkan Subtotal, Est. HPP, Total, Est. Laba Kotor. | `CashierPOS.tsx:341-359` | Lihat UX-01 |
| Metode bayar | Tiga tombol, default `cash`, penanda terpilih jelas. | `CashierPOS.tsx:362-383` | Baik |
| Pembayaran tunai | **Tidak ada input "Uang Diterima" dan tidak ada kembalian.** | Tidak ada di `CashierPOS.tsx` | **High** |
| Konfirmasi | Tidak ada dialog konfirmasi sebelum menyimpan transaksi. | — | Netral — lihat catatan 3.3 |
| Bukti transaksi | Kotak hijau berisi total saja. Nomor invoice yang ditampilkan dibangkitkan ulang di klien. | `CashierPOS.tsx:112,333-338` | **High** |
| Setelah selesai | Keranjang dikosongkan; kotak sukses **tidak pernah hilang otomatis** dan tidak ada tombol tutup — bertahan sampai transaksi berikutnya. | `CashierPOS.tsx:111-114` | Low |

### 3.3 Temuan alur kasir

**UX-01 — Layar kasir menampilkan HPP dan laba kotor kepada kasir.** *Confirmed, Medium.*
Panel ringkasan menampilkan "Est. HPP" dan "Est. Laba Kotor" (`CashierPOS.tsx:346-357`). Dua pertimbangan:

- *Kebutuhan tugas:* kasir tidak memerlukan margin untuk menyelesaikan transaksi. Ini menambah beban kognitif pada panel yang seharusnya paling ringkas.
- *Kerahasiaan:* margin per transaksi adalah informasi yang biasanya tidak dibagikan ke tingkat kasir, dan layar kasir menghadap area yang dapat terlihat pelanggan.

README §2.1 memberi hak laporan laba hanya kepada Admin — menampilkannya di layar kasir tidak konsisten dengan pembagian peran tersebut. Perlu keputusan produk, bukan sekadar perubahan UI; ditandai **Requires verification** dengan pemilik kafe.

**UX-02 — Angka HPP/laba pada panel kasir tidak akan sama dengan yang tersimpan.** *Confirmed, Medium.*
Klien menghitung `totalHpp` dari `product.baseHpp` (`CashierPOS.tsx:72`), sementara README §3.6 menetapkan HPP dinamis dari `average_cost`. Setelah average costing diimplementasikan, angka "Est." di layar akan berbeda dari `hpp_snapshot` yang disimpan server. Label "Est." meredam sedikit, tetapi menampilkan dua angka berbeda untuk hal yang sama adalah sumber kebingungan.

**UX-03 — Tidak ada kalkulator kembalian.** *Confirmed, High.*
Untuk pembayaran tunai — metode default — kasir harus menghitung kembalian secara manual. Ini titik kesalahan paling umum pada POS mana pun, dan justru bagian yang paling mudah diotomatiskan. README §7.8 sudah merencanakannya; implementasinya belum ada.

**UX-04 — Bukti transaksi tidak dapat ditelusuri.** *Confirmed, High.*
`setLastReceipt({ invoiceId: `TRX-${Date.now()}` })` (`CashierPOS.tsx:112`) membangkitkan nomor **baru** di klien setelah server action selesai. Nomor ini secara pasti berbeda dari yang dibuat server (`cashier/actions.ts:101`). Saat ini nomor tersebut bahkan tidak ditampilkan — hanya total. Namun begitu L-17 (struk) dibangun di atas state ini, kasir akan mencetak nomor yang tidak ada di basis data.

**UX-05 — Tidak ada perlindungan terhadap klik ganda pada tombol Bayar.** *Confirmed, High.*
`disabled={cart.length === 0 || loading}` (`CashierPOS.tsx:389`) mencegah klik ganda **dalam satu sesi render**. Yang tidak tertangani: jaringan putus setelah request terkirim tetapi sebelum respons diterima. `loading` kembali `false` di `finally`-nya (baris 107), kasir mengira gagal, lalu mengulang — dan transaksi kedua tersimpan sebagai transaksi sah dengan nomor berbeda. Ini GAP-03 Phase 1 yang terlihat di lapisan UI.

**UX-06 — Konfirmasi sebelum menyimpan transaksi: tidak ada, dan itu tepat.**
Hallmark (`interaction-and-states.md`) menganjurkan "undo over confirm" dan melarang dialog konfirmasi untuk aksi berisiko rendah. Menyimpan transaksi adalah aksi yang diharapkan, bukan destruktif. **Bukan temuan** — dicatat agar tidak salah dinilai sebagai kekurangan. Yang justru dibutuhkan adalah jalur pemulihan setelahnya, yaitu void (§7.4), yang belum ada.

---

## 4. FORM EFFICIENCY (SISI ADMIN)

| Form | Temuan | Evidence | Status |
| :--- | :--- | :--- | :--- |
| Login | Label ber-`htmlFor`, `autoComplete` benar, state loading pada tombol, galat dengan `role="alert"`. **Form terbaik di aplikasi.** | `LoginForm.tsx:66-124` | Baik |
| Tambah bahan baku | Tiga field sebaris + tombol. Ringkas. | `IngredientTable.tsx:46-60` | Baik |
| Edit bahan baku | Modal dengan `defaultValue` terisi. | `IngredientTable.tsx:70-91` | Baik — kecuali CP-01 Phase 3 |
| Tambah menu | Empat kolom sebaris. **Tidak ada form ubah sama sekali.** | `ProductTable.tsx:46-60` | **High** — lihat UX-08 |
| Pembelian | Baris item dinamis, tambah/hapus baris, total dihitung langsung saat mengetik. **Fitur terbaik di sisi admin.** | `PurchaseForm.tsx:26-30,67-93` | Baik |
| Pengeluaran | Empat field vertikal, tanggal ter-*default* hari ini. | `ExpenseForm.tsx:23-45` | Baik |

**UX-07 — Pesan galat server dibuang oleh seluruh form admin.** *Confirmed, High.*
`createIngredient`, `createProduct`, `createExpense`, dan `createPurchase` semuanya mengembalikan `{ error: "..." }`. Keempat pemanggilnya mengabaikan nilai kembalian:

| Pemanggil | Baris | Kode |
| :--- | :--- | :--- |
| `IngredientTable.tsx` | 15 | `await createIngredient(new FormData(...))` |
| `ProductTable.tsx` | 16 | `await createProduct(new FormData(...))` |
| `ExpenseForm.tsx` | 13 | `await createExpense(new FormData(...))` |
| `PurchaseForm.tsx` | 35 | `await createPurchase(new FormData(...))` |

Lebih jauh, `PurchaseForm.tsx:36-39` dan `ExpenseForm.tsx:14-17` menampilkan **pesan sukses tanpa syarat** setelah `await` selesai. Bila validasi server menolak, pengguna melihat "✓ Pembelian berhasil disimpan. Stok sudah diperbarui." padahal tidak ada yang tersimpan. Ini bukan sekadar umpan balik yang hilang — ini umpan balik yang **salah**.

**UX-08 — Produk tidak dapat diubah.** *Confirmed, High.*
Tidak ada `updateProduct` (Phase 2 §4.3). Untuk mengubah harga jual, satu-satunya jalur adalah hapus lalu buat ulang — dan penghapusan akan gagal untuk menu yang pernah terjual karena relasi `SaleDetail.product` bersifat Restrict. Praktis: **harga menu tidak dapat diubah setelah menu pernah laku.** Untuk kafe yang menyesuaikan harga secara berkala, ini menghentikan pekerjaan.

**UX-09 — Validasi hanya bergantung pada atribut HTML.** *Confirmed, Medium.*
Field memakai `required` dan `type="number"`, tetapi tanpa `min`. Harga jual negatif, kuantitas negatif, dan `unitCost` negatif diterima browser dan diteruskan ke `parseFloat` tanpa pemeriksaan (`admin/actions.ts:43-44,76-77`). Tidak ada validasi sisi server (README §8.1 mensyaratkan `zod`; tidak ada di `package.json`).

---

## 5. KEYBOARD INTERACTION & FOCUS MANAGEMENT

| Aspek | Temuan | Evidence | Status |
| :--- | :--- | :--- | :--- |
| Handler keyboard | **Nol.** Tidak ada satu pun `onKeyDown`, `onKeyUp`, atau `onKeyPress` di seluruh `src/`. | `grep -rn 'onKeyDown\|onKeyUp' src/` → tidak ada | **High** |
| Escape menutup modal | Tidak ada. Modal hanya tertutup lewat klik overlay atau tombol Batal. | `IngredientTable.tsx:65-93` | **High** |
| Focus trap pada modal | Tidak ada. Tab akan keluar dari modal ke konten di belakangnya. | `IngredientTable.tsx:65-93` | **High** |
| Fokus dikembalikan setelah modal tutup | Tidak ada. | — | Medium |
| Autofocus | Tidak ada di mana pun, termasuk kolom Cari pada layar kasir dan field pertama modal. | — | Medium |
| Shortcut kasir | Tidak ada. Tidak ada Enter untuk bayar, tidak ada jalan pintas ke pencarian, tidak ada dukungan barcode scanner (yang bekerja sebagai keyboard input + Enter). | — | **High untuk POS** |
| Urutan tab | Mengikuti urutan DOM. Pada layar kasir, urutan DOM adalah grid produk dahulu (bisa puluhan tombol) baru panel keranjang — sehingga mencapai tombol Bayar lewat keyboard menuntut banyak Tab. | `CashierPOS.tsx:119-409` | Medium |
| Indikator fokus | `.input:focus` punya border + ring (`globals.css:216-219`). `.btn` tidak mendefinisikan gaya fokus, tetapi juga tidak menyetel `outline: none` — sehingga outline bawaan peramban tetap berlaku. **Bukan pelanggaran**, hanya belum diseragamkan. | `globals.css:195-219` | Low |

**UX-10 — Layar kasir sepenuhnya bergantung pada penunjuk.** *Confirmed, High.*
POS yang cepat hampir selalu dioperasikan dengan keyboard atau pemindai. Tanpa satu pun handler keyboard, setiap transaksi menuntut perpindahan tangan ke mouse/layar sentuh untuk setiap item. Dikombinasikan dengan UX-03 (kembalian dihitung manual), kecepatan per transaksi menjadi masalah struktural, bukan detail.

---

## 6. FEEDBACK, LOADING, EMPTY & ERROR STATES

| State | Cakupan | Temuan |
| :--- | :--- | :--- |
| Loading — tombol | 5 dari 6 form punya state loading pada tombol (spinner atau label "Menyimpan…"). `IngredientTable` dan `ProductTable` **tidak punya** — tombol Simpan tidak berubah selama proses. | `LoginForm:106`, `PurchaseForm:107`, `ExpenseForm:48`, `CashierPOS:393` vs `IngredientTable:59`, `ProductTable:59` |
| Loading — halaman | Tidak ada `loading.tsx` di rute mana pun; tidak ada Suspense. Setiap navigasi memblokir sampai kueri server selesai, tanpa indikasi. | Struktur `src/app/` |
| Loading — skeleton | Tidak ada. Hallmark menganjurkan skeleton untuk konten berbentuk tetap seperti tabel. | — |
| Empty | Ada di 7 tempat, tetapi tanpa standar dan **tanpa satu pun aksi perbaikan**. "Belum ada produk" tidak menawarkan tombol Tambah Menu. | Phase 3 CP-04 |
| Error — form | Hanya login yang menampilkan galat. Lihat UX-07. | — |
| Error — halaman | Tidak ada `error.tsx`. Galat Prisma yang tidak tertangkap akan memunculkan layar galat Next.js. | Struktur `src/app/` |
| Error — semantik | Login memakai `role="alert"`; panel galat kasir tidak. Tidak konsisten. | `LoginForm:46` vs `CashierPOS:326-330` |
| Sukses | Tiga implementasi berbeda (Phase 3 CP-03). Dua di antaranya menampilkan sukses tanpa memeriksa hasil (UX-07). | — |
| Undo | Tidak ada di mana pun. | — |

**UX-11 — Penghapusan destruktif memakai `window.confirm()`.** *Confirmed, Medium.*
`IngredientTable.tsx:27` dan `ProductTable.tsx:29` memakai `confirm()` bawaan peramban. Dua masalah:

- Dialog native tidak dapat digayakan dan memutus konteks visual — tetapi ini soal selera dan **bukan** temuan utama.
- Yang nyata: bila penghapusan **gagal** karena batasan FK (bahan dipakai resep, produk pernah terjual), tidak ada penanganan galat sama sekali. Server action akan melempar dan antarmuka diam. Pengguna melihat baris tetap ada tanpa penjelasan. Ini gabungan UX-07 dengan D4 (Phase 2).

---

## 7. SEARCH, FILTER, PAGINATION

| Aspek | Temuan | Evidence | Status |
| :--- | :--- | :--- | :--- |
| Pencarian kasir | Substring, case-insensitive, client-side, instan tanpa debounce. Untuk daftar kecil ini tepat — debounce justru akan memperlambat. | `CashierPOS.tsx:117` | Baik |
| Pencarian admin | Tidak ada di halaman mana pun — termasuk Riwayat Penjualan dan Bahan Baku. | Seluruh `admin/**` | **Medium** |
| Filter tanggal | Tidak ada. Dashboard terkunci pada hari ini + bulan berjalan; Riwayat Penjualan menampilkan 100 terakhir tanpa filter. | `dashboard:14-15`, `sales:9` | **High** — README §2.2 L-10/L-11 mensyaratkannya |
| Sorting | Tidak ada kolom yang dapat diurutkan. Urutan ditetapkan server (`orderBy` tetap). | Seluruh halaman tabel | Medium |
| Paginasi | **Tidak ada di mana pun.** `take` tetap: 100 (sales), 50 (expenses), 30 (purchases), 8 (dashboard). Tidak ada navigasi ke data lama. | Phase 2 §4.5 | **High** |

**UX-12 — Total pada halaman daftar dihitung dari halaman pertama saja.** *Confirmed, High.*
`sales/page.tsx:16-17` menjumlahkan 100 baris hasil `take` lalu melabelinya "Total Pendapatan" dan "Total Laba Kotor" tanpa keterangan periode. `expenses/page.tsx:21-23` melakukan hal serupa untuk "Total Pengeluaran Bulan Ini" dari `take: 50`. Ini bukan sekadar masalah paginasi — angka yang ditampilkan **salah** begitu data melewati ambang tersebut, dan tidak ada indikasi apa pun kepada pengguna.

---

## 8. RINGKASAN & FORMAT ALUR PERBAIKAN

Untuk tiga alur bermasalah terbesar, memakai format yang diminta Phase 11.

### Alur A — Pembayaran tunai

```
Current Flow
  Pilih Tunai → klik Bayar → transaksi tersimpan
  → kasir menghitung kembalian di kepala
↓
Problem
  Titik kesalahan uang paling umum tidak dibantu sistem (UX-03).
  Tidak ada catatan berapa uang diterima → rekonsiliasi kas shift
  tidak dapat diverifikasi per transaksi.
↓
Target Flow
  Pilih Tunai → input "Uang Diterima" (dengan tombol nominal cepat)
  → kembalian tampil seketika → Bayar ditolak bila uang < total
  → cash_received & change_amount tersimpan
↓
Expected Improvement
  Kesalahan kembalian hilang; §7.6 (expected_cash) dapat diverifikasi.
```

### Alur B — Bukti transaksi

```
Current Flow
  Checkout sukses → kotak hijau berisi total
  → nomor invoice dibangkitkan ulang di klien (tidak dipakai)
↓
Problem
  Tidak ada bukti yang dapat ditelusuri (UX-04). Kasir tidak dapat
  mencari kembali transaksi. Struk (L-17) akan mencetak nomor palsu.
↓
Target Flow
  Server action mengembalikan { invoiceNumber, saleId }
  → panel menampilkan nomor asli + tombol "Cetak Struk"
  → struk dirender dari data server, bukan state klien
↓
Expected Improvement
  Setiap transaksi dapat ditelusuri; L-17 punya fondasi benar.
```

### Alur C — Input master data admin

```
Current Flow
  Isi form → Simpan → (server menolak) → pesan sukses tetap tampil
↓
Problem
  Umpan balik salah, bukan sekadar hilang (UX-07). Admin percaya
  data tersimpan padahal tidak.
↓
Target Flow
  Server action mengembalikan bentuk hasil seragam
  → klien membaca hasil → sukses hanya bila benar-benar sukses
  → galat tampil inline dekat field yang bermasalah
↓
Expected Improvement
  Kepercayaan terhadap data pulih; prasyarat validasi zod (§8.1).
```

---

## 9. TABEL TEMUAN PHASE 4

| Kode | Temuan | Severity | Status |
| :--- | :--- | :--- | :--- |
| UX-03 | Tidak ada input uang diterima & kalkulator kembalian | High | Confirmed |
| UX-04 | Nomor invoice di klien ≠ nomor tersimpan; bukti tidak tertelusur | High | Confirmed |
| UX-05 | Tidak ada perlindungan pengiriman ganda saat jaringan tidak stabil | High | Confirmed |
| UX-07 | Empat form membuang galat server; dua menampilkan sukses palsu | High | Confirmed |
| UX-08 | Produk tidak dapat diubah; harga menu terkunci setelah terjual | High | Confirmed |
| UX-10 | Nol interaksi keyboard; tidak ada dukungan pemindai | High | Confirmed |
| UX-12 | Total daftar dihitung dari `take` sehingga salah pada data besar | High | Confirmed |
| — | Tidak ada filter tanggal & paginasi (L-10/L-11) | High | Confirmed |
| UX-01 | HPP & laba kotor tampil di layar kasir | Medium | Requires verification |
| UX-02 | Angka HPP klien akan menyimpang dari `hpp_snapshot` server | Medium | Confirmed |
| UX-09 | Tidak ada `min` pada input numerik; tidak ada validasi server | Medium | Confirmed |
| UX-11 | Penghapusan yang gagal karena FK tidak memberi umpan balik | Medium | Confirmed |
| — | Escape/focus trap/fokus kembali pada modal tidak ada | High | Confirmed |
| — | Kuantitas besar butuh klik berulang; tidak ada hapus baris | Medium | Confirmed |
| — | Admin tidak punya tautan ke layar kasir | Medium | Confirmed |
| — | Tidak ada `loading.tsx` / `error.tsx` / skeleton | Medium | Confirmed |
| — | Empty state tanpa aksi perbaikan | Medium | Confirmed |
| — | Dua form tanpa state loading tombol | Low | Confirmed |
| — | Kotak sukses kasir tidak pernah hilang otomatis | Low | Confirmed |

---

**Output Phase 4 selesai. Lanjut ke Phase 5.**
