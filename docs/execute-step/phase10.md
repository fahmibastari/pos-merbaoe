# PHASE 10 — FINAL SYNTHESIS

**Sintesis dari:** Phase 1–9
**Acuan:** `README.md`, `docs/checkpoint.md`, `hallmark-main/`
**Status output:** Selesai

---

## 1. EXECUTIVE SUMMARY

### Tingkat kematangan aplikasi

**Kerangka fungsional yang berdiri di atas fondasi perancangan yang kuat, tetapi belum menjalankan logika yang menjadi alasan keberadaannya.**

Aplikasi ini membangun POS dengan klaim inti: HPP dihitung dinamis dari pergerakan harga bahan baku, dan laba kotor serta bersih terhitung otomatis. Ketiga mekanisme tersebut — *average costing*, pencatatan mutasi stok keluar, dan rumus laba bersih — **belum berfungsi**. Yang sudah ada adalah kerangka yang benar bentuknya di sekelilingnya: transaksi atomik, snapshot HPP, validasi stok, alur pembelian yang lengkap.

Analogi yang tepat: rangka dan instalasi bangunan sudah terpasang rapi dan sesuai gambar, tetapi mesin utamanya belum dipasang.

### Kualitas planning

**Kuat pada lapisan data dan akuntansi; tipis pada lapisan antarmuka.**

README memuat hal-hal yang jarang ada pada dokumen setingkat ini: kebijakan akuntansi eksplisit yang melarang penghitungan ganda biaya bahan (§3.1.A), skema yang **lolos `prisma validate`** sehingga bukan sekadar narasi, 17 batasan `CHECK` yang memindahkan penegakan rumus ke basis data, *invariant* pengujian yang tajam, dan runbook rollback dengan aturan migrasi dua tahap.

Yang belum ada: spesifikasi state UI, design token, idempotensi transaksi, dan strategi transisi data dari skema berjalan ke skema target.

### Kualitas implementation

Dari 51 item yang dibandingkan Phase 2: **9 Implemented, 11 Partially, 7 Inconsistent, 24 Not Found.**

Angka itu terlihat buruk, tetapi pembacaannya penting: **15 dari 24 item *Not Found* terblokir oleh satu akar penyebab yang sama** — skema basis data belum dimigrasikan. Gap-nya besar tetapi terkonsentrasi, bukan tersebar sebagai kerusakan acak. Kode yang sudah ada tidak perlu dibongkar; ia perlu dilanjutkan.

### Kualitas UI/UX

Terbelah dengan jelas. **Struktur informasi dan copywriting baik** — kepadatan tabel sesuai POS, hierarki halaman konsisten, placeholder kontekstual, pesan stok yang dapat ditindaklanjuti, nominal pada tombol bayar. **Lapisan sistem visual dan interaksi belum ada** — nol media query, nol handler keyboard, 19 ukuran font ad-hoc, kontras token gagal AA, dan satu-satunya komponen yang dapat dipakai ulang adalah sidebar.

### Technical health

40 butir debt terklasifikasi: 12 P0, 16 P1, 8 P2, 4 P3. **Empat pekerjaan menutup 24 di antaranya.** Ini indikator kesehatan yang relatif baik — debt yang terkonsentrasi jauh lebih mudah dilunasi daripada debt yang tersebar.

### Biggest risks

1. **Kredensial basis data produksi terekspos** di dalam proyek dan riwayat Git.
2. **Sesi administrator dapat ditempa** karena `JWT_SECRET` memakai nilai cadangan hardcode.
3. **Angka laba bersih yang ditampilkan tidak bermakna** — dan labelnya mengajarkan model akuntansi yang salah kepada owner.
4. **Stok dapat menjadi negatif** lewat race condition maupun kuantitas negatif yang tidak divalidasi.
5. **Fitur inti skripsi belum berfungsi** — HPP menu ber-resep masih memakai nilai statis.

### Biggest opportunities

1. **Migrasi skema membuka 15 fitur sekaligus.** Skemanya sudah tervalidasi; ini pekerjaan yang risikonya rendah dan hasilnya lebar.
2. **17 batasan `CHECK` akan menangkap seluruh kelas kesalahan secara otomatis** — termasuk rumus laba yang keliru dan kuantitas negatif. Biaya rendah, jaring pengaman permanen.
3. **Empat modul `lib/` menyelesaikan sembilan butir debt sekaligus** dan sekaligus memungkinkan 10 uji unit §9.1 ditulis.
4. **Dua perbaikan visual berdampak tinggi dengan effort sangat rendah:** kontras token dan `tabular-nums`.

