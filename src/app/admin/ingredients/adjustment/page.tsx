import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { prisma } from "@/lib/prisma";
import InventoryAdjustmentForm from "./InventoryAdjustmentForm";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = { title: "Opname & Waste" };

export default async function InventoryAdjustmentPage() {
  const ingredients = await prisma.ingredient.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      unit: true,
      currentStock: true,
      stockValue: true,
      averageCost: true,
      isActive: true,
    },
  });

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "var(--space-md)",
        }}
      >
        <div>
          <h1>Opname & Waste</h1>
          <p>Catat selisih stok fisik atau bahan rusak tanpa mengubah riwayat lama</p>
        </div>
        <Link href="/admin/ingredients" className="btn btn-secondary">
          <Icon name="arrow-left" /> Kembali ke Bahan
        </Link>
      </div>

      {ingredients.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Belum ada bahan baku"
            description="Tambahkan bahan baku terlebih dahulu sebelum mencatat opname atau waste."
            action={
              <Link href="/admin/ingredients" className="btn btn-primary btn-sm">
                Tambah Bahan Baku
              </Link>
            }
          />
        </div>
      ) : (
        <InventoryAdjustmentForm
          ingredients={ingredients.map((ingredient) => ({
            ...ingredient,
            currentStock: Number(ingredient.currentStock),
            stockValue: Number(ingredient.stockValue),
            averageCost: Number(ingredient.averageCost),
          }))}
        />
      )}
    </div>
  );
}
