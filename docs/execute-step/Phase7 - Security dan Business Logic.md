# PHASE 7 — SECURITY & BUSINESS LOGIC

Audit:

- authentication;
- authorization;
- role checking;
- input validation;
- output validation jika relevan;
- secret exposure;
- environment handling;
- insecure client trust;
- IDOR;
- privilege escalation;
- unsafe database operations;
- transaction integrity;
- duplicate submissions;
- audit logging;
- sensitive data exposure.

Khusus POS:

- apakah harga dapat dimanipulasi dari client;
- apakah total transaksi dipercaya dari client;
- apakah stock dapat berubah tanpa authorization;
- apakah transaksi dapat dibuat dua kali;
- apakah user dapat mengakses resource milik role lain;
- apakah historical transaction dapat dimodifikasi;
- apakah refund/void memiliki kontrol yang memadai.

Jangan melakukan exploit destruktif.

Audit hanya berdasarkan code dan static evidence.

---