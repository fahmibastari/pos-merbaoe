import Image from "next/image";
import LogoutButton from "@/app/login/LogoutButton";
import CashierNav from "./CashierNav";
import styles from "./CashierHeader.module.css";

type CashierSection = "pos" | "history" | "stock" | "shift";

export default function CashierHeader({
  title,
  description,
  current,
  role,
}: {
  title: string;
  description: string;
  current: CashierSection;
  role: "admin" | "kasir";
}) {
  return (
    <header className={styles.header}>
      <Image
        src="/Logo-Horizontal.png"
        alt="Kopi Merbaoe"
        width={1477}
        height={230}
        loading="eager"
        className={styles.logo}
      />
      <div className={styles.copy}>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className={styles.actions}>
        <CashierNav current={current} role={role} />
        <LogoutButton className="btn btn-secondary btn-sm" />
      </div>
    </header>
  );
}
