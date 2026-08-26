"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { PendingButtonContent } from "@/components/PendingButtonContent";

export default function StockCardFilter({
  ingredientId,
  from,
  to,
}: {
  ingredientId: number;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const query = new URLSearchParams();
    const nextFrom = data.get("from");
    const nextTo = data.get("to");
    if (typeof nextFrom === "string" && nextFrom) query.set("from", nextFrom);
    if (typeof nextTo === "string" && nextTo) query.set("to", nextTo);

    const path = `/admin/ingredients/${ingredientId}/card`;
    startTransition(() => router.push(query.size > 0 ? `${path}?${query}` : path));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr auto auto",
        gap: "0.75rem",
        alignItems: "end",
        marginBottom: "1rem",
      }}
    >
      <div>
        <label className="label" htmlFor="stock-card-from">Dari Tanggal</label>
        <input id="stock-card-from" name="from" type="date" className="input" defaultValue={from} disabled={pending} />
      </div>
      <div>
        <label className="label" htmlFor="stock-card-to">Sampai Tanggal</label>
        <input id="stock-card-to" name="to" type="date" className="input" defaultValue={to} disabled={pending} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
        <PendingButtonContent pending={pending} pendingLabel="Menerapkan filter...">
          Terapkan
        </PendingButtonContent>
      </button>
      <Link href={`/admin/ingredients/${ingredientId}/card`} className="btn btn-secondary">
        Reset
      </Link>
    </form>
  );
}
