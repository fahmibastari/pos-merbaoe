"use client";

import { useState } from "react";
import type { Product } from "@/generated/prisma";
import { createProduct, toggleProductActive, deleteProduct } from "../actions";
import { formatRupiah } from "@/lib/money";

export default function ProductTable({ products }: { products: Product[] }) {
  const [showForm, setShowForm] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await createProduct(new FormData(e.currentTarget));
    setShowForm(false);
    (e.target as HTMLFormElement).reset();
  }

  async function handleToggle(id: number, isActive: boolean) {
    const fd = new FormData();
    fd.append("id", String(id));
    fd.append("isActive", String(isActive));
    await toggleProductActive(fd);
  }

  async function handleDelete(id: number) {
    if (!confirm("Yakin hapus produk ini?")) return;
    const fd = new FormData();
    fd.append("id", String(id));
    await deleteProduct(fd);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button id="btn-add-product" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Batal" : "+ Tambah Menu"}
        </button>
      </div>

      {showForm && (
        <div className="card slide-up">
          <h3 style={{ fontSize: "0.95rem", marginBottom: "1rem" }}>Tambah Menu Baru</h3>
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "0.75rem", alignItems: "flex-end" }}>
            <div>
              <label className="label">Nama Menu</label>
              <input name="name" required className="input" placeholder="Kopi Susu Aren" />
            </div>
            <div>
              <label className="label">Harga Jual (Rp)</label>
              <input name="sellingPrice" type="number" required className="input" placeholder="22000" />
            </div>
            <div>
              <label className="label">HPP Dasar (Rp)</label>
              <input name="baseHpp" type="number" className="input" placeholder="8500" />
            </div>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nama Menu</th>
                <th>Harga Jual</th>
                <th>HPP Dasar</th>
                <th>Margin</th>
                <th>Resep</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Belum ada produk</td></tr>
              ) : (
                products.map((p, i) => {
                  const margin = Number(p.sellingPrice) - Number(p.baseHpp);
                  const marginPct = Number(p.sellingPrice) > 0 ? ((margin / Number(p.sellingPrice)) * 100).toFixed(1) : "0";
                  return (
                    <tr key={p.id}>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ fontWeight: 700, color: "var(--brand-400)" }}>{formatRupiah(p.sellingPrice)}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{formatRupiah(p.baseHpp)}</td>
                      <td style={{ color: margin > 0 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
                        {formatRupiah(margin)} <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>({marginPct}%)</span>
                      </td>
                      <td>
                        <span className={`badge ${p.hasRecipe ? "badge-brand" : "badge-info"}`}>
                          {p.hasRecipe ? "BOM" : "Manual"}
                        </span>
                      </td>
                      <td>
                        <button
                          id={`btn-toggle-${p.id}`}
                          className="btn btn-sm"
                          style={{ background: p.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: p.isActive ? "var(--success)" : "var(--danger)", border: `1px solid ${p.isActive ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}
                          onClick={() => handleToggle(p.id, p.isActive)}
                        >
                          {p.isActive ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>
                      <td>
                        <button id={`btn-del-prod-${p.id}`} className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Hapus</button>
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
