# PHASE 3 — VISUAL & USER INTERFACE AUDIT

**Objek audit:** `src/app/globals.css` (353 baris) dan seluruh komponen `.tsx`
**Metode:** analisis source code. **Tidak ada rendering visual atau screenshot** — aplikasi tidak dijalankan.
**Status output:** Selesai

---

## 0. KETERBATASAN AUDIT

Dua hal harus dinyatakan sebelum temuan apa pun:

1. **Tidak ada acuan design system resmi.** README tidak mendefinisikan token visual (GAP-02 Phase 1). Audit ini karena itu menilai terhadap *konsistensi internal* aplikasi dan prinsip umum, bukan terhadap keputusan desain yang pernah ditetapkan proyek.
2. **Penilaian berbasis kode, bukan piksel.** Klaim tentang hierarki dan kepadatan diturunkan dari nilai CSS dan struktur JSX. Nilai kontras dihitung secara aritmetis dari token warna sehingga bersifat *Confirmed*; kesan visual keseluruhan bersifat *Potential* sampai ada verifikasi rendering.

---

## 1. LAYOUT

| Aspek | Temuan | Evidence | Status |
| :--- | :--- | :--- | :--- |
| Page structure | Konsisten: `.page-header` (h1 + p) → konten. Diterapkan seragam di 6 halaman admin. | `globals.css:342-353`; seluruh `admin/**/page.tsx` | Baik |
| Container width | **Tidak ada `max-width` konten.** `admin/layout.tsx` memakai `flex: 1` + `padding: 2rem` tanpa batas lebar. Pada monitor lebar, tabel dan baris teks akan meregang penuh. | `admin/layout.tsx:26-34` | **Medium** |
| Grid | Nilai kolom di-*hardcode* per halaman: `"1fr 340px"`, `"360px 1fr"`, `"1fr 1.4fr"`, `"2fr 1fr 1fr auto"`, `"1fr 1fr 1fr auto"`, `"repeat(3, 1fr)"`. Tidak ada sistem grid. | `dashboard:78`, `expenses:32`, `purchases:29`, `ProductTable:46`, `IngredientTable:46`, `sales:26` | **Medium** |
| Alignment | Konsisten dalam masing-masing halaman. | — | Baik |
| Spacing | **Tidak ada skala spasi.** Nilai yang muncul: `0.2 · 0.25 · 0.35 · 0.4 · 0.5 · 0.6 · 0.65 · 0.7 · 0.75 · 0.82 · 0.875 · 1 · 1.1 · 1.25 · 1.5 · 1.75 · 2 rem`. Tujuh belas nilai berbeda tanpa aturan, sebagian hanya berselisih 0,05rem. | Seluruh `style={{}}` inline | **High** |
| Whitespace | `padding: 1.5rem` pada `.card` dan `.stat-card`; `2rem` pada main. Proporsional. | `globals.css:126,292` | Baik |
| Density | Tabel cukup padat (`td` padding `0.875rem 1rem`, font `0.875rem`) — sesuai untuk POS. Kartu statistik relatif longgar. | `globals.css:262-264,288-292` | Baik |
| Hierarchy | Hierarki tipografi jelas pada tingkat halaman (h1 1.75rem/800 → h2 ~1rem → body 0.875rem). | `globals.css:345-352` | Baik |
| Responsive behavior | **Nol `@media` query di seluruh stylesheet.** Ditambah lebar tetap: sidebar `16rem` dengan `marginLeft: "16rem"`, panel keranjang `width: "340px"`, dan seluruh grid di atas. | `grep -c '@media' globals.css` → **0**; `admin/layout.tsx:30`; `CashierPOS.tsx:258` | **High** |

