"use client";

import { useState } from "react";
import type { Ingredient } from "@/generated/prisma";
import { createPurchase } from "../actions";

type Item = { ingredientId: string; quantity: string; unitCost: string };

export default function PurchaseForm({ ingredients }: { ingredients: Ingredient[] }) {
  const [items, setItems] = useState<Item[]>([{ ingredientId: "", quantity: "", unitCost: "" }]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    setLoading(true);
    await createPurchase(new FormData(e.currentTarget));
    setLoading(false);
    setSuccess(true);
    setItems([{ ingredientId: "", quantity: "", unitCost: "" }]);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="card slide-up">
      <h2 style={{ fontSize: "0.95rem", marginBottom: "1.25rem" }}>Catat Pembelian Baru</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label className="label">Nama Supplier</label>
            <input name="supplierName" className="input" placeholder="Opsional" />
          </div>
          <div>
            <label className="label">Tanggal Pembelian</label>
            <input name="purchaseDate" type="date" required className="input"
              defaultValue={new Date().toISOString().split("T")[0]} />
          </div>
        </div>

        <div className="divider" />

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>Item Pembelian</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Tambah Item</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "0.5rem", alignItems: "flex-end" }}>
                <div>
                  {i === 0 && <label className="label">Bahan Baku</label>}
                  <select name="ingredientId" required value={item.ingredientId} onChange={(e) => updateItem(i, "ingredientId", e.target.value)} className="input">
                    <option value="">Pilih bahan...</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                    ))}
                  </select>
                </div>
                <div>
                  {i === 0 && <label className="label">Jumlah</label>}
                  <input name="quantity" type="number" step="0.01" required className="input" placeholder="500"
                    value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} />
                </div>
                <div>
                  {i === 0 && <label className="label">Harga/Satuan</label>}
                  <input name="unitCost" type="number" required className="input" placeholder="12000"
                    value={item.unitCost} onChange={(e) => updateItem(i, "unitCost", e.target.value)} />
                </div>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)}
                  style={{ marginBottom: i === 0 ? "0" : "0" }} disabled={items.length === 1}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="divider" />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Total Pembelian</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--brand-400)" }}>
              Rp {total.toLocaleString("id-ID")}
            </p>
          </div>
          <button id="btn-submit-purchase" type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Pembelian"}
          </button>
        </div>

        {success && (
          <div style={{ padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "var(--success)", fontSize: "0.85rem", fontWeight: 500 }}>
            ✓ Pembelian berhasil disimpan. Stok sudah diperbarui.
          </div>
        )}
      </form>
    </div>
  );
}
