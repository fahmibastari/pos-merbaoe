"use client";

import { useState } from "react";
import { deleteExpense } from "../actions";
import { Feedback } from "@/components/Feedback";
import { PendingButtonContent } from "@/components/PendingButtonContent";

export default function ExpenseDeleteButton({
  id,
  description,
}: {
  id: number;
  description: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (
      !confirm(
        `Hapus pengeluaran “${description}”? Catatan ini akan dihapus dari laporan laba dan tidak dapat dipulihkan.`,
      )
    ) return;

    const formData = new FormData();
    formData.set("id", String(id));
    setPending(true);
    setError(null);

    try {
      const result = await deleteExpense(formData);
      if (!result.ok) setError(result.error);
    } catch {
      setError("Tidak dapat terhubung ke server. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        id={`btn-del-exp-${id}`}
        type="button"
        className="btn btn-danger btn-sm"
        disabled={pending}
        aria-busy={pending}
        onClick={handleDelete}
      >
        <PendingButtonContent pending={pending} pendingLabel="Menghapus pengeluaran...">Hapus</PendingButtonContent>
      </button>
      <Feedback tone="error" message={error} compact />
    </div>
  );
}
