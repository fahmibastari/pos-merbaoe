import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import styles from "@/components/ui.module.css";

export default function CashierNotFound() {
  return (
    <main className={styles.errorPage}>
      <div className="card">
        <EmptyState
          title="Data kasir tidak ditemukan"
          description="Transaksi atau halaman kasir yang diminta tidak tersedia."
          action={<Link href="/cashier" className="btn btn-primary">Kembali ke Kasir</Link>}
        />
      </div>
    </main>
  );
}
