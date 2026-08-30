"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";
import { calculateProductHpp } from "@/lib/costing";
import { formatRupiah, roundRupiah } from "@/lib/money";
import { EmptyState } from "@/components/EmptyState";
import { Feedback } from "@/components/Feedback";
import { Field } from "@/components/Field";
import { PendingButtonContent } from "@/components/PendingButtonContent";
import { saveProductRecipe } from "../../../actions";

type IngredientOption = {
  id: number;
  name: string;
  unit: string;
  averageCost: number;
  isActive: boolean;
};

type ProductRecipe = {
  id: number;
  name: string;
  sellingPrice: number;
  baseHpp: number;
  hasRecipe: boolean;
  recipes: Array<{
    id: number;
    ingredientId: number;
    quantityNeeded: number;
  }>;
};

type DraftRow = {
  key: string;
  ingredientId: string;
  quantityNeeded: string;
};

export default function RecipeBuilder({
  product,
  ingredients,
}: {
  product: ProductRecipe;
  ingredients: IngredientOption[];
}) {
  const router = useRouter();
  const nextKey = useRef(0);
  const [rows, setRows] = useState<DraftRow[]>(() =>
    product.recipes.map((recipe) => ({
      key: `recipe-${recipe.id}`,
      ingredientId: String(recipe.ingredientId),
      quantityNeeded: String(recipe.quantityNeeded),
    })),
  );
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);
  const [pending, setPending] = useState(false);

  const selectedIds = rows
    .map((row) => Number(row.ingredientId))
    .filter((id) => Number.isInteger(id) && id > 0);
  const hasDuplicate = new Set(selectedIds).size !== selectedIds.length;
  const recipeCosts = rows.map((row) => {
    const ingredient = ingredients.find(
      (item) => item.id === Number(row.ingredientId),
    );
    return {
      quantityNeeded: Number(row.quantityNeeded) || 0,
      averageCost: ingredient?.averageCost ?? 0,
    };
  });
  const preview = calculateProductHpp({
    baseHpp: product.baseHpp,
    hasRecipe: rows.length > 0,
    recipeCosts,
  });

  function addRow() {
    const firstAvailable = ingredients.find(
      (ingredient) =>
        ingredient.isActive && !selectedIds.includes(ingredient.id),
    );
    setRows((current) => [
      ...current,
      {
        key: `new-${++nextKey.current}`,
        ingredientId: firstAvailable ? String(firstAvailable.id) : "",
        quantityNeeded: "",
      },
    ]);
    setResult(null);
  }

  function updateRow(key: string, patch: Partial<DraftRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
    setResult(null);
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key));
    setResult(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hasDuplicate) {
      setResult({
        ok: false,
        error: "Satu bahan baku tidak boleh dimasukkan dua kali dalam resep.",
        fieldErrors: {
          ingredientId: ["Pilih bahan baku yang berbeda untuk setiap baris."],
        },
      });
      return;
    }

    setPending(true);
    const formData = new FormData();
    formData.append("productId", String(product.id));
    for (const row of rows) {
      formData.append("ingredientId", row.ingredientId);
      formData.append("quantityNeeded", row.quantityNeeded);
    }

    try {
      const nextResult = await saveProductRecipe(formData);
      setResult(nextResult);
      if (nextResult.ok) router.refresh();
    } catch {
      setResult({
        ok: false,
        error: "Tidak dapat terhubung ke server. Silakan coba lagi.",
      });
    } finally {
      setPending(false);
    }
  }

  const canAdd = ingredients.some(
    (ingredient) => ingredient.isActive && !selectedIds.includes(ingredient.id),
  );
  const sourceLabel =
    preview.source === "recipe"
      ? "Dihitung dari harga rata-rata bahan saat ini"
      : preview.source === "fallback"
        ? "Memakai HPP manual karena ada bahan yang belum memiliki harga rata-rata"
        : "Memakai HPP manual karena resep kosong";

  return (
    <form
      onSubmit={handleSubmit}
      className="stack"
    >
      <section className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "var(--space-md)",
            marginBottom: "var(--space-md)",
          }}
        >
          <div>
            <h2 style={{ fontSize: "var(--text-md)" }}>Komposisi per porsi</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "var(--space-2xs)" }}>
              Takaran mengikuti satuan masing-masing bahan baku.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={pending || !canAdd}
            onClick={addRow}
          >
            + Tambah Bahan
          </button>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="Resep masih kosong"
            description="Menu akan memakai HPP manual sampai bahan resep ditambahkan."
            action={
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!canAdd}
                onClick={addRow}
              >
                Tambah Bahan Pertama
              </button>
            }
          />
        ) : (
          <div className="stack-sm">
            {rows.map((row, index) => {
              const ingredient = ingredients.find(
                (item) => item.id === Number(row.ingredientId),
              );
              const rowCost = roundRupiah(
                (Number(row.quantityNeeded) || 0) *
                  (ingredient?.averageCost ?? 0),
              );
              return (
                <div
                  key={row.key}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(12rem, 2fr) minmax(9rem, 1fr) minmax(9rem, 1fr) auto",
                    gap: "var(--space-sm)",
                    alignItems: "end",
                    padding: "var(--space-md)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-container)",
                  }}
                >
                  <Field
                    label={`Bahan ${index + 1}`}
                    name="ingredientId"
                    errorName={`ingredientId.${index}`}
                    id={`ingredient-${row.key}`}
                    result={result}
                    control={
                      <select
                        className="input"
                        required
                        value={row.ingredientId}
                        aria-invalid={hasDuplicate || undefined}
                        aria-describedby={hasDuplicate ? "recipe-duplicate-error" : undefined}
                        onChange={(event) =>
                          updateRow(row.key, { ingredientId: event.target.value })
                        }
                      >
                        <option value="">Pilih bahan baku</option>
                        {ingredients.map((option) => (
                          <option
                            key={option.id}
                            value={option.id}
                            disabled={
                              (option.id !== Number(row.ingredientId) &&
                                selectedIds.includes(option.id)) ||
                              (!option.isActive &&
                                option.id !== Number(row.ingredientId))
                            }
                          >
                            {option.name} ({option.unit})
                            {!option.isActive ? " — nonaktif" : ""}
                          </option>
                        ))}
                      </select>
                    }
                  />
                  <Field
                    label={`Takaran${ingredient ? ` (${ingredient.unit})` : ""}`}
                    name="quantityNeeded"
                    errorName={`quantityNeeded.${index}`}
                    id={`quantity-${row.key}`}
                    result={result}
                    control={
                      <input
                        className="input"
                        type="number"
                        min="0.001"
                        max="9999999"
                        step="0.001"
                        required
                        value={row.quantityNeeded}
                        onChange={(event) =>
                          updateRow(row.key, { quantityNeeded: event.target.value })
                        }
                      />
                    }
                  />
                  <div>
                    <span className="label">Biaya saat ini</span>
                    <div style={{ minHeight: "2.65rem", display: "flex", alignItems: "center", fontWeight: 700 }}>
                      {formatRupiah(rowCost)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    disabled={pending}
                    onClick={() => removeRow(row.key)}
                    aria-label={`Hapus bahan ${index + 1}`}
                  >
                    Hapus
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section
        className="card"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
          gap: "var(--space-md)",
        }}
      >
        <div>
          <span className="label">Harga Pokok Penjualan (HPP)</span>
          <strong style={{ display: "block", fontSize: "var(--text-xl)", color: "var(--brand-400)" }}>
            {formatRupiah(preview.hpp)}
          </strong>
          <p style={{ color: "var(--text-secondary)", marginTop: "var(--space-2xs)" }}>
            {sourceLabel}
          </p>
        </div>
        <div>
          <span className="label">Harga jual</span>
          <strong style={{ display: "block", fontSize: "var(--text-lg)" }}>
            {formatRupiah(product.sellingPrice)}
          </strong>
        </div>
        <div>
          <span className="label">Margin kotor per porsi</span>
          <strong style={{ display: "block", fontSize: "var(--text-lg)" }}>
            {formatRupiah(product.sellingPrice - preview.hpp)}
          </strong>
        </div>
      </section>

      {hasDuplicate && (
        <Feedback
          id="recipe-duplicate-error"
          tone="error"
          message="Satu bahan baku tidak boleh dimasukkan dua kali dalam resep."
        />
      )}
      <Feedback result={result} />

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={pending || hasDuplicate}
          aria-busy={pending}
        >
          <PendingButtonContent pending={pending} pendingLabel="Menyimpan resep...">
            Simpan Resep
          </PendingButtonContent>
        </button>
      </div>
    </form>
  );
}
