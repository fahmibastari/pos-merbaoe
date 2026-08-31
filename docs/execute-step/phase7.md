# PHASE 7 — SECURITY & BUSINESS LOGIC

**Metode:** audit statis atas source code. **Tidak ada eksploitasi, tidak ada pengujian penetrasi, tidak ada koneksi ke basis data produksi.** Seluruh temuan diturunkan dari pembacaan kode.
**Status output:** Selesai

---

## 1. RINGKASAN

Fondasi keamanan aplikasi ini **lebih baik dari yang biasa ditemui pada tahap ini**, khususnya pada satu hal yang paling menentukan untuk POS: **server tidak mempercayai harga maupun total dari klien.** Harga jual, HPP, subtotal, dan laba semuanya dihitung ulang di server dari data basis data, dan identitas kasir diambil dari sesi, bukan dari payload.

Namun terdapat empat masalah yang harus ditangani sebelum aplikasi menyentuh data nyata:

1. **Kredensial basis data tersimpan sebagai teks polos di dalam proyek** dan ikut terbawa riwayat Git.
2. **`JWT_SECRET` tidak diset**, sehingga sesi ditandatangani memakai kunci yang tertulis di dalam source code — siapa pun yang membaca repositori dapat menempa sesi administrator.
3. **Lapisan otorisasi ketiga (Server Action) belum ada**, padahal README §4.3 menyatakan lapisan inilah pengaman sesungguhnya.
4. **Kuantitas tidak divalidasi**, sehingga permintaan yang dibuat khusus dapat menaikkan stok dan mencatat penjualan bernilai negatif.

---

## 2. CONFIRMED — AUTENTIKASI & PENGELOLAAN RAHASIA

### SEC-01 · Kredensial basis data teks polos di dalam proyek — **Critical**

| | |
| :--- | :--- |
| **Evidence** | `supabaseConnect.txt` di akar proyek memuat *connection string* Supabase lengkap dengan password basis data dalam bentuk teks polos, URL proyek, dan *publishable key*. `git ls-files` menunjukkan berkas ini terlacak dan sudah masuk *commit* `da342e9`. |
| **Pemberat** | Pola `.gitignore` hanya mencakup `.env*` — nama berkas ini tidak tercakup, sehingga tidak ada mekanisme yang mencegahnya ter-*commit* kembali. |
| **Melanggar** | README §8.1 — "seluruh kredensial hanya boleh berada pada variabel lingkungan". |
| **Dampak** | Akses tulis penuh ke basis data produksi bagi siapa pun yang memperoleh salinan proyek. Menghapus berkasnya tidak cukup karena password tetap ada di riwayat. |
| **Tindakan** | Rotasi password di Supabase; keluarkan berkas dari indeks; tambahkan polanya ke `.gitignore`; bersihkan riwayat sebelum repositori di-*push*; buat `.env.example`. |

### SEC-02 · `JWT_SECRET` memakai nilai cadangan *hardcode* — **Critical**

| | |
| :--- | :--- |
| **Evidence** | `src/lib/auth.ts:5-7` — `process.env.JWT_SECRET ?? "merbaoe-pos-secret-key-2024-fallback"`. Berkas `.env` hanya memuat `DATABASE_URL` dan `DIRECT_URL`; `JWT_SECRET` tidak ada, sehingga cabang cadangan **aktif**. |
| **Melanggar** | README §8.1 — "Aplikasi wajib gagal saat start bila variabel ini tidak tersedia. Nilai cadangan yang tertulis di dalam kode dilarang." |
| **Dampak** | Privilege escalation. Siapa pun yang membaca repositori dapat menandatangani token `{ userId, username, role: "admin" }` yang sah dan masuk sebagai owner tanpa password. Ini melewati seluruh tiga lapisan otorisasi sekaligus, karena ketiganya memercayai hasil `verifySession`. |
| **Tindakan** | Bangkitkan kunci acak ≥32 byte, set di `.env` dan Vercel, hapus operator `??`. |

