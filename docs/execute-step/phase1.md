# PHASE 1 — AUDIT README / PRODUCT PLANNING

**Objek audit:** `README.md` — Dokumen Desain Sistem
**Aturan berlaku:** Phase 0
**Status output:** Selesai

---

## 1. RINGKASAN PENILAIAN

README sudah berbentuk **dokumen desain yang layak dijadikan blueprint**, bukan sekadar catatan fitur. Sepuluh bab mencakup definisi produk, kebijakan akuntansi, skema basis data lengkap, diagram, kebutuhan non-fungsional, strategi pengujian, dan runbook deployment.

Kekuatan terbesarnya adalah **kebijakan akuntansi yang dinyatakan eksplisit** (§3.1) dan **skema yang dapat dieksekusi** — skema Prisma §5.15 lolos `npx prisma validate` [Confirmed], sehingga blueprint ini tidak berhenti di tataran narasi.

Kelemahan terbesarnya bersifat sistematis: **README kuat pada lapisan data dan akuntansi, tetapi tipis pada lapisan antarmuka dan operasional lapangan.** Tidak ada spesifikasi state UI, tidak ada spesifikasi visual, tidak ada penanganan kondisi jaringan, dan tidak ada rencana transisi data dari skema yang sudah berjalan ke skema target.

Penilaian: **cukup profesional sebagai blueprint data & business logic; belum memadai sebagai blueprint UI/UX dan operasional.**

---

## 2. PRODUCT DEFINITION

| Aspek | Status | Evidence | Catatan |
| :--- | :--- | :--- | :--- |
| Tujuan aplikasi | Confirmed | §1.1 | Jelas: POS + analisis laba kotor/bersih otomatis. |
| Target user | Confirmed | §2.1 | Dua peran: Admin/Owner dan Kasir. |
| Problem yang diselesaikan | Confirmed | §1.1 | Pencatatan manual/terfragmentasi, owner tidak dapat memantau laba real-time. |
| Scope | Confirmed | §1.3 | Daftar eksplisit. |
| Non-scope | Confirmed | §1.3 | Lima batasan disebut (penggajian, payment gateway, multi-cabang, penyusutan, loyalitas). Kualitas di atas rata-rata — sebagian besar dokumen desain melewatkan bagian ini. |
| Business workflow | Confirmed | §6.3–6.6 | Empat flowchart: penjualan, pembaruan harga rata-rata, laba periodik, shift. |
| Core use cases | Confirmed | §6.1 | 21 use case terpetakan ke dua aktor. |
| User roles | Partially Confirmed | §2.1 | Peran didefinisikan pada level fitur, bukan level aksi. Lihat GAP-04. |
| Operational context | Partially Confirmed | §1.1, §8.6 | Konteks kafe disebut, tetapi kondisi lapangan (jaringan, perangkat, jam sibuk) tidak dimodelkan. Lihat GAP-05. |
| Assumptions | Not Found | — | Tidak ada bagian asumsi eksplisit. Beberapa asumsi tersirat (satu lokasi, dua peran, koneksi internet selalu tersedia) tidak pernah dinyatakan sehingga tidak dapat diuji. |

---

## 3. FUNCTIONAL PLANNING

Kolom "Relevan" menilai apakah fitur tersebut memang dibutuhkan pada konteks POS kafe satu lokasi seperti dijelaskan README — bukan apakah POS pada umumnya memilikinya.

