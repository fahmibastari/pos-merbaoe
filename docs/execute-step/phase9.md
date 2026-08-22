# PHASE 9 — TECHNICAL DEBT

**Sumber:** temuan Phase 1–8, dikonsolidasikan dan diklasifikasikan.
**Aturan:** tidak ada temuan baru diperkenalkan di sini. Setiap butir merujuk asal temuannya.
**Status output:** Selesai

---

## 0. CARA MEMBACA

Klasifikasi mengikuti lima kategori yang ditetapkan Phase 9. Sebuah temuan dapat memiliki dampak lintas kategori; penempatannya ditentukan oleh **dampak dominan**, dan keterkaitannya dicatat.

Kolom **Complexity** memakai skala Small / Medium / Large berdasarkan luas perubahan yang dibutuhkan, bukan estimasi waktu.

Satu catatan penting yang membentuk seluruh bab ini: **sebagian besar debt di aplikasi ini bukan hasil kode yang membusuk, melainkan pekerjaan yang belum dilakukan.** Repositori berusia satu commit dengan seluruh kode aplikasi belum ter-*commit*. Membedakan keduanya penting agar peta jalan tidak salah sasaran — yang dibutuhkan sebagian besar adalah *penyelesaian*, bukan *refactor*.

---

## 1. CRITICAL DEBT

*Menghambat correctness, security, atau operasional. Tidak boleh dibawa ke penggunaan nyata.*

### CD-01 · Kredensial basis data terekspos di dalam proyek dan riwayat Git

| | |
| :--- | :--- |
| **Sumber** | Phase 7 SEC-01 |
| **Evidence** | `supabaseConnect.txt` di akar proyek memuat password basis data teks polos; `git ls-files` menunjukkan berkas terlacak pada commit `da342e9`. Pola `.gitignore` hanya `.env*`, tidak mencakup nama berkas ini. |
| **Impact** | Akses tulis penuh ke basis data produksi bagi pemegang salinan proyek. |
| **Severity** | Critical |
| **Solution** | Rotasi password di Supabase → `git rm --cached` → tambahkan pola ke `.gitignore` → bersihkan riwayat (repositori baru 4 commit, membangun ulang riwayat layak dipertimbangkan) → buat `.env.example` sesuai §10.2. |
| **Complexity** | Small |
| **Priority** | P0 |

### CD-02 · `JWT_SECRET` memakai nilai cadangan hardcode

| | |
| :--- | :--- |
| **Sumber** | Phase 7 SEC-02 |
| **Evidence** | `lib/auth.ts:5-7`; `.env` tidak memuat `JWT_SECRET`, sehingga cabang cadangan aktif. |
| **Impact** | Privilege escalation. Sesi `role: "admin"` dapat ditempa oleh siapa pun yang membaca repositori, melewati ketiga lapisan otorisasi sekaligus. |
| **Severity** | Critical |
| **Solution** | Bangkitkan kunci ≥32 byte, set di `.env` dan Vercel, hapus operator `??` sehingga aplikasi gagal keras bila variabel tidak ada. |
| **Complexity** | Small |
| **Priority** | P0 |

### CD-03 · Rumus laba bersih melanggar kebijakan akuntansi sistem

| | |
| :--- | :--- |
| **Sumber** | Phase 2 §4.2, Phase 8 CT-02 |
| **Evidence** | `dashboard/page.tsx:44-45` mengurangi `purchasesMonthTotal` dari laba kotor; label baris 57 menyatakan rumus tersebut. `operational_expenses` tidak pernah dipakai. |
| **Impact** | Biaya bahan terhitung dua kali (§3.1.A). Angka "Laba Bersih Bulan Ini" tidak memiliki makna akuntansi. Karena inilah keluaran utama sistem, seluruh nilai produk bergantung padanya. Labelnya juga mengajarkan model mental yang keliru kepada owner. |
| **Severity** | Critical |
| **Solution** | Ganti agregasi ke `operationalExpense._sum.amount` untuk periode berjalan; perbaiki label bersamaan. Idealnya perhitungan dipindahkan ke fungsi murni agar dapat diuji (§9.1 U-08). |
| **Complexity** | Small |
| **Priority** | P0 |

### CD-04 · Race condition stok memungkinkan oversell

