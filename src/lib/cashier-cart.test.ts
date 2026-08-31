import assert from "node:assert/strict";
import test from "node:test";
import type { CashierProductDTO } from "./dto";
import {
  CASHIER_CART_TTL_MS,
  cashierCartStorageKey,
  restoreCashierCart,
  serializeCashierCart,
} from "./cashier-cart";

function product(
  id: number,
  options: { stock?: string; needed?: string } = {},
): CashierProductDTO {
  const hasRecipe = options.stock !== undefined && options.needed !== undefined;
  return {
    id,
    categoryId: 1,
    name: `Menu ${id}`,
    sellingPrice: "18000",
    hasRecipe,
    imageUrl: null,
    category: { name: "Kopi" },
    recipes: hasRecipe
      ? [
          {
            quantityNeeded: options.needed!,
            ingredient: {
              id: 10,
              name: "Kopi",
              unit: "gram",
              currentStock: options.stock!,
            },
          },
        ]
      : [],
  };
}

test("keranjang diserialkan minimal dan key dipisahkan per kasir/shift", () => {
  const raw = serializeCashierCart([{ product: product(7), quantity: 2 }], 1000);
  assert.deepEqual(JSON.parse(raw), {
    version: 1,
    savedAt: 1000,
    items: [{ productId: 7, quantity: 2 }],
  });
  assert.equal(cashierCartStorageKey(3, 9), "merbaoe:cashier-cart:v1:3:9");
});

test("restore memakai katalog terbaru dan membuang menu yang sudah hilang", () => {
  const raw = JSON.stringify({
    version: 1,
    savedAt: 1000,
    items: [
      { productId: 1, quantity: 2 },
      { productId: 99, quantity: 3 },
    ],
  });
  const restored = restoreCashierCart(raw, [product(1)], 2000);
  assert.equal(restored.status, "restored");
  assert.equal(restored.items[0]?.product.name, "Menu 1");
  assert.equal(restored.items[0]?.quantity, 2);
  assert.equal(restored.discardedQuantity, 3);
});

test("restore membatasi jumlah berdasarkan stok terbaru dan bahan bersama", () => {
  const raw = JSON.stringify({
    version: 1,
    savedAt: 1000,
    items: [
      { productId: 1, quantity: 4 },
      { productId: 2, quantity: 4 },
    ],
  });
  const restored = restoreCashierCart(
    raw,
    [product(1, { stock: "50", needed: "10" }), product(2, { stock: "50", needed: "10" })],
    2000,
  );
  assert.deepEqual(restored.items.map((item) => item.quantity), [4, 1]);
  assert.equal(restored.discardedQuantity, 3);
});

test("keranjang lebih dari delapan jam tidak dipulihkan", () => {
  const raw = serializeCashierCart([{ product: product(1), quantity: 1 }], 1000);
  const restored = restoreCashierCart(raw, [product(1)], 1000 + CASHIER_CART_TTL_MS + 1);
  assert.equal(restored.status, "expired");
  assert.deepEqual(restored.items, []);
});

test("payload rusak atau jumlah tidak wajar ditolak seluruhnya", () => {
  assert.equal(restoreCashierCart("bukan-json", [product(1)], 2000).status, "invalid");
  assert.equal(
    restoreCashierCart(
      JSON.stringify({ version: 1, savedAt: 1000, items: [{ productId: 1, quantity: 10000 }] }),
      [product(1)],
      2000,
    ).status,
    "invalid",
  );
});
