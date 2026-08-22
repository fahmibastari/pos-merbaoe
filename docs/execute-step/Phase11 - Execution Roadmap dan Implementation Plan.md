# PHASE 11 — EXECUTION ROADMAP & IMPLEMENTATION PLAN

## TUJUAN

Gunakan seluruh hasil audit dari phase sebelumnya untuk menyusun **roadmap implementasi yang realistis, terurut, dan dapat dieksekusi**.

Phase ini bukan audit ulang.

Tugas utama phase ini adalah mengubah hasil audit menjadi:

- pekerjaan konkret;
- prioritas;
- dependency;
- urutan implementasi;
- acceptance criteria;
- definition of done.

Hasil akhirnya harus dapat digunakan oleh coding agent sebagai **implementation plan** tanpa perlu menebak-nebak maksud audit sebelumnya.

---

# INPUT WAJIB

Sebelum menyusun roadmap, baca hasil seluruh phase sebelumnya yang relevan di:

`docs/execute-step/`

Minimal pahami:

- hasil repository analysis;
- hasil README / planning audit;
- hasil implementation audit;
- hasil UI/UX audit;
- hasil accessibility audit;
- hasil architecture / performance audit;
- hasil security / business logic audit;
- technical debt;
- Phase 10 — Final Synthesis;
- Priority Matrix dari Phase 10.

Baca juga:

- `README.md`
- `docs/checkpoint.md`

Gunakan `checkpoint.md` untuk memahami kondisi aktual aplikasi, tetapi jangan mengubahnya.

---

## URUTAN KETERGANTUNGAN

Phase ini dijalankan setelah Phase 0–10 selesai.

Urutan proses:

Phase 0
→ Global rules dan constraints

Phase 1–9
→ Individual audit

Phase 10
→ Consolidated findings + Priority Matrix

Phase 11
→ Execution Roadmap

Jangan mengeksekusi Phase 11 sebagai pengganti Phase 0–10.

Jika hasil salah satu phase sebelumnya belum tersedia atau tidak lengkap, tandai dependency tersebut sebagai `Missing Previous Phase Output` dan jangan mengarang hasil yang belum tersedia.

# ATURAN UTAMA

## 1. Jangan membuat temuan baru

Phase 11 bukan tempat menemukan masalah baru.

Semua pekerjaan harus berasal dari:

- hasil audit;
- gap planning vs implementation;
- priority matrix;
- technical dependency;
- requirement yang sudah teridentifikasi.

Apabila saat menyusun roadmap ditemukan informasi yang tampaknya bertentangan dengan audit sebelumnya, jangan diam-diam membuat asumsi.

Tandai sebagai:

> Requires verification

---

## 2. Jangan mengubah semua temuan menjadi task

Tidak semua finding harus dikerjakan.

Gunakan judgment berdasarkan:

- severity;
- impact;
- effort;
- dependency;
- business importance;
- risk;
- current project stage.

Temuan yang hanya bersifat cosmetic atau low-impact tidak boleh mengalahkan masalah fundamental.

---

# 3. Urutkan berdasarkan dependency, bukan hanya severity

Priority saja tidak cukup.

Contoh:

```text
Database integrity
    ↓
Transaction service
    ↓
API contract
    ↓
Frontend state handling
    ↓
UI refinement
```

Jangan menyuruh coding agent memperbaiki UI terlebih dahulu jika fondasi yang menggerakkan UI tersebut masih belum stabil.

---

# 4. Jangan premature optimization

Performance optimization hanya dimasukkan sebagai pekerjaan utama apabila:

- ada evidence bottleneck;
- ada architectural issue yang jelas;
- atau terdapat risiko scalability yang masuk akal berdasarkan codebase.

Bedakan:

- verified problem;
- potential improvement.

---

# ROADMAP LEVEL

Susun roadmap ke dalam beberapa fase besar.

Jangan menganggap semua kategori berikut wajib ada.

Masukkan hanya yang relevan dengan hasil audit.

---

# PHASE A — FOUNDATION & CRITICAL CORRECTIONS

Fokus pada masalah fundamental yang memengaruhi correctness, reliability, security, atau struktur sistem.

Contoh area:

- critical business logic;
- data integrity;
- transaction correctness;
- authorization;
- validation;
- architecture issue yang blocking;
- critical dependency;
- severe technical debt;
- critical bug.

Prioritaskan P0 terlebih dahulu.

---

# PHASE B — CORE BUSINESS WORKFLOW

Fokus pada workflow utama aplikasi POS.

Gunakan hasil audit untuk menentukan workflow mana yang paling penting.

Contoh:

- product management;
- inventory;
- stock movement;
- cart;
- transaction;
- payment;
- customer;
- transaction history;
- refund / void;
- reporting.

Jangan menambahkan modul yang tidak dibutuhkan hanya karena secara umum POS sering memilikinya.

Fokus pada workflow yang benar-benar ada atau direncanakan aplikasi.

---

# PHASE C — UX ENGINEERING