| | |
| :--- | :--- |
| **Sumber** | Phase 6 PF-08, Phase 7 SEC-11 |
| **Evidence** | `cashier/actions.ts:65-72` (validasi) dan `:75-81` (decrement) adalah statement terpisah tanpa `SELECT ... FOR UPDATE`, pada isolasi Read Committed. Tidak ada `CHECK (current_stock >= 0)` di migrasi. |
| **Impact** | Dua checkout bersamaan atas bahan yang hanya cukup untuk satu dapat sama-sama lolos → stok negatif secara diam-diam → nilai persediaan dan HPP menjadi salah tanpa jejak. |
| **Severity** | Critical |
| **Solution** | Kunci baris terurut `ingredient_id` (mencegah deadlock) atau `UPDATE ... WHERE current_stock >= n` yang memeriksa jumlah baris terpengaruh; tambahkan `CHECK` sebagai pengaman terakhir. |
| **Complexity** | Medium |
| **Priority** | P0 |

### CD-05 · Kuantitas tidak divalidasi; nilai negatif menaikkan stok

| | |
| :--- | :--- |
| **Sumber** | Phase 7 SEC-09 |
| **Evidence** | `cashier/actions.ts:24` mem-*parse* JSON klien tanpa validasi. Telusuran `quantity: -5` menghasilkan `decrement: -90` → stok naik, dan `subtotal: -110000` → penjualan bernilai negatif. |
| **Impact** | Stok dapat dinaikkan tanpa pembelian; pendapatan dan laba pada laporan owner dapat dikurangi. Merusak justru angka yang menjadi tujuan sistem. |
| **Severity** | Critical |
| **Solution** | Validasi `zod` pada payload (§8.1) **dan** `CHECK (quantity > 0)` di basis data (§5.11). Dua lapisan, karena keduanya sudah disyaratkan README. |
| **Complexity** | Small |
| **Priority** | P0 |

### CD-06 · Otorisasi Server Action tidak ada

| | |
| :--- | :--- |
| **Sumber** | Phase 7 SEC-06, SEC-07; Phase 2 §4.4 |
| **Evidence** | `lib/guard.ts` (§4.2) belum ada. Tujuh aksi tanpa cek sesi sama sekali; dua aksi cek sesi tanpa cek peran. |
| **Impact** | README §4.3 menyebut lapisan ini "pengaman sesungguhnya" karena Server Action dipanggil lewat identitas aksi, bukan path. Stok dapat diubah tanpa otorisasi. |
| **Severity** | High (bukan Critical — eksploitasi menuntut pengetahuan Action ID dan permintaan buatan, bukan lewat antarmuka biasa) |
| **Solution** | Buat `lib/guard.ts` berisi `requireAuth()`/`requireAdmin()`; panggil pada baris pertama setiap aksi. |
| **Complexity** | Small |
| **Priority** | P0 |

### CD-07 · Nol batasan `CHECK` dari 17 yang disyaratkan

| | |
| :--- | :--- |
| **Sumber** | Phase 6 §4.2, Phase 2 §4.1 |
| **Evidence** | `migration.sql` tidak memuat satu pun `CHECK`. README §5 mensyaratkan 17, lima di antaranya menegakkan rumus §3.4 pada tabel `sales`. |
| **Impact** | Kelas kesalahan seperti CD-03 dan CD-05 akan tertangkap otomatis oleh basis data bila batasan ini ada. Tanpa itu, setiap aturan bergantung sepenuhnya pada kebenaran kode aplikasi. |
| **Severity** | High |
| **Solution** | Migrasi SQL kustom bersamaan dengan migrasi skema. |
| **Complexity** | Small (bila digabung migrasi) |
| **Priority** | P0 |

### CD-08 · Transaksi dapat terduplikasi

| | |
| :--- | :--- |
| **Sumber** | Phase 1 GAP-03, Phase 4 UX-05, Phase 7 SEC-10 |
| **Evidence** | Tidak ada kunci idempotensi pada `sales` maupun pada payload. `disabled={loading}` hanya melindungi dalam satu render. |
| **Impact** | Jaringan terputus setelah request terkirim → kasir mengulang → stok terpotong dua kali, pendapatan tercatat dua kali. Pada kafe dengan Wi-Fi tidak stabil, ini bukan skenario langka. |
| **Severity** | High |
| **Solution** | Kunci idempotensi dibangkitkan klien saat keranjang dibuat, disimpan unik pada `sales`; pengiriman ulang mengembalikan transaksi yang sama. **Memerlukan keputusan desain lebih dulu** — belum ada di README (GAP-03). |
| **Complexity** | Medium |
| **Priority** | P1 |

### CD-09 · Delapan Server Action tanpa penanganan galat

| | |
| :--- | :--- |
| **Sumber** | Phase 6 §5, Phase 4 UX-07/UX-11, Phase 8 CT-07 |
| **Evidence** | Hanya `submitSale` memakai try/catch. Tidak ada `error.tsx` di rute mana pun. Empat form membuang nilai kembalian; dua menampilkan sukses tanpa syarat. |
| **Impact** | Penghapusan yang gagal karena FK tidak memberi umpan balik apa pun. Dua form menampilkan "berhasil disimpan" ketika server menolak — umpan balik yang salah, bukan sekadar hilang. |
| **Severity** | High |
| **Solution** | Bentuk hasil seragam untuk seluruh Server Action; klien membaca hasil sebelum menampilkan sukses; tambahkan `error.tsx`. |
| **Complexity** | Medium |
| **Priority** | P1 |

