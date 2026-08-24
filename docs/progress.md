# PROGRES IMPLEMENTASI — POS KOPI MERBAOE

> **Dokumen ini adalah titik masuk setiap sesi kerja.** Baca bagian §1 lebih dulu, lalu
> lanjutkan dari task pertama yang berstatus `⬜ Belum`.

**Terakhir diperbarui:** 22 Agustus 2026 · Sesi 1
**Progres:** 0 / 40 task selesai · TASK-001 sebagian (menunggu D-01 s.d. D-04)
**Sedang dikerjakan:** TASK-001

---

## 1. CARA MELANJUTKAN

### Kalau ini sesi pertama Anda di proyek ini

Baca berurutan, jangan dilompati:

| Urut | Dokumen | Untuk apa |
| :---: | :--- | :--- |
| 1 | `README.md` | Dokumen desain sistem — kebijakan akuntansi, skema, NFR. **Ini acuan kebenaran.** |
| 2 | `docs/checkpoint.md` §1 | Kondisi aplikasi saat ini dalam satu halaman |
| 3 | `docs/execute-step/phase11.md` | **Peta jalan resmi** — spesifikasi lengkap 40 task |
| 4 | `docs/design-direction.md` | Arah visual dan design token (untuk task UI saja) |
| 5 | Dokumen ini §3 | Status terkini dan apa yang harus dikerjakan berikutnya |

### Kalau Anda melanjutkan pekerjaan

1. Lihat §3 — ambil task pertama yang berstatus `⬜ Belum` dan dependency-nya sudah `✅`.
2. Buka spesifikasi lengkapnya di `phase11.md` — cari `## [TASK-0XX]`.
3. Kerjakan sampai seluruh *Acceptance Criteria*-nya terpenuhi.
4. Jalankan pemeriksaan §5 sebelum menandai selesai.
5. Perbarui §3 dan tambahkan entri di §6.

### Aturan yang berlaku sepanjang proyek

- **`README.md` adalah acuan.** Bila kode dan README berbeda, README yang benar — kecuali README-nya sendiri yang keliru, dan itu diperbaiki lebih dulu.
- **Jangan menandai task selesai sebelum seluruh Acceptance Criteria terpenuhi.** Sebagian selesai tetap `🟡`.
- **Jangan melewati dependency.** Urutan di §3 sudah memperhitungkannya.
- Setiap perubahan skema lewat migrasi Prisma, tidak pernah mengubah basis data langsung.
- `npm run build` harus tetap lulus setelah setiap task.

---

## 2. STATUS KESELURUHAN

| | Jumlah |
| :--- | ---: |
| ✅ Selesai | 0 |
| 🟡 Sebagian | 1 |
| ⛔ Terblokir | 1 |
| ⬜ Belum | 38 |
| **Total** | **40** |

Lima task lain bertanda ⚠️ — belum terblokir, tetapi ada keputusan yang harus diambil sebelum dikerjakan (§4).

**Milestone terdekat:** menyelesaikan TASK-001 s.d. TASK-003 (fondasi) — setelah itu 15 fitur yang saat ini terblokir menjadi bisa dikerjakan.

---

## 3. DAFTAR TASK

Urutan mengikuti *Final Execution Order* pada `phase11.md` §4. Kolom **Dep** menyebut task yang harus selesai lebih dulu.

Legenda: `⬜ Belum` · `🔵 Dikerjakan` · `🟡 Sebagian` · `✅ Selesai` · `⛔ Terblokir`

