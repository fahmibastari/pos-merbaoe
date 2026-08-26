import {
  roundRupiah,
  roundUnitCost,
  toNumber,
  type MoneyInput,
} from "./money";

/** Saldo persediaan yang dibutuhkan oleh perhitungan average costing. */
export type StockStateInput = {
  currentStock: MoneyInput;
  stockValue: MoneyInput;
  averageCost: MoneyInput;
};

/** Saldo persediaan siap disimpan kembali ke kolom Decimal Prisma. */
export type StockState = {
  currentStock: number;
  stockValue: number;
  averageCost: number;
};

export type HppSource = "recipe" | "base" | "fallback";

export type RecipeCostInput = {
  quantityNeeded: MoneyInput;
  averageCost: MoneyInput;
};

function readStockState(current: StockStateInput): StockState {
  const state = {
    currentStock: toNumber(current.currentStock),
    stockValue: toNumber(current.stockValue),
    averageCost: toNumber(current.averageCost),
  };

  if (state.currentStock < 0 || state.stockValue < 0 || state.averageCost < 0) {
    throw new Error("Saldo persediaan tidak boleh negatif.");
  }

  return state;
}

function nonNegative(value: MoneyInput, label: string): number {
  const parsed = toNumber(value);
  if (parsed < 0) throw new Error(`${label} tidak boleh negatif.`);
  return parsed;
}

/**
 * Mutasi masuk weighted-average perpetual (README §3.6.A).
 *
 * Nilai persediaan disimpan dalam rupiah, sedangkan harga rata-rata disimpan
 * sampai empat desimal. Fungsi ini murni dan tidak melakukan I/O.
 */
export function applyStockIn(
  current: StockStateInput,
  incomingQty: MoneyInput,
  unitCost: MoneyInput
): StockState {
  const state = readStockState(current);
  const quantity = nonNegative(incomingQty, "Kuantitas masuk");
  const cost = nonNegative(unitCost, "Harga perolehan");
  const currentStock = state.currentStock + quantity;
  const stockValue = roundRupiah(state.stockValue + quantity * cost);

  return {
    currentStock,
    stockValue,
    averageCost:
      currentStock === 0
        ? roundUnitCost(state.averageCost)
        : roundUnitCost(stockValue / currentStock),
  };
}

/**
 * Mutasi keluar weighted-average perpetual (README §3.6.B–C).
 *
 * Harga rata-rata tidak berubah. Saat stok habis, nilai persediaan dipaksa nol
 * tetapi harga rata-rata terakhir tetap dipertahankan sebagai referensi.
 */
export function applyStockOut(
  current: StockStateInput,
  outgoingQty: MoneyInput
): StockState {
  const state = readStockState(current);
  const quantity = nonNegative(outgoingQty, "Kuantitas keluar");

  if (quantity > state.currentStock) {
    throw new Error("Stok tidak cukup untuk mutasi keluar.");
  }

  const currentStock = state.currentStock - quantity;
  const remainingValue = roundRupiah(
    state.stockValue - quantity * state.averageCost
  );

  return {
    currentStock,
    stockValue: currentStock === 0 ? 0 : Math.max(0, remainingValue),
    averageCost: roundUnitCost(state.averageCost),
  };
}

/**
 * Penyesuaian tambah pada harga rata-rata berjalan (README §7.5).
 *
 * Berbeda dari pembelian, opname tidak boleh menghitung ulang average cost.
 * Nilai tambahan tetap memakai harga rata-rata yang sedang tersimpan.
 */
export function applyStockInAtAverageCost(
  current: StockStateInput,
  incomingQty: MoneyInput,
): StockState {
  const state = readStockState(current);
  const quantity = nonNegative(incomingQty, "Kuantitas penyesuaian masuk");

  return {
    currentStock: state.currentStock + quantity,
    stockValue: roundRupiah(
      state.stockValue + quantity * state.averageCost,
    ),
    averageCost: roundUnitCost(state.averageCost),
  };
}

/**
 * Mengembalikan stok dari transaksi yang dibatalkan pada nilai historisnya.
 *
 * Berbeda dari pembelian, reversal tidak menghitung ulang average cost. Nilai
 * yang ditambahkan harus berasal dari mutasi keluar transaksi asli, bukan dari
 * average cost yang mungkin sudah berubah setelah penjualan terjadi.
 */
export function applyHistoricalStockReturn(
  current: StockStateInput,
  returnedQty: MoneyInput,
  returnedValue: MoneyInput,
): StockState {
  const state = readStockState(current);
  const quantity = nonNegative(returnedQty, "Kuantitas pengembalian");
  const value = nonNegative(returnedValue, "Nilai pengembalian");

  return {
    currentStock: state.currentStock + quantity,
    stockValue: roundRupiah(state.stockValue + value),
    averageCost: roundUnitCost(state.averageCost),
  };
}

/**
 * Menentukan snapshot HPP produk sesuai jalur hybrid README §3.5–§3.6.C.
 *
 * Produk tanpa BOM memakai HPP dasar. Produk BOM memakai jumlah biaya resep
 * hanya bila seluruh bahan sudah memiliki average cost; selain itu HPP dasar
 * dipakai sebagai fallback yang dapat ditelusuri melalui `source`.
 */
export function calculateProductHpp(input: {
  baseHpp: MoneyInput;
  hasRecipe: boolean;
  recipeCosts: RecipeCostInput[];
}): { hpp: number; source: HppSource } {
  const baseHpp = nonNegative(input.baseHpp, "HPP dasar");

  if (!input.hasRecipe) {
    return { hpp: roundRupiah(baseHpp), source: "base" };
  }

  const recipeCosts = input.recipeCosts.map((recipe) => ({
    quantityNeeded: nonNegative(recipe.quantityNeeded, "Takaran resep"),
    averageCost: nonNegative(recipe.averageCost, "Harga rata-rata"),
  }));

  if (
    recipeCosts.length === 0 ||
    recipeCosts.some((recipe) => recipe.averageCost === 0)
  ) {
    return { hpp: roundRupiah(baseHpp), source: "fallback" };
  }

  return {
    hpp: roundRupiah(
      recipeCosts.reduce(
        (total, recipe) =>
          total + recipe.quantityNeeded * recipe.averageCost,
        0
      )
    ),
    source: "recipe",
  };
}
