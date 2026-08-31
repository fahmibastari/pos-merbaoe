import assert from "node:assert/strict";
import test from "node:test";
import { cashierSalesWhere, cashierStockWhere } from "./cashier-view";

test("riwayat kasir selalu mengunci filter kepemilikan di server", () => {
  const where = cashierSalesWhere(17, "kopi");
  assert.equal(where.cashierId, 17);
  assert.ok(Array.isArray(where.OR));
  assert.equal(where.OR?.length, 2);
});

test("filter riwayat menolak ID kasir tidak sah", () => {
  assert.throws(() => cashierSalesWhere(0, ""), /ID kasir tidak sah/);
});

test("stok kasir hanya memuat bahan aktif", () => {
  assert.deepEqual(cashierStockWhere(""), { isActive: true });
  assert.equal(cashierStockWhere("susu").isActive, true);
});