---

## 2. STRUCTURAL DEBT

*Membuat pengembangan fitur baru semakin sulit.*

### SD-01 · Skema basis data belum dimigrasikan ke §5.15 — **debt struktural terbesar**

| | |
| :--- | :--- |
| **Sumber** | Phase 2 §4.1, §5 |
| **Evidence** | 10 dari 12 model, 5 dari 9 enum, −27 kolom, 3 dari 39 constraint/indeks. |
| **Impact** | **15 dari 24 item *Not Found* pada Phase 2 terblokir langsung oleh ini.** Average costing, kartu stok, void, shift, diskon, pajak, kembalian, audit trail, manajemen pengguna, laporan persediaan — seluruhnya menunggu kolom yang belum ada. |
| **Severity** | High |
| **Solution** | Ganti `schema.prisma` dengan §5.15 (sudah lolos `prisma validate`), jalankan `migrate dev`, tambahkan CHECK/indeks/sequence lewat SQL kustom. |
| **Complexity** | Medium — **tetapi lihat SD-02** |
| **Priority** | P0 |

### SD-02 · Strategi transisi data belum ditetapkan

| | |
| :--- | :--- |
| **Sumber** | Phase 1 GAP-06 |
| **Evidence** | Migrasi `20260822075607_init` sudah ada. Kolom baru seperti `stock_transactions.balance_after`, `value_after`, dan `created_by` bersifat `NOT NULL` tanpa default yang bermakna untuk baris lama. Keberadaan data pada basis data Supabase: **Not Verified**. |
| **Impact** | SD-01 dapat gagal saat dijalankan, atau berhasil dengan nilai yang keliru. Ini prasyarat yang harus diselesaikan **sebelum** SD-01 dieksekusi. |
| **Severity** | High |
| **Solution** | Verifikasi apakah basis data berisi data nyata. Bila belum: reset dan migrasi bersih. Bila sudah: tetapkan backfill per kolom. |
| **Complexity** | Small (verifikasi) → Medium (bila perlu backfill) |
| **Priority** | P0 |

### SD-03 · Modul `lib/` yang direncanakan belum ada

| | |
| :--- | :--- |
| **Sumber** | Phase 2 §3, Phase 6 §6 |
| **Evidence** | `src/lib` hanya berisi `auth.ts` dan `prisma.ts`. README §4.2 menetapkan `guard.ts`, `money.ts`, `period.ts`, `costing.ts`. |
| **Impact** | Aturan lintas-modul tidak punya tempat tinggal. Konsekuensi berantai: otorisasi tidak seragam (CD-06), pembulatan uang tidak konsisten, batas periode salah (UD-01), dan **perhitungan bisnis tidak dapat diuji unit** — 10 kasus uji §9.1 mensyaratkan fungsi murni yang belum ada sebagai unit yang dapat dipanggil. |
| **Severity** | High |
| **Solution** | Buat keempat modul. Ini sekaligus menyelesaikan MD-01, MD-02, dan membuka jalan bagi pengujian. |
| **Complexity** | Medium |
| **Priority** | P0 |

### SD-04 · Perhitungan bisnis tercampur dengan I/O dan presentasi

| | |
| :--- | :--- |
| **Sumber** | Phase 6 §5, §6 |
| **Evidence** | Perhitungan HPP berada di dalam Server Action yang juga melakukan I/O basis data (`cashier/actions.ts:60-98`); rumus laba bersih berada di dalam komponen halaman (`dashboard/page.tsx:40-45`). |
| **Impact** | Tidak ada satu pun perhitungan finansial yang dapat diuji tanpa basis data. Bertabrakan langsung dengan §9.1. |
| **Severity** | High |
| **Solution** | Ekstrak ke fungsi murni di `lib/costing.ts` dan `lib/money.ts`. **Bukan** clean architecture penuh — cukup memisahkan perhitungan dari I/O (Phase 6 §6). |
| **Complexity** | Medium |
| **Priority** | P1 |

### SD-05 · Tidak ada lapisan komponen bersama

