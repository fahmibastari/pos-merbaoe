import { Prisma } from "@/generated/prisma/browser";

export function calculateDiscount(subtotal: { toString(): string } | number | string, type: "amount" | "percentage", value: number) {
  if (!Number.isFinite(value) || value < 0 || (type === "percentage" && value > 100)) throw new RangeError("Nilai diskon tidak sah.");
  const base = new Prisma.Decimal(typeof subtotal === "object" ? subtotal.toString() : subtotal);
  if (new Prisma.Decimal(value).decimalPlaces() > 4) throw new RangeError("Diskon maksimal 4 angka desimal.");
  if (type === "amount" && new Prisma.Decimal(value).greaterThan(base)) throw new RangeError("Diskon tidak boleh melebihi subtotal.");
  const amount = (type === "percentage" ? base.mul(value).div(100) : new Prisma.Decimal(value)).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
  if (amount.greaterThan(base)) throw new RangeError("Diskon tidak boleh melebihi subtotal.");
  return amount;
}
