# PHASE 8 — CONTENT & PRODUCT QUALITY

**Objek audit:** seluruh teks antarmuka pada `src/app/**/*.tsx` dan pesan galat pada `actions.ts`.
**Status output:** Selesai

---

## 1. RINGKASAN

Kualitas copywriting **secara umum baik dan konsisten**. Bahasa Indonesia yang dipakai natural, tidak diterjemahkan secara kaku, dan sudah memakai istilah domain yang benar (HPP, laba kotor, bahan baku, stok minimum). Label tombol memakai kata kerja, judul halaman memakai frasa benda — pemisahan yang tepat dan diterapkan konsisten.

Masalah yang ditemukan terpusat pada tiga hal:

1. **Satu label finansial yang salah secara substansi**, bukan sekadar redaksional.
2. **Istilah teknis basis data bocor ke antarmuka** di beberapa tempat.
3. **Pesan galat tidak lengkap** — sebagian tidak pernah ditampilkan, sebagian meneruskan galat mentah.

---

## 2. TERMINOLOGI

### 2.1 Konsistensi istilah domain

| Istilah | Pemakaian | Penilaian |
| :--- | :--- | :--- |
| "Bahan Baku" | Konsisten di sidebar, judul halaman, form, dan pesan galat. Tidak pernah bercampur dengan "bahan", "ingredient", atau "material". | ✅ Konsisten |
| "Menu & Produk" | Sidebar dan judul halaman memakai "Menu & Produk"; form memakai "Nama Menu" dan "Tambah Menu Baru"; dialog konfirmasi memakai "produk ini". | ⚠️ Lihat CT-01 |
| "Stok" | Konsisten: "Stok Saat Ini", "Stok Minimum", "Stok Menipis", "Habis". | ✅ Konsisten |
| "Laba Kotor" | Konsisten di dashboard, riwayat, dan panel kasir. | ✅ Konsisten |
| "HPP" | Dipakai sebagai singkatan tanpa pernah dijabarkan di antarmuka. Untuk owner kafe yang menjadi target pengguna, ini istilah akuntansi yang mungkin belum familiar. | ⚠️ Lihat CT-04 |
| "Pengeluaran" vs "Pembelian" | Dibedakan dengan benar dan konsisten — dua modul terpisah dengan nama yang tidak tumpang tindih. Ini pembedaan penting secara akuntansi (§3.1 README) dan bahasanya sudah mencerminkannya. | ✅ Baik |
| "Kasir" | Dipakai untuk dua makna: peran pengguna ("Kasir: admin") dan nama layar. Ambiguitasnya rendah karena konteksnya selalu jelas. | Observation |

### CT-01 · "Menu" dan "Produk" dipakai bergantian — **Low**

Satu modul memakai tiga penyebutan: judul "Menu & Produk", form "Nama Menu" / "Tambah Menu Baru", tabel kolom "Nama Menu", tetapi dialog hapus berbunyi "Yakin hapus **produk** ini?" dan empty state berbunyi "Belum ada **produk**".

Untuk kafe, "menu" adalah istilah yang lebih natural. Rekomendasi: pilih "Menu" untuk seluruh teks yang dilihat pengguna, dan sisakan "produk" hanya untuk nama teknis di kode.

**Evidence:** `products/page.tsx:17`, `ProductTable.tsx:39,45,48,71,81`, `ProductTable.tsx:29`.

---

## 3. LABEL & KETERANGAN

### CT-02 · Label laba bersih menyatakan rumus yang keliru — **High**

Kartu dashboard "Laba Bersih Bulan Ini" diberi subteks **"Laba Kotor − Pembelian Bahan"**.

Ini bukan galat redaksional — teksnya **secara akurat mendeskripsikan kode yang salah**. README §3.1.A menyatakan tegas bahwa pembelian bahan baku bukan beban periode dan tidak boleh mengurangi laba. Subteks yang benar adalah "Laba Kotor − Beban Operasional".

