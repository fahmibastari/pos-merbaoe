"use client";

import { useEffect } from "react";
import { RouteErrorState } from "@/components/RouteErrorState";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Application route error", error);
  }, [error]);

  return (
    <RouteErrorState
      fullPage
      title="Aplikasi tidak dapat dimuat"
      message="Terjadi kesalahan. Silakan coba memuat ulang halaman ini."
      retry={unstable_retry}
    />
  );
}
