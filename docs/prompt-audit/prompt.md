# MASTER EXECUTION PROMPT — EXECUTE STEP AUDIT

Kamu akan menjalankan workflow audit aplikasi secara **berurutan dari Phase 0 sampai Phase 11**.

Repository root adalah:

`merbaoe/`

Folder workflow:

`docs/execute-step/`

Jangan menjalankan phase secara acak.

---

# EXECUTION ORDER

Jalankan phase dengan urutan berikut:

1. `Phase 0 - Role dan Rule.md`
2. `Phase 1 - Audit Readme dan Product Planning.md`
3. `Phase 2 - Audit Implementasi Aktual.md`
4. `Phase 3 - Visual dan UI Audit.md`
5. `Phase 4 - UI dan UX Engineering.md`
6. `Phase 5 - Accessibility Audit.md`
7. `Phase 6 - Performance dan Architecture Audit.md`
8. `Phase 7 - Security dan Business Logic.md`
9. `Phase 8 - Content dan Product Quality.md`
10. `Phase 9 - Technical Debt.md`
11. `Phase 10 - Final Synthesis.md`
12. `Phase 11 - Execution Roadmap dan Implementation Plan.md`

---

# PHASE 0

Phase 0 merupakan **global constitution / rule set**.

Baca Phase 0 terlebih dahulu.

Semua aturan di dalam Phase 0 berlaku untuk seluruh Phase 1–11.

Jangan memperlakukan Phase 0 sebagai audit report.

Phase 0 hanya menetapkan:

- role;
- rules;
- evidence standard;
- factuality;
- scope;
- constraints;
- UI principles;
- penggunaan `hallmark-main`;
- aturan lain yang berlaku global.

Setelah memahami Phase 0, gunakan seluruh rule tersebut pada phase berikutnya.

---

# PHASE EXECUTION PRINCIPLE

Setiap phase harus:

1. membaca instruction phase tersebut;
2. memahami input yang diperlukan;
3. melakukan pekerjaan phase tersebut;
4. menghasilkan output yang diminta phase tersebut;
5. memastikan output tersimpan pada lokasi yang ditentukan;
6. baru kemudian melanjutkan ke phase berikutnya.

Jangan melakukan Phase N+1 sebelum Phase N selesai.

---

# CONTEXT BETWEEN PHASES

Phase berikutnya boleh dan harus menggunakan hasil phase sebelumnya apabila dibutuhkan.

Contoh:

Phase 2 harus memahami hasil Phase 1 jika Phase 2 memerlukan konteks planning.

Phase 10 harus membaca dan mensintesis hasil Phase 1–9.

Phase 11 harus membaca hasil Phase 10 dan hasil audit sebelumnya yang relevan.

Jangan menghapus output phase sebelumnya.

Jangan menimpa output phase sebelumnya kecuali instruction phase tersebut secara eksplisit mengizinkannya.

---

# IMPORTANT: PHASE 0 ≠ PHASE 1

Jangan salah menginterpretasikan Phase 0 sebagai langkah audit.

Phase 0 adalah:

> Global rules

Phase 1 adalah audit pertama.

---

# IMPORTANT: PHASE 10 ≠ PHASE 11

## Phase 10

Tugasnya:

> Menggabungkan seluruh hasil audit dan menghasilkan final synthesis + priority matrix.

Phase 10 menjawab:

> “Bagaimana kondisi aplikasi secara keseluruhan dan apa masalah terpentingnya?”

## Phase 11

Tugasnya:

> Mengubah hasil synthesis dan priority matrix menjadi execution roadmap.

Phase 11 menjawab:

> “Apa yang harus dikerjakan, dalam urutan apa, dengan dependency apa, dan bagaimana menentukan selesai?”

Jangan mencampur kedua fungsi tersebut.

---

# CHECKPOINT

Sebelum menyimpulkan kondisi progress aplikasi, baca:

`docs/checkpoint.md`

Perlakukan checkpoint sebagai snapshot context.

Namun source code tetap harus digunakan untuk memverifikasi claim.

Jika terdapat perbedaan antara checkpoint dan repository:

- jangan memilih secara diam-diam;
- dokumentasikan discrepancy;
- jelaskan evidence;
- gunakan status yang realistis.

Jangan membuat false claim.

---

# HALLMARK-MAIN

Folder:

`hallmark-main/`

adalah **design knowledge reference**.

Jangan menganggapnya sebagai template yang harus disalin.

Gunakan untuk memahami prinsip:

- visual hierarchy;
- spacing;
- typography;
- interaction;
- component composition;
- information density;
- design system;
- UX patterns;
- accessibility;
- responsive behavior.

Kemudian nilai apakah prinsip tersebut relevan diterapkan pada aplikasi POS.

Jangan melakukan copy-paste design secara membabi buta.

---

# READ ENTIRE REPOSITORY WHEN REQUIRED

Gunakan struktur repository sebagai evidence.

Jangan hanya menganalisis file yang muncul paling awal.

Gunakan:

- directory inspection;
- source inspection;
- dependency inspection;
- configuration inspection;
- component inspection;
- API inspection;
- database/schema inspection;
- tests;
- documentation.

Namun gunakan judgment agar tidak membaca file yang jelas irrelevant seperti:

- `node_modules`;
- build output;
- generated cache;
- binary;
- temporary files.

Ikuti scope yang ditentukan pada setiap phase.

---

# EVIDENCE RULE

Setiap finding harus sebisa mungkin dapat ditelusuri kembali ke evidence.

Jangan menganggap:

- file tidak ditemukan = fitur tidak ada;
- README mengatakan selesai = implementasi selesai;
- component terlihat bagus = UX bagus;
- dependency terpasang = fitur digunakan;
- code terlihat clean = architecture sehat.

Gunakan status seperti:

- Confirmed
- Partially Confirmed
- Potential
- Not Verified
- Not Found

sesuai evidence.

---

# FILE SAFETY

Jangan menghapus source code.

Jangan melakukan refactor atau perubahan product code hanya karena menemukan masalah.

Workflow ini adalah **audit and planning workflow**.

Perubahan source code baru dilakukan setelah Phase 11 dan hanya jika diminta secara eksplisit.

---

# PHASE COMPLETION

Setelah menyelesaikan setiap phase:

1. pastikan hasilnya sudah ditulis;
2. pastikan tidak ada requirement penting yang terlewat;
3. pastikan kesimpulan tidak bertentangan dengan evidence;
4. lanjutkan ke phase berikutnya.

Jangan berhenti hanya setelah menemukan beberapa masalah.

---

# FINAL CONDITION

Workflow dianggap selesai hanya setelah:

- Phase 0 selesai dibaca;
- Phase 1 selesai;
- Phase 2 selesai;
- Phase 3 selesai;
- Phase 4 selesai;
- Phase 5 selesai;
- Phase 6 selesai;
- Phase 7 selesai;
- Phase 8 selesai;
- Phase 9 selesai;
- Phase 10 selesai;
- Phase 11 selesai.

Pada akhirnya harus tersedia:

`docs/execute-step/phase11.md`

yang berisi implementation roadmap yang dapat digunakan sebagai dasar pekerjaan coding berikutnya.

Jangan mengklaim workflow selesai jika salah satu phase belum dijalankan.

---

# START

Mulai dari:

`Phase 0 - Role dan Rule.md`

Kemudian lanjutkan **secara sequential hingga Phase 11**.

Jangan meminta konfirmasi setelah setiap phase.

Jalankan seluruh workflow sampai selesai selama tidak terdapat blocker nyata yang membuat phase berikutnya tidak dapat dijalankan.