Yang membuat temuan ini penting untuk Phase 8 secara khusus: label tersebut **mengajarkan model mental yang salah kepada owner**. Seorang pemilik kafe yang membaca kartu ini akan menyimpulkan bahwa belanja supplier memang seharusnya memotong laba bulan berjalan — persis kesalahpahaman akuntansi yang ingin dihilangkan sistem ini.

Label ini harus diperbaiki bersamaan dengan rumusnya, tidak boleh terpisah.

**Evidence:** `dashboard/page.tsx:57`.

### CT-03 · Istilah teknis basis data bocor ke antarmuka — **Medium**

| Teks | Lokasi | Masalah |
| :--- | :--- | :--- |
| "HPP Dasar (Rp)" | `ProductTable.tsx:56` | "Dasar" adalah terjemahan langsung kolom `base_hpp`. Bagi pengguna, maknanya tidak jelas — kapan HPP "dasar" dipakai dan kapan tidak? Alternatif: "HPP Manual (jika tanpa resep)". |
| Badge "BOM" / "Manual" | `ProductTable.tsx:97` | "BOM" adalah singkatan teknis manufaktur (*Bill of Materials*). Pemilik kafe tidak memakai istilah ini. Alternatif: "Pakai Resep" / "HPP Manual". |
| "Est. HPP" | `CashierPOS.tsx:347` | Ganda masalahnya: singkatan "Est." tidak dijabarkan, dan HPP tidak perlu ditampilkan kepada kasir sama sekali (Phase 4 UX-01). |

### CT-04 · Singkatan tidak pernah dijabarkan — **Low**

"HPP", "OPEX" (hanya di README, tidak di UI), "BOM", "QRIS", dan "Est." muncul tanpa penjelasan. QRIS aman — istilah umum di Indonesia. HPP dan BOM tidak.

Rekomendasi ringan: jabarkan sekali pada kemunculan pertama di setiap halaman, atau sediakan tooltip. Bukan pekerjaan besar.

### CT-05 · Judul kartu tidak menyebut periode — **Medium**

"Total Pendapatan" dan "Total Laba Kotor" pada halaman Riwayat Penjualan tidak menyebut cakupan datanya, padahal keduanya hanya menjumlahkan 100 baris terakhir (Phase 4 UX-12). Subjudul halaman berbunyi "100 transaksi terakhir", tetapi kartu statistiknya berdiri sendiri secara visual.

Ini kasus di mana teks dan angka bersama-sama menyesatkan. Setelah agregasi diperbaiki, label harus menyebut periode secara eksplisit.

**Evidence:** `sales/page.tsx:23,32,36`.

---

## 4. PESAN GALAT

### 4.1 Kualitas pesan yang ada

| Pesan | Lokasi | Penilaian |
| :--- | :--- | :--- |
| "Username atau password salah." | `login/actions.ts:20,25` | ✅ **Sangat baik.** Tidak membedakan username salah dan password salah — benar secara keamanan sekaligus jelas bagi pengguna. |
| "Stok {nama} tidak cukup! Dibutuhkan: {n} {satuan}, tersedia: {m} {satuan}" | `cashier/actions.ts:69` | ✅ **Terbaik di aplikasi.** Menyebut bahan apa, berapa yang kurang, dan berapa yang ada. Kasir dapat langsung bertindak. |
| "Stok {nama} tidak cukup ({n} {satuan} tersisa)" | `CashierPOS.tsx:51` | ✅ Baik, walau formatnya berbeda dari versi server untuk kondisi yang sama. Lihat CT-06. |
| "Keranjang kosong." | `cashier/actions.ts:31` | ✅ Ringkas dan jelas. |
| "Nama dan satuan wajib diisi." | `admin/actions.ts:13` | ✅ Jelas — **tetapi tidak pernah ditampilkan.** Lihat CT-07. |
| "Semua field wajib diisi." | `admin/actions.ts:136` | ⚠️ "Field" adalah istilah teknis; alternatif "Semua kolom wajib diisi". Juga tidak pernah ditampilkan. |
| "Tidak terautentikasi." | `cashier/actions.ts:14`, `admin/actions.ts:70,129` | ⚠️ Istilah teknis. Alternatif: "Sesi Anda telah berakhir. Silakan masuk kembali." |
| "Format data tidak valid." | `cashier/actions.ts:27` | ⚠️ Tidak dapat ditindaklanjuti pengguna. Ini galat internal, bukan kesalahan pengguna. |
| "Data transaksi tidak valid." | `cashier/actions.ts:20` | ⚠️ Sama. |
| "Terjadi kesalahan." | `cashier/actions.ts:126` | ⚠️ Fallback generik tanpa langkah lanjutan. |