| | |
| :--- | :--- |
| **Sumber** | Phase 2 ST-07, Phase 3 §4 |
| **Evidence** | Satu-satunya komponen yang dapat dipakai ulang adalah `AdminSidebar`. Tabel, modal, form, kartu statistik, empty state, dan umpan balik diimplementasikan ulang per halaman memakai `style={{}}` inline. |
| **Impact** | Setiap layar baru berarti menulis ulang pola yang sama. Dengan 12 layar yang masih harus dibangun (Phase 2 §4.5), debt ini akan berlipat 12 kali bila tidak ditangani lebih dulu. |
| **Severity** | Medium |
| **Solution** | Ekstrak `<DataTable>`, `<Modal>`, `<Field>`, `<EmptyState>`, `<Feedback>` sebelum membangun layar-layar baru. |
| **Complexity** | Medium |
| **Priority** | P1 — **penempatan waktunya penting: sebelum Phase B, bukan sesudah** |

### SD-06 · Tidak ada infrastruktur pengujian

| | |
| :--- | :--- |
| **Sumber** | Phase 2 §4.5, Phase 1 GAP-10 |
| **Evidence** | Tidak ada berkas uji, tidak ada framework di `package.json`, tidak ada CI. README §9 mendefinisikan 25 kasus uji dan §9.4 menjadikannya kriteria kelulusan. |
| **Impact** | Dua *invariant* terpenting (I-03 kecocokan HPP, I-08 rekonsiliasi persediaan) tidak dapat diverifikasi. Untuk skripsi, bab Pengujian belum punya bahan. |
| **Severity** | High |
| **Solution** | Tetapkan tooling lebih dulu (GAP-10), termasuk harness untuk uji konkurensi I-05 yang tidak dapat dijalankan runner unit biasa. |
| **Complexity** | Medium |
| **Priority** | P1 |

### SD-07 · Konvensi `middleware` sudah usang

| | |
| :--- | :--- |
| **Sumber** | Phase 2 §4.4, Phase 6 §1 |
| **Evidence** | Build memunculkan peringatan; `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` menyatakan Middleware berganti nama menjadi Proxy sejak Next 16. README §4.3 sudah menetapkan `proxy.ts`. |
| **Impact** | Rendah hari ini (fungsinya identik), tetapi akan menjadi blocker pada upgrade berikutnya. `AGENTS.md` proyek secara eksplisit meminta deprecation diperhatikan. |
| **Severity** | Low |
| **Solution** | Rename berkas dan ekspor fungsi `proxy`. |
| **Complexity** | Small |
| **Priority** | P2 |

---

## 3. UX DEBT

### UD-01 · Batas periode memakai zona waktu server

| | |
| :--- | :--- |
| **Sumber** | Phase 2 §4.1 |
| **Evidence** | `dashboard/page.tsx:13-15` memakai `new Date()` polos; kolom waktu bertipe `TIMESTAMP(3)` tanpa zona; `lib/period.ts` belum ada. |
| **Impact** | Di Vercel (UTC), "Pendapatan Hari Ini" berganti hari pukul 07:00 WIB. Transaksi malam — jam paling ramai kafe — masuk ke tanggal yang salah. Tidak terlihat saat pengembangan lokal karena zona waktunya kebetulan WIB; baru muncul setelah deploy. |
| **Severity** | High |
| **Solution** | `lib/period.ts` + migrasi kolom ke `TIMESTAMPTZ`. |
| **Complexity** | Small |
| **Priority** | P0 |

### UD-02 · Total pada halaman daftar dihitung dari `take`

| | |
| :--- | :--- |
| **Sumber** | Phase 4 UX-12, Phase 6 PF-04/PF-05, Phase 8 CT-05 |
| **Evidence** | `expenses/page.tsx:15-23` (`take: 50`), `sales/page.tsx:9,16-17` (`take: 100`). |
| **Impact** | Angka yang ditampilkan **salah** begitu data melewati ambang, tanpa indikasi apa pun. Labelnya juga tidak menyebut cakupan. |
| **Severity** | High |
| **Solution** | Ganti ke agregasi basis data (§8.2). |
| **Complexity** | Small |
| **Priority** | P0 |

### UD-03 · Tidak ada kalkulator kembalian

| | |
| :--- | :--- |
| **Sumber** | Phase 4 UX-03 |
| **Evidence** | Tidak ada input uang diterima di `CashierPOS.tsx`; kolom `cash_received`/`change_amount` belum ada (§5.10). |
| **Impact** | Titik kesalahan uang paling umum pada POS tidak dibantu sistem. Juga membuat `expected_cash` (§7.6) tidak dapat diverifikasi per transaksi. |
| **Severity** | High |
| **Solution** | Setelah SD-01. |
| **Complexity** | Small (setelah skema) |
| **Priority** | P1 |

### UD-04 · Bukti transaksi tidak dapat ditelusuri

