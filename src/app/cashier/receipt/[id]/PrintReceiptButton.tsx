"use client";

export function PrintReceiptButton() {
  return (
    <button
      type="button"
      className="btn btn-primary"
      onClick={() => window.print()}
    >
      Cetak Struk
    </button>
  );
}