| Area | Relevan | Direncanakan | Evidence |
| :--- | :---: | :--- | :--- |
| Authentication | Ya | Confirmed | §2.1, §8.1 — JWT, cookie httpOnly, sesi 8 jam. |
| Authorization | Ya | Confirmed | §4.3 — tiga lapisan, dengan alasan teknis mengapa lapisan ketiga wajib. |
| User management | Ya | Confirmed | §2.1, §5.2, L-14. |
| Products | Ya | Confirmed | §5.4, L-06. |
| Categories produk | Marginal | Not Found | Menu kafe kecil (5 menu pada seed). Pencarian teks §2.2 L-16 kemungkinan memadai. Bukan gap serius pada skala ini, tetapi lihat GAP-08. |
| Inventory | Ya | Confirmed | §5.3, §3.6 — lengkap dengan nilai persediaan dan harga rata-rata. |
| Stock movement | Ya | Confirmed | §5.6, §7.3, §7.5 — enam `StockSource` termasuk `opening`, `adjustment`, `waste`. |
| Sales | Ya | Confirmed | §5.10, §6.3. |
| Cart | Ya | Confirmed | §2.2 L-16. |
| Payment | Ya | Confirmed | §7.9 — tunai/QRIS/transfer, dengan alasan pemisahan (rekonsiliasi kas shift). |
| Transaction | Ya | Confirmed | §3.4, §5.10 — model DPP lengkap. |
| Receipt | Ya | Confirmed | §7.7 — isi struk dirinci, termal 58/80mm. |
| Customer | Tidak | Non-scope | §1.3 — dinyatakan di luar lingkup. Wajar untuk kafe tanpa program loyalitas. |
| Supplier | Ya | Partially Confirmed | `supplier_name` hanya kolom teks bebas pada `purchases` (§5.7). Tidak ada master supplier. Wajar pada skala ini. |
| Reporting | Ya | Confirmed | §2.2 L-11, L-12; §3.9. |
| Dashboard | Ya | Confirmed | §2.2 L-02. |
| Settings | Marginal | Not Found | Tarif pajak disimpan per transaksi (§5.10) tanpa tempat mengaturnya. Lihat GAP-09. |
| Audit trail | Ya | Confirmed | §5.13, §8.4. |
| Notifications | Marginal | Partially Confirmed | Safety stock alert (§7.1) bersifat in-app saja. Memadai untuk owner yang membuka dashboard harian. |
| Search/filter/sort | Ya | Partially Confirmed | Pencarian menu (L-16) dan filter tanggal (L-10, L-11) disebut. Sorting tidak pernah disebut di layar mana pun. |
| Import/export | Ya | Confirmed | Ekspor Excel/PDF (§2.1, L-11). Impor tidak direncanakan — wajar. |
| Backup/recovery | Ya | Confirmed | §8.3 — RPO 24 jam, RTO 4 jam, uji pemulihan diwajibkan. |

---

## 4. TECHNICAL PLANNING

| Area | Status | Evidence & Catatan |
| :--- | :--- | :--- |
| Frontend architecture | Partially Confirmed | §4.1–4.2 menetapkan Next.js App Router dan struktur direktori. Tidak ada keputusan mengenai komposisi komponen, boundary client/server, atau design system. Lihat GAP-02. |
| Backend architecture | Confirmed | Server Actions sebagai lapisan tunggal, dengan alasan yang dinyatakan (§4.1). |
| Database | Confirmed | §5 lengkap — 12 model, 9 enum, 17 CHECK, 17 indeks. |
| API | Confirmed (by design) | Tidak ada REST/GraphQL; Server Actions dipilih secara sadar. Keputusan ini konsisten dengan §4.3 yang menyadari implikasi keamanannya. |
| State management | Not Found | Tidak dibahas. Untuk keranjang kasir — state paling kompleks di aplikasi — tidak ada keputusan apakah cukup `useState` lokal atau perlu persistensi. Lihat GAP-03. |
| Validation | Confirmed | §8.1 — `zod` pada seluruh Server Action, dengan aturan konkret (harga/kuantitas tidak negatif, tanggal tidak melampaui hari ini). |
| Authentication | Confirmed | §8.1. |
| Authorization | Confirmed | §4.3 — termasuk penjelasan mengapa proteksi rute tidak menjangkau Server Action. |
| Error handling | Partially Confirmed | §8.4 menyebut log kegagalan Server Action. Tidak ada keputusan tentang bagaimana galat disampaikan ke pengguna. Lihat GAP-01. |
| Logging | Partially Confirmed | §8.4 — dua jenis log disebut, tanpa menentukan tujuan penyimpanan atau retensi log aplikasi. |
| Testing | Partially Confirmed | §9 memuat 25 kasus uji konkret dengan kriteria kelulusan. Namun tidak ada keputusan tooling. Lihat GAP-10. |
| Observability | Not Found | Tidak ada rencana monitoring, alerting, atau health check. Untuk aplikasi satu kafe pada Vercel, ini dapat diterima — tetapi sebaiknya dinyatakan sebagai keputusan sadar, bukan kekosongan. |
| Deployment | Confirmed | §10.4–10.6, termasuk prosedur rollback dan aturan migrasi dua tahap untuk penghapusan kolom. Kualitas di atas rata-rata. |
| Environment management | Confirmed | §10.2 — empat variabel didaftar beserta perbedaan pooler vs direct URL. |
| Scalability | Confirmed (proporsional) | Tidak dibahas berlebihan, dan itu tepat untuk satu kafe. §8.2 menetapkan target waktu respons, bukan target throughput. |
| Maintainability | Partially Confirmed | §4.2 mendefinisikan modul `lib/`. Tidak ada standar kode, konvensi penamaan, atau aturan review. |