| | |
| :--- | :--- |
| **Sumber** | Phase 4 UX-04, Phase 2 §4.2 |
| **Evidence** | `CashierPOS.tsx:112` membangkitkan `` `TRX-${Date.now()}` `` di klien setelah aksi selesai — pasti berbeda dari nomor server (`cashier/actions.ts:101`). |
| **Impact** | Kasir tidak dapat mencari kembali transaksi. Menjadi fatal begitu layar struk (L-17) dibangun di atas state ini. |
| **Severity** | High |
| **Solution** | Server action mengembalikan `{ invoiceNumber, saleId }`; antarmuka memakai nilai tersebut. |
| **Complexity** | Small |
| **Priority** | P1 |

### UD-05 · Produk tidak dapat diubah

| | |
| :--- | :--- |
| **Sumber** | Phase 2 §4.3, Phase 4 UX-08 |
| **Evidence** | Tidak ada `updateProduct` di seluruh `src/`. |
| **Impact** | Harga jual tidak dapat diperbarui. Satu-satunya jalur (hapus lalu buat ulang) gagal untuk menu yang pernah terjual karena FK `Restrict`. Praktis: **harga menu terkunci setelah menu pernah laku.** |
| **Severity** | High |
| **Solution** | Tambahkan `updateProduct` + form ubah. |
| **Complexity** | Small |
| **Priority** | P1 |

### UD-06 · Penyusun resep BOM tidak ada

| | |
| :--- | :--- |
| **Sumber** | Phase 2 §4.3 |
| **Evidence** | Tidak ada satu pun Server Action untuk `Recipe`. `createProduct` mengunci `hasRecipe: false`. Resep hanya dapat dibuat lewat `seed.ts`. |
| **Impact** | Admin tidak akan pernah dapat membuat menu ber-BOM dari aplikasi — memblokir fitur inti sistem. |
| **Severity** | High |
| **Solution** | Bangun L-07 termasuk pembaruan otomatis `has_recipe` (§5.4). |
| **Complexity** | Medium |
| **Priority** | P1 |

### UD-07 · Nol interaksi keyboard

| | |
| :--- | :--- |
| **Sumber** | Phase 4 UX-10, Phase 5 §4 |
| **Evidence** | Tidak ada satu pun `onKeyDown`/`onKeyUp` di `src/`. Tidak ada Escape pada modal, tidak ada focus trap, tidak ada shortcut kasir, tidak ada dukungan pemindai barcode. |
| **Impact** | POS cepat hampir selalu dioperasikan keyboard. Setiap item menuntut perpindahan tangan ke mouse/sentuh. Sekaligus masalah aksesibilitas (A11Y-07). |
| **Severity** | High |
| **Solution** | Escape + focus trap pada modal lebih dulu (aksesibilitas), shortcut kasir menyusul. |
| **Complexity** | Medium |
| **Priority** | P1 (modal) / P2 (shortcut) |

### UD-08 · Tidak ada paginasi, filter tanggal, atau pencarian admin

| | |
| :--- | :--- |
| **Sumber** | Phase 4 §7 |
| **Evidence** | Seluruh daftar memakai `take` tetap tanpa navigasi. Dashboard terkunci pada hari ini + bulan berjalan. Tidak ada pencarian di halaman admin mana pun. |
| **Impact** | Data lama tidak terjangkau dari antarmuka. §2.2 L-10/L-11 mensyaratkan filter tanggal; §8.5 melarang `take` tetap. |
| **Severity** | Medium |
| **Solution** | Komponen paginasi bersama (bergantung SD-05). |
| **Complexity** | Medium |
| **Priority** | P2 |

### UD-09 · Target sentuh di bawah 44px pada kontrol kasir

| | |
| :--- | :--- |
| **Sumber** | Phase 5 A11Y-10 |
| **Evidence** | Tombol qty `−`/`+` 28px; `.btn-sm` ≈31px; tombol metode bayar ≈31px. README §8.6 menetapkan tablet sebagai prioritas utama layar kasir. |
| **Impact** | Kontrol yang paling sering ditekan justru paling kecil. |
| **Severity** | High untuk konteks tablet |
| **Solution** | Naikkan ukuran kontrol kasir; bagian dari konsolidasi design system. |
| **Complexity** | Small |
| **Priority** | P1 |

### UD-10 · Keranjang tidak dipersistensi

| | |
| :--- | :--- |
| **Sumber** | Phase 6 §2 |
| **Evidence** | State keranjang murni `useState` lokal (`CashierPOS.tsx:64`). |
| **Impact** | Refresh halaman atau navigasi tidak sengaja menghapus keranjang yang sedang diisi. Pada jam sibuk, ini kehilangan pekerjaan nyata. |
| **Severity** | Medium |
| **Solution** | Persistensi ke `sessionStorage`. **Requires verification** — README belum memutuskan (Phase 1 §4 state management). |
| **Complexity** | Small |
| **Priority** | P2 |

