import type { Metadata } from "next";
import { getActiveSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { calculateShiftCash } from "@/lib/shift-service";
import ShiftPanel from "./ShiftPanel";

export const metadata: Metadata = { title: "Shift Kasir" };

export default async function CashierShiftPage() {
  const session = await getActiveSession();
  const openShift = session
    ? await prisma.cashierShift.findFirst({
        where: { cashierId: session.userId, status: "open" },
        orderBy: { openedAt: "desc" },
      })
    : null;

  let shiftSummary = null;
  if (openShift) {
    const [cashSales, drawerExpenses, transactionCount] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          shiftId: openShift.id,
          paymentMethod: "cash",
          status: "completed",
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.operationalExpense.aggregate({
        where: { cashierShiftId: openShift.id },
        _sum: { amount: true },
      }),
      prisma.sale.count({
        where: { shiftId: openShift.id, status: "completed" },
      }),
    ]);
    shiftSummary = {
      id: openShift.id,
      openedAt: openShift.openedAt.toISOString(),
      transactionCount,
      cashTransactionCount: cashSales._count.id,
      ...calculateShiftCash({
        openingCash: openShift.openingCash,
        cashSales: cashSales._sum.totalAmount ?? 0,
        cashDrawerExpenses: drawerExpenses._sum.amount ?? 0,
      }),
    };
  }

  return (
    <ShiftPanel
      username={session?.username ?? "Kasir"}
      role={session?.role ?? "kasir"}
      shift={shiftSummary}
    />
  );
}
