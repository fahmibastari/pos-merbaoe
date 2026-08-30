# CHECKLIST PENGUJIAN — POS KOPI MERBAOE

**Versi:** 1.0  
**Tanggal:** 30 Agustus 2026  
**Acuan:** `README.md` §8–§10 dan `docs/execute-step/phase11.md` TASK-035  
**Tujuan:** menjadi satu runbook dari pemeriksaan lokal sampai keputusan siap deploy.

---

## 1. CARA MEMAKAI CHECKLIST

Gunakan urutan tahap pada dokumen ini. Jangan melewati sebuah *gate* bila ada hasil gagal
yang memengaruhi tahap berikutnya.

| Tanda | Arti |
| :---: | :--- |
| `✅` | Sudah dibuktikan dan lulus. |
| `🟡` | Sebagian dibuktikan atau masih perlu verifikasi tambahan. |
| `⬜` | Belum dijalankan pada siklus pengujian formal. |
| `❌` | Sudah dijalankan dan gagal; catat masalah sebelum melanjutkan. |
| `N/A` | Tidak berlaku, disertai alasan tertulis. |

Setiap siklus formal harus mencatat:

| Data pelaksanaan | Isi |
| :--- | :--- |
| Tanggal dan pelaksana | 30 Agustus 2026 |
| Versi/ref aplikasi yang diuji | Gatau |
| Basis data/lingkungan | Dev |
| Browser dan perangkat | Chrome |
| Waktu mulai–selesai | 8:40 PM |
| Lokasi bukti (screenshot/CSV/catatan) |  |
| Kesimpulan | Lulus / perlu perbaikan / ditunda |

> Pengujian otomatis memakai fixture sementara dan membersihkannya kembali. UAT manual
> mengubah data development. Gunakan awalan nama `TEST-<tanggal>-...`, jangan memakai
> data produksi, dan ambil cadangan sebelum pengujian destruktif atau migrasi.

---

## 2. STATUS BASELINE TERBARU

Pemeriksaan ini dijalankan ulang pada 30 Agustus 2026 sebelum dokumen dibuat.

| Pemeriksaan | Status | Bukti terbaru |
| :--- | :---: | :--- |
| ESLint seluruh repo | ✅ | Exit 0; 0 error dan 0 warning. |
| TypeScript | ✅ | `tsc --noEmit` exit 0. |
| Prisma schema | ✅ | Valid. |
| Status migrasi | ✅ | 10 migrasi; database schema up to date. |
| Seluruh test, termasuk database | ✅ | 72 lulus, 0 gagal, 0 skip; serial. |
| Production build | ✅ | Next.js 16.2.11; 23 route; exit 0. |
| UAT formal tiga hari | ⬜ | Belum dilaksanakan. |
| Uji pemulihan cadangan | ⬜ | Belum dilaksanakan. |
| CI setiap push | ⬜ | Belum tersedia; bagian TASK-035/D-10. |

Perintah referensi PowerShell:

```powershell
pnpm lint
pnpm exec tsc --noEmit
pnpm exec prisma validate
pnpm exec prisma migrate status

$env:RUN_DB_TESTS = "1"
node --import tsx --test --test-concurrency=1 "src/**/*.test.ts"
Remove-Item Env:RUN_DB_TESTS

pnpm build
```

Perintah `npm run lint`, `npx tsc --noEmit`, `npx prisma ...`, dan `npm run build`
tetap ekuivalen dengan dokumentasi instalasi saat ini. Pemakaian `pnpm` di atas hanya
menyesuaikan sesi development lokal; ini bukan keputusan migrasi package manager dan
tidak mengizinkan pembuatan/perubahan lockfile saat sekadar menguji.

**Gate A — baseline teknis:** lulus hanya jika seluruh perintah di atas exit 0, test
database tidak ada yang *skip*, dan build menampilkan seluruh route yang diharapkan.

