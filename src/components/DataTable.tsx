import type { ReactNode } from "react";
import styles from "./ui.module.css";

export function DataTable({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card card-flush data-table-card ${className}`.trim()}>
      {title && (
        <header className={styles.dataTableHeader}>
          <h2>{title}</h2>
        </header>
      )}
      <div className="table-wrapper table-wrapper-in-card">{children}</div>
    </section>
  );
}