### Catatan tentang penilaian

Tidak diberikan skor numerik. Instruksi Phase 10 melarang skor yang terasa dibuat-buat, dan pada aplikasi yang sebagian besar gap-nya berasal dari satu akar penyebab, angka tunggal akan menyesatkan — ia akan terbaca sebagai "kualitas rendah" padahal kondisinya lebih tepat disebut "belum selesai, dengan arah yang benar".

---

## 2. README QUALITY ASSESSMENT

**Apakah README sudah cukup profesional sebagai blueprint aplikasi POS?**

**Sebagian.** Memadai sebagai blueprint data, akuntansi, keamanan, dan deployment. Belum memadai sebagai blueprint antarmuka dan operasional lapangan.

### Strengths

| Kekuatan | Mengapa jarang ditemui |
| :--- | :--- |
| Kebijakan akuntansi eksplisit (§3.1) | Menyatakan larangan yang biasanya hanya tersirat: pembelian bahan adalah penambahan persediaan, bukan beban periode. Justru ketiadaan pernyataan inilah yang melahirkan bug laba bersih di aplikasi sejenis. |
| Skema dapat dieksekusi (§5.15) | Lolos `npx prisma validate` — blueprint yang terverifikasi secara mekanis, bukan hanya dibaca. |
| Penegakan di tingkat basis data (§5.10) | Lima `CHECK` aritmetika memaksa rumus §3.4 dipatuhi bahkan bila kode aplikasi keliru. |
| Non-scope eksplisit (§1.3) | Lima batasan disebut. Sebagian besar dokumen desain melewatkan bagian ini sepenuhnya. |
| *Invariant* pengujian (§9.2 I-03, I-08) | Dua kriteria yang benar-benar membuktikan sistem bekerja, bukan sekadar daftar "uji fitur X". |
| Runbook deployment (§10.5–10.6) | Termasuk aturan migrasi dua tahap untuk penghapusan kolom agar rollback kode tetap mungkin. |
| Alasan teknis dituliskan (§4.3) | Menjelaskan *mengapa* proteksi rute tidak menjangkau Server Action, bukan sekadar memerintahkan. |

### Weaknesses

| Kelemahan | Dampak |
| :--- | :--- |
| Tidak ada spesifikasi state UI (GAP-01) | 20 layar didefinisikan tanpa perilaku loading/empty/error. Setiap layar akan menyelesaikannya sendiri. |
| Tidak ada design token (GAP-02) | Phase 3 tidak memiliki acuan resmi untuk mengaudit UI; audit visual terpaksa bersandar pada prinsip umum. |
| Idempotensi tidak dimodelkan (GAP-03) | §5.10 menyelesaikan keunikan nomor invoice, bukan duplikasi transaksi. |
| Kewenangan hanya tingkat fitur (GAP-04) | §7.8 memperkenalkan diskon tanpa menyebut siapa berwenang atau plafonnya. |

### Missing Areas

Asumsi eksplisit; perilaku offline (GAP-05); strategi transisi data ke skema baru (GAP-06); aturan interaksi waste–kas laci–beban (GAP-07); tempat menyimpan konfigurasi tarif pajak (GAP-09); tooling pengujian (GAP-10).

### Contradictions

| Kode | Isi |
| :--- | :--- |
| C-04 | §2.1 memberi Admin hak POS dan §6.1 memberi UC11, tetapi §2.2 hanya menempatkan layar shift di `/cashier` — Admin tidak punya jalur membuka shift. |
| C-05 | §8.5 melarang `take` tetap tanpa navigasi, tetapi §2.2 tidak menyebut paginasi pada layar mana pun. |

### Recommendations

1. Tambahkan subbab kontrak tiga state (loading/empty/error) dan bentuk hasil Server Action yang seragam.
2. Tambahkan bab design token dan ukuran kontrol minimum — terutama karena §8.6 menargetkan tablet.
3. Modelkan idempotensi transaksi sebelum Phase A dimulai.
4. Tetapkan strategi backfill migrasi, atau nyatakan keputusan reset basis data pengembangan.
5. Selaraskan C-04 dan C-05.

---

## 3. CURRENT APPLICATION STATE

