"use client";

import { useState } from "react";
import type { PurchaseIngredientDTO } from "@/lib/dto";
import { createPurchase } from "../actions";
import { formatRupiah } from "@/lib/money";
import type { ActionResult } from "@/lib/action-result";
import { Feedback } from "@/components/Feedback";
import { Field } from "@/components/Field";
import { PendingButtonContent } from "@/components/PendingButtonContent";
import { Icon } from "@/components/Icon";
import { toWibDateString } from "@/lib/period";

type Item = { ingredientId: string; quantity: string; unitCost: string };

export default function PurchaseForm({ ingredients }: { ingredients: PurchaseIngredientDTO[] }) {
  const [items, setItems] = useState<Item[]>([{ ingredientId: "", quantity: "", unitCost: "" }]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);

  function addItem() {
    setItems([...items, { ingredientId: "", quantity: "", unitCost: "" }]);
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof Item, val: string) {
    setItems(items.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));
  }

  const total = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const cost = parseFloat(item.unitCost) || 0;
    return sum + qty * cost;
  }, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    try {
      const nextResult = await createPurchase(new FormData(form));
      setResult(nextResult);
      if (nextResult.ok) {
        form.reset();
        setItems([{ ingredientId: "", quantity: "", unitCost: "" }]);
      }
    } catch {
      setResult({
        ok: false,
        error: "Tidak dapat terhubung ke server. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="purchase-form" className="card">
      <h2 style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-lg)" }}>Catat Pembelian Baru</h2>
      <form onSubmit={handleSubmit} className="stack">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-sm)" }}>
          <Field label="Nama Supplier" name="supplierName" result={result} control={<input className="input" placeholder="Opsional" />} />
          <Field label="Tanggal Pembelian" name="purchaseDate" result={result} control={<input type="date" required className="input" defaultValue={toWibDateString()} />} />
        </div>

        <div className="divider" />

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-sm)" }}>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>Item Pembelian</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
              <Icon name="plus" /> Tambah Item
            </button>
          </div>

          <div className="stack-sm">
            {items.map((item, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "var(--space-xs)", alignItems: "flex-end" }}>
                <Field
                  label={i === 0 ? "Bahan Baku" : `Bahan Baku ${i + 1}`}
                  name="ingredientId"
                  errorName={`ingredientId.${i}`}
                  id={`purchase-ingredient-${i}`}
                  result={result}
                  control={
                    <select required value={item.ingredientId} onChange={(e) => updateItem(i, "ingredientId", e.target.value)} className="input">
                      <option value="">Pilih bahan...</option>
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                      ))}
                    </select>
                  }
                />
                <Field
                  label={i === 0 ? "Jumlah" : `Jumlah ${i + 1}`}
                  name="quantity"
                  errorName={`quantity.${i}`}
                  id={`purchase-quantity-${i}`}
                  result={result}
                  control={<input type="number" step="0.01" required className="input" placeholder="500" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} />}
                />
                <Field
                  label={i === 0 ? "Harga/Satuan" : `Harga/Satuan ${i + 1}`}
                  name="unitCost"
                  errorName={`unitCost.${i}`}
                  id={`purchase-unit-cost-${i}`}
                  result={result}
                  control={<input type="number" required className="input" placeholder="12000" value={item.unitCost} onChange={(e) => updateItem(i, "unitCost", e.target.value)} />}
                />
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)}
                  aria-label={`Hapus item pembelian ${i + 1}`}
                  disabled={items.length === 1}>
                  <Icon name="close" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="divider" />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p className="meta">Total Pembelian</p>
            <p style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--brand-400)" }}>
              {formatRupiah(total)}
            </p>
          </div>
          <button id="btn-submit-purchase" type="submit" className="btn btn-primary btn-lg" disabled={loading} aria-busy={loading}>
            <PendingButtonContent pending={loading} pendingLabel="Menyimpan pembelian...">
              Simpan Pembelian
            </PendingButtonContent>
          </button>
        </div>

        <Feedback
          result={result}
          successMessage="Pembelian berhasil disimpan. Stok sudah diperbarui."
        />
      </form>
    </div>
  );
}
