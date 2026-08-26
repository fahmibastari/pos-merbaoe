import { Prisma } from "@/generated/prisma";
import { ActionError } from "@/lib/action-result";
import { roundRupiah, type MoneyInput } from "@/lib/money";
import { prisma } from "@/lib/prisma";

type LockedShift = {
  id: number;
  cashierId: number;
  openingCash: Prisma.Decimal;
  status: "open" | "closed";
};

export type ShiftCashSummary = {
  openingCash: number;
  cashSales: number;
  cashDrawerExpenses: number;
  expectedCash: number;
};

export type ClosedShiftResult = ShiftCashSummary & {
  shiftId: number;
  actualCash: number;
  difference: number;
  closedAt: Date;
};

export function calculateShiftCash(input: {
  openingCash: MoneyInput;
  cashSales: MoneyInput;
  cashDrawerExpenses: MoneyInput;
}): ShiftCashSummary {
  const openingCash = roundRupiah(input.openingCash);
  const cashSales = roundRupiah(input.cashSales);
  const cashDrawerExpenses = roundRupiah(input.cashDrawerExpenses);
  const expectedCash = roundRupiah(
    openingCash + cashSales - cashDrawerExpenses,
  );

  if (
    openingCash < 0 ||
    cashSales < 0 ||
    cashDrawerExpenses < 0 ||
    expectedCash < 0
  ) {
    throw new ActionError("Perhitungan kas shift menghasilkan nilai tidak sah.");
  }

  return { openingCash, cashSales, cashDrawerExpenses, expectedCash };
}

export async function openCashierShift(
  cashierId: number,
  openingCashInput: MoneyInput,
) {
  const openingCash = roundRupiah(openingCashInput);

  try {
    return await prisma.$transaction(async (tx) => {
      const shift = await tx.cashierShift.create({
        data: { cashierId, openingCash },
      });
      await tx.auditLog.create({
        data: {
          userId: cashierId,
          action: "create",
          entity: "cashier_shift",
          entityId: shift.id,
          afterData: {
            status: "open",
            openingCash,
            openedAt: shift.openedAt.toISOString(),
          },
        },
      });
      return shift;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ActionError("Anda masih memiliki shift yang terbuka.");
    }
    throw error;
  }
}

export async function closeCashierShift(
  cashierId: number,
  actualCashInput: MoneyInput,
  notes: string | null,
): Promise<ClosedShiftResult> {
  const actualCash = roundRupiah(actualCashInput);

  return prisma.$transaction(async (tx) => {
    const [shift] = await tx.$queryRaw<LockedShift[]>(Prisma.sql`
      SELECT
        id,
        cashier_id AS "cashierId",
        opening_cash AS "openingCash",
        status
      FROM cashier_shifts
      WHERE cashier_id = ${cashierId}
        AND status = 'open'
      FOR UPDATE
    `);
    if (!shift) throw new ActionError("Tidak ada shift terbuka untuk ditutup.");

    const [sales, expenses] = await Promise.all([
      tx.sale.aggregate({
        where: {
          shiftId: shift.id,
          paymentMethod: "cash",
          status: "completed",
        },
        _sum: { totalAmount: true },
      }),
      tx.operationalExpense.aggregate({
        where: { cashierShiftId: shift.id },
        _sum: { amount: true },
      }),
    ]);
    const summary = calculateShiftCash({
      openingCash: shift.openingCash,
      cashSales: sales._sum.totalAmount ?? 0,
      cashDrawerExpenses: expenses._sum.amount ?? 0,
    });
    const difference = roundRupiah(actualCash - summary.expectedCash);
    if (difference !== 0 && !notes) {
      throw new ActionError(
        "Keterangan wajib diisi karena kas fisik tidak sama dengan kas seharusnya.",
      );
    }

    const closedAt = new Date();
    await tx.cashierShift.update({
      where: { id: shift.id },
      data: {
        expectedCash: summary.expectedCash,
        actualCash,
        difference,
        notes,
        status: "closed",
        closedAt,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: cashierId,
        action: "update",
        entity: "cashier_shift",
        entityId: shift.id,
        beforeData: { status: "open", openingCash: summary.openingCash },
        afterData: {
          status: "closed",
          ...summary,
          actualCash,
          difference,
          notes,
          closedAt: closedAt.toISOString(),
        },
      },
    });

    return {
      shiftId: shift.id,
      ...summary,
      actualCash,
      difference,
      closedAt,
    };
  });
}