**Catatan penting untuk konteks POS:** README §8.6 menetapkan tablet (768–1279px) sebagai *prioritas utama* layar kasir. Dengan nol media query dan panel keranjang 340px tetap di samping grid produk, layar kasir pada tablet potret (768px) akan menyisakan sekitar 428px untuk grid menu yang minimum kolomnya 160px — sangat sempit. Status: **Potential**, memerlukan verifikasi rendering.

---

## 2. COLOR

### 2.1 Token

Sistem token warna **ada dan terstruktur** — ini kekuatan nyata. Sepuluh langkah brand, empat permukaan, tiga tingkat teks, dua border, empat semantik.

| Aspek | Temuan | Status |
| :--- | :--- | :--- |
| Color tokens | Terdefinisi rapi di `:root` (`globals.css:10-60`). | Baik |
| Semantic colors | `--success --warning --danger --info` tersedia dan dipakai konsisten pada badge. | Baik |
| Konsistensi | **Nilai literal sering dipakai berdampingan dengan token.** `rgba(249,108,15,...)` muncul di 12 tempat sebagai literal, padahal `--brand-500` adalah `#f96c0f` yang sama. Warna badge memakai literal `#4ade80`, `#fbbf24`, `#f87171`, `#60a5fa` yang tidak ada sebagai token. | **Medium** |
| Destructive/success/warning | Dibedakan dengan jelas; tombol hapus memakai varian `btn-danger` yang berbeda dari primary. | Baik |
| Dark/light mode | Hanya dark. Tidak ada `prefers-color-scheme` maupun toggle. Untuk POS internal, keputusan single-theme dapat diterima — tetapi tidak pernah dinyatakan sebagai keputusan. | Observation |

### 2.2 Kontras — dihitung, bukan diperkirakan

Rasio berikut dihitung dengan formula WCAG 2.x dari nilai token sebenarnya. **Confirmed.**

| Foreground | bg-base `#0f0f0f` | bg-surface `#1a1a1a` | bg-elevated `#242424` | bg-card `#2a2a2a` |
| :--- | ---: | ---: | ---: | ---: |
| `--text-primary` #f5f5f5 | 17.58 ✅ | 15.96 ✅ | 14.24 ✅ | 13.17 ✅ |
| `--text-secondary` #a3a3a3 | 7.60 ✅ | 6.90 ✅ | 6.15 ✅ | 5.69 ✅ |
| **`--text-muted` #6b6b6b** | **3.60 ❌** | **3.27 ❌** | **2.91 ❌** | **2.69 ❌** |
| `--brand-400` #ff8f38 | 8.43 ✅ | 7.66 ✅ | 6.83 ✅ | 6.31 ✅ |
| `--success` #22c55e | 8.41 ✅ | 7.64 ✅ | 6.81 ✅ | 6.30 ✅ |
| **`--danger` #ef4444** | 5.09 ✅ | 4.62 ✅ | **4.13 ❌** | **3.81 ❌** |
| `--warning` #f59e0b | 8.93 ✅ | 8.10 ✅ | 7.23 ✅ | 6.68 ✅ |
| **`--info` #3b82f6** | 5.21 ✅ | 4.73 ✅ | **4.22 ❌** | **3.90 ❌** |

Ambang: AA teks normal 4.5:1.

**Temuan CL-01 — `--text-muted` gagal AA pada keempat permukaan.** *Confirmed, High.* Token ini dipakai untuk `.stat-sub`, placeholder input, timestamp tabel, teks empty state, dan label sekunder sidebar — semuanya teks kecil yang justru paling butuh kontras. Pada `.card` rasionya hanya 2,69:1, kurang dari 60% ambang.

**Temuan CL-02 — `--danger` dan `--info` gagal AA pada permukaan gelap.** *Confirmed, Medium.* Keduanya lolos di `bg-base`/`bg-surface` tetapi gagal di `bg-elevated`/`bg-card`. Karena tabel dan kartu memakai permukaan tersebut, teks nominal berwarna danger pada tabel pengeluaran (`expenses/page.tsx:67`) berada di bawah ambang.

