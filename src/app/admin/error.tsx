"use client";

import { useEffect } from "react";
import { RouteErrorState } from "@/components/RouteErrorState";

export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Admin route error", error);
  }, [error]);

  return (
    <RouteErrorState
      title="Halaman admin tidak dapat dimuat"
      message="Terjadi kesalahan. Silakan coba memuat ulang bagian ini."
      retry={unstable_retry}
    />
  );
}
