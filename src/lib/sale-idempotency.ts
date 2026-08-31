import { createHash } from "node:crypto";

export type FingerprintSalePayload = {
  paymentMethod: "cash" | "qris" | "transfer";
  discountAmount: number;
  taxRate: number;
  cashReceived: number | null;
  items: Array<{ productId: number; quantity: number }>;
};

/** Menghasilkan sidik payload stabil; kunci idempotensi tidak ikut di-hash. */
export function createSaleRequestFingerprint(
  payload: FingerprintSalePayload,
): string {
  const canonicalPayload = {
    paymentMethod: payload.paymentMethod,
    discountAmount: payload.discountAmount,
    taxRate: payload.taxRate,
    cashReceived: payload.cashReceived,
    items: [...payload.items].sort(
      (left, right) => left.productId - right.productId,
    ),
  };

  return createHash("sha256")
    .update(JSON.stringify(canonicalPayload), "utf8")
    .digest("hex");
}
