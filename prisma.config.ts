// prisma.config.ts - Konfigurasi Prisma CLI v7
// DATABASE_URL (port 6543) = runtime pooler untuk Next.js
// DIRECT_URL  (port 5432) = koneksi langsung untuk migrasi CLI
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Gunakan direct URL agar migrate tidak stuck di PgBouncer
    url: process.env["DIRECT_URL"],
  },
});