### SEC-03 · Tidak ada pembatasan percobaan login — **Medium**

`login/actions.ts:9-48` tidak memiliki rate limit, jeda, maupun penguncian akun. README §8.1 mensyaratkan maksimal 5 kegagalan per 15 menit. Digabung dengan password bawaan `admin123`/`kasir123` yang tidak dapat diganti dari aplikasi (tidak ada L-14), brute force menjadi sepele.

### SEC-04 · Oracle waktu untuk enumerasi username — **Low**

`login/actions.ts:19-26` mengembalikan hasil **sebelum** menjalankan `bcrypt.compare` bila user tidak ditemukan. Username yang ada akan merespons lebih lambat (biaya bcrypt cost 10) daripada yang tidak ada. Pesan galatnya sudah benar — sama untuk kedua kasus — tetapi selisih waktunya membocorkan informasi. Dampak nyata rendah pada sistem dua akun.

### SEC-05 · Sesi tidak dapat dicabut — **Observation**

JWT bersifat stateless dengan masa berlaku 8 jam. `logoutAction` menghapus cookie tetapi token yang sudah tersalin tetap sah sampai kedaluwarsa. Ini konsekuensi wajar dari pilihan arsitektur dan sesuai untuk lingkup ini; dicatat agar menjadi keputusan sadar, bukan kelalaian. Menjadi relevan bila L-14 (nonaktifkan akun) dibangun — menonaktifkan pengguna tidak akan langsung memutus sesinya.

**Yang sudah benar:** `bcrypt` cost 10 (`seed.ts:15-16`); cookie `httpOnly` + `secure` di produksi + `sameSite: lax` + `maxAge` 8 jam (`login/actions.ts:35-41`); pesan galat login tidak membedakan username salah dan password salah.

---

## 3. CONFIRMED — OTORISASI

### SEC-06 · Lapisan otorisasi Server Action belum ada — **High**

README §4.3 menyatakan secara eksplisit bahwa Server Action dipanggil berdasarkan identitas aksi, bukan alamat halaman, sehingga proteksi rute tidak menjangkaunya — dan menyebut lapisan ini "pengaman sesungguhnya". Berkas `src/lib/guard.ts` yang diwajibkan §4.2 belum ada.

| Server Action | Cek sesi | Cek peran | Baris |
| :--- | :---: | :---: | :--- |
| `createIngredient` | ❌ | ❌ | `admin/actions.ts:8` |
| `updateIngredient` | ❌ | ❌ | `admin/actions.ts:21` |
| `deleteIngredient` | ❌ | ❌ | `admin/actions.ts:34` |
| `createProduct` | ❌ | ❌ | `admin/actions.ts:41` |
| `toggleProductActive` | ❌ | ❌ | `admin/actions.ts:54` |
| `deleteProduct` | ❌ | ❌ | `admin/actions.ts:61` |
| `deleteExpense` | ❌ | ❌ | `admin/actions.ts:152` |
| `createPurchase` | ✅ | ❌ | `admin/actions.ts:68-70` |
| `createExpense` | ✅ | ❌ | `admin/actions.ts:127-129` |
| `submitSale` | ✅ | ❌ (wajar — kedua peran berhak) | `cashier/actions.ts:13-14` |

**Dampak.** Tujuh aksi dapat dijalankan tanpa sesi apa pun bila pemanggilnya mengetahui identitas aksi. Dua aksi lainnya menerima sesi kasir. Ini menjawab langsung pertanyaan Phase 7: *apakah stock dapat berubah tanpa authorization* — ya, `updateIngredient` dan `deleteIngredient` tidak memeriksa apa pun.

**Catatan kalibrasi yang jujur.** Eksploitasi menuntut pengetahuan tentang Action ID yang dibangkitkan Next.js saat build dan pembuatan permintaan `POST` manual dengan header yang benar — bukan sesuatu yang terjadi lewat antarmuka biasa. Karena itu severity dinilai **High, bukan Critical**. Namun README sudah menetapkan lapisan ini sebagai wajib, dan biaya perbaikannya rendah.

