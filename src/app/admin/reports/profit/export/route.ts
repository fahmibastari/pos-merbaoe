import { isAuthorizationError, requireAdmin } from "@/lib/guard";
import { createCsv, csvResponse } from "@/lib/csv";
import { businessRangeFromDates } from "@/lib/period";
import { getProfitReport } from "@/lib/reporting";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const from = url.searchParams.get("from") ?? "";
    const to = url.searchParams.get("to") ?? "";
    const period = businessRangeFromDates(from, to);
    const report = await getProfitReport(period);
    const csv = createCsv(
      ["Komponen", "Nilai (Rp)", "Keterangan"],
      [
        ["Periode", "", `${from} s.d. ${to}`],
        ["Transaksi selesai", report.transactionCount, ""],
        ["Penjualan bersih (DPP)", report.netRevenue, "Setelah diskon, sebelum pajak"],
        ["Harga pokok penjualan", report.cogs, "HPP finansial transaksi selesai"],
        ["Laba kotor", report.grossProfit, "Penjualan bersih dikurangi HPP"],
        ["Beban operasional", report.operatingExpenses, "Tidak termasuk pembelian bahan"],
        ["Laba bersih", report.netProfit, "Laba kotor dikurangi OPEX"],
        ["Pajak PB1 dipungut", report.taxCollected, "Bukan pendapatan kafe"],
        ["Total dibayar pelanggan", report.customerPayments, "Termasuk pajak"],
        ["Belanja bahan", report.inventoryPurchases, "Arus persediaan, bukan beban"],
      ],
    );
    return csvResponse(`laporan-laba-${from}-${to}.csv`, csv);
  } catch (error) {
    if (isAuthorizationError(error)) {
      return new Response("Akses ditolak.", { status: 401 });
    }
    return new Response(
      error instanceof Error ? error.message : "Laporan tidak dapat diekspor.",
      { status: 400 },
    );
  }
}
