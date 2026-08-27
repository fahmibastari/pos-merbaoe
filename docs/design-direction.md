# ARAH VISUAL & DESIGN SYSTEM — KOPI MERBAOE POS

**Sumber kebenaran visual:** brand sheet resmi + `public/Logo-{Vertikal,Horizontal,IconOnly,TextOnly}.png`
**Warna resmi:** kertas `#F1EFEC` · tinta bata `#8A2416`
**Status:** fondasi visual §4, §6, §7, dan penghapusan efek §10 sudah
diimplementasikan oleh TASK-029/TASK-028; penyempurnaan copy dan persistensi
keranjang tetap berada pada TASK-039
**Mengisi:** GAP-02 Phase 1 (README tidak mendefinisikan token visual)

---

## 1. APA YANG DIKATAKAN LOGO

Warna berikut adalah **nilai resmi dari brand sheet**, dan sudah diverifikasi langsung dari berkas logo.

| Peran | Hex | Verifikasi |
| :--- | :--- | :--- |
| Kertas | **`#F1EFEC`** | Nilai resmi brand sheet |
| Tinta bata | **`#8A2416`** | Terbaca pada **100% piksel opak** di keempat berkas PNG |

Keduanya **hangat** (R > G > B) — kertas maupun tinta berada pada keluarga hue yang sama, dan itu yang membuat logo terasa menyatu.

Enam sifat yang membentuk seluruh arah di bawah:

1. **Dua warna, titik.** Tidak ada warna ketiga. Tidak ada gradasi.
2. **Kertas hangat, bukan putih.** `#F1EFEC` condong hangat searah tinta — kertas, bukan layar.
3. **Garis rambut.** Rumah, atap, pagar, dan sinar seluruhnya digambar dengan goresan tipis satu bobot.
4. **Tepat satu bidang terisi.** Hanya tanah yang solid. Satu massa di seluruh komposisi.
5. **Serif klasik, huruf besar, spasi lebar.** Suara merek ada di tipografinya.
6. **Nol efek.** Tidak ada bayangan, kilau, blur, atau tekstur.

Subjeknya rumah panggung dengan atap limas dan matahari bersinar — arsitektur vernakular, digambar tangan, tenang.

---

## 2. MENGAPA TEMA GELAP SEKARANG TIDAK BISA MEMBAWA MEREK INI

Bukan soal selera. Warna merek tidak terbaca di atas permukaan gelap yang ada:

| `#8A2416` di atas | Rasio | Ambang AA |
| :--- | ---: | :--- |
| `#0F0F0F` bg-base | **2,14** | 4,5 ❌ |
| `#1A1A1A` bg-surface | **1,94** | 4,5 ❌ |
| `#2A2A2A` bg-card | **1,60** | 4,5 ❌ |

Agar lolos, bata harus dicerahkan sampai `#D96A52` (5,60:1) — terakota muda. Karakter merek ini justru terletak pada kedalamannya; mencerahkannya sampai terbaca berarti kehilangan yang mau dipertahankan.

Tema kertas terang bukan sekadar lebih mirip logo — ia satu-satunya yang memungkinkan warna merek dipakai pada kekuatan aslinya.

---

## 3. PRINSIP

Lima aturan yang diturunkan dari logo. Setiap keputusan visual harus dapat dirujuk ke salah satunya.

### P1 · Satu massa per layar

Logo punya tepat satu bidang terisi. Aplikasi mengikuti: **isian bata solid hanya untuk satu aksi utama per layar.** Semua kontrol lain adalah teks tinta atau garis outline.

Ini sekaligus menyelesaikan konflik terbesar palet ini — lihat §5.3.

### P2 · Kertas, bukan layar

Latar adalah kertas hangat. Metaforanya nota dan buku kas, bukan dasbor. Ini juga sejalan dengan keluaran nyata sistem: struk termal dan laporan cetak.

### P3 · Garis, bukan bayangan

Pemisahan dilakukan dengan garis 1px dan pergeseran nada kertas. **Tidak ada `box-shadow` di mana pun.** Logo tidak punya satu pun bayangan.

