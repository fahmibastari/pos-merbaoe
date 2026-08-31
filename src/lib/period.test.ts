import assert from "node:assert/strict";
import test from "node:test";
import {
  businessRangeFromDates,
  dateOnlyRangeFromDates,
  formatDateOnly,
  parseDateOnly,
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

test("tanggal kolom DATE tidak bergeser ke hari sebelumnya", () => {
  const date = parseDateOnly("2026-08-31");
  assert.equal(date.toISOString(), "2026-08-31T00:00:00.000Z");
  assert.equal(formatDateOnly(date), "31/8/2026");
});

test("rentang kolom DATE memakai tengah malam UTC dan batas atas eksklusif", () => {
  const range = dateOnlyRangeFromDates("2026-08-01", "2026-08-31");
  assert.equal(range.gte.toISOString(), "2026-08-01T00:00:00.000Z");
  assert.equal(range.lt.toISOString(), "2026-09-01T00:00:00.000Z");
});

test("rentang kolom DATE mengikuti batas maksimal satu tahun", () => {
  assert.doesNotThrow(() => dateOnlyRangeFromDates("2025-01-01", "2025-12-31"));
  assert.throws(
    () => dateOnlyRangeFromDates("2025-01-01", "2026-01-01"),
    /maksimal satu tahun/i,
  );
});