Perlu dicatat secara adil: badge tidak memakai token mentah melainkan varian yang lebih terang (`#f87171`, `#60a5fa`), yang menaikkan kontras. Yang gagal adalah pemakaian token mentah sebagai warna teks.

---

## 3. TYPOGRAPHY

| Aspek | Temuan | Evidence | Status |
| :--- | :--- | :--- | :--- |
| Font families | **Satu keluarga untuk seluruh aplikasi: Inter.** Tidak ada pasangan display/body, tidak ada monospace terdaftar — padahal `fontFamily: "monospace"` dipakai untuk nomor invoice di 3 tempat, jatuh ke default sistem. | `globals.css:6,77`; `dashboard:104`, `sales:62`, `purchases:54` | **Medium** |
| Font sizes | **Tidak ada skala.** Nilai yang ditemukan: `0.6 · 0.65 · 0.7 · 0.72 · 0.75 · 0.78 · 0.8 · 0.82 · 0.85 · 0.875 · 0.9 · 0.95 · 1 · 1.1 · 1.3 · 1.4 · 1.75 · 2 · 2.5 rem`. Sembilan belas ukuran, banyak yang berselisih 0,02rem — perbedaan yang tidak terlihat mata tetapi menandakan nilai dipilih ad-hoc. | Seluruh komponen | **High** |
| Weight | Relatif terkendali: 500/600/700/800. | — | Baik |
| Hierarchy | Jelas di tingkat halaman. Kurang jelas di dalam kartu, di mana `0.8` dan `0.82` dan `0.85` dipakai untuk peran yang setara. | — | Medium |
| Line-height | `body: 1.6`, heading `1.25`. Konsisten dan sesuai. | `globals.css:81,87` | Baik |
| Letter spacing | Dipakai secara sengaja: heading `-0.02em`, stat-value `-0.03em`, label uppercase `+0.08em`. Ini pertanda perhatian desain yang nyata. | `globals.css:88,229,255,306,313` | Baik |
| **Tabular numerals** | **Tidak ada `font-variant-numeric: tabular-nums` di mana pun.** | `grep -rn 'tabular' src/` → tidak ada | **High untuk POS** |

**Temuan TY-01 — angka uang tidak memakai tabular numerals.** *Confirmed, High.* Seluruh nominal rupiah dirender dengan Inter proporsional. Pada kolom tabel yang berisi angka rata kanan — `sales/page.tsx:66-68`, `expenses/page.tsx:67`, `purchases/page.tsx:57` — digit tidak akan sejajar antar baris. Untuk aplikasi yang seluruh nilainya adalah uang dan yang tujuannya adalah pemindaian cepat oleh owner, ini cacat fungsional, bukan sekadar estetika. Inter mendukung `tabular-nums`, jadi perbaikannya satu baris CSS.

---

## 4. COMPONENT SYSTEM

### 4.1 Apakah ada design system yang nyata?

**Sebagian.** `globals.css` memuat lapisan utilitas kelas yang benar-benar dipakai: `.btn` (+4 varian +2 ukuran), `.input`, `.badge` (+5 varian), `.card`, `.stat-card`, `.table-wrapper`, `.label`, `.divider`, `.page-header`. Ini bukan kumpulan acak — ada niat sistem di dalamnya.

Masalahnya terletak pada **rasio antara sistem dan inline**: kelas menangani atom (tombol, input, badge), sementara seluruh komposisi (layout kartu, header, modal, baris form, panel) ditulis sebagai `style={{}}` inline per halaman.

