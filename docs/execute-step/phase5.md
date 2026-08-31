# PHASE 5 — ACCESSIBILITY AUDIT

**Metode:** analisis statis source code + perhitungan aritmetis kontras dan ukuran target dari nilai CSS.
**Alat bantu otomatis (axe, Lighthouse, screen reader):** tidak dijalankan — aplikasi tidak di-*render*.
**Status output:** Selesai

---

## 0. BATAS KLAIM

Sesuai instruksi Phase 5, audit ini **tidak mengklaim tingkat kepatuhan WCAG apa pun**. Tidak ada pengujian dengan pembaca layar, tidak ada penelusuran keyboard di peramban nyata, dan tidak ada pemindaian otomatis.

Status yang dipakai:

- **Confirmed** — dapat dipastikan dari kode atau dari perhitungan aritmetis (kontras, ukuran target).
- **Potential accessibility issue** — pola dalam kode mengindikasikan masalah, tetapi dampak nyatanya bergantung pada perilaku peramban/AT yang belum diverifikasi.
- **Not Verified** — memerlukan pengujian runtime.

---

## 1. RINGKASAN

Terdapat **beberapa keputusan aksesibilitas yang benar** dan patut dicatat: `<html lang="id">`, penggunaan `<button>` asli untuk seluruh elemen yang dapat diklik pada grid kasir, `aria-hidden` yang tepat pada elemen dekoratif login, `role="alert"` pada galat login, dan status yang tidak mengandalkan warna saja (badge selalu disertai teks).

Namun tiga masalah bersifat sistemik dan berdampak langsung:

1. **21 dari 23 field form tidak terhubung dengan label-nya** — hanya form login yang benar.
2. **Modal tidak memiliki semantik dialog, focus trap, maupun Escape.**
3. **Target sentuh di bawah 44px pada kontrol yang paling sering dipakai kasir** — bertentangan dengan target tablet di README §8.6.

---

## 2. SEMANTIC HTML

| Aspek | Temuan | Evidence | Status |
| :--- | :--- | :--- | :--- |
| `lang` | `<html lang="id">` — benar dan sesuai bahasa antarmuka. | `layout.tsx:18` | ✅ Baik |
| Landmark | `<main>` dipakai pada admin layout dan login. `<aside>` untuk sidebar, `<nav>` untuk daftar tautan. | `admin/layout.tsx:26`, `login/page.tsx:10`, `AdminSidebar.tsx:20,69` | ✅ Baik |
| Landmark kasir | **`/cashier` tidak memiliki `<main>`.** Struktur hanya `<div>` → fragment berisi dua `<div>`. | `cashier/page.tsx:26-36`, `CashierPOS.tsx:120` | Potential — Medium |
| Tombol | Seluruh elemen interaktif memakai `<button>` asli, termasuk kartu produk pada grid kasir. Tidak ada `<div onClick>` yang berperan sebagai tombol — **kecuali overlay modal**. | `CashierPOS.tsx:183`; kecuali `IngredientTable.tsx:66-68` | ✅ Sebagian besar baik |
| Tabel | `<table>`/`<thead>`/`<th>`/`<td>` dipakai dengan benar. `<th>` **tanpa atribut `scope`**. | `globals.css:246-268`; seluruh halaman tabel | Potential — Low |
| Heading — hierarki | Tiga halaman melompati tingkat: `/admin/products` dan `/admin/ingredients` langsung dari `h1` ke `h3`. | `products/page.tsx:17` → `ProductTable.tsx:45`; `ingredients/page.tsx:18` → `IngredientTable.tsx:45,71` | Confirmed — Low |
| Heading — halaman kasir | **`/cashier` tidak memiliki `h1`.** Heading pertama adalah `h2` ("Keranjang"). Nama aplikasi dirender sebagai `<span>`, bukan heading. | `CashierPOS.tsx:144,268` | Confirmed — Medium |
| Daftar | Navigasi sidebar memakai `<nav>` berisi `<Link>` langsung, tanpa `<ul>/<li>`. Dapat diterima; bukan pelanggaran. | `AdminSidebar.tsx:69-120` | Observation |
| Gambar | Tidak ada elemen `<img>`. Seluruh "ikon" adalah karakter emoji/Unicode sebagai teks. Lihat §7. | — | Lihat §7 |

---

## 3. LABELS & FORM SEMANTICS

### 3.1 Temuan utama — A11Y-01

