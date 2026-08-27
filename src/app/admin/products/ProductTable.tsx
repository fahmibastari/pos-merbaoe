"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/generated/prisma";
import { createProduct, toggleProductActive, updateProduct } from "../actions";
import { formatRupiah } from "@/lib/money";
import type { ActionResult } from "@/lib/action-result";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { Feedback } from "@/components/Feedback";
import { Field } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { PendingButtonContent } from "@/components/PendingButtonContent";

type ProductRow = Product & { _count: { recipes: number } };

export default function ProductTable({ products, rowOffset = 0 }: { products: ProductRow[]; rowOffset?: number }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    try {
      const nextResult = await createProduct(new FormData(form));
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
      const nextResult = await updateProduct(new FormData(e.currentTarget));
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
      setResult(await toggleProductActive(fd));
    } catch {
      setResult({ ok: false, error: "Tidak dapat terhubung ke server. Silakan coba lagi." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="stack">
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button id="btn-add-product" className="btn btn-primary" disabled={pending} onClick={() => { setResult(null); setShowForm(!showForm); }}>
          {showForm ? "Batal" : "+ Tambah Menu"}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-md)" }}>Tambah Menu Baru</h3>
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "var(--space-sm)", alignItems: "flex-end" }}>
            <Field label="Nama Menu" name="name" result={result} control={<input required className="input" placeholder="Kopi Susu Aren" />} />
            <Field label="Harga Jual (Rp)" name="sellingPrice" result={result} control={<input type="number" required className="input" placeholder="22000" />} />
            <Field label="HPP Manual / Fallback (Rp)" name="baseHpp" result={result} control={<input type="number" className="input" placeholder="8500" />} />
            <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
              <PendingButtonContent pending={pending} pendingLabel="Menyimpan produk...">Simpan</PendingButtonContent>
            </button>
          </form>
          <Feedback result={result} />
        </div>
      )}

      <Modal
        open={editing !== null}
        title="Edit Menu"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <form
            onSubmit={handleUpdate}
            className="stack-sm"
          >
            <input type="hidden" name="id" value={editing.id} />
            <Field
              label="Nama Menu"
              name="name"
              result={result}
              control={<input required defaultValue={editing.name} className="input" />}
            />
            <Field
              label="Harga Jual (Rp)"
              name="sellingPrice"
              result={result}
              control={<input type="number" min="0" step="0.01" required defaultValue={Number(editing.sellingPrice)} className="input" />}
            />
            <Field
              label="HPP Manual / Fallback (Rp)"
              name="baseHpp"
              result={result}
              hint="Dipakai untuk produk tanpa resep atau saat harga rata-rata bahan belum tersedia."
              control={<input type="number" min="0" step="0.01" required defaultValue={Number(editing.baseHpp)} className="input" />}
            />
            <Feedback result={result} />
            <div className="cluster" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
                <PendingButtonContent pending={pending} pendingLabel="Menyimpan perubahan produk...">
                  Simpan Perubahan
                </PendingButtonContent>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {!showForm && !editing && <Feedback result={result} />}

      <DataTable>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nama Menu</th>
                <th>Harga Jual</th>
                <th>HPP Manual / Fallback</th>
                <th>Margin</th>
                <th>Resep</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      title="Belum ada produk"
                      description="Tambahkan menu pertama agar dapat dijual dari layar kasir."
                      action={
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                          + Tambah Menu
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                products.map((p, i) => {
                  const margin = Number(p.sellingPrice) - Number(p.baseHpp);
                  const marginPct = Number(p.sellingPrice) > 0 ? ((margin / Number(p.sellingPrice)) * 100).toFixed(1) : "0";
                  return (
                    <tr key={p.id}>
                      <td className="meta">{rowOffset + i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ fontWeight: 700, color: "var(--brand-400)" }}>{formatRupiah(p.sellingPrice)}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{formatRupiah(p.baseHpp)}</td>
                      <td style={{ color: margin > 0 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
                        {formatRupiah(margin)} <span className="meta" style={{ opacity: 0.7 }}>({marginPct}%)</span>
                      </td>
                      <td>
                        <span className={`badge ${p.hasRecipe ? "badge-brand" : "badge-info"}`}>
                          {p.hasRecipe ? `${p._count.recipes} bahan` : "HPP Manual"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${p.isActive ? "badge-success" : "badge-info"}`}>
                          {p.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td>
                        <div className="cluster">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={pending}
                            onClick={() => { setResult(null); setEditing(p); }}
                          >
                            Edit
                          </button>
                          <Link className="btn btn-secondary btn-sm" href={`/admin/products/${p.id}/recipe`}>
                            Atur Resep
                          </Link>
                          <button
                            id={`btn-toggle-${p.id}`}
                            type="button"
                            className={`btn btn-sm ${p.isActive ? "btn-danger" : "btn-secondary"}`}
                            disabled={pending}
                            onClick={() => handleToggle(p.id, p.isActive)}
                          >
                            {p.isActive ? "Nonaktifkan" : "Aktifkan"}
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
