import type { ReactNode } from "react";
import type { ActionResult } from "@/lib/action-result";
import styles from "./ui.module.css";

type Result = ActionResult<unknown> | null;
type Tone = "error" | "success" | "info";

export function getFieldMessages(result: Result, name: string) {
  if (!result || result.ok || !result.fieldErrors) return [];

  const exact = result.fieldErrors[name];
  if (exact) return exact;

  return Object.entries(result.fieldErrors)
    .filter(
      ([key]) => key.startsWith(`${name}.`) || name.startsWith(`${key}.`),
    )
    .flatMap(([, messages]) => messages);
}

function getSuccessMessage(result: Result) {
  if (!result?.ok || typeof result.data !== "object" || !result.data) {
    return undefined;
  }

  if (!("message" in result.data)) return undefined;
  return typeof result.data.message === "string"
    ? result.data.message
    : undefined;
}

export function Feedback({
  result,
  tone,
  title,
  message,
  successMessage,
  children,
  compact = false,
  id,
}: {
  result?: Result;
  tone?: Tone;
  title?: string;
  message?: string | null;
  successMessage?: string;
  children?: ReactNode;
  compact?: boolean;
  id?: string;
}) {
  const resolvedTone = tone ?? (result?.ok ? "success" : "error");
  const resolvedMessage = result
    ? result.ok
      ? successMessage ?? getSuccessMessage(result)
      : result.error
    : message;

  if (!title && !resolvedMessage && !children) return null;

  const toneClass =
    resolvedTone === "success"
      ? styles.feedbackSuccess
      : resolvedTone === "info"
        ? styles.feedbackInfo
        : styles.feedbackError;

  return (
    <div
      id={id}
      role={resolvedTone === "error" ? "alert" : "status"}
      aria-live={resolvedTone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      className={`${styles.feedback} ${toneClass} ${compact ? styles.feedbackCompact : ""}`.trim()}
    >
      {title && <span className={styles.feedbackTitle}>{title}</span>}
      {resolvedMessage && <p className={styles.feedbackBody}>{resolvedMessage}</p>}
      {children}
    </div>
  );
}
