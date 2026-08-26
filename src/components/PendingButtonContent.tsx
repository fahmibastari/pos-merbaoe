export function PendingButtonContent({
  pending,
  children,
  pendingLabel,
}: {
  pending: boolean;
  children: React.ReactNode;
  pendingLabel: string;
}) {
  if (!pending) return children;

  return (
    <>
      <span className="spinner" aria-hidden="true" />
      <span className="sr-only">{pendingLabel}</span>
    </>
  );
}
