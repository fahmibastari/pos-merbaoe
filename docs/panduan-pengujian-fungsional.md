# Panduan Pengujian Fungsional Merbaoe POS

Dokumen ini menjadi panduan pelaksanaan pengujian fungsional Merbaoe POS dari sisi
pengguna. Ikuti urutannya dari atas ke bawah agar data dari satu tahap dapat dipakai pada
tahap berikutnya.

**Alamat aplikasi:** https://merbaoe.vercel.app/login

**Perkiraan waktu:** 2–3 jam untuk satu putaran lengkap

**Lembar checklist:** `form_pengujian_fungsional_merbaoe_pos.xlsx` (dicetak)

**Metode:** black-box — jalankan fungsi melalui antarmuka aplikasi, lalu bandingkan hasil
yang terlihat dengan bagian **Hasil yang diharapkan**.

> Paket pengujian terdiri dari dua dokumen cetak. PDF panduan ini memuat penjelasan fitur,
> langkah uji, dan hasil yang diharapkan. Lembar checklist dari Excel memuat nomor
> pengujian, bagian, nama pengujian, penanda opsional, status, serta catatan/temuan yang
> diisi dengan pena. Nomor **T-01 sampai T-61** menjadi penghubung kedua dokumen.

---

## 1. Sebelum mulai

### Alur penggunaan panduan dan checklist

1. Isi **Catatan data awal** pada bagian 2 panduan ini sebelum memulai pengujian.
2. Pilih satu baris pada lembar checklist, lalu cocokkan kolom **No.** dengan judul
   skenario di panduan. Contoh: baris **T-01** cocok dengan **T-01 — Login dengan data
   yang salah**.
3. Baca penjelasan alur fitur bila tersedia, ikuti seluruh langkah pada skenario tersebut,
   lalu bandingkan hasil di aplikasi dengan bagian **Hasil yang diharapkan**.
4. Pada lembar checklist, tulis status dan catatan/temuan dengan pena pada baris bernomor
   sama.
5. Lanjutkan sesuai urutan nomor agar data yang dibuat pada satu tahap dapat dipakai pada
   tahap berikutnya.
6. Setelah semua skenario selesai, hitung hasil pada lembar checklist dan isi
   **Ringkasan hasil akhir** pada bagian 21 panduan ini.

### Akun pengujian

| Peran | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `12345678` |
| Kasir | `kasir` | `12345678` |

Kredensial tersebut khusus untuk pengujian. Sebelum mulai, siapkan satu foto JPG, PNG,
atau WebP berukuran kurang dari 3 MB serta kalkulator atau aplikasi catatan untuk mencatat
angka sebelum dan sesudah testing.

Gunakan nama yang diawali `UJI QA` untuk semua data buatan tester, misalnya:

- kategori: `UJI QA Minuman`;
- bahan: `UJI QA Susu`;
- menu: `UJI QA Latte`;
- pengeluaran: `UJI QA Tisu`;
- akun kasir: `uji.kasir`.

### Aturan aman

1. Jangan mengubah atau menonaktifkan akun, menu, kategori, dan bahan asli.
2. Jangan mencoba password salah pada akun utama. Gunakan akun khusus testing.
3. Jangan menekan tombol pembayaran berkali-kali.
4. Semua transaksi testing harus dibatalkan atau **Void** setelah selesai diperiksa.
5. Data seperti pembelian, opname, waste, dan audit memang disimpan sebagai riwayat dan
   tidak selalu bisa dihapus. Karena itu selalu gunakan awalan `UJI QA`.
6. Jangan menguji transaksi saat internet mati. Aplikasi dapat dipasang seperti aplikasi,
   tetapi transaksi tetap membutuhkan internet.

### Cara mengisi lembar checklist cetak

Isi kolom **Status** menggunakan salah satu tulisan berikut:

- `Lulus` — hasil sesuai harapan;
- `Gagal` — hasil berbeda, muncul error, atau fitur tidak dapat diselesaikan;
- `Tidak diuji` — pengujian belum dilakukan atau syaratnya belum tersedia.

Kolom **Opsional?** hanya menjelaskan apakah skenario boleh dilewati. Jika skenario
opsional tidak dijalankan, tetap isi Status `Tidak diuji` dan tulis alasannya pada
**Catatan / Temuan**.

Tulislah dengan jelas dan singkat agar muat pada kolom yang tersedia. Jika hasilnya
`Gagal`, catat langkah terakhir, masalah yang terlihat, dan kode bukti bila ada. Contoh:

```text
Gagal di langkah 3 — tombol Masuk tidak merespons — bukti BUG-T01-01.
```

Jika ruang pada kolom tidak cukup, tulis kode temuan pada checklist lalu lanjutkan
penjelasan di balik lembar atau kertas tambahan menggunakan kode yang sama. Foto atau
video bukti dapat memakai nama seperti `BUG-T01-01` agar mudah dipasangkan dengan catatan.

---

## 2. Catatan data awal

Isi tabel berikut dengan pena sebelum menjalankan T-01. Nilai ini dipakai sebagai
pembanding pada pengujian stok, transaksi, laporan, dan penutupan Shift. Jika ada nilai
yang belum diketahui, beri tanda `—` lalu lengkapi sebelum masuk ke skenario yang
membutuhkannya.