### UD-11 · Tidak ada loading, empty, dan error state yang terstandardisasi

| | |
| :--- | :--- |
| **Sumber** | Phase 1 GAP-01, Phase 3 CP-04, Phase 4 §6, Phase 8 CT-10 |
| **Evidence** | Tidak ada `loading.tsx`/`error.tsx` di rute mana pun; 7 empty state tanpa standar dan tanpa aksi; 3 implementasi umpan balik sukses; 2 form tanpa state loading tombol. |
| **Impact** | Setiap layar menyelesaikannya sendiri. Dengan 12 layar yang akan dibangun, inkonsistensinya akan melebar. |
| **Severity** | Medium |
| **Solution** | Tetapkan kontrak tiga state (GAP-01) lalu implementasikan sebagai komponen bersama (SD-05). |
| **Complexity** | Medium |
| **Priority** | P1 |

---

## 4. VISUAL DEBT

### VD-01 · Tidak ada skala tipografi maupun spasi

| | |
| :--- | :--- |
| **Sumber** | Phase 3 TY-02, SP-01 |
| **Evidence** | 19 ukuran font berbeda (`0.6`–`2.5rem`, banyak berselisih 0,02rem); 17 nilai spasi (`0.2`–`2rem`, sebagian berselisih 0,05rem). Tidak ada token untuk keduanya. |
| **Impact** | Setiap layar baru menambah nilai baru. Konsistensi visual mustahil dijaga secara manual. |
| **Severity** | Medium |
| **Solution** | Definisikan skala token; ganti nilai inline secara bertahap. |
| **Complexity** | Medium |
| **Priority** | P2 |

### VD-02 · Kontras token gagal WCAG AA

| | |
| :--- | :--- |
| **Sumber** | Phase 3 CL-01/CL-02, Phase 5 A11Y-08 |
| **Evidence** | Dihitung: `--text-muted` 2,69–3,60:1 pada keempat permukaan; `--danger` 3,81:1 dan `--info` 3,90:1 pada `bg-card`. Ambang 4,5:1. |
| **Impact** | Teks sekunder, timestamp, placeholder, dan empty state sulit dibaca. Nominal pengeluaran berwarna danger di bawah ambang. |
| **Severity** | High |
| **Solution** | Cerahkan `--text-muted` dan varian danger/info untuk pemakaian di atas permukaan gelap. Perbaikan satu berkas. |
| **Complexity** | Small |
| **Priority** | P1 — dampak tinggi, effort rendah |

### VD-03 · Angka uang tanpa tabular numerals

| | |
| :--- | :--- |
| **Sumber** | Phase 3 TY-01 |
| **Evidence** | `grep -rn 'tabular' src/` → tidak ada. Seluruh nominal dirender dengan Inter proporsional. |
| **Impact** | Digit tidak sejajar antar baris pada kolom nominal. Untuk aplikasi yang seluruh nilainya uang dan tujuannya pemindaian cepat, ini cacat fungsional. Inter mendukungnya — perbaikan satu baris CSS. |
| **Severity** | Medium |
| **Solution** | `font-variant-numeric: tabular-nums` pada `td` dan kelas nominal. |
| **Complexity** | Small |
| **Priority** | P1 — dampak tinggi, effort sangat rendah |

### VD-04 · Nol `@media` query; tidak adaptif

| | |
| :--- | :--- |
| **Sumber** | Phase 3 LY-01, Phase 5 §9 |
| **Evidence** | `grep -c '@media' globals.css` → 0. Sidebar `16rem` tetap, keranjang `340px` tetap, grid `px` di-hardcode di 6 halaman. |
| **Impact** | README §8.6 menargetkan tablet sebagai prioritas utama kasir; saat ini aplikasi praktis desktop-only. Juga gagal pada pembesaran 200%. |
| **Severity** | High |
| **Solution** | Breakpoint + tata letak tablet untuk layar kasir lebih dulu. |
| **Complexity** | Medium |
| **Priority** | P1 |

### VD-05 · Inkonsistensi komponen visual

| | |
| :--- | :--- |
| **Sumber** | Phase 3 CP-03/CP-04/CP-05/CP-06/CP-07 |
| **Evidence** | Border ganda card-in-card ditangani tidak seragam (`sales:41` tanpa penyiasatan vs `purchases:37` dengan); `.card` dilawan `padding: 0` di 5 tempat; magic value tersebar; literal warna berdampingan dengan token. |
| **Impact** | UI terlihat belum selesai; API komponen yang salah memaksa override berulang. |
| **Severity** | Medium |
| **Solution** | Perbaiki API `.card` (varian tanpa padding), hilangkan border ganda, tokenkan nilai berulang. |
| **Complexity** | Small |
| **Priority** | P2 |

