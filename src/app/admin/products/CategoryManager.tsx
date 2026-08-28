"use client";

import { useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import { Feedback } from "@/components/Feedback";
import { Field } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { PendingButtonContent } from "@/components/PendingButtonContent";
import {
  createProductCategory,
  toggleProductCategoryActive,
  updateProductCategory,
} from "../actions";
import styles from "./products.module.css";

export type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  totalProducts: number;
  activeProducts: number;
};

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const [open, setOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const pending = pendingAction !== null;
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);

  async function run(
    action: (formData: FormData) => Promise<ActionResult<unknown>>,
    formData: FormData,
    actionKey: string,
    form?: HTMLFormElement,
  ) {
    setPendingAction(actionKey);
    setResult(null);
    try {
      const nextResult = await action(formData);
      setResult(nextResult);
      if (nextResult.ok) form?.reset();
    } catch {
      setResult({
        ok: false,
        error: "Tidak dapat terhubung ke server. Silakan coba lagi.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => {
          setResult(null);
          setOpen(true);
        }}
      >
        Kelola Kategori
      </button>
      <Modal open={open} title="Kelola Kategori Menu" onClose={() => setOpen(false)}>
        <div className={styles.categoryManager}>
          <p className={styles.categoryIntro}>
            Urutan terkecil tampil lebih dulu di filter kasir. Kategori tidak
            dapat dinonaktifkan selama masih memiliki menu aktif.
          </p>
          <form
            className={styles.categoryCreate}
            onSubmit={(event) => {
              event.preventDefault();
              void run(
                createProductCategory,
                new FormData(event.currentTarget),
                "create",
                event.currentTarget,
              );
            }}
          >
            <Field
              label="Kategori Baru"
              name="name"
              result={result}
              control={<input required className="input" placeholder="Cemilan" />}
            />
            <Field
              label="Urutan"
              name="sortOrder"
              result={result}
              control={<input required type="number" min="0" max="9999" defaultValue="30" className="input num" />}
            />
            <button type="submit" className="btn btn-primary" disabled={pending}>
              <PendingButtonContent pending={pendingAction === "create"} pendingLabel="Menambahkan...">
                Tambah
              </PendingButtonContent>
            </button>
          </form>

          <Feedback result={result} />

          <div className={styles.categoryList}>
            {categories.map((category) => (
              <article className={styles.categoryRow} key={category.id}>
                <form
                  className={styles.categoryEdit}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void run(
                      updateProductCategory,
                      new FormData(event.currentTarget),
                      `update-${category.id}`,
                    );
                  }}
                >
                  <input type="hidden" name="id" value={category.id} />
                  <label>
                    <span className="sr-only">Nama kategori {category.name}</span>
                    <input required name="name" defaultValue={category.name} className="input" />
                  </label>
                  <label>
                    <span className="sr-only">Urutan kategori {category.name}</span>
                    <input required name="sortOrder" type="number" min="0" max="9999" defaultValue={category.sortOrder} className={`input num ${styles.categoryOrder}`} />
                  </label>
                  <button type="submit" className={styles.rowAction} disabled={pending}>
                    {pendingAction === `update-${category.id}` ? "Menyimpan..." : "Simpan"}
                  </button>
                </form>
                <div className={styles.categoryMeta}>
                  <span className={`badge ${category.isActive ? "badge-success" : "badge-info"}`}>
                    {category.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                  <span>{category.activeProducts} aktif / {category.totalProducts} menu</span>
                  <button
                    type="button"
                    className={`${styles.rowAction} ${category.isActive ? styles.rowActionDanger : ""}`.trim()}
                    disabled={pending}
                    onClick={() => {
                      const formData = new FormData();
                      formData.set("id", String(category.id));
                      formData.set("isActive", String(category.isActive));
                      void run(
                        toggleProductCategoryActive,
                        formData,
                        `toggle-${category.id}`,
                      );
                    }}
                  >
                    {pendingAction === `toggle-${category.id}`
                      ? "Memproses..."
                      : category.isActive
                        ? "Nonaktifkan"
                        : "Aktifkan"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