---

## 5. MISSING PLANNING

Bagian ini adalah temuan utama Phase 1. Diurutkan berdasarkan dampak.

### GAP-01 — Loading, empty, dan error state tidak dispesifikasikan · **High**

Phase 0 melarang menyebut sesuatu wajib tanpa alasan. Alasannya di sini konkret: §2.2 mendefinisikan 20 layar, dan **tidak satu pun menyebutkan perilaku saat data sedang dimuat, saat data kosong, atau saat operasi gagal.** §8.1 mewajibkan validasi `zod`, tetapi tidak pernah menyatakan bagaimana pesan galat validasi sampai ke pengguna.

Dampak langsung: pengembang tidak punya acuan, sehingga setiap layar akan menyelesaikannya sendiri-sendiri. Untuk aplikasi kasir, kegagalan senyap saat *checkout* berarti kasir tidak tahu apakah transaksi tersimpan.

**Rekomendasi:** tambahkan satu subbab pada §8 yang menetapkan kontrak tiga state untuk setiap layar (loading / empty / error), plus aturan bahwa setiap Server Action mengembalikan bentuk hasil yang seragam.

### GAP-02 — Tidak ada spesifikasi UI dan design system · **High**

README menyebut "profesional" berkali-kali tetapi tidak mendefinisikan satu pun token visual: tidak ada skala tipografi, skala spasi, palet warna, ukuran kontrol, atau aturan radius. §8.6 hanya menetapkan target breakpoint.

Konsekuensinya untuk workflow ini: **Phase 3 (Visual & UI Audit) tidak memiliki acuan resmi untuk mengaudit UI.** Audit visual terpaksa dinilai terhadap prinsip umum dan `hallmark-main`, bukan terhadap keputusan desain proyek sendiri.

**Rekomendasi:** tambahkan bab design token dan aturan komponen inti (button, input, table, dialog, badge) beserta ukuran kontrol minimum — terutama karena §8.6 menargetkan tablet sebagai perangkat utama kasir.

### GAP-03 — Idempotency dan pencegahan transaksi ganda · **High**

§5.10 memecahkan tabrakan *nomor invoice* melalui sequence. Itu menyelesaikan keunikan nomor, **bukan** duplikasi transaksi.

Skenario yang tidak tertangani: kasir menekan tombol Bayar dua kali, atau jaringan putus setelah request terkirim tetapi sebelum respons diterima sehingga kasir mengulang. Keduanya menghasilkan dua transaksi sah dengan nomor berbeda, dua kali pemotongan stok, dan laporan laba yang salah.

§6.3 menggambarkan alur *checkout* tanpa langkah idempotency. Tidak ada kolom kunci idempotensi pada `sales` (§5.10).

**Rekomendasi:** tetapkan kunci idempotensi yang dibangkitkan klien saat keranjang dibuat, disimpan unik pada `sales`, sehingga pengiriman ulang mengembalikan transaksi yang sama alih-alih membuat yang baru.

### GAP-04 — Permission matrix hanya pada level fitur · **Medium**