| Dimensi | Kondisi | Evidence |
| :--- | :--- | :--- |
| Build | Lulus — Next.js 16.2.11, 12 halaman, 8,0 detik | `npm run build` |
| Typecheck | Lulus, exit 0 | `npx tsc --noEmit` |
| Lint | **Gagal** — 3 error, 21 warning | `npx eslint .` |
| Rute | 10 (1 static, 8 dynamic, 1 not-found) dari 20 layar yang dispesifikasikan | Keluaran build vs §2.2 |
| Model basis data | 10 dari 12; 5 dari 9 enum; −27 kolom | `schema.prisma` vs §5 |
| Constraint & indeks | 3 dari 39 | `migration.sql:145-152` |
| Server Actions | 12 fungsi; 7 tanpa cek otorisasi apa pun | `admin/actions.ts`, `cashier/actions.ts` |
| Komponen bersama | 1 (`AdminSidebar`) | `src/app/**` |
| Modul `lib/` | 2 dari 6 yang direncanakan | `ls src/lib` |
| Pengujian | 0 dari 25 kasus; tidak ada CI | Struktur repositori |
| Aplikasi dijalankan | **Tidak** — seluruh audit bersifat statis | Metodologi Phase 0 |

**Apa yang benar-benar berfungsi (dari pembacaan kode, belum diuji runtime):** login dengan bcrypt dan JWT; proteksi rute dua lapis; CRUD bahan baku; tambah/nonaktifkan menu; pembelian stok multi-item yang atomik dan menulis kartu stok masuk; pencatatan pengeluaran operasional; POS dengan keranjang, pencarian, blokir stok habis yang memperhitungkan isi keranjang, dan checkout atomik dengan snapshot HPP; dashboard dengan agregasi dan deteksi stok menipis; riwayat penjualan.

**Apa yang tidak berfungsi:** average costing dinamis; kartu stok keluar; rumus laba bersih; model DPP (diskon/pajak/kembalian); void; shift; opname & waste; penyusun resep BOM; ubah produk; manajemen pengguna; audit trail; laporan periodik; laporan persediaan; struk; paginasi; filter tanggal.

---

## 4. PLANNING VS REALITY

| Area | Planned | Actual | Status | Gap | Priority |
| :--- | :--- | :--- | :--- | :--- | :---: |
| Skema basis data | 12 model, 9 enum, 17 CHECK, 17 indeks | 10 model, 5 enum, 0 CHECK, 0 indeks | Partially Implemented | −2 model, −4 enum, −27 kolom, −36 constraint | **P0** |
| Average costing (§3.6) | HPP = Σ(takaran × average_cost) | `hpp = baseHpp`, tidak pernah ditulis ulang | Not Found | Kolom target belum ada | **P0** |
| Kartu stok keluar (§7.3) | Baris `out` pada setiap penjualan | Hanya `decrement` stok | Not Found | Invariant I-03/I-08 tak teruji | **P0** |
| Laba bersih (§3.8) | Laba Kotor − OPEX | Laba Kotor − Pembelian | Inconsistent | Melanggar §3.1.A | **P0** |
| Otorisasi lapisan 3 (§4.3) | `requireAdmin()` di setiap aksi | Tidak ada `lib/guard.ts` | Not Found | 7 aksi tanpa cek | **P0** |
| Pengelolaan rahasia (§8.1) | Hanya di env | Password teks polos di proyek + Git | Inconsistent | — | **P0** |
| `JWT_SECRET` (§8.1) | Wajib, tanpa fallback | Fallback hardcode aktif | Inconsistent | — | **P0** |
| Zona waktu (§3.3) | Asia/Jakarta | `new Date()` polos, `TIMESTAMP` | Not Found | `lib/period.ts` belum ada | **P0** |
| Konkurensi stok (§7.2) | Row lock + CHECK | Statement terpisah, tanpa keduanya | Not Found | — | **P0** |
| Validasi (§8.1) | `zod` seluruh aksi | Tidak terpasang | Not Found | Kuantitas negatif diterima | **P0** |
| Agregasi (§8.2) | Di basis data | `take` + reduce di memori | Inconsistent | Angka total salah | **P0** |
| Model DPP (§3.4) | Subtotal→diskon→DPP→pajak | Hanya total/HPP/laba | Not Found | 12 kolom `sales` belum ada | P1 |
| Resep BOM (§5.4) | Admin menyusun komposisi | Tidak ada action Recipe | Not Found | Memblokir fitur inti | P1 |
| Ubah produk (§2.2 L-06) | Form tambah/ubah | Tidak ada `updateProduct` | Partially | Harga terkunci setelah terjual | P1 |
| Idempotensi | — (belum direncanakan) | Tidak ada | Not Found | Perlu keputusan desain | P1 |
| Error handling | Bentuk hasil seragam | 8 aksi tanpa try/catch; 2 form sukses palsu | Not Found | — | P1 |
| Struk (§7.7) | Termal 58/80mm | Kotak notifikasi | Not Found | Bergantung invoice server | P1 |
| Shift (§7.6) | Buka/tutup kas | Tidak ada | Not Found | Model belum ada | P1 |
| Void (§7.4) | Status + balik stok | Tidak ada | Not Found | Model belum ada | P1 |
| Kontras (§8.1 implisit) | WCAG AA | `--text-muted` 2,69–3,60:1 | Not Found | — | P1 |
| Responsivitas (§8.6) | Tablet prioritas utama | 0 `@media` query | Not Found | — | P1 |
| Komponen bersama | — (belum direncanakan) | 1 komponen | Not Found | 12 layar akan melipatgandakan | P1 |
| Paginasi (§8.5) | Seluruh daftar | `take` tetap | Not Found | — | P2 |
| Laporan periodik (§2.2) | L-11, L-12 | Tidak ada | Not Found | — | P2 |
| Manajemen pengguna (§2.1) | L-14 | Tidak ada | Not Found | Password bawaan tak bisa diganti | P2 |
| Audit trail (§8.4) | `audit_logs` | Tidak ada | Not Found | — | P2 |
| Pengujian (§9) | 25 kasus | 0 | Not Found | Kriteria §9.4 tak terpenuhi | P1 |
| Konvensi proxy (§4.3) | `proxy.ts` | `middleware.ts` | Inconsistent | Peringatan build | P2 |