### VD-06 · Klaster anti-pattern pada halaman login

| | |
| :--- | :--- |
| **Sumber** | Phase 3 §5, SL-01 |
| **Evidence** | Tujuh anti-pattern bernama hallmark berkumpul di `login/page.tsx`: floating-orb decoration (2 div 30rem/24rem), gradient headline (`background-clip: text`), glassmorphism tanpa tujuan, full-viewport centred, shadow-glow, emoji sebagai ikon, centred everything. |
| **Impact** | Rendah secara fungsional — login dilihat sekali sehari selama beberapa detik. Yang menjadi catatan: perhatian desain terkonsentrasi pada layar yang paling jarang dipakai, sementara layar kasir yang dipakai sepanjang shift tidak mendapat perlakuan setara. |
| **Severity** | Low |
| **Solution** | Sederhanakan saat konsolidasi design system. **Bukan prioritas** — tidak boleh mendahului pekerjaan fundamental. |
| **Complexity** | Small |
| **Priority** | P3 |

---

## 5. MAINTENANCE DEBT

### MD-01 · Logika terduplikasi lintas berkas

| | |
| :--- | :--- |
| **Sumber** | Phase 2 ST-01/ST-02/ST-03 |
| **Evidence** | `formatRupiah`/`formatRp` didefinisikan 3 kali + 4 inline; batas periode ditulis ulang 2 kali (`expenses/page.tsx:22` memanggil `new Date()` tiga kali dalam satu ekspresi, diulang utuh di baris 43); badge metode bayar disalin identik 2 kali. |
| **Impact** | Mengubah format rupiah hari ini menuntut sentuhan di 7 tempat. Duplikasi batas periode adalah **penyebab langsung** UD-01 sulit diperbaiki di satu tempat. |
| **Severity** | Medium |
| **Solution** | Diselesaikan otomatis oleh SD-03 (`lib/money.ts`, `lib/period.ts`). |
| **Complexity** | Small |
| **Priority** | P1 (menyatu dengan SD-03) |

### MD-02 · Tipe uang hilang di batas klien/server

| | |
| :--- | :--- |
| **Sumber** | Phase 2 ST-04, Phase 6 §5 |
| **Evidence** | `JSON.parse(JSON.stringify())` dipakai di 4 halaman; komponen penerima mengetik field uang sebagai `unknown` lalu memaksa `Number()` (`CashierPOS.tsx:11,16,22-23`). |
| **Impact** | Type safety hilang tepat pada data paling kritis. Melanggar §3.2 yang mensyaratkan `Decimal` sampai lapisan tampilan. |
| **Severity** | Medium |
| **Solution** | Tipe DTO eksplisit untuk data yang diserialisasi; konversi terpusat di `lib/money.ts`. |
| **Complexity** | Medium |
| **Priority** | P2 |

### MD-03 · Lint gagal dan mencakup folder vendor

| | |
| :--- | :--- |
| **Sumber** | Phase 6 §5 |
| **Evidence** | `npx eslint .` → 3 error, 21 warning. Error: `cashier/actions.ts:61` prefer-const (jejak CD dari average costing yang belum selesai), 2× `require()` di `test_db.js`. `hallmark-main/` tidak masuk `globalIgnores`. |
| **Impact** | §9.4 menjadikan lint bersih sebagai kriteria kelulusan. Lint yang selalu merah membuat sinyalnya diabaikan. |
| **Severity** | Low |
| **Solution** | Tambahkan `hallmark-main/**` ke ignores; hapus `test_db.js`; error prefer-const hilang sendiri saat average costing diimplementasikan. |
| **Complexity** | Small |
| **Priority** | P2 |

### MD-04 · Berkas dan kode mati

| | |
| :--- | :--- |
| **Sumber** | Phase 2 ST-06, Phase 3 CP-02 |
| **Evidence** | `test_db.js` di akar; `matchaLatte` tidak dipakai (`seed.ts:112`); `.pulse-slow` tidak pernah dipakai; `@keyframes spin` didefinisikan dua kali di dalam `<style>` komponen. |
| **Impact** | Rendah. Kebisingan repositori. |
| **Severity** | Low |
| **Solution** | Hapus. |
| **Complexity** | Small |
| **Priority** | P3 |

### MD-05 · Data seed tidak sesuai kebijakan costing

| | |
| :--- | :--- |
| **Sumber** | Phase 2 §4.2 |
| **Evidence** | `seed.ts:43-82` mengisi `currentStock` langsung tanpa membuat `purchases` atau `stock_transactions`. §3.6.C mewajibkan saldo pembukaan dicatat sebagai transaksi `opening`. |
| **Impact** | `average_cost` akan bernilai 0 sehingga **seluruh menu ber-BOM jatuh ke jalur fallback** — fitur average costing tampak tidak bekerja meski kodenya benar. Akan sangat membingungkan saat pengujian. |
| **Severity** | Medium |
| **Solution** | Perbaiki seed bersamaan dengan SD-01. |
| **Complexity** | Small |
| **Priority** | P1 |