### Fondasi — keamanan & skema

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 1 | TASK-001 Amankan kredensial dan rahasia sesi | P0 | S | — | 🟡 | Sisi repo **selesai**. Rotasi & riwayat Git menunggu Anda — D-01 s.d. D-04 |
| 2 | TASK-002 Verifikasi status data & strategi migrasi | P0 | S | — | ⛔ | Menunggu password baru (§4) |
| 3 | TASK-030 Tabular numerals | P1 | S | — | ⬜ | Tanpa dependency, bisa kapan saja |
| 4 | TASK-003 Migrasi skema + constraint + indeks | P0 | **L** | 002 | ⬜ | **Membuka 15 fitur** |
| 5 | TASK-004 `lib/guard.ts` + otorisasi Server Action | P0 | S | — | ⬜ | |
| 6 | TASK-005 `lib/period.ts` + `lib/money.ts` | P0 | S | 003 | ⬜ | |
| 7 | TASK-006 Validasi `zod` | P0 | M | 003 | ⬜ | Menutup S5 kuantitas negatif |
| 8 | TASK-008 Agregasi basis data | P0 | S | 005 | ⬜ | |
| 9 | TASK-007 Rumus laba bersih + label | P0 | S | 005, 008 | ⬜ | |
| 10 | TASK-010 Nomor invoice dari sequence | P0 | S | 003 | ⬜ | |
| 11 | TASK-009 Race condition stok | P0 | M | 003, 006 | ⬜ | |

### Fitur inti — average costing

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 12 | TASK-011 `lib/costing.ts` + average costing pembelian | P0 | M | 003, 005 | ⬜ | |
| 13 | TASK-012 HPP dinamis + kartu stok keluar | P0 | M | 009, 011 | ⬜ | **Fitur inti skripsi.** Invariant I-03 |
| 14 | TASK-013 Perbaiki seed → transaksi `opening` | P1 | S | 011 | ⬜ | Tanpa ini average cost = 0 |
| 15 | TASK-021 Bentuk hasil Server Action seragam | P1 | M | 004, 006 | ⬜ | |
| 16 | TASK-026 Ekstrak komponen bersama | P1 | M | 021 | ⬜ | **Harus sebelum 12 layar baru** |

### Kelengkapan alur POS

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 17 | TASK-014 Model DPP: diskon, pajak, kembalian | P1 | M | 003, 006, 012 | ⬜ | |
| 18 | TASK-015 Penyusun resep BOM | P1 | M | 003, 004, 011 | ⬜ | Tanpa ini admin tak bisa buat menu BOM |
| 19 | TASK-016 Ubah produk + soft delete | P1 | S | 003, 021 | ⬜ | |
| 20 | TASK-017 Idempotensi transaksi | P1 | M | 003, 010 | ⚠️ | Spesifikasi belum ada di README — §4 |
| 21 | TASK-022 Struk termal | P1 | M | 010, 014 | ⬜ | |
| 22 | TASK-018 Pembatalan transaksi (void) | P1 | M | 003, 012 | ⬜ | |
| 23 | TASK-019 Shift kasir | P1 | M | 003, 014 | ⚠️ | Dua keputusan tertunda — §4 |
| 24 | TASK-020 Opname, waste, kartu stok | P2 | M | 011, 012 | ⬜ | Invariant I-08 |

### Kualitas antarmuka

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 25 | TASK-027 Kontrak tiga state | P1 | M | 021, 026 | ⬜ | |
| 26 | TASK-032 Modal yang dapat diakses | P1 | S | 026 | ⬜ | |
| 27 | TASK-031 Asosiasi label + semantik form | P1 | M | 021, 026 | ⬜ | 21 dari 23 field |
| 28 | TASK-029 Adopsi palet kertas Merbaoe | P1 | M | — | ⬜ | Nilai di `design-direction.md` §4 |
| 29 | TASK-028 Token tipografi/spasi/radius + hapus efek | P2 | **L** | 026 | ⚠️ | Keluarga serif belum final — §4 |
| 30 | TASK-033 Target sentuh + responsivitas tablet | P1 | M | 026, 028 | ⬜ | |

### Kelengkapan data & pelaporan

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 31 | TASK-024 Paginasi, filter tanggal, pencarian | P2 | M | 008, 026 | ⬜ | |
| 32 | TASK-023 Layar kasir: riwayat + stok read-only | P2 | S | 024 | ⬜ | |
| 33 | TASK-025 Laporan laba, persediaan, jejak audit | P2 | M | 007, 020, 024 | ⬜ | |