Fokus pada efisiensi penggunaan aplikasi.

Prioritaskan:

- navigation;
- information architecture;
- search;
- filtering;
- form efficiency;
- feedback;
- loading state;
- empty state;
- error state;
- confirmation;
- keyboard interaction;
- focus management;
- unnecessary interaction;
- task completion time.

Untuk workflow yang memiliki masalah besar, gunakan format:

```text
Current Flow
↓
Problem
↓
Target Flow
↓
Expected Improvement
```

Fokus utama untuk POS:

> speed, clarity, accuracy, and low cognitive load.

---

# PHASE D — DESIGN SYSTEM & UI CONSOLIDATION

Gunakan hasil UI audit dan analisis `hallmark-main`.

Jangan menjadikan `hallmark-main` sebagai template visual.

Gunakan prinsip yang telah ditemukan dari sana untuk menentukan:

- typography;
- spacing;
- colors;
- component sizing;
- radius;
- elevation;
- controls;
- tables;
- forms;
- dialogs;
- feedback;
- loading;
- empty state;
- error state.

Identifikasi:

- duplicate components;
- inconsistent components;
- page-specific styling;
- magic values;
- repeated patterns;
- tokens yang belum terstandardisasi.

Target:

> Membentuk visual language aplikasi POS yang konsisten dan intentional, bukan meniru hallmark-main.

---

# PHASE E — ACCESSIBILITY & RESPONSIVENESS

Masukkan pekerjaan yang berasal dari audit accessibility dan responsive behavior.

Contoh:

- semantic HTML;
- keyboard navigation;
- focus states;
- labels;
- contrast;
- ARIA;
- modal interaction;
- responsive layout;
- touch target;
- responsive table behavior.

Jangan mengklaim WCAG compliance penuh tanpa evidence yang memadai.

---

# PHASE F — PERFORMANCE & SCALABILITY

Masukkan pekerjaan berdasarkan hasil audit.

Prioritaskan:

- verified performance bottleneck;
- unnecessary rendering;
- unnecessary fetching;
- expensive computation;
- large list handling;
- bundle issues;
- caching;
- state management;
- database indexing;
- query efficiency.

Bedakan secara eksplisit:

### Verified Bottleneck

Masalah yang memiliki evidence.

### Potential Optimization

Peluang optimasi yang belum terbukti menjadi bottleneck.

Jangan memperlakukan keduanya sama.

---

# PHASE G — SECURITY, HARDENING & QUALITY

Masukkan pekerjaan untuk:

- authorization;
- validation;
- sensitive data handling;
- security hardening;
- logging;
- error handling;
- testing;
- audit trail;
- reliability.

Prioritaskan business-critical security terlebih dahulu.

---

# PHASE H — FINAL POLISH

Tahap terakhir digunakan untuk improvement yang tidak blocking.

Contoh:

- micro-interactions;
- animation refinement;
- copywriting;
- minor visual refinement;
- spacing refinement;
- consistency polish.

P0 dan P1 tidak boleh tertunda hanya demi pekerjaan pada fase ini.

---

# TASK SPECIFICATION

Setiap pekerjaan yang dimasukkan ke roadmap harus memiliki format berikut.

## [TASK-ID] Task Name

**Priority:** P0 / P1 / P2 / P3

**Category:** Architecture / Business / UI / UX / Security / Performance / Accessibility / etc.

**Source Finding**

Referensikan finding atau hasil audit yang menyebabkan task ini dibuat.

**Problem**

Jelaskan permasalahan aktual.

**Why It Matters**

Jelaskan dampaknya terhadap:

- user;
- business;
- reliability;
- maintainability;
- security;
- scalability.

Gunakan hanya dampak yang relevan.

**Current State**

Jelaskan kondisi sekarang berdasarkan evidence.

**Target State**

Jelaskan kondisi yang diinginkan setelah task selesai.

**Affected Area**

Sebutkan file, folder, module, component, atau layer yang diketahui terdampak.

Jangan mengarang path.

Jika belum cukup evidence:

`To be determined during implementation`

**Dependencies**

Tuliskan task yang harus diselesaikan terlebih dahulu.

Jika tidak ada:

`None`

**Implementation Notes**

Berikan arahan teknis seperlunya.

Jangan menulis implementation detail yang belum didukung evidence.

**Acceptance Criteria**

Gunakan checklist yang dapat diverifikasi.

Contoh:

- [ ] Transaction total tidak dipercaya dari client.
- [ ] Server menghitung ulang nilai transaksi.
- [ ] Error state tersedia.
- [ ] Workflow dapat diselesaikan tanpa langkah yang tidak diperlukan.
- [ ] Tidak terdapat duplicate component untuk pattern yang sama.

**Definition of Done**

Jelaskan kapan task benar-benar dianggap selesai.

---

# TASK DEPENDENCY GRAPH

Setelah seluruh task dibuat, susun dependency secara eksplisit.

Contoh:

