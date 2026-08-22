"use client";

import { useState, useTransition } from "react";
import { loginAction } from "./actions";

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);
      // loginAction redirects on success, only reaches here on error
      if (result?.error) {
        setError(result.error);
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

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md)",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171",
            fontSize: "0.85rem",
            fontWeight: 500,
          }}
        >
          <span>⚠</span> {error}
        </div>
      )}

      {/* Username */}
      <div>
        <label htmlFor="username" className="label">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          placeholder="admin / kasir"
          className="input"
          disabled={isPending}
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="input"
          disabled={isPending}
        />
      </div>

      {/* Submit */}
      <button
        id="btn-login"
        type="submit"
        disabled={isPending}
        className="btn btn-primary btn-lg"
        style={{ width: "100%", marginTop: "0.25rem" }}
      >
        {isPending ? (
          <>
            <span
              style={{
                width: "1rem",
                height: "1rem",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.7s linear infinite",
              }}
            />
            Memverifikasi...
          </>
        ) : (
          "Masuk"
        )}
      </button>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
}
