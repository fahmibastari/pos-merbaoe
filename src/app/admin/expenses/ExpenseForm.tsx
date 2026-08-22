"use client";

import { useState } from "react";
import { createExpense } from "../actions";

export default function ExpenseForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await createExpense(new FormData(e.currentTarget));
    setLoading(false);
    setSuccess(true);
    (e.target as HTMLFormElement).reset();
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: "0.95rem", marginBottom: "1.25rem" }}>Catat Pengeluaran</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="label">Deskripsi</label>
          <input name="description" required className="input" placeholder="Bayar listrik bulan ini" />
        </div>
        <div>
          <label className="label">Kategori</label>
          <select name="category" required className="input">
            <option value="utilitas">Utilitas (Listrik, Air)</option>
            <option value="sewa">Sewa Tempat</option>
            <option value="pemeliharaan">Pemeliharaan</option>
            <option value="lain_lain">Lain-lain</option>
          </select>
        </div>
        <div>
          <label className="label">Jumlah (Rp)</label>
          <input name="amount" type="number" required className="input" placeholder="500000" />
        </div>
        <div>
          <label className="label">Tanggal</label>
          <input name="expenseDate" type="date" required className="input"
            defaultValue={new Date().toISOString().split("T")[0]} />
        </div>

        <button id="btn-submit-expense" type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Pengeluaran"}
        </button>

        {success && (
          <div style={{ padding: "0.65rem 0.9rem", borderRadius: "var(--radius-md)", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "var(--success)", fontSize: "0.82rem" }}>
            ✓ Pengeluaran berhasil dicatat.
          </div>
        )}
      </form>
    </div>
  );
}