§2.1 menyatakan siapa boleh mengakses modul apa. Yang belum ditetapkan adalah batas dalam modul, misalnya: apakah kasir boleh memberi diskon, dan sampai berapa besar? §7.8 memperkenalkan diskon nominal tanpa menyebut siapa yang berwenang atau apakah ada plafon.

Untuk POS, diskon tanpa plafon pada peran kasir adalah kanal kebocoran pendapatan yang klasik.

**Rekomendasi:** tambahkan matriks kewenangan tingkat aksi, minimal untuk diskon, void, dan penyesuaian stok.

### GAP-05 — Perilaku offline tidak dibahas · **Medium**

Arsitekturnya (§4.1) sepenuhnya bergantung pada koneksi ke Supabase pada setiap transaksi. README tidak pernah menyatakan apa yang terjadi ketika internet kafe terputus di jam sibuk — apakah kasir berhenti melayani, atau ada prosedur manual.

Ini tidak otomatis berarti aplikasi harus offline-first; membangun sinkronisasi offline akan sangat memperbesar lingkup dan bertentangan dengan §1.3. Yang menjadi gap adalah **ketiadaan keputusan sadar**.

**Rekomendasi:** nyatakan secara eksplisit sebagai asumsi/batasan pada §1.3 beserta prosedur cadangan manual, atau naikkan menjadi requirement bila klien menganggapnya kritis.

### GAP-06 — Rencana transisi data dari skema berjalan ke skema target · **High**

§10.5 menjelaskan cara menjalankan migrasi, tetapi tidak menjelaskan migrasi **spesifik** yang dibutuhkan proyek ini. Repositori sudah memuat migrasi `20260822075607_init` dengan struktur lama, sementara §5.15 mendefinisikan struktur yang jauh berbeda.

Sejumlah kolom baru bersifat `NOT NULL` tanpa nilai default yang bermakna untuk baris lama — `stock_transactions.balance_after`, `value_after`, dan `created_by` adalah contoh langsung. Bila basis data sudah berisi data, migrasi akan gagal atau mengisi nilai yang keliru.

Status keberadaan data pada basis data Supabase: **Belum Terverifikasi** — audit ini bersifat read-only dan tidak melakukan koneksi ke basis data produksi.

**Rekomendasi:** tambahkan subbab pada §10 yang menetapkan strategi backfill per kolom, atau keputusan sadar untuk mereset basis data pengembangan bila memang belum ada data nyata.

### GAP-07 — Interaksi waste, kas laci, dan beban operasional · **Medium**

Dua celah kecil yang saling terkait:

1. §3.6.C menetapkan nilai waste otomatis dicatat sebagai `operational_expenses`. Perlakuan akuntansinya benar (aset turun, beban naik — bukan penghitungan ganda). Namun tidak ada aturan yang mencegah admin **menghapus** baris beban hasil otomatis itu melalui L-09, yang akan membuat persediaan dan beban tidak sinkron dan merusak rekonsiliasi §3.9.
2. §5.9 menghitung `expected_cash = opening_cash + penjualan tunai`. Bila kafe membayar pengeluaran kecil memakai uang laci — praktik yang lazim — kas fisik akan selalu kurang dan selisih shift menjadi rutin.

**Rekomendasi:** tandai beban hasil otomatis sebagai tidak dapat dihapus manual; dan tentukan apakah pengeluaran dari laci dicatat sebagai komponen pengurang `expected_cash`.

### GAP-08 — Kategori produk dan skalabilitas grid kasir · **Low**

L-16 mengandalkan grid menu dan pencarian teks. Pada 5–20 menu ini efisien. README tidak menetapkan pada jumlah berapa pendekatan ini perlu berubah.

Bukan masalah sekarang. Dicatat sebagai observasi agar tidak menjadi kejutan.

### GAP-09 — Tempat mengatur tarif pajak · **Low**

`sales.tax_rate` disimpan per transaksi (keputusan yang tepat untuk akurasi historis), tetapi tidak ada layar atau tabel yang menyimpan tarif berlaku saat ini. Tanpa itu, tarif harus di-*hardcode*.

**Rekomendasi:** tambahkan penyimpanan konfigurasi sederhana, atau nyatakan tarif sebagai konstanta aplikasi bila memang tidak akan berubah.

