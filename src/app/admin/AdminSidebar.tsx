"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/login/actions";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/admin/ingredients", label: "Bahan Baku", icon: "⊟" },
  { href: "/admin/products", label: "Menu & Produk", icon: "☕" },
  { href: "/admin/purchases", label: "Pembelian Stok", icon: "⊕" },
  { href: "/admin/expenses", label: "Pengeluaran", icon: "◌" },
  { href: "/admin/sales", label: "Riwayat Penjualan", icon: "⊞" },
];

export default function AdminSidebar({ username }: { username: string }) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "16rem",
        height: "100dvh",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "1.5rem",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "2.25rem",
              height: "2.25rem",
              borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, var(--brand-500), var(--brand-700))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              boxShadow: "0 4px 12px rgba(249,108,15,0.35)",
              flexShrink: 0,
            }}
          >
            ☕
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.2 }}>
              Merbaoe POS
            </p>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <p
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            padding: "0 0.75rem",
            marginBottom: "0.5rem",
          }}
        >
          Menu Utama
        </p>
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                padding: "0.6rem 0.75rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.85rem",
                fontWeight: active ? 600 : 500,
                color: active ? "var(--brand-400)" : "var(--text-secondary)",
                background: active ? "rgba(249,108,15,0.1)" : "transparent",
                border: active ? "1px solid rgba(249,108,15,0.15)" : "1px solid transparent",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                }
              }}
            >
              <span style={{ fontSize: "1rem", width: "1.25rem", textAlign: "center" }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div
        style={{
          padding: "1rem 0.75rem",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            padding: "0.6rem 0.75rem",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-elevated)",
            marginBottom: "0.5rem",
          }}
        >
          <div
            style={{
              width: "1.75rem",
              height: "1.75rem",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--brand-500), var(--brand-700))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {username[0]?.toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: "0.8rem", fontWeight: 600 }}>{username}</p>
            <p style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Administrator</p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            id="btn-logout-admin"
            type="submit"
            className="btn btn-secondary"
            style={{ width: "100%", fontSize: "0.8rem" }}
          >
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
