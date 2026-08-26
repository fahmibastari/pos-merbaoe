import assert from "node:assert/strict";
import test from "node:test";
import { createSaleRequestFingerprint } from "./sale-idempotency";

const payload = {
  paymentMethod: "cash" as const,
  discountAmount: 1000,
  taxRate: 0.1,
  cashReceived: 50000,
  items: [
    { productId: 2, quantity: 1 },
    { productId: 1, quantity: 2 },
  ],
};

test("fingerprint checkout stabil untuk urutan item berbeda", () => {
  const first = createSaleRequestFingerprint(payload);
  const reordered = createSaleRequestFingerprint({
    ...payload,
    items: [...payload.items].reverse(),
  });

  assert.equal(first, reordered);
  assert.match(first, /^[0-9a-f]{64}$/);
});

test("fingerprint checkout berubah bila payload berubah", () => {
  const original = createSaleRequestFingerprint(payload);
  const changed = createSaleRequestFingerprint({
    ...payload,
    items: [{ productId: 1, quantity: 3 }],
  });

  assert.notEqual(original, changed);
});
