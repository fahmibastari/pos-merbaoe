import { Prisma } from "@/generated/prisma";
import { roundRupiah } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { summarizeProfit } from "@/lib/profit";
import { WIB_OFFSET_MS, type PeriodRange } from "@/lib/period";

export type ProfitReport = ReturnType<typeof summarizeProfit> & {
  transactionCount: number;
  taxCollected: number;
  customerPayments: number;
  inventoryPurchases: number;
  paymentBreakdown: Array<{ paymentMethod: string; count: number; total: number }>;
  expenseBreakdown: Array<{ category: string; total: number }>;
};

export async function getProfitReport(period: PeriodRange): Promise<ProfitReport> {
  // Kolom DATE tidak menyimpan zona waktu. Batas timestamp WIB (17:00 UTC pada
  // hari sebelumnya) harus digeser kembali menjadi tengah malam UTC pada tanggal
  // kalender yang sama sebelum dipakai memfilter purchase/expense DATE.
  const dateColumnPeriod = {
    gte: new Date(period.gte.getTime() + WIB_OFFSET_MS),
    lt: new Date(period.lt.getTime() + WIB_OFFSET_MS),
  };
  const [sales, expenses, purchases, payments, expenseCategories] =
    await Promise.all([
      prisma.sale.aggregate({
        where: { transactionDate: period, status: "completed" },
        _sum: {
          netAmount: true,
          totalHpp: true,
          taxAmount: true,
          totalAmount: true,
        },
        _count: { id: true },
      }),
      prisma.operationalExpense.aggregate({
        where: { expenseDate: dateColumnPeriod },
        _sum: { amount: true },
      }),
      prisma.purchase.aggregate({
        where: { purchaseDate: dateColumnPeriod },
        _sum: { totalAmount: true },
      }),
      prisma.sale.groupBy({
        by: ["paymentMethod"],
        where: { transactionDate: period, status: "completed" },
        _sum: { totalAmount: true },
        _count: { id: true },
        orderBy: { paymentMethod: "asc" },
      }),
      prisma.operationalExpense.groupBy({
        by: ["category"],
        where: { expenseDate: dateColumnPeriod },
        _sum: { amount: true },
        orderBy: { category: "asc" },
      }),
    ]);

  const summary = summarizeProfit({
    netRevenue: sales._sum.netAmount ?? 0,
    cogs: sales._sum.totalHpp ?? 0,
    operatingExpenses: expenses._sum.amount ?? 0,
  });

  return {
    ...summary,
    transactionCount: sales._count.id,
    taxCollected: roundRupiah(sales._sum.taxAmount ?? 0),
    customerPayments: roundRupiah(sales._sum.totalAmount ?? 0),
    inventoryPurchases: roundRupiah(purchases._sum.totalAmount ?? 0),
    paymentBreakdown: payments.map((row) => ({
      paymentMethod: row.paymentMethod,
      count: row._count.id,
      total: roundRupiah(row._sum.totalAmount ?? 0),
    })),
    expenseBreakdown: expenseCategories.map((row) => ({
      category: row.category,
      total: roundRupiah(row._sum.amount ?? 0),
    })),
  };
}

type InventorySnapshotRow = {
  id: number;
  name: string;
  unit: string;
  isActive: boolean;
  openingQuantity: Prisma.Decimal | null;
  openingValue: Prisma.Decimal | null;
  endingQuantity: Prisma.Decimal | null;
  endingValue: Prisma.Decimal | null;
};

type InventoryMovementRow = {
  source: string;
  type: "in" | "out";
  total: Prisma.Decimal;
};

export type InventoryReportItem = {
  id: number;
  name: string;
  unit: string;
  isActive: boolean;
  openingQuantity: number;
  openingAverageCost: number;
  openingValue: number;
  endingQuantity: number;
  endingAverageCost: number;
  endingValue: number;
};

export type InventoryReconciliation = {
  openingValue: number;
  openingIn: number;
  purchaseIn: number;
  saleVoidIn: number;
  saleOut: number;
  wasteOut: number;
  adjustmentIn: number;
  adjustmentOut: number;
  expectedEndingValue: number;
  actualEndingValue: number;
  difference: number;
  balanced: boolean;
};

