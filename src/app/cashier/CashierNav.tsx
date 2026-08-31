import Link from "next/link";
import styles from "./CashierNav.module.css";

type CashierSection = "pos" | "history" | "stock" | "shift";

const items: Array<{ key: CashierSection; href: string; label: string }> = [
  { key: "pos", href: "/cashier", label: "POS" },
  { key: "history", href: "/cashier/history", label: "Riwayat" },
  { key: "stock", href: "/cashier/stock", label: "Stok" },
  { key: "shift", href: "/cashier/shift", label: "Shift" },
];

export default function CashierNav({
  current,
  role,
}: {
  current: CashierSection;
  role: "admin" | "kasir";
}) {
  return (
    <nav aria-label="Navigasi kasir" className={styles.nav}>
      {items.map((item) => {
        const active = item.key === current;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`btn btn-sm btn-secondary ${styles.link} ${active ? styles.active : ""}`.trim()}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
      {role === "admin" && (
        <Link href="/admin/dashboard" className={`btn btn-secondary btn-sm ${styles.link}`}>
          Admin
        </Link>
      )}
    </nav>
  );
}
