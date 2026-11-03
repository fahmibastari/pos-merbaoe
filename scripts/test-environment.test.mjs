import test from "node:test";
import assert from "node:assert/strict";
import { testEnvironment } from "./test-environment.mjs";

test("QA menolak database yang tidak dipilih eksplisit atau bukan database test", () => {
  assert.throws(() => testEnvironment({}, {}), /belum dipilih/);
  assert.throws(() => testEnvironment({ TEST_DATABASE_URL: "postgresql://u:p@localhost/merbaoe" }, {}), /khusus/);
  assert.throws(() => testEnvironment({ TEST_DATABASE_URL: "invalid credential text" }, {}), (error) => !JSON.stringify(error).includes("invalid credential text") && /tidak valid/.test(error.message));
});

test("QA menolak database aplikasi meskipun password atau parameter URL berbeda", () => {
  assert.throws(() => testEnvironment({ TEST_DATABASE_URL: "postgresql://u:new@localhost/merbaoe_test?sslmode=require" }, { DATABASE_URL: "postgresql://u:old@localhost:5432/merbaoe_test" }), /sama/);
});

test("QA mengarahkan runtime dan migrasi ke database khusus tanpa mengubah environment asal", () => {
  const env = { DATABASE_URL: "postgresql://u:p@localhost/merbaoe", TEST_DATABASE_URL: "postgresql://u:p@localhost/merbaoe_test" };
  const result = testEnvironment(env, {});
  assert.equal(result.DATABASE_URL, env.TEST_DATABASE_URL);
  assert.equal(result.DIRECT_URL, env.TEST_DATABASE_URL);
  assert.equal(env.DATABASE_URL, "postgresql://u:p@localhost/merbaoe");
});