Catatan pelaksanaan disimpan terpisah dari checklist reusable ini. Siklus terbaru:
[`docs/test-runs/2026-08-30-smoke-sesi-33.md`](test-runs/2026-08-30-smoke-sesi-33.md).

---

## 3. CAKUPAN KASUS README §9

### 3.1 Unit test U-01 sampai U-10

| Kode | Cakupan | Status |
| :--- | :--- | :---: |
| U-01–U-03 | Average cost mutasi masuk/keluar dan stok nol | ✅ |
| U-04–U-06 | HPP BOM, HPP manual, dan fallback | ✅ |
| U-07–U-08 | Total transaksi dan laba kotor dari DPP | ✅ |
| U-09 | Batas tanggal/periode Asia/Jakarta | ✅ |
| U-10 | Pembulatan Rupiah *half up* | ✅ |

Seluruh sepuluh kontrak unit mempunyai bukti otomatis. Test tambahan juga mencakup
validasi Zod, pagination, CSV, DTO Decimal, keamanan login, keyboard kasir, kategori,
audit, idempotensi, dan persistensi keranjang.

### 3.2 Integration test I-01 sampai I-10

Status berikut membedakan test yang benar-benar menguji kontrak README dari test teknis
lain yang kebetulan menyentuh alur serupa.

| Kode | Kontrak README | Status otomatis | Yang masih diperlukan |
| :--- | :--- | :---: | :--- |
| I-01 | Pembelian memperbarui stok, nilai, average cost, dan ledger | 🟡 | Pernah lulus pada verifikasi transaksional Sesi 5 dan alurnya muncul di fixture I-08, tetapi belum dipertahankan sebagai regression test khusus melalui service/action pembelian. |
| I-02 | Checkout BOM mengurangi stok dan menyimpan HPP snapshot | 🟡 | Checkout nyata diuji, tetapi assertion khusus seluruh snapshot dan mutasi perlu dipisahkan. |
| I-03 | Σ nilai `sale/out` sama dengan HPP snapshot item BOM | ⬜ | Pernah lulus pada verifikasi transaksional Sesi 6, tetapi belum menjadi regression test khusus; wajib dipertahankan untuk TASK-035 dan skripsi. |
| I-04 | Stok tidak cukup me-*rollback* seluruh transaksi | ⬜ | Buat test atomisitas yang memastikan tidak ada sale/mutasi tersisa. |
| I-05 | Dua checkout berbeda berebut stok yang hanya cukup satu | ⬜ | Pernah lulus pada harness transaksional Sesi 5, tetapi test yang tersimpan sekarang hanya menguji retry dengan idempotency key sama, bukan kompetisi stok dua transaksi berbeda. |
| I-06 | Harga beli naik; HPP baru naik, snapshot lama tetap | 🟡 | Pernah lulus pada verifikasi transaksional Sesi 6 dan snapshot historis muncul pada test laporan/void, tetapi skenario dua penjualan README belum menjadi regression test tersendiri. |
| I-07 | Void mengembalikan stok historis dan keluar dari laba | ✅ | Test integrasi khusus lulus. |
| I-08 | Rekonsiliasi seluruh ledger persediaan | ✅ | Test integrasi khusus lulus. |
| I-09 | Kasir ditolak oleh Server Action admin | 🟡 | Guard dan route pernah diaudit/smoke, tetapi belum ada test integrasi otorisasi action khusus. |
| I-10 | Tutup shift menghitung expected cash | ✅ | Test integrasi khusus lulus. |

Tambahan di luar daftar asli: I-11 kategori dan audit kategori sudah lulus otomatis.

**Gate B — TASK-035:** belum lulus. Angka 72/72 membuktikan suite yang tersedia hijau,
tetapi belum menggantikan tujuh kontrak integrasi yang masih `🟡`/`⬜`, serta belum ada CI.

---

## 4. SMOKE TEST MANUAL — SATU PUTARAN CEPAT

Jalankan setelah Gate A lulus. Gunakan akun Admin dan Kasir terpisah.

### 4.1 Login, sesi, dan peran

