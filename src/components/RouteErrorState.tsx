"use client";

import { useTransition } from "react";
import { Feedback } from "@/components/Feedback";
import { PendingButtonContent } from "@/components/PendingButtonContent";
import styles from "./ui.module.css";

export function RouteErrorState({
  title,
  message,
  retry,
  fullPage = false,
}: {
  title: string;
  message: string;
  retry: () => void;
  fullPage?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const Container = fullPage ? "main" : "section";

  return (
    <Container className={fullPage ? styles.errorPage : styles.errorSection}>
      <div className={`card ${styles.errorCard}`}>
        <h1>{title}</h1>
        <Feedback tone="error" message={message} />
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending}
          aria-busy={pending}
          onClick={() => startTransition(retry)}
        >
          <PendingButtonContent pending={pending} pendingLabel="Mencoba kembali...">
            Coba lagi
          </PendingButtonContent>
        </button>
      </div>
    </Container>
  );
}