### SEC-07 · Penghapusan pengeluaran tanpa pemeriksaan kepemilikan — **Medium**

`deleteExpense` (`admin/actions.ts:152-157`) menerima `id` dari `formData` dan langsung menghapus. Tidak ada cek sesi, cek peran, maupun cek pembuat. Bentuk IDOR klasik. Karena hanya admin yang memiliki layar ini, dampaknya bergantung sepenuhnya pada SEC-06.

### SEC-08 · Middleware tidak mengalihkan pengguna yang sudah login dari `/login` — **Low**

`middleware.ts:9-11` mengembalikan `NextResponse.next()` lebih awal untuk `/login`, padahal `/login` ada di dalam `matcher`. Pengguna yang sudah masuk tetap dapat membuka halaman login. Bukan kerentanan; entri matcher-nya efektif tidak berguna.

---

## 4. CONFIRMED — LOGIKA BISNIS

### SEC-09 · Kuantitas tidak divalidasi; nilai negatif menaikkan stok — **High**

Ini temuan logika bisnis paling serius.

`submitSale` mem-*parse* `items` dari JSON kiriman klien (`cashier/actions.ts:24`) dan **tidak pernah memvalidasi `quantity`**. Tidak ada pemeriksaan positif, tidak ada batas atas, tidak ada `zod`.

Telusuran untuk `quantity: -5` pada produk ber-resep:

| Baris | Ekspresi | Hasil |
| :--- | :--- | :--- |
| `:66` | `neededTotal = 18 × (−5)` | `−90` |
| `:67` | `currentStock (2000) < −90` ? | **false** → validasi lolos |
| `:76` | `deductAmt = −90` | |
| `:77-80` | `currentStock: { decrement: −90 }` | stok **naik** menjadi 2090 |
| `:84` | `subtotal = 22000 × (−5)` | `−110000` |
| `:88` | `totalAmount += −110000` | penjualan bernilai negatif |

Baris `sales_details.quantity` bertipe `Int`, dan `−5` adalah `Int` yang sah — sehingga tidak ada penolakan di tingkat basis data.

**Dampak.** Sesi kasir yang mengirim permintaan buatan dapat: menaikkan stok bahan baku tanpa pembelian, dan mencatat penjualan bernilai negatif yang mengurangi total pendapatan serta laba pada laporan owner. Keduanya merusak justru angka yang menjadi tujuan sistem ini.

**Mengapa belum tertangkap.** README §5.10 mensyaratkan `CHECK sales_details_qty_positive CHECK (quantity > 0)` dan §5.3 `CHECK (current_stock >= 0)`. Nol dari 17 `CHECK` tersebut ada di migrasi (Phase 6 §4.2). Batasan basis data akan menangkap kasus ini bahkan tanpa validasi aplikasi.

### SEC-10 · Transaksi ganda tidak dicegah — **High**

Tidak ada kunci idempotensi. `submitSale` selalu membuat `sales` baru pada setiap pemanggilan. `disabled={loading}` di klien (`CashierPOS.tsx:389`) hanya melindungi dari klik ganda dalam satu render, bukan dari pengiriman ulang setelah jaringan terputus.

Menjawab pertanyaan Phase 7 *apakah transaksi dapat dibuat dua kali*: **ya** — dan pada POS, transaksi ganda berarti stok terpotong dua kali dan pendapatan tercatat dua kali.

### SEC-11 · Race condition stok memungkinkan oversell — **High**

Sudah diuraikan sebagai PF-08 (Phase 6 §3.3). Ringkas: validasi stok dan `decrement` adalah statement terpisah pada isolasi Read Committed, tanpa `SELECT ... FOR UPDATE` dan tanpa `CHECK (current_stock >= 0)`. Dua checkout bersamaan dapat sama-sama lolos.

Dicantumkan di sini karena konsekuensinya bersifat integritas bisnis, bukan sekadar performa.