| Komponen | Ada sebagai kelas? | Ada sebagai komponen React? | Catatan |
| :--- | :---: | :---: | :--- |
| Buttons | ✅ `.btn` + varian | ❌ | Konsisten dipakai |
| Inputs | ✅ `.input` | ❌ | `<select>` juga memakai `.input` — bekerja, tetapi chevron dan tinggi native berbeda dari input teks |
| Selects | ⚠️ pinjam `.input` | ❌ | Tidak ada varian khusus |
| Dialogs | ❌ | ❌ | Satu-satunya modal ditulis inline di `IngredientTable.tsx:65-93` |
| Dropdowns | — | — | Tidak ada |
| Tables | ✅ `.table-wrapper` + `table/th/td` global | ❌ | Elemen `<table>` distyle global — pilihan yang wajar |
| Cards | ✅ `.card` | ❌ | Sering di-*override* inline `padding: 0` |
| Badges | ✅ 5 varian | ❌ | Konsisten |
| Tabs | — | — | Tidak ada |
| Navigation | ❌ | ✅ `AdminSidebar` | Satu-satunya komponen yang benar-benar dapat dipakai ulang |
| Forms | ⚠️ `.label` + `.input` | ❌ | Tidak ada `<Field>` yang menggabungkan label+input+error |
| Toast | ❌ | ❌ | Umpan balik memakai div hijau inline, 3 implementasi terpisah |
| Tooltip | ❌ | ❌ | Tidak ada |
| Pagination | ❌ | ❌ | Tidak ada |
| Loading states | ⚠️ spinner inline | ❌ | Dua definisi `@keyframes spin` terduplikasi dalam `<style>` tag komponen |
| Empty states | ⚠️ pola berulang | ❌ | 6 implementasi terpisah dengan `colSpan` berbeda-beda |
| Error states | ❌ | ❌ | Hanya login yang punya; form lain membuang pesan galat |

### 4.2 Temuan komponen

| Kode | Temuan | Evidence | Severity |
| :--- | :--- | :--- | :--- |
| CP-01 | **Modal ditulis inline tanpa abstraksi.** Overlay `position: fixed` + `zIndex: 100` + `onClick` untuk menutup + `stopPropagation`. Tidak ada `role="dialog"`, `aria-modal`, focus trap, atau handler Escape. | `IngredientTable.tsx:65-93` | **High** |
| CP-02 | **Spinner terduplikasi.** `@keyframes spin` didefinisikan dua kali di dalam `<style>` tag komponen, plus `.pulse-slow` di globals yang tidak pernah dipakai. | `LoginForm.tsx:126-130`, `CashierPOS.tsx:411`; `globals.css:335-339` | Low |
| CP-03 | **Umpan balik sukses diimplementasikan tiga kali.** Tiga blok div hijau dengan nilai `rgba(34,197,94,0.1)` dan border yang hampir identik namun berbeda padding/font-size. | `PurchaseForm.tsx:111-115`, `ExpenseForm.tsx:51-55`, `CashierPOS.tsx:333-338` | Medium |
| CP-04 | **Empty state tidak terstandardisasi.** Enam varian dengan padding `2rem`/`3rem` dan warna berbeda; sebagian hanya teks ("Belum ada produk"), satu memakai ikon ✓ dan dua baris. Tidak ada yang menawarkan aksi perbaikan. | `dashboard:97`, `sales:58`, `products:81`, `ingredients:112`, `purchases:50`, `expenses:61`, `CashierPOS:276` | Medium |
| CP-05 | **Nilai ajaib (magic values) tersebar.** Contoh: `minWidth: "80px"`, `width: "1.75rem"`, `top: "-10rem"`, `width: "30rem"`, `maxWidth: "280px"`, `maxWidth: "420px"`, `maxWidth: "480px"`, `zIndex: 100`, `zIndex: 50`. Tidak ada satu pun yang berasal dari token. | Seluruh komponen | Medium |
| CP-06 | **`.card` sering dilawan oleh override inline.** `className="card" style={{ padding: 0 }}` muncul 4 kali, karena `.card` memaksa `padding: 1.5rem` sementara tabel butuh nol. Menandakan API komponen yang kurang tepat. | `sales:41`, `products:64`, `ingredients:96`, `purchases:33`, `expenses:46` | Medium |
| CP-07 | **Border ganda (card-in-card).** `.card` punya `border: 1px solid var(--border-subtle)` dan `.table-wrapper` di dalamnya punya border identik. Sebagian halaman menyiasati dengan `style={{ border: "none", borderRadius: 0 }}`, sebagian tidak — sehingga sebagian tabel berbingkai dua dan sebagian tidak. | `.card`+`.table-wrapper` di `sales:41-43` (tanpa penyiasatan) vs `purchases:37` (dengan) | **Medium — inkonsistensi nyata** |
| CP-08 | **Satu-satunya komponen reusable adalah `AdminSidebar`.** Seluruh UI lain bersifat page-specific. | `src/app/admin/AdminSidebar.tsx` | Struktural — lihat Phase 9 |