Pengecualian tunggal: scrim gelap semi-transparan di belakang modal — dan itu pun bukan bayangan pada dialognya.

### P4 · Serif untuk suara, sans untuk kerja

Serif klasik membawa identitas: wordmark, judul halaman. Data tetap pada sans netral dengan angka tabular. Tabel padat berisi rupiah tidak boleh diserifkan.

### P5 · Tenang

Logo tidak bergerak dan tidak berkilau. Animasi hanya untuk perubahan state (hover, fokus, buka/tutup), 120–160ms. **Tidak ada animasi masuk halaman.**

---

## 4. TOKEN WARNA

Seluruh nilai sudah diverifikasi dengan formula kontras WCAG 2.x. Angka pada tabel adalah rasio sebenarnya, bukan perkiraan.

### 4.1 Permukaan

| Token | Hex | Pemakaian |
| :--- | :--- | :--- |
| `--paper` | **`#F1EFEC`** | Latar halaman. Nilai resmi merek. |
| `--paper-raised` | `#F8F6F3` | Kartu, panel, baris tabel yang di-*hover*. |
| `--paper-sunken` | `#E7E4DF` | Kepala tabel, area input, bidang tenggelam. |

Kedua turunan mengikuti hue hangat kertas resmi, bukan abu netral.

### 4.2 Tinta

| Token | Hex | pada paper | pada raised | pada sunken |
| :--- | :--- | ---: | ---: | ---: |
| `--ink` | `#2B2521` | 13,17 ✅ | 14,01 ✅ | 11,92 ✅ |
| `--ink-2` | `#5C544C` | 6,47 ✅ | 6,89 ✅ | 5,86 ✅ |
| `--ink-muted` | `#6B6257` | 5,21 ✅ | 5,55 ✅ | 4,72 ✅ |

`--ink` sengaja bukan hitam murni — dihangatkan ke arah hue bata, sesuai prinsip yang sama yang membuat kertas tidak putih murni.

> **Perbandingan dengan palet lama:** `--text-muted` #6b6b6b saat ini hanya mencapai 2,69–3,60:1 dan gagal AA pada keempat permukaan (Phase 3 CL-01). Token `--ink-muted` di atas lolos pada seluruh permukaan, dengan margin paling tipis 4,72 pada `--paper-sunken`.

### 4.3 Merek

| Token | Hex | pada paper | Pemakaian |
| :--- | :--- | ---: | :--- |
| `--brand` | **`#8A2416`** | **7,80** ✅ | Isian aksi utama, judul serif, tautan aktif, logo |
| `--brand-deep` | `#6D1C11` | 10,03 ✅ | Hover pada isian solid, teks penekanan |

Teks di atas isian bata: gunakan **`#F1EFEC`** (mencapai **7,80** ✅), bukan putih murni — agar tetap satu keluarga kertas dan konsisten dengan logo.

### 4.4 Semantik

| Token | Hex | pada paper | Catatan |
| :--- | :--- | ---: | :--- |
| `--success` | `#1B6B3A` | 5,70 ✅ | Stok aman, transaksi berhasil |
| `--warning` | `#8A5A06` | 5,16 ✅ | Stok menipis |
| `--danger` | `#B3271A` | 5,68 ✅ | Galat, aksi destruktif |
| `--info` | `#1F5C8B` | 6,18 ✅ | Netral informatif |

Seluruhnya diredam dan dihangatkan agar duduk di atas kertas — bukan warna semantik terang standar yang akan terasa asing di palet ini.

### 4.5 Garis

| Token | Hex | pada paper | Ambang |
| :--- | :--- | ---: | :--- |
| `--rule-hair` | `#DEDBD5` | 1,20 | Dekoratif — pemisah baris tabel |
| `--rule` | `#C5C1B9` | 1,56 | Dekoratif — batas kartu, pemisah bagian |
| `--border-control` | `#8D887D` | **3,08** ✅ | Batas input dan tombol outline — memenuhi WCAG 1.4.11 (≥3:1) |

Pembedaan ini penting: garis dekoratif boleh halus, tetapi **batas kontrol yang harus terlihat agar dapat dioperasikan wajib ≥3:1.**

