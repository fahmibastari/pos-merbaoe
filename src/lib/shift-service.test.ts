import "dotenv/config";
import assert from "node:assert/strict";
import test from "node:test";
import { calculateShiftCash } from "./shift-service";

test("shift menghitung kas awal + penjualan tunai - pengeluaran laci", () => {
  assert.deepEqual(
    calculateShiftCash({
      openingCash: 500_000,
      cashSales: 1_250_000,
      cashDrawerExpenses: 75_000,
    }),
    {
      openingCash: 500_000,
      cashSales: 1_250_000,
      cashDrawerExpenses: 75_000,
      expectedCash: 1_675_000,
    },
  );
});

test("shift menolak pengeluaran laci yang melampaui kas tersedia", () => {
  assert.throws(
    () =>
      calculateShiftCash({
        openingCash: 10_000,
        cashSales: 0,
        cashDrawerExpenses: 11_000,
      }),
    /nilai tidak sah/,
  );
});