---

## 5. UI/UX AUDIT

### 5.1 Visual UI

**Ada niat sistem, belum ada sistem.** Token warna terstruktur (10 langkah brand, 4 permukaan, 4 semantik), disiplin letter-spacing yang nyata, kepadatan tabel yang sesuai POS. Tetapi tidak ada skala tipografi (19 ukuran ad-hoc), tidak ada skala spasi (17 nilai), dan komposisi seluruhnya ditulis inline per halaman.

Inkonsistensi paling terlihat: border ganda card-in-card ditangani di sebagian halaman dan tidak di halaman lain, sehingga sebagian tabel berbingkai dua.

### 5.2 UX

Jawaban atas pertanyaan utama Phase 4 — *apakah kasir dapat bekerja cepat, jelas, dan minim error* — adalah **belum**, karena tiga hal: tidak ada kalkulator kembalian, bukti transaksi tidak dapat ditelusuri, dan nol interaksi keyboard.

Di sisi admin, hambatan berbeda sifatnya: empat form membuang pesan galat server, dan dua di antaranya menampilkan pesan sukses tanpa syarat. Umpan balik yang salah lebih merusak daripada umpan balik yang tidak ada.

**Yang sudah baik:** blokir stok habis yang memperhitungkan isi keranjang, nominal pada tombol bayar, form pembelian multi-item dengan total langsung, subjudul halaman yang menjelaskan konsekuensi tindakan.

### 5.3 Accessibility

Tidak ada klaim kepatuhan WCAG — tidak ada pengujian pembaca layar maupun pemindaian otomatis.

**Confirmed:** 21 dari 23 field tidak terhubung label (hanya login benar); modal tanpa `role="dialog"`, focus trap, atau Escape; `--text-muted` gagal AA pada keempat permukaan (2,69–3,60:1); target sentuh 28–31px pada kontrol kasir sementara §8.6 menargetkan tablet; galat kasir bukan live region.

**Yang sudah benar:** `lang="id"`, `<button>` asli untuk seluruh aksi, `aria-hidden` pada dekorasi login, `role="alert"` pada login, `overflow-x` pada pembungkus tabel, dan tidak ada informasi yang bergantung pada warna saja.

### 5.4 AI Slop Risk

**Sedang, dan terkonsentrasi pada halaman login.** Sebelas anti-pattern bernama hallmark cocok; tujuh di antaranya berkumpul di `login/page.tsx` — floating-orb decoration, gradient headline, glassmorphism tanpa tujuan, full-viewport centred, shadow-glow, emoji sebagai ikon, centred everything.

Halaman kerja jauh lebih bersih. Polanya khas: perhatian desain terkonsentrasi pada layar yang dilihat tiga detik sehari, bukan pada layar kasir yang dipakai sepanjang shift.