```text
TASK-001
Database integrity
    ↓
TASK-002
Transaction service
    ↓
TASK-003
API contract
    ↓
TASK-004
Frontend state handling
    ↓
TASK-005
Transaction UI refinement
```

Jika dua task tidak saling bergantung dan aman dikerjakan bersamaan, tandai:

`Parallelizable`

---

# PRIORITY + EFFORT MATRIX

Setelah menentukan task, buat ringkasan:

| Task | Priority | Impact | Effort | Dependency | Phase |
|---|---|---|---|---|---|

Gunakan kategori effort:

- Small
- Medium
- Large

Jangan memberikan estimasi waktu yang dibuat-buat kecuali memang ada dasar.

---

# QUICK WINS

Buat bagian:

## Quick Wins

Masukkan task yang:

- impact tinggi;
- effort rendah;
- dependency rendah;
- aman dilakukan lebih awal.

Jangan memasukkan refactor besar hanya karena hasil akhirnya terlihat sederhana.

---

# DEFERRED / DON'T DO YET

Buat bagian:

## Deferred / Don't Do Yet

Masukkan:

- improvement yang belum diperlukan;
- cosmetic work yang premature;
- optimasi yang belum memiliki evidence;
- feature yang belum memiliki business justification;
- pekerjaan yang bergantung pada foundation lain;
- pekerjaan P3 yang lebih baik dilakukan setelah core workflow stabil.

Tujuan bagian ini adalah mencegah scope creep.

---

# FINAL EXECUTION ORDER

Buat satu urutan final yang mudah dibaca coding agent.

Contoh:

```text
1. TASK-001 — Fix transaction integrity
2. TASK-002 — Fix stock mutation consistency
3. TASK-003 — Consolidate validation
4. TASK-004 — Refactor shared table system
5. TASK-005 — Improve checkout workflow
6. TASK-006 — Consolidate design tokens
7. TASK-007 — Standardize states
8. TASK-008 — Accessibility refinement
9. TASK-009 — Performance optimization
10. TASK-010 — Final visual polish
```

Urutan harus mempertimbangkan:

- priority;
- dependency;
- impact;
- risk;
- implementation order.

---

# ROADMAP SUMMARY

Buat summary seperti:

| Phase | Focus | Main Goal | Exit Condition |
|---|---|---|---|
| A | Foundation | Stabilize system | Critical issues resolved |
| B | Core Workflow | Stabilize POS flow | Core flows reliable |
| C | UX | Improve efficiency | Main workflows efficient |
| D | Design System | Consistent UI | UI patterns consolidated |
| E | Accessibility | Inclusive interaction | Major issues resolved |
| F | Performance | Improve measured bottlenecks | Critical bottlenecks addressed |
| G | Hardening | Production quality | Security/quality baseline met |
| H | Polish | Final refinement | No major UX/UI inconsistencies |

Sesuaikan isi berdasarkan audit aktual.

Jangan mengisi fase hanya demi membuat tabel lengkap.

---

# GLOBAL DEFINITION OF DONE

Buat Definition of Done untuk keseluruhan roadmap.

Aplikasi dianggap siap melanjutkan ke tahap berikutnya apabila:

- core functionality berjalan;
- business logic benar;
- critical security issues ditangani;
- validation memadai;
- error handling memadai;
- UI konsisten;
- major UX issues ditangani;
- accessibility issue yang relevan ditangani;
- performance issue yang terverifikasi ditangani;
- testing yang relevan tersedia;
- tidak ada known P0 blocker.

Jangan menyatakan aplikasi production-ready hanya karena seluruh task roadmap selesai jika masih terdapat blocker yang belum diverifikasi.

---

# ROADMAP VALIDATION

Sebelum menulis hasil akhir, lakukan pemeriksaan:

- Apakah seluruh P0 memiliki tempat dalam roadmap?
- Apakah P1 penting sudah masuk?
- Apakah dependency sudah benar?
- Apakah ada task yang sebenarnya redundant?
- Apakah ada task yang tidak memiliki source finding?
- Apakah ada pekerjaan cosmetic yang ditempatkan terlalu awal?
- Apakah ada performance optimization tanpa evidence?
- Apakah ada feature baru yang tidak berasal dari requirement?
- Apakah roadmap terlalu besar dibandingkan scope aplikasi?
- Apakah roadmap dapat benar-benar diikuti coding agent?

Jika ada task tanpa dasar yang cukup, hapus atau tandai sebagai `Requires Verification`.

---

# OUTPUT

Tulis hasil final ke:

`docs/execute-step/phase11.md`

Jangan mengubah:

`docs/checkpoint.md`

Phase 11 harus menjadi **implementation roadmap**, bukan audit report.

Tujuan akhirnya:

> Developer atau coding agent dapat membuka `phase11.md` dan mengetahui dengan jelas **apa yang harus dikerjakan, mengapa harus dikerjakan, urutan pengerjaannya, dependency-nya, area yang terdampak, dan bagaimana memverifikasi bahwa pekerjaan tersebut selesai dengan benar.**