---

## 5. KOMPONEN

### 5.1 Tombol

| Varian | Bentuk | Pemakaian |
| :--- | :--- | :--- |
| **Primary** | Isian `--brand`, teks `--paper` | **Satu per layar.** Bayar, Simpan, Masuk. |
| **Secondary** | Outline `--border-control`, teks `--ink`, latar transparan | Batal, aksi sekunder |
| **Ghost** | Teks `--ink-2`, tanpa batas | Aksi tersier di dalam baris tabel |
| **Destructive** | Outline `--danger`, teks `--danger`, **tidak pernah terisi** | Hapus, Nonaktifkan, Void |

Tanpa gradasi. Tanpa bayangan. Tanpa `translateY` saat hover — hover cukup menggelapkan isian ke `--brand-deep` atau menegaskan batas.

### 5.2 Fokus

Sistem fokus tunggal untuk seluruh elemen interaktif:

```
:focus-visible → outline 2px solid var(--brand)
                 outline-offset 2px
```

Memakai `:focus-visible`, bukan `:focus`, agar cincin hanya muncul untuk keyboard. Tidak pernah `outline: none` tanpa pengganti.

### 5.3 Konflik merek vs bahaya — dan penyelesaiannya

Kontras `--brand` #8A2416 terhadap `--danger` #B3271A hanya **1,37**. Keduanya tidak dapat dibedakan lewat warna. Untuk POS ini berbahaya: kasir bisa menekan Hapus saat bermaksud Bayar.

**Penyelesaiannya datang dari logo itu sendiri (P1).** Pembeda dibawa oleh *isi versus garis*, bukan oleh hue:

```
  ▓▓▓▓▓▓▓▓▓▓▓▓▓       ┌───────────────┐
  ▓    Bayar   ▓       │    Hapus      │
  ▓▓▓▓▓▓▓▓▓▓▓▓▓       └───────────────┘
  isian solid          outline saja
  satu per layar       tidak pernah terisi
```

Satu-satunya tempat merah boleh terisi solid adalah **tombol konfirmasi di dalam dialog destruktif** — di sana ia menjadi aksi utama tunggal dialog itu, sehingga aturan P1 tetap utuh.

### 5.4 Tabel

Tulang punggung aplikasi ini. Prioritasnya kecepatan pindai.

- Kepala tabel: `--paper-sunken`, huruf besar, `--ink-2`, tracking `0.08em`, 12px
- Pemisah baris: `--rule-hair` 1px — bukan bayangan, bukan warna berselang-seling
- Hover baris: `--paper-raised`
- **Seluruh kolom angka: `font-variant-numeric: tabular-nums`, rata kanan**
- Sel data 14px, padding vertikal 12px — padat, sesuai POS

Tabular numerals bukan detail estetika. Tanpanya, digit tidak sejajar antar baris dan kolom rupiah tidak dapat dipindai secara vertikal (Phase 3 TY-01).

### 5.5 Kartu

- Latar `--paper-raised`, batas 1px `--rule`, radius 4px
- **Tanpa bayangan**
- Kartu tidak pernah membungkus kartu lain
- Tabel di dalam kartu tidak membawa batasnya sendiri — satu lapis batas saja (memperbaiki Phase 3 CP-07)
- Sediakan varian tanpa padding, sehingga tidak perlu di-*override* `padding: 0` seperti saat ini (CP-06)

### 5.6 Kartu statistik

Tempat yang tepat untuk memakai serif secara terukur:

```
PENDAPATAN HARI INI        ← 12px sans, huruf besar, --ink-2
Rp 1.480.000               ← 40px, tabular, --ink
32 transaksi               ← 13px, --ink-muted
```

Angkanya boleh memakai serif jika tampilannya cocok saat diuji — tetapi **hanya bila serif yang dipilih memiliki angka tabular yang benar.** Bila ragu, pakai sans. Keterbacaan angka mengalahkan ekspresi.

Tanpa kilau saat hover. Kartu statistik tidak dapat diklik, sehingga tidak boleh berperilaku seperti dapat diklik (Phase 3 SL-01).

