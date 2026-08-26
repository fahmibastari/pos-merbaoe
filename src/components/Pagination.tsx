import Link from "next/link";
import styles from "./ui.module.css";

export function Pagination({
  page,
  totalPages,
  previousHref,
  nextHref,
}: {
  page: number;
  totalPages: number;
  previousHref?: string;
  nextHref?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label="Paginasi">
      <Link
        href={previousHref ?? "#"}
        className={`btn btn-secondary btn-sm ${!previousHref ? styles.paginationDisabled : ""}`.trim()}
        aria-disabled={!previousHref}
        tabIndex={previousHref ? undefined : -1}
      >
        Sebelumnya
      </Link>
      <span className={styles.paginationStatus}>
        Halaman {page} dari {totalPages}
      </span>
      <Link
        href={nextHref ?? "#"}
        className={`btn btn-secondary btn-sm ${!nextHref ? styles.paginationDisabled : ""}`.trim()}
        aria-disabled={!nextHref}
        tabIndex={nextHref ? undefined : -1}
      >
        Berikutnya
      </Link>
    </nav>
  );
}
