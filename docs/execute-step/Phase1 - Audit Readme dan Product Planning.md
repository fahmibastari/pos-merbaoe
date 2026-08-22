# PHASE 1 — AUDIT README / PRODUCT PLANNING

Baca `README.md` secara menyeluruh.

Nilai apakah README sudah cukup profesional untuk menjadi blueprint aplikasi POS production-grade.

Evaluasi minimal:

## Product Definition

- tujuan aplikasi;
- target user;
- problem yang diselesaikan;
- scope;
- non-scope;
- business workflow;
- core use cases;
- user roles;
- operational context;
- assumptions.

## Functional Planning

Periksa:

- authentication;
- authorization;
- user management;
- products;
- categories;
- inventory;
- stock movement;
- sales;
- cart;
- payment;
- transaction;
- receipt;
- customer;
- supplier jika relevan;
- reporting;
- dashboard;
- settings;
- audit trail;
- notifications;
- search/filter/sort;
- import/export;
- backup/recovery jika relevan.

Jangan menganggap semua fitur di atas wajib.

Tentukan berdasarkan konteks POS yang dijelaskan README.

## Technical Planning

Nilai:

- frontend architecture;
- backend architecture;
- database;
- API;
- state management;
- validation;
- authentication;
- authorization;
- error handling;
- logging;
- testing;
- observability;
- deployment;
- environment management;
- scalability;
- maintainability.

## Missing Planning

Cari hal penting yang belum direncanakan.

Contoh:

- loading states;
- empty states;
- error states;
- permission matrix;
- transactional consistency;
- stock race conditions;
- duplicate transaction prevention;
- audit logs;
- offline behavior jika relevan;
- idempotency;
- pagination;
- search;
- accessibility;
- responsive behavior;
- testing strategy;
- backup;
- data integrity.

Jangan langsung mengatakan fitur tertentu wajib.

Nilai berdasarkan konteks aplikasi.

---