### 5.7 Input

- Latar `--paper`, batas 1px `--border-control`, radius 3px
- Fokus: batas `--brand` + cincin fokus
- Galat: batas `--danger` + pesan di bawah field + `aria-invalid`
- Label selalu di atas, selalu ber-`htmlFor` — placeholder tidak pernah menggantikan label
- Tinggi kontrol minimal 44px (lihat §8)

### 5.8 Badge

Satu-satunya elemen berbentuk pil. Isian sangat tipis dari warna semantik, teks warna semantik penuh, batas 1px.

Selalu memuat teks — status tidak pernah disampaikan hanya lewat warna. Aplikasi saat ini sudah benar dalam hal ini dan harus dipertahankan.

### 5.9 Modal

- Scrim: `--ink` pada opasitas 40% — bukan hitam murni
- Dialog: `--paper-raised`, batas 1px `--rule`, radius 4px, **tanpa bayangan**
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- Escape menutup; fokus terperangkap; fokus kembali ke pemicu

### 5.10 Empty state

Selalu tiga bagian: ikon garis kecil, satu kalimat penjelasan, satu aksi.

```
        ⌷  ← ikon garis, --rule
   Belum ada bahan baku
   Tambahkan bahan pertama untuk
   mulai menghitung HPP menu.
        [ + Tambah Bahan ]
```

Saat ini lima dari tujuh empty state hanya berbunyi "Belum ada X" tanpa arah (Phase 8 CT-10). Pada instalasi baru, pemilik kafe melihat lima tabel kosong tanpa petunjuk urutan pengisian.

---

## 6. TIPOGRAFI

### 6.1 Pasangan

| Peran | Keluarga | Alasan |
| :--- | :--- | :--- |
| **Display** | **EB Garamond** | Old-style yang hangat dan cukup kokoh untuk judul 28px; sesuai pasangan editorial sans/serif yang direkomendasikan Hallmark |
| **UI & data** | **Inter** (dipertahankan) | Angka tabular sangat baik, sudah terpasang, padat dan terbaca pada 13–14px |
| **Mono** | **IBM Plex Mono** | Untuk nomor invoice |

Tiga catatan implementasi:

- **D-09 selesai pada 27 Agustus 2026: EB Garamond dipilih.** Hallmark menganjurkan kontras antara sans untuk body/UI dan serif editorial untuk display, serta secara eksplisit memasukkan EB Garamond dalam pasangan editorial bebas. Di antara kandidat proyek, EB Garamond lebih hangat dan kokoh pada 28px daripada Cormorant Garamond, tanpa kesan editorial-polished sekuat Playfair Display. Pemakaiannya dibatasi pada wordmark dan judul halaman.
- **Inter dipertahankan secara sadar.** `hallmark-main` menandai "Inter-everywhere" sebagai anti-pattern, tetapi yang dilarang adalah Inter sebagai display **sekaligus** body tanpa pasangan. Dipasangkan dengan serif untuk display, Inter menjadi pilihan fungsional yang tepat. Bila diinginkan lebih hangat, **Source Sans 3** adalah pengganti langsung.
- **Mono sudah didaftarkan.** TASK-028 memasang IBM Plex Mono melalui `next/font`
  dan memakainya pada nomor invoice serta struk termal.

Muat lewat `next/font`, bukan `@import` CSS (Phase 9 MD-07).

### 6.2 Skala

Menggantikan 19 ukuran ad-hoc yang ada sekarang (Phase 3 TY-02).

| Token | px | Pemakaian |
| :--- | ---: | :--- |
| `--text-xs` | 12 | Badge, meta, stempel waktu |
| `--text-sm` | 13 | Label, sel tabel sekunder |
| `--text-base` | 14 | Default UI dan body |
| `--text-md` | 16 | Body yang ditekankan |
| `--text-lg` | 20 | Judul bagian |
| `--text-xl` | 28 | Judul halaman — **serif** |
| `--text-2xl` | 40 | Nilai statistik |

