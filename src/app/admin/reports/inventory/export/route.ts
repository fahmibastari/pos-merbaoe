import { createCsv, csvResponse } from "@/lib/csv";
import { isAuthorizationError, requireAdmin } from "@/lib/guard";
import { businessRangeFromDates } from "@/lib/period";
import { getInventoryReport } from "@/lib/reporting";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const from = url.searchParams.get("from") ?? "";
    const to = url.searchParams.get("to") ?? "";
    const report = await getInventoryReport(businessRangeFromDates(from, to));
    const rec = report.reconciliation;
    const rows: Array<Array<string | number | boolean | null | undefined>> = [
      ["REKONSILIASI", "Persediaan awal", "", "", "", rec.openingValue],
      ["REKONSILIASI", "Opening/in", "", "", "", rec.openingIn],
      ["REKONSILIASI", "Purchase/in", "", "", "", rec.purchaseIn],
      ["REKONSILIASI", "Sale void/in", "", "", "", rec.saleVoidIn],
      ["REKONSILIASI", "Sale/out", "", "", "", -rec.saleOut],
      ["REKONSILIASI", "Waste/out", "", "", "", -rec.wasteOut],
      ["REKONSILIASI", "Adjustment/in", "", "", "", rec.adjustmentIn],
      ["REKONSILIASI", "Adjustment/out", "", "", "", -rec.adjustmentOut],
      ["REKONSILIASI", "Akhir menurut mutasi", "", "", "", rec.expectedEndingValue],
      ["REKONSILIASI", "Snapshot aktual", "", "", "", rec.actualEndingValue],
      ["REKONSILIASI", "Selisih", "", "", "", rec.difference],
      ...report.items.map((item) => [
        item.isActive ? "AKTIF" : "NONAKTIF",
        item.name,
        item.unit,
        item.openingQuantity,
        item.endingQuantity,
        item.endingValue,
      ]),
    ];
    const csv = createCsv(
      ["Status/Bagian", "Bahan/Komponen", "Satuan", "Stok Awal", "Stok Akhir", "Nilai (Rp)"],
      rows,
    );
    return csvResponse(`laporan-persediaan-${from}-${to}.csv`, csv);
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
