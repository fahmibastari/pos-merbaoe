import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";

export default function AdminNotFound() {
  return (
    <div className="card">
      <EmptyState
        title="Data tidak ditemukan"
        description="Data admin yang diminta tidak tersedia atau sudah tidak dapat diakses."
        action={<Link href="/admin/dashboard" className="btn btn-primary">Kembali ke Dashboard</Link>}
      />
    </div>
  );
}
