import assert from "node:assert/strict";
import test from "node:test";
import { auditJson, safeAuditData } from "./audit";

test("auditJson menyembunyikan rahasia pada objek dan array bersarang", () => {
  const normalized = auditJson({
    name: "Admin",
    passwordHash: "jangan-tampil",
    nested: { accessToken: "rahasia", enabled: true },
    rows: [{ secretKey: "rahasia-lagi", value: 2 }],
  });
  const safe = safeAuditData(JSON.parse(JSON.stringify(normalized)));
  assert.deepEqual(safe, {
    name: "Admin",
    passwordHash: "[DISEMBUNYIKAN]",
    nested: { accessToken: "[DISEMBUNYIKAN]", enabled: true },
    rows: [{ secretKey: "[DISEMBUNYIKAN]", value: 2 }],
  });
});
