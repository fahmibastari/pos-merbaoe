import assert from "node:assert/strict";
import test from "node:test";
import {
  businessRangeFromDates,
  parseWibDate,
  toWibDateString,
} from "./period";

test("tanggal kalender dibaca dan ditulis kembali dalam WIB", () => {
  const date = parseWibDate("2026-08-27");
  assert.equal(date.toISOString(), "2026-08-26T17:00:00.000Z");
  assert.equal(toWibDateString(date), "2026-08-27");
});

test("rentang tanggal memakai batas atas eksklusif WIB", () => {
  const range = businessRangeFromDates("2026-08-01", "2026-08-31");
  assert.equal(range.gte.toISOString(), "2026-07-31T17:00:00.000Z");
  assert.equal(range.lt.toISOString(), "2026-08-31T17:00:00.000Z");
});

test("rentang laporan tidak boleh melebihi satu tahun", () => {
  assert.doesNotThrow(() => businessRangeFromDates("2025-01-01", "2025-12-31"));
  assert.throws(
    () => businessRangeFromDates("2025-01-01", "2026-01-01"),
    /maksimal satu tahun/i,
  );
});
