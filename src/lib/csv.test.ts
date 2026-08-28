import assert from "node:assert/strict";
import test from "node:test";
import { createCsv } from "./csv";

test("CSV memakai BOM, mengutip nilai, dan menahan formula injection", () => {
  const csv = createCsv(
    ["Nama", "Nilai"],
    [["=HYPERLINK(\"x\")", -25], ["Kopi, susu", 10]],
  );
  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /"'=HYPERLINK\(""x""\)"/);
  assert.match(csv, /"-25"/);
  assert.match(csv, /"Kopi, susu"/);
  assert.ok(csv.endsWith("\r\n"));
});
