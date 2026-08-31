"use client";

import { useState } from "react";
import { adjustInventory } from "../../actions";
import type { ActionResult } from "@/lib/action-result";
import { formatQuantity, formatRupiah, formatUnitCost } from "@/lib/money";
import { Feedback } from "@/components/Feedback";
import { Field } from "@/components/Field";
import { PendingButtonContent } from "@/components/PendingButtonContent";

type IngredientOption = {
  id: number;
  name: string;
  unit: string;
  currentStock: number;
  stockValue: number;
  averageCost: number;
  isActive: boolean;
};

export default function InventoryAdjustmentForm({
  ingredients,
}: {
  ingredients: IngredientOption[];
}) {
  const [kind, setKind] = useState<"adjustment" | "waste">("adjustment");
  const [ingredientId, setIngredientId] = useState(
    ingredients[0]?.id ? String(ingredients[0].id) : "",
  );
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);
  const [pending, setPending] = useState(false);
  const selected = ingredients.find(
    (ingredient) => ingredient.id === Number(ingredientId),
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setResult(null);
    try {
      const nextResult = await adjustInventory(new FormData(form));
      setResult(nextResult);
      if (nextResult.ok) form.reset();
    } catch {
      setResult({
        ok: false,
        error: "Tidak dapat terhubung ke server. Silakan coba lagi.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.4fr) minmax(16rem, 0.6fr)",
        gap: "var(--space-lg)",
        alignItems: "start",
      }}
    >
      <form
        className="card stack"
        onSubmit={handleSubmit}
      >
        <Field
          label="Jenis Mutasi"
          name="kind"
          result={result}
          hint={
            kind === "adjustment"
              ? "Masukkan stok fisik hasil hitung; sistem menentukan selisih masuk atau keluar."
              : "Waste selalu mengurangi stok dan membuat beban lain-lain otomatis."
          }
          control={
            <select
              className="input"
              value={kind}
              onChange={(event) => {
                setKind(event.target.value as "adjustment" | "waste");
                setResult(null);
              }}
            >
              <option value="adjustment">Opname / Penyesuaian</option>
              <option value="waste">Waste / Kerusakan</option>
            </select>
          }
        />

        <Field
          label="Bahan Baku"
          name="ingredientId"
          result={result}
          control={
            <select
              required
              className="input"
              value={ingredientId}
              onChange={(event) => setIngredientId(event.target.value)}
            >
              {ingredients.length === 0 && <option value="">Belum ada bahan</option>}
              {ingredients.map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name} · {formatQuantity(ingredient.currentStock)} {ingredient.unit}
                  {!ingredient.isActive ? " · nonaktif" : ""}
                </option>
              ))}
            </select>
          }
        />

        {kind === "adjustment" ? (
          <Field
            label={`Stok Fisik${selected ? ` (${selected.unit})` : ""}`}
            name="physicalStock"
            result={result}
            hint="Nilai boleh nol dan maksimal tiga angka desimal."
            control={
              <input
                type="number"
                min="0"
                step="0.001"
                required
                className="input"
                placeholder={selected ? String(selected.currentStock) : "0"}
              />
            }
          />
        ) : (
          <Field
            label={`Jumlah Waste${selected ? ` (${selected.unit})` : ""}`}
            name="quantity"
            result={result}
            hint="Tidak boleh melebihi stok sistem yang tersedia."
            control={
              <input
                type="number"
                min="0.001"
                step="0.001"
                required
                className="input"
                placeholder="1"
              />
            }
          />
        )}

        <Field
          label="Keterangan"
          name="notes"
          result={result}
          hint="Wajib diisi agar setiap selisih dapat ditelusuri."
          control={
            <textarea
              required
              maxLength={255}
              rows={4}
              className="input"
              placeholder={
                kind === "adjustment"
                  ? "Contoh: hasil opname akhir bulan"
                  : "Contoh: susu kedaluwarsa"
              }
            />
          }
        />

        <button
          type="submit"
          className="btn btn-primary"
          disabled={pending || ingredients.length === 0}
          aria-busy={pending}
        >
          <PendingButtonContent pending={pending} pendingLabel="Menyimpan mutasi stok...">
            {kind === "adjustment" ? "Simpan Opname" : "Catat Waste"}
          </PendingButtonContent>
        </button>
        <Feedback result={result} />
      </form>

      <aside className="card" style={{ display: "grid", gap: "var(--space-md)" }}>
        <div>
          <span className="stat-label">Saldo Sistem</span>
          <span className="stat-value" style={{ display: "block", marginTop: "var(--space-2xs)" }}>
            {selected ? `${formatQuantity(selected.currentStock)} ${selected.unit}` : "—"}
          </span>
        </div>
        <div>
          <span className="stat-label">Harga Rata-rata</span>
          <strong className="num" style={{ display: "block", marginTop: "var(--space-2xs)" }}>
            {selected ? `${formatUnitCost(selected.averageCost)} / ${selected.unit}` : "—"}
          </strong>
        </div>
        <div>
          <span className="stat-label">Nilai Persediaan</span>
          <strong className="num" style={{ display: "block", marginTop: "var(--space-2xs)" }}>
            {selected ? formatRupiah(selected.stockValue) : "—"}
          </strong>
        </div>
        <p className="meta" style={{ lineHeight: "var(--leading-body)" }}>
          Harga rata-rata tidak berubah pada opname maupun waste. Semua perubahan
          dicatat sebagai baris baru pada kartu stok.
        </p>
      </aside>
    </div>
  );
}