| Informasi | Isian |
| --- | --- |
| Nama penguji | |
| Tanggal pengujian | |
| Perangkat dan browser | |
| Username Admin | `admin` |
| Username Kasir uji | `kasir` |
| Nama bahan uji | |
| Stok awal bahan uji | |
| Harga rata-rata awal bahan uji | |
| Nama menu uji | |
| Harga menu uji | |
| Kas awal Shift | |

---

## 3. Login, logout, dan pembagian akses

Login digunakan untuk memastikan setiap orang hanya dapat membuka fitur sesuai perannya.
Alur singkatnya: masukkan akun → sistem mengenali peran Admin/Kasir → pengguna diarahkan
ke area kerjanya → tombol Keluar mengakhiri sesi.

### T-01 — Login dengan data yang salah

1. Buka halaman login.
2. Isi username yang salah dan password yang salah.
3. Tekan **Masuk**.

**Hasil yang diharapkan:** tetap berada di halaman login dan muncul pesan bahwa login
tidak berhasil. Pesan tidak memberitahukan apakah username atau password yang salah.

### T-02 — Login sebagai Admin

1. Isi username dan password Admin yang benar.
2. Tekan **Masuk**.

**Hasil yang diharapkan:** halaman **Dashboard** terbuka. Sidebar menampilkan Dashboard,
Bahan Baku, Menu, Pembelian Stok, Pengeluaran, Riwayat Penjualan, Shift Kasir,
Pengguna, Laporan, Jejak Audit, dan Buka POS.

### T-03 — Logout

1. Tekan **Keluar**.
2. Setelah kembali ke login, tekan tombol Back pada browser.

**Hasil yang diharapkan:** sesi benar-benar berakhir. Halaman Admin tidak boleh terbuka
kembali tanpa login.

### T-04 — Batas akses Kasir

1. Login menggunakan akun Kasir uji.
2. Pastikan menu kasir berisi **POS**, **Riwayat**, **Stok**, dan **Shift**.
3. Ketik `https://merbaoe.vercel.app/admin/dashboard` pada address bar.

**Hasil yang diharapkan:** Kasir tidak dapat melihat Dashboard Admin. Kasir dialihkan atau
mendapat penolakan akses yang jelas.

### T-05 — Penguncian login setelah banyak kegagalan — opsional

> Lakukan hanya pada akun khusus testing. Jangan lakukan pada akun Admin utama.

1. Masukkan password salah lima kali untuk akun Kasir uji.
2. Coba login lagi menggunakan password yang benar.

**Hasil yang diharapkan:** akun/IP ditahan sementara dan muncul pesan generik. Setelah
masa tunggu sekitar 15 menit berakhir, login dapat dicoba kembali.

---

## 4. Dashboard Admin

Dashboard digunakan untuk melihat kondisi usaha pada periode tertentu tanpa mengubah
data. Angka ringkasan, daftar transaksi, dan peringatan stok harus memakai rentang tanggal
yang sama.

### T-06 — Ringkasan Dashboard

1. Login sebagai Admin dan buka **Dashboard**.
2. Catat angka Penjualan Bersih, Laba Bersih, Transaksi, Laba Kotor, Beban Operasional,
   dan Belanja Bahan.
3. Periksa bagian **Transaksi pada Periode** dan **Stok Menipis**.

**Hasil yang diharapkan:** halaman terbuka tanpa pesan error; angka menggunakan format
Rupiah; daftar transaksi dan stok menipis sesuai periode yang tampil.

### T-07 — Filter tanggal Dashboard

1. Isi **Dari Tanggal** dan **Sampai Tanggal** dengan tanggal yang sama.
2. Tekan **Terapkan Periode**.
3. Tekan **Bulan Ini**.
4. Pastikan kedua kotak tanggal ikut kembali ke periode bulan berjalan.
5. Tekan **Back/Kembali** pada browser. Periksa tanggal, angka, dan tabel kembali ke
   periode pilihan sebelumnya. Tekan **Forward/Maju** dan periksa kembali bulan berjalan.
6. Ubah tanggal tanpa menekan Terapkan, lalu tekan **Bulan Ini**. Isian yang belum
   diterapkan harus dibuang.

**Hasil yang diharapkan:** angka dan tabel berubah mengikuti tanggal yang dipilih. Tombol
**Bulan Ini** mengembalikan periode ke bulan berjalan. Tanggal awal tidak boleh lebih
besar daripada tanggal akhir. Tanggal pada kotak filter harus sama dengan periode data
yang sedang ditampilkan, termasuk setelah memakai tombol Kembali/Maju pada browser.

---

## 5. Bahan baku dan kartu stok

Bahan Baku adalah daftar barang yang dipakai atau disimpan, misalnya kopi, susu, dan
kemasan. Alurnya: bahan dibuat → stok bertambah lewat Pembelian atau Opname → stok
berkurang lewat penjualan/Waste → seluruh perubahan dapat ditelusuri pada Kartu Stok.

### T-08 — Mencari dan menambah bahan

1. Buka **Bahan Baku**.
2. Coba kolom pencarian dengan nama bahan yang sudah ada.
3. Tekan **+ Tambah Bahan**.
4. Isi:
   - Nama Bahan: `UJI QA Susu`;
   - Satuan: `ml`;
   - Stok Minimum: `100`.
5. Tekan **Simpan**.

**Hasil yang diharapkan:** bahan baru muncul dengan status **Aktif**. Stok awalnya nol,
status stok **Menipis**, dan pencarian dapat menemukan bahan tersebut.

### T-09 — Validasi bahan