- [ ] Login Admin berhasil dan diarahkan ke dashboard.
- [ ] Login Kasir berhasil dan diarahkan ke POS/shift yang sesuai.
- [ ] Kasir yang membuka URL `/admin/*` ditolak atau dialihkan.
- [ ] Kredensial salah menampilkan pesan generik tanpa membocorkan keberadaan username.
- [ ] Lima kegagalan login memicu penguncian sesuai jadwal; jangan lakukan pada akun utama.
- [ ] Reset password membuat sesi lama akun tersebut tidak berlaku.
- [ ] Akun nonaktif tidak dapat login.
- [ ] Admin aktif terakhir, akun sendiri, dan kasir dengan shift terbuka tidak dapat dinonaktifkan.

### 4.2 Master data dan katalog

- [ ] Buat kategori uji, ubah nama/urutan, nonaktifkan, lalu aktifkan kembali.
- [ ] Kategori yang masih dipakai menu aktif tidak dapat dinonaktifkan.
- [ ] Buat bahan baku dengan satuan, stok minimum, dan saldo awal yang benar.
- [ ] Buat menu tanpa resep; pastikan kategori wajib dan HPP manual dipakai.
- [ ] Buat menu ber-BOM; tambahkan beberapa bahan dan cek pratinjau HPP.
- [ ] Unggah, ganti, dan hapus satu foto menu; fallback tetap rapi saat foto kosong.
- [ ] Filter kategori dan pencarian bekerja bersamaan pada Admin dan POS.
- [ ] Nonaktifkan menu/bahan uji dan pastikan histori lama tidak rusak.

### 4.3 Pembelian, stok, dan HPP

- [ ] Catat pembelian bahan dan cocokkan jumlah, harga satuan, serta total invoice.
- [ ] Cek kartu stok: mutasi `purchase/in`, saldo, nilai, dan average cost berubah benar.
- [ ] Catat pembelian kedua dengan harga berbeda dan hitung average cost manual.
- [ ] Lakukan opname tambah dan kurang; kartu stok serta nilai persediaan cocok.
- [ ] Catat waste; stok turun dan beban otomatis yang terkunci terbentuk.
- [ ] Coba waste melebihi stok; operasi ditolak dan tidak meninggalkan mutasi parsial.
- [ ] Pastikan indikator stok menipis muncul pada batas minimum yang ditetapkan.

### 4.4 Shift dan POS

- [ ] Buka shift dengan kas awal yang diketahui.
- [ ] Tambahkan menu lewat klik/tap, pencarian + Enter, dan navigasi panah.
- [ ] Uji `/` untuk fokus pencarian dan F2 untuk menuju pembayaran.
- [ ] Uji tambah/kurang jumlah, stok bersama antar-menu, dan menu tidak tersedia.
- [ ] Refresh halaman: keranjang shift yang sama pulih tanpa menyimpan diskon/pajak/pembayaran.
- [ ] Ubah/nonaktifkan menu atau stok dari Admin, lalu refresh POS; keranjang direkonsiliasi.
- [ ] Uji keranjang kosong dan tombol “Kosongkan Keranjang”.
- [ ] Checkout Tunai: uang kurang ditolak, uang pas benar, dan kembalian benar.
- [ ] Checkout QRIS dan Transfer tidak meminta atau menyimpan uang tunai.
- [ ] Uji diskon dan PB1; cocokkan Subtotal → Diskon → DPP → Pajak → Total.
- [ ] Klik/tekan bayar satu kali; loading mencegah kirim ganda.
- [ ] Setelah checkout sukses, keranjang tersimpan hilang dan invoice server tampil.
- [ ] Cetak struk 58 mm dan 80 mm; cek identitas toko, item, pajak, total, bayar, kembalian.

### 4.5 Riwayat, void, pengeluaran, dan tutup shift

