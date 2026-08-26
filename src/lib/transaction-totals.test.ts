import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCashChange,
  calculateTransactionTotals,
} from "./transaction-totals";

test("U-07: diskon, DPP, pajak, dan total mengikuti urutan §3.4", () => {
  const result = calculateTransactionTotals({
    subtotalAmount: 180_000,
    discountAmount: 10_000,
    taxRate: "0.1",
    totalHpp: 52_500,
  });

  assert.equal(result.netAmount.toNumber(), 170_000);
  assert.equal(result.taxAmount.toNumber(), 17_000);
  assert.equal(result.totalAmount.toNumber(), 187_000);
});

test("U-08: laba kotor berasal dari DPP dan tidak memasukkan pajak", () => {
  const result = calculateTransactionTotals({
    subtotalAmount: 180_000,
    discountAmount: 10_000,
    taxRate: "0.1",
    totalHpp: 52_500,
  });

  assert.equal(result.grossProfit.toNumber(), 117_500);
  assert.notEqual(
    result.grossProfit.toNumber(),
    result.totalAmount.minus(result.totalHpp).toNumber(),
  );
});

test("pajak dibulatkan half-up hanya pada nilai akhir", () => {
  const result = calculateTransactionTotals({
    subtotalAmount: 10_005,
    discountAmount: 0,
    taxRate: "0.1",
    totalHpp: 0,
  });

  assert.equal(result.taxAmount.toNumber(), 1_001);
  assert.equal(result.totalAmount.toNumber(), 11_006);
});

test("diskon yang melebihi subtotal ditolak", () => {
  assert.throws(
    () =>
      calculateTransactionTotals({
        subtotalAmount: 10_000,
        discountAmount: 10_001,
        taxRate: 0,
        totalHpp: 0,
      }),
    /melebihi subtotal/,
  );
});

test("kembalian tunai dihitung dari total tersimpan", () => {
  assert.equal(calculateCashChange(187_000, 200_000).toNumber(), 13_000);
});

test("uang tunai yang kurang ditolak", () => {
  assert.throws(() => calculateCashChange(187_000, 180_000), /kurang 7000/);
});
