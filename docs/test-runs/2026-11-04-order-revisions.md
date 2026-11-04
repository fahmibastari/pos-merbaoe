# TASK-043–045 — catatan item, diskon dan Void dengan PIN

Tanggal: 4 November 2026 · Sesi 43 · branch kerja `dev`.

## Status pemeriksaan

| Pemeriksaan | Hasil |
| :--- | :--- |
| Lint seluruh repo | Lulus; 0 error/0 warning |
| TypeScript | Lulus |
| Prisma schema | Valid |
| Migrasi dan seed PostgreSQL QA | 11 migrasi lulus; seed berhasil |
| Unit dan integrasi | 90 lulus, 0 gagal, 0 skip |
| Build produksi | Lulus; Next.js 16.2.11; 27 route |
| Browser lengkap | 25 lulus, 0 gagal, 2 skip terencana |
| Panduan cetak | 61 nomor skenario berurutan dan unik; tetap cocok dengan Excel |

Dua skip adalah pengulangan tes katalog padat pada proyek tablet/mobile. Skenario itu
tetap dijalankan pada proyek desktop dengan viewport tablet landscape. Full QA terakhir
berakhir dengan exit 0 dan cluster PostgreSQL sementara berhasil dihentikan/dihapus.
Tampilan catatan/PIN di tablet dan mobile serta struk 58 mm dalam mode cetak juga
diperiksa dari screenshot hasil browser. Catatan 150 karakter tidak keluar dari struk.

TASK-043, TASK-044, dan TASK-045 selesai. Supabase sudah sinkron dan data lama terjaga.

## Perilaku yang ditambahkan

- Setiap baris keranjang mempunyai catatan opsional maksimal 150 karakter. Satu menu
  dapat dipesan dengan catatan berbeda pada baris berbeda. Tombol **Pisahkan 1 item**
  memisahkan satu porsi dari baris yang jumlahnya lebih dari satu.
- Catatan dipangkas, divalidasi, dipulihkan bersama keranjang, masuk fingerprint retry,
  disimpan pada detail transaksi, serta tampil sebagai teks pada struk dan kedua riwayat.
- Keranjang versi 2 menyimpan identitas baris dan catatan; payload versi 1 tetap dapat
  dimuat. Harga, diskon, pajak, dan PIN tidak ikut dipersistenkan.
- Diskon dapat berupa nominal Rupiah atau persentase 0–100. Server menghitung ulang
  nominal akhir dengan Decimal dan pembulatan half up, kemudian menghitung DPP/pajak.
  Tipe, nilai asli, nominal akhir, dan Admin approver menjadi snapshot transaksi.
- Semua nilai diskon masukan di atas nol perlu PIN, termasuk bila pembulatan menghasilkan
  potongan Rp0. Perubahan item/catatan/diskon/pajak/metode mengosongkan PIN pada POS.
- Admin mengatur/reset PIN 6 digit lewat **Pengguna → Atur PIN**. PIN berbeda dari
  password login, disimpan dengan bcrypt cost 10, dan tidak mempunyai nilai bawaan.
- PIN salah dibatasi pada database: lima kegagalan mengunci actor+scope selama 15 menit.
  Scope diskon dan Void terpisah; pesan gagal tidak mengungkap Admin pemilik PIN.
- Admin dapat meminta Void transaksi mana pun; Kasir hanya miliknya. Alasan dan PIN
  Admin wajib. Reversal memakai mutasi historis, dengan penguncian agar dua permintaan
  bersamaan tidak mengembalikan stok dua kali.
- Audit menyimpan peminta dan Admin pemberi persetujuan. PIN/hash tidak dikirim ke klien,
  dicetak, dipersistenkan, atau disalin ke audit. PIN dikosongkan setelah upaya pengiriman.

## Migrasi dan pelestarian data

Migrasi baru: `20261104000000_order_notes_discount_approval`.

Migrasi menambah `sales_details.notes`, snapshot diskon, `users.approval_pin_hash`, dan
`approval_attempts`. Diskon historis memakai tipe `amount`, nilai masukan dari nominal
lama, serta approver null. Nominal/laba/HPP transaksi lama tidak dihitung ulang dan
identitas persetujuan lama tidak direkayasa.

