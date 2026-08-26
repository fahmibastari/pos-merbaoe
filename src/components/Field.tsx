import { cloneElement, useId, type ReactElement } from "react";
import type { ActionResult } from "@/lib/action-result";
import { Feedback, getFieldMessages } from "./Feedback";
import styles from "./ui.module.css";

type ControlProps = {
  id?: string;
  name?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export function Field({
  label,
  name,
  errorName = name,
  result,
  control,
  id,
  hint,
  className = "",
}: {
  label: string;
  name: string;
  errorName?: string;
  result?: ActionResult<unknown> | null;
  control: ReactElement<ControlProps>;
  id?: string;
  hint?: string;
  className?: string;
}) {
  const generatedId = useId();
  const controlId = id ?? control.props.id ?? `field-${generatedId}`;
  const errorId = `${controlId}-error`;
  const hintId = `${controlId}-hint`;
  const messages = getFieldMessages(result ?? null, errorName);
  const describedBy = [
    control.props["aria-describedby"],
    hint ? hintId : undefined,
    messages.length > 0 ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`${styles.field} ${className}`.trim()}>
      <label className="label" htmlFor={controlId}>
        {label}
      </label>
      {cloneElement(control, {
        id: controlId,
        name,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": messages.length > 0 || undefined,
      })}
      {hint && (
        <p id={hintId} className={styles.fieldHint}>
          {hint}
        </p>
      )}
      <Feedback
        id={errorId}
        tone="error"
        message={messages.join(" ")}
        compact
      />
    </div>
  );
}