Tracking: `-0.01em` untuk display serif, `0` untuk body, `+0.08em` untuk label huruf besar. Wordmark memakai tracking lebar mengikuti logo.

Tinggi baris: 1,25 untuk judul · 1,5 untuk body · 1,3 untuk sel tabel.

---

## 7. SPASI, RADIUS, GERAK

### 7.1 Spasi

Kisi 4px. Menggantikan 17 nilai ad-hoc (Phase 3 SP-01).

| Token | rem | px |
| :--- | ---: | ---: |
| `--space-2xs` | 0,25 | 4 |
| `--space-xs` | 0,5 | 8 |
| `--space-sm` | 0,75 | 12 |
| `--space-md` | 1 | 16 |
| `--space-lg` | 1,5 | 24 |
| `--space-xl` | 2 | 32 |
| `--space-2xl` | 3 | 48 |
| `--space-3xl` | 4 | 64 |

### 7.2 Radius

Logo terdiri dari garis lurus dan sudut tajam. Radius saat ini (6/10/16/24px) terlalu lunak untuk merek ini.

| Token | px | Pemakaian |
| :--- | ---: | :--- |
| `--radius-control` | 3 | Tombol, input |
| `--radius-container` | 4 | Kartu, dialog, pembungkus tabel |
| `--radius-pill` | 9999 | Badge saja |

### 7.3 Elevasi

**Tidak ada.** Tidak ada token bayangan sama sekali. Kedalaman dibawa oleh nada kertas dan garis.

### 7.4 Gerak

| Token | Nilai |
| :--- | :--- |
| `--dur-fast` | 120ms |
| `--dur-base` | 160ms |
| `--ease` | `cubic-bezier(0.2, 0, 0.2, 1)` |

Hanya untuk perubahan state. Transisi menyebut properti spesifik — **tidak pernah `transition: all`** (dipakai di tiga tempat saat ini). Hormati `prefers-reduced-motion`.

---

## 8. IKON

Logo adalah garis rambut satu bobot. Ikon mengikuti: **ikon garis, goresan 1,5px, satu bobot, monokrom `--ink-2`.** Lucide cocok secara bawaan.

Tiga hal yang harus hilang:

| Sekarang | Masalah |
| :--- | :--- |
| ☕ pada **setiap** kartu produk | Ikon yang sama untuk semua menu tidak membedakan apa pun — hanya menambah beban visual dan kebisingan bagi pembaca layar. Hapus; nama dan harga sudah cukup. |
| ◈ ⊟ ☕ ⊕ ◌ ⊞ di sidebar | Lima simbol geometris Unicode dicampur satu emoji berwarna. Bukan satu keluarga; bobot dan ukuran optisnya tidak sepadan. |
| 🛒 ✓ ⚠ | Emoji dirender font sistem — tampilannya berbeda antar perangkat dan tidak dapat diwarnai. |

Ikon dekoratif diberi `aria-hidden`.

---

## 9. PEMAKAIAN LOGO

### 9.1 Aset yang tersedia

Empat varian resmi sudah ada di `public/`, **seluruhnya berlatar transparan** dan memakai tinta `#8A2416` yang identik.

| Berkas | Dimensi | Rasio | Pemakaian yang tepat |
| :--- | :--- | :--- | :--- |
| `Logo-Vertikal.png` | 950 × 516 | 1,84 : 1 | Halaman login, kepala laporan cetak |
| `Logo-Horizontal.png` | 1477 × 230 | 6,42 : 1 | Kepala sidebar admin, bar atas kasir |
| `Logo-IconOnly.png` | 1355 × 601 | 2,25 : 1 | Sidebar tersempit, kepala struk termal |
| `Logo-TextOnly.png` | 2415 × 273 | 8,85 : 1 | Wordmark tanpa gambar, footer laporan |
| `Logo-Merbaoe-Raw.JPG` | 1246 × 848 | — | **Jangan dipakai di UI.** Latar menyatu, artefak JPEG pada garis tipis. Simpan sebagai arsip saja. |

Ini menyelesaikan sebagian besar hambatan yang sebelumnya tercatat: latar sudah transparan, dan setiap varian punya bentuk yang sesuai peruntukannya.

