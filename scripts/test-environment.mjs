import { readFileSync, existsSync } from "node:fs";
import { parse } from "dotenv";

function connectionUrl(value) {
  try {
    return new URL(value);
  } catch {
    throw new Error("URL database QA/aplikasi tidak valid. Periksa konfigurasi tanpa membagikan kredensialnya.");
  }
}

function databaseIdentity(value) {
  const url = connectionUrl(value);
  return `${url.hostname.toLowerCase()}:${url.port || "5432"}${url.pathname}`;
}

export function testEnvironment(env = process.env, appEnv = undefined) {
  const target = env.TEST_DATABASE_URL;
  if (!target) {
    throw new Error("Database QA belum dipilih. Jalankan npm run qa:local atau isi TEST_DATABASE_URL dengan database khusus pengujian.");
  }
  const url = connectionUrl(target);
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !/(?:^|[_-])(?:test|qa)(?:$|[_-])/i.test(url.pathname.slice(1))) {
    throw new Error("TEST_DATABASE_URL harus menunjuk database PostgreSQL khusus dengan nama mengandung test atau qa.");
  }
  const local = appEnv ?? (existsSync(".env") ? parse(readFileSync(".env")) : {});
  if ([local.DATABASE_URL, local.DIRECT_URL].filter(Boolean).some((value) => databaseIdentity(value) === databaseIdentity(target))) {
    throw new Error("Database QA sama dengan database aplikasi di .env. Pilih database terpisah.");
  }
  return { ...env, DATABASE_URL: target, DIRECT_URL: target };
}
