"use client";

import { useEffect } from "react";
import { RouteErrorState } from "@/components/RouteErrorState";

export default function CashierError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Cashier route error", error);
  }, [error]);

  return (
    <RouteErrorState
      fullPage
      title="Kasir tidak dapat dimuat"
      message="Terjadi kesalahan. Silakan coba memuat ulang layar kasir."
      retry={unstable_retry}
    />
  );
}