### GAP-10 — Tooling pengujian tidak diputuskan · **Medium**

§9 memuat 25 kasus uji yang sangat konkret dan dua *invariant* yang tajam (I-03, I-08). Namun tidak menyebut framework, cara menyiapkan basis data uji, atau apakah pengujian dijalankan di CI.

Kasus I-05 (uji konkurensi dua *checkout* bersamaan) khususnya memerlukan harness khusus yang tidak disediakan oleh runner unit biasa.

**Rekomendasi:** tetapkan tooling dan strategi basis data uji sebelum Phase A dimulai, karena §9.4 menjadikan kelulusan pengujian sebagai kriteria selesai.

---

## 6. KONTRADIKSI INTERNAL

Pemeriksaan silang antar bab README.

| Kode | Temuan | Status |
| :--- | :--- | :--- |
| C-01 | §1.3 menyatakan penggajian di luar lingkup; §3.8 mengulang hal yang sama untuk OPEX. Konsisten. | Tidak ada kontradiksi |
| C-02 | §3.1.C menyatakan pajak bukan pendapatan; §3.4 menghitung laba kotor dari DPP; §5.10 menegakkannya lewat `CHECK sales_profit_valid`. Konsisten di tiga lapisan. | Tidak ada kontradiksi |
| C-03 | §3.6.C mewajibkan saldo pembukaan dicatat sebagai transaksi `opening`; §10.3 menyatakan seed memuat "saldo pembukaan… dicatat sebagai transaksi `opening`". Konsisten sebagai rencana. Implementasi aktual berbeda — dinilai pada Phase 2. | Tidak ada kontradiksi internal |
| C-04 | §2.1 memberi Kasir hak "Buka & Tutup Shift", dan §7.6 mewajibkan shift terbuka sebelum transaksi. Namun §6.1 use case UC11 juga diberikan ke Admin, sementara §2.2 tidak menyediakan layar shift untuk Admin (L-20 hanya di `/cashier`). Admin yang bertindak sebagai kasir tidak punya jalur membuka shift. | **Kontradiksi ringan — perlu diselaraskan** |
| C-05 | §8.5 melarang `take` tetap tanpa navigasi halaman; §2.2 tidak menyebut paginasi pada layar mana pun. Bukan kontradiksi langsung, tetapi §2.2 tidak mencerminkan kewajiban §8.5. | **Ketidakselarasan antar bab** |

---

## 7. KESIMPULAN PHASE 1

**Apakah README sudah cukup profesional sebagai blueprint POS production-grade?**

**Sebagian.** Untuk lapisan data, akuntansi, keamanan, dan deployment — ya. Bab-bab tersebut memuat keputusan yang tegas, dapat diuji, dan sebagian sudah diverifikasi secara mekanis.

Untuk lapisan antarmuka dan operasional lapangan — belum. Tiga gap High (GAP-01 state UI, GAP-02 design system, GAP-03 idempotency) ditambah GAP-06 (transisi data) harus ditutup sebelum blueprint ini aman dijadikan dasar pengerjaan penuh.

**Strengths**
- Kebijakan akuntansi eksplisit, termasuk larangan yang biasanya hanya tersirat (§3.1.A).
- Skema dapat dieksekusi dan sudah tervalidasi secara mekanis.
- `CHECK` aritmetika memindahkan penegakan rumus ke basis data (§5.10).
- Non-scope, runbook rollback, dan *invariant* pengujian jarang ada pada dokumen setingkat ini.

**Weaknesses**
- Tidak ada spesifikasi state UI maupun design token.
- Idempotency transaksi tidak dimodelkan.
- Kewenangan tingkat aksi (diskon, void) tidak dibatasi.

**Missing Areas**
- Asumsi eksplisit, perilaku offline, tooling pengujian, konfigurasi tarif pajak, strategi backfill migrasi.

**Contradictions**
- C-04 (jalur shift untuk Admin) dan C-05 (paginasi tidak tercermin di daftar layar).

---

**Output Phase 1 selesai. Lanjut ke Phase 2.**
