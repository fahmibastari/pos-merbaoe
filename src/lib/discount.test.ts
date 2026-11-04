import test from "node:test";
import assert from "node:assert/strict";
import { calculateDiscount } from "./discount";
import { createSaleRequestFingerprint } from "./sale-idempotency";
import { createHash } from "node:crypto";
import { salePayloadSchema } from "./validation";

test("diskon persen menerima 0/100, membulatkan half up dan menolak batas invalid", () => {
  assert.equal(calculateDiscount(101, "percentage", 50).toNumber(), 51);
  assert.equal(calculateDiscount(101, "percentage", 0).toNumber(), 0);
  assert.equal(calculateDiscount(101, "percentage", 100).toNumber(), 101);
  for (const value of [-1, 101, Infinity, NaN]) assert.throws(() => calculateDiscount(101, "percentage", value));
  assert.throws(() => calculateDiscount(101, "amount", 102));
});

test("fingerprint mempertahankan retry lama serta membedakan catatan dan jenis diskon", () => {
  const old = { paymentMethod: "qris" as const, discountAmount: 0, taxRate: 0, cashReceived: null, items: [{ productId: 1, quantity: 1 }] };
  assert.equal(createSaleRequestFingerprint(old), createHash("sha256").update(JSON.stringify(old)).digest("hex"));
  const noted = { ...old, items: [{ ...old.items[0], notes: "less ice" }, { ...old.items[0], notes: "less sugar" }] };
  assert.equal(createSaleRequestFingerprint(noted), createSaleRequestFingerprint({ ...noted, items: [...noted.items].reverse() }));
  assert.notEqual(createSaleRequestFingerprint(old), createSaleRequestFingerprint(noted));
  assert.notEqual(createSaleRequestFingerprint({ ...old, discountType: "percentage", discountValue: 10 }), createSaleRequestFingerprint({ ...old, discountType: "amount", discountValue: 10 }));
});

test("validasi checkout menolak catatan terlalu panjang dan persentase di atas 100", () => {
  const input = { idempotencyKey: "8d40c772-9e54-4cd0-82a4-2ca6b51ca339", paymentMethod: "qris", taxRate: 0, cashReceived: "", items: [{ productId: 1, quantity: 1, notes: "x".repeat(151) }] };
  assert.equal(salePayloadSchema.safeParse(input).success, false);
  assert.equal(salePayloadSchema.safeParse({ ...input, items: [{ productId: 1, quantity: 1 }], discountType: "percentage", discountValue: 101 }).success, false);
});
