"use client";

import { useState } from "react";
import type { Ingredient } from "@/generated/prisma";
import { createIngredient, updateIngredient, deleteIngredient } from "../actions";

type Props = { ingredients: Ingredient[] };

export default function IngredientTable({ ingredients }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await createIngredient(new FormData(e.currentTarget));
    setShowForm(false);
    (e.target as HTMLFormElement).reset();
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await updateIngredient(new FormData(e.currentTarget));
    setEditing(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Yakin hapus bahan baku ini? Tidak bisa dibatalkan.")) return;
    const fd = new FormData();
    fd.append("id", String(id));
    await deleteIngredient(fd);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Add button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button id="btn-add-ingredient" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Batal" : "+ Tambah Bahan"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card slide-up">
          <h3 style={{ fontSize: "0.95rem", marginBottom: "1rem" }}>Tambah Bahan Baku Baru</h3>
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.75rem", alignItems: "flex-end" }}>
            <div>
              <label className="label">Nama Bahan</label>
              <input name="name" required className="input" placeholder="Kopi Arabica" />
            </div>
            <div>
              <label className="label">Satuan</label>
              <input name="unit" required className="input" placeholder="gram / ml / pcs" />
            </div>
            <div>
              <label className="label">Stok Minimum</label>
              <input name="minimumStock" type="number" step="0.01" className="input" placeholder="500" />
            </div>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
          onClick={() => setEditing(null)}
        >
          <div className="card slide-up" style={{ width: "100%", maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: "1rem" }}>Edit Bahan Baku</h3>
            <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input type="hidden" name="id" value={editing.id} />
              <div>
                <label className="label">Nama Bahan</label>
                <input name="name" required defaultValue={editing.name} className="input" />
              </div>
              <div>
                <label className="label">Satuan</label>
                <input name="unit" required defaultValue={editing.unit} className="input" />
              </div>
              <div>
                <label className="label">Stok Minimum</label>
                <input name="minimumStock" type="number" step="0.01" defaultValue={Number(editing.minimumStock)} className="input" />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nama Bahan</th>
                <th>Satuan</th>
                <th>Stok Saat Ini</th>
                <th>Stok Minimum</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Belum ada bahan baku</td></tr>
              ) : (
                ingredients.map((ing, i) => {
                  const lowStock = Number(ing.currentStock) <= Number(ing.minimumStock);
                  return (
                    <tr key={ing.id}>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{ing.name}</td>
                      <td>{ing.unit}</td>
                      <td style={{ fontWeight: 700, color: lowStock ? "var(--danger)" : "var(--success)" }}>
                        {Number(ing.currentStock).toLocaleString("id-ID")}
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{Number(ing.minimumStock).toLocaleString("id-ID")}</td>
                      <td>
                        <span className={`badge ${lowStock ? "badge-danger" : "badge-success"}`}>
                          {lowStock ? "Menipis" : "Aman"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button id={`btn-edit-ing-${ing.id}`} className="btn btn-secondary btn-sm" onClick={() => setEditing(ing)}>Edit</button>
                          <button id={`btn-del-ing-${ing.id}`} className="btn btn-danger btn-sm" onClick={() => handleDelete(ing.id)}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