1. Coba menambah bahan tanpa Nama Bahan.
2. Coba menambah `UJI QA Susu` sekali lagi.
3. Coba mengisi Stok Minimum dengan angka negatif.

**Hasil yang diharapkan:** data tidak disimpan dan pesan kesalahan muncul dekat bagian
yang bermasalah. Tidak boleh terbentuk bahan ganda.

### T-10 — Mengubah dan mengaktifkan bahan

1. Pada `UJI QA Susu`, tekan **Edit**.
2. Ubah Stok Minimum menjadi `120`, lalu tekan **Simpan**.
3. Tekan **Nonaktifkan**, lalu tekan **Aktifkan** kembali.

**Hasil yang diharapkan:** perubahan tersimpan; status berganti Nonaktif/Aktif; riwayat
lama tidak hilang.

### T-11 — Kartu stok

1. Tekan **Kartu Stok** pada bahan uji.
2. Periksa saldo, nilai persediaan, dan daftar mutasi.
3. Ubah **Dari Tanggal** dan **Sampai Tanggal**, lalu tekan tombol penerapan filter.

**Hasil yang diharapkan:** mutasi tampil berurutan dan saldo setelah tiap mutasi masuk
akal. Filter hanya menampilkan transaksi dalam rentang yang dipilih.

---

## 6. Pembelian stok

Pembelian Stok digunakan ketika bahan datang dari supplier. Setelah pembelian disimpan,
jumlah stok bertambah dan Harga Rata-rata diperbarui berdasarkan harga pembelian lama dan
baru.

### T-12 — Pembelian satu bahan

1. Catat stok dan harga rata-rata `UJI QA Susu` sebelum pembelian.
2. Buka **Pembelian Stok**.
3. Isi Nama Supplier `UJI QA Supplier`, tanggal hari ini, bahan `UJI QA Susu`,
   Jumlah `1000`, dan Harga/Satuan `20`.
4. Periksa Total Pembelian, lalu tekan **Simpan Pembelian**.

**Hasil yang diharapkan:** total menjadi Rp20.000; pesan sukses muncul; stok bahan naik
1.000 ml; riwayat pembelian dan Kartu Stok menampilkan pembelian tersebut.

### T-13 — Pembelian beberapa bahan sekaligus

1. Tekan **Tambah Item**.
2. Isi dua bahan yang berbeda beserta jumlah dan harga satuannya.
3. Periksa jumlah total, lalu simpan.
4. Gunakan pencarian berdasarkan supplier atau bahan.

**Hasil yang diharapkan:** semua item masuk dalam satu pembelian; total sama dengan jumlah
seluruh item; stok masing-masing bahan berubah; pencarian menemukan pembelian.

### T-14 — Validasi pembelian

1. Coba menyimpan pembelian tanpa memilih bahan.
2. Coba jumlah nol/negatif atau harga negatif.
3. Coba memilih bahan yang sama dua kali dalam satu pembelian.

**Hasil yang diharapkan:** pembelian ditolak dengan pesan jelas dan stok tidak berubah.

---

## 7. Opname, waste, dan stok menipis

**Opname** menyamakan stok sistem dengan hasil hitung fisik. **Waste** mencatat bahan yang
rusak, tumpah, atau kedaluwarsa; stok berkurang dan nilainya otomatis menjadi pengeluaran.
Status Menipis membantu menentukan bahan yang perlu segera dibeli.

### T-15 — Opname stok

1. Buka **Bahan Baku** → **Opname & Waste**.
2. Pilih **Opname / Penyesuaian** dan bahan uji.
3. Isi Stok Fisik dengan angka sedikit berbeda dari Saldo Sistem.
4. Isi Keterangan `UJI QA hasil hitung fisik`, lalu tekan **Simpan Opname**.

**Hasil yang diharapkan:** stok menjadi sama dengan angka fisik yang dimasukkan. Kartu
Stok mencatat penyesuaian beserta keterangannya.

### T-16 — Waste yang valid

1. Pilih **Waste / Kerusakan**.
2. Pilih bahan uji, isi Jumlah Waste `10`, dan Keterangan `UJI QA bahan rusak`.
3. Tekan **Catat Waste**.
4. Buka **Pengeluaran**.

**Hasil yang diharapkan:** stok turun 10; Kartu Stok mencatat Waste; Pengeluaran memiliki
beban otomatis kategori lain-lain yang terkait Waste dan tidak dapat dihapus manual.

### T-17 — Waste melebihi stok

1. Catat stok bahan uji saat ini.
2. Coba Waste dengan jumlah lebih besar daripada stok.

**Hasil yang diharapkan:** Waste ditolak, muncul pesan jelas, stok tidak menjadi negatif,
dan tidak ada beban otomatis baru.

### T-18 — Peringatan stok menipis

1. Atur Stok Minimum bahan uji lebih tinggi daripada stok saat ini.
2. Buka **Bahan Baku**, **Dashboard**, lalu login sebagai Kasir dan buka **Stok**.

**Hasil yang diharapkan:** bahan diberi status **Menipis** di ketiga tempat. Halaman Stok
Kasir hanya menampilkan informasi dan tidak menyediakan tombol untuk mengubah stok.

---

## 8. Kategori dan menu

Kategori mengelompokkan menu agar mudah dicari di POS. Menu adalah barang yang dijual.
Menu tanpa resep memakai HPP Manual, sedangkan menu dengan resep menghitung HPP dari
bahan dan takaran yang dipakai. Foto menu bersifat opsional.