### MD-06 · Inkonsistensi pola form

| | |
| :--- | :--- |
| **Sumber** | Phase 2 ST-05/ST-08 |
| **Evidence** | Empat form memakai `onSubmit` + state; satu memakai `<form action={...}>` server action dengan `await import()` dinamis di dalamnya (`expenses/page.tsx:73-77`) padahal impor tingkat modul tersedia. |
| **Impact** | Rendah. Dua pola berdampingan tanpa alasan yang terlihat menyulitkan pengembang baru memilih. |
| **Severity** | Low |
| **Solution** | Seragamkan saat menangani CD-09. |
| **Complexity** | Small |
| **Priority** | P3 |

### MD-07 · Font dimuat lewat `@import` CSS

| | |
| :--- | :--- |
| **Sumber** | Phase 6 §2 |
| **Evidence** | `globals.css:6` — `@import url("https://fonts.googleapis.com/...")`. |
| **Impact** | Penemuan font tertunda sampai CSS terunduh dan diurai. `next/font` menghilangkan round-trip dan menyediakan `font-display` otomatis. Dampak kecil tetapi nyata pada muat pertama. |
| **Severity** | Low |
| **Solution** | Pindahkan ke `next/font`. |
| **Complexity** | Small |
| **Priority** | P3 |

---

## 6. REKAPITULASI

| Kategori | Jumlah | P0 | P1 | P2 | P3 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Critical Debt | 9 | 7 | 2 | — | — |
| Structural Debt | 7 | 3 | 3 | 1 | — |
| UX Debt | 11 | 2 | 6 | 3 | — |
| Visual Debt | 6 | — | 3 | 2 | 1 |
| Maintenance Debt | 7 | — | 2 | 2 | 3 |
| **Total** | **40** | **12** | **16** | **8** | **4** |

### Konsentrasi akar penyebab

Empat pekerjaan menutup **24 dari 40 butir debt**:

| Pekerjaan | Menutup |
| :--- | :--- |
| **Migrasi skema §5.15 + CHECK + indeks + sequence** (SD-01, SD-02) | CD-04 sebagian, CD-05 sebagian, CD-07, SD-01, SD-02, UD-03, UD-06 sebagian, MD-05 — dan membuka blokir 15 item *Not Found* Phase 2 |
| **Buat 4 modul `lib/`** (SD-03) | CD-06, SD-03, SD-04, UD-01, MD-01, dan membuka jalan bagi SD-06 |
| **Validasi `zod` + bentuk hasil seragam** (CD-05, CD-09) | CD-05, CD-09, UD-11 sebagian, CT-07/CT-08 Phase 8 |
| **Ekstrak komponen bersama** (SD-05) | SD-05, UD-08, UD-11, VD-05, sebagian VD-01 |

Ini alasan utama peta jalan Phase 11 harus diurutkan berdasarkan **dependency, bukan severity**: mengerjakan UD-03 (kalkulator kembalian) sebelum SD-01 (migrasi skema) tidak mungkin, dan mengerjakan VD-01 (skala tipografi) sebelum SD-05 (komponen bersama) berarti menokenkan nilai yang akan ditulis ulang.

### Yang sengaja TIDAK dimasukkan sebagai debt

Sesuai Phase 0 aturan 4, berikut hal-hal yang **tidak** ditandai sebagai debt meski dapat terlihat seperti itu:

- **Tidak adanya lapisan repository/service/domain** — arsitektur route-colocated sudah sesuai untuk skala ini (Phase 6 §6).
- **Tidak adanya paginasi virtualisasi, caching layer, atau optimasi re-render** — belum ada evidence bottleneck (Phase 6 §7 Potential).
- **Tidak adanya indeks basis data sebagai isu performa** — pada volume saat ini seq scan tetap cepat; indeks dikerjakan karena murah saat migrasi, bukan karena terbukti lambat.
- **Tidak adanya dark/light mode toggle** — keputusan single-theme sah untuk POS internal.
- **`confirm()` bawaan peramban untuk penghapusan** — aksi memang destruktif; yang bermasalah adalah ketiadaan penanganan galat, bukan pemakaian `confirm()`.
- **Kode aplikasi belum ter-*commit*** — bukan gap kode terhadap dokumen desain, dan bukan pelanggaran ketentuan README mana pun.

---

**Output Phase 9 selesai. Lanjut ke Phase 10.**