Cadangan `pg_dump` format custom untuk schema `public` sudah dibuat sebelum migrasi:
`C:/Users/Fahmi Bastari/.codex/backups/merbaoe/before-order-revisions-2026-11-04T04-06-46-276Z.dump`.
Arsip berukuran 120.366 byte dan daftar isinya dapat dibaca memakai `pg_restore --list`.
Ini pemeriksaan arsip, bukan uji restore; uji restore operasional tetap ditunda.

Preflight Supabase: 10 migrasi, 25 CHECK, 5 pengguna, dan 237 transaksi. Setelah gate QA
hijau, migrasi tambahan diterapkan memakai `prisma migrate deploy`.

- 11/11 migrasi terpasang; checksum seluruh migrasi cocok (LF/CRLF diperhitungkan).
- Diff Supabase terhadap `prisma/schema.prisma`: tidak ada perbedaan, exit 0.
- 28 CHECK, 32 indeks migrasi, dan sequence invoice tersedia.
- Fingerprint **14 tabel lama identik**, termasuk **5 pengguna/password, 237 sale,
  1.341 mutasi stok**. Kolom baru sengaja dikecualikan dari fingerprint data lama.
- Seluruh snapshot diskon historis sesuai backfill: amount/nilai nominal lama,
  approver null. Tidak ada PIN produksi yang dibuat otomatis.
- Tidak ada reset, seed, penggantian password, perubahan harga, atau penghitungan ulang
  transaksi/stok Supabase. `.env` tidak diubah.

## Cakupan pengujian

- Unit: batas diskon 0/100, pembulatan, nominal melebihi subtotal, persentase invalid,
  fingerprint lama tanpa catatan, urutan baris, catatan terlalu panjang, dan recovery.
- Integrasi: menu sama/catatan berbeda, HPP/stok tetap benar, checkout konkuren dengan
  satu kunci, nominal pecahan, PIN salah/belum diatur/nonaktif, pembatasan dan expiry,
  reset PIN, otorisasi Kasir, Void konkuren, serta audit tanpa PIN/hash.
- Browser: pengaturan PIN melalui UI, dua baris/catatan, refresh, catatan 150 karakter,
  diskon persen, PIN salah/benar, struk 80/58 mm, mode cetak, tampilan tablet/mobile,
  riwayat dan Void oleh Kasir.
- Seluruh baseline filter TASK-046 dan pengujian responsif lama tetap dijalankan.

Semua pengujian database aplikasi memakai PostgreSQL 16 portable sementara melalui
`npm run qa:local`. Seed hanya dijalankan pada database QA; Supabase tidak di-reset/seed.

## Temuan selama pengerjaan

- Cleanup test Void lama diperbarui agar turut menghapus audit pengaturan PIN fixture.
- Test browser menambahkan ulang nama menu sebelum Enter kedua karena shortcut POS
  memang mengosongkan pencarian setelah satu menu berhasil ditambahkan.
- ESLint kini mengecualikan `playwright-report`, `test-results`, dan `.playwright`;
  aset laporan/trace hasil QA tidak lagi dianggap source aplikasi pada run berikutnya.
- Kontrak fingerprint nominal tanpa catatan tetap kompatibel dengan transaksi lama.

## Dokumentasi dan tindak lanjut

Panduan cetak tetap memakai nomor T-01–T-61 agar cocok dengan checklist Excel. T-30,
T-32, T-35, T-38, dan T-47 diperluas untuk revisi ini, serta persiapan PIN ditambahkan.
Pada Sesi 43, Git, merge, dan deployment belum dilakukan Codex. Pada Sesi 44, pemilik
meminta commit dan push ke `dev`; merge ke `main` dan rilis tetap dilakukan pemilik.
Setelah pemilik menerbitkan revisi, login Admin lalu atur PIN melalui
**Pengguna → Atur PIN** sebelum menjalankan diskon atau Void pertama.