### Pengerasan & kualitas

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 34 | TASK-037 Lint bersih, kode mati, `proxy.ts` | P2 | S | 012 | ⬜ | |
| 35 | TASK-034 Optimalkan kueri checkout | P2 | S | 009 | ⬜ | |
| 36 | TASK-040 Tipe uang utuh di batas klien/server | P2 | M | 005 | ⬜ | |
| 37 | TASK-035 Infrastruktur pengujian + 25 kasus uji | P1 | **L** | 005, 011, 012 | ⚠️ | Tooling belum dipilih — §4 |
| 38 | TASK-036 Rate limit login + manajemen pengguna | P2 | M | 003, 021 | ⬜ | |

### Penyempurnaan

| # | Task | P | Effort | Dep | Status | Catatan |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| 39 | TASK-038 Interaksi keyboard kasir | P2 | M | 014, 032, 033 | ⬜ | |
| 40 | TASK-039 Persistensi keranjang, copy, visual | P3 | S | 026, 028 | ⚠️ | Persistensi keranjang belum diputuskan — §4 |

---

## 4. MENUNGGU KEPUTUSAN ATAU AKSI ANDA

Task bertanda ⚠️ atau ⛔ di §3 tertahan di sini. Selesaikan agar tidak menghambat.

| # | Butir | Menahan | Apa yang dibutuhkan |
| :---: | :--- | :--- | :--- |
| **D-01** | **Rotasi password Supabase** | TASK-001, TASK-002 | `supabaseConnect.txt` berisi password teks polos **sudah ter-*push* ke `origin/dev`** (commit `da342e9`). Rotasi di dashboard Supabase, lalu perbarui `DATABASE_URL` dan `DIRECT_URL` di `.env` dan Vercel. |
| **D-02** | **Visibilitas repo GitHub** | Menentukan urgensi D-01 | Cek `fahmibastari/pos-merbaoe` publik atau privat. Bila publik, anggap kredensial sudah bocor. |
| **D-03** | **Izin membersihkan riwayat Git** | TASK-001 | Menghapus berkas dari riwayat memerlukan *force-push* ke `origin/dev`. Perlu persetujuan Anda. |
| **D-04** | **`JWT_SECRET` produksi** | TASK-001 | Set di Vercel (Production + Preview). Nilai lokal sudah dibuatkan. |
| **D-05** | **Basis data berisi data nyata?** | TASK-002 → TASK-003 | Menentukan migrasi bersih atau perlu pengisian mundur. Saya bisa hitung barisnya begitu password baru siap. |
| **D-06** | **Spesifikasi idempotensi** | TASK-017 | README belum memodelkannya (GAP-03 Phase 1). Perlu ditambahkan lebih dulu. |
| **D-07** | **Jalur shift untuk Admin** | TASK-019 | Kontradiksi C-04: Admin punya hak POS tetapi tidak punya layar buka shift. |
| **D-08** | **Pengeluaran dari uang laci** | TASK-019 | GAP-07: bila kafe bayar pengeluaran kecil pakai uang laci, `expected_cash` akan selalu selisih. |
| **D-09** | **Keluarga serif** | TASK-028 | Cormorant Garamond / EB Garamond / Playfair Display — perlu perbandingan visual dengan logo pada 28px. |
| **D-10** | **Tooling pengujian** | TASK-035 | Framework + strategi basis data uji. Kasus I-05 (konkurensi) butuh harness khusus. |
| **D-11** | **Persistensi keranjang** | TASK-039 | README belum memutuskan state management. |
| **D-12** | **Logo SVG** | TASK-029, TASK-039 | Berkas saat ini JPEG dengan latar menyatu — tidak bisa dipakai untuk favicon atau ikon. Perlu vektor. |

---

## 5. PEMERIKSAAN SEBELUM MENANDAI TASK SELESAI

Jalankan seluruhnya. Bila ada yang gagal, task belum selesai.

