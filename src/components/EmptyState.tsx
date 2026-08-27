import type { ReactNode } from "react";
import { Icon } from "./Icon";
import styles from "./ui.module.css";

export function EmptyState({
  title,
  description,
  action,
  icon = <Icon name="tray" size={24} />,
}: {
  title: string;
  description: string;
  action: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyStateIcon} aria-hidden="true">
        {icon}
      </span>
      <p className={styles.emptyStateTitle}>{title}</p>
      <p className={styles.emptyStateDescription}>{description}</p>
      <div className={styles.emptyStateAction}>{action}</div>
    </div>
  );
}