### T-19 — Menambah dan mengurutkan kategori

1. Buka **Menu** → **Kelola Kategori**.
2. Isi Kategori Baru `UJI QA Minuman` dan Urutan `5`, lalu tekan **Tambah**.
3. Ubah namanya menjadi `UJI QA Spesial` dan Urutan menjadi `6`, lalu tekan **Simpan**.

**Hasil yang diharapkan:** kategori tersimpan, urutan berubah, dan kategori muncul pada
filter Menu serta POS sesuai urutannya.

### T-20 — Pengaman kategori yang masih dipakai

1. Setelah menu uji pada T-21 dibuat, buka **Kelola Kategori**.
2. Coba **Nonaktifkan** kategori `UJI QA Spesial`.

**Hasil yang diharapkan:** kategori tidak dapat dinonaktifkan selama masih mempunyai menu
aktif. Pesan menjelaskan penyebabnya.

### T-21 — Menambah menu tanpa resep

1. Buka **Menu** → **+ Tambah Menu**.
2. Isi Nama Menu `UJI QA Latte`, pilih kategori `UJI QA Spesial`, Harga Jual `25000`,
   dan HPP Manual `10000`.
3. Biarkan Foto Menu kosong dan simpan.

**Hasil yang diharapkan:** menu muncul dengan kategori yang benar, harga Rp25.000,
HPP Manual Rp10.000, margin Rp15.000, status Aktif, dan gambar pengganti yang rapi.

### T-22 — Validasi menu

1. Coba menambah menu tanpa kategori.
2. Coba harga jual nol/negatif.
3. Coba membuat nama menu yang sama dengan `UJI QA Latte`.

**Hasil yang diharapkan:** menu tidak tersimpan dan pesan kesalahan mudah dipahami.

### T-23 — Foto menu

1. Tekan **Edit** pada `UJI QA Latte`.
2. Pada **Ganti Foto**, pilih foto JPG/PNG/WebP di bawah 3 MB lalu simpan.
3. Pastikan foto muncul di tabel Admin dan kartu POS.
4. Edit lagi, pilih opsi menghapus foto, lalu simpan.
5. Jika memungkinkan, coba file bukan gambar atau gambar di atas 3 MB.

**Hasil yang diharapkan:** foto dapat diunggah, diganti, dan dihapus. Setelah dihapus,
gambar pengganti tampil rapi. File tidak sah ditolak tanpa mengubah foto lama.

### T-24 — Menyusun resep menu

1. Pada `UJI QA Latte`, tekan **Atur Resep**.
2. Tekan tombol untuk menambah bahan.
3. Pilih `UJI QA Susu`, isi takaran, lalu tambah satu bahan lain.
4. Perhatikan pratinjau HPP sebelum menekan **Simpan Resep**.
5. Simpan, buka kembali halaman Menu, lalu periksa HPP dan margin.

**Hasil yang diharapkan:** resep tersimpan, bahan yang sama tidak dapat dipilih dua kali,
dan HPP menu mengikuti biaya bahan saat ini. Label resep menunjukkan jumlah bahan.

### T-25 — Pencarian, filter, dan status menu

1. Cari `UJI QA Latte` pada halaman Menu.
2. Pilih filter kategori `UJI QA Spesial`.
3. Tekan **Nonaktifkan** pada menu uji dan buka POS.
4. Aktifkan kembali menu tersebut.

**Hasil yang diharapkan:** pencarian dan filter dapat dipakai bersama. Menu nonaktif tidak
dapat dijual di POS, tetapi riwayat lama tetap ada. Setelah aktif kembali, menu muncul lagi.

---

## 9. Pengguna dan password

Fitur Pengguna dipakai Admin untuk membuat akun Kasir, mengganti password, serta
menonaktifkan akun tanpa menghapus riwayat pekerjaan orang tersebut.

### T-26 — Menambah akun Kasir

1. Buka **Pengguna** → **+ Tambah Kasir**.
2. Isi Nama Pengguna `UJI QA Kasir`, Username unik seperti `uji.kasir01`, Password Awal
   minimal delapan karakter, dan Konfirmasi Password yang sama.
3. Tekan **Buat Akun**.

**Hasil yang diharapkan:** akun baru muncul sebagai Kasir berstatus Aktif dan dapat login.
Username ganda atau konfirmasi password berbeda harus ditolak.

### T-27 — Reset password dan pencabutan sesi lama

1. Login sebagai Kasir uji pada browser lain atau mode Incognito.
2. Dari akun Admin, tekan **Reset Password** untuk Kasir tersebut.
3. Isi password baru dan konfirmasi yang sama.
4. Kembali ke browser Kasir dan pindah halaman.
5. Login menggunakan password baru.

**Hasil yang diharapkan:** sesi lama Kasir tidak berlaku lagi; password lama gagal;
password baru berhasil.

### T-28 — Menonaktifkan akun

1. Pastikan shift Kasir uji sudah ditutup.
2. Tekan **Nonaktifkan** pada akun tersebut dan konfirmasi.
3. Coba login sebagai Kasir uji.
4. Aktifkan kembali akun dari Admin.

**Hasil yang diharapkan:** akun nonaktif tidak dapat login. Akun yang sedang dipakai,
Admin aktif terakhir, dan Kasir yang masih memiliki shift terbuka tidak boleh
dinonaktifkan.

---