### SEC-12 · `paymentMethod` di-*cast* tanpa validasi — **Low**

`cashier/actions.ts:109` — `paymentMethod as "cash" | "qris" | "transfer"`. Nilai sembarang akan diteruskan ke Prisma dan ditolak di tingkat enum PostgreSQL. **Gagal dengan aman**, tetapi menghasilkan galat mentah alih-alih pesan yang dapat dipahami. Pola serupa pada `createExpense` untuk `category` (`admin/actions.ts:141`).

### SEC-13 · Nilai numerik master data tidak dibatasi — **Medium**

`parseFloat` tanpa pemeriksaan pada `sellingPrice`, `baseHpp`, `minimumStock`, `quantity`, dan `unitCost` (`admin/actions.ts:11,25,43-44,76-77`). Harga jual negatif dan harga beli negatif diterima. Harga beli negatif akan merusak perhitungan `average_cost` begitu §3.6 diimplementasikan. Input `NaN` juga diteruskan ke Prisma.

---

## 5. YANG SUDAH BENAR — PERTANYAAN KHUSUS POS

Instruksi Phase 7 mengajukan tujuh pertanyaan spesifik. Empat di antaranya berjawab baik, dan itu harus dinyatakan dengan jelas.

| Pertanyaan | Jawaban | Evidence |
| :--- | :--- | :--- |
| **Apakah harga dapat dimanipulasi dari client?** | **Tidak.** Klien hanya mengirim `{ productId, quantity }` (`CashierPOS.tsx:104`). Harga diambil server dari `product.sellingPrice` hasil kueri basis data (`cashier/actions.ts:94`). | ✅ Aman |
| **Apakah total transaksi dipercaya dari client?** | **Tidak.** `subtotal`, `totalAmount`, `totalHpp`, dan `grossProfit` seluruhnya dihitung ulang di server (`cashier/actions.ts:84-108`). Angka pada panel kasir hanya untuk tampilan dan tidak pernah dikirim. | ✅ Aman |
| **Apakah stock dapat berubah tanpa authorization?** | **Ya** — lewat `updateIngredient`/`deleteIngredient` yang tidak memeriksa apa pun (SEC-06), dan lewat kuantitas negatif (SEC-09). | ❌ Lihat SEC-06, SEC-09 |
| **Apakah transaksi dapat dibuat dua kali?** | **Ya** — tidak ada idempotensi (SEC-10). | ❌ Lihat SEC-10 |
| **Apakah user dapat mengakses resource milik role lain?** | **Sebagian.** Rute dan halaman terlindungi dengan benar oleh dua lapisan. Server Action tidak (SEC-06). | ⚠️ Lihat SEC-06 |
| **Apakah historical transaction dapat dimodifikasi?** | **Tidak.** Tidak ada Server Action `updateSale` atau `deleteSale` di seluruh `src/`. `hpp_snapshot`, `selling_price`, dan `gross_profit_snapshot` dibekukan saat penulisan dan tidak pernah disentuh lagi. Ini keputusan yang benar. | ✅ Aman |
| **Apakah refund/void memiliki kontrol yang memadai?** | **Tidak berlaku** — fitur void belum ada (§7.4 README). Ketika dibangun, kontrolnya harus ditetapkan lebih dahulu: siapa berwenang, apakah perlu alasan, apakah ada batas waktu. | ⚠️ Belum ada |

**Catatan positif tambahan:**
- `cashierId: session.userId` (`cashier/actions.ts:105`) — identitas kasir diambil dari sesi, tidak dari payload. Mencegah pemalsuan atribusi transaksi.
- `createPurchase` dan `createExpense` juga memakai `session.userId` untuk `createdBy`.
- `where: { id: item.productId, isActive: true }` — produk nonaktif tidak dapat dijual meski `productId`-nya ditebak.
- Kedua alur mutasi stok memakai `$transaction`, sehingga kegagalan sebagian tidak meninggalkan data setengah jadi.

---