### CT-06 · Dua format pesan berbeda untuk kondisi yang sama — **Low**

Stok tidak cukup menghasilkan pesan berbeda tergantung apakah terdeteksi di klien atau di server. Klien: "Stok Susu tidak cukup (800 ml tersisa)". Server: "Stok Susu tidak cukup! Dibutuhkan: 1200 ml, tersedia: 800 ml". Versi server lebih informatif; sebaiknya keduanya diseragamkan ke format tersebut.

### CT-07 · Sebagian besar pesan galat tidak pernah sampai ke pengguna — **High**

Ini temuan Phase 4 UX-07 dilihat dari sisi konten: teks galat yang **sudah ditulis dengan baik** tidak pernah ditampilkan karena pemanggilnya membuang nilai kembalian. Empat pesan pada `admin/actions.ts` berada dalam kondisi ini.

Lebih buruk, dua form menampilkan pesan sukses tanpa syarat:

- "✓ Pembelian berhasil disimpan. Stok sudah diperbarui." (`PurchaseForm.tsx:113`)
- "✓ Pengeluaran berhasil dicatat." (`ExpenseForm.tsx:53`)

Keduanya muncul bahkan ketika server menolak. Dari sudut pandang kualitas produk, **umpan balik yang salah lebih merusak daripada umpan balik yang tidak ada** — pengguna kehilangan kepercayaan pada seluruh sistem begitu menemukan satu kasus.

### CT-08 · Galat mentah dapat bocor ke antarmuka — **Medium**

`cashier/actions.ts:126` mengembalikan `err.message` apa adanya. Untuk galat stok yang dilempar sendiri, ini tepat dan justru bagus. Untuk galat Prisma yang tidak terduga (pelanggaran unique index pada nomor invoice, misalnya), kasir akan melihat pesan teknis panjang berisi nama constraint basis data.

Rekomendasi: bedakan galat yang sengaja dilempar (tampilkan) dari galat tak terduga (tampilkan pesan umum, catat detailnya di log).

---

## 5. DIALOG KONFIRMASI

| Teks | Lokasi | Penilaian |
| :--- | :--- | :--- |
| "Yakin hapus bahan baku ini? Tidak bisa dibatalkan." | `IngredientTable.tsx:27` | ✅ **Baik.** Menyebut objeknya dan menyatakan konsekuensinya. |
| "Yakin hapus produk ini?" | `ProductTable.tsx:29` | ⚠️ Kurang lengkap dibanding pasangannya — tidak menyebut bahwa tindakan ini permanen, dan tidak menyebut nama menunya. |

**CT-09 · Dialog konfirmasi tidak memperingatkan kegagalan yang mungkin — Medium.**
Keduanya menanyakan "yakin?" padahal penghapusan **akan gagal** bila bahan dipakai resep atau menu pernah terjual (batasan FK `Restrict`). Pengguna mengonfirmasi tindakan yang tidak akan pernah berhasil, lalu tidak menerima pesan apa pun (Phase 4 UX-11). Teks yang benar akan menjelaskan syaratnya, atau tombolnya dinonaktifkan sejak awal dengan keterangan alasan.

