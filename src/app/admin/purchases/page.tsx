import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PurchaseForm from "./PurchaseForm";
import { formatRupiah } from "@/lib/money";

export const metadata: Metadata = { title: "Pembelian Stok" };

export default async function PurchasesPage() {
  const [ingredients, purchases] = await Promise.all([
    prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
    prisma.purchase.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        user: { select: { name: true } },
        details: { include: { ingredient: { select: { name: true, unit: true } } } },
      },
    }),
  ]);

  const serializedIngredients = JSON.parse(JSON.stringify(ingredients));

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Pembelian Stok</h1>
        <p>Catat pembelian bahan baku dari supplier — stok otomatis bertambah</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "1.5rem", alignItems: "start" }}>
        <PurchaseForm ingredients={serializedIngredients} />

        {/* History */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
            <h2 style={{ fontSize: "0.95rem" }}>Riwayat Pembelian</h2>
          </div>
          <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Supplier</th>
                  <th>Total</th>
                  <th>Oleh</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Belum ada pembelian</td></tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--text-secondary)" }}>{p.invoiceNumber}</td>
                      <td>{p.supplierName || "-"}</td>
                      <td style={{ fontWeight: 700, color: "var(--brand-400)" }}>
                        {formatRupiah(p.totalAmount)}
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{p.user.name}</td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        {new Date(p.purchaseDate).toLocaleDateString("id-ID")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