## 6. POTENTIAL — PERLU VERIFIKASI LEBIH LANJUT

| Kode | Temuan | Mengapa belum Confirmed |
| :--- | :--- | :--- |
| POT-01 | Eksploitabilitas SEC-06 dari luar antarmuka | Menuntut verifikasi runtime apakah Action ID dapat dipanggil lintas-rute pada Next.js 16.2.11. Perilaku ini bergantung pada versi. |
| POT-02 | Kebocoran informasi lewat pesan galat | `submitSale` mengembalikan `err.message` mentah ke klien (`cashier/actions.ts:126`). Pesan stok memang informatif dan berguna, tetapi galat Prisma yang tidak terduga akan ikut terkirim beserta detail internalnya. Perlu diperiksa bentuk galat nyata. |
| POT-03 | Perlindungan CSRF | Next.js Server Actions memiliki pemeriksaan asal permintaan bawaan. Diasumsikan aktif; **tidak diverifikasi** pada konfigurasi ini. |
| POT-04 | Data pada basis data produksi | Tidak diketahui apakah sudah ada data nyata. Menentukan urgensi SEC-01 dan strategi migrasi. |

---

## 7. NOT VERIFIED

- Header keamanan HTTP (CSP, HSTS, `X-Frame-Options`) — `next.config.ts` kosong; header bawaan Vercel belum diperiksa.
- Konfigurasi Row Level Security pada Supabase — akses dilakukan lewat *connection string* langsung, sehingga RLS kemungkinan besar tidak berperan, tetapi tidak diverifikasi.
- Apakah `.env` benar-benar tidak pernah ter-*commit* — pola `.env*` ada di `.gitignore`, riwayat penuh tidak ditelusuri.
- Perilaku sistem di bawah checkout bersamaan (kasus uji I-05 §9.2).

---

## 8. RINGKASAN TEMUAN PHASE 7

| Kode | Temuan | Severity | Status |
| :--- | :--- | :--- | :--- |
| SEC-01 | Kredensial basis data teks polos di proyek & riwayat Git | **Critical** | Confirmed |
| SEC-02 | `JWT_SECRET` memakai nilai cadangan hardcode → sesi admin dapat ditempa | **Critical** | Confirmed |
| SEC-06 | Lapisan otorisasi Server Action tidak ada; 7 aksi tanpa cek sesi | High | Confirmed |
| SEC-09 | Kuantitas negatif menaikkan stok & mencatat penjualan negatif | High | Confirmed |
| SEC-10 | Tidak ada idempotensi; transaksi dapat terduplikasi | High | Confirmed |
| SEC-11 | Race condition stok memungkinkan oversell | High | Confirmed |
| SEC-03 | Tidak ada pembatasan percobaan login | Medium | Confirmed |
| SEC-07 | `deleteExpense` tanpa cek kepemilikan maupun peran | Medium | Confirmed |
| SEC-13 | Nilai numerik master data tidak dibatasi (harga & biaya negatif diterima) | Medium | Confirmed |
| SEC-04 | Oracle waktu untuk enumerasi username | Low | Confirmed |
| SEC-08 | Matcher `/login` tidak berfungsi sebagaimana dimaksud | Low | Confirmed |
| SEC-12 | Enum di-*cast* tanpa validasi; gagal dengan galat mentah | Low | Confirmed |
| SEC-05 | Sesi tidak dapat dicabut sebelum kedaluwarsa | Observation | Confirmed |
| POT-01..04 | Lihat §6 | — | Potential |

**Akar penyebab yang sama.** Enam dari sembilan temuan High/Medium (SEC-06, SEC-09, SEC-11, SEC-13, dan sebagian SEC-12) akan tertutup oleh dua pekerjaan yang sudah tercantum di README: **membuat `lib/guard.ts` + validasi `zod` (§8.1)** dan **menerapkan 17 batasan `CHECK` (§5)**. Keduanya berbiaya rendah dan berdampak lebar.

---

**Output Phase 7 selesai. Lanjut ke Phase 8.**