Yang **tidak** cocok dan patut dinyatakan: tidak ada purple gradient, tidak ada aurora blob, tidak ada 3-column feature grid, tidak ada side-stripe card, tidak ada bounce easing, tidak ada `hover:scale-105`, tidak ada metrik karangan. Palet berjangkar oranye tunggal dan konsisten.

Anti-pattern yang berdampak fungsional nyata — bukan sekadar estetika — adalah **tabular data tanpa `tabular-nums`**: pada aplikasi yang seluruh nilainya uang, digit yang tidak sejajar merusak pemindaian kolom.

### 5.5 Design System

Ada lapisan utilitas kelas yang benar-benar dipakai (`.btn` +4 varian, `.input`, `.badge` +5 varian, `.card`, `.stat-card`, `.table-wrapper`, `.label`). Yang belum ada adalah lapisan komposisi: tidak ada `<DataTable>`, `<Modal>`, `<Field>`, `<EmptyState>`, atau `<Feedback>` — sehingga setiap halaman menulis ulang pola yang sama.

Indikator paling jelas: `.card` di-*override* dengan `padding: 0` di lima tempat, karena API-nya memaksa padding yang tidak selalu diinginkan.

### 5.6 Responsive Behavior

**Nol `@media` query.** Ditambah lebar tetap: sidebar `16rem` dengan `marginLeft` senilai, panel keranjang `340px`, dan enam grid dengan nilai kolom di-hardcode.

README §8.6 menetapkan tablet sebagai **prioritas utama** layar kasir. Pada tablet potret 768px, panel keranjang 340px menyisakan sekitar 428px untuk grid produk yang kolom minimumnya 160px. Status **Potential** — memerlukan verifikasi rendering, tetapi arah masalahnya jelas.

---

## 6. HALLMARK ANALYSIS

`hallmark-main` diperlakukan sebagai **design knowledge reference**, bukan template. Berikut prinsip yang diekstrak dan penilaian relevansinya untuk POS.

### 6.1 Prinsip yang diekstrak

| Prinsip | Isi | Sumber |
| :--- | :--- | :--- |
| **Delapan state wajib** | Default, Hover, Focus, Active, Disabled, Loading, Error, Success. "If any of these is missing on a production element, the element isn't finished." | `interaction-and-states.md` |
| **Focus discipline** | `:focus-visible` dengan ring 2–3px, offset 2px, kontras ≥3:1. `outline: none` tanpa pengganti disebut "the most common accessibility bug and an immediate audit failure". | idem |
| **Hit target 44×44px** | Minimum untuk elemen yang dapat disentuh; diperluas lewat padding atau `::before`, bukan dengan memperbesar visual. | idem |
| **Undo over confirm** | Untuk aksi reversible, lakukan lalu tawarkan Undo. Konfirmasi hanya untuk yang benar-benar destruktif. | idem |
| **Loading & empty state** | Skeleton untuk konten berbentuk tetap; spinner inline menggantikan label tombol; empty state selalu memuat penjelasan **dan** aksi. | idem |
| **Token, bukan improvisasi** | Skala tipografi, spasi, dan warna didefinisikan sebagai token; "mid-render token improvisation" adalah anti-pattern bernama. | `tokens.css`, `anti-patterns.md` |
| **Tabular numerals** | "Tabular data without tabular-nums" adalah tell yang disebut eksplisit. | `anti-patterns.md` |
| **Larangan interaksi** | `transition-all`, hover-only functionality, focus ring dihapus tanpa pengganti, target <44px, disabled tanpa penjelasan, error yang hanya warna. | `interaction-and-states.md` |
| **Warna sebagai sistem** | Satu hue jangkar; netral di-*tint* ke arahnya; hindari netral murni dan gradient sebagai latar. | `color.md`, `anti-patterns.md` |

### 6.2 Penerapan pada POS — apa yang relevan dan apa yang tidak

Penting untuk memisahkan keduanya. `hallmark-main` adalah skill untuk **halaman pemasaran dan portofolio**; sebagian prinsipnya tidak sesuai untuk aplikasi operasional internal.

**Relevan dan berdampak langsung:**

