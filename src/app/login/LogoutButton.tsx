"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "./actions";
import { Feedback } from "@/components/Feedback";
import { PendingButtonContent } from "@/components/PendingButtonContent";

export default function LogoutButton({
  className,
  id,
  style,
}: {
  className?: string;
  id?: string;
  style?: CSSProperties;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogout() {
    setPending(true);
    setError(null);

    try {
      const result = await logoutAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.replace(result.data.redirectTo);
      router.refresh();
    } catch {
      setError("Tidak dapat keluar saat ini. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        id={id}
        type="button"
        className={className ?? "btn btn-secondary"}
        style={style}
        onClick={handleLogout}
        disabled={pending}
        aria-busy={pending}
      >
        <PendingButtonContent pending={pending} pendingLabel="Keluar dari aplikasi...">Keluar</PendingButtonContent>
      </button>
      <Feedback tone="error" message={error} compact />
    </div>
  );
}
