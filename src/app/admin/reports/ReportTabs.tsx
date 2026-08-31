import Link from "next/link";
import styles from "./reports.module.css";

export function ReportTabs({ active }: { active: "profit" | "inventory" }) {
  return (
    <nav className={styles.tabs} aria-label="Jenis laporan">
      <Link
        href="/admin/reports/profit"
        className={active === "profit" ? styles.tabActive : styles.tab}
        aria-current={active === "profit" ? "page" : undefined}
      >
        Laba
      </Link>
      <Link
        href="/admin/reports/inventory"
        className={active === "inventory" ? styles.tabActive : styles.tab}
        aria-current={active === "inventory" ? "page" : undefined}
      >
        Persediaan
      </Link>
    </nav>
  );
}