## 10. Shift dan POS Kasir

Gunakan browser Admin dan browser Kasir secara terpisah agar kedua sesi tidak saling
menggantikan.

Alur operasional Kasir: buka Shift dan catat kas awal → pilih menu di POS → terima
pembayaran → cetak struk → cocokkan uang fisik → tutup Shift. Setiap Kasir hanya boleh
memiliki satu Shift yang sedang terbuka.

### T-29 — Membuka shift

1. Login sebagai Kasir uji dan buka **Shift**.
2. Jika belum ada shift aktif, isi Kas Awal `100000`.
3. Tekan **Buka Shift & Masuk POS**.
4. Coba membuka shift kedua untuk akun yang sama.

**Hasil yang diharapkan:** satu shift terbuka dan POS dapat dipakai. Akun yang sama tidak
dapat mempunyai dua shift terbuka.

### T-30 — Mencari, memfilter, dan menambah menu

1. Pada POS, tekan kategori **Semua**, lalu kategori tertentu.
2. Isi **Cari menu** dengan sebagian nama menu.
3. Tekan satu kartu menu untuk memasukkannya ke keranjang.
4. Tekan tombol **+** dan **−** pada item keranjang.

**Hasil yang diharapkan:** kategori dan pencarian bekerja bersama; kartu menampilkan foto,
nama, dan harga; jumlah serta subtotal keranjang berubah dengan benar; jumlah tidak bisa
turun di bawah nol.

### T-31 — Tombol keyboard — opsional untuk perangkat ber-keyboard

1. Tekan `/` untuk menuju kolom pencarian.
2. Ketik nama menu dan tekan Enter untuk menambahkan hasil.
3. Gunakan tombol panah kiri/kanan untuk berpindah antar-kartu.
4. Tekan F2 untuk menuju bagian pembayaran.

**Hasil yang diharapkan:** fokus berpindah sesuai petunjuk dan tidak ada tindakan yang
terjadi dua kali.

### T-32 — Keranjang tetap ada setelah refresh

1. Masukkan dua menu ke keranjang.
2. Refresh halaman browser.
3. Periksa isi keranjang.
4. Tekan **Kosongkan Keranjang** dan konfirmasi.

**Hasil yang diharapkan:** item serta jumlah kembali setelah refresh pada akun dan shift
yang sama. Diskon, pajak, dan data pembayaran tidak dipulihkan. Setelah dikosongkan,
keranjang benar-benar kosong.

### T-33 — Pembayaran tunai dan kembalian

1. Masukkan satu menu ke keranjang dan pilih **Tunai**.
2. Isi Uang Diterima lebih kecil daripada Total.
3. Coba tekan tombol bayar.
4. Gunakan **Uang Pas**, atau isi nominal lebih besar daripada Total.
5. Periksa Kembalian, lalu tekan **Bayar** satu kali.

**Hasil yang diharapkan:** uang kurang ditolak; Uang Pas menghasilkan kembalian Rp0;
nominal lebih besar menghasilkan kembalian yang benar; setelah berhasil, keranjang kosong
dan nomor transaksi/invoice tampil.

### T-34 — QRIS dan Transfer

1. Buat transaksi kecil dengan metode **QRIS**.
2. Buat transaksi kecil lain dengan metode **Transfer**.

**Hasil yang diharapkan:** kedua transaksi dapat disimpan tanpa meminta Uang Diterima dan
tidak dihitung sebagai uang tunai pada laci shift.

### T-35 — Diskon dan PB1

1. Tambahkan menu dengan Subtotal yang mudah dihitung.
2. Isi Diskon, lalu pilih **PB1 10%**.
3. Hitung manual: DPP = Subtotal − Diskon; Pajak = 10% × DPP;
   Total = DPP + Pajak.
4. Selesaikan transaksi.
5. Coba Diskon yang lebih besar daripada Subtotal pada transaksi baru.

**Hasil yang diharapkan:** angka layar sama dengan hitungan manual. Diskon melebihi
Subtotal ditolak.

### T-36 — Stok tidak cukup

1. Gunakan menu uji yang memiliki resep.
2. Dari Admin, lakukan Opname bahan uji menjadi sangat sedikit atau nol.
3. Kembali ke POS dan refresh.
4. Coba menambahkan menu tersebut.

**Hasil yang diharapkan:** menu diberi tanda tidak tersedia/Habis dan transaksi tidak
dapat membuat stok negatif.

### T-37 — Pencegahan pembayaran ganda

1. Siapkan satu transaksi Tunai dengan uang cukup.
2. Tekan **Bayar** dua kali dengan cepat.

**Hasil yang diharapkan:** tombol berubah menjadi sedang memproses dan hanya satu invoice
terbentuk.

---

## 11. Struk, riwayat Kasir, dan stok Kasir

Setelah pembayaran berhasil, struk menjadi bukti transaksi. Riwayat Kasir hanya
menampilkan transaksi milik akun yang sedang dipakai, sedangkan halaman Stok membantu
Kasir mengecek ketersediaan bahan tanpa memberi akses untuk mengubahnya.

### T-38 — Struk transaksi

1. Setelah transaksi berhasil, tekan **Lihat & Cetak Struk**.
2. Pilih **58 mm**, lalu **80 mm**.
3. Tekan **Cetak Struk**; batalkan dialog printer bila tidak ingin mencetak.

