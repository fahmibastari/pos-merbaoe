import styles from "./ui.module.css";

function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`${styles.skeleton} ${className}`.trim()} />;
}

function LoadingStatus({ label }: { label: string }) {
  return <span className="sr-only">{label}</span>;
}

function SkeletonTable() {
  return (
    <section className={`card card-flush ${styles.skeletonTable}`} aria-hidden="true">
      <div className={styles.skeletonTableHeader}>
        <Skeleton className={styles.skeletonHeadingShort} />
      </div>
      <div className="table-wrapper table-wrapper-in-card">
        <table>
          <thead>
            <tr>
              {Array.from({ length: 5 }, (_, index) => (
                <th key={index}><Skeleton className={styles.skeletonCell} /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }, (_, row) => (
              <tr key={row}>
                {Array.from({ length: 5 }, (_, column) => (
                  <td key={column}><Skeleton className={styles.skeletonCell} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AppLoadingSkeleton() {
  return (
    <main className={styles.appLoading} role="status" aria-live="polite" aria-busy="true">
      <LoadingStatus label="Memuat aplikasi..." />
      <div className={`card ${styles.appLoadingCard}`} aria-hidden="true">
        <Skeleton className={styles.skeletonLogo} />
        <Skeleton className={styles.skeletonHeading} />
        <Skeleton className={styles.skeletonText} />
      </div>
    </main>
  );
}

export function AdminLoadingSkeleton() {
  return (
    <div className={styles.adminLoading} role="status" aria-live="polite" aria-busy="true">
      <LoadingStatus label="Memuat data admin..." />
      <div className={styles.skeletonPageHeader} aria-hidden="true">
        <Skeleton className={styles.skeletonHeading} />
        <Skeleton className={styles.skeletonText} />
      </div>
      <div className={styles.skeletonStats} aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="stat-card" key={index}>
            <Skeleton className={styles.skeletonLabel} />
            <Skeleton className={styles.skeletonValue} />
            <Skeleton className={styles.skeletonText} />
          </div>
        ))}
      </div>
      <SkeletonTable />
    </div>
  );
}

export function CashierLoadingSkeleton() {
  return (
    <main className={styles.cashierLoading} role="status" aria-live="polite" aria-busy="true">
      <LoadingStatus label="Memuat layar kasir..." />
      <section className={styles.cashierCatalog} aria-hidden="true">
        <div className={styles.skeletonToolbar}>
          <Skeleton className={styles.skeletonHeading} />
          <Skeleton className={styles.skeletonControl} />
        </div>
        <div className={styles.skeletonProductGrid}>
          {Array.from({ length: 8 }, (_, index) => (
            <div className="card" key={index}>
              <Skeleton className={styles.skeletonProductImage} />
              <Skeleton className={styles.skeletonHeadingShort} />
              <Skeleton className={styles.skeletonText} />
            </div>
          ))}
        </div>
      </section>
      <aside className={`card ${styles.cashierCart}`} aria-hidden="true">
        <Skeleton className={styles.skeletonHeading} />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className={styles.skeletonCartRow} key={index} />
        ))}
        <Skeleton className={styles.skeletonButton} />
      </aside>
    </main>
  );
}
