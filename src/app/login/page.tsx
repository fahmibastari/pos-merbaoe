import type { Metadata } from "next";
import Image from "next/image";
import LoginForm from "./LoginForm";
import styles from "./login.module.css";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.brandPanel} aria-labelledby="login-brand-title">
        <Image
          src="/Logo-Vertikal.png"
          alt="Kopi Merbaoe"
          width={950}
          height={516}
          priority
          className={styles.logo}
        />
        <div className={styles.brandCopy}>
          <div className={styles.rule} aria-hidden="true" />
          <h1 id="login-brand-title">Kasir dan buku usaha dalam satu alur.</h1>
          <p>
            Kelola transaksi, bahan baku, biaya, dan laba dengan catatan yang tetap
            dapat ditelusuri.
          </p>
        </div>
      </section>

      <section className={styles.formPanel} aria-labelledby="login-form-title">
        <div className={styles.formWrap}>
          <header className={styles.formIntro}>
            <h2 id="login-form-title">Masuk ke Merbaoe POS</h2>
            <p>Gunakan akun operasional yang diberikan administrator.</p>
          </header>
          <div className={styles.loginCard}><LoginForm /></div>
          <p className={styles.footer}>Kafe Kopi Merbaoe · {new Date().getFullYear()}</p>
        </div>
      </section>
    </main>
  );
}
