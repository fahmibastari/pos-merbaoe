import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(249,108,15,0.08) 0%, transparent 70%), var(--bg-base)",
        padding: "1.5rem",
      }}
    >
      {/* Decorative blobs */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: "-10rem",
          right: "-10rem",
          width: "30rem",
          height: "30rem",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,108,15,0.06), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          bottom: "-8rem",
          left: "-8rem",
          width: "24rem",
          height: "24rem",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,108,15,0.04), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="slide-up"
        style={{
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        {/* Logo & Heading */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "3.5rem",
              height: "3.5rem",
              borderRadius: "var(--radius-lg)",
              background: "linear-gradient(135deg, var(--brand-500), var(--brand-700))",
              boxShadow: "0 8px 24px rgba(249,108,15,0.4)",
              marginBottom: "1.25rem",
              fontSize: "1.75rem",
            }}
          >
            ☕
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              marginBottom: "0.25rem",
            }}
          >
            Merbaoe <span className="gradient-text-brand">POS</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Sistem kasir & analisis keuangan
          </p>
        </div>

        {/* Login Card */}
        <div
          className="glass"
          style={{
            borderRadius: "var(--radius-xl)",
            padding: "2rem",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <LoginForm />
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
          }}
        >
          Kafe Kopi Merbaoe &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
