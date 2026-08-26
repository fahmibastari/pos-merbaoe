"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LogoutButton from "@/app/login/LogoutButton";
import type { ActionResult } from "@/lib/action-result";
import { formatRupiah } from "@/lib/money";
import { Feedback } from "@/components/Feedback";
import { Field } from "@/components/Field";
import { PendingButtonContent } from "@/components/PendingButtonContent";
import { closeShift, openShift } from "../actions";

type OpenShiftSummary = {
  id: number;
  openedAt: string;
  transactionCount: number;
  cashTransactionCount: number;
  openingCash: number;
  cashSales: number;
  cashDrawerExpenses: number;
  expectedCash: number;
};

export default function ShiftPanel({
  username,
  role,
  shift,
}: {
  username: string;
  role: "admin" | "kasir";
  shift: OpenShiftSummary | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);
  const [actualCash, setActualCash] = useState("");
  const difference = shift
    ? (Number(actualCash) || 0) - shift.expectedCash
    : 0;

  async function handleOpen(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const nextResult = await openShift(new FormData(event.currentTarget));
      setResult(nextResult);
      if (nextResult.ok) router.push("/cashier");
    } catch {
      setResult({ ok: false, error: "Tidak dapat terhubung ke server. Silakan coba lagi." });
    } finally {
      setPending(false);
    }
  }

  async function handleClose(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const nextResult = await closeShift(new FormData(event.currentTarget));
      setResult(nextResult);
      if (nextResult.ok) {
        setActualCash("");
        router.refresh();
      }
    } catch {
      setResult({ ok: false, error: "Tidak dapat terhubung ke server. Silakan coba lagi." });
    } finally {
      setPending(false);
    }
  }

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg-base)", padding: "1.5rem" }}>
      <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.35rem" }}>Shift Kasir</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
              {username} · rekonsiliasi kas fisik per periode kerja
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
            {shift && <Link href="/cashier" className="btn btn-primary">Buka POS</Link>}
            {role === "admin" && <Link href="/admin/shifts" className="btn btn-secondary">Semua Shift</Link>}
            <LogoutButton className="btn btn-secondary" />
          </div>
        </header>

        {!shift ? (
          <div className="card" style={{ maxWidth: "30rem", margin: "4rem auto" }}>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.4rem" }}>Buka shift baru</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "1.2rem" }}>
              Hitung modal tunai yang sudah ada di laci sebelum melayani transaksi.
            </p>
            <form onSubmit={handleOpen} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Field
                label="Kas awal (Rp)"
                name="openingCash"
                result={result}
                control={<input className="input num" type="number" min="0" step="1" required defaultValue="0" />}
              />
              <Feedback result={result} />
              <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
                <PendingButtonContent pending={pending} pendingLabel="Membuka shift...">
                  Buka Shift & Masuk POS
                </PendingButtonContent>
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 24rem", gap: "1.5rem", alignItems: "start" }}>
            <section>
              <div className="page-header">
                <h2>Shift sedang berjalan</h2>
                <p>
                  Dibuka {new Date(shift.openedAt).toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Jakarta",
                  })}
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "1rem" }}>
                <div className="stat-card"><span className="stat-label">Kas Awal</span><span className="stat-value">{formatRupiah(shift.openingCash)}</span></div>
                <div className="stat-card"><span className="stat-label">Penjualan Tunai</span><span className="stat-value" style={{ color: "var(--success)" }}>{formatRupiah(shift.cashSales)}</span><span className="stat-sub">{shift.cashTransactionCount} tunai · {shift.transactionCount} transaksi selesai</span></div>
                <div className="stat-card"><span className="stat-label">Pengeluaran dari Laci</span><span className="stat-value" style={{ color: "var(--danger)" }}>{formatRupiah(shift.cashDrawerExpenses)}</span></div>
                <div className="stat-card"><span className="stat-label">Kas Seharusnya</span><span className="stat-value" style={{ color: "var(--brand-400)" }}>{formatRupiah(shift.expectedCash)}</span><span className="stat-sub">Kas awal + tunai − pengeluaran laci</span></div>
              </div>
            </section>

            <section className="card">
              <h2 style={{ fontSize: "1rem", marginBottom: "0.4rem" }}>Tutup shift</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "1rem" }}>
                Hitung seluruh uang tunai fisik di laci sebelum menutup.
              </p>
              <form onSubmit={handleClose} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <Field
                  label="Kas fisik aktual (Rp)"
                  name="actualCash"
                  result={result}
                  control={<input className="input num" type="number" min="0" step="1" required value={actualCash} onChange={(event) => setActualCash(event.target.value)} />}
                />
                {actualCash !== "" && (
                  <Feedback
                    tone={difference === 0 ? "success" : "info"}
                    message={difference === 0 ? "Kas fisik cocok." : `Selisih ${formatRupiah(difference)}.`}
                  />
                )}
                <Field
                  label="Keterangan selisih"
                  name="notes"
                  result={result}
                  hint="Wajib bila selisih tidak nol."
                  control={<textarea className="input" rows={3} maxLength={255} required={actualCash !== "" && difference !== 0} />}
                />
                <Feedback result={result} />
                <button type="submit" className="btn btn-danger" disabled={pending} aria-busy={pending}>
                  <PendingButtonContent pending={pending} pendingLabel="Menutup shift...">
                    Tutup Shift
                  </PendingButtonContent>
                </button>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
