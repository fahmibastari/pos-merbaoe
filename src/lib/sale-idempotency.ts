import { createHash } from "node:crypto";

export type FingerprintSalePayload = {
  paymentMethod: "cash" | "qris" | "transfer";
  discountAmount: number;
  discountType?: "amount" | "percentage";
  discountValue?: number;
  taxRate: number;
  cashReceived: number | null;
  items: Array<{ productId: number; quantity: number; notes?: string | null }>;
};

/** Menghasilkan sidik payload stabil; kunci idempotensi tidak ikut di-hash. */
export function createSaleRequestFingerprint(
  payload: FingerprintSalePayload,
): string {
  const type = payload.discountType ?? "amount";
  const value = payload.discountValue ?? payload.discountAmount;
  const hasNotes = payload.items.some((item) => Boolean(item.notes?.trim()));
  const canonicalPayload = {
    paymentMethod: payload.paymentMethod,
    discountAmount: type === "amount" ? value : 0,
    taxRate: payload.taxRate,
    cashReceived: payload.cashReceived,
    items: payload.items.map((item) => ({ productId: item.productId, quantity: item.quantity, ...(hasNotes ? { notes: item.notes?.trim() || null } : {}) })).sort(
      (left, right) => left.productId - right.productId || (left.notes ?? "").localeCompare(right.notes ?? "") || left.quantity - right.quantity,
    ),
    ...(type === "percentage" ? { discountType: type, discountValue: value } : {}),
  };

  return createHash("sha256")
    .update(JSON.stringify(canonicalPayload), "utf8")
    .digest("hex");
}