### 9.2 Aturan pemakaian

- **Pilih varian berdasarkan ruang, jangan menskalakan yang salah.** `Logo-Horizontal` pada 6,42:1 akan menjadi sangat kecil bila dipaksa masuk kotak persegi; pakai `Logo-IconOnly` di sana.
- **Ruang kosong minimum** di sekeliling logo: setinggi huruf "K" pada wordmark.
- **Jangan** mewarnai ulang, memiringkan, memberi bayangan, atau menaruh logo di atas latar bercorak.
- Latar yang diizinkan: `--paper`, `--paper-raised`, atau isian `--brand` (untuk versi yang dibalik, bila nanti dibuat).
- Muat lewat `next/image` dengan `width`/`height` eksplisit agar tidak terjadi pergeseran tata letak.

### 9.3 Yang masih dibutuhkan

| Kebutuhan | Alasan |
| :--- | :--- |
| **Favicon** | PNG 1355×601 tidak dapat dipakai sebagai favicon. Perlu potongan persegi dari marka rumah, diekspor ke 32×32, 180×180, dan `.ico`. |
| **Versi SVG** | PNG tidak dapat diwarnai lewat CSS dan akan pecah bila diperbesar. Untuk kepala struk termal dan laporan cetak, vektor jauh lebih tajam. **Prioritas rendah** — PNG transparan sudah cukup untuk seluruh pemakaian layar. |
| **Varian dibalik** | Logo tinta di atas isian `--brand` memerlukan versi berwarna kertas. Baru dibutuhkan bila ada komponen berlatar bata penuh. |

### 9.4 Struk termal

Marka rumah dalam satu tinta tercetak sangat baik pada printer termal — seni garis monokrom adalah persis yang dapat dihasilkan perangkat itu. `Logo-IconOnly.png` sudah siap untuk ini; cukup diubah menjadi hitam-putih 1-bit saat dicetak.

---

## 10. YANG HARUS DIHAPUS

Seluruhnya sudah teridentifikasi Phase 3 sebagai anti-pattern bernama `hallmark-main`. Dengan arah baru ini, semuanya juga menjadi **bertentangan dengan merek**, bukan sekadar generik.

| Elemen | Lokasi | Bertentangan dengan |
| :--- | :--- | :--- |
| Dua orb dekoratif `radial-gradient` 30rem & 24rem | `login/page.tsx:22-47` | P5 — tidak membawa informasi |
| `.gradient-text-brand` (`background-clip: text`) | `globals.css:114-119` | P1, P3 — dan menghapus kontras yang dapat diukur |
| `.glass` `backdrop-filter: blur(12px)` | `globals.css:102-107` | P3 — blur di atas latar polos tidak menghasilkan apa pun |
| `--shadow-glow` dan seluruh token bayangan | `globals.css:44-47` | P3 — logo tidak punya bayangan |
| Isian gradasi pada `.btn-primary` / `.btn-success` | `globals.css:148-181` | P1 — massa solid harus rata dan jarang |
| `transition: all` | 3 tempat | P5 |
| `.fade-in` / `.slide-up` di setiap halaman | `globals.css:322-333` | P5 — tidak ada animasi masuk halaman |
| `.pulse-slow` | `globals.css:335-339` | Kode mati, tidak pernah dipakai |
| Ikon emoji | Seluruh aplikasi | §8 |

---

## 11. TARGET SENTUH & RESPONSIVITAS

README §8.6 menetapkan tablet sebagai prioritas utama layar kasir. Arah visual ini harus mendukungnya sejak token, bukan ditambal belakangan.

| Kontrol | Sekarang | Target |
| :--- | ---: | ---: |
| Tombol qty keranjang | 28px | **≥44px** |
| Tombol metode bayar | ≈31px | **≥44px** |
| `.btn-sm` | ≈31px | **≥44px** |
| Tinggi input | ≈40px | **≥44px** |

Tetapkan `--control-height-sm: 44px` sebagai lantai, bukan sebagai pilihan. Target sentuh boleh diperluas lewat padding atau `::before` tanpa memperbesar tampilan visual.