**21 dari 23 field input/select tidak memiliki asosiasi label yang dapat diprogram.** *Confirmed, High.*

| Berkas | Jumlah field | Field ber-`id` |
| :--- | :---: | :---: |
| `LoginForm.tsx` | 2 | **2** ✅ |
| `IngredientTable.tsx` | 7 | 0 |
| `PurchaseForm.tsx` | 5 | 0 |
| `ExpenseForm.tsx` | 4 | 0 |
| `ProductTable.tsx` | 3 | 0 |
| `CashierPOS.tsx` | 1 | 0 |
| `expenses/page.tsx` | 1 | 0 (hidden) |
| **Total** | **23** | **2** |

Pola yang dipakai di seluruh form selain login:

```tsx
<div>
  <label className="label">Nama Bahan</label>
  <input name="name" required className="input" placeholder="Kopi Arabica" />
</div>
```

`<label>` dan `<input>` adalah *sibling* tanpa `htmlFor`/`id`, dan input tidak dibungkus di dalam label. Bagi pembaca layar, field-field ini tidak bernama — yang terbaca hanya jenis kontrol dan mungkin *placeholder*.

Form login membuktikan tim sudah tahu pola yang benar (`LoginForm.tsx:66-78` memakai `htmlFor` + `id` + `autoComplete`). Masalahnya konsistensi penerapan, bukan pengetahuan.

### 3.2 Temuan form lainnya

| Kode | Temuan | Evidence | Status |
| :--- | :--- | :--- | :--- |
| A11Y-02 | **Kolom pencarian kasir tidak memiliki label sama sekali** — hanya `placeholder="Cari menu..."`. Hallmark melarang *placeholder-as-label*; WCAG mensyaratkan nama yang dapat diakses. | `CashierPOS.tsx:147-153` | Confirmed — Medium |
| A11Y-03 | Tidak ada `aria-invalid`, `aria-describedby`, atau elemen pesan galat per-field di form mana pun. Galat validasi server bahkan tidak ditampilkan (Phase 4 UX-07). | Seluruh form | Confirmed — High |
| A11Y-04 | Tidak ada `aria-required`; hanya atribut `required` HTML. Ini **cukup** — `required` sudah diekspos ke AT. **Bukan temuan.** | — | ✅ Tidak ada masalah |
| A11Y-05 | `autoComplete` hanya ada di login. Field lain (nama supplier, nominal, tanggal) tidak memakainya — dampak rendah untuk data operasional. | `LoginForm.tsx:73,90` | Observation — Low |
| A11Y-06 | Kelompok tombol metode pembayaran adalah tiga `<button>` lepas tanpa `role="radiogroup"` / `aria-pressed`. Pengguna AT tidak mendapat informasi mana yang terpilih — pembedaannya murni visual (warna latar + bobot). | `CashierPOS.tsx:365-381` | Confirmed — Medium |

---

## 4. KEYBOARD NAVIGATION & FOCUS

| Aspek | Temuan | Evidence | Status |
| :--- | :--- | :--- | :--- |
| Handler keyboard | **Nol** `onKeyDown`/`onKeyUp`/`onKeyPress` di seluruh `src/`. | `grep` → tidak ada | Confirmed |
| Escape menutup modal | Tidak ada. | `IngredientTable.tsx:65-93` | Confirmed — High |
| Focus trap modal | Tidak ada. Tab dari dalam modal akan berpindah ke konten di belakang overlay. | idem | Confirmed — High |
| Fokus dikembalikan | Setelah modal ditutup, fokus tidak dikembalikan ke tombol pemicu. | idem | Confirmed — Medium |
| Overlay dapat diklik tetapi tidak dapat difokus | `<div onClick={() => setEditing(null)}>` — penutupan via overlay hanya tersedia bagi pengguna penunjuk. Tombol "Batal" tersedia sebagai alternatif, sehingga fungsinya **tidak hilang** bagi pengguna keyboard. | `IngredientTable.tsx:66-68,87` | Potential — Low |
| Indikator fokus | `.input` menyetel `outline: none` (`globals.css:212`) **tetapi menyediakan pengganti** berupa `border-color` + `box-shadow` ring pada `:focus`. Sah. Catatan: memakai `:focus`, bukan `:focus-visible`. `.btn` tidak menyetel `outline: none`, sehingga outline bawaan peramban tetap berlaku. | `globals.css:212-219` | Observation — Low |
| Konsistensi indikator fokus | Tidak ada sistem fokus terpadu; sebagian elemen memakai ring kustom, sebagian bergantung pada default peramban. | — | Low |
| Urutan tab | Mengikuti DOM. Pada layar kasir, seluruh kartu produk mendahului panel keranjang — mencapai tombol Bayar menuntut Tab melewati setiap produk. | `CashierPOS.tsx:119-409` | Potential — Medium |
| Skip link | Tidak ada "lewati ke konten". Dengan sidebar 6 tautan, dampaknya sedang. | — | Low |
| Hover tanpa padanan fokus | `AdminSidebar` mengubah gaya lewat `onMouseEnter`/`onMouseLeave` yang memanipulasi `style` DOM langsung. Tidak ada `onFocus`/`onBlur`. Pengguna keyboard tidak melihat perubahan yang sama. | `AdminSidebar.tsx:103-114` | Confirmed — Medium |