- [ ] Riwayat Kasir hanya menampilkan transaksi milik kasir yang login.
- [ ] Admin dapat mencari invoice dan membuka detail transaksi.
- [ ] Void satu transaksi dengan alasan; transaksi ditandai batal dan tidak bisa di-void lagi.
- [ ] Stok dari transaksi void kembali memakai nilai historis, bukan average cost terbaru.
- [ ] Catat pengeluaran dari laci dan dari luar laci; dampak kas/laba sesuai sumber.
- [ ] Hapus pengeluaran uji; konfirmasi menyebut item dan dampaknya ke laporan.
- [ ] Tutup shift; expected cash = kas awal + penjualan tunai − pengeluaran laci.
- [ ] Masukkan kas aktual dan catat alasan bila ada selisih.

### 4.6 Dashboard, laporan, audit, dan ekspor

- [ ] Filter dashboard pada satu tanggal dan satu bulan; kartu serta tabel memakai periode sama.
- [ ] Pendapatan, HPP, laba kotor, beban, dan laba bersih cocok dengan hitungan manual.
- [ ] Laporan persediaan seimbang; perbedaan rekonsiliasi bernilai nol.
- [ ] Audit menampilkan perubahan kategori, menu, resep, pengguna, shift, dan void.
- [ ] Audit tidak menampilkan password, hash, service key, atau connection string.
- [ ] CSV laba dan persediaan mengikuti filter aktif serta aman dibuka di spreadsheet.
- [ ] Tampilan cetak laporan tidak memuat sidebar/kontrol yang tidak relevan.

**Gate C — smoke fungsional:** lulus bila seluruh item yang relevan dicentang, tidak ada
error console/runtime, dan setiap kegagalan mempunyai tiket/perbaikan yang jelas.

---

## 5. QA TAMPILAN, RESPONSIVITAS, DAN AKSESIBILITAS

Ulangi layar utama pada lebar 1440, 1280, 768, 375, dan 320 piksel.

- [ ] Login: logo benar-benar center; form rapi dan tidak terpotong.
- [ ] Dashboard: hierarki bukan terasa seperti wireframe; tidak ada area kosong/garis yang mengganggu.
- [ ] Menu, Bahan, Pembelian, Pengeluaran, Pengguna, dan Laporan tidak memiliki body overflow horizontal.
- [ ] Tabel lebar hanya menggulir di pembungkus tabel.
- [ ] POS memakai logo vertikal; katalog dan keranjang tetap dapat digunakan di tablet/ponsel.
- [ ] Target sentuh utama minimal 44 × 44 px.
- [ ] Tab dan Shift+Tab mengikuti urutan logis; fokus selalu terlihat.
- [ ] Modal mengunci fokus, Escape menutup, dan fokus kembali ke pemicu.
- [ ] Seluruh input memiliki label; error terhubung ke field dan diumumkan.
- [ ] Loading, empty, error, disabled, dan success state diperiksa minimal pada satu alur.
- [ ] Zoom browser 200% tidak menghilangkan fungsi utama.
- [ ] Uji printer thermal yang benar bila perangkat tersedia.
- [ ] Uji pembaca layar dasar (NVDA/VoiceOver) sebelum klaim aksesibilitas formal.

Catatan batas scope:

- PWA/offline belum diimplementasikan; tidak ada manifest atau service worker. Jangan
  mencatatnya sebagai bug regresi kecuali diputuskan menjadi kebutuhan baru.
- Belum ada klaim kepatuhan WCAG karena uji pembaca layar formal belum dilakukan.

**Gate D — pengalaman penggunaan:** diterima pemilik untuk perangkat operasional nyata,
terutama tablet/desktop kasir dan printer yang akan digunakan.

---

## 6. PENGUJIAN PENERIMAAN PENGGUNA (UAT)

README §9.3 mensyaratkan data operasional nyata minimal tiga hari. Satu sesi klik cepat
tidak menggantikan UAT ini.

### Hari 0 — persiapan

- [ ] Catat saldo awal bahan, kas awal, harga beli, resep, harga jual, dan tarif PB1.
- [ ] Siapkan lembar catatan manual pembanding.
- [ ] Pastikan setiap kasir memakai akun sendiri.
- [ ] Tentukan siapa yang menandatangani penerimaan dan mencatat insiden.

