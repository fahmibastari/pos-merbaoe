"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import { Feedback } from "@/components/Feedback";
import { Field } from "@/components/Field";
import { Modal } from "@/components/Modal";
import { PendingButtonContent } from "@/components/PendingButtonContent";
import { voidSale } from "../actions";

export default function VoidSaleButton({
  saleId,
  invoiceNumber,
}: {
  saleId: number;
  invoiceNumber: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);

  function showDialog() {
    setResult(null);
    setOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    try {
      const nextResult = await voidSale(new FormData(event.currentTarget));
      setResult(nextResult);
      if (nextResult.ok) {
        setOpen(false);
        router.refresh();
      }
    } catch {
      setResult({
        ok: false,
        error: "Tidak dapat terhubung ke server. Silakan coba lagi.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-danger btn-sm"
        onClick={showDialog}
      >
        Void
      </button>
      <Modal
        open={open}
        title="Batalkan transaksi"
        onClose={() => {
          if (!pending) setOpen(false);
        }}
      >
        <form
          onSubmit={handleSubmit}
          className="stack"
        >
          <input type="hidden" name="saleId" value={saleId} />
          <Feedback tone="info">
            <p>
              <strong>{invoiceNumber}</strong> akan dikeluarkan dari laporan dan
              seluruh stok yang terpakai akan dikembalikan.
            </p>
          </Feedback>
          <Field
            label="Alasan pembatalan"
            name="reason"
            result={result}
            hint="Wajib diisi dan akan disimpan dalam jejak audit."
            control={
              <textarea
                className="input"
                rows={4}
                maxLength={255}
                required
                autoFocus
                placeholder="Contoh: transaksi tercatat dua kali"
              />
            }
          />
          <Feedback result={result} />
          <div
            className="cluster"
          >
            <button
              type="button"
              className="btn btn-secondary"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Kembali
            </button>
            <button type="submit" className="btn btn-danger" disabled={pending} aria-busy={pending}>
              <PendingButtonContent pending={pending} pendingLabel="Membatalkan transaksi...">
                Ya, batalkan transaksi
              </PendingButtonContent>
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