**Hasil yang diharapkan:** struk menampilkan logo/nama toko, alamat, invoice, waktu WIB,
nama Kasir, metode bayar, item, jumlah, harga, subtotal, diskon, DPP, pajak, total, uang
diterima, dan kembalian. Ukuran 58/80 mm berubah tanpa menghilangkan isi.

### T-39 — Riwayat transaksi Kasir

1. Buka **Riwayat** dari akun Kasir uji.
2. Cari menggunakan nomor invoice atau nama menu.
3. Buka struk dari hasil pencarian.
4. Bandingkan dengan transaksi milik Kasir lain.

**Hasil yang diharapkan:** Kasir hanya melihat transaksi miliknya sendiri. Pencarian dan
link struk bekerja.

### T-40 — Stok hanya-baca untuk Kasir

1. Buka **Stok** dari akun Kasir.
2. Cari nama bahan dan periksa status Aman/Menipis/Habis.

**Hasil yang diharapkan:** Kasir dapat melihat stok aktif tetapi tidak melihat harga
perolehan dan tidak memiliki tombol Edit, Opname, Waste, atau Pembelian.

---

## 12. Pengeluaran dan penutupan shift

Pengeluaran digunakan untuk biaya selain pembelian bahan, misalnya listrik atau tisu.
Semua pengeluaran mengurangi laba; hanya pengeluaran yang benar-benar diambil dari laci
Kasir yang juga mengurangi Kas Seharusnya pada Shift tersebut.

### T-41 — Pengeluaran di luar laci

1. Login Admin dan buka **Pengeluaran**.
2. Isi Deskripsi `UJI QA Internet`, Kategori Utilitas, Jumlah `10000`, tanggal hari ini,
   dan Sumber Dana **Di luar laci kas**.
3. Tekan **Simpan Pengeluaran**.

**Hasil yang diharapkan:** pengeluaran muncul di riwayat dan mengurangi laba bersih, tetapi
tidak mengurangi Kas Seharusnya pada shift Kasir.

### T-42 — Pengeluaran dari laci

1. Catat Kas Seharusnya pada shift Kasir uji.
2. Buat pengeluaran `UJI QA Tisu` senilai `5000`.
3. Pada Sumber Dana, pilih laci shift Kasir uji yang sedang terbuka.
4. Periksa kembali ringkasan shift.

**Hasil yang diharapkan:** pengeluaran masuk laporan dan Kas Seharusnya turun Rp5.000.

### T-43 — Menghapus pengeluaran manual

1. Cari pengeluaran `UJI QA Tisu`.
2. Tekan **Hapus** dan baca konfirmasinya sebelum menyetujui.
3. Coba lakukan hal yang sama pada pengeluaran otomatis dari Waste.

**Hasil yang diharapkan:** pengeluaran manual dapat dihapus dan dampaknya pada laporan/
laci dibalik. Pengeluaran otomatis Waste tidak dapat dihapus manual.

### T-44 — Menutup shift

1. Buka **Shift** pada akun Kasir.
2. Cocokkan rumus: Kas Awal + Penjualan Tunai − Pengeluaran dari Laci.
3. Isi Kas Fisik Aktual sama dengan Kas Seharusnya dan tekan **Tutup Shift**.
4. Pada putaran lain, coba angka berbeda tanpa Keterangan selisih.

**Hasil yang diharapkan:** angka yang sama menampilkan Kas fisik cocok dan shift dapat
ditutup. Bila ada selisih, Keterangan selisih wajib diisi.

### T-45 — Daftar shift Admin

1. Buka **Shift Kasir** sebagai Admin.
2. Cari nama Kasir uji.
3. Gunakan filter tanggal dan Status Terbuka/Ditutup.

**Hasil yang diharapkan:** shift tampil dengan kas awal, kas seharusnya, kas aktual,
selisih, status, serta catatan yang sesuai.

---

## 13. Riwayat Penjualan dan pembatalan transaksi

Admin dapat melihat seluruh transaksi. Transaksi yang salah tidak dihapus, tetapi
dibatalkan melalui **Void** agar alasannya tetap tercatat, stok dikembalikan, dan nilainya
tidak lagi masuk laporan.

### T-46 — Pencarian transaksi Admin

1. Buka **Riwayat Penjualan**.
2. Cari menggunakan invoice transaksi uji.
3. Uji filter tanggal dan Kasir.
4. Buka **Struk**.

**Hasil yang diharapkan:** hasil sesuai filter; total ringkasan hanya menghitung transaksi
yang cocok; struk yang dibuka sesuai invoice.

### T-47 — Void transaksi

1. Catat stok bahan yang digunakan transaksi uji.
2. Tekan **Void** pada transaksi uji.
3. Isi Alasan pembatalan `UJI QA — bukan transaksi pelanggan`.
4. Konfirmasi pembatalan.
5. Periksa stok, Dashboard, laporan, dan coba Void transaksi yang sama lagi.

**Hasil yang diharapkan:** status menjadi **Dibatalkan**; alasan terlihat; stok yang pernah
dipakai kembali; transaksi tidak lagi masuk pendapatan/laba; transaksi yang sama tidak
bisa dibatalkan dua kali.

---

## 14. Laporan dan ekspor

Laporan Laba merangkum penjualan, HPP, beban, dan laba dalam periode pilihan. Laporan
Persediaan menjelaskan jumlah serta nilai stok pada tanggal tertentu. Keduanya dapat
diunduh sebagai CSV atau dicetak/disimpan sebagai PDF melalui browser.