**A11Y-07 — Modal edit bahan baku tidak memenuhi pola dialog.** *Confirmed, High.*
Elemen yang hilang: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` yang menunjuk ke judul, focus trap, penanganan Escape, dan pengembalian fokus. Bagi pengguna pembaca layar, konten di belakang overlay tetap terbaca dan tidak ada penanda bahwa sebuah dialog terbuka.

---

## 5. CONTRAST

Dihitung dari nilai token dengan formula WCAG 2.x. **Confirmed** — lihat Phase 3 §2.2 untuk tabel lengkap.

| Temuan | Rasio | Ambang | Status |
| :--- | :--- | :--- | :--- |
| `--text-muted` #6b6b6b pada `--bg-card` #2a2a2a | **2,69:1** | 4,5:1 | ❌ Gagal AA |
| `--text-muted` pada `--bg-elevated` | **2,91:1** | 4,5:1 | ❌ Gagal AA |
| `--text-muted` pada `--bg-surface` | **3,27:1** | 4,5:1 | ❌ Gagal AA |
| `--text-muted` pada `--bg-base` | **3,60:1** | 4,5:1 | ❌ Gagal AA |
| `--danger` #ef4444 pada `--bg-card` | **3,81:1** | 4,5:1 | ❌ Gagal AA |
| `--info` #3b82f6 pada `--bg-card` | **3,90:1** | 4,5:1 | ❌ Gagal AA |
| `--text-primary`, `--text-secondary`, `--brand-400`, `--success`, `--warning` | 5,69–17,58:1 | 4,5:1 | ✅ Lolos |

**A11Y-08 — `--text-muted` gagal kontras pada seluruh permukaan.** *Confirmed, High.*
Token ini dipakai untuk teks yang justru butuh keterbacaan: `.stat-sub` (konteks angka dashboard), placeholder input, timestamp pada tabel riwayat, teks empty state, dan sublabel sidebar. Pada `.card` rasionya kurang dari 60% ambang minimum.

**A11Y-09 — Teks bergradient tidak dapat dievaluasi kontrasnya.** *Confirmed, Medium.*
`.gradient-text-brand` (`globals.css:114-119`) menyetel `-webkit-text-fill-color: transparent`. Warna teks efektifnya adalah gradient, sehingga tidak memiliki rasio kontras tunggal yang dapat diuji, dan pada ujung gelapnya (`--brand-600` #ea5504) kontras terhadap latar login lebih rendah daripada ujung terangnya. Dipakai pada wordmark — dampak fungsional terbatas karena teksnya bukan konten operasional.

**Catatan positif:** tidak ditemukan informasi yang disampaikan **hanya** lewat warna. Status stok selalu disertai teks ("Menipis"/"Aman"), metode pembayaran disertai label, dan bar stok tipis selalu didampingi angka. Ini keputusan yang benar dan layak dipertahankan.

---

## 6. HIT TARGETS

Dihitung dari CSS: tinggi ≈ (font-size × line-height 1.6) + (padding vertikal × 2). Nilai bersifat perhitungan, bukan pengukuran peramban.

| Kontrol | Perhitungan | Tinggi ≈ | Ambang 44px |
| :--- | :--- | ---: | :---: |
| `.btn-lg` (Masuk, Bayar, Simpan Pembelian) | 16px×1,6 + 14px×2 | **≈54px** | ✅ |
| `.btn` (Tambah Bahan, Simpan) | 14px×1,6 + 10px×2 | **≈42px** | ⚠️ nyaris |
| Tautan sidebar | 13,6px×1,6 + 9,6px×2 | **≈41px** | ⚠️ nyaris |
| `.btn-sm` (Edit, Hapus, Aktif/Nonaktif, Tambah Item) | 12px×1,6 + 6px×2 | **≈31px** | ❌ |
| Tombol qty `−`/`+` di keranjang | `width/height: 1.75rem` eksplisit | **28px** | ❌ |
| Tombol hapus baris `×` pada form pembelian | `.btn-sm` | **≈31px** | ❌ |
| Tombol metode bayar | `.btn-sm` | **≈31px** | ❌ |

**A11Y-10 — Kontrol yang paling sering dipakai kasir berada di bawah ambang target sentuh.** *Confirmed, High untuk konteks tablet.*

Tombol `−`/`+` pada keranjang berukuran 28px — kontrol yang ditekan berkali-kali setiap transaksi. Tombol metode pembayaran, yang ditekan setiap transaksi, berukuran ≈31px. README §8.6 menetapkan tablet sebagai **prioritas utama** layar kasir, sehingga ini bukan isu teoretis.

Kartu produk pada grid justru berukuran besar (padding `1,1rem 0,875rem` + konten multi-baris) dan **tidak** bermasalah.

---

## 7. IKON & KONTEN NON-TEKS

| Temuan | Evidence | Status |
| :--- | :--- | :--- |
| Emoji dipakai sebagai ikon tanpa penanganan AT. ☕ pada setiap kartu produk akan dibacakan pembaca layar (misalnya "hot beverage") sebelum nama menu — menambah kebisingan pada elemen yang paling sering dinavigasi kasir. | `CashierPOS.tsx:217` | Potential — Medium |
| 🛒 pada empty state keranjang tidak `aria-hidden`. | `CashierPOS.tsx:277` | Potential — Low |
| ✓ pada empty state stok aman tidak `aria-hidden`. | `dashboard/page.tsx:136` | Potential — Low |
| ⚠ pada pesan galat tidak `aria-hidden`; namun berada di dalam `role="alert"` sehingga terbacanya wajar. | `LoginForm.tsx:60` | Observation |
| Simbol sidebar ◈ ⊟ ☕ ⊕ ◌ ⊞ tidak `aria-hidden`. Karena setiap tautan juga memuat label teks, nama tautan tetap tersampaikan — hanya didahului pembacaan simbol. | `AdminSidebar.tsx:116` | Potential — Low |
| Elemen dekoratif login **sudah** `aria-hidden`. | `login/page.tsx:23,36` | ✅ Baik |

---

## 8. ERROR MESSAGING & LIVE REGIONS

| Temuan | Evidence | Status |
| :--- | :--- | :--- |
| Galat login memakai `role="alert"` — diumumkan otomatis. | `LoginForm.tsx:46` | ✅ Baik |
| **Galat kasir tidak memakai `role="alert"`.** Pesan "Stok X tidak cukup" muncul sebagai `<div>` biasa; pengguna AT tidak diberi tahu bahwa transaksi gagal. | `CashierPOS.tsx:326-330` | Confirmed — High |
| Pesan sukses transaksi juga bukan live region. | `CashierPOS.tsx:333-338` | Confirmed — Medium |
| Pesan sukses pembelian dan pengeluaran bukan live region. | `PurchaseForm.tsx:111`, `ExpenseForm.tsx:51` | Confirmed — Medium |
| Perubahan kuantitas keranjang tidak diumumkan. | `CashierPOS.tsx:89-95` | Potential — Low |
| Tidak ada `aria-busy` atau pengumuman saat proses berjalan. | Seluruh form | Low |

**A11Y-11 — Umpan balik paling penting di aplikasi tidak diumumkan.** *Confirmed, High.*
Ironinya: satu-satunya `role="alert"` berada di layar yang paling jarang dipakai (login), sementara layar kasir — tempat kegagalan transaksi paling berkonsekuensi — tidak memilikinya.

---

## 9. RESPONSIVE & ZOOM

| Temuan | Evidence | Status |
| :--- | :--- | :--- |
| Nol `@media` query; lebar tetap `16rem`, `340px`, dan grid `px`. Pada pembesaran 200% (WCAG 1.4.4) atau viewport 1280px, tata letak tidak beradaptasi. | Phase 3 LY-01 | Confirmed — High |
| Tidak ada `<meta name="viewport">` eksplisit di `layout.tsx`. Next.js menyisipkan default `width=device-width, initial-scale=1` bila tidak ada `viewport` export — perilaku default framework, sehingga **kemungkinan besar aman**, tetapi tidak diverifikasi pada HTML hasil render. | `layout.tsx:1-22` | Not Verified |
| Tabel berada dalam `.table-wrapper` dengan `overflow-x: auto` — badan halaman tidak akan tergulir horizontal. Keputusan yang benar. | `globals.css:241-245` | ✅ Baik |
| `font-size: 16px` pada `html`, satuan `rem` dipakai luas → penskalaan font peramban bekerja. | `globals.css:70` | ✅ Baik |

---

## 10. PREFERENSI PENGGUNA

| Temuan | Status |
| :--- | :--- |
| Tidak ada `@media (prefers-reduced-motion)`. Animasi `fade-in`, `slide-up`, `pulse-slow`, spinner, dan `transition: all` berjalan tanpa syarat. Durasinya pendek (0,35–0,4 detik) sehingga risikonya rendah, tetapi kepatuhannya tetap belum ada. | Confirmed — Low |
| Tidak ada `@media (hover: hover)` pada gaya hover. Pada perangkat sentuh, state hover dapat "menempel" setelah ketukan. Relevan karena target perangkatnya tablet. | Potential — Medium |
| Tidak ada dukungan `prefers-color-scheme`; aplikasi hanya dark. Bukan pelanggaran. | Observation |

---

## 11. RINGKASAN TEMUAN PHASE 5

| Kode | Temuan | Severity | Status |
| :--- | :--- | :--- | :--- |
| A11Y-01 | 21 dari 23 field tidak terhubung label (hanya login benar) | High | Confirmed |
| A11Y-07 | Modal tanpa `role="dialog"`, `aria-modal`, focus trap, Escape, pengembalian fokus | High | Confirmed |
| A11Y-08 | `--text-muted` gagal kontras AA pada 4 permukaan (2,69–3,60:1) | High | Confirmed |
| A11Y-10 | Target sentuh 28–31px pada kontrol kasir; target perangkat adalah tablet | High | Confirmed |
| A11Y-11 | Galat & sukses kasir bukan live region | High | Confirmed |
| A11Y-03 | Tidak ada `aria-invalid`/`aria-describedby`/pesan galat per-field | High | Confirmed |
| — | Nol interaksi keyboard di seluruh aplikasi | High | Confirmed |
| — | Nol `@media` query; tidak adaptif pada zoom 200% | High | Confirmed |
| A11Y-02 | Kolom pencarian kasir hanya ber-placeholder, tanpa nama | Medium | Confirmed |
| A11Y-06 | Pilihan metode bayar tidak diekspos statusnya ke AT | Medium | Confirmed |
| A11Y-09 | Teks bergradient tidak dapat diuji kontrasnya | Medium | Confirmed |
| — | `--danger` & `--info` gagal AA pada permukaan gelap | Medium | Confirmed |
| — | `/cashier` tanpa `h1` dan tanpa `<main>` | Medium | Confirmed |
| — | Hover sidebar tanpa padanan `:focus` | Medium | Confirmed |
| — | Emoji ikon tidak `aria-hidden` (kebisingan AT pada grid produk) | Medium | Potential |
| — | Tidak ada `@media (hover: hover)`; risiko hover menempel di tablet | Medium | Potential |
| — | Urutan tab kasir melewati seluruh produk sebelum panel bayar | Medium | Potential |
| — | Lompatan heading h1→h3 di dua halaman | Low | Confirmed |
| — | `<th>` tanpa `scope` | Low | Potential |
| — | Tidak ada skip link | Low | Confirmed |
| — | Tidak ada `prefers-reduced-motion` | Low | Confirmed |
| — | `:focus` dipakai alih-alih `:focus-visible` | Low | Observation |
| — | `<meta viewport>` bergantung pada default Next.js | — | Not Verified |

**Yang sudah benar dan perlu dipertahankan:** `lang="id"`, `<button>` asli untuk seluruh aksi, `aria-hidden` pada dekorasi login, `role="alert"` pada login, `overflow-x` pada pembungkus tabel, satuan `rem`, dan tidak adanya informasi yang bergantung pada warna saja.

---

**Output Phase 5 selesai. Lanjut ke Phase 6.**