```bash
npx tsc --noEmit      # wajib lulus
npm run build         # wajib lulus
npx eslint .          # wajib lulus mulai TASK-037
npm test              # wajib lulus mulai TASK-035
```

Ditambah, khusus untuk task yang menyentuh logika finansial:

- [ ] Seluruh *Acceptance Criteria* task tersebut di `phase11.md` tercentang
- [ ] Angka hasil dapat dicocokkan dengan simulasi `README.md` §3.10
- [ ] Tidak ada regresi pada task yang sudah `✅`

### Dua invariant yang menentukan

Keduanya adalah bukti utama bahwa sistem bekerja, dan menjadi temuan inti untuk bab pengujian:

| Kode | Isi | Diuji setelah |
| :--- | :--- | :--- |
| **I-03** | Σ `total_cost` baris `stock_transactions` bertipe `out` = `sales.total_hpp` | TASK-012 |
| **I-08** | Persediaan awal + pembelian − HPP − waste ± penyesuaian = persediaan akhir | TASK-020 |

---

## 6. CATATAN SESI

Setiap sesi kerja menambahkan satu entri. Tulis apa yang dikerjakan, apa yang berubah dari rencana, dan apa yang ditemukan di luar dugaan.

### Sesi 1 — 22 Agustus 2026

**Dikerjakan**
- Audit Phase 0–11 dijalankan penuh, menghasilkan 11 dokumen di `docs/execute-step/`.
- `README.md` ditulis ulang sebagai dokumen desain yang dapat dieksekusi; skema §5.15 lolos `npx prisma validate`.
- `docs/checkpoint.md` diperbarui ke v5.0 dengan bab antarmuka & aksesibilitas.
- `docs/design-direction.md` ditulis — arah visual diturunkan dari logo, seluruh token lolos kontras AA.
- Dokumen ini dibuat.

**Temuan di luar dugaan**
- `supabaseConnect.txt` berisi password basis data **sudah ter-*push* ke `origin/dev`**, bukan hanya ada di lokal. Ini menaikkan urgensi TASK-001 secara signifikan.
- Warna merek `#8B2316` tidak dapat dipakai di atas tema gelap yang ada (1,61–2,14:1), sehingga arah visual harus berpindah ke kertas terang.
- `updateProduct` tidak pernah ada — harga menu terkunci setelah menu pernah terjual.

**TASK-001 — sisi repo selesai**

| Perubahan | Berkas |
| :--- | :--- |
| `JWT_SECRET` lokal dibangkitkan (32 byte acak, base64) | `.env` |
| Template variabel lingkungan dibuat | `.env.example` (baru) |
| Pola berkas kredensial ditambahkan | `.gitignore` |
| Nilai cadangan `JWT_SECRET` dihapus — aplikasi kini gagal start bila variabel kosong atau <32 karakter | `src/lib/auth.ts` |
| `supabaseConnect.txt` dikeluarkan dari pelacakan Git (berkas lokal sengaja dibiarkan sampai rotasi selesai) | indeks Git |

**Verifikasi**

| Pemeriksaan | Hasil |
| :--- | :--- |
| `npx tsc --noEmit` | lulus, exit 0 |
| `npm run build` | lulus, 12 halaman |
| `git ls-files \| grep supabaseConnect` | 0 hasil — sudah tidak terlacak |
| Uji ambang `readJwtSecret` | kosong / string kosong / 10 karakter / 31 karakter → **ditolak**; 32 karakter dan nilai `.env` → diterima |

**Belum selesai — menunggu Anda**
- D-01 rotasi password Supabase · D-02 visibilitas repo · D-03 izin bersihkan riwayat · D-04 `JWT_SECRET` di Vercel.
- Selama riwayat Git belum dibersihkan, password lama masih dapat diambil dari commit `da342e9` di `origin/dev`. **Rotasi adalah perbaikan sesungguhnya; pembersihan riwayat hanya kebersihan.**

---
