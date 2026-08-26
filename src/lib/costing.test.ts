import assert from "node:assert/strict";
import test from "node:test";

import {
  applyHistoricalStockReturn,
  applyStockIn,
  applyStockInAtAverageCost,
  applyStockOut,
  calculateProductHpp,
} from "./costing";

test("void mengembalikan nilai historis tanpa mengubah average cost berjalan", () => {
  assert.deepEqual(
    applyHistoricalStockReturn(
      { currentStock: 104, stockValue: 1_140, averageCost: 10.9615 },
      6,
      60,
    ),
    { currentStock: 110, stockValue: 1_200, averageCost: 10.9615 },
  );
});

test("U-01: mutasi masuk menghasilkan rata-rata tertimbang", () => {
  assert.deepEqual(
    applyStockIn(
      { currentStock: 1_000, stockValue: 150_000, averageCost: 150 },
      500,
      180
    ),
    { currentStock: 1_500, stockValue: 240_000, averageCost: 160 }
  );
});

test("U-02: mutasi keluar mempertahankan average cost", () => {
  assert.deepEqual(
    applyStockOut(
      { currentStock: 1_000, stockValue: 150_000, averageCost: 150 },
      150
    ),
    { currentStock: 850, stockValue: 127_500, averageCost: 150 }
  );
});

test("U-03: stok habis memaksa nilai menjadi nol dan menyimpan average cost terakhir", () => {
  assert.deepEqual(
    applyStockOut(
      { currentStock: 100, stockValue: 15_000, averageCost: 150 },
      100
    ),
    { currentStock: 0, stockValue: 0, averageCost: 150 }
  );
});

test("opname tambah memakai average cost berjalan tanpa menghitung ulang", () => {
  assert.deepEqual(
    applyStockInAtAverageCost(
      { currentStock: 3, stockValue: 100, averageCost: 33.3333 },
      1,
    ),
    { currentStock: 4, stockValue: 133, averageCost: 33.3333 },
  );
});

test("simulasi README §3.10.G menghasilkan Rp 161,1111 per gram", () => {
  assert.deepEqual(
    applyStockIn(
      { currentStock: 850, stockValue: 127_500, averageCost: 150 },
      500,
      180
    ),
    { currentStock: 1_350, stockValue: 217_500, averageCost: 161.1111 }
  );
});

test("mutasi keluar menolak kuantitas melebihi stok", () => {
  assert.throws(
    () =>
      applyStockOut(
        { currentStock: 10, stockValue: 1_500, averageCost: 150 },
        11
      ),
    /Stok tidak cukup/
  );
});

test("U-04: produk BOM menjumlahkan takaran dikali average cost", () => {
  assert.deepEqual(
    calculateProductHpp({
      baseHpp: 8_500,
      hasRecipe: true,
      recipeCosts: [
        { quantityNeeded: 15, averageCost: 161.1111 },
        { quantityNeeded: 120, averageCost: 20 },
        { quantityNeeded: 20, averageCost: 30 },
      ],
    }),
    { hpp: 5_417, source: "recipe" }
  );
});

test("U-05: produk tanpa BOM memakai base HPP", () => {
  assert.deepEqual(
    calculateProductHpp({
      baseHpp: 10_000,
      hasRecipe: false,
      recipeCosts: [],
    }),
    { hpp: 10_000, source: "base" }
  );
});

test("U-06: average cost nol memicu fallback ke base HPP", () => {
  assert.deepEqual(
    calculateProductHpp({
      baseHpp: 8_500,
      hasRecipe: true,
      recipeCosts: [
        { quantityNeeded: 18, averageCost: 150 },
        { quantityNeeded: 150, averageCost: 0 },
      ],
    }),
    { hpp: 8_500, source: "fallback" }
  );
});