| Prinsip | Penerapan | Temuan yang ditutup |
| :--- | :--- | :--- |
| Delapan state | Jadikan checklist kelengkapan komponen. Saat ini Loading hilang pada 2 form, Error hilang pada 4 form, dan Success dipalsukan pada 2 form. | UD-11, CD-09 |
| Hit target 44px | Kontrol kasir 28–31px, sementara §8.6 menargetkan tablet. Ini prinsip hallmark yang paling langsung mengenai kebutuhan POS. | UD-09 |
| Tabular numerals | Satu baris CSS; memperbaiki pemindaian seluruh kolom nominal. | VD-03 |
| Empty state dengan aksi | Lima empty state saat ini hanya deskriptif. Pada instalasi baru, owner melihat lima tabel kosong tanpa petunjuk urutan pengisian. | CT-10 |
| Token, bukan improvisasi | 19 ukuran font dan 17 nilai spasi ad-hoc. | VD-01 |
| Larangan `transition-all` | Dipakai di 3 tempat. | VD-05 |
| Hover-only functionality | Sidebar memakai `onMouseEnter` tanpa padanan `:focus`; tidak berlaku di perangkat sentuh. | UD-07, A11Y |
| Focus discipline | Aplikasi memakai `:focus`, bukan `:focus-visible`, dan tidak punya sistem fokus terpadu. | Phase 5 §4 |

**Tidak relevan — sengaja tidak diadopsi:**

| Prinsip hallmark | Alasan tidak diterapkan |
| :--- | :--- |
| "Break the grid", asimetri, macrostructure yang berbeda tiap halaman | Dirancang untuk membuat halaman pemasaran terasa unik. POS justru menuntut **keseragaman** antar layar agar kasir tidak perlu belajar ulang. Asimetri di sini akan menjadi beban kognitif. |
| Pasangan display/body dengan display face distinctive | Sebagian benar — Inter-everywhere memang menghilangkan hierarki. Tetapi yang dibutuhkan POS bukan display face ekspresif, melainkan **satu monospace/tabular untuk angka**. Nilai fungsional, bukan ekspresif. |
| "Let the hero be the height of its content", bias kiri/kanan | Tidak ada hero pada aplikasi operasional. |
| Twenty-one macrostructures, tema bergantian | Konsep untuk brief yang berbeda-beda. POS punya satu brief. |
| "Undo over confirm" secara penuh | Sebagian relevan. Untuk void transaksi, konfirmasi **tetap diperlukan** karena tindakan menyentuh catatan keuangan — tetapi harus disertai alasan dan jejak audit (§7.4), bukan sekadar Undo. |

### 6.3 Kesimpulan hallmark

Nilai terbesar `hallmark-main` untuk proyek ini bukan pada arah visualnya, melainkan pada **rubrik kelengkapan**: daftar delapan state, ambang hit target, dan daftar larangan interaksi memberi kriteria objektif untuk menyatakan sebuah komponen "selesai".

Itu tepat mengisi kekosongan yang ditemukan Phase 1 GAP-02 — README tidak mendefinisikan design system, dan sampai bab tersebut ditulis, rubrik hallmark dapat menjadi acuan sementara yang dapat diperiksa.

Yang **tidak** boleh dilakukan: mengadopsi bahasa visual hallmark (serif display, editorial spacing, asimetri) ke dalam POS. Itu akan menukar keterbacaan operasional dengan ekspresi yang tidak dibutuhkan.

---

## 7. ARCHITECTURE AUDIT

### Strengths

- **Batas client/server disiplin.** Hanya 6 komponen `"use client"`, seluruhnya memang butuh state; semua pengambilan data di Server Component.
- **Transaksi atomik pada dua alur mutasi.** Checkout dan pembelian keduanya memakai `$transaction`.
- **Snapshot HPP terpasang benar secara struktur** — hanya nilainya yang belum benar.
- **Tidak ada circular dependency.** Grafik impor berbentuk pohon.
- **Tidak ada komponen atau service raksasa.** Terbesar 414 baris.
- **Pemisahan pooler/direct URL** untuk runtime dan migrasi sudah benar.

### Weaknesses

- **Perhitungan bisnis tercampur I/O dan presentasi.** HPP di dalam Server Action ber-I/O; rumus laba bersih di dalam komponen halaman.
- **Empat modul `lib/` yang direncanakan belum ada**, sehingga aturan lintas-modul tidak punya tempat tinggal.
- **Tidak ada lapisan komponen bersama.**
- **Duplikasi:** format rupiah 7 tempat, batas periode 2 tempat, badge 2 tempat.

### Risks

Penilaian keempat kriteria Phase 6: **Understandable — Baik. Maintainable — Sedang. Testable — Kurang. Scalable — Memadai untuk lingkupnya.**