Seluruh gaya hover dibungkus `@media (hover: hover)` agar tidak menempel di perangkat sentuh.

---

## 12. DAMPAK TERHADAP PETA JALAN

Spesifikasi ini mengubah beberapa task pada `phase11.md`:

Perubahan berikut **sudah diterapkan** ke `execute-step/phase11.md`.

| Task | Perubahan |
| :--- | :--- |
| **TASK-029** | **Didefinisikan ulang** dari "perbaikan kontras token" menjadi **"Adopsi palet warna kertas Merbaoe"**. Tidak lagi menambal palet gelap — mengadopsi palet §4 yang menyelesaikan kegagalan kontras *dan* penyelarasan merek sekaligus. Effort naik Small → **Medium**; **keluar dari daftar Quick Wins** karena kini merupakan pembalikan tema, bukan penyetelan tiga nilai hex. |
| **TASK-028** | Cakupan bertambah: skala tipografi, spasi, radius, pasangan serif, dan penghapusan seluruh efek §10. Effort naik Medium → **Large**. |
| **TASK-026** Komponen bersama | Aturan komponen §5 menjadi spesifikasinya. |
| **TASK-030** Tabular numerals | Tetap, dan tetap Quick Win. Sekarang bagian dari §5.4. |
| **TASK-033** Target sentuh & tablet | Tetap. Angkanya ditetapkan di §11. |
| **TASK-039** Penyempurnaan visual | Penyederhanaan login naik dari kosmetik menjadi penyelarasan merek (§10). |
| **DEF-16** (baru) | Varian tema gelap ditunda — diuji di lokasi lebih dulu (§13). |
| **Belum masuk peta jalan** | Turunan logo SVG (§9.2). Perlu berkas vektor dari perancang logo atau penelusuran ulang dari JPG. |

**Penempatan dalam urutan eksekusi.** TASK-029 dan TASK-028 kini berada di posisi 28–29, di dalam blok "Kualitas antarmuka" — bukan di awal. Arah visual tidak boleh mendahului Phase A: memigrasikan token sebelum skema dan logika finansial diperbaiki berarti menyentuh berkas yang sama dua kali.

Urutan pada `phase11.md` tetap berlaku: **arah visual ini tidak boleh mendahului Phase A.** Memigrasikan token sebelum skema dan logika finansial diperbaiki berarti menyentuh berkas yang sama dua kali.

---

## 13. YANG BELUM DIPUTUSKAN

Tercatat agar tidak terlewat:

**Keputusan yang sudah ditutup:** D-09 menetapkan **EB Garamond** sebagai keluarga serif
display pada 27 Agustus 2026 berdasarkan rekomendasi pairing Hallmark dan kebutuhan
keterbacaan judul 28px. Inter tetap dipakai untuk UI/data.

| Butir | Perlu apa |
| :--- | :--- |
| **Inter atau Source Sans 3** | Preferensi kehangatan. Inter lebih netral dan sudah terpasang; Source Sans 3 lebih humanis dan lebih dekat dengan sifat logo. |
| **Angka statistik: serif atau sans** | Bergantung kualitas angka tabular pada serif yang dipilih. |
| **Silau di ruang temaram** | Kertas terang berpotensi menyilaukan pada kafe berpencahayaan redup di malam hari. Perlu diuji di lokasi. Bila menjadi masalah, jalan keluarnya adalah varian gelap yang dibangun di atas **nama token yang sama** — bukan mengubah arah sekarang. |
| **Favicon** | Perlu ekspor persegi resmi dari perancang (32×32, 180×180, `.ico`). `Logo-IconOnly.png` berasio 2,25:1 dan tidak aman dipotong otomatis tanpa merusak komposisi. Ditunda sebagai aset pra-rilis terpisah; tidak menghalangi acceptance palet TASK-029. |
| **Logo SVG** | Prioritas rendah — PNG transparan sudah memadai untuk layar. Vektor hanya menguntungkan untuk cetak. |

---

**Spesifikasi selesai dan fondasi visual sudah diterapkan oleh TASK-029/TASK-028.**
