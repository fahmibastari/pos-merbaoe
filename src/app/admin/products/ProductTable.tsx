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
import { ProductPhoto } from "@/components/ProductPhoto";
import styles from "./products.module.css";

type ProductRow = Product & {
  _count: { recipes: number };
  imageUrl: string | null;
};

export default function ProductTable({
  products,
  rowOffset = 0,
  query = "",
}: {
  products: ProductRow[];
  rowOffset?: number;
  query?: string;
}) {
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
      <div className={styles.toolbar}>
        <form className={styles.searchForm} action="/admin/products" method="get">
          <label className="sr-only" htmlFor="product-search">Cari menu</label>
          <input
            id="product-search"
            name="q"
            className="input"
            defaultValue={query}
            placeholder="Cari nama menu…"
          />
          <button className="btn btn-secondary" type="submit">Cari</button>
          {query && <Link className={styles.resetLink} href="/admin/products">Hapus pencarian</Link>}
        </form>
        <button id="btn-add-product" className="btn btn-primary" disabled={pending} onClick={() => { setResult(null); setShowForm(!showForm); }}>
          {showForm ? "Batal" : "+ Tambah Menu"}
        </button>
      </div>

      {showForm && (
        <section className={styles.editor}>
          <h3>Tambah Menu Baru</h3>
          <form onSubmit={handleCreate} className={styles.createForm}>
            <Field label="Nama Menu" name="name" result={result} control={<input required className="input" placeholder="Kopi Susu Aren" />} />
            <Field label="Harga Jual (Rp)" name="sellingPrice" result={result} control={<input type="number" required className="input" placeholder="22000" />} />
            <Field label="HPP Manual / Fallback (Rp)" name="baseHpp" result={result} control={<input type="number" className="input" placeholder="8500" />} />
            <Field
              label="Foto Menu"
              name="image"
              hint="Opsional · JPEG, PNG, atau WebP · maksimal 3 MiB."
              control={<input type="file" accept="image/jpeg,image/png,image/webp" className={styles.fileInput} />}
            />
            <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
              <PendingButtonContent pending={pending} pendingLabel="Menyimpan produk...">Simpan</PendingButtonContent>
            </button>
          </form>
          <Feedback result={result} />
        </section>
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
            <div className={styles.editPhoto}>
              <ProductPhoto
                name={editing.name}
                src={editing.imageUrl}
                sizes="8rem"
                className={styles.editPhotoPreview}
              />
              <div className="stack-sm">
                <Field
                  label="Ganti Foto"
                  name="image"
                  hint="Biarkan kosong untuk mempertahankan foto saat ini."
                  control={<input type="file" accept="image/jpeg,image/png,image/webp" className={styles.fileInput} />}
                />
                {editing.imagePath && (
                  <label className={styles.removePhoto}>
                    <input type="checkbox" name="removeImage" value="true" />
                    Hapus foto saat menyimpan
                  </label>
                )}
              </div>
            </div>
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

      <DataTable className={styles.tableSurface}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th><span className="sr-only">Foto</span></th>
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
                  <td colSpan={9}>
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
                      <td className={styles.photoCell}>
                        <ProductPhoto name={p.name} src={p.imageUrl} sizes="3.5rem" className={styles.thumbnail} compact />
                      </td>
                      <td className={styles.productTitle}>{p.name}</td>
                      <td className={styles.price}>{formatRupiah(p.sellingPrice)}</td>
                      <td className="meta">{formatRupiah(p.baseHpp)}</td>
                      <td className={margin > 0 ? styles.positive : styles.negative}>
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
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.rowAction}
                            disabled={pending}
                            onClick={() => { setResult(null); setEditing(p); }}
                          >
                            Edit
                          </button>
                          <Link className={styles.rowAction} href={`/admin/products/${p.id}/recipe`}>
                            Atur Resep
                          </Link>
                          <button
                            id={`btn-toggle-${p.id}`}
                            type="button"
                            className={`${styles.rowAction} ${p.isActive ? styles.rowActionDanger : ""}`.trim()}
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