*Testable* adalah risiko terbesar: README §9.1 mensyaratkan 10 uji unit atas fungsi perhitungan murni, dan **fungsi-fungsi itu belum ada sebagai unit yang dapat dipanggil**. Kriteria kelulusan §9.4 tidak dapat dipenuhi tanpa memperbaiki ini lebih dulu.

### Recommended architecture direction

**Proporsional, bukan maksimal.** Tidak perlu repository layer, domain layer, atau DI container. Cukup memisahkan perhitungan murni dari I/O, persis seperti yang sudah ditetapkan §4.2:

```
Server Action  →  orkestrasi, I/O, batas transaksi, otorisasi
      ↓
lib/costing.ts →  fungsi murni: average cost, HPP produk
lib/money.ts   →  fungsi murni: pembulatan, format
lib/period.ts  →  fungsi murni: batas periode Asia/Jakarta
lib/guard.ts   →  requireAuth / requireAdmin
```

Empat berkas ini menyelesaikan tiga hal sekaligus: menghilangkan duplikasi, membuat uji unit §9.1 mungkin ditulis, dan memberi satu tempat menegakkan otorisasi.

---

## 8. SECURITY AUDIT

### Confirmed

| Kode | Temuan | Severity |
| :--- | :--- | :--- |
| SEC-01 | Kredensial basis data teks polos di proyek + riwayat Git | **Critical** |
| SEC-02 | `JWT_SECRET` fallback hardcode → sesi admin dapat ditempa | **Critical** |
| SEC-06 | Lapisan otorisasi Server Action tidak ada; 7 aksi tanpa cek sesi | High |
| SEC-09 | Kuantitas negatif menaikkan stok & mencatat penjualan negatif | High |
| SEC-10 | Tidak ada idempotensi; transaksi dapat terduplikasi | High |
| SEC-11 | Race condition stok memungkinkan oversell | High |
| SEC-03 | Tidak ada pembatasan percobaan login | Medium |
| SEC-07 | `deleteExpense` tanpa cek kepemilikan maupun peran | Medium |
| SEC-13 | Harga dan biaya negatif diterima | Medium |
| SEC-04 | Oracle waktu untuk enumerasi username | Low |
| SEC-08 | Matcher `/login` tidak berfungsi sebagaimana dimaksud | Low |
| SEC-12 | Enum di-*cast* tanpa validasi | Low |

**Yang aman dan patut dipertahankan:** harga tidak dapat dimanipulasi dari klien; total transaksi dihitung ulang di server; identitas kasir diambil dari sesi; transaksi historis tidak dapat dimodifikasi (tidak ada `updateSale`/`deleteSale`); produk nonaktif tidak dapat dijual; bcrypt cost 10; cookie httpOnly/secure/sameSite.

### Potential

| Kode | Temuan |
| :--- | :--- |
| POT-01 | Eksploitabilitas SEC-06 dari luar antarmuka — bergantung perilaku Action ID pada Next.js 16.2.11 |
| POT-02 | Galat Prisma mentah dapat bocor ke antarmuka kasir lewat `err.message` |
| POT-03 | Perlindungan CSRF bawaan Server Actions diasumsikan aktif |
| POT-04 | Keberadaan data nyata pada basis data Supabase |

### Not Verified

Header keamanan HTTP (`next.config.ts` kosong); konfigurasi RLS Supabase; apakah `.env` benar-benar tidak pernah ter-*commit*; perilaku sistem di bawah checkout bersamaan.

---

## 9. PERFORMANCE AUDIT

### Confirmed bottleneck / correctness issue

| Kode | Temuan |
| :--- | :--- |
| PF-08 | Cek stok dan decrement tanpa row lock → oversell |
| PF-10 | Nomor invoice `Date.now()` melawan unique index |
| PF-04/05 | Total dihitung dari `take` di memori → angka salah |
| PF-09 | Batas transaksi terlalu lebar, memperbesar kontensi |
| PF-01 | Kueri produk per item keranjang di dalam transaksi |
| PF-06 | Over-fetching relasi bersarang pada halaman riwayat |

### Potential — belum terbukti menjadi bottleneck

Tidak adanya indeks non-unik (8 kolom); re-render penuh `CashierPOS` pada setiap ketikan; `canAfford` O(produk × keranjang × resep); tidak ada virtualisasi; tidak ada `select` penyempit kolom.

