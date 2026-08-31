"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import { formatRupiah } from "@/lib/money";
import { Feedback } from "@/components/Feedback";
import { Field } from "@/components/Field";
import { PendingButtonContent } from "@/components/PendingButtonContent";
import { closeShift, openShift } from "../actions";
import CashierHeader from "../CashierHeader";
import styles from "./ShiftPanel.module.css";

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
    <main className={styles.page}>
      <div className={styles.container}>
        <CashierHeader
          title="Shift Kasir"
          description={`${username} · rekonsiliasi kas fisik per periode kerja`}
          current="shift"
          role={role}
        />

        {!shift ? (
          <div className={`card ${styles.openCard}`}>
            <div className={styles.sectionIntro}>
              <h2>Buka shift baru</h2>
              <p>Hitung modal tunai yang sudah ada di laci sebelum melayani transaksi.</p>
            </div>
            <form onSubmit={handleOpen} className={styles.form}>
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
          <div className={styles.workbench}>
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
              <div className={styles.stats}>
                <div className="stat-card"><span className="stat-label">Kas Awal</span><span className="stat-value">{formatRupiah(shift.openingCash)}</span></div>
                <div className="stat-card"><span className="stat-label">Penjualan Tunai</span><span className={`stat-value ${styles.toneSuccess}`}>{formatRupiah(shift.cashSales)}</span><span className="stat-sub">{shift.cashTransactionCount} tunai · {shift.transactionCount} transaksi selesai</span></div>
                <div className="stat-card"><span className="stat-label">Pengeluaran dari Laci</span><span className={`stat-value ${styles.toneDanger}`}>{formatRupiah(shift.cashDrawerExpenses)}</span></div>
                <div className="stat-card"><span className="stat-label">Kas Seharusnya</span><span className={`stat-value ${styles.toneBrand}`}>{formatRupiah(shift.expectedCash)}</span><span className="stat-sub">Kas awal + tunai − pengeluaran laci</span></div>
              </div>
            </section>

            <section className="card">
              <div className={styles.sectionIntro}>
                <h2>Tutup shift</h2>
                <p>Hitung seluruh uang tunai fisik di laci sebelum menutup.</p>
              </div>
              <form onSubmit={handleClose} className={styles.form}>
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