export type InventoryReport = {
  items: InventoryReportItem[];
  reconciliation: InventoryReconciliation;
};

function historicAverageCost(quantity: number, value: number): number {
  if (quantity <= 0 || value === 0) return 0;
  return Math.round((value / quantity) * 10_000) / 10_000;
}

export async function getInventoryReport(
  period: PeriodRange,
): Promise<InventoryReport> {
  const [snapshots, movements] = await Promise.all([
    prisma.$queryRaw<InventorySnapshotRow[]>(Prisma.sql`
      SELECT
        i.id,
        i.name,
        i.unit,
        i.is_active AS "isActive",
        opening.balance_after AS "openingQuantity",
        opening.value_after AS "openingValue",
        ending.balance_after AS "endingQuantity",
        ending.value_after AS "endingValue"
      FROM ingredients i
      LEFT JOIN LATERAL (
        SELECT st.balance_after, st.value_after
        FROM stock_transactions st
        WHERE st.ingredient_id = i.id
          AND st.transaction_date < ${period.gte}
        ORDER BY st.transaction_date DESC, st.id DESC
        LIMIT 1
      ) opening ON TRUE
      LEFT JOIN LATERAL (
        SELECT st.balance_after, st.value_after
        FROM stock_transactions st
        WHERE st.ingredient_id = i.id
          AND st.transaction_date < ${period.lt}
        ORDER BY st.transaction_date DESC, st.id DESC
        LIMIT 1
      ) ending ON TRUE
      ORDER BY i.is_active DESC, i.name ASC, i.id ASC
    `),
    prisma.$queryRaw<InventoryMovementRow[]>(Prisma.sql`
      SELECT
        source::text AS source,
        type::text AS type,
        COALESCE(SUM(total_cost), 0) AS total
      FROM stock_transactions
      WHERE transaction_date >= ${period.gte}
        AND transaction_date < ${period.lt}
      GROUP BY source, type
      ORDER BY source, type
    `),
  ]);

  const items = snapshots.map((row) => {
    const openingQuantity = Number(row.openingQuantity ?? 0);
    const openingValue = roundRupiah(row.openingValue ?? 0);
    const endingQuantity = Number(row.endingQuantity ?? 0);
    const endingValue = roundRupiah(row.endingValue ?? 0);
    return {
      id: row.id,
      name: row.name,
      unit: row.unit,
      isActive: row.isActive,
      openingQuantity,
      openingAverageCost: historicAverageCost(openingQuantity, openingValue),
      openingValue,
      endingQuantity,
      endingAverageCost: historicAverageCost(endingQuantity, endingValue),
      endingValue,
    };
  });

  const movementValue = (source: string, type: "in" | "out") =>
    roundRupiah(
      movements.find((row) => row.source === source && row.type === type)
        ?.total ?? 0,
    );
  const openingValue = roundRupiah(
    items.reduce((total, item) => total + item.openingValue, 0),
  );
  const actualEndingValue = roundRupiah(
    items.reduce((total, item) => total + item.endingValue, 0),
  );
  const openingIn = movementValue("opening", "in");
  const purchaseIn = movementValue("purchase", "in");
  const saleVoidIn = movementValue("sale_void", "in");
  const saleOut = movementValue("sale", "out");
  const wasteOut = movementValue("waste", "out");
  const adjustmentIn = movementValue("adjustment", "in");
  const adjustmentOut = movementValue("adjustment", "out");
  const expectedEndingValue = roundRupiah(
    openingValue +
      openingIn +
      purchaseIn +
      saleVoidIn -
      saleOut -
      wasteOut +
      adjustmentIn -
      adjustmentOut,
  );
  const difference = roundRupiah(actualEndingValue - expectedEndingValue);

  return {
    items,
    reconciliation: {
      openingValue,
      openingIn,
      purchaseIn,
      saleVoidIn,
      saleOut,
      wasteOut,
      adjustmentIn,
      adjustmentOut,
      expectedEndingValue,
      actualEndingValue,
      difference,
      balanced: difference === 0,
    },
  };
}