Catatan: `confirm()` bawaan peramban juga tidak menampilkan nama objek yang dihapus, sehingga pada tabel berisi banyak baris pengguna tidak memiliki kepastian baris mana yang akan terhapus.

---

## 6. EMPTY STATE

| Teks | Lokasi | Penilaian |
| :--- | :--- | :--- |
| "Belum ada transaksi" | `dashboard:98`, `sales:58` | Netral. |
| "Belum ada produk" | `products:81` | Netral. |
| "Belum ada bahan baku" | `ingredients:112` | Netral. |
| "Belum ada pembelian" | `purchases:50` | Netral. |
| "Belum ada pengeluaran" | `expenses:61` | Netral. |
| "Semua stok aman" + ✓ | `dashboard:137` | ✅ **Terbaik.** Ini empty state yang membawa kabar baik, dan nadanya tepat. |
| "Pilih menu dari kiri" + 🛒 | `CashierPOS:278` | ✅ **Baik.** Satu-satunya empty state yang memberi tahu pengguna apa yang harus dilakukan. |

**CT-10 · Lima empty state tidak menawarkan langkah lanjutan — Medium.**
Pola "Belum ada X" bersifat deskriptif tanpa arah. Hallmark (`interaction-and-states.md`) menetapkan bahwa empty state selalu memuat penjelasan singkat **dan** aksi untuk mengatasinya. Pada halaman Bahan Baku yang masih kosong, teks yang lebih berguna adalah "Belum ada bahan baku. Tambahkan bahan pertama untuk mulai menghitung HPP menu." disertai tombol.

Ini terutama penting pada instalasi baru — layar pertama yang dilihat pemilik kafe adalah lima tabel kosong tanpa petunjuk urutan pengisian.

---

## 7. LABEL TOMBOL & KAPITALISASI

| Aspek | Temuan | Penilaian |
| :--- | :--- | :--- |
| Kata kerja pada tombol | "Masuk", "Keluar", "Simpan", "Batal", "Hapus", "Edit", "+ Tambah Bahan", "+ Tambah Menu", "+ Tambah Item", "Simpan Pembelian", "Simpan Pengeluaran", "Kosongkan Keranjang". Konsisten memakai kata kerja imperatif. | ✅ Baik |
| Spesifisitas | "Simpan Pembelian" dan "Simpan Pengeluaran" lebih baik daripada "Simpan" polos — menyebut objeknya. | ✅ Baik |
| Kapitalisasi | Title Case dipakai konsisten pada tombol, judul, dan label form. Kalimat penuh memakai sentence case. Tidak ditemukan penyimpangan. | ✅ Konsisten |
| State loading | "Memverifikasi…", "Menyimpan…", "Memproses…". Konsisten memakai bentuk sedang berlangsung. | ✅ Baik |
| Tombol bayar | `` `Bayar ${formatRp(total)}` `` — menampilkan nominal pada tombol. Praktik POS yang baik: kasir mengonfirmasi jumlah tepat sebelum menekan. | ✅ **Kekuatan** |
| Elipsis | Memakai tiga titik `...`, bukan karakter elipsis `…`. Hallmark menandai ini sebagai isu tipografi minor. | Observation — Low |

---

## 8. INSTRUKSI FORM & PLACEHOLDER

