import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import styles from "@/components/ui.module.css";

export default function NotFound() {
  return (
    <main className={styles.errorPage}>
      <div className="card">
        <EmptyState
          title="Halaman tidak ditemukan"
          description="Alamat yang dibuka tidak tersedia atau sudah berubah."
          action={<Link href="/" className="btn btn-primary">Kembali ke Beranda</Link>}
        />
      </div>
    </main>
  );
}