### Hari 1–3 — operasi

- [ ] **A-01:** proses minimal 20 transaksi dalam satu shift; tidak ada invoice ganda.
- [ ] Campurkan Tunai, QRIS, Transfer, diskon, PB1, dan beberapa menu ber-BOM.
- [ ] Catat pembelian bahan, satu waste/opname yang wajar, dan pengeluaran operasional.
- [ ] Tutup shift setiap hari dan cocokkan kas fisik.
- [ ] Catat waktu checkout yang terasa lambat, kesalahan kasir, dan bagian UI membingungkan.

### Akhir UAT

- [ ] **A-02:** pendapatan, HPP, dan laba kotor sistem sama dengan catatan manual.
- [ ] **A-03:** selisih stok fisik dapat dijelaskan melalui kartu stok.
- [ ] **A-04:** kas fisik sama dengan expected cash atau selisih terdokumentasi.
- [ ] **A-05:** isi SUS; skor minimal 68.
- [ ] Pemilik menandatangani: diterima / diterima dengan catatan / ditolak.

**Gate E — UAT:** seluruh A-01 sampai A-05 diterima. Catatan minor boleh masuk backlog,
tetapi perbedaan finansial, stok negatif, transaksi hilang/ganda, atau kas tidak dapat
direkonsiliasi adalah kegagalan rilis.

---

## 7. KESIAPAN PRODUKSI DAN DEPLOYMENT

Jalankan hanya setelah Gate A–E lulus.

- [ ] TASK-035 selesai: I-01–I-10 otomatis, termasuk I-03/I-05/I-08, dan CI tersedia.
- [ ] Password bawaan seluruh akun sudah diganti.
- [ ] `JWT_SECRET` produksi minimal 32 byte dan berbeda dari development.
- [ ] Seluruh environment variable Vercel/Supabase terisi tanpa tercatat di source/log.
- [ ] Keputusan risiko riwayat Git yang pernah memuat secret dicatat; kredensial aktif sudah dirotasi.
- [ ] Header keamanan, CSRF Server Action, dan batas otorisasi diverifikasi pada environment deploy.
- [ ] Target performa §8.2 diukur dengan data representatif.
- [ ] Cadangan manual dibuat sebelum migrasi produksi.
- [ ] Cadangan pernah dipulihkan ke database uji dan keutuhan data diverifikasi.
- [ ] Favicon/aset ikon persegi resmi tersedia atau penundaannya diterima.
- [ ] `prisma migrate deploy` berhasil; `prisma migrate dev/reset` tidak dipakai di produksi.
- [ ] Seed hanya dijalankan pada instalasi pertama dan password bawaan langsung diganti.
- [ ] Smoke pascadeploy: login, dashboard, satu transaksi uji, struk, laporan, Storage foto.
- [ ] Rollback kode dan database mempunyai pemilik serta langkah yang sudah dipahami.

**Gate F — siap deploy:** seluruh butir wajib selesai atau mempunyai penerimaan risiko
tertulis. Deploy bukan bukti aplikasi lulus; smoke pascadeploy tetap wajib.

---

## 8. FORMAT CATATAN TEMUAN

Gunakan satu baris per masalah agar dapat ditelusuri tanpa bergantung pada ingatan.

| ID | Tanggal | Tahap/kasus | Langkah reproduksi | Hasil aktual | Hasil harapan | Severity | Bukti | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TEST-001 |  |  |  |  |  | Blocker/High/Medium/Low |  | Open/Fixed/Retest/Closed |

Severity `Blocker`/`High` mencakup kehilangan atau duplikasi transaksi, angka finansial
salah, stok negatif, kebocoran rahasia aktif, bypass otorisasi, dan aplikasi tidak dapat
menyelesaikan alur kasir. Temuan tersebut menghentikan UAT/deployment sampai diperbaiki
dan diuji ulang.