**Penilaian jujur:** pada volume satu kafe, seq scan dan re-render ini tidak akan terasa. Indeks tetap dikerjakan lebih awal **karena murah saat migrasi yang bagaimanapun harus dijalankan**, bukan karena ada bukti kelambatan. Ini pembedaan yang harus dijaga agar peta jalan tidak berisi optimasi prematur.

### Areas requiring measurement

Waktu respons dashboard dan laporan terhadap data produksi (§8.2 menargetkan <3 detik untuk sebulan); `EXPLAIN ANALYZE` setelah volume tumbuh; ukuran bundle klien dan LCP layar kasir pada tablet nyata; perilaku di bawah checkout bersamaan (kasus I-05).

---

## 10. PRIORITY MATRIX

Instruksi Phase 10 melarang menjadikan seluruh temuan P0/P1. Dari 40 butir debt: 12 P0 (30%), 16 P1 (40%), 8 P2 (20%), 4 P3 (10%).

Pembenaran proporsi P0 yang relatif tinggi: tujuh di antaranya adalah keamanan atau korektness finansial yang tidak boleh menyentuh data nyata, dan tiga sisanya adalah prasyarat teknis yang memblokir 15 fitur lain.

### P0 — Critical · harus selesai sebelum aplikasi menyentuh data nyata

| Kode | Temuan | Kategori |
| :--- | :--- | :--- |
| CD-01 | Kredensial basis data terekspos | Security |
| CD-02 | `JWT_SECRET` fallback hardcode | Security |
| CD-03 | Rumus laba bersih melanggar §3.1.A | Business |
| CD-04 | Race condition stok → oversell | Business |
| CD-05 | Kuantitas negatif menaikkan stok | Business |
| CD-06 | Otorisasi Server Action tidak ada | Security |
| CD-07 | Nol batasan `CHECK` dari 17 | Data integrity |
| SD-01 | Skema belum dimigrasikan ke §5.15 | Architecture |
| SD-02 | Strategi transisi data belum ditetapkan | Architecture |
| SD-03 | Empat modul `lib/` belum ada | Architecture |
| UD-01 | Batas periode memakai zona waktu server | Business |
| UD-02 | Total daftar dihitung dari `take` | Business |

### P1 — High · sangat disarankan sebelum rilis mayor

CD-08 idempotensi · CD-09 error handling · SD-04 pisahkan perhitungan dari I/O · SD-05 komponen bersama · SD-06 infrastruktur pengujian · UD-03 kalkulator kembalian · UD-04 invoice server ke klien · UD-05 ubah produk · UD-06 penyusun resep BOM · UD-07 Escape & focus trap modal · UD-09 target sentuh · UD-11 kontrak tiga state · VD-02 kontras token · VD-03 tabular numerals · VD-04 responsivitas tablet · MD-01/MD-05 duplikasi & seed

### P2 — Medium · untuk maintainability dan kualitas

SD-07 rename ke `proxy.ts` · UD-08 paginasi, filter tanggal, pencarian · UD-10 persistensi keranjang · VD-01 skala tipografi & spasi · VD-05 inkonsistensi komponen · MD-02 tipe uang di batas serialisasi · MD-03 lint bersih · dan layar L-11 s.d. L-15

### P3 — Low · polishing

VD-06 sederhanakan halaman login · MD-04 hapus kode mati · MD-06 seragamkan pola form · MD-07 pindah ke `next/font`

---

## 11. CATATAN PENUTUP UNTUK PHASE 11

Tiga hal yang harus dibawa ke penyusunan roadmap:

1. **Urutkan berdasarkan dependency, bukan severity.** UD-03 (kembalian) berprioritas P1 tetapi mustahil dikerjakan sebelum SD-01 (migrasi skema) yang P0. Sebaliknya VD-03 (`tabular-nums`) hanya P1 tetapi dapat dikerjakan kapan saja tanpa prasyarat.

2. **SD-05 (komponen bersama) harus mendahului pembangunan 12 layar baru**, bukan menyusulinya. Bila tidak, debt visual dan UX akan berlipat 12 kali.

3. **SD-02 adalah gerbang.** Sebelum SD-01 dieksekusi, harus dipastikan lebih dulu apakah basis data berisi data nyata — jika ya, kolom `NOT NULL` baru memerlukan strategi backfill. Ini satu-satunya butir yang berstatus **Not Verified** dan sekaligus memblokir jalur kritis.

---

**Output Phase 10 selesai. Lanjut ke Phase 11.**
