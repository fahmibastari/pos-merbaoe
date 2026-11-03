# Smoke Pascadeploy — 1 September 2026

**Target:** `https://merbaoe.vercel.app`

**Sesi:** admin produksi yang dibuka oleh pemilik
**Cakupan:** smoke publik, alur transaksi minimum, laporan, Storage, void, dan audit

## Hasil

| Pemeriksaan | Hasil |
| :--- | :--- |
| Login publik | Lulus; HTTP 200 dan tidak ada galat console |
| Proteksi rute | Lulus; `/admin/dashboard` dan `/cashier` tanpa sesi merespons 307 ke `/login` |
| PWA | Manifest dan ikon 32/180/192/512 dapat dimuat; `/sw.js` 404 sesuai desain online-only |
| Header rilis | CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, dan referrer policy aktif |
| Dashboard admin | Lulus; sesi dan data representatif termuat tanpa galat runtime |
| POS responsif | Lulus pada 1180×820, 768×1024, dan 375×812; 15 kartu, foto tidak menyusut, tanpa overflow horizontal |
| Checkout | Lulus; Americano tunai Rp18.000 menghasilkan `TRX-20260901-00224` |
| Struk dan riwayat | Lulus; invoice, item, total, metode, kasir, dan waktu WIB konsisten |
| Laporan laba | Lulus; penjualan Rp18.000, HPP Rp3.684, laba kotor/bersih Rp14.316 |
| Supabase Storage | Lulus; 15 foto menu aktif selesai dimuat dari bucket publik `menu-images` |
| Void dan audit | Lulus; transaksi uji menjadi `voided`, laporan kembali nol, alasan tersimpan di audit |
| Runtime console | Tidak ada galat pada layar yang diperiksa |

## Pembersihan

Transaksi uji dibatalkan dengan alasan `Smoke test pascadeploy — bukan transaksi
pelanggan`. Rekam historis dan audit dipertahankan sesuai desain; transaksi dibatalkan
tidak masuk agregat laporan selesai.

## Batas pemeriksaan

- Tidak menjalankan UAT operasional tiga hari.
- Tidak menjalankan pemulihan cadangan ke database uji.
- Tidak menguji dialog cetak native atau perangkat printer fisik.
- Tidak memeriksa nilai secret Vercel; hanya perilaku runtime yang dapat diamati.