---

## 5. AI SLOP DETECTION

Phase 0 aturan 5 melarang menyimpulkan slop hanya karena kehadiran gradient atau blur. Penilaian di bawah karena itu memakai **daftar anti-pattern bernama dari `hallmark-main`** (`skills/hallmark/references/anti-patterns.md`) sebagai rubrik eksternal, dan setiap temuan menyertakan alasan fungsional — bukan preferensi.

### 5.1 Anti-pattern yang cocok — Confirmed

| Anti-pattern (hallmark) | Evidence di aplikasi | Mengapa ini masalah, bukan selera |
| :--- | :--- | :--- |
| **Inter-everywhere** | `globals.css:6,77` — Inter sebagai display sekaligus body, tanpa pasangan. | Hallmark: "A one-font page is a template page." Dampak fungsional di sini lebih tajam: tanpa monospace terdaftar, nomor invoice dan angka uang kehilangan keterbacaan kolom. |
| **The gradient headline** | `.gradient-text-brand` dengan `background-clip: text` + `-webkit-text-fill-color: transparent`, dipakai pada wordmark "POS" di login. | Disebut hallmark sebagai penanda AI tercepat kedua. Juga berdampak teknis: teks bergradient kehilangan kontras terukur dan tidak dapat dievaluasi WCAG. |
| **Floating-orb decoration** | `login/page.tsx:22-47` — dua div `position: fixed` berisi `radial-gradient` circle 30rem dan 24rem, `aria-hidden`, murni dekoratif. | Hallmark: "They have no semantic role… I needed something here, so I added something here." Pada halaman login POS, dua elemen 480px yang tidak membawa informasi tidak memberi manfaat operasional. |
| **Full-viewport centred hero** | `login/page.tsx:11-19` — `minHeight: 100dvh`, `alignItems: center`, `justifyContent: center`, satu kartu terpusat. | Pola default LLM. Untuk login memang lazim, sehingga dampaknya rendah — tetapi kombinasinya dengan orb + gradient headline + glass membentuk pola yang saling menguatkan. |
| **Glassmorphism without purpose** | `.glass` (`globals.css:102-107`, `backdrop-filter: blur(12px)`) dipakai pada kartu login yang berada di atas latar hampir polos. | Blur di atas permukaan tanpa konten di belakangnya tidak menghasilkan efek apa pun selain biaya render. Tidak ada alasan visual. |
| **Shadow-glow on dark** | `--shadow-glow: 0 0 24px rgba(249,108,15,0.15)` pada `.stat-card:hover`; `boxShadow: "0 8px 24px rgba(249,108,15,0.4)"` pada logo login. | Disebut eksplisit oleh hallmark sebagai tell. Pada kartu statistik, glow saat hover tidak menyampaikan informasi — kartu tersebut bahkan tidak dapat diklik. |
| **`transition-all`** | `globals.css:143` `.btn { transition: all ... }`; `AdminSidebar.tsx:101`; `CashierPOS.tsx:200`. | Selain tell, ini nyata membebani: `all` memaksa browser memantau setiap properti yang dapat dianimasikan, termasuk yang memicu layout. |
| **Generic emoji as feature icon** | ☕ (login, sidebar, kartu produk), 🛒 (empty cart), ✓ (empty state stok), ⚠ (alert). | Emoji dirender oleh font sistem sehingga tampilannya berbeda antar-perangkat dan tidak dapat diwarnai. Pada kartu produk kasir, ☕ dipakai untuk **setiap** menu — sehingga ikon tidak membedakan apa pun dan hanya menambah beban visual. |
| **Mismatched icon sets** | `AdminSidebar.tsx:8-13` — ◈ ⊟ ☕ ⊕ ◌ ⊞. Lima simbol geometris Unicode dicampur satu emoji berwarna. | Bukan satu keluarga ikon. Bobot garis, ukuran optis, dan warna tidak sepadan; ☕ berwarna di tengah simbol monokrom. |
| **Hover-only affordances** | `AdminSidebar.tsx:103-114` — state hover diatur lewat `onMouseEnter`/`onMouseLeave` yang memanipulasi `style` DOM langsung, tanpa padanan untuk `:focus`. | Pengguna keyboard tidak mendapat umpan balik yang sama. Juga tidak berlaku di perangkat sentuh — padahal §8.6 menargetkan tablet. |
| **Tabular data without tabular-nums** | Lihat TY-01. | Disebut eksplisit oleh hallmark; dampaknya paling besar justru pada aplikasi ini karena seluruh tabelnya berisi uang. |

