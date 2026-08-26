import { Prisma } from "@/generated/prisma";

type DecimalInput = Prisma.Decimal | number | string;

export type TransactionTotalsInput = {
  subtotalAmount: DecimalInput;
  discountAmount: DecimalInput;
  taxRate: DecimalInput;
  totalHpp: DecimalInput;
};

export type TransactionTotals = {
  subtotalAmount: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  netAmount: Prisma.Decimal;
  taxRate: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  totalHpp: Prisma.Decimal;
  grossProfit: Prisma.Decimal;
};

const rupiah = (value: Prisma.Decimal) =>
  value.toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);

/**
 * Menghitung model DPP lengkap sesuai README §3.4.
 *
 * Seluruh operasi memakai Decimal; pembulatan rupiah baru dilakukan pada nilai
 * akhir yang disimpan. Pajak tidak pernah dimasukkan ke laba kotor.
 */
export function calculateTransactionTotals(
  input: TransactionTotalsInput,
): TransactionTotals {
  const subtotalAmount = rupiah(new Prisma.Decimal(input.subtotalAmount));
  const discountAmount = rupiah(new Prisma.Decimal(input.discountAmount));
  const taxRate = new Prisma.Decimal(input.taxRate);
  const totalHpp = rupiah(new Prisma.Decimal(input.totalHpp));

  if (subtotalAmount.isNegative()) {
    throw new RangeError("Subtotal tidak boleh negatif.");
  }
  if (discountAmount.isNegative() || discountAmount.greaterThan(subtotalAmount)) {
    throw new RangeError("Diskon tidak boleh negatif atau melebihi subtotal.");
  }
  if (taxRate.isNegative() || taxRate.greaterThan(1)) {
    throw new RangeError("Tarif pajak harus berada di antara 0 dan 1.");
  }
  if (totalHpp.isNegative()) {
    throw new RangeError("Total HPP tidak boleh negatif.");
  }

  const netAmount = subtotalAmount.minus(discountAmount);
  const taxAmount = rupiah(netAmount.mul(taxRate));
  const totalAmount = netAmount.plus(taxAmount);
  const grossProfit = netAmount.minus(totalHpp);

  return {
    subtotalAmount,
    discountAmount,
    netAmount,
    taxRate,
    taxAmount,
    totalAmount,
    totalHpp,
    grossProfit,
  };
}

/** Menghitung kembalian tunai dan menolak pembayaran yang kurang. */
export function calculateCashChange(
  totalAmount: DecimalInput,
  cashReceived: DecimalInput,
) {
  const total = rupiah(new Prisma.Decimal(totalAmount));
  const received = rupiah(new Prisma.Decimal(cashReceived));

  if (received.lessThan(total)) {
    throw new RangeError(`Uang diterima kurang ${total.minus(received)}.`);
  }

  return received.minus(total);
}
