"use client";

import { useState } from "react";
import Link from "next/link";
import { createIngredient, updateIngredient, toggleIngredientActive } from "../actions";
import { formatQuantity, formatRupiah, formatUnitCost, toNumber } from "@/lib/money";
import type { IngredientRowDTO } from "@/lib/dto";
import type { ActionResult } from "@/lib/action-result";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Feedback } from "@/components/Feedback";
import { Field } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { PendingButtonContent } from "@/components/PendingButtonContent";

type Props = { ingredients: IngredientRowDTO[]; rowOffset?: number };

export default function IngredientTable({ ingredients, rowOffset = 0 }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<IngredientRowDTO | null>(null);
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    try {
      const nextResult = await createIngredient(new FormData(form));
      setResult(nextResult);
      if (nextResult.ok) {
        setShowForm(false);
        form.reset();
      }
    } catch {
      setResult({ ok: false, error: "Tidak dapat terhubung ke server. Silakan coba lagi." });
    } finally {
      setPending(false);
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const nextResult = await updateIngredient(new FormData(e.currentTarget));
      setResult(nextResult);
      if (nextResult.ok) setEditing(null);
    } catch {
      setResult({ ok: false, error: "Tidak dapat terhubung ke server. Silakan coba lagi." });
    } finally {
      setPending(false);
    }
  }

  async function handleToggle(id: number, isActive: boolean) {
    const fd = new FormData();
    fd.append("id", String(id));
    fd.append("isActive", String(isActive));
    setPending(true);
    try {
      setResult(await toggleIngredientActive(fd));
    } catch {
      setResult({ ok: false, error: "Tidak dapat terhubung ke server. Silakan coba lagi." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="stack">
      {/* Add button */}
      <div className="cluster" style={{ justifyContent: "flex-end" }}>
        <Link href="/admin/ingredients/adjustment" className="btn btn-secondary">
          Opname & Waste
        </Link>
        <button id="btn-add-ingredient" className="btn btn-primary" disabled={pending} onClick={() => { setResult(null); setShowForm(!showForm); }}>
          {showForm ? "Batal" : "+ Tambah Bahan"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card">
          <h3 style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-md)" }}>Tambah Bahan Baku Baru</h3>
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "var(--space-sm)", alignItems: "flex-end" }}>
            <Field label="Nama Bahan" name="name" result={result} control={<input required className="input" placeholder="Kopi Arabica" />} />
            <Field label="Satuan" name="unit" result={result} control={<input required className="input" placeholder="gram / ml / pcs" />} />
            <Field label="Stok Minimum" name="minimumStock" result={result} control={<input type="number" step="0.01" className="input" placeholder="500" />} />
            <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
              <PendingButtonContent pending={pending} pendingLabel="Menyimpan bahan...">Simpan</PendingButtonContent>
            </button>
          </form>
          <Feedback result={result} />
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={editing !== null} title="Edit Bahan Baku" onClose={() => setEditing(null)}>
        {editing && (
            <form onSubmit={handleUpdate} className="stack-sm">
              <input type="hidden" name="id" value={editing.id} />
              <Field label="Nama Bahan" name="name" result={result} control={<input required defaultValue={editing.name} className="input" />} />
              <Field label="Satuan" name="unit" result={result} control={<input required defaultValue={editing.unit} className="input" />} />
              <Field label="Stok Minimum" name="minimumStock" result={result} control={<input type="number" step="0.01" defaultValue={editing.minimumStock} className="input" />} />
              <Feedback result={result} />
              <div className="cluster" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
                  <PendingButtonContent pending={pending} pendingLabel="Menyimpan perubahan bahan...">Simpan</PendingButtonContent>
                </button>
              </div>
            </form>
        )}
      </Modal>

      {!showForm && !editing && <Feedback result={result} />}

      {/* Table */}
      <DataTable>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nama Bahan</th>
                <th>Satuan</th>
                <th>Stok Saat Ini</th>
                <th>Harga Rata-rata</th>
                <th>Nilai Persediaan</th>
                <th>Stok Minimum</th>
                <th>Status Stok</th>
                <th>Ketersediaan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState
                      title="Belum ada bahan baku"
                      description="Tambahkan bahan pertama untuk mulai menghitung harga pokok menu."
                      action={
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                          + Tambah Bahan
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                ingredients.map((ing, i) => {
                  const lowStock = toNumber(ing.currentStock) <= toNumber(ing.minimumStock);
                  return (
                    <tr key={ing.id}>
                      <td className="meta">{rowOffset + i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{ing.name}</td>
                      <td>{ing.unit}</td>
                      <td style={{ fontWeight: 700, color: lowStock ? "var(--danger)" : "var(--success)" }}>
                        {formatQuantity(ing.currentStock)}
                      </td>
                      <td className="num">{formatUnitCost(ing.averageCost)}</td>
                      <td className="num">{formatRupiah(ing.stockValue)}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{formatQuantity(ing.minimumStock)}</td>
                      <td>
                        <span className={`badge ${lowStock ? "badge-danger" : "badge-success"}`}>
                          {lowStock ? "Menipis" : "Aman"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${ing.isActive ? "badge-success" : "badge-info"}`}>
                          {ing.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td>
                        <div className="cluster">
                          <Link href={`/admin/ingredients/${ing.id}/card`} className="btn btn-secondary btn-sm">
                            Kartu Stok
                          </Link>
                          <button id={`btn-edit-ing-${ing.id}`} className="btn btn-secondary btn-sm" disabled={pending} onClick={() => { setResult(null); setEditing(ing); }}>Edit</button>
                          <button
                            id={`btn-toggle-ing-${ing.id}`}
                            className={`btn btn-sm ${ing.isActive ? "btn-danger" : "btn-secondary"}`}
                            disabled={pending}
                            onClick={() => handleToggle(ing.id, ing.isActive)}
                          >
                            {ing.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
      </DataTable>
    </div>
  );
}