### 5.2 Anti-pattern yang **tidak** cocok — dinyatakan agar audit adil

| Anti-pattern | Status di aplikasi |
| :--- | :--- |
| Purple-gradient hero | Tidak ada. Palet berjangkar oranye tunggal (`--brand-*`), konsisten. |
| Aurora-blob background | Tidak ada mesh gradient. Orb yang ada bersifat radial sederhana dan sangat rendah opasitas. |
| The 3-column feature grid | Tidak ada. Grid yang dipakai adalah grid data, bukan grid fitur pemasaran. |
| Side-stripe card | Tidak ada. Border hairline mengelilingi penuh. |
| Pure black / pure white | Tidak. `#0f0f0f` bukan `#000`. Namun netralnya tidak ditint ke arah hue jangkar — deviasi ringan dari prinsip hallmark, bukan pelanggaran. |
| The AI nav / AI footer | Tidak berlaku — ini aplikasi internal, bukan halaman pemasaran. Sidebar sesuai genre. |
| Bounce / elastic easing | Tidak ada. `cubic-bezier(0.4, 0, 0.2, 1)` adalah easing standar yang wajar. |
| Universal `hover:scale-105` | Tidak ada. Hover memakai `translateY(-1px)` — halus dan sesuai anjuran. |
| Auto-rotating carousel, cursor follower, Lottie, Three.js | Tidak ada. |
| Invented metrics | Tidak ada. Seluruh angka dashboard berasal dari basis data. |
| Confirmation dialog untuk aksi reversible | Tidak berlaku terbalik — `confirm()` hanya dipakai untuk hapus, yang memang destruktif. Sesuai prinsip. |

### 5.3 Penilaian AI Slop

**Risiko: Sedang, dan terkonsentrasi pada halaman login.**

Tujuh dari sebelas anti-pattern yang cocok berkumpul di `login/page.tsx` — orb, gradient headline, glass, full-viewport centred, shadow-glow, emoji, centred everything. Halaman-halaman kerja (dashboard, tabel, kasir) jauh lebih bersih: padat, fungsional, memakai token, dan hierarki datanya masuk akal.

Ini pola yang khas: **halaman pertama dirancang untuk mengesankan, halaman kerja dirancang untuk bekerja.** Untuk POS, prioritas seharusnya terbalik — login dilihat sekali sehari selama tiga detik, layar kasir dilihat sepanjang shift.

