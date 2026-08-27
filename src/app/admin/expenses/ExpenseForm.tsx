"use client";

import { useState } from "react";
import { createExpense } from "../actions";
import type { ActionResult } from "@/lib/action-result";
import { Feedback } from "@/components/Feedback";
import { Field } from "@/components/Field";
import { PendingButtonContent } from "@/components/PendingButtonContent";
import { toWibDateString } from "@/lib/period";

type OpenShiftOption = {
  id: number;
  cashierName: string;
  openedAtLabel: string;
};

export default function ExpenseForm({
  openShifts,
}: {
  openShifts: OpenShiftOption[];
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    try {
      const nextResult = await createExpense(new FormData(form));
      setResult(nextResult);
      if (nextResult.ok) form.reset();
    } catch {
      setResult({
        ok: false,
        error: "Tidak dapat terhubung ke server. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="expense-form" className="card">
      <h2 style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-lg)" }}>Catat Pengeluaran</h2>
      <form onSubmit={handleSubmit} className="stack">
        <Field label="Deskripsi" name="description" result={result} control={<input required className="input" placeholder="Bayar listrik bulan ini" />} />
        <Field
          label="Kategori"
          name="category"
          result={result}
          control={
            <select required className="input">
              <option value="utilitas">Utilitas (Listrik, Air)</option>
              <option value="sewa">Sewa Tempat</option>
              <option value="pemeliharaan">Pemeliharaan</option>
              <option value="lain_lain">Lain-lain</option>
            </select>
          }
        />
        <Field label="Jumlah (Rp)" name="amount" result={result} control={<input type="number" required className="input" placeholder="500000" />} />
        <Field label="Tanggal" name="expenseDate" result={result} control={<input type="date" required className="input" defaultValue={toWibDateString()} />} />
        <Field
          label="Sumber Dana"
          name="cashierShiftId"
          result={result}
          hint="Pilih laci shift hanya bila uang benar-benar diambil dari kas fisik."
          control={
            <select className="input" defaultValue="">
              <option value="">Di luar laci kas</option>
              {openShifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  Laci {shift.cashierName} · buka {shift.openedAtLabel}
                </option>
              ))}
            </select>
          }
        />

        <button id="btn-submit-expense" type="submit" className="btn btn-primary" disabled={loading} aria-busy={loading}>
          <PendingButtonContent pending={loading} pendingLabel="Menyimpan pengeluaran...">
            Simpan Pengeluaran
          </PendingButtonContent>
        </button>

        <Feedback result={result} />
      </form>
    </div>
  );
}