| Aspek | Temuan | Penilaian |
| :--- | :--- | :--- |
| Placeholder sebagai contoh | "Kopi Arabica", "gram / ml / pcs", "Kopi Susu Aren", "22000", "Bayar listrik bulan ini", "500000". Semuanya contoh nyata yang relevan dengan domain kafe — bukan "Lorem ipsum" atau "Masukkan nama". | ✅ **Kekuatan nyata** |
| Placeholder sebagai label | Hanya satu kasus: kolom pencarian kasir "Cari menu..." tanpa label. | ⚠️ Lihat Phase 5 A11Y-02 |
| Penanda opsional | "Nama Supplier" memakai placeholder "Opsional". Cara yang wajar, walau konvensi yang lebih kuat adalah menandai pada label. | Observation |
| Satuan pada label | "Harga Jual (Rp)", "HPP Dasar (Rp)", "Jumlah (Rp)". Menyebut mata uang di label — baik. | ✅ Baik |
| Teks bantuan | Tidak ada penjelasan di bawah field mana pun. Untuk "Stok Minimum" (ambang notifikasi) dan "HPP Dasar" (kapan dipakai), penjelasan singkat akan membantu. | ⚠️ Medium |
| Subjudul halaman | "Kelola stok dan pengaturan bahan baku kafe", "Catat pembelian bahan baku dari supplier — stok otomatis bertambah", "Catat pengeluaran selain pembelian bahan baku (utilitas, sewa, dll)". | ✅ **Sangat baik** — menjelaskan tujuan halaman dan, pada dua kasus, konsekuensi tindakannya. |

**CT-11 · Subjudul halaman Pengeluaran adalah satu-satunya tempat pembedaan akuntansi dijelaskan — Observation.**
"Catat pengeluaran **selain pembelian bahan baku**" adalah penjelasan yang tepat dan penting. Sayangnya pembedaan yang sama tidak diperkuat di dashboard, tempat kesalahan rumus justru terjadi. Ini contoh di mana copy sudah benar tetapi tidak konsisten diterapkan di seluruh alur.

---

## 9. RINGKASAN TEMUAN PHASE 8

| Kode | Temuan | Severity | Status |
| :--- | :--- | :--- | :--- |
| CT-02 | Label "Laba Kotor − Pembelian Bahan" menyatakan model akuntansi yang salah | High | Confirmed |
| CT-07 | Pesan galat yang sudah ditulis tidak pernah ditampilkan; dua form menampilkan sukses palsu | High | Confirmed |
| CT-03 | Istilah teknis basis data bocor ke antarmuka ("HPP Dasar", "BOM") | Medium | Confirmed |
| CT-05 | Judul kartu total tidak menyebut periode/cakupan data | Medium | Confirmed |
| CT-08 | Galat mentah dapat bocor ke antarmuka kasir | Medium | Confirmed |
| CT-09 | Dialog konfirmasi tidak memperingatkan kegagalan FK yang pasti terjadi | Medium | Confirmed |
| CT-10 | Lima empty state tanpa langkah lanjutan | Medium | Confirmed |
| — | Tidak ada teks bantuan pada field yang butuh penjelasan | Medium | Confirmed |
| CT-01 | "Menu" dan "Produk" dipakai bergantian dalam satu modul | Low | Confirmed |
| CT-04 | Singkatan HPP/BOM/Est. tidak pernah dijabarkan | Low | Confirmed |
| CT-06 | Dua format pesan berbeda untuk kondisi stok yang sama | Low | Confirmed |
| — | "Tidak terautentikasi", "Format data tidak valid" terlalu teknis | Low | Confirmed |
| — | `...` alih-alih karakter elipsis `…` | Low | Observation |

**Penilaian keseluruhan.** Copywriting adalah salah satu aspek **terkuat** dari aplikasi ini. Placeholder kontekstual, subjudul halaman yang menjelaskan konsekuensi, pesan stok yang dapat ditindaklanjuti, dan nominal pada tombol bayar semuanya menunjukkan perhatian pada pengguna nyata.

Dua temuan High-nya pun bukan kegagalan menulis: CT-02 adalah label yang jujur menggambarkan bug, dan CT-07 adalah teks bagus yang tidak pernah ditampilkan. Keduanya akan selesai bersamaan dengan perbaikan logika dan penanganan galat — bukan dengan menulis ulang copy.

---

**Output Phase 8 selesai. Lanjut ke Phase 9.**