Yang **bukan** slop dan perlu diakui: sistem token warna, disiplin letter-spacing, kepadatan tabel, varian badge semantik, dan blokir stok habis yang memperhitungkan isi keranjang. Semua itu menunjukkan keputusan sadar, bukan komponen yang ditempel.

---

## 6. PRIORITAS UNTUK KONTEKS POS

Instruksi Phase 3 menetapkan prioritas POS: *speed, clarity, scanability, consistency, accuracy, low cognitive load*.

| Prioritas | Kondisi | Temuan pendukung |
| :--- | :--- | :--- |
| **Speed** | Terhambat | Tanpa media query, layar kasir di tablet menyempit (Potential). Tidak ada shortcut keyboard (Phase 4). |
| **Clarity** | Terhambat | CL-01 — teks sekunder di bawah ambang kontras pada seluruh permukaan. |
| **Scanability** | **Terhambat serius** | TY-01 — angka uang tidak sejajar; ini langsung merusak pemindaian kolom nominal, fungsi utama layar riwayat dan laporan. |
| **Consistency** | Terhambat | 19 ukuran font, 17 nilai spasi, CP-07 border ganda tak seragam, CP-03/CP-04 pola berulang tanpa standar. |
| **Accuracy** | Netral (dari sisi visual) | Isu akurasi bersifat logika, bukan visual — ditangani Phase 2 dan Phase 7. |
| **Low cognitive load** | Netral | Ikon ☕ seragam pada semua produk tidak membantu pembedaan, tetapi label teks sudah jelas. |

---

## 7. RINGKASAN TEMUAN PHASE 3

| Kode | Temuan | Severity | Status |
| :--- | :--- | :--- | :--- |
| CL-01 | `--text-muted` gagal kontras AA pada 4 permukaan (2,69–3,60:1) | High | Confirmed |
| TY-01 | Tidak ada `tabular-nums` pada seluruh kolom uang | High | Confirmed |
| LY-01 | Nol `@media` query + lebar tetap; tablet tidak terdukung meski ditargetkan §8.6 | High | Confirmed |
| SP-01 | Tidak ada skala spasi (17 nilai ad-hoc) | High | Confirmed |
| TY-02 | Tidak ada skala tipografi (19 ukuran ad-hoc) | High | Confirmed |
| CP-01 | Modal tanpa semantik dialog, focus trap, atau Escape | High | Confirmed |
| CL-02 | `--danger` & `--info` gagal AA pada `bg-elevated`/`bg-card` | Medium | Confirmed |
| CP-07 | Border ganda card-in-card, ditangani tidak seragam antar halaman | Medium | Confirmed |
| CP-03 | Tiga implementasi umpan balik sukses | Medium | Confirmed |
| CP-04 | Enam empty state tanpa standar dan tanpa aksi | Medium | Confirmed |
| CP-05 | Magic value tersebar tanpa token | Medium | Confirmed |
| CP-06 | `.card` dilawan `padding: 0` di 5 tempat | Medium | Confirmed |
| LY-02 | Tidak ada `max-width` konten admin | Medium | Confirmed |
| LY-03 | Nilai grid di-hardcode per halaman | Medium | Confirmed |
| TY-03 | Satu font untuk semua; `monospace` dirujuk tanpa didaftarkan | Medium | Confirmed |
| CL-03 | Literal warna berdampingan dengan token | Medium | Confirmed |
| SL-01 | Klaster anti-pattern pada halaman login (7 tell) | Medium | Confirmed |
| SL-02 | `transition: all` di 3 tempat | Low | Confirmed |
| SL-03 | Ikon campuran: 5 simbol Unicode + emoji | Low | Confirmed |
| CP-02 | `@keyframes spin` terduplikasi; `.pulse-slow` dead code | Low | Confirmed |

---

**Output Phase 3 selesai. Lanjut ke Phase 4.**