### T-48 — Laporan Laba

1. Buka **Laporan** → **Laba**.
2. Pilih periode yang berisi transaksi uji selesai.
3. Catat Penjualan Bersih, HPP, Laba Kotor, Beban Operasional, dan Laba Bersih.
4. Bandingkan dengan perhitungan sederhana:
   - Laba Kotor = Penjualan Bersih − HPP;
   - Laba Bersih = Laba Kotor − Beban Operasional.

**Hasil yang diharapkan:** jumlah transaksi dan semua angka cocok dengan catatan manual;
transaksi Void tidak dihitung.

### T-49 — Laporan Persediaan

1. Buka tab **Persediaan**.
2. Pilih Awal Rekonsiliasi dan Tanggal Snapshot.
3. Cari bahan uji dan periksa kuantitas, harga rata-rata, serta nilai persediaan.

**Hasil yang diharapkan:** saldo buku dan nilai persediaan dapat dijelaskan dari saldo
awal + stok masuk − stok keluar. Perbedaan rekonsiliasi seharusnya Rp0.

### T-50 — CSV dan cetak laporan

1. Pasang filter tanggal pada Laporan Laba.
2. Tekan **Unduh CSV** dan buka hasilnya di spreadsheet.
3. Ulangi pada Laporan Persediaan.
4. Tekan **Cetak / Simpan PDF**; batalkan bila tidak ingin menyimpan.

**Hasil yang diharapkan:** file dapat dibuka, kolom dan angka mengikuti filter, teks tidak
berantakan, dan tampilan cetak tidak memuat sidebar/tombol yang tidak diperlukan.

---

## 15. Jejak Audit

Jejak Audit digunakan untuk mengetahui siapa yang mengubah data penting, kapan perubahan
terjadi, serta nilai sebelum dan sesudahnya. Bagian ini tidak boleh menampilkan password
atau kunci rahasia.

### T-51 — Mencari perubahan

1. Buka **Jejak Audit**.
2. Filter berdasarkan Pengguna, tanggal, Entitas, dan Aksi.
3. Cari perubahan kategori/menu/resep/pengguna serta Void yang dilakukan selama testing.
4. Tekan **Lihat perubahan**.

**Hasil yang diharapkan:** waktu WIB, pelaku, aksi, entitas, ID, nilai sebelum, dan nilai
sesudah terlihat. Alasan Void tampil.

### T-52 — Data rahasia tidak tampil

1. Buka detail audit pembuatan akun atau reset password.
2. Periksa seluruh nilai yang ditampilkan.

**Hasil yang diharapkan:** password, hash password, kunci Supabase, JWT secret, dan alamat
koneksi database tidak pernah terlihat.

---

## 16. Tampilan desktop, tablet, dan ponsel

Ulangi bagian ini minimal pada:

- laptop/desktop;
- tablet posisi landscape dan portrait;
- ponsel posisi portrait.

### T-53 — Halaman Login

1. Buka login pada setiap perangkat.
2. Periksa logo, judul, form, dan tombol Masuk.

**Hasil yang diharapkan:** logo terlihat utuh dan center; form tidak terpotong; teks dapat
dibaca; tidak ada geser horizontal.

### T-54 — Dashboard dan halaman Admin

1. Buka Dashboard, Bahan Baku, Menu, Pembelian, Pengeluaran, Pengguna, dan Laporan.
2. Coba menggulir tabel yang lebar.

**Hasil yang diharapkan:** halaman tidak melebar keluar layar. Jika tabel terlalu lebar,
hanya bagian tabel yang dapat digeser ke samping; menu navigasi tetap bisa dipakai.

### T-55 — POS dengan banyak menu

1. Pada POS, pilih kategori **Semua**.
2. Gulir katalog yang berisi banyak menu.
3. Bandingkan ukuran foto pada baris atas dan bawah.
4. Tambahkan item dan gunakan keranjang.

**Hasil yang diharapkan:** ukuran/rasio foto tidak mengecil ketika menu bertambah; katalog
dapat digulir; tombol dan keranjang tetap mudah disentuh pada tablet/ponsel.

### T-56 — Keyboard dan zoom

1. Tekan Tab berulang kali dan coba Shift+Tab.
2. Buka modal Edit/Kategori/Void, lalu tekan Escape.
3. Atur zoom browser ke 200% dan coba fungsi utama.

**Hasil yang diharapkan:** tanda fokus selalu terlihat, urutannya masuk akal, Escape
menutup modal, dan zoom tidak menghilangkan tombol penting.

---

## 17. Instalasi PWA dan kondisi jaringan

PWA memungkinkan Merbaoe POS dipasang dari browser dan dibuka seperti aplikasi. Instalasi
ini tidak membuat transaksi dapat berjalan tanpa internet; seluruh penyimpanan data tetap
membutuhkan koneksi.

### T-57 — Memasang aplikasi

1. Buka Merbaoe POS melalui Chrome/Edge atau browser ponsel yang mendukung instalasi.
2. Pilih menu **Install app**, **Tambahkan ke layar utama**, atau nama serupa.
3. Buka aplikasi dari ikon yang terpasang.

**Hasil yang diharapkan:** nama dan ikon **Merbaoe POS** benar; aplikasi terbuka dalam
tampilan mandiri dan mengarah ke halaman login/POS sesuai sesi.

### T-58 — Internet terputus

