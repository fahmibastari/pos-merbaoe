"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/app/login/LogoutButton";
import { Icon, type IconName } from "@/components/Icon";
import styles from "./AdminSidebar.module.css";

const navItems: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/ingredients", label: "Bahan Baku", icon: "ingredients" },
  { href: "/admin/products", label: "Menu & Produk", icon: "products" },
  { href: "/admin/purchases", label: "Pembelian Stok", icon: "purchases" },
  { href: "/admin/expenses", label: "Pengeluaran", icon: "expenses" },
  { href: "/admin/sales", label: "Riwayat Penjualan", icon: "sales" },
  { href: "/admin/shifts", label: "Shift Kasir", icon: "shifts" },
  { href: "/admin/reports/profit", label: "Laporan", icon: "reports" },
  { href: "/admin/audit", label: "Jejak Audit", icon: "audit" },
  { href: "/cashier", label: "Buka POS", icon: "pos" },
];

export default function AdminSidebar({ username }: { username: string }) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <Image
          src="/Logo-Horizontal.png"
          alt="Kopi Merbaoe"
          width={1477}
          height={230}
          priority
          className={styles.brandImageWide}
        />
        <Image
          src="/Logo-IconOnly.png"
          alt=""
          aria-hidden="true"
          width={1355}
          height={601}
          className={styles.brandImageCompact}
        />
        <p className={styles.panelLabel}>Panel administrasi</p>
      </div>

      <nav className={styles.nav} aria-label="Navigasi admin">
        <p className={styles.navLabel}>Menu utama</p>
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`.trim()}
              aria-current={active ? "page" : undefined}
            >
              <span className={styles.navIcon}><Icon name={icon} /></span>
              <span className={styles.navText}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.account}>
        <div className={styles.identity}>
          <div aria-hidden="true" className={styles.initial}>
            {username[0]?.toUpperCase()}
          </div>
          <div>
            <p className={styles.username}>{username}</p>
            <p className={styles.role}>Administrator</p>
          </div>
        </div>
        <LogoutButton
          id="btn-logout-admin"
          className={`btn btn-secondary ${styles.logout}`}
        />
      </div>
    </aside>
  );
}
