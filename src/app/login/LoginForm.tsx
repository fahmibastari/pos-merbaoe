"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";
import type { ActionResult } from "@/lib/action-result";
import { Feedback } from "@/components/Feedback";
import { Field } from "@/components/Field";
import { PendingButtonContent } from "@/components/PendingButtonContent";

export default function LoginForm() {
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const nextResult = await loginAction(formData);
        setResult(nextResult);
        if (nextResult.ok) {
          router.replace(nextResult.data.redirectTo);
          router.refresh();
        }
      } catch {
        setResult({
          ok: false,
          error: "Tidak dapat terhubung ke server. Silakan coba lagi.",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            marginBottom: "0.25rem",
          }}
        >
          Masuk ke Akun
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
          Masukkan kredensial Anda untuk melanjutkan
        </p>
      </div>

      <div className="divider" />

      <Feedback result={result} />

      {/* Username */}
      <Field
        label="Username"
        name="username"
        id="username"
        result={result}
        control={
          <input
            type="text"
            autoComplete="username"
            required
            placeholder="admin / kasir"
            className="input"
            disabled={isPending}
          />
        }
      />

      {/* Password */}
      <Field
        label="Password"
        name="password"
        id="password"
        result={result}
        control={
          <input
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="input"
            disabled={isPending}
          />
        }
      />

      {/* Submit */}
      <button
        id="btn-login"
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="btn btn-primary btn-lg"
        style={{ width: "100%", marginTop: "0.25rem" }}
      >
        <PendingButtonContent pending={isPending} pendingLabel="Memverifikasi...">
          Masuk
        </PendingButtonContent>
      </button>
    </form>
  );
}