1. Jangan siapkan transaksi penting.
2. Putuskan internet lalu coba membuka halaman atau membayar.
3. Sambungkan internet kembali dan refresh.

**Hasil yang diharapkan:** aplikasi tidak mengaku transaksi berhasil saat offline. Setelah
internet kembali, aplikasi dapat digunakan lagi. Ini memang aplikasi online-only.

---

## 18. Keadaan kosong, pesan error, dan pagination

Bagian ini memastikan aplikasi tetap memberi arahan yang jelas ketika pencarian kosong,
data terbagi ke beberapa halaman, atau alamat yang dibuka tidak tersedia.

### T-59 — Pencarian tanpa hasil

1. Pada Menu, Bahan Baku, Pembelian, Pengeluaran, Riwayat Penjualan, Riwayat Kasir,
   Stok Kasir, Shift, dan Audit, cari teks acak seperti `TIDAKADA-999999`.

**Hasil yang diharapkan:** muncul pesan kosong yang jelas, bukan tabel rusak atau halaman
putih. Tersedia cara untuk menghapus filter/kembali.

### T-60 — Pagination

1. Pada daftar yang memiliki banyak data, tekan **Berikutnya** dan **Sebelumnya**.
2. Gunakan pencarian/filter lalu pindah halaman.

**Hasil yang diharapkan:** data tidak lompat atau berulang secara aneh; nomor halaman
benar; filter tetap berlaku; tombol Sebelumnya tidak aktif pada halaman pertama.

### T-61 — Halaman tidak ditemukan

1. Saat login, buka alamat yang tidak ada, misalnya
   `https://merbaoe.vercel.app/admin/tidak-ada`.

**Hasil yang diharapkan:** muncul halaman tidak ditemukan yang rapi dan menyediakan jalan
kembali, bukan pesan kode/error mentah.

---

## 19. Pembersihan setelah testing

Lakukan setelah seluruh skenario yang dipilih selesai.

- [ ] Semua transaksi uji sudah di-**Void** dengan alasan `UJI QA`.
- [ ] Semua shift uji sudah ditutup.
- [ ] Pengeluaran manual uji sudah dihapus bila memang aman dihapus.
- [ ] Akun tambahan `uji.kasir` dari T-26 sudah dinonaktifkan bila tidak akan dipakai lagi.
- [ ] Menu dan bahan uji sudah dinonaktifkan.
- [ ] Kategori uji dinonaktifkan setelah tidak memiliki menu aktif.
- [ ] Catatan pembelian, opname, waste, kartu stok, dan audit dibiarkan sebagai jejak uji.
- [ ] Screenshot dan daftar bug sudah dipasangkan dengan nomor temuan pada checklist.

---

## 20. Uji pemakaian nyata selama tiga hari — opsional

Bagian ini dilakukan setelah 61 pengujian di atas selesai dan masalah penting sudah
diperbaiki. Gunakan catatan manual sebagai pembanding.

### Hari persiapan

- [ ] Catat stok awal, kas awal, harga jual, harga beli, resep, dan tarif PB1.
- [ ] Pastikan setiap Kasir memakai akunnya sendiri.
- [ ] Siapkan lembar catatan transaksi dan kas di luar aplikasi.

### Hari pertama sampai ketiga

- [ ] Jalankan minimal 20 transaksi per shift dengan campuran Tunai, QRIS, dan Transfer.
- [ ] Gunakan beberapa menu, diskon, PB1, pembelian bahan, Waste/Opname, dan pengeluaran.
- [ ] Tutup setiap shift dan cocokkan uang fisik dengan Kas Seharusnya.
- [ ] Catat bagian yang lambat, membingungkan, atau mudah membuat salah tekan.

### Pemeriksaan akhir

- [ ] Tidak ada invoice ganda atau transaksi hilang.
- [ ] Pendapatan, HPP, dan laba sama dengan catatan manual.
- [ ] Selisih stok dapat dijelaskan melalui Kartu Stok.
- [ ] Selisih kas nol atau memiliki keterangan yang masuk akal.
- [ ] Kasir merasa alur utama cukup mudah dipakai tanpa terus dibantu.

---

## 21. Ringkasan hasil akhir

Setelah semua skenario selesai, hitung setiap status pada lembar checklist cetak lalu isi
ringkasan berikut dengan pena.

| Hasil | Jumlah |
| --- | ---: |
| Lulus | |
| Gagal | |
| Tidak diuji | |
| **Total** | |

Pastikan nilai **Total** sama dengan jumlah seluruh baris checklist. Periksa kembali setiap
baris berstatus `Gagal` dan pastikan **Catatan / Temuan** cukup jelas agar masalah dapat
diulang. Skenario wajib yang berstatus `Tidak diuji` harus diberi alasan.

### Keputusan akhir

Beri tanda centang pada satu pilihan:

- [ ] **Diterima** — seluruh fitur utama dapat digunakan.
- [ ] **Diterima dengan catatan** — ada masalah kecil, tetapi transaksi dan angka tetap
      aman.
- [ ] **Ditolak sementara** — ada transaksi hilang/ganda, stok negatif, angka laporan
      salah, akses bocor, atau alur utama tidak dapat diselesaikan.

**Catatan akhir:**

........................................................................................

........................................................................................

| Pengesahan | Isian |
| --- | --- |
| Nama penguji | |
| Tanggal selesai | |
| Tanda tangan penguji | |
| Nama pemeriksa/pemilik | |
| Tanda tangan pemeriksa/pemilik | |
